---
title: "A legal research assistant"
date: "2026-08-07T10:00:00.000Z"
description: "A legal-research assistant for a jurisdiction's legislation, built so it can only answer from law that actually exists. The interesting part is not the chat, it is the code that stops the chat from citing a law it cannot prove."
tags: ["Tech", "AI"]
private: true
---

I designed and built a legal-research assistant over a jurisdiction's legislation. It answers questions about the law with clickable footnotes, and each footnote resolves to a real article with a real source url.

The chat is table stakes. The part worth writing about is everything that stops the chat from making things up.

## The failure that ends the product

A legal chatbot that invents case law is worse than no chatbot at all. When a lawyer reads "Article 12 of Decree No. 4 of 2022" in a confident paragraph, they act on it. If that article does not exist, if the number is off by one, or if the text belongs to a neighbouring jurisdiction, the tool has not saved time. It has planted a landmine in someone's advice.

Language models are fluent by design, and fluency is the failure mode here: the wrong answer looks identical to the right one. In a regulated field the bar is not "usually correct". A single fabricated reference, surfaced once, ends trust in the whole product.

So the question was never how to make the model talk about law. It was how to make it structurally unable to cite a law that is not in front of it.

## The model reasons, the database owns the words

I built the assistant as a Gemini agent on Google's ADK, but it never speaks freely about the law. It works through a small set of tools: search the legislation, open a specific article, cite a law. Search runs on Vertex AI Search over the corpus, and every quote of legal text comes back from a Postgres database through Prisma, not from the model's memory.

That separation is the whole lever. The model does the reasoning. The database owns the words. Everything below enforces the split.

## Guardrail 1: a citation allowlist

When the agent decides to cite, I do not trust the law id it produces. I intersect it with the exact set of laws that retrieval just returned for that question.

```text
cited_id in retrieved_ids  -> keep citation
cited_id not in retrieved  -> null it out
```

Any id the model invented, or borrowed from training data, is not in that set, so its citation is dropped. It cannot cite a law the search did not surface.

## Guardrail 2: prove the article number

Even for a real law, a plausible-looking "Article 47" may not exist. So I look up the precise (law, article) pair in the database. If the article is not there, I keep the law reference and drop the number, rather than let a fabricated article stand.

A citation is only as specific as what I can prove.

## Guardrail 3: honest jurisdiction

The corpus does not cover every regime equally, and passing one jurisdiction's law off as another's is a classic silent error. When a filtered search matches nothing, it auto-broadens and returns a `broadened` flag.

That flag tells the model, in plain terms, that its jurisdiction filter matched zero results, so these are library-wide hits, not a match for what was asked. It has to say so instead of pretending the coverage exists.

## Underneath: a trust chain

Content is ingested only from official government legislation sources, parsed into laws and articles, and fingerprinted with SHA-256. When a source republishes, the hash changes, a new version is written, and the old one is kept. Nothing enters the answer path that did not come from an official text with a traceable version.

On top of that, prompt rules forbid inventing law, decree, or article numbers, and force a clean split: "the law states", which is sourced, versus "generally", which is the model's own knowledge, labelled as such.

## The result

The assistant answers with footnotes that resolve to real laws on an official portal. When it cannot verify something, it says so: no matching legislation, an article number it will not confirm, a jurisdiction outside its coverage. A user who asks about the wrong emirate gets told the coverage does not extend there, not a confident paragraph quoting a law that governs somewhere else.

An answer with a footnote can be checked in one click. An answer without one announces its own limits. The tool is trustworthy precisely because it refuses to bluff.

## Who has this problem

I do not treat grounding as a feature you add at the end. I treat "can this claim be verified against a source I control" as the shape of the system from the first line.

If your team answers questions out of a body of rules, this is your problem wearing a different suit. A compliance officer who must cite chapter and verse to a regulator, not "the tool said so". Medical guidelines, tax rules, safety standards: wherever a wrong-but-fluent answer carries real cost, the same pattern holds. Retrieve from a trusted, versioned corpus. Let the model reason, never invent. Intersect every citation with what was found. Prove the specifics against a database. And make the system say plainly when it does not know.
