---
title: "Output contracts in production"
date: "2025-10-23T08:35:00.000Z"
description: "A plain-language question becomes a live database query at a global enterprise, served to thousands of users. This is the code that never trusts a single line the model writes."
tags: ["Tech", "AI"]
private: true
---

An LLM that's right 95 percent of the time is the dangerous kind, because the wrong 5 percent looks exactly like the right 95 and runs clean. The output comes back almost valid: one field off, one line the parser chokes on, and behind it a downstream process folds. In the logs it reads fine, which is the trap.

I built the layer that stops that from reaching a user. The system lets thousands of people at a global enterprise ask questions in plain language, and turns each one into a live database query under real access rules. Text-to-SQL is the easy half. The part worth writing about is the code that treats the model as a source I never take on trust.

By the end you'll have the four pieces I ship on every project like this: a request contract that rejects unknown fields, an AST gate that judges the parsed query by node type, a tenant rewrite that fails closed, and a retry loop that blocks after one correction.

**Malformed model output caught before it runs: ~100%.**

## A model right 95 percent of the time is the dangerous kind

The wrong 5 percent looks exactly like the right 95. Ask it to count documents and it might read a neighbouring team's files. Ask it to filter by date and it might, in one plausible line, reference a table it was never meant to touch. Worse: a `DROP TABLE customers` tucked inside what reads like a simple lookup.

None of this throws an error. The query runs, returns a number, the number goes into an answer, and the answer looks confident. The business risk is the model succeeding at the wrong thing, quietly and at scale, in front of people who never see the query underneath.

The naive fixes don't hold. Telling the model to behave in the prompt is a suggestion it can ignore, and one an attacker can talk it out of. Filtering the text for bad keywords is a game you lose the first time a forbidden command is spelled a little differently: `DROP/**/TABLE`, a `drop` in mixed case, a unicode lookalike, a write buried inside a CTE.

My rule on this project: the model's output is untrusted input, exactly like a form field off the open internet. You wouldn't run a regex over user SQL and call it safe, so I hold the model to the same standard.

## The request body can't smuggle anything in

Start at the door. The request body gets validated with Pydantic v2, `model_config = ConfigDict(extra="forbid")`. That one setting is the difference between a caller who can only send `question` and `tenant_id`, and a caller who slips in an `access_groups` field the model layer later reads and trusts. Pydantic's default drops unknown fields silently, which is the wrong default for a security boundary. I want a loud 422 instead, so the caller finds out right away.

```python
# Representative, not client source.
from pydantic import BaseModel, ConfigDict, field_validator

class QueryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    question: str
    tenant_id: str

    @field_validator("question")
    @classmethod
    def non_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("question must not be empty")
        if len(v) > 2000:
            raise ValueError("question too long")
        return v

    @field_validator("tenant_id")
    @classmethod
    def opaque_id(cls, v: str) -> str:
        # tenant_id is server-issued; reject anything that is not the shape I mint
        if not v.isalnum() or len(v) != 26:
            raise ValueError("malformed tenant_id")
        return v
```

The `tenant_id` validator matters more than it looks. The tenant is a server-issued opaque id the caller can't pick freely, and the validator rejects anything that doesn't match the exact shape my code mints. That closes the "just pass another tenant's id" path before a single token reaches the model.

## The model proposes, code disposes

You don't secure a language model by asking it nicely, so I never trusted the generated text. Every query goes through one gate I call `assert_read_only`. It parses the SQL into a syntax tree with `sqlglot` before anything runs, then I walk the whole tree. A `DROP` or an `INSERT` gets rejected because the parsed shape of the query holds a node type I forbid, even three levels deep inside a subquery or a CTE, right where a keyword filter and a human reviewer both miss it.

```python
# Representative, not client source. Reject by AST node type, not by string.
import sqlglot
from sqlglot import expressions as exp

# Anything that is not a read is forbidden by TYPE, subquery depth irrelevant.
FORBIDDEN = (
    exp.Insert, exp.Update, exp.Delete, exp.Drop,
    exp.Alter, exp.Create, exp.Command, exp.Merge,
)

class Reject(Exception):
    ...

def assert_read_only(sql: str, allowed_table: str, max_limit: int) -> exp.Expression:
    try:
        tree = sqlglot.parse_one(sql, read="postgres")   # malformed -> ParseError
    except sqlglot.ParseError as e:
        raise Reject(f"unparseable SQL: {e}")

    # 1. top node must be a SELECT, nothing else is a read
    if not isinstance(tree, exp.Select):
        raise Reject(f"not a SELECT: {type(tree).__name__}")

    # 2. no write / DDL / raw command anywhere in the tree
    if next(tree.find_all(*FORBIDDEN), None) is not None:
        raise Reject("write, DDL or raw command in query")

    # 3. single-table allowlist: every real table must be the one this feature owns
    for t in tree.find_all(exp.Table):
        if t.name != allowed_table:
            raise Reject(f"table not allowed: {t.name}")

    # 4. file / network / admin functions are out (pg_read_file, dblink, copy...)
    for fn in tree.find_all(exp.Anonymous):
        if fn.name.lower() in BANNED_FUNCTIONS:
            raise Reject(f"function not allowed: {fn.name}")

    # 5. bounded result set, always
    limit = tree.args.get("limit")
    if limit is None or int(limit.expression.this) > max_limit:
        raise Reject("missing or oversized LIMIT")

    return tree
```

