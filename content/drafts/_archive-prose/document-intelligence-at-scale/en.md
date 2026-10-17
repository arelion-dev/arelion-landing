---
title: "Document intelligence at scale"
description: "How we made 100M+ pages of multilingual, multi-confidentiality documents answerable in under a second, with a source citation on every claim."
date: 2026-07-06
tags: ["rag", "search", "gcp", "vector-search", "adk", "document-ai"]
pillar: "Build"
stack: ["Python", "Google ADK", "LiteLLM", "Pinecone", "Vertex AI Search", "Document AI", "Gemini", "Elasticsearch", "GCP", "Terraform"]
lang: "en"
---

## The problem

A global enterprise had decades of institutional knowledge locked inside a document store: research reports, patents, specifications, contracts, across 30 brands and a dozen languages. The archive held over 100 million pages, much of it scanned images with no extractable text, and every document carried its own confidentiality rules. People could not find what already existed, so they re-ran work that had already been done. The ask was simple to state and hard to build: let anyone ask a question in plain language and get a trustworthy answer in under a second, with a citation they can click through to the exact page.

## What we built

A document search and chat system that ingests the full corpus, makes it semantically searchable, and puts a reasoning agent in front of it. You ask a question in French or English; the agent rephrases it, searches the library, reads the pages that matter, and writes a grounded answer where every claim links back to its source.

Sanitized example. Input: "What formulations mention this technical approach after 2020?" Output: a short synthesized paragraph, with inline citations like [[cite|report_4471.pdf|cite]] resolving to page 5 of a specific document, plus a ranked list of the source documents the answer drew from. If the corpus does not support a confident answer, the agent says so and asks the user to narrow the query rather than inventing one.

## How it works

Ingestion runs as a pipeline. Scanned PDFs go through Document AI OCR, which returns not just text but paragraph bounding boxes, so the frontend can highlight the exact region a chunk came from (Vertex AI Search does not return coordinates, so we store the boxes separately). A Gemini pass extracts structured business metadata (codes, authors, year, document type) from the OCR text. The document is chunked, and each chunk is embedded through a multilingual embedding model (`gecko-multilingual-002`, 768 dimensions) served via a central model gateway behind LiteLLM. Chunks land in Pinecone: one index per embedding model, one namespace per tenant, with vector ids keyed by document id so a document's vectors can be listed and replaced atomically on re-ingest.

The scheduler that drives ingestion uses weighted fair queuing across tenants, so no single brand's bulk upload starves the others, and a concurrency semaphore keeps throughput bounded.

Retrieval is hybrid. A semantic query hits Pinecone with a similarity floor; a full-text query hits Elasticsearch for exact-keyword and title matches; a metadata query filters on the extracted fields. Results from the filtered and unfiltered passes are merged by a reranker that deduplicates by document, rewards title matches, and aggregates chunk scores up to the document level (a document with several strong-scoring chunks ranks above one with a single lucky hit).

The chat layer is an agent built on Google ADK, model-agnostic through LiteLLM. It defaults to `gemini-3.5-flash`, lets the caller swap the model per turn, and escalates to `gemini-3.1-pro-preview` for autonomous deep-search runs that investigate the library for minutes and write a sourced dossier. The retrieval tools are exposed to the agent over MCP. Access control is not bolted on: every search carries the user's ACL (`read_group` / `acl_group`), narrowed to the most restrictive intersection of their groups, so retrieval physically cannot surface a chunk the user is not cleared to see.

## The hard part

Scale changes every decision. The interesting engineering was not the happy path, it was the guardrails.

A reasoning agent will loop. Left alone it retries searches, stacks results, and balloons the request until the gateway call times out. We bucketed tools into expensive (remote search, capped tight per turn) and cheap (in-document reads, high safety ceiling only), and we cap the request contents on every model call, not just after the turn, because compaction only runs post-invocation and cannot save you mid-loop.

Multilingual is not free. A French query about an ingredient has to reach an English document and its scientific synonyms, so the rephrase step expands terms across languages before retrieval, and the embedding model has to hold both languages in one space.

Precision beats recall at this size. With 100M+ pages, a naive top-k drowns the good answer in near-duplicates; the reranker and document-level aggregation exist to fight exactly that. And staying LLM-agnostic through LiteLLM is a deliberate cost lever: cheap model by default, expensive model only when the task earns it.

## Result

Sub-second p95 semantic search across 100M+ pages and 30 brands, with a source citation on every answer and per-document access control enforced at retrieval time. Ingestion runs continuously with fair scheduling across tenants. Precision and answer-quality metrics: [à confirmer: reranking precision, deflection/reuse rate].

## Reusable

This is one engine, not one product. The same pattern (OCR, structured extraction, multilingual embeddings, hybrid retrieval, a reranker, and a citation-grounded agent with access control) applies directly to contract review, KYC and due-diligence packs, and invoice processing. If you are sitting on a large, messy, confidential document estate and your people cannot find what is in it, that is the problem this solves. Happy to talk through the shape of yours in writing.
