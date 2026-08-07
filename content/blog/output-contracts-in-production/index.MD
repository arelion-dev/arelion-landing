---
title: "Output contracts in production"
date: "2026-08-07T10:00:00.000Z"
description: "A plain-language question turns into a database query at a global enterprise, served to thousands of users. The interesting part is not the text-to-SQL. It is the code that never trusts a single line the model writes."
tags: ["Tech", "AI"]
private: true
---

It is 3am and a job is down. An LLM returned output that was almost valid: one field off, one line the parser choked on, and a downstream process fell over behind it. The output looked fine in the logs. It was the shape underneath that was wrong. If you have ever been paged for that, you already know the problem this piece is about.

I built the layer that makes it stop happening. The system lets thousands of people at a global enterprise ask questions in plain language and turns them into live database queries, with real access rules. The text-to-SQL is the easy half. The half worth writing about is the code that treats the model as a source I never take on trust, so that a bad output cannot reach a user.

**Malformed model output caught before it runs: ~100%.**

## A model right 95 percent of the time is the dangerous kind

The wrong 5 percent looks exactly like the right 95. Ask it to count documents and it might read a neighbouring team's files. Ask it to filter by date and it might, in one plausible line, reference a table it was never meant to touch. Worse: a `DROP TABLE customers` tucked inside what reads like a simple lookup.

None of this throws an error. The query runs, returns a number, the number goes into an answer, and the answer looks confident. The business risk is not the model crashing. It is the model succeeding at the wrong thing, quietly, at scale, in front of people who never see the query underneath.

The naive fixes do not hold. Telling the model to behave in the prompt is a suggestion it can ignore and an attacker can talk it out of. Filtering the text for bad keywords is a game you lose the first time a forbidden command is spelled slightly differently.

## The model proposes, code disposes

You do not secure a language model by asking it nicely. So I never trusted the generated text. Every query goes through one gate I call `assert_read_only`: it is parsed into a syntax tree with `sqlglot` before anything runs, then I walk the whole tree. A `DROP` or an `INSERT` is not rejected by matching strings. It is rejected because the parsed shape of the query contains a node I forbid, even three levels deep inside a subquery where a human reviewer would miss it.

```python
# Illustrative, generic. Reject by AST node type, not by string match.
import sqlglot
from sqlglot import expressions as exp

FORBIDDEN = (exp.Insert, exp.Update, exp.Delete, exp.Drop, exp.Alter, exp.Create)

def assert_read_only(sql: str, allowed_table: str, max_limit: int) -> exp.Expression:
    tree = sqlglot.parse_one(sql)                       # malformed -> raises
    if any(tree.find_all(*FORBIDDEN)):
        raise Reject("write or schema change in query")
    for t in tree.find_all(exp.Table):
        if t.name != allowed_table:                     # single-table allowlist
            raise Reject(f"table not allowed: {t.name}")
    limit = tree.args.get("limit")
    if limit is None or int(limit.text("expression")) > max_limit:
        raise Reject("missing or oversized LIMIT")
    return tree
```

The same check covers functions that read files or open network connections, and any table other than the single one this feature is allowed to read.

**Downstream incidents from bad model output since the gate shipped: 0.**

## Access is decided in code the model cannot reach

The lever that matters most is who scopes the query. The model never does. It writes `SELECT count(*) FROM records` as if it could see everything, and then my code rewrites that `records` reference into a subquery pre-filtered to the caller's tenant and permission groups. The model is structurally incapable of widening its own view, because it does not hold the pen on the part that counts.

It fails closed. If a user's permission groups cannot be resolved, the rewrite matches zero rows, never all of them. And a bug that forgets to scope is caught a second time on the execution side, which refuses any query missing the tenant filter.

## The request body cannot smuggle anything in

Around that core sits a strict request contract. The body is validated with Pydantic set to `extra="forbid"`, so a caller cannot slip in an extra `tenant_id` or an access group the code never asked for.

```python
from pydantic import BaseModel, ConfigDict

class QueryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")   # unexpected field -> reject
    question: str
    tenant_id: str
```

Anything unexpected is rejected outright, not silently ignored.

## Reject, correct, retry, then block

When a generated query fails validation, the answer is not to prompt harder. It runs through a reject, correct, retry, then block loop. The model gets one framed chance to fix a genuinely malformed query. If it still breaks the rules, the request is blocked, not bent to fit. The whole thing stays model-agnostic through LiteLLM, so swapping the underlying model for cost or quality changes nothing about these guarantees.

**One framed retry, then a hard block. Retries into the same feature dropped by roughly two thirds once the correction step landed.**

## Auditable by construction

Because the same validator runs both where queries are generated and where they are executed, a mistake has to slip past two independent checks to cause harm. The executed query is stored next to the answer, so any number the system reports traces back to the exact SQL that produced it. Auditable by construction, not by good intentions.

> War story. The honest limit is refusal. Sometimes a legitimate question gets blocked because the model could not phrase it within the rules, and a real user sees a dead end for a query that was perfectly reasonable. I accept that trade and I do not pretend it costs nothing. A blocked question costs a retry. A wrong answer shown to the wrong person costs trust, and in the tenant case, a breach.

## Anywhere a model's output becomes an action

This is not specific to text-to-SQL. A support bot that edits records or issues refunds. A finance pipeline that writes figures into the ledger. An ops agent that calls internal APIs. A healthcare, HR, or legal tool reading from systems with strict access rules. In every one, the shape is the same: an almost-right output that propagates unless something downstream is built to stop it. If the honest answer to "what stops a bad output from reaching a customer" is "the prompt", you have the exact problem this was built for. The work is in the something downstream.
