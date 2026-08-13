---
title: "The document agent that runs on SQLite"
date: "2026-01-22T19:30:00.000Z"
description: "A private document agent that reads, files and answers questions over years of PDFs, with the entire searchable brain in one SQLite file on the owner's own machine. No vector database, no cloud."
tags: ["Tech", "AI"]
private: true
---

A private document agent reads and files every incoming PDF, then answers plain questions over years of paperwork. The whole searchable brain is one SQLite file on the owner's own machine. No vector database, no cloud service sitting on his financials.

I built it for a business owner who was the only search engine his company ever had: Friday nights hunting one invoice across two years of scans, folder by folder. Ask the agent a plain question now and it answers with the exact page and a one-click link to the source file. **Retrieval in under 2 seconds, against 3 years of paperwork, and 0 documents leave the machine.**

By the end you'll know how the pipeline reads cheaply, why it refuses to file anything it can't stand behind, and how it searches two ways at once, all inside one file you back up with `cp`.

## Never pay a model for work a local tool does for free

Reading is where cost explodes if you send every page to a model, so the pipeline tries the cheap path first. Any PDF with a real text layer gets lifted by `pdftotext` (poppler) in milliseconds, at zero cost. Only a genuine scan, an image with no text underneath, falls back to Gemini 2.5 Flash vision.

Most business paperwork is born digital, so most of it rides that free path. **Roughly 85% of pages never touch a paid model.** Multimodal models are the wrong default for OCR when a deterministic extractor already knows the answer. You reach for the model at the edge cases, where the cheap tool runs out.

## The machine flags doubt instead of filing blind

Filing is where trust is won or lost. A classifier (Gemini 2.5 Flash, with Gemini 2.5 Pro as fallback for the hard cases) decides what a document is, who it concerns, where it belongs, and how confident it is in that call.

Below the critique threshold, a second independent pass reviews the first decision. Anything still doubtful lands in an "à vérifier" queue instead of getting forced into a folder. A misfiled contract is worse than an unfiled one: the unfiled one you know to check, while a wrong filing sits unquestioned for years. The queue states its doubt out loud, and that's what lets the owner stop double-checking the machine.

The "who" and "where" come from a controlled vocabulary rather than free text. Each document gets tagged on fixed axes, plus free-form tags that grow organically:

```python
# Values are per-deployment. Mine are real names and real topics,
# so here is the shape with placeholders.
PERSON_VALUES = (
    "owner", "spouse", "parent_1",
    "parent_2", "sibling", "other",
)
TOPIC_VALUES = (
    "tax_residency", "estate", "shared_assets",
    "day_to_day", "rental_property", "medical",
    "vehicle", "other",
)
```

A model that returns a value off the list gets folded into `autre` rather than trusted. Boring plumbing, and it's what turns "show me every 2024 rental document, but not the succession ones" into a `WHERE` clause instead of a second model call.

## The whole brain is one SQLite file, and backup is a copy command

There's no managed vector store. `sqlite-vec` holds the embeddings in a `vec0` virtual table, FTS5 handles full-text search, and both live inside one file. Skipping a hosted service drops a server, a monthly bill, and a copy of the archive sitting on someone else's infrastructure. **One SQLite file, no vector DB, about $0 in infra per month.** Backup is copying a file.

The connection loads the extension, turns on WAL so readers never block the writer, and creates the vector table sized to the embedding model:

```python
import sqlite_vec

EMBED_DIM = 768  # gemini-embedding-001, output_dimensionality=768

def connect(db_path):
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

# the vector index is just another virtual table
conn.execute(
    f"CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec "
    f"USING vec0(embedding float[{EMBED_DIM}])"
)

# full text, accent-insensitive French tokenizer
CREATE VIRTUAL TABLE chunks_fts USING fts5(
    chunk_id UNINDEXED, doc_id UNINDEXED, text, context,
    tokenize="unicode61 remove_diacritics 2");
```

Two details in that FTS5 line matter for French paperwork. `unicode61` is the tokenizer, and `remove_diacritics 2` means a search for "resilie" finds "résilié". Someone hunting a term shouldn't have to get the accents right.

Embeddings go in as raw little-endian float bytes, packed once with `struct`:

```python
def _vec(values):
    floats = list(values)
    return struct.pack(f"{len(floats)}f", *floats)
```

## Two searches cover each other's blind spots

