---
title: "Document intelligence at scale"
date: "2026-06-18T10:40:00.000Z"
description: "Reading and searching 100M+ pages across thirty brands: native-text-first OCR, faithful tables, hybrid retrieval, and access control enforced inside the query."
tags: ["Tech", "AI"]
private: true
---

You can read and search 100 million pages faithfully, in under a second, without leaking a single document across a brand boundary. I built that engine for a global enterprise: thirty brands, decades of R&D, more than 100 million pages of research data, patents, contracts and regulatory dossiers across a dozen languages.

The problem it solves is concrete. A scientist needs one stability number from a 2009 study, in a scanned PDF, in a table on page 40, in French. She spends half a morning failing to find it, gives up, and reruns the study, so the company pays for that work twice. Now that number comes back in under a second, with a link straight to page 40.

**Search time dropped from ~30 minutes of hunting to under a second.**

A sibling piece covers the agent that refuses to half-answer a multi-part question. This one is the layer under it: reading 100 million pages faithfully, then searching them in under a second, with access control enforced inside the query. By the end you'll know why I read the page before I OCR it, why a table gets its own model, why the queue is a Postgres table, and why access control lives inside the vector query.

Note on code: this was proprietary client work, so I can't paste the repository. Every snippet below is a clean-room reconstruction of the technique, generic enough to run on its own and honest about the mechanism. None of it is verbatim client source.

## Reading is the hard part

A scanned PDF holds a picture of the text; the characters aren't there to read. A born-digital PDF already carries them in its content stream. Treat the two the same and you either burn money OCR-ing pages that never needed it, or you trust a garbage text layer and lose accuracy.

So the pipeline branches per page rather than per document. The same file can hold a crisp born-digital cover and a scanned appendix from 1998.

Call it native-first: read the page for free with PyMuPDF (fitz) when the embedded text is real, and pay for OCR only on the pages that lack it. The test itself is cheap. Pull the word boxes, then check two things: the page is upright, and it carries enough text to be a real layer rather than a stray watermark.

```python
import fitz  # PyMuPDF 1.24

def route_page(page: fitz.Page) -> tuple[str, int]:
    words = page.get_text("words")  # (x0,y0,x1,y1,text,block,line,word)
    text = "".join(w[4] for w in words)
    upright = page.rotation in (0, None)
    if upright and len(text.strip()) >= 40:
        # born-digital: lift the real text, zero OCR error, no render
        return text, 0
    # true scan: rasterize, then OCR. 300 DPI is the floor that keeps
    # 6pt sub/superscript in ingredient tables legible; 200 DPI drops them.
    pix = page.get_pixmap(dpi=300)
    return ocr(pix), 300
```

The 40-character threshold has a reason. Below it you're almost always looking at a page number or a stray Acrobat annotation, and the honest move is to treat the page as a scan. The DPI split matters more than it looks. Born-digital pages need no raster at all, and for real scans 300 DPI is the floor where a 6pt superscript in an ingredient table stays legible. At 200 DPI those characters melt, and a melted superscript in a concentration is a wrong answer.

At 100M+ pages, native-first decides whether the OCR bill is one you can pay or one you can't. Rendering and OCR-ing every page "to be safe" would have multiplied compute by roughly three, for zero accuracy gain on the two thirds of pages that already carried perfect text.

**Roughly two thirds of the corpus is born-digital, so most pages never touch OCR.**

Native-first over OCR-everything is the highest-leverage call in the whole pipeline, and most teams skip it because OCR-everything is one line of code and looks uniform. That uniform path costs three times the compute and buys nothing.

## Flattening a table destroys its meaning

Before reading a page, the pipeline works out its shape. A Docling layout model separates a title from a paragraph from a figure from a table. Each region then goes to the reader built for it: prose through Tesseract 5 (LSTM engine, per-region language hint), tables through TableFormer. TableFormer is the structure model that ships with Docling, and it rebuilds the real cell grid, rows by columns, spanning cells included.

