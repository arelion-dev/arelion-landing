---
title: "The archive that became a product"
date: "2026-08-07T10:00:00.000Z"
description: "A national news outlet had over a decade and 500,000 articles doing nothing. I built the machinery that turns that dead archive into a monitored, sellable intelligence product line."
tags: ["Tech", "AI"]
private: true
---

Over a decade of national coverage, sitting as dead weight. Not "dead" as a figure of speech: most of the tags were used on exactly one article, tens of thousands of articles carried no tag at all, and "related articles" returned noise. The client, a national news outlet, held the national political record since launch in one place and could not ask it a single question.

I designed, led and built the machinery that turns that dead archive into a queryable record of national politics, then into intelligence products a company pays for. The interesting work is not "call an LLM on each article." It is making the answers trustworthy at archive scale and keeping them current forever. So I will cover both: the three layers I built, with the code that carries the weight, and the commercial logic they exist to serve.

**500,000+ articles. Over a decade. One record you can finally question.**

## An archive that size is a dataset, not content

A pile of articles has readers. A dataset about a country's politics has buyers who never read a word of it: lobbyists, compliance teams, embassies, investors. Full-text search over the raw archive does not get you there, and this is the opinion the whole project rests on: search finds documents, buyers need entities. "Show me the article that mentions this minister" is a search problem. "Show me every position this person has held and every stance they have taken on this policy, across every name they have gone by" is a data-model problem. You cannot grep your way to the second one. You have to extract structure first.

## Layer 1: the spine, prose becomes a record

I ran the full archive through an extraction pipeline built on Postgres and an LLM extractor with structured output. Every article is passed through one schema. The schema is the product: if a field is not in it, no buyer can ever query it.

```python
# illustrative: the extraction contract every article is passed through
class Statement(BaseModel):
    speaker_surface: str          # raw name as printed, resolved later
    party: str | None
    role: str | None              # "backbencher", "minister of X"
    topic: str                    # normalized against a controlled list
    claim: str                    # one sentence, extractive only
    claim_span: tuple[int, int]   # char offsets into the source article
    stance: Literal["for", "against", "neutral"]

class ArticleExtraction(BaseModel):
    article_id: str
    published_at: date
    statements: list[Statement]
```

The extractor runs against that model with structured output, so the LLM cannot return a shape the pipeline does not expect. One rule earned its place fast: the claim must be extractive, and `claim_span` must point at real characters in the source. Anything the model cannot ground in a span is dropped before it ever reaches the database. That single guard is the difference between a dataset a compliance team will pay for and a plausible-sounding fabrication engine.

**One schema. Every article. If it is not a field, no one can sell it.**

Then entity resolution, the part nobody demos and everybody needs. `speaker_surface` is a mess: "J. Smith", "Jamal Smith", "Minister Smith", "the Honourable member for the north district" all point at one person across years. I resolve them into a stable `person_id` with a cheap-to-expensive cascade, not one big model call.

```python
# illustrative: resolve a raw surface name to a canonical person
def resolve(surface: str, context: str) -> int:
    # 1. blocking: pg_trgm narrows 100k people to a handful of candidates
    candidates = db.query("""
        SELECT person_id, canonical_name, aliases
        FROM person
        WHERE canonical_name %% :s          -- trigram similarity
        ORDER BY similarity(canonical_name, :s) DESC
        LIMIT 20
    """, s=surface)

    # 2. rank candidates by embedding of the surrounding context (pgvector)
    ctx_vec = embed(context)
    ranked = rank_by_cosine(candidates, ctx_vec)

    # 3. only the ambiguous top-2 go to the LLM to adjudicate
    if ranked and ranked[0].margin > 0.15:
        return ranked[0].person_id            # confident, no LLM call
    return llm_adjudicate(surface, context, ranked[:2])
```

The cascade matters for cost, not elegance. Blocking with `pg_trgm` throws away 99% of the graph before any vector math. Embeddings over the surrounding sentence break the ties that surface names alone cannot (two people share a common name, context tells them apart). Only genuine ambiguity reaches an LLM call. Run this over a whole archive and the ordering is the entire budget.

> **War story.** The first resolver was embeddings-only, no blocking, no deterministic guard. It merged two different politicians who shared a common family name into one `person_id`, and quietly attributed one man's votes to the other. Cosine similarity was 0.94: the contexts were both "parliament, budget debate." The fix was not a better model. It was a hard guard (never merge across two people who held the same seat in the same term) plus blocking so the candidate set is small enough to eyeball. Entity resolution fails silently, so it needs guards that fail loud.

