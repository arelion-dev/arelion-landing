---
title: "Output contracts in production"
date: "2026-08-07T10:00:00.000Z"
description: "AI that produces machine-readable output your systems can act on, with a guarantee that a wrong answer never reaches production."
tags: ["AI", "Business"]
private: true
---

I worked on a system at a global enterprise that lets thousands of people ask questions in plain language and get answers straight from live company data. The point of this piece is not the technology. It is one risk that most AI projects ship into production without noticing.

An AI that is right 95 percent of the time is the dangerous kind. The wrong 5 percent looks exactly like the rest. A confident answer built on the wrong data does not announce itself. It just gets trusted, acted on, and passed along.

The fix is not a better prompt. It is a contract around the model. The AI proposes an answer, and code decides whether that answer is allowed to move forward. Anything malformed, anything reaching for data the person is not cleared to see, anything that could change or damage records is refused before it ever touches production.

Two guarantees fall out of that. First, people only ever get answers drawn from data they are allowed to see, enforced in code, not promised in a policy. Second, every answer traces back to the exact query that produced it, so any number the system reports can be checked.

The honest trade-off is that a good question is sometimes refused rather than answered badly. That is the right side to err on. A blocked question costs a retry. A wrong answer shown to the wrong person costs trust, and in the worst case, a data breach with a friendly interface.

This pattern fits any system where AI output becomes an action: a support bot that edits customer records, a finance pipeline that writes figures into your ledger, any tool reading data with strict access rules. If the only thing standing between a bad AI output and your customer is the prompt, that is the gap this closes.

Want me to look at where your AI output goes, in writing?
