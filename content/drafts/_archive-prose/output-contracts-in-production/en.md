---
title: "Output contracts: what reliable LLM agents actually look like in production"
description: "Agent reliability is not decided in the prompt. It is decided at the output. The model proposes, the architecture disposes: every generated query or object is validated against a strict contract before anything downstream ever sees it."
date: 2026-07-06
tags: ["LLM agents", "reliability", "Pydantic", "text-to-SQL", "production", "AI engineering"]
pillar: "Automate"
stack: ["Python", "Pydantic", "sqlglot", "PostgreSQL", "Google ADK"]
lang: en
---

## The problem

The failure mode nobody screenshots is the "almost correct" output.

A model returns a SQL query that parses, runs, and gives an answer. The answer looks plausible. It is also missing a tenant filter, so it counts documents the user is not allowed to see. Or it returns a metadata object where one field is a nested dict instead of a string, and three services downstream a serializer throws, a job dies, a retry storm starts.

None of that gets caught by a better prompt. You can write "always scope by tenant" in bold, in caps, three times, and a model will still, occasionally, not. The output is where the damage happens, so the output is where the guarantee has to live.

I build for a system serving thousands of users at a global enterprise, where an LLM agent answers questions over a large private document library. Wrong is not "unhelpful." Wrong is a data leak or a corrupted pipeline. So the design premise is simple: the model proposes, the architecture disposes.

## What we built

Output contracts, enforced at every boundary where a model hands work to code.

Two of them carry most of the weight. The first governs LLM-generated SQL: the agent translates a natural-language question into a read query, and that query is not run because the model wrote it. It is run because it passed a validator. The second governs metadata objects flowing into the store: every one is parsed through a strict schema before it is accepted.

A short illustration. The agent emits something like:

```sql
SELECT record_type, count(*) FROM records GROUP BY record_type LIMIT 200
```

Before a database connection is ever opened, that string is parsed into a syntax tree and checked: exactly one statement, a SELECT and nothing else, only the one table it is allowed to touch, no file or network functions, a bounded LIMIT. Then the caller's access scope is injected by rewriting the tree, so even a bare `count(*)` can only ever see authorized rows. The model never scopes its own query. It is not trusted to.

## How it works

The contracts are plain, boring, deterministic code.

For structured objects, Pydantic `BaseModel` schemas do the work. Field types, length bounds, required-field rules, cross-field invariants expressed as validators. Reserved keys are rejected. On one request model, extra fields are explicitly forbidden, so a caller (or a model) cannot smuggle a tenant identifier into a shared table by tacking on a field nobody validated. A malformed object does not become a 500 deep in a worker. It becomes a `ValidationError` at the door, mapped to a clean 4xx.

For SQL, the validator walks the abstract syntax tree and rejects any write, DDL, or command node anywhere in the tree, including hidden inside a CTE. Table allow-list. Function denylist for anything that touches the filesystem, the network, or server state. A mandatory, bounded LIMIT.

Then the reject / correct / retry / block loop. In our system the enforced move is reject and block: if the generated SQL fails validation, it is logged and the request returns a no-answer response. It is never propagated, never partially executed, never "cleaned up and run anyway." Failing closed is a feature, not a fallback. A path that demands access groups but resolves none matches zero rows, never all of them.

Two more things matter. The validation runs on both sides: the service that generates the query and the service that executes it both re-validate, independently. A bug in one does not become an incident. And none of this is model-specific. The contract does not care whether the text came from one vendor's model or another's, this month's or next quarter's. Swap the model freely. The gate does not move.

## The hard part

Naive prompting fails precisely where it matters most: the rare, adversarial, or malformed output. Prompts shape the distribution of outputs; they do not bound it. For a security or data-integrity property, "usually" is a synonym for "no."

So validation cannot be advisory. It has to be non-negotiable and on the hot path, not a monitoring afterthought that flags problems after they shipped. The engineering cost is real: you maintain the schemas, keep the dual-side validators in sync, and resist the temptation to add a "just this once" bypass. And you make rejections observable. Every rejected output is logged with its cause, because a spike in rejections is a signal about your prompt, your model, or an attack, and you want to see it.

## Result

Structurally, no unvalidated model output reaches the database or a downstream consumer: that is the invariant the code enforces, by construction. Rejection rates, incident counts, and latency overhead in production are `[à confirmer]`.

## Reusable

This is not specific to documents, or to SQL, or to one client. Any system where a model hands structured work to code has the same seam: a multi-agent pipeline, a RAG backend, an LLM-in-the-loop workflow, a tool-calling agent. Define the contract at that seam. Validate hard. Fail closed. Reject loudly and observably.

The prompt is where you ask nicely. The output contract is where you make sure. If you are wiring an agent into anything that can leak data or corrupt state, that is the boundary worth building.
