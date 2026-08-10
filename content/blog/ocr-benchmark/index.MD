---
title: "How to benchmark an OCR model (TEDS, CER, LLM-as-judge)"
date: "2026-06-04T09:30:00.000Z"
description: "How I built the benchmark that decided which OCR and table-extraction engine to ship in an enterprise document pipeline: two benches, four metrics, one war story where the obvious metric said the exact opposite of the truth."
tags: ["OCR", "Benchmarking", "Evaluation"]
private: true
---

A document had been sitting in `WAITING` for twenty-four hours. Three pages. Nothing had crashed and nothing had thrown an error; the pipeline was still working, because the in-house table matcher had decided that one small table on page two held 82,176 cells and it was faithfully trying to fill every one. Forty-three cells existed on that page.

So I proposed swapping that matcher for the official Docling one, with a different region OCR engine alongside it. Then I had to prove the swap beat three alternatives, and prove it without hand-waving. This is the benchmark I built for a global beauty group's document pipeline; the method carries over to any OCR or document-understanding swap you're weighing.

By the end you'll have four pieces: why one benchmark isn't enough, which metrics actually predict production quality, the hallucination signal that costs nothing to compute, and the trap that made the losing engine look like the winner.

**Median declared table size on 8 hallucinating production documents: 32,699 cells before, 145 after.**

## One benchmark cannot answer two different questions

I had two questions, and they aren't the same one. Does changing only the table matcher make the output better? And once it's changed, how does the resulting system rank against the alternatives a buyer could pick instead? Two questions meant two benches.

**Bench 1, the golden set.** 100+ documents annotated by hand, with per-block ground truth: layout, OCR text, titles, headers, footers, captions, tables. Scored with TEDS, CER, and an LLM judge. Everything upstream of the matcher is held fixed, so this bench isolates the component under test.

**Bench 2, the blind comparison.** 220 documents, four systems (the in-house matcher, my proposal, the open-source Docling matcher as is, and a paid document-AI SaaS), scored two ways: a frontier VLM judging blind on the rendered page image (n=179), and symmetric TEDS between systems (n=176). No annotation budget, and no system gets home-field advantage.

My take: build only the golden set and you learn whether your change helped, but nothing about whether you should have bought instead. Build only the blind comparison and every regression turns into a mystery, because four things moved at once. Build both. Once the harness exists, the second one is cheap.

## Measure the metric that matches the production path

Four metrics, each answering a different failure mode.

**TEDS** (Tree-Edit-Distance Similarity), 0 to 1, for table structure. It compares the tree of the predicted table against ground truth, so it punishes a merged cell or a lost column rather than a font.

**CER** (Character Error Rate) for the text layer. TEDS can be high on a table whose cells contain garbage, so you need both.

**An LLM judge** for "does this read like the page". Structure and characters can both look fine while the reading order is nonsense.

**A hallucination signal**, the cheapest of the four and the one most people skip. The pipeline persists the largest declared table size per document (rows times columns). Compare it to the number of cells actually extracted.

```python
# Representative harness code, not client source.
def hallucination_report(doc) -> dict:
    declared = max((t.num_rows * t.num_cols for t in doc.tables), default=0)
    real = max((len(t.cells) for t in doc.tables), default=0)
    return {
        "declared": declared,
        "real": real,
        "ratio": declared / max(real, 1),
        # a healthy table has declared ~= real; declared >> real is a phantom grid
        "phantom": declared > 2000 and declared > 4 * max(real, 1),
    }
```

A declared size above 2,000 is the signature of a hallucinated table. On eight real production documents where the in-house matcher had produced one, this is what the swap did:

| Doc | Pages | Declared, in-house | Declared, official | Real cells |
|---|---|---|---|---|
| a | 3 | 82,176 | 48 | 43 |
| b | 1 | 77,952 | 40 | 40 |
| c | 1 | 64,344 | 30 | 29 |
| d | 37 | 38,759 | 96 | 96 |
| e | 76 | 26,640 | 195 | 195 |
| f | 153 | 12,256 | 650 | 646 |

Eight out of eight fixed. After the swap, declared matches real everywhere.

## The LLM judge only works if the rubric is boring

Ask a judge "is this good?" and you get noise back. Ask instead for named, bounded sub-scores against the page image, and you get something you can diff across runs.

```json
{
  "task": "Compare the extracted markdown against the rendered page image.",
  "scale": "0 to 10 integers, no half points, no prose in the score fields",
  "criteria": {
    "text_fidelity": "Words present and correct, in the order a human reads them.",
    "table_structure": "Rows, columns and merges match what is visible on the page.",
    "reading_order": "Blocks appear in the sequence a human would read them.",
    "hallucination_absence": "Nothing appears that is not on the page. Repeated or invented cells score 0.",
    "completeness": "Nothing visible on the page is missing."
  },
  "output": {"scores": {}, "worst_criterion": "", "one_line_reason": ""},
  "constraints": [
    "You see only the page image and one extraction. You do not know which system produced it.",
    "Do not reward verbosity. Extra text that is not on the page is a hallucination."
  ]
}
```

Two rules make this usable. First, keep it blind: the judge never learns which system it's scoring, or it flatters the one it recognises. Second, give `hallucination_absence` its own axis; it moved from 4.7 to 8.1 out of 10 across the swap, a shift no aggregate quality score would have surfaced.

