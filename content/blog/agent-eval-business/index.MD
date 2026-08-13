---
title: "Catching silent regressions in an AI agent (evals, golden sets, LLM judges)"
date: "2026-07-02T14:15:00.000Z"
description: "Your AI assistant gets worse without anyone noticing. A graded question set and a test harness catch the drift before your users do, and prove an improvement is real."
tags: ["Agent eval", "Business"]
private: true
---

Your AI assistant gets worse and nobody tells you. There's no error and no outage, just an assistant that answers slightly less well than it did last month. I build the graded question set and the automated harness that catch that drift, mined from your own production traffic. I shipped exactly this for a global beauty group's enterprise document agent.

## Why this matters to you

Software that breaks announces itself. An AI assistant doesn't. Someone edits a prompt, the provider ships a new version under the same name, a search filter gets one notch stricter, and the answers quietly degrade while every test still passes, because the assistant still writes confident, fluent English. You won't feel a half-point drop by using it a few times. Your users feel it in aggregate, and they route around the tool long before anyone files a ticket.

## What it costs when it drifts

You find out weeks late, from a user who says "it used to find that," and by then you can't say what changed or when. The bill is already paid: decisions made on weaker answers, and a team that has quietly stopped trusting the tool. In a regulated setting it's worse, because a wrong retrieval on a dossier or a contract clause feeds a real decision. Winning that trust back once people have written the tool off is slow.

## What actually catches it

A fixed set of real questions, each with an answer a human confirmed against the source document, re-scored on every prompt change, model upgrade and data change before it reaches users, so a drop gets caught on the change that caused it. Two checks run in parallel: one asks whether the answer was right, the other asks whether the search even found the right document, with no AI in the loop to cover for a miss. Every behaviour change ships with an off switch, so the same questions run both ways and the difference gets measured; on the last feature I shipped, answer completeness moved from 0.41 to 0.98 on the graded set (illustrative). Every incident becomes a pinned case, so the same failure can't come back a third time.

The questions come from your users, with the actual typos and mixed languages they type, and a human confirms every answer, including the cases where the right answer is "your documents don't contain this." That's the case most assistants are never tested on and most often get wrong. Results live in your own cloud console, run over run, so your team reads the trend without me.

## What I can do

I build the graded set and the harness, wired into your stack and your console, and hand it over so your team runs it without me. One honest boundary: a graded set only measures what's in it. Building the harness is the fast part, growing the set is ongoing work, and I'll name the questions still untested rather than report a clean score over a thin set.

Two signals you already need this: you can't say whether last month's prompt change helped, and your users are finding the problems before you do.

Want me to look at yours, in writing?
