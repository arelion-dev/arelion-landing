---
title: "Catching silent regressions in an AI agent (evals, golden sets, LLM judges)"
date: "2026-07-02T14:15:00.000Z"
description: "An agent gets quietly worse without ever throwing a compile error. Here is the two-track eval harness I built to catch that: a golden set mined from production, trajectory metrics, and an LLM judge wired as a client-side CustomMetric."
tags: ["Agent eval", "LLM judge", "Testing"]
private: true
---

An AI agent gets worse without throwing one error. Someone tightens a system prompt. The model rolls forward under a stable alias nobody pinned. A retrieval filter picks up one stricter field, or a dependency bumps the embedding model, and the answers start to degrade where no unit test can see them. The suite stays green because the agent still returns fluent English. Six weeks later a user says "it used to find that."

This is the two-track eval harness I built to catch that drift. I shipped it for an enterprise document agent at a global enterprise, on top of Google ADK and the Vertex AI Gen AI Evaluation Service. Here's what's in it, and what I got wrong building it.

## An agent's failure mode is drift

There's no type system for "the answer got slightly worse." The one thing that survives a prompt tweak is a graded set: a fixed list of questions, each carrying a confirmed correct answer and a confirmed correct tool path, re-run on every change and diffed against the last run.

The harness is a separate module that never imports the agent's code. All it knows is an address, either a deployed Vertex AI Agent Engine resource or a local `adk api_server` on `127.0.0.1:8000`. It calls the agent the way any client would.

```bash
AGENT_EVAL_MODE=local  LOCAL_AGENT_BASE_URL=http://127.0.0.1:8000  python -m src.agent_eval.agent_track
AGENT_EVAL_MODE=remote TARGET_AGENT_KEY=rag_agent                  python -m src.agent_eval.agent_track
```

**Opinion: an eval harness that imports the agent is just a unit test with extra steps.** Keeping it out of process means I can grade any agent version, running anywhere, with no redeploy and no rebuild.

## Two tracks, because "the answer looked right" and "retrieval found the document" are different questions

An agent can write a plausible, well-cited answer while retrieval silently missed the one document that mattered, and the agent-level score stays high even though the system is broken. That's why there are two independent tracks.

The **agent track** replays whole conversations against the running agent. The **retrieval track** skips the LLM completely and calls the search tools directly over MCP, against a golden mapping of query to expected documents. With no model in the loop to reason its way around a miss, the result is binary: the document either came back in the top k or it didn't.

```python
def score_case(case, hits, total):
    """Compute found/recall for one case's search hits (top case.k only)."""
    top_k_ids = {str(h.get("external_id") or h.get("referred_doc") or "") for h in hits[: case.k]} - {""}
    expected = set(case.expected_doc_ids)
    matched = expected & top_k_ids
    recall = (len(matched) / len(expected)) if expected else 1.0
    return bool(matched), recall, sorted(top_k_ids)
```

The track also runs an ablation. A case can carry filters that a human confirmed are legitimate (the user really did ask for a date range), and the runner then fires the query twice, once with the filters and once without, to compare the two:

```python
@property
def looks_over_restricted(self) -> bool:
    """True when stripping filters finds the expected doc but filtering did not."""
    return bool(self.unfiltered_found_expected) and not self.found_expected
```

Same query and same index, with a single argument changed. That turns "the filtering step is too aggressive" into a directly attributable finding rather than a hunch. The track prints `recall@k`, `found_rate` and `over_restricted_rate`, and it names every case that failed.

## The golden set comes out of production

Synthetic eval questions only test the corpus you imagine. They come out too clean. Real users bring typos, sentences that switch between French and English halfway through, questions that pin a document in turn 1 and refer back to it in turn 6, and half a dozen things you'd never invent. That's exactly where an agent breaks.

So every case gets mined from the production telemetry, which lands in BigQuery. I pull a real past session, confirm its answer against the source document by hand, then pin it as a permanent regression case. An annotator UI handles the conversion: it loads the session, lets a human edit the turns, tool calls, tool responses and session state, then writes one `annotation-conversation-*.json` per conversation. The harness only picks up what a human has marked done:

```python
done = [a for a in set_annotations if a.get("status") == "done"]
if not done:
    LOGGER.warning("Annotator eval set %r has no 'done' conversations; skipping", eval_set_id)
    continue
```

