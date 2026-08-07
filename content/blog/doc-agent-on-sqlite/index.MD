---
title: "The document agent that runs on SQLite"
date: "2026-01-22T19:30:00.000Z"
description: "A private document agent that reads, files and answers questions over years of PDFs, with the entire searchable brain in one SQLite file on the owner's own machine. No vector database, no cloud."
tags: ["Tech", "AI"]
private: true
---

Friday night. A business owner is hunting one invoice across two years of PDFs, folder by folder, because he is the only search engine his company ever had. He knows the file exists. He gives up around the fortieth folder.

I built the search engine that should have existed. It reads every incoming PDF and scan, files each one on its own, and answers a plain question with the exact page and a one-click link to the source file. **Retrieval in under 2 seconds, against 3 years of paperwork, and 0 documents leave the machine.** The design choice worth writing about: the models read and file, but the whole searchable brain is one SQLite file. No vector database, no cloud service holding his financials.

By the end you will know how the pipeline reads cheaply, files with earned confidence, and searches two ways at once, all inside one file you back up with `cp`.

## Never pay a model for work a local tool does for free

Reading is where cost explodes if you send every page to a model. So the pipeline checks the cheap path first. Any PDF with a real text layer gets lifted by `pdftotext` (poppler) in milliseconds, at zero cost. Only a genuine scan, an image with no text, falls back to Gemini 2.5 Flash vision.

Most business paperwork is born digital, so most of it rides the free path. **Roughly 85% of pages never touch a paid model.** The opinion here: multimodal models are the wrong default for OCR when a deterministic extractor already knows the answer. You reach for the model at the edge, not in the middle.

## A misfiled contract lies to you for years, so the machine admits doubt

Filing is where trust is won or lost. A classifier (Gemini 2.5 Flash, with Gemini 2.5 Pro as fallback for hard cases) decides what a document is, who it concerns, and where it belongs, with a confidence score.

Below the critique threshold, a second independent pass reviews the first decision. Anything still doubtful lands in an "à vérifier" queue instead of being forced into a folder. A misfiled contract is worse than an unfiled one: the unfiled one you know to check, the misfiled one lies to you for years. The queue admits doubt instead of hiding it, which is what lets the owner stop double-checking the machine.

The "who" and "where" are not free text. Each document gets tagged on controlled-vocabulary axes, plus free-form tags that grow organically:

```python
PERSON_VALUES = (
    "antonin", "frederic", "catherine",
    "nicolas", "charles", "chloe", "autre",
)
TOPIC_VALUES = (
    "dubai_residence_fiscale", "succession", "patrimoine_commun",
    "operationnel_courant", "immobilier_locatif", "medical",
    "vehicule", "autre",
)
```

A model that returns a value off the list gets folded into `autre` rather than trusted. This is the boring backbone that makes "show me every 2024 rental document, but not the succession ones" a `WHERE` clause instead of a second model call.

## The whole brain is one SQLite file, and backup is a copy command

The contrarian part: there is no managed vector store. `sqlite-vec` holds the embeddings in a `vec0` virtual table, FTS5 handles full-text search, both inside one file. Skipping a hosted service removes a server, a monthly bill, and a copy of the archive on someone else's infrastructure. **One SQLite file, no vector DB, about $0 in infra per month.** Backup is copying a file.

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

Two details in that FTS5 line matter for French paperwork. `unicode61` is the tokenizer, and `remove_diacritics 2` means a search for "resilie" finds "résilié". A user hunting a term should not have to type the accents right.

Embeddings go in as raw little-endian float bytes, packed once with `struct`:

```python
def _vec(values):
    floats = list(values)
    return struct.pack(f"{len(floats)}f", *floats)
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

RRF is deliberately dumb: it only reads rank position, never the raw scores. That is the point. Cosine distance and FTS5's `rank` are not on the same scale, so any attempt to add them directly is a bug waiting to happen. RRF sidesteps the whole normalization problem. In hybrid mode I pull the top `k * 5` candidates from each engine (at least 30), fuse, then group by document and keep the single best chunk per document so one long file cannot flood the results.

The vector query itself is where sqlite-vec surprises people. K-nearest-neighbours is not a `LIMIT`, it is a constraint inside the `WHERE`:

```python
SELECT c.id AS chunk_id, c.doc_id AS doc_id, v.distance AS distance
FROM chunks_vec v
JOIN chunks c    ON c.id = v.rowid
JOIN documents d ON d.id = c.doc_id
WHERE v.embedding MATCH ?   -- the packed query vector
  AND k = ?                 -- KNN count lives here, not in LIMIT
  AND d.status = 'ok'
ORDER BY v.distance
```

> War story. The first time I filtered vector results by `d.status = 'ok'` and slapped a `LIMIT 5` on the end, I kept getting fewer than five hits, sometimes zero. Cause: sqlite-vec resolves `k` first, hands back exactly those rows, and only then does the SQL `WHERE`/`LIMIT` run on that fixed set. So a `k = 5` search whose top 5 vectors were all filtered out returned nothing. The fix: ask for a wider `k` up front (`k * 3` to `k * 5`), then filter and trim in Python. KNN count and result count are two different numbers.

## Match small, return big

Two details earn their keep daily. First, small-to-big: a hit matches on a small chunk, but the system returns the whole parent page. An invoice total split across a chunk boundary would otherwise come back cut in half.

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

The same content living at two paths is a fact about the filesystem, not a reason to pay for OCR twice.

> War story. Early on, a batch of scans came back with empty text and the classifier happily filed them all as "unknown" with high confidence, because an empty string matched nothing and nothing contradicted it. High confidence on no evidence is the dangerous failure. The fix: an empty or near-empty read now short-circuits straight to the "à vérifier" queue before the classifier ever sees it. Confidence has to be earned against real text.

## A worked example

The owner asks "how much did I pay this supplier in 2024". The query embeds once, runs semantic and full-text in parallel, `_rrf_combine` merges the two ranked lists, the top chunk surfaces its full parent page, and the answer comes back with the amount, the exact line, and the path to `2024-03-11_facture_fournisseur-x.pdf` to check in one click. **Twenty minutes of digging become one question.**

The same brain is reachable two ways: from an AI assistant through a small MCP server, and from the command line through a set of `bb-*` tools. A question gets answered in a chat or a script, whichever is closer to hand.

## The honest limit

This is single-machine by design, and that is also its ceiling. WAL mode lets many readers run while one writer works, which is exactly right for one owner with years of paperwork. It is not built for ten people writing at once. Concurrent writers would need a real database and the server, bill, and off-machine copy that come with it. For this owner, the constraint is the feature. For a team, it is the line where I would change the design.

## Who has this problem

The transferable pattern: a pile of unstructured, sensitive documents becomes something you interrogate like a colleague, without surrendering it to anyone. Read cheaply before you read expensively. Let two search methods cover each other. Make the system say its doubt out loud. Keep the data where it was born, in a form you back up by copying a file.

An accounting practice on years of client files, a law office where the answer is always "in the file, somewhere", a property manager juggling leases across dozens of units, a medical practice bound by confidentiality, any back office where one person became the search engine. The pile differs. The fix is the same.
