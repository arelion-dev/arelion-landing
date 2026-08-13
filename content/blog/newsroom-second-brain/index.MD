---
title: "A second brain for the newsroom"
date: "2026-07-16T15:20:00.000Z"
description: "A national news outlet where staff ask, in plain language, what the institution already knows. Over a decade of articles and every desk's operating knowledge, in one place that answers with a citation."
tags: ["Second brain","RAG"]
private: true
---

Any staffer at this national news outlet can ask a question in plain language and get an answer grounded in a citation, drawn from a decade-old archive of 500,000+ articles and from every desk's private operating knowledge. I built the second brain that does it: one store, hybrid retrieval, entity resolution across the whole archive, and access control pushed down into the query so a restricted note is never even a candidate.

It spans two layers. One is an internal operational brain, so the institution's knowledge outlives the people who hold it. The other opens the published archive and makes it queryable.

**The newsroom is no longer hostage to what lives in one person's head.**

## The knowledge that walks out the door is the expensive kind

Every desk ran on undocumented memory. Business development knew which deals had been tried, editorial knew the history of a beat, video and social knew what had worked and what got pulled, and IT knew why a fragile process was fragile. None of it was searchable. Onboarding a new hire meant weeks of asking around, and when a senior person quit, their context walked out with them for good.

The opinion this project rests on: institutional knowledge is only safe once it's data. A wiki nobody opens, or a shared drive full of PDFs, doesn't count as captured knowledge. It counts as captured the day a machine can retrieve it, filter it by who's cleared to see it, and cite it on demand. Everything below turns memory into rows.

**Onboarding a new hire dropped from weeks to days.**

## One store, two layers, ingested the same way

I built a single plain-language interface over two bodies of knowledge, so a staffer never has to know where an answer lives. Both layers land in the same store through the same pipeline. Only the metadata differs.

- The **internal operational brain**, built day one: process docs, desk notes, and institutional memory across business development, editorial, video, social, and IT.
- The **external layer**: the full published archive, 500,000+ articles, made queryable across over a decade.

```python
def ingest(source):
    for doc in source.documents():          # a published article OR a desk note
        chunks = chunk(doc.body, target_tokens=800, overlap=120)
        vectors = embed([c.text for c in chunks])   # multilingual model, one shared space
        for c, vec in zip(chunks, vectors):
            store.upsert(
                id=f"{doc.id}:{c.index}",
                text=c.text,
                embedding=vec,               # for semantic search
                tsv=to_tsvector(c.text),     # for full-text search, same row
                layer=source.layer,          # "archive" | "desk"
                desk=doc.desk,               # None for the public archive
                published_at=doc.published_at,
                entity_ids=[],               # filled by the spine, next section
            )
```

One row carries both the vector and the full-text index, so a chunk is retrievable two ways with no second store to keep in sync. Don't split your semantic index and your keyword index across two systems. They drift, and a drifted index is worse than none at all.

**One pipeline, two layers, same row shape: the archive and the newsroom's private memory are one searchable surface.**

## Retrieval is hybrid, because names and meaning are different searches

Ask "what did we publish on this politician" and you need meaning. Ask for an exact name, a case number, a place spelled three ways, and a vector blurs it. So retrieval runs both arms and fuses the ranks.

```python
def search(query, k=20, desks_allowed=None):
    flt = access_filter(desks_allowed)                 # see below, enforced in both arms
    q_vec = embed([query])[0]
    semantic = store.knn(q_vec, k=k, filter=flt)       # multilingual vectors
    lexical  = store.fts(query, k=k, filter=flt)       # Postgres full-text, BM25-style
    return rrf(semantic, lexical, k_const=60)          # reciprocal rank fusion

def rrf(*ranked_lists, k_const):
    scores = defaultdict(float)
    for lst in ranked_lists:
        for rank, hit in enumerate(lst):
            scores[hit.id] += 1.0 / (k_const + rank)   # use rank rather than raw score, so scales combine
    return sorted(scores.items(), key=lambda x: -x[1])
```

The multilingual embedding model is what makes this work: a question in one language has to find a source written in another, which is the daily reality of this newsroom. Reciprocal rank fusion is the boring right answer for combining the two arms. It fuses ranks rather than raw scores, so a cosine similarity and a full-text score never fight over units.