The payoff is the query the whole product is sold on. A sentence about a backbencher early in the archive becomes a row connected to that person's ministerial appointment years later and their statement last week, all under one `person_id`, all cited back to source.

```sql
-- "everything this person said about this policy, since launch"
SELECT s.published_at, s.stance, s.claim, s.article_id
FROM statement s
JOIN person p     ON p.person_id = s.person_id
JOIN alias a      ON a.person_id = p.person_id
WHERE a.surface ILIKE :name          -- matches any name they went by
  AND s.topic    = :policy
ORDER BY s.published_at;
-- returns the full arc, each row clickable back to the source article
```

**Half a day of manual digging, now under a second, with a citation per row.**

## Layer 2: monitoring keeps it current without headcount

The spine is not a one-off export. Every article the newsroom publishes lands in a Postgres work queue and flows through the exact same extraction and resolution path. I pull work with `FOR UPDATE SKIP LOCKED` so I can run many workers with no double processing and no external broker.

```sql
-- illustrative: one worker claims a batch, others skip locked rows
UPDATE ingest_queue
SET status = 'processing', worker = :id
WHERE article_id IN (
    SELECT article_id FROM ingest_queue
    WHERE status = 'pending'
    ORDER BY published_at
    FOR UPDATE SKIP LOCKED
    LIMIT 20
)
RETURNING article_id;
```

Reprocessing is idempotent on `article_id`, which mattered more than I expected: when I improved the extraction schema, I replayed the whole archive through the same queue without a separate backfill script. New articles and a re-run of the past are the same code path. The dataset stays current with zero data entry.

The tags problem died as a side effect. Tagging stopped being a human chore and became an output of the same pipeline, and the normalized `topic` field repaired "related articles" for ordinary readers at the same time. Fixing the data model fixed the reader-facing feature for free, which is the tell that you fixed the right layer.

**Tens of thousands of untagged articles, resolved by the same pipeline that feeds the product.**

## Layer 3: the analyst drafts, and every draft cites its source

On top of the spine, the system drafts. A weekly political tracker. Regulatory monitoring on what is changing and who is pushing it. Sector briefings. Election intelligence that fuses the historical record with live tracking. Plus an internal competitor monitor the newsroom keeps for itself.

Every draft is assembled from statement rows, so every sentence carries the `article_id` it came from and renders as a citation. This is junior-analyst work, research and structuring and first prose, which is exactly what the machine does well. The opinion here is unfashionable: the LLM should never be the source of a fact in this product, only the writer of prose over facts the database already holds. What ships is not what the machine wrote. The newsroom's political journalists, who understand this record better than any junior analyst could, validate, cut, and add the judgement. The AI does the legwork at a scale you could never staff. The people do the part clients actually trust.

## The commercial logic came first, not the AI

The engineering exists to serve a model that is public and proven. Politico Pro took a beat a newsroom already covered and sold it to the people whose job depends on it. Today it is roughly half of Politico's revenue, at an average contract around $15,000 a year, with renewal around 90%. The Economist Intelligence Unit runs on the same logic.

**~$15,000 average contract, ~90% renewal, ~half of revenue. The model is documented, not a bet.**

The mechanism is simple. Someone whose job depends on your information pays many times what a reader pays, and pays it from a company budget. My client's version sells to the same corporate and government buyers it already knows from advertising, on a different budget line, at a margin a campaign cannot approach.

## The honest limit: this market is not Washington

One limit belongs here, because I put it in the proposal. This outlet's capital is not Washington. Politico Pro sells into the densest lobbying market on earth, and how many seats at that kind of price the local market supports is a commercial question the client reads far better than I can.

What I can say is narrower and more defensible. The raw material exists. The machinery now exists, and it is boring, inspectable Postgres plus a schema, not a black box. The model is proven elsewhere. The buyers already spend with this outlet on a different budget line.

## Who has this problem

Anyone who has spent years producing something proprietary, coverage, rulings, filings, market data, member records, technical documentation, is probably monetising it once, at creation, and never again. The archive earns nothing because nobody can ask it anything.

The fix is not a better CMS, and it is not "put an LLM on it" either. It is three things in order: structure, so the corpus can be asked questions and every answer cites a row; monitoring, so it stays current without headcount; and drafting with human sign-off, so the output carries your credibility and not a chatbot's. The test is one question. Is there someone whose job depends on what you know, with a company budget behind them? If yes, your archive is not a storage cost. It is an unlaunched product.
