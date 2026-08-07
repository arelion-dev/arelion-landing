---
title: "Catching silent regressions in an AI agent (evals, golden sets, LLM judges)"
date: "2026-07-02T14:15:00.000Z"
description: "An agent never throws a compile error, it just gets quietly worse. Here is the two-track eval harness I built to catch that: a golden set mined from production, trajectory metrics, and an LLM judge wired as a client-side CustomMetric."
tags: ["Agent eval", "LLM judge", "Testing"]
private: true
---

A service that breaks tells you. It 500s, the pager fires, someone rolls back. An agent that gets worse tells you nothing. Somebody tightens a system prompt, a model version rolls forward under a stable alias, a retrieval filter gets one field stricter, and the answers degrade in a way no unit test can see. Every test still passes. The agent still returns fluent English. You find out six weeks later, from a user who says "it used to find that".

I built the eval harness for an enterprise document agent at a global beauty group, on Google ADK and the Vertex AI Gen AI Evaluation Service. This is what is in it, and what I got wrong on the way.

## An agent has no compile error, it has a drift

There is no type system for "the answer got slightly worse". The only thing that survives a prompt tweak is a graded set: a fixed list of questions, each with a confirmed correct answer and a confirmed correct tool path, re-run on every change and compared against the last run.

The harness is a separate module that never imports the agent's code. It only knows an address: a deployed Vertex AI Agent Engine resource, or a local `adk api_server` on `127.0.0.1:8000`. It calls the agent exactly as a client would.

```bash
AGENT_EVAL_MODE=local  LOCAL_AGENT_BASE_URL=http://127.0.0.1:8000  python -m src.agent_eval.agent_track
AGENT_EVAL_MODE=remote TARGET_AGENT_KEY=rag_agent                  python -m src.agent_eval.agent_track
```

**Opinion: an eval harness that imports the agent is not an eval harness, it is a unit test with extra steps.** Keeping it out of process means I can grade any agent version, running anywhere, without a redeploy or a rebuild.

## Two tracks, because "the answer looked right" and "retrieval found the document" are different questions

An agent can write a plausible, well cited answer while retrieval silently missed the one document that mattered. The agent-level score stays high. The system is broken. So there are two independent tracks.

The **agent track** replays whole conversations against the running agent. The **retrieval track** calls the search tools directly over MCP, bypassing the LLM entirely, against a golden query to expected-document set. No model in the loop, no reasoning to hide behind: either the document came back in the top k or it did not.

```python
def score_case(case, hits, total):
    """Compute found/recall for one case's search hits (top case.k only)."""
    top_k_ids = {str(h.get("external_id") or h.get("referred_doc") or "") for h in hits[: case.k]} - {""}
    expected = set(case.expected_doc_ids)
    matched = expected & top_k_ids
    recall = (len(matched) / len(expected)) if expected else 1.0
    return bool(matched), recall, sorted(top_k_ids)
```

The track also runs an ablation. Each case can carry filters a human confirmed are legitimate (the user really did ask for a date range). The runner fires the query twice, with the filters and without, and compares:

```python
@property
def looks_over_restricted(self) -> bool:
    """True when stripping filters finds the expected doc but filtering did not."""
    return bool(self.unfiltered_found_expected) and not self.found_expected
```

Same query, same index, one argument different. That makes "the filtering step is too aggressive" a directly attributable finding instead of a hunch. The track prints `recall@k`, `found_rate` and `over_restricted_rate`, and names every case that failed.

## The golden set comes out of production, not out of my head

Synthetic eval questions test the corpus you imagine. They are always too clean: no typos, no French and English mixed in one sentence, no user who pins a document in turn 1 and refers to it in turn 6. Real users do all of that, and that is exactly where an agent breaks.

So every case is mined from the production telemetry, which lands in BigQuery. I pull a real past session, confirm the answer against the source document by hand, and pin it as a permanent regression case. An annotator UI does the conversion: it loads the session, lets a human edit the turns, tool calls, tool responses and session state, then writes one `annotation-conversation-*.json` per conversation. The harness picks up only what a human marked done:

```python
done = [a for a in set_annotations if a.get("status") == "done"]
if not done:
    LOGGER.warning("Annotator eval set %r has no 'done' conversations; skipping", eval_set_id)
    continue
```

The on-disk format is ADK's own `EvalSet` / `EvalCase` Pydantic schema, not a bespoke one. Here is the canonical case, anonymized: a four-part question whose expected behaviour is register a coverage checklist, run one search per entity, tick them off.

