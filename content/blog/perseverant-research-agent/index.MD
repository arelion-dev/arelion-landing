---
title: "The research agent that doesn't give up"
date: "2026-08-05T11:00:00.000Z"
description: "An autonomous document-research agent over a private enterprise corpus, built so it never ships a confident half-answer to a multi-part question."
tags: ["Tech", "AI"]
private: true
---

A global beauty group hired me to build a research agent over its private corpus. Decades of R&D lab reports, patents and signed contracts, in a dozen languages, most of it trapped inside scanned PDFs that nobody could search.

**Multi-part answers went from roughly 40% to 98% complete, and 0 silent half-answers have shipped since.**

The RAG itself is standard. What follows is about one specific failure, and the code that fixes it.

## The failure everyone ships

Ask a tool-using LLM to compare eight things and it does this:

```text
user: document the performance of bases A, B, C, D. cite a source for each.
agent: [semantic_search "performance A B C D"]   ← one blended search
agent: "Here is the performance of A and B: ..."  ← ships with 2 of 4
```

One search, the first two hits, and a fluent answer that reads as finished while it's missing half the question. A half-empty answer that looks complete is worse than no answer, because the reader trusts it and moves on.

Prompting doesn't fix this. "Be exhaustive, don't leave gaps" is a suggestion the model drops the second it can produce fluent text. So I stopped asking, and made it structural instead.

![The coverage-enforcement loop](assets/perseverance-loop.png)

## Fix 1: make the agent declare a checklist

A new tool, `track_coverage`, forces the model to write down the parts before it searches, and returns a directive instead of a polite nudge:

```python
def track_coverage(subgoals=None, covered=None):
    """Register sub-goals for a multi-part request, then tick them off.
    Only for genuinely multi-part work, never a single question."""
    state.setdefault("_coverage", {"subgoals": [], "covered": []})
    if subgoals:
        state["_coverage"]["subgoals"] = dedup(subgoals)   # PLAN
    if covered:
        state["_coverage"]["covered"] = dedup(state["_coverage"]["covered"] + covered)  # UPDATE

    open_ = [s for s in state["_coverage"]["subgoals"]
             if s not in state["_coverage"]["covered"]]
    if open_:
        return (f"{len(open_)} of {len(subgoals or [])} sub-goals are still OPEN. "
                "Do NOT answer yet. Search the open ones now, "
                "ONE entity per query (never batch names).")
    return "All sub-goals are covered. Write the final answer, citing a source for each part."
```

"One entity per query" matters for a concrete reason: eight names in a single embedding query dilute the ranking, and most of them never surface. So I designed the prompt and the budget together, to push the agent toward eight separate searches instead of one blended query.

## Fix 2: scale the budget to the declared plan

Left uncapped, an agent burns tokens forever. Capped flat at 5 searches, it literally can't cover 8 bases. So the ceiling grows with the checklist the model registered for itself:

```python
_BASE, _PER_SUBGOAL, _CEILING = 5, 2, 15

def expensive_budget(state):
    if PERSEVERANCE_OFF:
        return _BASE
    n = len(state.get("_coverage", {}).get("subgoals", []))
    return min(_BASE + _PER_SUBGOAL * n, _CEILING)   # 4 bases -> 13 searches
```

The agent earns more search budget by committing to a plan, and the hard ceiling of 15 keeps latency bounded.

**An eight-part question now fires eight separate searches, up from the one blended search that used to return two answers.**

## Fix 3: a barrier it can't talk past

This is the load-bearing trick. Google ADK lets you run a callback after every model turn. When the model tries to finalize while sub-goals are still open and budget remains, I throw its answer away and hand it a forced tool call, which shoves the loop back into searching:

```python
def enforce_coverage(callback_ctx, llm_response):
    cov = state.get("_coverage")
    open_ = has_open_subgoals(cov)
    is_answer = llm_response.text and not llm_response.function_calls

    if (PERSEVERANCE_OFF or not open_ or not is_answer
            or budget_spent(state) or reprompts(state) >= 3):
        return None                       # let the answer through

    state["_coverage_reprompts"] += 1
    return LlmResponse(content=Content(role="model", parts=[Part(
        function_call=FunctionCall(
            id=f"coverage-gate-{uuid4().hex[:12]}",   # MUST be non-empty (see below)
            name="track_coverage", args={}))]))
```

It turns a prompt suggestion into control flow the model can't argue with. I bound it to 3 re-prompts so it can never deadlock, and it passes through untouched when perseverance is off, nothing is open, or the budget's gone.

