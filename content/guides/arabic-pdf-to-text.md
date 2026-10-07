---
title: "Arabic PDF to text: why copy-paste fails, and what works"
description: "Copying Arabic out of a PDF often reverses letters. I tested 7 ways to extract UAE law PDFs: the best got 7.6% of characters wrong. OCR of the page: 0.2%."
path: "/guides/arabic-pdf-to-text/"
date: "2026-10-07"
kicker: "Arabic OCR"
legalDisclaimer: false
related: ["ocr-benchmark", "document-intelligence-at-scale"]
faq:
  - q: "Why does Arabic text come out reversed when I copy it from a PDF?"
    a: "A PDF stores glyphs at positions on the page, left to right, and a ligature such as لا is often one glyph mapped to two letters. The extractor has to rebuild the reading order. Many tools reverse the letters, or the two letters inside each ligature, so الأمر comes out as األمر."
  - q: "How do I convert a scanned Arabic PDF to text?"
    a: "Render each page to an image at 300 dpi (pdftoppm -r 300 does it) and run an OCR engine that reads Arabic well. In my tests that was Apple's text recognition on a Mac, Surya, or Gemini 3.5 Flash if the pages may go to Google. Tesseract, which many free PDF tools use, got far more characters wrong."
  - q: "Is it better to extract the text layer or to OCR an Arabic PDF?"
    a: "On the two UAE law PDFs I tested, OCR of the rendered pages was better than every text extractor. The best extractor, pdfplumber with its right-to-left option, got 7.6% of characters wrong on the Dubai law, and pypdf, which found the most words, got 10.7% wrong. Apple's OCR got 0.2% wrong at 300 dpi."
---

Copy a line out of the official PDF of Dubai Law No. (7) of 2025 and paste it. Depending on the tool, you get the right text, or <bdi lang="ar">األمر</bdi> instead of <bdi lang="ar">الأمر</bdi>, or the whole line backwards: <bdi lang="ar">:يلاتلا نوناقلا ردصُن</bdi> for <bdi lang="ar">نُصدر القانون التالي:</bdi>.

I measured seven common ways to pull the text out of two UAE law PDFs, against a transcription I rebuilt glyph by glyph. The best one, pdfplumber with its right-to-left option, still got 7.6% of the characters wrong on the Dubai law and missed a quarter of its words. Rendering the same pages as images and running OCR on them did better: 0.2% with Apple's text recognition, 1% with Surya.

**On these Arabic PDFs, OCR of the rendered page beat every text extractor I tested.**

## What seven extractors return from an Arabic PDF

Eight pages of the Dubai law (a Word export) and eight half-spreads of the Federal Decree-Law No. (33) of 2021 booklet (laid out in InDesign), scored like the OCR engines in my [Arabic OCR benchmark](/arabic-ocr/):

| Extractor | Dubai law | MOHRE booklet | Words found, Dubai law |
|---|---|---|---|
| pdfplumber 0.11, `char_dir_render="rtl"` | 7.6% | 10.4% | 73% |
| pypdf 6.19 | 10.7% | n/a (no page clipping) | 96% |
| pdftotext (poppler 26.04) | 15.0% | 21.2% | 70% |
| PyMuPDF 1.28 | 16.6% | 18.5% | 84% |
| pdftotext `-layout` | 18.7% | 17.4% | 70% |
| pdfminer.six, default | 78.1% | n/a (no page clipping) | 9% |
| pdfplumber 0.11, default | 78.8% | 76.2% | 9% |

The numbers are character error rates: 10.7% is about one wrong character in ten. The damage comes in three kinds.