The on-disk format reuses ADK's own `EvalSet` / `EvalCase` Pydantic schema. Here's the canonical case, anonymized. It's a four-part question, and the behaviour I expect is to register a coverage checklist, run one search per entity, then tick them off.

```json
{
  "eval_id": "four_bases_perf",
  "conversation": [{
    "user_content": { "role": "user", "parts": [{ "text":
      "Document the performance of these four product lines: A, B, C, D. For EACH base cite a source, or say 'no data found'. Search by line name rather than the project name (it is new, 0 results)." }] },
    "final_response": { "role": "model", "parts": [{ "text":
      "A: panel report EV-3521 p.4. B: workshop note NC-1102 p.2. C: panel report EV-3521 p.7. D: no data found for this base. Every base was searched on its own, no blended query." }] },
    "intermediate_data": {
      "tool_uses": [
        { "name": "track_coverage",  "args": { "subgoals": ["A", "B", "C", "D"] } },
        { "name": "semantic_search", "args": { "query": "base A performance panel test" } },
        { "name": "semantic_search", "args": { "query": "base B performance panel test" } },
        { "name": "semantic_search", "args": { "query": "base C performance panel test" } },
        { "name": "semantic_search", "args": { "query": "base D performance" } },
        { "name": "track_coverage",  "args": { "covered": ["A", "B", "C", "D"] } }
      ]
    }
  }],
  "session_input": { "app_name": "rag_agent", "user_id": "eval_user", "state": { "database": "corpus" } }
}
```

Notice the `"no data found"` in the reference answer. **An eval set that only rewards found answers trains you to build an agent that never admits a gap.** The silence of the corpus is part of the ground truth too.

## Two scores per turn: the path it took, and the answer it gave

Each replayed turn becomes a row: `prompt`, `response`, `reference`, `predicted_trajectory` and `reference_trajectory`. Six trajectory metrics score the trajectory pair through the Gen AI Evaluation Service: `trajectory_exact_match`, `trajectory_in_order_match`, `trajectory_any_order_match`, `trajectory_precision`, `trajectory_recall`, `trajectory_single_tool_use`. Together they answer one question: did it call the right tools in a sensible order, without a pile of redundant calls?

Answer quality gets an LLM judge with a strict rubric, declared in the same versioned experiment config as the dataset itself:

```json
{
  "experiment_name": "agent-eval-rag-quality",
  "dataset": "configurations/eval_sets",
  "metrics": [
    { "type": "builtin", "name": "trajectory_exact_match" },
    { "type": "builtin", "name": "trajectory_precision" },
    { "type": "builtin", "name": "trajectory_recall" },
    { "type": "builtin", "name": "rouge_1" },
    {
      "type": "llm_judge",
      "name": "answer_correctness",
      "model": "gemini-3.5-flash",
      "system_prompt": "You are a strict evaluator of a document-retrieval assistant. Judge only whether the agent's answer is factually consistent with the reference answer. Ignore differences in wording, length, or style.",
      "prompt_template": "Question:\n{prompt}\n\nReference answer:\n{reference}\n\nAgent answer:\n{response}\n\nScore from 0.0 (contradicts or misses the reference) to 1.0 (fully consistent). Respond with a single JSON object: {\"score\": <float>, \"explanation\": <one short sentence>}.",
      "params": { "temperature": 0 }
    }
  ]
}
```

A single file in git holds which dataset, which metrics, which judge and at what temperature, so every run of that config stays comparable to every other. Results land in Vertex AI Experiments, which gives me run-over-run comparison right in the Cloud Console with no dashboard to build.

## The judge runs client-side, and that was forced on me

Vertex's native model-based judge, `PointwiseMetric`, runs server-side on Google's own autorater. Its `autorater_model` field only accepts a Vertex publisher model or endpoint, which means you can't point it at a private model gateway. In a regulated enterprise that gateway is mandatory. It's where auth, quota, logging and model allowlisting all live.

So the judge became a `CustomMetric` whose function runs inside my process and calls the gateway through a LiteLLM-backed client:

