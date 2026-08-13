---
title: "The archive that became a product"
date: "2026-02-12T11:15:00.000Z"
description: "A dead news archive is a dataset with buyers who never read it. I built the machinery that turns 500,000+ articles into a queryable, sellable intelligence product line."
tags: ["Tech", "AI"]
private: true
---

You can turn a dead news archive into an intelligence product that sells. My client, a national news outlet, had kept the country's whole political record in one place since launch, and couldn't put a single question to it. 500,000+ articles over a decade. Most tags sat on exactly one article, tens of thousands carried none at all, and "related articles" returned noise.

I built the machinery that turns that archive into a queryable record of national politics, then into intelligence products a company pays for. Running an LLM over each article is the easy part. The work is making the answers trustworthy at the scale of the whole archive, and keeping them current for good. This piece covers both sides: the three layers with the code that does the real work, and the commercial logic they serve.

**500,000+ articles across more than a decade, now a single record you can question.**

## An archive that size is a dataset

A pile of articles gets you readers. A dataset about a country's politics sells to people who never read a word of it: lobbyists, compliance teams, embassies, investors.

Full-text search over the raw archive won't get you there, and the whole project rests on that opinion. Search returns documents; a buyer wants entities. "Show me the article that mentions this minister" is a search problem. "Show me every position this person has held and every stance they've taken on this policy, across every name they've gone by" is a data-model problem, and you can't grep your way to it. You extract the structure first.

## Layer 1: the spine, prose becomes a record

I ran the full archive through an extraction pipeline built on Postgres, with an LLM extractor that returns structured output. Every article goes through one schema, and that schema is the product. If the schema lacks a field, no buyer can ever query it.

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

The extractor runs against that model, so the LLM can't hand back a shape the pipeline doesn't expect.

One rule earned its place fast: the claim has to be extractive, and `claim_span` has to point at real characters in the source. Anything the model can't ground in a span gets dropped before it reaches the database. That guard is what separates a dataset a compliance team will pay for from plausible-sounding fabrication.

**One schema over every article, and that schema defines everything a buyer can ever query.**

Then comes entity resolution, the part nobody demos and everybody needs. `speaker_surface` is a mess. "J. Smith", "Jamal Smith", "Minister Smith", and "the Honourable member for the north district" all point at one person across a span of years. I resolve them to a stable `person_id` with a cascade that runs cheap steps before expensive ones, rather than one big model call.

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

The cascade is about cost. Blocking with `pg_trgm` throws away almost the whole graph before any vector math happens. Embeddings over the surrounding sentence break ties that surface names can't: when two people share a family name, the context tells them apart. Only real ambiguity ever reaches an LLM call, and across a whole archive that ordering is the entire budget.

> **War story.** An embeddings-only resolver merged two politicians who shared a family name into one `person_id`, at cosine 0.94 because both contexts were "parliament, budget debate", and quietly attributed one man's votes to the other. The fix was a hard guard (never merge two people who held the same seat in the same term) plus `pg_trgm` blocking, so the candidate set stays small enough to eyeball.

The payoff is the one query the whole product is sold on. A throwaway sentence about a backbencher early in the archive becomes a row, linked to that person's ministerial appointment years later and to what they said last week, all under a single `person_id`, all cited back to the source.

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

The spine is more than a one-off export. Every article the newsroom publishes lands in a Postgres work queue and runs through the exact same extraction and resolution path. I pull work with `FOR UPDATE SKIP LOCKED`, which lets me run a lot of workers at once with no double processing and no external broker to babysit.

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

Reprocessing is idempotent on `article_id`, which mattered more than I expected. When I improved the extraction schema, I replayed the entire archive through the same queue and never wrote a separate backfill script. New articles and a re-run of the past share one code path, so the dataset stays current with zero data entry.

The tags problem died as a side effect. Tagging became an output of the pipeline, and the normalized `topic` field repaired "related articles" for ordinary readers along the way. Fixing the data model fixed the reader-facing feature for free.

**Tens of thousands of untagged articles, resolved by the same pipeline that feeds the product.**

## Layer 3: the analyst drafts, and every draft cites its source

On top of the spine, the system drafts. It produces a weekly political tracker, regulatory monitoring on what's changing and who's pushing it, sector briefings, and election intelligence that fuses the historical record with live tracking. The newsroom also keeps an internal competitor monitor for itself.

Every draft is assembled out of statement rows, so each sentence carries the `article_id` it came from and renders as a citation.

This is junior-analyst work: the research and the structuring, then a first pass of prose. My take here is unfashionable. The LLM only writes prose over facts the database already holds, and it's never the source of a fact in this product.

What ships is never quite what the machine wrote. The newsroom's political journalists understand this record better than any junior analyst could. They validate and cut it, then add the judgement clients pay for. The machine does the legwork at a scale nobody could ever staff, and the people supply the part clients trust.

## The commercial logic came first

The engineering serves a business model that's public and proven. Politico Pro took a beat a newsroom already covered and sold it to the people whose careers depend on it. That product is roughly half of Politico's revenue today, at an average contract around $15,000 a year and renewal near 90%. The Economist Intelligence Unit runs on the same logic.

**~$15,000 average contract, ~90% renewal, ~half of revenue: the model is documented and proven.**

The mechanism is simple. Someone whose job depends on your information will pay many times what a reader pays, and they pay it out of a company budget. My client's version sells to the same corporate and government buyers it already knows from advertising, on a different budget line, at a margin no ad campaign can come near.

To be exact about my own role: I build the tech layer that turns the archive into something sellable. I don't run ad monetization, header bidding or yield, and I don't touch the commercial setup. The client's commercial team sells the product I hand over.

## The honest limit: I can't size this market

One limit belongs here, because I put it in the proposal. Politico Pro sells into the densest lobbying market on earth. My client's market is a different one, and how many seats it supports at that kind of price is a commercial question the client reads far better than I can.

What I can say is narrower, and it holds. The raw material is there. The machinery is there too now, and it's boring, inspectable Postgres plus a schema. The model is proven elsewhere, and the buyers already spend money with this outlet, just on a different budget line.

## Who has this problem

Anyone who has spent years producing something proprietary (coverage, rulings, filings, market data, member records, technical documentation) is probably monetizing it once, at creation, and never again. The archive earns nothing because nobody can ask it anything.

A better CMS doesn't fix this, and neither does "put an LLM on it". The fix has three parts, and the order matters. First structure, so the corpus can be questioned and every answer cites a row. Then monitoring, so it stays current without headcount. Then drafting with human sign-off, so the output carries your credibility.

It comes down to one question. Is there someone whose job depends on what you know, with a company budget behind them? If yes, your archive is a product you haven't launched yet.
