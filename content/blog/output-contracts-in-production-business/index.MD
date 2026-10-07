---
title: "Output contracts in production"
date: "2025-10-23T08:35:00.000Z"
description: "Thousands of staff ask live company data a question in plain language and get a checked answer, with 0 incidents from bad AI output."
tags: ["AI", "Business"]
private: true
---

In most companies, a question about the numbers means a request to the data team and a wait. I build the layer that lets staff ask live company data in plain language and get the answer themselves, with one promise held in code: a wrong or forbidden answer never reaches them. It serves thousands of people at a global enterprise.

**Downstream incidents from bad AI output: 0.**

## Where the time goes today

Analysts answer the same kinds of questions again and again, and everyone else waits for them. Handing the database to an AI looks like the fix, but an AI that is right 95% of the time is the risky kind: the wrong 5% looks exactly like the right answers, gets pasted into a report and acted on.

## What changes

- **People get their own answers.** A plain question returns a figure from live data, without a ticket.
- **Every answer can be traced.** Each number links to the exact query behind it, so checking takes seconds.
- **Nobody sees data they are not cleared for.** Access is enforced at the query level, and the AI cannot widen its own view.
- **The AI can read, never write.** Writing, deleting and every other dangerous action is refused in code.
- **Any model works.** Swap the model for cost or quality and these rules still hold.

One limit: a good question is sometimes refused instead of answered badly. A refused question costs a retry; a wrong answer to the wrong person costs trust.

## What I can do

I wire these guardrails into your stack, around whatever model you run. The AI proposes answers, and my code decides which ones reach a user.

Want me to look at where your AI output goes, in writing?
