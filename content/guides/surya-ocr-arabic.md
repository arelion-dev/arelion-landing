---
title: "Surya OCR on Arabic: tested on 100 pages"
description: "Surya OCR on Arabic: 3.9% of characters wrong on 44 real scans and photos, the best of six engines. How I ran it on a Mac, and where it slipped."
path: "/guides/surya-ocr-arabic/"
date: "2026-10-07"
kicker: "Arabic OCR"
legalDisclaimer: false
related: ["ocr-benchmark", "document-intelligence-at-scale"]
faq:
  - q: "Can Surya OCR be used commercially?"
    a: "The code is Apache 2.0. The model weights use a modified OpenRAIL-M license that Datalab describes as free for research, personal use and startups under $5M in funding or revenue. Above that, you need a commercial license from Datalab."
  - q: "Does Surya OCR support Arabic?"
    a: "Yes. Surya lists 90+ languages, Arabic among them. In my test it got 3.9% of characters wrong on 44 real scans and photos of printed Arabic pages, the fewest of the six engines that read them all."
  - q: "How fast is Surya on a Mac?"
    a: "About 15 seconds a page on real scans (median 14.7) and 12 on the law pages, on an Apple M5 Pro, with the model served by llama.cpp on the GPU (Metal). Apple's built-in recognizer was under half a second a page on the same machine."
---

Surya read 17 printed and scanned Wikipedia pages with 0.6% of the characters wrong, about one character in 170. Then it met a poem.

I ran Surya 0.22, Datalab's open-source OCR model, in my [Arabic OCR benchmark](/arabic-ocr/): 44 real scans and phone photos of printed Arabic pages, and 56 images of two UAE laws, rendered from their PDFs and typeset again. On the real pages it made the fewest mistakes of the six engines that read them all. It is also the slowest of the ones that did well: about 15 seconds a page on an Apple M5 Pro, where Apple's recognizers take half a second or less.

**On 44 real scans and photos, Surya got 3.9% of characters wrong. Apple Live Text got 5.0%, Tesseract 19.7%.**

## Surya page type by page type

Characters wrong, by kind of page, next to Apple's two engines and Tesseract:

| Pages | Surya | Apple Live Text | Apple Vision | Tesseract |
|---|---|---|---|---|
| Wikipedia scans (17) | 0.6% | 3.9% | 1.9% | 18.5% |
| Book and journal scans (17) | 3.3% | 4.2% | 3.6% | 11.8% |
| Photos, one page (6) | 15.7% | 9.9% | 8.5% | 38.1% |
| Photos, open book (4) | 2.0% | 5.3% | 52.5% | 30.9% |
| Law pages from the PDFs (32) | 1.6% | 1.8% | 0.3% | 10.6% |
| The same laws, typeset again (24) | 0.1% | 0.2% | 0.2% | 9.7% |

Two things Surya does well that the averages hide. It keeps the numbers: it found 97.2% of the numbers on the real pages (years and other figures), the most of any engine. And it reads a photo of an open book as two pages, the right one first. My own ordering of Apple Vision's boxes mixed the two pages and got 52.5% wrong there; Surya got 2.0%.

On the law pages Surya found nearly every word. On the Dubai law pages I checked, its errors were mostly positions: clause numbers such as (10), and the gazette line at the foot of the page, end up somewhere else in the text. Apple Vision, which reads those clean pages almost perfectly, stays ahead there.

## Where Surya made more mistakes than Apple

The 15.7% on single-page photos comes mostly from one page: a photo of a book of poetry, each verse printed on one line in two halves with a gap in the middle. Surya took the halves for two columns. It returned the page number and the title, then the second halves of the verses, and then the first halves, and it misread more words than usual on top of that. It got 69.5% of the characters wrong and found 80.5% of the words. Apple Vision, which only knows lines, read each verse in one piece and got 13.1% wrong.

The other five single-page photos average 5.0% for Surya. On one of them Surya skipped part of the text: it found 85% of the words, where Live Text got 2.0% wrong. If your documents are photos of poetry, forms or anything laid out in two halves, check Surya's reading order on a few pages before you trust it.

## How I ran it on a Mac

Surya 0.22 runs its model through llama.cpp on a Mac. Install both, and Surya downloads the model weights (a GGUF file and its image projector) from Hugging Face the first time:

```bash
pip install surya-ocr==0.22.1
# Surya looks for llama-server on the PATH, or at the path in LLAMA_CPP_BINARY.
# I used the prebuilt macOS build from the llama.cpp releases (b11433).
export LLAMA_CPP_BINARY=$PWD/llama.cpp/llama-server
```

This is the code my benchmark ran on every page, in full-page mode:

```python
from PIL import Image
from surya.inference import SuryaInferenceManager
from surya.recognition import RecognitionPredictor

manager = SuryaInferenceManager()      # starts llama-server in the background
manager.start()
predict = RecognitionPredictor(manager)

page = predict([Image.open("page.png").convert("RGB")], full_page=True)[0]
blocks = sorted(page.blocks, key=lambda b: b.reading_order)
text = "\n".join(b.html for b in blocks if not b.skipped and b.html)   # HTML per block
```

Each block comes back as a small piece of HTML, in Surya's reading order. I strip the tags before scoring. The server takes a few seconds to start, then each page is one request to it.

## The license

The code is Apache 2.0. The model weights use a modified OpenRAIL-M license, which Datalab describes as free for research, personal use and startups under $5M in funding or revenue. Above that, you need a commercial license from Datalab. Read the current terms in the Surya repository before you build a product on it.

## What I did not test

- A Linux server with an NVIDIA GPU, where Surya uses vLLM instead of llama.cpp. Speed will differ; the model is the same.
- Tables and layout. Surya also detects layout and tables; I only scored the text.
- Handwriting: none in the test set.