The reason to spend a whole model on tables is that flattening destroys meaning. A single measurement lives at the intersection of a row and a column. Run plain OCR over it and you get a stream of numbers with the grid gone:

```
Component Concentration pH Stability
Compound A 0.3 5.5 24mo Compound B 4.0 6.0 36mo
```

Which number is the pH of the Compound A line? The model will guess, fluently, and be wrong. TableFormer keeps the geometry, so the same region comes back as structure you can trust:

```json
{
  "rows": [
    {"component": "Compound A",      "concentration": "0.3", "ph": "5.5", "stability_mo": 24},
    {"component": "Compound B",  "concentration": "4.0", "ph": "6.0", "stability_mo": 36}
  ]
}
```

A value read from the wrong row is worse than no answer, so I added a validation gate. A table that comes back malformed, say a hallucinated 200-column grid or a row count that doesn't match the detected cell boxes, gets dropped rather than trusted, and the rest of the document survives.

That's the honest tradeoff, and it costs recall. A few real, unusually wide tables (a 60-column regulatory matrix does exist) get thrown out with the bad ones. I chose precision, because a confident wrong concentration is the one failure this system can't ship. Revisiting it, I'd route the dropped wide tables to a slower vision model for a second opinion before discarding them.

Figures are described by Gemini 2.5 Flash, cheap and fast enough to run per-figure at corpus scale, so a mute chart becomes searchable text. Repeated images, brand logos and the same handful of hazard pictograms, are captioned once and keyed by content hash, so the caption is reused on every later hit.

```python
key = hashlib.sha256(image_bytes).hexdigest()
caption = cache.get(key) or cache.set(key, vlm_caption(image_bytes))
```

At corpus scale a logo appears on millions of pages. Captioning it once instead of millions of times keeps the figure-description bill a rounding error.

## The queue is the database

No Kafka, no Celery, no broker of any kind. A document is a row with a `status` column, and the state machine (`NEW` to `OCR_DONE` to `EMBEDDED` to `INDEXED`) is enforced by which query a worker runs. Workers claim work with one Postgres primitive, `FOR UPDATE SKIP LOCKED`:

```sql
-- one atomic claim: many workers, one table, never the same doc twice
UPDATE docs
SET status = 'EMBEDDING', worker_id = $1, claimed_at = now()
WHERE id IN (
    SELECT id FROM docs
    WHERE status = 'OCR_DONE'
    ORDER BY priority DESC, updated_at
    FOR UPDATE SKIP LOCKED
    LIMIT 5
)
RETURNING id, path;
```

`SKIP LOCKED` is the whole trick. Each worker locks its five rows and steps over rows another worker already holds, so N workers pull disjoint batches with no coordinator and no double processing. That leaves fewer moving parts and one place to look when something's late (`SELECT status, count(*) FROM docs GROUP BY 1`). Back-pressure comes for free too: if embedding falls behind, `OCR_DONE` rows just pile up in a column instead of ballooning an invisible broker queue.

The one gotcha: a worker that dies mid-batch leaves rows stuck in `EMBEDDING` forever. A reaper query resets anything claimed longer ago than a timeout back to `OCR_DONE`, so a crash costs one batch of retries.

```sql
UPDATE docs SET status = 'OCR_DONE', worker_id = NULL
WHERE status = 'EMBEDDING' AND claimed_at < now() - interval '15 minutes';
```

A weighted fair scheduler sits on top of the priority column so a one-time bulk load of tens of thousands of certificates can't starve the scientist waiting on one new report. Bulk work runs at low weight and yields to interactive requests.

Reach for a broker once you've earned it. At this scale, a table I can query and back up beat a broker I'd have to babysit, and "the queue is the database" left me one system to reason about instead of two.

## Retrieval runs three searches in parallel

Each document is split into overlapping fragments (roughly 500 tokens, ~15% overlap so a fact on a chunk boundary is never cut in half) and embedded by a multilingual model, gecko-multilingual-002, 768 dimensions. Multilingual matters here: the corpus mixes French, English and scientific jargon inside the same sentence, and a question asked in one language has to find a document written in another. A monolingual embedder silently fails that, returning nothing rather than the French dossier that holds the answer.

