---
title: "Keeping a human in the loop (KYC)"
date: "2025-12-04T10:20:00.000Z"
description: "Human in the loop AI compliance: KYC document automation that clears the routine files, escalates the risky ones with a reason attached, and never ships an approval nobody can explain."
tags: ["AI", "Business"]
private: true
---

# Human in the loop AI compliance for KYC document automation

I build KYC document automation that reads investor files and clears the routine ones on its own, then hands every doubtful file to a person with the exact reason attached. The AI reads each file and drafts an opinion, and that's where its power stops: it never approves and it never blocks. The call belongs to plain, auditable code, so every decision still holds up months later when someone asks how it was reached.

## Why this matters to you

A compliance team reads investor files by hand: ID cards, bank details, tax notices, company extracts. Most are routine, and the volume climbs every quarter. Every hour a reviewer spends on a clean file is an hour taken from the one that actually needs scrutiny. The obvious fix is to let a model decide for you, and that's where the exposure starts: a model that can approve can approve the wrong file.

## What one wrong approval costs

It works right up to the day it approves the wrong file. Now that investor sits inside a regulated fund, the approval looks clean, and your name is on it. One mistake like that is a compliance finding, with the disclosure and the scrutiny that follow. A confident wrong approval looks exactly like a good one, so nobody goes back to check it until someone external does.

## What actually helps

The fix is to keep the decision in code and let the model advise. The model reads each file and drafts an opinion, but plain deterministic code makes the call, and anything the code can't clear on its own goes to a person with the reason attached. In practice that clears 68% of clean files with no human touching them and cuts review time on routine files by about 70%, while producing zero silent approvals: the system never blesses a file nobody can explain. Because the verdict is reproducible, the AI decisions stay auditable, so any file approved today can be replayed and re-explained months later, byte for byte. It also sharpens over time without retraining, because each recurring mistake becomes a rule locked behind a test, so it can't come back.

This runs today for a fintech that onboards investors into regulated funds, so it's proven at real scale rather than a prototype. The pattern has a name worth knowing: AI with deterministic guardrails, where the AI advises and code decides.

One honest boundary: this won't shrink your review team to zero, and it was never meant to. It trades a little throughput for full auditability, on purpose. If you want nobody in the loop at all, this is the wrong design.

## What I can do

I build this pipeline for document-heavy approval work, where the model reads and drafts an opinion but deterministic code holds the veto, and every doubtful file routes to a reviewer with its reason. I can assess where your current process is exposed and what to change first, or build the pipeline end to end. The build can sit with your team once the rules are proven, or run as a separate engagement.

## Who this is for

Anywhere a machine reads messy documents and a decision follows that someone has to answer for: loan approvals, insurance claims, tenant screening, supplier and sanctions checks, patient triage.

Want me to look at yours, in writing?
