---
title: "A second brain for the newsroom"
date: "2026-08-07T10:00:00.000Z"
description: "A national news outlet where staff ask, in plain language, what the institution already knows. Over a decade of articles and every desk's operating knowledge, in one place that answers with a citation."
tags: ["Second brain","RAG"]
private: true
---

A beat reporter retires on a Friday. On Monday, over a decade of context is gone: which official talks off the record, which claim blew up years back, why the outlet stopped covering a story a certain way. Nobody wrote it down, because it lived in one head. A national news outlet, over a decade old and 500,000+ published articles deep, was losing this every time someone resigned.

I designed and built its second brain: one place where any staffer asks a question in plain language and gets an answer grounded in a citation, across two layers. An internal operational brain, so the institution's knowledge survives the people who hold it. And an external layer, the published archive made queryable.

**The newsroom is no longer hostage to what lives in one person's head.**

## The knowledge that walks out the door is the expensive kind

Every desk ran on undocumented memory. Business development knew which deals had been tried. Editorial knew the history of a beat. Video and social knew what worked and what got pulled. IT knew why a fragile process was fragile. None of it was searchable. The cost showed up twice: onboarding a new hire took weeks of asking around, and when a senior person left, their context left with them for good.

The opinion this whole project rests on: institutional knowledge is only safe once it is data. A wiki nobody queries, a Slack nobody greps, a folder of PDFs is not captured knowledge. It is captured only when a machine can retrieve it, filter it, and cite it on demand. Everything below is in service of turning memory into rows.

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

One row carries both the vector and the full-text index, so a chunk is retrievable two ways without a second store to keep in sync. The opinion here: do not split your semantic index and your keyword index across two systems. They drift, and a drifted index is worse than none.

**One pipeline, two layers, same row shape: the archive and the newsroom's private memory are one searchable surface.**

## Retrieval is hybrid, because names and meaning are different searches

Ask "what did we publish on this politician" and you need meaning. Ask for an exact name, a case number, a place spelled three ways, and a vector blurs it. So retrieval runs both and fuses the ranks.

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
            scores[hit.id] += 1.0 / (k_const + rank)   # rank, not raw score, so scales combine
    return sorted(scores.items(), key=lambda x: -x[1])
```

The multilingual embedding model is load-bearing: a question in one language has to find a source written in another, which is the daily reality of this newsroom. Reciprocal rank fusion is the boring right answer for combining the two arms, because it fuses ranks, not raw scores, so a cosine similarity and a full-text score never fight over units.

> War story. Early on, fusion by normalized raw score let one strong full-text hit dominate every answer, because full-text scores and cosine scores live on different scales and my min-max normalization was per-query. Switching to rank-based RRF killed it in one commit. If you are averaging scores from two different retrievers, you are averaging apples and volts.

## Entity resolution is the spine that makes over a decade feel like one memory

A person, a party, a topic, or a policy is named a hundred different ways across over a decade and five desks: a full name, a title, an initialism, a nickname, a misspelling. Without resolution, the archive is over a decade of disconnected fragments. So I built a spine: one canonical entity, many surface forms, and every chunk links to the canonical ids it mentions.

```python
# The spine: collapse many surface forms into one canonical entity.
def link(mention, context_vec):
    cand = spine.match(
        normalized=normalize(mention.text),   # casefold, strip titles, alias table
        vector=context_vec,                   # catches "the premier" == the named person
    )
    if cand and cand.score >= 0.86:           # tuned for precision, not recall
        return cand.entity_id
    return spine.create(mention)              # a new canonical node
```

That is what turns "search" into "memory": a backbencher mentioned early in the archive links to the same person's appointment years later and their statement last week, so a query on the person pulls every mention, not just the ones that share your keywords.

> War story. The threshold started at 0.72 and the spine merged two different people who shared a common surname into one entity, so a query on one returned the other's history. I moved the threshold to 0.86 and made merges precision-first: it is cheap to merge two nodes later when a human confirms a duplicate, and expensive to un-merge a wrong link that already polluted answers. In entity resolution, a false merge is the one that hurts.

## Access is enforced in the query, not in the UI

Not every staffer should see every desk's notes. Access is a filter pushed into both retrieval arms, so a restricted passage is never even a candidate for grounding.

```python
def access_filter(desks_allowed):
    # the public archive is readable by all; desk notes only by cleared desks
    return {"$or": [
        {"layer": "archive"},
        {"layer": "desk", "desk": {"$in": desks_allowed or []}},
    ]}
```

The opinion: access control that lives above retrieval is theater. If a restricted chunk can be retrieved and only hidden at display time, it has already left the vault, and one prompt or one logging line leaks it.

> War story. The first version answered too well. It happily pulled internal desk notes into answers for anyone who asked, because access was a filter on the display, not on retrieval. The fix was to push the check down into the query filter above, so restricted passages are never candidates. Access at the edge looks fine in a demo and leaks in production.

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
        temperature=0.1,                     # the job is to quote, not to write
    )
```

Low temperature on purpose: the agent's job is to be a faithful librarian, not a stylist. The citation is not decoration, it is the trust contract. A staffer can click through to the 2019 article or the desk note and see the source with their own eyes, which is the only reason anyone in a newsroom will trust a machine over a colleague.

```text
"who covered the port privatisation beat in 2019?"
  -> hybrid retrieval over articles + desk notes (access-filtered)
  -> entity resolution links the beat, the desk, the bylines
  -> grounded answer, cited [article-id] per byline
```

**Answers in seconds across 500,000+ articles and over a decade of desk knowledge, every claim clickable back to its source.**

## The honest limit: it captures what was written, not what was never said

The second brain is only as deep as what the institution actually recorded. It captures process docs, published work, and the desk knowledge people took the time to write down. The truly tacit knowledge, the instinct a reporter never articulated, still leaves with them. What changed is that far more is now capturable and findable, and there is finally a place worth writing it down into. Which loops back to the one opinion under all of this: knowledge is safe only once it is data, and this is the machine that makes writing it down worth the effort.

## Who has this problem

Any institution where the knowledge lives in senior heads and leaves when they do: hospitals, law firms, agencies, engineering teams, public bodies. The test is one question. When your most experienced person resigns, how much of what they knew can anyone else still find? If the answer is "not much", you do not have a documentation problem. You have an unbuilt second brain.