```python
def build_llm_judge_metric(spec) -> CustomMetric:
    config = LLMConfig(id=spec.name, model=spec.model,
                       system_prompt=spec.system_prompt, params=spec.params)

    def metric_function(row: dict) -> dict:
        prompt = _render_prompt(spec.prompt_template, row)   # {prompt} {response} {reference} ...
        try:
            verdict = _get_llm_client().completion_content(
                config=config, input=prompt, response_format=LLMContentEnum.JSON)
            if not isinstance(verdict, dict) or "score" not in verdict:
                raise ValueError(f"judge did not return a JSON object with a 'score': {verdict!r}")
            return {spec.name: float(verdict["score"]),
                    f"{spec.name}/explanation": verdict.get("explanation", "")}
        except Exception as exc:  # one bad row must not abort the whole eval run
            LOGGER.warning("llm_judge metric %r failed on a row: %s", spec.name, exc)
            return {spec.name: math.nan, f"{spec.name}/explanation": f"error: {exc}"}

    return CustomMetric(name=spec.name, metric_function=metric_function)
```

Two details matter more than the wiring. First, the judge has to return `{"score": 0..1, "explanation": "..."}`, and the explanation gets its own column, so a bad score is readable instead of just low. Second, a judge failure scores that one row `NaN` and drops the error into the explanation column. **A 200-case run that aborts on row 137 because one gateway call timed out is worse than useless, because you'll stop running it.**

> **War story.** Trajectory metrics used to crash the whole run on one case: a plain greeting, "Hi, what can you help me with?", whose reference trajectory is correctly an empty list. The Gen AI Evaluation Service encodes "no tool calls expected" as an unset field, then rejects the row as invalid and fails the entire call. The fix scores trajectory metrics in a separate `EvalTask` over only the turns with a non-empty reference trajectory, then merges the two metric tables back on `(eval_set_id, eval_id, turn_index)`:
>
> ```python
> scoreable = dataset[dataset["reference_trajectory"].map(bool)]
> if skipped := len(dataset) - len(scoreable):
>     LOGGER.warning("Skipping trajectory metrics for %d turn(s) with an empty reference_trajectory", skipped)
> ```
>
> "Expected: nothing" is a legitimate expectation, and most eval tooling doesn't model it.

## The A/B lever is one environment variable

The agent's perseverance layer (a coverage checklist plus a gate that blocks a premature final answer) ships with a kill switch, `PERSEVERANCE_OFF=1`, that disables budget scaling and the gate in one go. It doubles as a production escape hatch, and it's the only honest way to claim the feature actually helped:

```bash
PERSEVERANCE_OFF=1 EXPERIMENT_NAME=perseverance-off python -m src.agent_eval.agent_track
PERSEVERANCE_OFF=0 EXPERIMENT_NAME=perseverance-on  python -m src.agent_eval.agent_track
```

Nothing changes between the two runs except that one flag. Then you read the delta in Vertex AI Experiments. **With the gate off, the graded set scored 0.41 on completeness; with it on, 0.98 (illustrative).** Without that switch I'd only have a belief that the feature helped. The switch gives me a number a sceptical reviewer can reproduce.

Every behavioural feature in an agent should ship with its own off switch for this reason. It costs one `if` statement, and it turns an opinion into a measurement.

## Honest limits

**An LLM judge drifts.** It's a model, and models change under stable aliases. A judge that scores 0.7 today and 0.8 in November might be telling you about a change in the judge rather than in the agent. Pin the judge model to an explicit version, set `temperature: 0`, and treat any judge bump as its own change to A/B test.

**A graded set measures what you put in it.** Nothing else. The harness is the fast part; the coverage of the set is the real work, and it never really ends. Every production incident should close with a new pinned case, or the same class of bug comes back around.

**Trajectory exact match punishes valid paths.** An agent that finds the same document through `full_text_search` instead of `semantic_search` scores zero on `trajectory_exact_match` while being completely correct. Read it alongside `trajectory_recall` and the judge, and never gate a deploy on it alone.

**Retrieval recall@k is deliberately blunt.** k defaults to 10, so it asks "did the document come back at all" and not "was it ranked first". Real ranking quality needs graded relevance, and I didn't build that set.

## Who has this problem

Anyone who has shipped an LLM feature and later changed the prompt, which is everyone. The pain gets sharper with regulated corpora and multi-part questions: pharma dossiers, clause libraries, KYC files, claims handling. When a wrong answer costs a decision instead of a click, you need a graded set well before you need a nicer UI.