> War story. Fusing by normalized raw score let one strong full-text hit dominate every answer, because full-text and cosine scores live on different scales and my min-max normalization was per-query. Switching to rank-based RRF fixed it in one commit: if you average scores from two different retrievers, you're averaging apples and volts.

## Entity resolution is the spine that makes over a decade feel like one memory

A person, a party, a topic, or a policy is named a hundred different ways across over a decade and five desks: a full name, a title, an initialism, a nickname, a misspelling. Without resolution, all that history is disconnected fragments. So I built a spine: one canonical entity, many surface forms, and every chunk links to the canonical ids it mentions.

```python
# The spine: collapse many surface forms into one canonical entity.
def link(mention, context_vec):
    cand = spine.match(
        normalized=normalize(mention.text),   # casefold, strip titles, alias table
        vector=context_vec,                   # catches "the premier" == the named person
    )
    if cand and cand.score >= 0.86:           # tuned for precision over recall
        return cand.entity_id
    return spine.create(mention)              # a new canonical node
```

That's what turns "search" into "memory". A backbencher mentioned early in the archive links to the same person's appointment years later, and to their statement last week. A query on the person pulls every mention, including the ones that share none of your keywords.

> War story. The threshold started at 0.72 and the spine merged two different people who shared a common surname into one entity, so a query on one returned the other's history. I moved it to 0.86 and made merges precision-first: merging two nodes later when a human confirms a duplicate is cheap, and un-merging a wrong link that already polluted answers is expensive. In entity resolution, a false merge is the one that hurts.

## Access is enforced inside the query

Not every staffer should see every desk's notes. Access is a filter pushed into both retrieval arms, so a restricted passage is never even a candidate for grounding.

```python
def access_filter(desks_allowed):
    # the public archive is readable by all; desk notes only by cleared desks
    return {"$or": [
        {"layer": "archive"},
        {"layer": "desk", "desk": {"$in": desks_allowed or []}},
    ]}
```

Access control that lives above retrieval is theater. If a restricted chunk can be retrieved and merely hidden at display time, it has already left the vault, and one prompt or a stray log line leaks it.

> War story. The first version answered too well: it pulled internal desk notes into answers for anyone who asked, because access was a filter on the display instead of the query. Pushing the check down into the query filter fixed it, so restricted passages are never candidates. Access at the edge looks fine in a demo and leaks in production.

## The Gemini agent answers with a citation or says it found nothing

The last mile is a Gemini agent that reads only the retrieved passages, quotes them, and tags each claim with its source id. If retrieval comes back empty, it says so instead of inventing.

```python
SYSTEM = (
    "Answer only from the passages provided. "
    "After each claim, cite its source id as [id]. "
    "If the passages do not answer the question, say you found nothing. "
    "Never use outside knowledge."
)

def answer(question, desks_allowed):
    passages = search(question, k=20, desks_allowed=desks_allowed)
    if not passages:
        return "I found nothing on this in what you can access."
    prompt = render(question, passages)      # each passage prefixed with [its id]
    return gemini.generate(
        system=SYSTEM,
        contents=prompt,
        temperature=0.1,                     # the job is to quote rather than write
    )
```

Low temperature on purpose. The agent's one job is to quote its sources faithfully, like a librarian; style is beside the point. The citation is the trust contract. A staffer clicks through to the old article or the desk note and sees the source with their own eyes, which is the only reason anyone in a newsroom trusts a machine over a colleague.

```text
"who covered the port privatisation beat in 2019?"
  -> hybrid retrieval over articles + desk notes (access-filtered)
  -> entity resolution links the beat, the desk, the bylines
  -> grounded answer, cited [article-id] per byline
```

**Answers in seconds across 500,000+ articles and over a decade of desk knowledge, every claim clickable back to its source.**

## The honest limit: it only captures what was written down

The second brain is only as deep as what the institution actually recorded. It captures process docs, published work, and the desk knowledge people took the time to write down. The truly tacit knowledge, the instinct a reporter never put into words, still leaves with them.

What changed is that far more is now capturable and findable, and there's finally a place worth writing it into. Which loops back to the premise: knowledge is safe only once it's data, and this is the machine that makes writing it down worth the effort.

## Who has this problem

Any institution where the knowledge lives in senior heads and leaves when they do: hospitals, law firms, agencies, engineering teams, public bodies. The test is one question. When your most experienced person resigns, how much of what they knew can anyone else still find? If the answer is "not much", documentation was never the real gap. You needed a second brain, and no one built it.
