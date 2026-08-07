---
title: "Keeping a human in the loop (KYC)"
date: "2026-08-07T10:00:00.000Z"
description: "An AI-assisted compliance pipeline for onboarding investors into regulated funds. The interesting part is not the OCR, it is the rule that the model is never allowed to block a file."
tags: ["Tech", "AI"]
private: true
---

A compliance team sits and reads investor files by hand: photographed ID cards, rasterized bank details, tax notices of uneven quality, corporate registration extracts. File by file, approve or escalate. The volume climbs every quarter. So someone wires an LLM to read everything and pronounce a verdict, and it works, until the day it approves the wrong one. Now the wrong investor is inside a regulated fund, the approval looks clean, and nobody can explain how it was reached.

I built the decision pipeline for a fintech that onboards investors into regulated funds. The design has one non-negotiable rule: the model is never allowed to block a file.

**68% of clean dossiers now clear with no human touching them.**

**0 silent approvals. Not one.**

**Review time on the routine files dropped by about 70%.**

## A fluent model is not an accountable one

The tempting shortcut is to let an LLM read everything and decide. That is a liability, not a feature. A language model is fluent, not accountable. You cannot audit it line by line, it does not reproduce the same answer twice under pressure, and it invents plausible details when the input is thin. A confidently wrong approval is worse than a blank one: it looks trustworthy while the wrong investor is now inside a regulated fund.

So I did not put the power to decide in the model.

## Three roles, never blended

The house rule of the whole project: deterministic transforms belong to code, judgment belongs to the model, and the two never mix. That splits the system into three roles.

**The advisory LLM reads and proposes.** It applies the editable anti-money-laundering policy to the extracted data and can raise a warning or an informational note. It can never fail a dossier. If the model disobeys its prompt and returns a `fail`, the code rewrites it to a `warn`. A small model gets to flag things for a human, never to close the door on its own.

**Deterministic code is the only thing that can block.** Expired ID, missing piece, address mismatch, low OCR quality: each is a rule in code, not a model call. Field validation is pure and deterministic. An IBAN is checked with a real checksum, a SIREN or SIRET against Luhn, dates against expiry and recency windows, postal codes and VAT numbers against their formats. No model call happens at validation time, so the verdict is reproducible and cacheable.

**A human owns everything in doubt.** Confidence routes the uncertainty. When OCR confidence drops below 0.85, the file does not fail, it goes to a reviewer. That threshold was calibrated on real data: a rasterized scan that produced a wrong date of birth sat around 0.77, clean documents land between 0.94 and 0.998. Below the line the extraction might be wrong while looking valid, so a person checks it. The same guard refuses to run the LLM on an image-only page with no extractable text, rather than let it hallucinate a name.

**OCR confidence under 0.85 routes to a human, every time, no override.**

The blocking layer runs the judgment call at temperature zero, for exactly one reason: the same file must give the same verdict on every run.

Call it the two-layer verdict. Rough shape (illustrative, not client code):

```text
code_rules(fields)      -> PASS | BLOCK   # the only thing that can stop a file
llm_policy(fields)      -> OK | WARN | INFO   # advisory, coerced to WARN if it says BLOCK
verdict = BLOCK if code_rules == BLOCK
          else HUMAN if ocr_confidence < 0.85
          else PASS (with any advisory notes attached)
```

## The system never guesses a verdict it cannot explain

That is the one property the design refuses to give up. A file the system cannot read does not get a guessed verdict, it gets a human. A warning the model raises wrongly costs a reviewer a glance, not a client. The thing it will never produce is a silent approval that nobody can explain. Because blocking is deterministic, a decision taken today can be re-run and re-explained months later, byte for byte, which is exactly what an auditor asks for.

**Every decision replays byte for byte, months after it was made.**

## It improves without retraining

The human decision does not train a model. No reviewer approval flows back into weights, no feedback loop quietly reshapes behavior. A model that learns from reviewers drifts, and drift in a compliance pipeline is an audit finding waiting to happen.

Instead it improves the slow, reliable way. Left alone, the LLM makes the same mistakes over and over: it flags `M MATHIEU BEAUCOURT` against `BEAUCOURT Mathieu` as an identity mismatch, treats the co-holder of a joint account as a suspicious second identity, compares an investment against the wrong figure instead of actual assets. Each recurring false positive becomes a deterministic filter: name comparison settled by token normalization that strips titles, legal forms, and accents; financial capacity compared numerically. An engineer writes the rule and locks it behind a regression test that would have caught the old mistake. Every fixed bug ships with the test that proves it stays fixed.

The intelligence accrues in code you can read, diff, and roll back, not in a model you have to trust.

## The honest limit: it still needs enough people

The two-layer verdict does not shrink the review team to zero, and it is not meant to. Push the confidence threshold up and more clean files land on human desks for no reason. Push it down and bad extractions slip through as if clean. The 0.85 line is a floor I would rather set too cautious than too loose, which means on a bad batch of scans the human queue grows before the rules catch up. The system trades throughput for auditability on purpose. If you need full automation with nobody in the loop, this is the wrong design.

## Who has this problem

This shape is not specific to fund onboarding. You have the same problem if you approve loans, settle insurance claims from photos and handwritten statements, triage patients, moderate content, screen tenants, or clear suppliers against sanctions lists. Anywhere a machine reads messy documents and a decision follows that someone must answer for, the answer is the same: let the machine read and suggest, keep the decision auditable, and route every doubt to a human who can be held responsible.
