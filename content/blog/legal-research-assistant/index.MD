---
title: "A legal research assistant"
date: "2025-11-13T17:05:00.000Z"
description: "A legal-research assistant for a jurisdiction's legislation, built so it can only answer from law that actually exists. The interesting part is not the chat, it is the code that stops the chat from citing a law it cannot prove."
tags: ["Tech", "AI"]
private: true
---

A lawyer does not want a summary of the law. They want the exact article, by number, that holds up when a regulator reads it back. "The tool said so" is not something a regulator accepts, so a research tool that cannot name the article, and prove it exists, has done nothing useful.

I designed and built a legal-research assistant over a jurisdiction's legislation. Every answer cites a real article with a clickable source url, or says plainly that it cannot. The chat is table stakes. The part worth writing about is the code that makes the chat structurally unable to cite a law it cannot prove.

**0 hallucinated citations reach the user.**

## A single fabricated citation ends the product

When a lawyer reads "Article 12 of Decree No. 4 of 2022" inside a confident paragraph, they act on it. If that article does not exist, if the number is off by one, or if the text belongs to a neighbouring jurisdiction, the tool has not saved time. It has planted a landmine in someone's advice.

Language models are fluent by design, and fluency is the failure mode: the wrong answer looks identical to the right one. Ask a raw Gemini call for "the article on early termination penalties" and it will happily produce "Article 34, Decree No. 9 of 2019", correct format, plausible number, cited with total confidence, and no such article on the books. In a regulated field the bar is not "usually correct". One fabricated reference, surfaced once, ends trust in the whole product.

My opinion, and the whole design rests on it: you never let the model produce the citation. You let it produce a *request* to cite, and you verify that request against data you control. Retrieve, then verify. The model reasons about the question. It never gets to assert what the law says.

## The model reasons, the database owns the words

I built the assistant as a Gemini agent on Google's Agent Development Kit (ADK), driving the loop with Gemini 2.5 Flash for tool selection and a Pro pass for the final drafting. It never speaks freely about the law. It works through three tools, and only three:

```python
# The agent never receives free text it can paraphrase as "the law".
# It gets tools. Each returns structured data, not prose.
tools = [
    search_legislation,  # Vertex AI Search over the corpus, returns law ids + snippets
    open_article,        # exact (law_id, article_no) read from Postgres, verbatim text
    cite_law,            # emits a citation request, which runs the gate before render
]
```

Search runs on **Vertex AI Search** over the corpus. Every verbatim quote of legal text comes back from a **Postgres 15** database through **Prisma**, keyed by `(law_id, article_no)`, never from the model's memory. The tools are exposed to the agent over MCP, so the same verified surface backs the chat UI and any downstream integration.

That separation is the whole lever. The model does the reasoning. The database owns the words. On top of it sits what I call the **citation gate**: three checks that every citation clears before it can render. None of them ask the model anything. They are plain code against retrieval output and the corpus.

**Every answer cites a real article, or says it cannot.**

## Gate check 1: the allowlist drops invented laws

When the agent decides to cite, I do not trust the law id it produces. I intersect it with the exact set of law ids that retrieval just returned for *that* question. Anything outside that set never came from the corpus, so it cannot be cited.

```python
def enforce_allowlist(citations, retrieved_ids):
    # retrieved_ids: law ids Vertex AI Search returned for THIS query, this turn
    allowed = set(retrieved_ids)
    kept = []
    for c in citations:
        if c.law_id in allowed:
            kept.append(c)
        else:
            # invented, or pulled from training data. It never surfaced. Drop it.
            log.warning("dropped citation %s: not_in_retrieval", c.law_id)
    return kept
```

The set is scoped to the turn, not the whole corpus. A law that exists but that this query did not retrieve is still dropped, because a citation the model could not reach through search is a citation it guessed. Guessing is exactly what I am removing.

## Gate check 2: prove the article number or drop it

A real law does not make a real article. The model loves to attach a crisp "Article 47" to a law that stops at Article 40. So for every surviving citation I look up the precise `(law_id, article_no)` pair in the versioned corpus. If the pair is not there, I keep the law reference and null the number, rather than let a fabricated article stand.

```python
async def verify_article(law_id, article_no):
    row = await db.article.find_first(where={
        "law_id": law_id,
        "number": normalize_article_no(article_no),  # see the war story below
        "status": "current",
    })
    if row is None:
        # law is real, this article number is not proven. Downgrade, do not invent.
        return Citation(law_id=law_id, article=None, downgraded=True)
    return Citation(law_id=law_id, article=row.number, source_url=row.source_url)
```

A citation is only as specific as what I can prove. A downgraded citation still points at a real law on the official portal, it just refuses to name an article it cannot find.