A single vector search falls short, because three different questions hide inside one query. So a query fans out three ways in parallel:

```python
async def retrieve(query: str, groups: list[str]) -> list[Hit]:
    semantic, lexical, title = await asyncio.gather(
        vector_search(embed(query), groups=groups, top_k=50),   # meaning
        fulltext_search(query, groups=groups, top_k=50),        # exact tokens
        title_search(query, groups=groups, top_k=20),           # direct hit
    )
    merged = dedupe(semantic + lexical + title)
    ranked = reranker.rank(query, merged)                       # cross-encoder
    return [h for h in ranked if h.score >= 0.7][:10]
```

- **Semantic**, for meaning, when the words don't match but the intent does.
- **Full-text**, for the exact patent code or a precise part code a vector embedding blurs into its neighbors. "AX-1401" and "AX-1410" sit close in vector space and mean very different things; lexical search doesn't confuse them.
- **Title**, for the direct hit when someone types most of a document name.

A cross-encoder reranker then merges the three result sets, drops the duplicates, and reorders what's left; I keep only hits above a 0.7 score floor. It earns its cost. Pure vector similarity is good at recall and mediocre at ordering, so the genuinely relevant result often lands at position 7 instead of 1. The reranker reads the query and each candidate together and pushes that result back to the top. Recall is cheap at 100M+ pages and precision is everything, so this is the step that stops the tenth loosely-related result from polluting the answer.

**p95 answer latency stays under one second across the full 100M+-page corpus.**

After native-first, the reranker is the second-best call in the system. A vector index alone gives you a demo that looks great and a result set that's subtly wrong in its ordering, which is the worst kind of wrong, because it looks fine.

> War story. An empty query string sailed through and hit the embedder, which returned a 768-dim vector for "", and that vector is roughly equidistant from everything, so the search returned near-random documents with plausible-looking scores and nothing errored. It read like a ranking bug for the better part of a day before I traced it to a UI path that sent an empty string on focus; the fix was a one-line guard that rejects empty and whitespace-only queries before they reach the embedder, plus a test that would have caught it.

## Access control lives inside the query

The tempting design here leaks data. You run the search, then filter the results by permission before showing them. That means the search engine already touched documents the user can't see. One forgotten filter, one new code path, and a document crosses a brand boundary.

So access control lives inside the query. Each tenant gets its own Pinecone namespace, so brand isolation is a property of the index structure rather than a filter bolted on afterward: a query against one namespace physically can't return a vector from another. Per-document access then goes into the query itself, as a metadata filter built from the user's groups. Those groups arrive with an identity in a signed header, which neither the model nor the client can forge.

```python
result = index.query(
    namespace=tenant_id,                 # brand isolation: structural
    vector=embed(query),
    filter={"acl_groups": {"$in": user_groups}},  # per-doc ACL: in the query
    top_k=50,
    include_metadata=True,
)
```

A user is never shown a document they aren't cleared for, because the search never reads it in the first place. Two people asking the identical question from two different brands get answers drawn from two different slices of the corpus, and neither can tell the other slice exists. The property I wanted was simple to state and hard to violate: a document a user can't see is a document the search can't touch.

**Zero cross-brand leaks: a document a user cannot see is a document the search never reads.**

Filtering inside the query rather than after the results is a security decision. Post-filtering sits one refactor away from a breach every time. Putting the filter inside the query makes the safe path the only path.

## Who has this problem

Wiring an AI to a folder of documents is an afternoon demo. Reading 100 million pages faithfully, keeping tables honest, and enforcing access inside the query is a different job, and every decision above exists because the demo version fails quietly at scale.

The architecture transfers as it is: native-first reading, layout-aware extraction, hybrid search with a reranker, access enforced at retrieval. Anyone with a decade of documents nobody can search has this exact problem: pharma and cosmetics dossiers, banking contract and KYC files, legal clause libraries, insurance claims in five layouts and four languages.
