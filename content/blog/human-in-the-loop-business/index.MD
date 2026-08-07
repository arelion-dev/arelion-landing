---
title: "Keeping a human in the loop (KYC)"
date: "2026-08-07T10:00:00.000Z"
description: "Automate the routine compliance files, keep a person on the ones that carry consequences, and never ship an approval nobody can explain."
tags: ["AI", "Business"]
private: true
---

A compliance team reads investor files by hand: ID cards, bank details, tax notices, company extracts. Most are routine, the volume keeps climbing, and every hour on a clean file is an hour off the one that needs scrutiny. The obvious move is to automate. The trap is the day the automation approves the wrong file. The wrong investor is inside a regulated fund, and your name is on the approval.

I built the decision pipeline for a fintech that onboards investors into regulated funds, and I designed it so that day cannot happen.

**68% of clean files clear on their own, no human needed.**

**Review time on routine files down about 70%.**

**Zero silent approvals: the system never blesses a file nobody can explain.**

The AI reads every file and drafts an opinion, but it is never allowed to approve or block. Plain, readable code makes the call, and anything uncertain goes to a person with the exact reason attached. Because the decision is made in code, not by the model, a file approved today can be replayed and re-explained months later, which is what auditors ask for.

It also gets sharper without retraining. Each recurring mistake becomes a rule locked behind a test, so it cannot come back. Your reviewers keep their attention for the files that carry consequences.

This shape fits anywhere a machine reads messy documents and a decision follows that someone must answer for: loans, insurance claims, tenant screening, supplier checks. If that sounds like your process, want me to look at yours, in writing?