> War story. The article proof silently dropped valid citations for two days. Legislation numbering is not clean integers: the corpus holds "47", "47 bis", "47 mükerrer", roman-numeral chapters, and articles that were repealed and reissued. The model emitted "Article 47 bis", my lookup compared it as the integer 47, missed, and downgraded a perfectly real article. The fix was a `normalize_article_no` that canonicalizes the suffix forms and matches on the stored string, not a parsed int. Lesson: in a legal corpus the identifier is a string with domain rules, and treating it as a number is a bug waiting for the one query that needs "bis".

## Gate check 3: broaden the jurisdiction, but flag it

The corpus does not cover every regime equally, and passing one jurisdiction's law off as another's is the classic silent error. When a filtered search matches nothing, it auto-broadens to a library-wide search and returns a `broadened` flag, which the model is forced to disclose.

```python
def search_legislation(query, jurisdiction):
    hits = vertex_search(query, filter=f'jurisdiction = "{jurisdiction}"')
    if hits:
        return {"hits": hits, "broadened": False}
    # nothing under the asked jurisdiction. Fall back, but never pretend coverage.
    hits = vertex_search(query, filter=None)
    return {"hits": hits, "broadened": True}
```

The flag is not cosmetic. A `broadened: True` result changes the answer contract: the model must state that its jurisdiction filter matched zero results and that these are library-wide hits, not a match for what was asked. Silent broadening is how you tell a lawyer in one emirate that a rule from another one applies to them. The flag makes that failure impossible to hide.

**Three independent checks run before a citation renders.**

## The trust chain: SHA-256 from source to answer

Content is ingested only from official government legislation portals, parsed into laws and articles, and fingerprinted with SHA-256 at the article level. When a source republishes, the digest changes, a new version row is written, and the old one is retained. Nothing enters the answer path that did not come from an official text with a traceable version.

```python
digest = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
existing = await db.article.find_unique(law_id=law_id, number=article_no)

if existing is None:
    await db.article.create(law_id, article_no, text=raw_text, sha256=digest, version=1)
elif existing.sha256 != digest:
    # official source republished the text. Version it, keep the prior one.
    await db.article.create(law_id, article_no, text=raw_text,
                            sha256=digest, version=existing.version + 1, status="current")
    await db.article.update(existing.id, status="superseded")
# identical digest -> no write. The corpus stays byte-stable across re-ingests.
```

Because the fingerprint is content-addressed, a re-ingest of an unchanged portal is a no-op, and a changed article is a new version instead of an in-place overwrite. Every citation the gate emits carries the `source_url` and the version of the exact bytes it quoted, so an answer is reproducible even after the law is amended.

On top of that, the prompt rules forbid inventing law, decree, or article numbers, and force a clean split: "the law states", which is sourced through the tools, versus "generally", which is the model's own knowledge, labelled as such. The prompt is the weakest layer and I treat it that way. It is a courtesy to the model, not a control. The three gates are the control.

**Every legal quote is fingerprinted and versioned, source to answer.**

## What it refuses to do

Honest limit: the gate makes some answers less specific than a sharp human would give. When the article number will not verify, I drop it and keep only the law, so a reader sometimes gets "this law governs the point" instead of "Article 47 governs it". I chose a correct, coarser answer over a precise-looking guess. The other edge is coverage: the assistant will not answer for a regime that is not in the corpus. It broadens, flags, and defers, rather than reach for a law it does not hold.

The cost of this stance is real. A confident competitor that skips the gate will look sharper on a demo, because it always names an article. It is right up until the one time it is not, and that one time is the whole liability. I would rather ship the tool that occasionally says "I can only confirm the law, not the article" than the one that is impressive and wrong once a quarter.

## The result

The assistant answers with footnotes that resolve to real laws on an official portal, with p95 latency around two seconds for a single-part question. When it cannot verify something, it says so: no matching legislation, an article number it will not confirm, a jurisdiction outside its coverage. A user who asks about the wrong emirate is told the coverage does not extend there, not handed a confident paragraph quoting a law that governs somewhere else.

An answer with a footnote can be checked in one click. An answer without one announces its own limits.

**Research time on a cited point is down about 60%.**

## Who has this problem

I do not treat grounding as a feature you add at the end. I treat "can this claim be verified against a source I control" as the shape of the system from the first line. Retrieve, then verify, is not a wrapper around the model. It is the architecture, and the model is a component inside it.

If your team answers questions out of a body of rules, this is your problem wearing a different suit. A compliance officer who must cite chapter and verse to a regulator, not "the tool said so". Medical guidelines, tax rules, safety standards: wherever a wrong-but-fluent answer carries real cost, the same pattern holds. Retrieve from a trusted, versioned corpus. Let the model reason, never invent. Intersect every citation with what was found. Prove the specifics against a database. And make the system say plainly when it does not know.