> **War story.** I nearly shipped the wrong engine because of the obvious metric. Comparing tesseract against rapidocr on raw word capture, tesseract wins clearly: **96.7% of words caught versus 86.0%**. Read that number alone and my proposal made things worse. It is the wrong number. The matcher assigns words to cells **by box position**, so catching a word is not enough. tesseract in `PSM.AUTO` reads in reading order, so its boxes land in the wrong cells and large tables collapse: **TEDS 0.59**. rapidocr emits well-located line boxes, so the grid rebuilds correctly: **TEDS 0.82**. One 16x4 table made it concrete: tesseract caught **more** words (38 versus 35) and scored **0.50 TEDS**; rapidocr scored **0.92**. The text was all there, in the wrong places. Measure the metric that matches the production path, or your benchmark will confidently tell you the opposite of the truth.

## One variable at a time, six configs, 239 tables

Everything stays fixed here (the crop, the matcher, the documents) and only the region OCR engine changes. Six configs in all: four tesseract page segmentation modes, plus easyocr and rapidocr, run over 239 golden tables.

| Config | Small <20 | Medium 20-100 | Large >100 | Scans | Overall |
|---|---|---|---|---|---|
| tesseract AUTO | 0.67 | 0.80 | 0.59 | 0.66 | 0.72 |
| tesseract PSM 4 | 0.66 | 0.80 | 0.60 | 0.65 | 0.71 |
| tesseract PSM 6 | 0.52 | 0.44 | 0.29 | 0.42 | 0.48 |
| tesseract PSM 11 | 0.68 | 0.81 | 0.72 | 0.66 | 0.74 |
| easyocr | 0.69 | 0.82 | 0.75 | 0.72 | 0.75 |
| rapidocr | 0.69 | 0.84 | **0.82** | **0.75** | **0.75** |

The claim survives contact with a properly tuned opponent: PSM 11 is a much better tesseract than the default, and it still trails. easyocr ties rapidocr on accuracy and loses on time, roughly 2.3x slower per table (1,892 ms versus 837 ms median extraction).

Breaking the score down by table size is what made this readable. On the overall average, tesseract AUTO and rapidocr look close enough to shrug at. The gap only opens up on tables above 100 cells and on scans, which happen to be exactly the documents that were breaking production.

## The honest result: parity at best

On the golden bench, only the matcher changed, so everything except tables is identical: layout detection 78, OCR text 93, figure captions 96, table captions 98, all unchanged. The deltas are all in the table column.

**Tables TEDS 68 to 74. CER 78 to 81. LLM judge 69 to 84. Tables in good format 51.2% to 62.7%.**

On the blind bench, across four systems, the ranking was: paid SaaS 74/81/74, open-source Docling 72/75/70, my build 65/74/70, in-house 35/41/45. On the subset where the in-house matcher produced a garbage table (TEDS below 40%, n=94), my build went 20 to 58, which is exactly the open-source level (58), with the SaaS ahead at 64.

The paid SaaS stays ahead. My build reaches parity with the open-source matcher and never beats it, which is expected since it runs that matcher. I wrote that on the slide in those words. A benchmark that only ever confirms the author's proposal is really a pitch deck, and everyone in the room can tell the difference.

## Reliability and cost per page are metrics too

Accuracy tables hide the failure mode that actually costs money. I took the 21 documents where the in-house matcher hallucinated a giant table (2,121 cells median, up to 3,444).

**In-house: 0 of 21 finished. It spiralled and sat in `WAITING`, one document for 24 hours with no kill.** New matcher: 21 of 21 finished, 0 crash, real table of 255 cells median. On the documents the old one did finish, the new one is about 1.3x faster in production, and 1.8x on the big tables (2,024 s to 1,137 s).

Cost per page belongs in the benchmark from day one, measured the boring way: platform rate divided by real observed throughput. A vendor's price list does not count.

```
Cloud Run: 2 vCPU / 8 GiB = $0.245/h, WORKER_COUNT=2
  (the TableFormer decoder is single-thread: 1 worker wastes a core, 3+ fight)
Corpus:    7,171 mixed documents, 31,494 pages
Measured:  47 s/page, 152 pages/h/instance

$ / 1,000 pages
  new build (local)   $1.61
  in-house (local)    $2.08
  paid SaaS          ~$4.80
  GPU L4 config       $6.00
```

The GPU line is the useful one. A GPU is the reflex answer to "make OCR faster" and here it is the most expensive option measured, because the v1 decoder processes one table at a time and never saturates the card. Benchmark the actual config rather than the hardware category.

## What this benchmark still cannot tell me

A few honest limits.

**100+ documents is a small golden set.** It is enough to catch a regression in a component, not enough to give a tight confidence interval on a 2-point difference. I treat sub-3-point gaps on that bench as noise.

**TEDS punishes valid formatting differences.** A model that emits a correct table with a different but defensible merge structure loses points against my annotation. TEDS measures agreement with one annotator's tree rather than truth.

**LLM judges drift.** Change the model version and your absolute scores move under you. Judge scores are only comparable inside a single run where every system is scored by the same model, in the same session, blind. I never compare a judge number across two dates.

## Who has this problem

Any team about to swap or buy a document-understanding engine: insurers and banks processing statements and claims, legal and compliance teams over scanned archives, R&D groups whose data lives in tables inside PDFs, anyone whose ingestion cost is quoted per page by a vendor who also picks the quality metric.

If the vendor supplies the benchmark, you are just reading marketing with a decimal point.