Search runs two engines at once. The semantic side catches meaning ("what did we agree on late payment"), while full-text catches the exact strings a vector blurs, like a reference number or a proper name. Their ranked lists merge by reciprocal rank fusion, so each one covers the other's blind spot. Here's the fusion itself, the piece I call `_rrf_combine`:

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

RRF only reads rank position, never the raw scores, and that's the whole point. Cosine distance and FTS5's `rank` aren't on the same scale, so adding them directly is a bug waiting to happen. RRF sidesteps the normalization problem entirely.

In hybrid mode I pull the top `k * 5` candidates from each engine (at least 30) and fuse them, then group by document and keep the single best chunk per document, so one long file can't flood the results.

The vector query itself is where sqlite-vec surprises people. K-nearest-neighbours is a constraint inside the `WHERE`, right where you'd expect a `LIMIT`:

```python
SELECT c.id AS chunk_id, c.doc_id AS doc_id, v.distance AS distance
FROM chunks_vec v
JOIN chunks c    ON c.id = v.rowid
JOIN documents d ON d.id = c.doc_id
WHERE v.embedding MATCH ?   -- the packed query vector
  AND k = ?                 -- KNN count comes from k rather than LIMIT
  AND d.status = 'ok'
ORDER BY v.distance
```

> War story. Filtering vector results by `d.status = 'ok'` with a `LIMIT 5` on the end kept returning fewer than five hits, sometimes zero. sqlite-vec resolves `k` first, hands back exactly those rows, and only then runs the SQL `WHERE`/`LIMIT` on that fixed set, so a `k = 5` search whose top 5 vectors were all filtered out returned nothing. The fix: ask for a wider `k` up front (`k * 3` to `k * 5`), then filter and trim in Python.

## Match small, return big

Two details earn their keep every day. First, small-to-big: a hit matches on a small chunk, but the system hands back the whole parent page. An invoice total split across a chunk boundary would otherwise come back cut in half.

```python
# small-to-big: match on the chunk, return its full parent page
page_num  = row["page_num"]
page_text = db.get_page_text(conn, row["doc_id"], page_num)
```

Second, duplicates. Identical files are caught by content hash (SHA-256). A duplicate never triggers a second Gemini call: the existing document row, its chunks, its vectors, and its FTS entries are cloned straight to a new row inside the database.

```python
# duplicate file detected: copy the vector across, no re-embedding
vec = conn.execute(
    "SELECT embedding FROM chunks_vec WHERE rowid = ?", (src["id"],)
).fetchone()
if vec:
    conn.execute(
        "INSERT INTO chunks_vec (rowid, embedding) VALUES (?, ?)",
        (new_chunk_id, vec["embedding"]),
    )
```

The same content living at two paths tells you something about the filesystem. It's no reason to pay for OCR twice.

> War story. Early on, a batch of scans came back with empty text and the classifier filed them all as "unknown" with high confidence, because an empty string matched nothing and nothing contradicted it. The fix: an empty or near-empty read now short-circuits straight to the "à vérifier" queue before the classifier ever sees it. Confidence has to be earned against real text.

## One question, and the answer arrives with the file path

The owner asks "how much did I pay this supplier in 2024". The query embeds once, then runs semantic and full-text in parallel. `_rrf_combine` merges the two ranked lists, the top chunk surfaces its full parent page, and the answer comes back with the amount, the exact line, and the path to `2024-03-11_facture_fournisseur-x.pdf` to check in one click. **Twenty minutes of digging become one question.**

The same brain is reachable two ways: from an AI assistant through a small MCP server, or from the command line through a set of `bb-*` tools. You get your answer in a chat or a script, whichever is closer to hand.

## The honest limit: one machine, one writer

This is single-machine by design, and that's also its ceiling. WAL mode lets many readers run while one writer works, which is right for one owner with years of paperwork. It won't handle ten people writing at once.

Concurrent writers would need a real database, along with the server and the monthly bill, plus the off-machine copy of the archive. For this owner, the single-writer limit is the feature that keeps everything on one machine. A team writing concurrently is where I'd change the design.

## Who has this problem

The transferable pattern: a pile of unstructured, sensitive documents becomes something you interrogate like a colleague, without surrendering it to anyone. Read cheaply before you read expensively, and let two search methods cover each other's blind spots. Make the system state its doubt out loud instead of guessing. Then keep the data where it was born, in a form you back up by copying a file.

An accounting practice on years of client files, a law office where the answer is always "in the file, somewhere", a property manager juggling leases across dozens of units, a medical practice bound by confidentiality, any back office where one person quietly became the search engine: the same fix covers all of them.
