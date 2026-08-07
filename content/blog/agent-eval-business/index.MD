---
title: "Catching silent regressions in an AI agent (evals, golden sets, LLM judges)"
date: "2026-07-02T14:15:00.000Z"
description: "Your AI assistant will get worse without anyone noticing. I build the graded question set and the test harness that catch it before your users do, and that prove an improvement is real."
tags: ["Agent eval", "Business"]
private: true
---

Your AI assistant will get worse and nobody will tell you. Not with an error, not with an outage. It will simply answer slightly less well than last month. I build the graded question set and the automated harness that catch that drift before your users do, and that prove an improvement is real instead of hoped for. I shipped it for a global beauty group's enterprise document agent.

## The failure that never shows up in a demo

Software that breaks announces itself. An AI assistant does not. Someone edits a prompt, the model provider rolls a new version under the same name, a search filter gets one notch stricter, and the answers quietly degrade. Every automated test still passes, because the assistant still writes confident, fluent English.

You find out weeks later, from a user who says "it used to find that". By then you cannot say what changed or when. The bill is already paid: decisions made on weaker answers, and a team that has stopped trusting the tool.

## What you get

- **A graded set of real questions**, mined from your own production conversations, each with an answer a human confirmed against the source document. Not invented examples.
- **A regression alarm.** Every prompt change, model upgrade or data change is re-scored against that set before it reaches users, so a drop is caught on the change that caused it.
- **Two independent checks, not one.** One asks whether the answer was right. One asks whether the search found the right document, with no AI in the loop to cover for it. An assistant can write a convincing answer over the wrong sources, and only the second check sees that.
- **Proof that an improvement is real.** Every behaviour change ships with an off switch, so the same questions run both ways and the difference is measured. On the last feature I shipped, answer completeness moved from 0.41 to 0.98 on the graded set. (illustrative)
- **A permanent record.** Every incident becomes a pinned test case, so the same failure cannot come back a third time.

## Why it holds

**The questions come from your users, not from me.** Real sessions, real phrasing, real typos and mixed languages. A test set written by the vendor tests the product the vendor imagined.

**A human confirms every answer** against the actual source document. Including the cases where the right answer is "your documents do not contain this", which is what most assistants are never tested on and most often get wrong.

**The results live in your own cloud console**, run over run, so your team reads the trend without me.

**One honest boundary:** a graded set only measures what is in it. Building the harness is the fast part, growing the set is ongoing work, and I will name the questions still untested rather than report a clean score over a thin set.

## Who this is for

Any team running an LLM assistant in production and still changing it: document search over a private corpus, support deflection, internal copilots, claims or contract review. The pain is sharpest where a wrong answer costs a decision rather than a click, in pharma, legal, insurance, finance and regulated R&D.

Two signals you already need this: you cannot say whether last month's prompt change helped, and your users find the problems first.

Want me to look at yours, in writing?