```json
{
  "eval_id": "four_bases_perf",
  "conversation": [{
    "user_content": { "role": "user", "parts": [{ "text":
      "Document the performance of these four shampoo bases: A, B, C, D. For EACH base cite a source, or say 'no data found'. Search by base name, not by the project name (it is new, 0 results)." }] },
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

Note the `"no data found"` in the reference answer. **An eval set that only rewards found answers trains you to build an agent that never admits a gap.** The silence of the corpus is part of the ground truth.

## Two scores per turn: the path it took, and the answer it gave

Each replayed turn becomes a row with `prompt`, `response`, `reference`, `predicted_trajectory` and `reference_trajectory`. Six trajectory metrics score the trajectory pair through the Gen AI Evaluation Service: `trajectory_exact_match`, `trajectory_in_order_match`, `trajectory_any_order_match`, `trajectory_precision`, `trajectory_recall`, `trajectory_single_tool_use`. They answer "did it call the right tools, in a sensible order, without a pile of extra calls".

Answer quality gets an LLM judge with a strict rubric, declared in the same versioned experiment config as the dataset:

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

One file in git holds which dataset, which metrics, which judge, at what temperature, so every run of that config is comparable to every other. Results land in Vertex AI Experiments: run-over-run comparison in the Cloud Console, no dashboard to build.

## The judge runs client-side, and that was forced on me

Vertex's native model-based judge, `PointwiseMetric`, runs server-side on Google's own autorater. Its `autorater_model` field only accepts a Vertex publisher model or endpoint, so it cannot be pointed at a private model gateway. In a regulated enterprise that gateway is not optional: it is where auth, quota, logging and model allowlisting live.

So the judge is a `CustomMetric` whose function runs in my process and calls the gateway through a LiteLLM-backed client:

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

Two details matter more than the wiring. The judge must return `{"score": 0..1, "explanation": "..."}`, and the explanation gets its own column, so a bad score is readable rather than just low. And a judge failure scores that single row `NaN` with the error in the explanation column. **A 200-case run that aborts on row 137 because one gateway call timed out is worse than useless, because you will stop running it.**

> **War story.** Trajectory metrics used to blow up the whole run on one case: a plain greeting, "Hi, what can you help me with?", whose reference trajectory is correctly an empty list. The Gen AI Evaluation Service represents "no tool calls expected" as an unset field and rejects the row as invalid. It does not skip it, it fails the call. The fix: score trajectory metrics in a separate `EvalTask` over the turns with a non-empty reference trajectory, then merge the two metric tables back on `(eval_set_id, eval_id, turn_index)`:
>
> ```python
> scoreable = dataset[dataset["reference_trajectory"].map(bool)]
> if skipped := len(dataset) - len(scoreable):
>     LOGGER.warning("Skipping trajectory metrics for %d turn(s) with an empty reference_trajectory", skipped)
> ```
>
> The greeting case is still graded on answer quality, and simply has no trajectory score. The lesson generalises: "expected: nothing" is a legitimate expectation that most eval tooling does not model.

## The A/B lever is one environment variable

The agent's perseverance layer (a coverage checklist plus a gate that blocks a premature final answer) ships with a kill switch, `PERSEVERANCE_OFF=1`, which disables budget scaling and the gate at once. It is a production escape hatch, and the only honest way to claim the feature helped:

```bash
PERSEVERANCE_OFF=1 EXPERIMENT_NAME=perseverance-off python -m src.agent_eval.agent_track
PERSEVERANCE_OFF=0 EXPERIMENT_NAME=perseverance-on  python -m src.agent_eval.agent_track
```

Same graded set, same corpus, same judge, one flag. Then read the delta in Vertex AI Experiments. **With the gate off, the graded set scored 0.41 on completeness; on, 0.98 (illustrative).** Without the switch I would have had a belief. With it I have a number a sceptical reviewer can reproduce.

Every behavioural feature in an agent should ship with its own off switch for exactly this reason. It costs one `if` statement and it converts opinion into measurement.

## Honest limits

**An LLM judge drifts.** It is a model, and models change under stable aliases. A judge scoring 0.7 today and 0.8 in November may be telling you about the judge, not the agent. Pin the judge model to an explicit version, set `temperature: 0`, and treat a judge bump as its own change to A/B test.

**A graded set measures what you put in it.** Nothing else. The harness is the fast part; the coverage of the set is the real, permanent job. Every production incident should end with a new pinned case, or the same class of bug comes back.

**Trajectory exact match punishes valid paths.** An agent that finds the same document with `full_text_search` instead of `semantic_search` scores zero on `trajectory_exact_match` while being entirely correct. Read it alongside `trajectory_recall` and the judge, never alone, and never gate a deploy on it.

**Retrieval recall@k is deliberately blunt.** k defaults to 10, which asks "did it come back at all", not "was it ranked first". Ranking quality needs graded relevance, and I did not build that set.

## Who has this problem

Anyone who has shipped an LLM feature and then changed the prompt, which is everyone. The pain sharpens with regulated corpora and multi-part questions: pharma dossiers, clause libraries, KYC files, claims handling. If a wrong answer costs a decision rather than a click, you need a graded set before you need a nicer UI.
