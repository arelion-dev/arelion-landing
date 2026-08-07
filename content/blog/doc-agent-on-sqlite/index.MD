---
title: "The document agent that runs on SQLite"
date: "2026-08-07T10:00:00.000Z"
description: "A private document agent that reads, files and answers questions over years of PDFs, with the entire searchable brain in one SQLite file on the owner's own machine. No vector database, no cloud."
tags: ["Tech", "AI"]
private: true
---

Friday night. A business owner is hunting one invoice across two years of PDFs, folder by folder, because he is the only search engine his company ever had. He knows the file exists. He gives up around the fortieth folder.

I built the search engine that should have existed. It reads every incoming PDF and scan, files each one on its own, and answers a plain question with the exact page and a one-click link to the source file. **Retrieval in under 2 seconds, against 3 years of paperwork, and 0 documents leave the machine.** The design choice worth writing about: the models read and file, but the whole searchable brain is one SQLite file. No vector database, no cloud service holding his financials.

## Never pay a model for work a local tool does for free

Reading is where cost explodes if you send every page to a model. So the pipeline checks the cheap path first. Any PDF with a real text layer gets lifted by `pdftotext` in milliseconds, at zero cost. Only a genuine scan, an image with no text, falls back to Gemini 2.5 Flash vision.

Most business paperwork is born digital, so most of it rides the free path. **Roughly 85% of pages never touch a paid model.**

## A misfiled contract lies to you for years, so the machine admits doubt

Filing is where trust is won or lost. A classifier (Gemini 2.5 Flash, with Gemini 2.5 Pro as fallback for hard cases) decides what a document is, who it concerns, and where it belongs, with a confidence score.

Below the critique threshold, a second independent pass reviews the first decision. Anything still doubtful lands in an "à vérifier" queue instead of being forced into a folder. A misfiled contract is worse than an unfiled one: the unfiled one you know to check, the misfiled one lies to you for years. The queue admits doubt instead of hiding it, which is what lets the owner stop double-checking the machine.

## The whole brain is one SQLite file, and backup is a copy command

The contrarian part: there is no managed vector store. `sqlite-vec` holds the embeddings, FTS5 handles full-text search, both inside one file. Skipping a hosted service removes a server, a monthly bill, and a copy of the archive on someone else's infrastructure. **One SQLite file, no vector DB, about $0 in infra per month.** Backup is copying a file.

```python
EMBED_DIM = 768  # gemini-embedding-001, output_dimensionality=768

# vectors
CREATE VIRTUAL TABLE chunks_vec USING vec0(embedding float[768]);

# full text, accent-insensitive French tokenizer
CREATE VIRTUAL TABLE chunks_fts USING fts5(
    chunk_id UNINDEXED, doc_id UNINDEXED, text, context,
    tokenize="unicode61 remove_diacritics 2");
```

## Two searches cover each other's blind spots

Search runs two engines at once. Semantic catches meaning ("what did we agree on late payment"). Full-text catches exact strings a vector blurs: a reference number, a proper name. Their ranked lists merge by reciprocal rank fusion, so each covers the other's blind spot. This is the actual fusion, the piece I call `_rrf_combine`:

```python
RRF_K = 60  # standard reciprocal rank fusion constant

def _rrf_combine(sem_rows, fts_rows) -> dict:
    scores: dict = {}
    for rank, r in enumerate(sem_rows):
        key = (r["chunk_id"], r["doc_id"])
        scores[key] = scores.get(key, 0.0) + 1.0 / (RRF_K + rank + 1)
    for rank, r in enumerate(fts_rows):
        key = (r["chunk_id"], r["doc_id"])
        scores[key] = scores.get(key, 0.0) + 1.0 / (RRF_K + rank + 1)
    return scores
```

## Match small, return big

Two details earn their keep daily. First, small-to-big: a hit matches on a small chunk, but the system returns the whole parent page. An invoice total split across a chunk boundary would otherwise come back cut in half.

```python
# small-to-big: match on the chunk, return its full parent page
page_num = row["page_num"]
page_text = db.get_page_text(conn, row["doc_id"], page_num)
```

Second, duplicates. Identical files are caught by content hash (SHA-256), so a duplicate is cloned in the database instantly, with no second model call and no doubled results.

> War story. Early on, a batch of scans came back with empty text and the classifier happily filed them all as "unknown" with high confidence, because an empty string matched nothing and nothing contradicted it. High confidence on no evidence is the dangerous failure. The fix: an empty or near-empty read now short-circuits straight to the "à vérifier" queue before the classifier ever sees it. Confidence has to be earned against real text.

## A worked example

The owner asks "how much did I pay this supplier in 2024". The query runs semantic and full-text in parallel, `_rrf_combine` merges them, the top chunk surfaces its full page, and the answer comes back with the amount, the exact line, and the path to `2024-03-11_facture_fournisseur-x.pdf` to check in one click. **Twenty minutes of digging become one question.**

The same brain is reachable two ways: from an AI assistant through a small MCP server, and from the command line through a set of `bb-*` tools. A question gets answered in a chat or a script, whichever is closer to hand.

## The honest limit

This is single-machine by design, and that is also its ceiling. One SQLite file is perfect for one owner with years of paperwork. It is not built for ten people writing to it at once. Concurrent writers would need a real database and the server, bill, and off-machine copy that come with it. For this owner, the constraint is the feature. For a team, it is the line where I would change the design.

## Who has this problem

The transferable pattern: a pile of unstructured, sensitive documents becomes something you interrogate like a colleague, without surrendering it to anyone. Read cheaply before you read expensively. Let two search methods cover each other. Make the system say its doubt out loud. Keep the data where it was born, in a form you back up by copying a file.

An accounting practice on years of client files, a law office where the answer is always "in the file, somewhere", a property manager juggling leases across dozens of units, a medical practice bound by confidentiality, any back office where one person became the search engine. The pile differs. The fix is the same.
