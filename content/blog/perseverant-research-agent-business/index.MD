---
title: "The research agent that doesn't give up"
date: "2026-08-05T11:00:00.000Z"
description: "An AI that answers questions from your own documents, cites a source on every line, and does not stop until it has answered all of your question, not just the easy part."
tags: ["AI", "Business"]
private: true
---

Ask your chatbot to compare four things and it answers about two, fluently, and stops. I build the autonomous RAG research agent that does not: it answers every part of a multi-part question from your own documents, and cites each claim to the exact page. I shipped it for a global beauty group, across decades of its own reports, patents and contracts, most of it locked in scans nobody could search.

## The confident half-answer is the one that costs you

A scientist asks to compare four shampoo bases. The AI describes two, sounds certain, and stops. Nobody notices the other two are missing until a formulation is chosen on half the data.

A blank answer gets double-checked. A fluent, half-complete one gets trusted and acted on: a clause from the wrong file, a limit buried on page 40, a cost that stays invisible until it is not. You are already paying for this, in redone work and in decisions made on partial evidence. It never shows up in a demo. It shows up weeks later, when someone reopens the file.

## What you get

- **Answers that cover the whole question.** Ask about four things, get four sourced answers, not the first two it found.
- **A source on every line.** Every claim points to the exact page, or the agent says "no data found" where your documents are silent. No invented facts.
- **Decades of dead documents made searchable.** Scans, a dozen languages, born-digital, all one queryable corpus.
- **Multi-part answers went from roughly 40% to 98% complete, with 0 silent half-answers in production.** (illustrative)
- **Hours of document hunting collapse to one sourced answer**, now used across 4 teams.

## Why it holds

- **It answers from your documents, never from memory.** If it is not in your corpus, it is not said.
- **It only sees what each person is cleared to see.** Access is enforced on the data itself, not promised in a policy.
- **The gain is measured, not claimed.** A switch turns the diligence off, so I run the same graded questions both ways and read the delta. Built on Google ADK, so the "do not answer while a part is still open" rule is control flow, not a hopeful prompt.
- **One honest boundary:** this is built for questions your documents can actually answer. It will tell you when they cannot, rather than guess.

## Who this is for

Anyone sitting on a decade of unsearchable documents: pharma dossiers, banking KYC files, legal clause libraries, insurance claims. And anyone whose AI already gives answers that look complete but are not.

Want me to look at yours, in writing?
