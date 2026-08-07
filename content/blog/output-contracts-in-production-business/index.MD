---
title: "Output contracts in production"
date: "2026-08-07T10:00:00.000Z"
description: "AI that produces machine-readable output your systems can act on, with a guarantee that a wrong answer never reaches production."
tags: ["AI", "Business"]
private: true
---

It is 3am and a job is down, because an AI returned an answer that was almost right. I built the layer that stops that. It lets thousands of people at a global enterprise ask questions in plain language and get answers from live company data, with a guarantee: a wrong answer never reaches a user.

**Downstream incidents from bad AI output: 0.**

## The wrong 5 percent looks exactly like the right 95

An AI that is right 95 percent of the time is the dangerous kind. A confident answer built on the wrong data does not announce itself. It gets trusted and acted on before anyone notices.

## The fix is a contract, not a better prompt

The AI proposes an answer, and code decides whether it is allowed forward. Anything malformed, anything reaching for data the person is not cleared to see, anything that could change records is refused before it touches production.

**Malformed output caught before it ships: ~100%.**

Two guarantees fall out. People only get answers from data they are allowed to see, enforced in code, not promised in a policy. And every answer traces back to the exact query behind it, so any number can be checked.

The honest trade-off: a good question is sometimes refused rather than answered badly. A blocked question costs a retry. A wrong answer to the wrong person costs trust, and in the worst case, a data breach with a friendly interface.

This pattern fits any system where AI output becomes an action: a support bot that edits records, a finance pipeline that writes into your ledger, any tool reading data under strict access rules.

Want me to look at where your AI output goes, in writing?
