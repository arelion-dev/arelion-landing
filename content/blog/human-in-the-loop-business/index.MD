---
title: "Keeping a human in the loop (KYC)"
date: "2026-08-07T10:00:00.000Z"
description: "Automate the routine compliance files, keep a person on the ones that carry consequences, and never ship an approval nobody can explain."
tags: ["AI", "Business"]
private: true
---

I built the decision pipeline for a fintech that onboards investors into regulated funds. A compliance team reads investor files by hand: ID cards, bank details, tax notices, company extracts. Most are routine, the volume keeps growing, and every hour on a clean file is an hour off the one that needs real scrutiny.

The obvious move is to automate. The trap is the day the automation approves the wrong file. The wrong investor is inside a regulated fund, everyone is exposed, and your name is on the approval.

So I did not hand the decision to the AI. The AI reads every file and drafts an opinion. Only plain, readable code is allowed to block a file, and anything it is unsure about goes to a person. Clean files pass on their own. A bad scan, a missing piece, an expired document, a real inconsistency: each lands on a reviewer's desk with the exact reason attached.

The decision stays explainable. Because blocking is done in code, not by the model, a file approved today can be replayed and re-explained months later, which is what an auditor asks for. The system will never produce a silent wrong approval that nobody can account for.

It also gets sharper without retraining. When a recurring mistake shows up, an engineer turns it into a rule locked behind a test, so it cannot come back. The routine gets automated, and reviewers keep their attention for the hard files.

This shape fits anywhere a machine reads messy documents and a decision follows that someone must answer for: loans, insurance claims, tenant screening, supplier checks. If that sounds like your process, want me to look at yours, in writing?