Why AST over regex, stated plainly: a regex reasons about characters, and SQL is a tree. `sqlglot` hands me the tree the database will actually run, so I make my decision on the same structure the engine sees. `find_all` by type means a `DELETE` inside a `SELECT ... WHERE id IN (DELETE ...)` gets caught by the same three lines that catch a top-level `DELETE`. No keyword list to keep in sync, no escaping tricks to lose to.

**Downstream incidents from bad model output since the gate shipped: 0.**

> War story. `sqlglot` parses more dialects than any one database runs. Early on it happily parsed a statement my target Postgres would also run, but a stacked-query variant slipped through my first allowlist because I keyed the check on `exp.Table.name` and missed that a schema-qualified name (`other_schema.records`) has the allowed name with a different `db`. It passed the string check and pointed at a table I did not own. The fix was to match on the fully qualified identifier, with `db` and `catalog` included. After that I stopped trusting `.name` on anything and started printing `repr(node)` while writing every allowlist.

## Access is decided in code the model cannot reach

The lever that matters most is who scopes the query, and the model never does. It writes `SELECT count(*) FROM records` as if it could see everything, then my code rewrites that `records` reference into a subquery pre-filtered to the caller's tenant and permission groups, using the tree `assert_read_only` already returned.

```python
# Representative. Rewrite the table into a tenant-scoped, permission-filtered subquery.
def scope_to_caller(tree: exp.Expression, tenant_id: str, groups: list[str]) -> exp.Expression:
    if not groups:
        # FAIL CLOSED: no resolvable permissions => match zero rows, never all rows.
        groups = ["__no_access__"]

    scoped = exp.select("*").from_("records").where(
        exp.column("tenant_id").eq(exp.Literal.string(tenant_id)),
        exp.column("access_group").isin(*[exp.Literal.string(g) for g in groups]),
    ).subquery(alias="records")

    for t in tree.find_all(exp.Table):
        if t.name == "records":
            t.replace(scoped)
    return tree
```

The model is structurally incapable of widening its own view, because it doesn't hold the pen on the part that counts. The scope gets applied after generation, to the parsed tree, by code the prompt can't address.

Fail closed, and treat it as non-negotiable. The branch that decides "no permissions resolved" has two ways to go, all rows or zero rows, and the two mistakes don't cost the same. Zero rows is a user seeing an empty result and filing a ticket. All rows is a cross-tenant data leak and a breach report. When the downside is that lopsided, you hard-code the safe branch and make the unsafe one impossible to reach rather than merely unlikely. If a user's groups can't be resolved, the rewrite injects a sentinel group that matches nothing. A bug that forgets to scope gets caught a second time on the execution side, which refuses any query whose `WHERE` doesn't carry the tenant predicate.

## Reject, correct, retry, then block

When a generated query fails validation, prompting harder won't save it. It runs through a bounded loop: reject, correct, retry, then block.

```python
# Representative. One framed correction, then a hard stop. No infinite retry.
def answer(question: str, tenant_id: str, groups: list[str]) -> Result:
    sql = generate_sql(question)                     # first attempt
    try:
        tree = assert_read_only(sql, ALLOWED_TABLE, MAX_LIMIT)
    except Reject as first:
        # feed the exact violation back once, framed, not "try again"
        sql = generate_sql(question, prior_error=str(first))
        try:
            tree = assert_read_only(sql, ALLOWED_TABLE, MAX_LIMIT)
        except Reject as second:
            log.warning("blocked after retry", extra={"err": str(second)})
            return Result.blocked(reason="could not phrase within the rules")

    tree = scope_to_caller(tree, tenant_id, groups)
    return execute(tree)                             # scoped, bounded, audited
```

The model gets exactly one framed chance to fix a genuinely malformed query, with the precise validation error fed back to it rather than a vague "that failed". If it still breaks the rules, the request gets blocked. One retry only: each retry is a full generation round trip, and a model that failed the contract twice with the error in hand won't nail it on attempt six. It'll just burn latency and tokens.

The whole thing stays model-agnostic through LiteLLM, so swapping the underlying model for cost or quality changes nothing about these guarantees. The contract lives in my code rather than in a provider's behaviour.

**One framed retry, then a hard block. Retries into the same feature dropped by roughly two thirds once the correction step landed.**

## Auditable by construction

Because the same validator runs both where queries get generated and where they get executed, a mistake has to slip past two independent checks to cause harm. The executed query sits stored next to the answer, so any number the system reports traces back to the exact SQL that produced it. When someone asks "why did the dashboard say 4,000", I can show the scoped SQL, the tenant it ran under, and the rows it counted, without re-deriving anything.

> War story. The honest limit is refusal. Sometimes a legitimate question gets blocked because the model could not phrase it within the rules, and a real user sees a dead end for a query that was perfectly reasonable. I accept that trade and I do not pretend it costs nothing. A blocked question costs a retry. A wrong answer shown to the wrong person costs trust, and in the tenant case, a breach.

## Anywhere a model's output becomes an action

None of this is specific to text-to-SQL. Think of a support bot that edits records or issues refunds, a finance pipeline that writes figures into the ledger, an ops agent calling internal APIs, or a healthcare, HR, or legal tool reading from systems with strict access rules.

In every one the shape is the same: an almost-right output that propagates unless something downstream is built to stop it. If the honest answer to "what stops a bad output from reaching a customer" is "the prompt", you've got the exact problem this was built for. The work lives in that something downstream.
