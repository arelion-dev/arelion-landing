---
title: "A multimodal document agent that runs on SQLite"
description: "We ingested a business's entire document stack, OCR'd and classified it with a Gemini agent, and made it searchable and answerable from a CLI. No Pinecone, no vector cluster, no cloud search infra. It runs on one SQLite file."
date: 2026-07-06
tags: ["sqlite", "sqlite-vec", "fts5", "gemini", "rag", "hybrid-search", "document-intelligence", "cli"]
pillar: "Build"
stack: ["Python", "SQLite", "sqlite-vec", "FTS5", "Gemini 2.5 Flash", "gemini-embedding-001"]
lang: "en"
---

## The problem

A business owner's document stack is a swamp. Years of PDFs on a Drive: invoices, contracts, bank statements, tax filings, IDs, leases, succession paperwork. Some are clean digital PDFs, many are phone photos of a scan of a fax. When you need "the amount on that 2024 supplier invoice" you either remember the folder or you lose twenty minutes.

The reflex answer in 2026 is a vector database. Spin up Pinecone, wire an embedding pipeline, add a search service, glue it together. For one person's document stack that is a lot of moving infrastructure to keep alive, secure, and pay for. We took the other bet.

## What we built

A system we built and run in production for a business owner's entire document stack. It walks the Drive, OCRs and classifies every document with a Gemini agent, embeds it, and lets you search and answer questions from a CLI. The whole store, inventory, OCR text, metadata, embeddings, full-text indexes, is one SQLite file.

```
$ bb-search "supplier invoice VAT amount" --mode hybrid --year 2024 --doc-type invoice --pretty

Query: supplier invoice VAT amount  (hybrid)
 score  type      date        title
 0.031  invoice   2024-03-08  Invoice ACME-2024-0312
   · total_ht: 4,200.00 EUR
   · vat: 840.00 EUR
   obsidian: Vault/Invoices/2024-03-08_invoice_acme.md
   source:   /Drive/.../2024-03-08_invoice_acme.pdf
```

One command in, a ranked answer with the montant, the VAT line, a link to the note, and the path to the source PDF you can open to verify.

## How it works

The store is `db.py`: one SQLite file with WAL mode. It holds a filesystem inventory (one row per file), the OCR'd `documents` with structured metadata (title, summary, doc_type, date, montant, currency, parties, key_facts), per-page text, `chunks`, and the search indexes. Two things make it a real retrieval engine.

Vectors live in `sqlite-vec`: a `chunks_vec` virtual table declared `vec0(embedding float[768])`. Embeddings come from `gemini-embedding-001` at 768 dimensions, with the `RETRIEVAL_DOCUMENT` task hint at index time and `RETRIEVAL_QUERY` at search time. Full text lives in two `FTS5` virtual tables (`documents_fts`, `chunks_fts`) with a diacritics-folding tokenizer so French queries match regardless of accents.

Ingestion is a Gemini agent, not a dumb loop. `bb-organize` reads PDFs natively (the file bytes go to Gemini as an `inline_data` blob), but only when it has to: a local `pdftotext` pass handles PDFs that already carry selectable text, and Gemini vision OCR is reserved for pure scans. The same agent classifies each document onto controlled-vocabulary axes (persons, topics, doc_type) plus free-form tags that grow organically, and routes it to the right folder. Content-hash dedup means a duplicate file clones the existing doc, chunks and vectors and all, with zero new Gemini calls. Then `bb-index` chunks each page (markdown-heading aware, ~900 tokens), embeds, and writes vectors plus FTS rows.

Search (`bb-search`) runs semantic, keyword, or hybrid. Hybrid fuses the vector ranking and the FTS ranking with reciprocal rank fusion. Every mode composes with multi-axis filters (`--person`, `--topic`, `--tag`, `--doc-type`, `--year`, and their negations). Results surface the document, its key_facts, an Obsidian note link, and the source path. The whole thing is also exposed over MCP, so the agent that answers your questions is the same store, queried live.

## The hard part

Why SQLite instead of a vector DB? Because the honest size of the problem is one business's documents, not a billion-vector web index. sqlite-vec does brute-force cosine over the chunk set, which at this scale is instant and needs zero infrastructure. One file. It backs up by copying. It has no server to secure, no cluster to pay for when nobody is querying.

The real engineering is not the vector search, it is the parts everyone skips. Hybrid retrieval matters because pure semantic search misses exact tokens (an invoice number, an IBAN) and pure FTS misses paraphrase; RRF gives you both without tuning a weight. Small-to-big retrieval matters because you match on a small chunk but return the full parent page, so a total never gets truncated at a chunk boundary. And the Flash/Pro tradeoff is a real cost lever: classification and OCR run on `gemini-2.5-flash`, and only documents that come back incomplete get one retry on `gemini-2.5-pro`. You pay Pro prices on the few hard pages, not the whole stack.

## Result

The system runs in production over a full personal-and-business document stack, ingesting, deduplicating, and answering from the CLI and over MCP. Corpus size, page count, and per-document cost: [à confirmer: exact document/page counts and Gemini spend from the production run].

## Reusable

The shape generalizes to any SMB or knowledge worker with a document swamp: a firm's contracts, a practice's records, a founder's paper trail. The ingredients are boring on purpose: SQLite, one embedding model, one multimodal model, a CLI. If your corpus is a business and not the open web, you probably do not need a vector cluster. If you have a document stack you cannot search, this is the kind of thing we build.