- **The whole line backwards.** pdfminer.six and pdfplumber, with their default settings, return the characters in the order they sit on the page, from left to right. Almost no word survives: 9% of them are found. pdfplumber has an option for right-to-left text, `char_dir_render="rtl"`, which brings it down to 7.6% on the Dubai law.
- **Ligatures reversed.** pdftotext and PyMuPDF get the direction right but flip the two letters of many ligatures. In pdftotext's output of the Dubai law, <bdi lang="ar">الأمر</bdi> becomes <bdi lang="ar">األمر</bdi> and <bdi lang="ar">الإمارة</bdi> becomes <bdi lang="ar">اإلمارة</bdi>; in the MOHRE booklet, <bdi lang="ar">في</bdi> becomes <bdi lang="ar">يف</bdi> and <bdi lang="ar">المهنية</bdi> becomes <bdi lang="ar">املهنية</bdi>. I counted 55 of those on the eight Dubai pages and 112 on the MOHRE pages.
- **Blocks out of order.** pypdf avoids both problems on the Dubai law, but it puts the page footer, the Official Gazette line, at the top. That costs it most of its 10.7%: it found 96% of the words.

## Why Arabic breaks in a PDF

A PDF does not store text the way you read it. It stores glyphs, each at a position on the page, and a table that maps each glyph to characters. Arabic adds two problems. The glyphs of a right-to-left line are often written left to right, so the extractor has to reverse them. And a ligature such as لا is one glyph that maps to two letters: reverse the line letter by letter, and the two letters of every ligature come out swapped.

For the ground truth of my benchmark, I read the glyphs with pdfminer and kept each glyph's characters together:

```text
1. group glyphs into visual lines by their vertical position
2. attach each harakat mark to the letter under it
3. sort the letters of each line right to left
4. put numbers and Latin words back in left-to-right order
```

I compared six of those pages line by line with the rendered image before I trusted them. Every extractor and OCR engine on this page is scored against that rebuild.

## OCR the rendered page instead

Same sixteen pages, rendered as images and read by OCR engines with their default settings:

| OCR engine, pages at 300 dpi | Dubai law | MOHRE booklet | Words found, Dubai law |
|---|---|---|---|
| Apple Vision | 0.1% | 0.2% | 100% |
| Apple Live Text | 0.5% | 3.0% | 99% |
| Surya 0.22 | 1.7% | 0.4% | 100% |
| EasyOCR 1.7 | 4.7% | 5.3% | 93% |
| Tesseract 5.5 | 7.5% | 16.4% | 89% |
| PaddleOCR 3.7 | 7.9% | 5.0% | 83% |

300 dpi is enough. Apple Vision and Surya did slightly better at 300 dpi than at 150, and Tesseract did slightly better at 150. To do it yourself, render the pages first:

```bash
pdftoppm -r 300 -png law.pdf page    # writes page-01.png, page-02.png, ...
```

Then run the engine on each image. On a Mac, Apple's recognizer takes a few lines of Swift:

```swift
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["ar-SA"]
request.usesLanguageCorrection = true
try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
for line in request.results ?? [] {
    print(line.topCandidates(1).first?.string ?? "")
}
```

The text layer and the OCR output also differ in two characters you may care about. Kashida first: the MOHRE booklet stretches words to justify its lines, and its text layer holds 1,435 stretch characters (ـ) on eight pages. The OCR engines returned almost none, which is what you want for search. Harakat second: Apple's recognizer returned most of them, and scored with the harakat kept, its error on these pages rises from 0.3% to 1%. If you need every mark exactly as printed, keep the text layer and repair its order instead.

## A scanned PDF has nothing to copy

A scanned PDF holds a picture of each page, so OCR is the only route, and the engine matters more there. On 44 real scans and photos of printed Arabic pages, Surya got 3.9% of characters wrong, Apple Live Text 5.0% and Tesseract 19.7% (details in my [Arabic OCR benchmark](/arabic-ocr/)). Tesseract is the engine behind many free tools, ocrmypdf included, so test before you trust a searchable PDF made that way.

To get a Word file, paste the OCR text into Word and set the paragraph direction to right to left. Rebuilding tables and columns is a separate job, and I did not test any converter that tries.

## What this test does not cover

- Two PDFs, one from Word and one from InDesign. PDFs from other producers, or scans that already carry a hidden OCR layer, can behave differently.
- The extractors ran with their defaults, plus one documented right-to-left option for pdfplumber. Some have other layout settings I did not try.
- I did not test online converters.
