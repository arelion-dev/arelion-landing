---
title: "A second brain for the newsroom"
date: "2026-08-07T10:00:00.000Z"
description: "A national news outlet where staff ask, in plain language, what the institution already knows. Twelve years of articles and every desk's operating knowledge, in one place that answers with a citation."
tags: ["Second brain","RAG"]
private: true
---

A beat reporter retires on a Friday. On Monday, over a decade of context is gone: which official talks off the record, which claim blew up in 2016, why the outlet stopped covering a story a certain way. Nobody wrote it down, because it lived in one head. A national news outlet, over a decade old and 500,000+ published articles deep, was losing this every time someone resigned.

I designed and built its second brain: one place where any staffer asks a question in plain language and gets an answer grounded in a citation, across two layers. An internal operational brain, so the institution's knowledge survives the people who hold it. And an external layer, the published archive made queryable.

**The newsroom is no longer hostage to what lives in one person's head.**

## The knowledge that walks out the door is the expensive kind

Every desk ran on undocumented memory. Business development knew which deals had been tried. Editorial knew the history of a beat. Video and social knew what worked and what got pulled. IT knew why a fragile process was fragile. None of it was searchable. The cost showed up twice: onboarding a new hire took weeks of asking around, and when a senior person left, their context left with them for good.

**Onboarding a new hire dropped from weeks to days.**

## One question box over two layers

I built a single plain-language interface over two bodies of knowledge, so a staffer never has to know where an answer lives.

- The **internal operational brain**, built day one: process docs, desk notes, and institutional memory across business development, editorial, video, social, and IT.
- The **external layer**: 500,000+ published articles, made queryable across over a decade.

Ask "what did we publish on this politician", "who covered this beat in 2019", or "what is our process for X", and the same agent answers from whichever layer holds it.

**Answers in seconds across 500,000+ articles and over a decade of desk knowledge.**

## Every answer is grounded, or it is not said

The mechanism is the same for both layers. Documents and desk knowledge are chunked and embedded with a multilingual model, so a question in one language finds a source in another. Retrieval is hybrid: semantic search for meaning, full-text search for exact names and terms. A Gemini-based agent reads the retrieved passages and answers in plain language, and every answer carries a citation back to the source article or document. If nothing is found, it says so instead of inventing.

```text
"who covered the port privatisation beat in 2019?"
  -> hybrid retrieval over articles + desk notes
  -> entity resolution links the beat, the desk, the bylines
  -> grounded answer, cited to the source articles
```

## Entity resolution is what makes over a decade feel like one memory

A person, a party, a topic, or a policy is named a hundred different ways across over a decade and five desks. Without resolution, the archive is over a decade of disconnected fragments. I built entity resolution so a backbencher mentioned in 2013 links to the same person's appointment in 2019 and their statement last week. That is what turns "search" into "memory": the second brain connects a mention to every other mention, not just the one that shares your keywords.

## Access is enforced per desk, not promised in a policy

Not every staffer should see every desk's notes. Access is enforced on the data at retrieval time, per desk, so the agent can only ground an answer in what the asker is cleared to read. A social-desk question never surfaces a business-development note that desk was not meant to see.

> War story. The first version answered too well. It happily pulled internal desk notes into answers for anyone who asked, because access was a filter on the display, not on retrieval. The fix was to push the access check down to the retrieval layer, so restricted passages are never even candidates for grounding. Access at the edge looks fine in a demo and leaks in production.

## The honest limit: it captures what was written, not what was never said

The second brain is only as deep as what the institution actually recorded. It captures process docs, published work, and the desk knowledge people took the time to write down. The truly tacit knowledge, the instinct a reporter never articulated, still leaves with them. What changed is that far more is now capturable and findable, and there is finally a place worth writing it down into.

## Who has this problem

Any institution where the knowledge lives in senior heads and leaves when they do: hospitals, law firms, agencies, engineering teams, public bodies. The test is one question. When your most experienced person resigns, how much of what they knew can anyone else still find? If the answer is "not much", you do not have a documentation problem. You have an unbuilt second brain.
