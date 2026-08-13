---
title: "The research agent that doesn't give up"
date: "2026-08-05T11:00:00.000Z"
description: "An AI that answers questions from your own documents, cites a source on every line, and keeps going until it has covered every part of your question, including the hard ones."
tags: ["AI", "Business"]
private: true
---

Ask your chatbot to compare four things and it answers about two, fluently, then stops. I build the research agent that doesn't: it answers every part of a multi-part question from your own documents, and cites each claim to the exact page. I shipped it for a global beauty group, across decades of its own reports, patents and contracts, most of it locked in scans nobody could search.

## Why this matters to you

A scientist asks to compare four shampoo bases. The AI describes two, sounds certain, and stops. Nobody notices the other two are missing until a formulation is chosen on half the data. A blank answer gets double-checked. A fluent, half-complete one gets trusted and acted on: a clause pulled from the wrong file, or a cost buried on page 40 that stays invisible until it surfaces.

## What it costs when it goes wrong

You're already paying for this, in redone work and in decisions made on partial evidence. None of it shows up in a demo. It surfaces weeks later, when someone reopens the file and finds the gap that a confident answer papered over.

## What actually helps

- **Answers that cover the whole question.** Ask about four things and get four sourced answers back, even the ones it has to dig for.
- **A source on every line.** Every claim points to the exact page, or the agent says "no data found" where your documents are silent. No invented facts.
- **Decades of dead documents made searchable.** Scans, a dozen languages, born-digital, all one queryable corpus.
- **Multi-part answers went from roughly 40% to 98% complete, with 0 silent half-answers in production.** (illustrative)
- **Hours of document hunting collapse to one sourced answer**, now used across 4 teams.

It answers from your documents, never from memory, so if your corpus doesn't hold it, the agent doesn't say it. It only sees what each person is cleared to see, because access is enforced on the data itself. The gain is measured too: a switch turns the diligence off, so I run the same graded questions both ways and read the delta. That "don't answer while a part is still open" rule runs on Google ADK as control flow the model can't skip. One honest boundary: this is built for questions your documents can actually answer, and it tells you when they can't rather than guess.

## What I can do

I build the agent: the reading pipeline that turns your scans into a searchable corpus, the retrieval, and the perseverance layer that forces a complete, sourced answer. I can also start smaller, with an assessment of where your current AI stops early on multi-part questions. This fits anyone sitting on a decade of unsearchable documents: pharma dossiers, banking KYC files, legal clause libraries, insurance claims. And anyone whose AI already gives answers that look complete while they fall short.

Want me to look at yours, in writing?
