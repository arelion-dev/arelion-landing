---
title: "Catching silent regressions in an AI agent (evals, golden sets, LLM judges)"
date: "2026-07-02T14:15:00.000Z"
description: "Every prompt or model change re-tested on real cases before users see it, so a silent drop is caught on the change that caused it."
tags: ["Agent eval", "Business"]
private: true
---

An AI assistant does not break loudly. Someone edits a prompt, the provider ships a new model under the same name, and the answers get slightly worse while every test still passes. You hear about it weeks later from a user who says it used to find that, and nobody can say what changed. I build the graded question set and the automated tests that catch the drop on the change that caused it.

**Shipped for a global enterprise's document agent. On the last feature I shipped, answer completeness moved from 0.41 to 0.98 on the graded set (illustrative).**

## Where the time goes today

Without a measure, every regression turns into an investigation: weeks of guessing which change did it, while users quietly route around the tool. In a regulated setting, a wrong retrieval on a contract clause feeds a real decision in the meantime.

## What changes

- **A drop caught before release.** Real questions, each with an answer a person confirmed against the source, are re-scored on every prompt, model and data change.
- **The cause is known at once.** Two checks run side by side: was the answer right, and did the search find the right document at all.
- **Fixes stay fixed.** Every incident becomes a pinned case, so the same failure cannot come back.
- **Your team reads it without me.** The questions come from your users, typos and mixed languages included, and the results live in your own cloud console, run after run.

One limit: a graded set only measures what is in it. Growing the set is ongoing work, and I name the questions still untested instead of reporting a clean score over a thin set.

## What I can do

I build the graded set and the tests, wire them into your stack and hand them over. Two signs you need it: you cannot say whether last month's prompt change helped, and your users find the problems before you do.

Want me to look at yours, in writing?
