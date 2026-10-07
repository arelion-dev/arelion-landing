---
title: "How to benchmark an OCR model (TEDS, CER, LLM-as-judge)"
date: "2026-06-04T09:30:00.000Z"
description: "Before you buy or swap a document AI engine, I measure the candidates on your own documents, with cost per page. Later changes are then scored in an afternoon."
tags: ["OCR", "Business"]
private: true
---

Every vendor demo works, because the vendor picks the documents and the metric. I build the benchmark that settles it on your own documents: a hand-checked reference set, every candidate engine scored on it blind, and the cost per page at your real volume. I ran it for a global enterprise's document pipeline, across four candidate systems.

**The winning option cost $1.61 per 1,000 pages, against about $4.80 for the paid service. On the 21 hardest documents it finished all 21, where the old one finished none.**

## Where the time and money go today

Choosing blind is cheap on the day and expensive afterwards. The failures show up after you sign: tables scrambled, rows invented, documents stuck in a queue for a full day. In the pipeline I tested, one component built tables of 82,176 cells on pages that held 43, and nobody had a number that showed it. Without a fair measure, a swap is also hard to justify to the board.

## What changes

- **A reference set on your documents.** Once it exists, every new engine, model version or prompt change is scored in an afternoon.
- **A fair comparison.** Your current system, the open-source option, the paid service and any proposed build, all scored blind.
- **Invented content measured on its own.** It is the failure that passes review because it looks complete. On this pipeline that score went from 4.7 to 8.1 out of 10.
- **Cost per page from real runs.** A GPU setup that looked like the obvious choice came out at $6.00 per 1,000 pages, the most expensive option.

The benchmark can say no, and here it did: the paid service stayed ahead on raw accuracy, and I wrote that down. The recommendation held because the replacement removed the failures that blocked the pipeline at a third of the price. One limit: a gap of two points is noise, and I say which differences are worth a decision.

## What I can do

I build the reference set, the scoring and the cost figure your finance team can use. The choice stays yours, backed by evidence you own.

Want me to look at your document pipeline and tell you in writing what a fair benchmark would measure?
