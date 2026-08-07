---
title: "How to benchmark an OCR model (TEDS, CER, LLM-as-judge)"
date: "2026-06-04T09:30:00.000Z"
description: "Before you swap or buy a document-AI engine, you need a benchmark you trust. I build the golden set and the harness that tell you which engine is actually better, and what it costs per page."
tags: ["OCR", "Business"]
private: true
---

# Before you buy an OCR engine, buy the benchmark that proves which one is better

I build the evaluation that makes a document-AI decision defensible: a hand-annotated reference set, a scoring harness across every candidate engine, and one number your finance team can use, cost per page at your real throughput.

I ran exactly this for a global beauty group's document pipeline, across four candidate systems.

## The expensive status quo: you are choosing on a demo

Every vendor demo works. It works because the vendor picked the documents and the metric. Then you sign, you point the engine at your archive, and the failure modes arrive: tables that come back scrambled, invented rows nobody notices, documents that never finish processing and sit in a queue for a day.

The bill is not the licence. It is the swap you cannot justify, the migration you half-finish, and the per-page price you accept because you have nothing to compare it to. In the pipeline I benchmarked, one component was inventing tables of 82,176 cells on pages that held 43. Nobody had a number that showed it.

## What you get

- **A golden reference set built on your documents.** Hand-annotated ground truth, not a public dataset that looks nothing like your archive. This is the asset that keeps paying: every future engine, model version, or prompt change gets scored against it in an afternoon.
- **A fair head-to-head across every option.** Your current system, the open-source option, the paid SaaS, the proposed build, scored blind so no candidate gets home-field advantage.
- **A hallucination check, not just an accuracy score.** Invented content is the failure that survives review, because it looks finished. I score it as its own metric. On the pipeline I ran, that score went from 4.7 to 8.1 out of 10.
- **Reliability measured, not assumed.** On the hardest 21 documents, the incumbent finished zero of them, one stuck for 24 hours. The replacement finished 21 of 21.
- **Cost per page at your real throughput.** Measured, not quoted. The winning option came out at $1.61 per 1,000 pages, against roughly $4.80 for the paid SaaS and $6.00 on a GPU configuration that looked obvious and did not pay off.

## Why you can trust the result

The benchmark is built to be able to say no. In this one it did: the paid SaaS stayed ahead on raw accuracy, and I wrote that on the slide. The recommendation held anyway, because the replacement matched the open-source ceiling, removed the failures that were blocking the pipeline, and cost a third of the alternative.

The honest boundary: a benchmark tells you which engine is better on your documents today. It does not tell you a two-point gap is real. I say which differences are decision-grade and which are noise.

## Who this is for

Teams about to swap, renew, or buy a document-AI engine at volume: insurers and banks processing statements and claims, legal and compliance teams over scanned archives, R&D groups whose data lives in tables inside PDFs, and anyone quoted a per-page price by a vendor who also chose the quality metric.

Want me to look at your document pipeline and tell you what a fair benchmark would measure, in writing?
