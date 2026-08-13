---
title: "How to benchmark an OCR model (TEDS, CER, LLM-as-judge)"
date: "2026-06-04T09:30:00.000Z"
description: "Before you swap or buy a document-AI engine, you need a benchmark you trust more than the vendor's. I build the reference set and the harness that tell you which engine is actually better on your documents, and what it costs per page."
tags: ["OCR", "Business"]
private: true
---

Before you swap or buy a document-AI engine, you need a benchmark you trust more than the vendor's. I build the reference set and the scoring harness that say which engine is actually better on your own documents, and what it costs per page at your real throughput. I ran exactly this for a global beauty group's document pipeline, across four candidate systems.

## Why this matters to you

Every vendor demo works, because the vendor picked the documents and the metric. You sign, point the engine at your own archive, and the failures surface. Tables come back scrambled. Rows get invented that nobody catches, and some documents never finish, sitting in a queue for a full day. In the pipeline I benchmarked, one component was inventing tables of 82,176 cells on pages that held 43. Nobody had a number that showed it.

## What it costs when you choose blind

The invoice is the smallest part of the bill. The real cost is a swap you can't justify to the board, and a per-page price you keep paying because nothing lets you challenge it. Worse is the failure that survives review: an engine that invents content looks finished, so someone downstream acts on a number that was never on the page, and you find out weeks later.

## What a fair benchmark measures

- **A golden reference set on your own documents.** Hand-annotated ground truth on your material, so it matches your archive. This is the asset that keeps paying: every future engine, model version, or prompt change gets scored against it in an afternoon.
- **A fair head-to-head across every option.** Your current system, the open-source option, the paid SaaS, the proposed build, all scored blind so no candidate gets home-field advantage.
- **A hallucination check on top of the accuracy score.** Invented content is the failure that clears review, because it reads as complete. I score it as its own metric. On the pipeline I ran, that score went from 4.7 to 8.1 out of 10.
- **Reliability measured under load.** On the hardest 21 documents, the incumbent finished zero, one stuck for 24 hours. The replacement finished 21 of 21.
- **Cost per page at your real throughput.** Measured from actual runs. The winning option came out at $1.61 per 1,000 pages, against roughly $4.80 for the paid SaaS and $6.00 on a GPU configuration that looked obvious and did not pay off.

The benchmark is built to be able to say no. In this one it did: the paid SaaS stayed ahead on raw accuracy, and I wrote that on the slide. The recommendation held anyway, because the replacement matched the open-source ceiling, removed the failures that were blocking the pipeline, and cost a third of the alternative. One honest boundary: a benchmark tells you which engine is better on your documents today. It won't confirm that a two-point gap is real, so I say which differences are decision-grade and which are noise.

## What I can do

I build the benchmark: the golden set on your documents, the harness across your candidate engines, and the cost-per-page figure your finance team can use. The engine choice stays yours, backed by evidence you own instead of a vendor's slide. This fits teams about to swap, renew, or buy a document-AI engine at volume: insurers and banks processing statements and claims, legal and compliance teams over scanned archives, R&D groups whose data lives in tables inside PDFs, anyone quoted a per-page price by a vendor who also chose the quality metric.

Want me to look at your document pipeline and tell you what a fair benchmark would measure, in writing?
