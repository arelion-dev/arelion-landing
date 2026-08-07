---
title: "Document intelligence at scale"
date: "2026-08-07T10:00:00.000Z"
description: "Reading and searching 100M+ pages across thirty brands: native-text-first OCR, faithful tables, hybrid retrieval, and access control enforced inside the query."
tags: ["Tech", "AI"]
private: true
---

I designed and built a document-intelligence engine for a global beauty group: thirty brands, decades of R&D, more than 100 million pages of formulas, patents, contracts and regulatory dossiers, across a dozen languages.

A sibling piece covers the agent that refuses to half-answer a multi-part question. This one is about the layer under it: how you read 100 million pages faithfully, then search them in under a second, without leaking a single document across a brand boundary.

## Reading is the hard part, not searching

A scanned PDF is not text. It is a picture of text. A born-digital PDF already carries the text. Treating both the same way either wastes money or loses accuracy, so the pipeline branches on the page.

If the embedded text layer is real, the pipeline lifts it for free, zero OCR error. Only true scans pay for OCR, rendered at higher DPI where the extra pixels actually help:

```python
words = page.get_text("words")
if page.rotation in (0, None) and len("".join(w.text for w in words)) >= 40:
    text, dpi = lift_text_layer(words), 200   # born-digital: free, exact
else:
    text, dpi = ocr(render(page, dpi=300)), 300   # scan: more pixels, OCR
```

At 100M pages, this native-first split is not a nicety. It is the difference between an OCR bill you can pay and one you cannot.

## Layout first, then the right reader per region

Before reading a page, the pipeline understands its shape. A Docling layout model separates a title from a paragraph from a figure from a table. Each region then goes to the reader built for it: text through Tesseract OCR, tables through TableFormer, which rebuilds the real cell grid, rows by columns.

The obsession with tables is deliberate. A stability reading or an active-ingredient concentration lives inside a table, and a table flattened to a line of text becomes a lie the model repeats fluently. A formulation detail read from the wrong row is worse than no answer. So a hallucinated 200-column table is dropped rather than trusted, and the rest of the document survives: empty over invented.

Figures are described by a Gemini model, so a mute chart becomes searchable. Repeated images, logos and hazard symbols, are captioned once and content-hash cached. Nobody pays twice to describe the same picture.

## The queue is the database

No Kafka, no Celery, no Pub/Sub. A document is a row with a `status`. Workers claim work with one Postgres primitive:

```sql
SELECT * FROM docs
WHERE status = 'OCR_DONE'
ORDER BY updated_at DESC
FOR UPDATE SKIP LOCKED   -- many workers, one table, never the same doc twice
LIMIT 5;
```

Fewer moving parts, one place to look when something is late. A weighted fair queue picks which use case runs next, so a one-time bulk load of tens of thousands of certificates cannot starve the scientist waiting on one new report.

## Retrieval is three searches, not one

Each document is split into fragments and embedded by a multilingual model (gecko-multilingual-002, 768 dimensions). Multilingual matters because the corpus mixes French, English and scientific jargon in the same sentence, and a question in one language must find a document written in another.

A query fans out three ways in parallel:

- **Semantic**, for meaning.
- **Full-text**, via Nuxeo, for the exact patent code or the precise INCI name a vector would blur.
- **Title**, for the direct hit.

A reranker merges, dedupes and reorders, with a 0.7 similarity floor to keep noise out. At 100 million pages, recall is cheap and precision is everything: the reranker is what stops the tenth result from polluting the answer.

## Access control lives inside the query

This is the guardrail that carries the trust. Each tenant gets its own Pinecone namespace, so brand isolation is a property of the index structure, not a filter bolted on afterward.

Per-document access control is enforced at retrieval, not after. The user's groups are injected as a filter into the Pinecone query, server-side, from an identity passed in an HTTP header the model cannot spoof. A user is never shown a document they are not cleared for, because the search never touches it. Two people asking the same question from two brands get answers drawn from two different slices of the corpus.

## Who has this problem

Wiring an AI to a folder of documents is an afternoon demo. Reading 100 million pages faithfully, keeping tables honest, and enforcing access inside the query is a different job.

The architecture transfers as it is: native-first reading, layout-aware extraction, hybrid search, access enforced at retrieval. Anyone with a decade of documents nobody can search has this: pharma and cosmetics dossiers, banking contract and KYC files, legal clause libraries, insurance claims in five layouts and four languages.
