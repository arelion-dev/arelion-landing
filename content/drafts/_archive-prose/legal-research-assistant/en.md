---
title: "Building a legal-research AI assistant that cites its sources (and refuses to invent law)"
description: "How we shipped a legal knowledge platform: search, browse, and chat over a jurisdiction's legislation, with a tool-calling agent that grounds every answer in real statutes and always carries a citation."
date: 2026-07-06
tags: ["AI agents", "RAG", "legal tech", "tool-calling", "grounding", "Vertex AI Search"]
pillar: "Build"
stack: ["Google ADK", "Gemini", "Vertex AI Search", "Fastify", "Prisma", "Postgres", "MCP", "React", "Vite", "Tailwind", "shadcn/ui"]
lang: "en"
---

## The problem

Legal research is slow, and it is slow for a good reason: the answer has to be right, and it has to be traceable to an actual statute. A lawyer cannot act on "the law probably says X." They need the article, the number, the version in force, and a link back to the official text.

This is exactly where a naive chatbot becomes dangerous. A general-purpose model will happily produce a fluent paragraph citing "Federal Decree-Law No. 12 of 2019, Article 7" that does not exist. In most domains a hallucination is annoying. In law it is malpractice. A legal assistant that invents statutes is strictly worse than no assistant at all, because it is confident and wrong at the same time.

So the real engineering problem was never "make it chat." It was "make it impossible for the answer to drift away from the source text."

## What we built

A legal knowledge platform for a jurisdiction's legislation (in this case the emirate, federal, and free-zone regimes of the UAE: Dubai, Federal, DIFC, ADGM). Three surfaces on top of one grounded corpus:

- **Search**, over the full body of legislation.
- **Browse**, structured by jurisdiction, law, chapter, and article.
- **Chat**, with an AI agent that answers legal-research questions and attaches a citation to every law it relies on.

A sanitized example of the contract the chat honors:

```
Q: What are the disclosure obligations for a virtual-asset service provider?

A: Providers must register and disclose to the competent authority before
   operating [1]. The regulator may require ongoing reporting and audited
   records [2].

   [1] Dubai Law No. X of YYYY, Article 5. Establishes the licensing and
       disclosure regime for virtual-asset activity.
   [2] Dubai Decree No. Y of YYYY, Article 12. Ongoing supervision and
       reporting duties.
```

The `[1]`, `[2]` markers are not decoration. They are clickable footnotes the UI renders from the agent's own tool calls, each linking back to the article text.

## How it works

**Ingestion from official sources.** A pipeline enumerates documents from official government legislation portals, downloads them, and fingerprints each with a SHA-256 hash. Unchanged documents are skipped; changed ones parse into a normalized shape (law, preamble, chapters, articles) in Postgres via Prisma. Every parse that differs from the last one creates a new versioned snapshot, so the corpus keeps history rather than overwriting it. Parsed laws are queued and synced to the search index.

**Retrieval with Vertex AI Search.** Search runs on Google's Discovery Engine end-to-end, with query expansion, spell correction, and semantic ranking. It returns law IDs and snippets; Postgres then supplies the full, authoritative article text. The model never retrieves from its own memory, only from what the index and the database return.

**A tool-calling agent (Google ADK + Gemini).** The chat is not a prompt-and-pray. It is an agent with a small, sharp toolset: `search_law` (semantic search over the corpus), `get_article` (verbatim article text), `get_law`, `list_laws`, version tools, and `cite`. The agent is instructed to execute rather than announce, to batch independent lookups into one parallel turn, and to quote legislation verbatim instead of paraphrasing.

**Why every answer carries a citation.** The `cite` tool is mandatory, and its call order is the footnote numbering. Before writing prose, the agent must call `cite` once per distinct law; only then does it write the answer with the matching `[N]` markers. Writing "(Article 9 of Law 5)" inline does not count, because it produces no clickable, source-linked footnote. The citation is enforced structurally, not merely requested.

**One corpus, two clients.** The same tools are exposed over an MCP server, so external clients get the identical grounded pipeline the chat uses, not a second, weaker implementation.

## The hard part

**Grounding, so the model cannot hallucinate law.** The system prompt is blunt: never invent law names, decree numbers, or article numbers; if an article does not exist, say so; distinguish "the law states" (from the database) from "generally" (model knowledge). When a jurisdiction filter matches nothing, search returns a `broadened` flag, and the agent is told to treat those results as the whole library rather than as a match for what was asked. That single flag prevents a whole class of confident wrong answers.

**Citation enforcement.** Getting a model to reliably call a tool before writing, in the right order, every time, is a prompt-engineering discipline in itself. The reward is that a well-formed answer is, by construction, a sourced answer.

**Jurisdiction structure.** Federal law applies across all emirates; Dubai laws apply on the mainland; DIFC and ADGM are common-law free zones whose laws take precedence inside their zones. The agent has to reason about which regime governs and flag conflicts, not just fetch text.

## Result

The platform ships all three surfaces (search, browse, chat) over a versioned, grounded corpus, with citations enforced at the tool level. Concrete usage and accuracy metrics: `[à confirmer]`.

## Reusable

The pattern generalizes to any regulated or high-stakes knowledge domain: compliance, tax, medical guidelines, internal policy. Ingest the authoritative corpus, retrieve with a real search engine, give a tool-calling agent a narrow toolset, and make the citation a required tool call rather than a polite request. The result is an assistant you can actually trust, because it can only speak from sources it can point to. If you have a corpus that people make decisions on, this is the shape worth building.