> **War story.** The first version left that `id` empty. Gemini on Vertex 500s with "Missing corresponding tool call for tool response", because it pairs a call to its result by id. Empty id, no pair, hard crash. It is now an assertion in a regression test.

## Prove it, don't believe it

Every knob has an off switch, `PERSEVERANCE_OFF=1`, which disables budget scaling and the barrier at once. It doubles as the A/B lever: run the same graded set with it on and off and read the delta.

The eval cases are grounded. I mined them from real production conversations, confirmed each ground truth against the source document, then pinned them as regression cases. The canonical one encodes the exact behavior as a reference trajectory:

```json
{
  "eval_id": "four_bases_perf",
  "prompt": "Performance of bases A, B, C, D. Cite a source each, or 'no data found'.",
  "reference_trajectory": [
    {"name": "track_coverage", "args": {"subgoals": ["A", "B", "C", "D"]}},
    {"name": "semantic_search", "args": {"query": "performance base A"}},
    {"name": "semantic_search", "args": {"query": "performance base B"}},
    {"name": "semantic_search", "args": {"query": "performance base C"}},
    {"name": "semantic_search", "args": {"query": "performance base D"}},
    {"name": "track_coverage", "args": {"covered": ["A", "B", "C", "D"]}}
  ],
  "reference_answer": "A: ... [src p.4]  B: ... [src p.2]  C: ... [src p.7]  D: no data found."
}
```

Two scores. A trajectory metric checks that the agent decomposed the request and searched each entity on its own. An LLM judge, run through the same private gateway with a strict 0-to-1 rubric, scores the answer against that reference. A single bad row fails on its own (scored `NaN`) and never aborts the run.

**With perseverance off, the graded set scored 0.41 on completeness. On, 0.98. Same questions, same corpus, one flag.**

## The plumbing under it is deliberately boring

The perseverance layer only earns its keep because everything beneath it is dull and correct.

**Reading is native-first.** A scanned PDF is a picture of text; a born-digital one already has the text. So the pipeline lifts the embedded layer for free when it exists and only pays for OCR on real scans, at higher DPI, where it is actually needed:

```python
words = page.get_text("words")
if page.rotation in (0, None) and len("".join(w.text for w in words)) >= 40:
    text, dpi = lift_text_layer(words), 200   # free, zero OCR error
else:
    text, dpi = ocr(render(page, dpi=300)), 300   # scans only, more pixels
```

**Native-first reading skips OCR on about 70% of pages, at zero OCR error wherever a real text layer exists.**

Tables get a real cell grid (a table-structure model matches words to cells by geometry, so the columns survive), and a hallucinated 200-column table gets dropped while the rest of the document stays: empty beats invented. Repeated images like logos and hazard symbols are captioned once by a vision model, then content-hash cached, so nobody pays twice to describe the same picture.

**The queue is the database.** No Kafka, no Celery, no Pub/Sub. A document is a row with a `status`, and workers claim work with one Postgres primitive:

```sql
SELECT * FROM docs
WHERE status = 'OCR_DONE'
ORDER BY updated_at DESC
FOR UPDATE SKIP LOCKED   -- many workers, one table, never the same doc twice
LIMIT 5;
```

Fewer moving parts, and one place to look when something runs late. A weighted fair queue picks which use case to serve next, so a one-time bulk load of 80k certificates can't starve the scientist waiting on a single new report.

**Retrieval is three searches, not one.** Semantic (multilingual vectors, so a French query finds an English doc), full-text (for the patent number a vector blurs), and title. Then a small-to-big ladder. A hit surfaces the exact page; from there the agent greps inside a known doc, fetches specific pages, and pulls a whole document only when it's short. A shared character budget caps the lot, so nothing overflows the model.

Access is enforced inside the query itself. Two people from two teams ask the same question and get answers from two different slices of the corpus, and neither one can tell the other slice exists.

## Who has this problem

Wiring an AI to a folder of documents is an afternoon demo. Making it faithful to tables, sourced on every sentence, airtight on access, and exhaustive on multi-part questions is a different job.

The architecture transfers as-is. Anyone with a decade of documents nobody can search has the reading and retrieval problem: pharma dossiers, contract and KYC files, legal clauses, insurance claims in five layouts. And anyone whose AI answers look complete while they aren't has the perseverance problem. That's the part almost nobody builds, because it lives in the agent loop, where prompting can't reach.
