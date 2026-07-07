---
title: "Keeping a human in the loop"
description: "Why AI-driven KYC and document compliance needs a human review step, and how the human's judgment both catches errors and makes the system better over time."
date: 2026-07-06
tags: ["compliance", "kyc", "human-in-the-loop", "reliability", "llm", "document-intelligence"]
pillar: "Automate"
stack: ["TypeScript", "Fastify", "Prisma", "MySQL", "Mistral Document AI", "LLM judgment"]
lang: en
---

## The problem

KYC is a high-stakes compliance decision. Onboard the wrong investor, miss an expired ID, wave through a document that belongs to someone else, and the cost is not a bad UX metric: it is a regulatory breach with your name on it.

That is exactly the kind of decision you should not fully automate. Modern document AI is good, but it fails in the worst possible way for compliance: it fails confidently. A classifier can decide, with a high score, that a utility bill is a proof of address when it is actually a rejection letter. An extraction model can read a wrong date of birth off a low-resolution scan and never signal any doubt. "Confidently wrong" is fine for a search box. It is a liability when the output onboards a client.

The answer is not to drop the AI. It is to put a human where the AI is weakest: the final judgment call.

## What we built

For a fintech onboarding investors into regulated funds, I built an AI-assisted KYC pipeline with a mandatory human review step. The AI does the heavy, repetitive work: read every document, classify it, extract the fields that matter, run the regulatory checks. It never renders the final verdict. A compliance operator does, on a screen that shows the AI's reasoning, the evidence, and a link straight to each source document.

Concrete example: an investor uploads an ID, a proof of address, and a bank details slip. The pipeline OCRs each one, classifies them (ID card, proof of address, bank details), extracts the typed fields, and checks the dossier as a whole: is the ID expired, is the proof of address recent enough, does the address on the ID match the one on the utility bill, is anything missing. The operator sees a single dossier verdict and decides.

## How it works

Every document carries confidence scores. OCR produces a per-page confidence (we keep the worst page). Classification produces its own 0 to 1 score. Those numbers are not decoration: they route work.

The dossier verdict is built from two layers. The first is deterministic code: rules for ID expiry, document-slot mismatch, address matching, dossier completeness, and OCR confidence. These are auditable, reproducible, and they are the only layer allowed to block. If the worst OCR page falls below 0.85, the document is flagged for a human to eyeball. The second layer is an LLM judgment that applies the editable compliance policy to the extracted data. It is strictly advisory: it can raise a "check this" flag, never a hard failure.

Routing follows from that. At least one hard failure means the dossier is non-compliant. No failure but at least one soft flag means it goes to a human for review. Nothing at all means it can pass. If the LLM layer is unavailable, a dossier that would otherwise pass is downgraded to manual review, never silently waved through. The exact classification-confidence cutoff that forces a human look is `[à confirmer: exact classificationConfidence threshold]`; today the reliable route-to-human signals are low OCR confidence and unclassified or mismatched documents.

## The feedback loop

Here is the honest part, because it is easy to oversell. The human's decision to validate or invalidate a dossier does **not** train a model. In the code, that decision is an append-only record with a mandatory comment when the operator rejects, denormalized onto the investor for sorting, and written to an audit log. It gates that one case. It is not fed back into the LLM as an example, and no weights are updated.

The system genuinely improves over time, but through a different and very deliberate path: the humans edit the rules. When an operator sees the AI make a systematic mistake (a regex that rejected the new ID-card format, an "income too low" flag that was actually comparing against the wrong figure), an engineer encodes the fix as a deterministic rule, validator, or false-positive filter, and locks it in with a regression test built from the real case. Editing a document type re-validates the existing corpus against the new rules. So the loop is: human judgment surfaces the error, code captures it, tests keep it fixed. Better rules, not a retrained model. That is a legitimate, auditable feedback loop, and for compliance it is the one you want.

## Reusable

This pattern fits any high-stakes AI decision where being confidently wrong is expensive: compliance, medical triage, legal review, content moderation. The shape is always the same. Let the model do the volume. Score its own confidence. Route the uncertain and the consequential to a human. And treat every human correction as a spec change to your rules, backed by a test, not as a vague promise that the model will "learn".

If you are wiring AI into a decision you cannot afford to get confidently wrong, that is the kind of problem I build for. Reach out in writing and we can scope it.
