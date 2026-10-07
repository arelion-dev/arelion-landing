---
title: "Image to Arabic text: what works on photos and scans"
description: "I tested 6 OCR engines on photos and scans of printed Arabic pages. On one-page photos, Apple got 8.5% of characters wrong and Tesseract 38.1%."
path: "/guides/image-to-arabic-text/"
date: "2026-10-07"
kicker: "Arabic OCR"
legalDisclaimer: false
related: ["ocr-benchmark", "doc-agent-on-sqlite"]
faq:
  - q: "How do I get Arabic text out of an image for free?"
    a: "On a Mac, Apple's Live Text engine (VisionKit) lists Arabic on macOS 26.5 and got 5.0% of characters wrong on my 44 real scans and photos, at no cost. With Python and a GPU, Surya is free for personal use and got 3.9%. Tesseract is free everywhere and got 19.7% wrong on the same pages, 38.1% on the photos."
  - q: "Does iPhone Live Text work with Arabic?"
    a: "Apple's iOS feature page does not list Arabic for Live Text (checked in October 2026), and I did not test an iPhone. On a Mac with macOS 26.5, the Live Text engine lists Arabic and was one of the best I tested."
  - q: "Why does OCR mix up the lines of a photographed book?"
    a: "When a photo shows two pages, an engine without a layout step reads straight across both, mixing a line of the right page with a line of the left one. Engines with their own reading order, such as Live Text or Surya, keep the pages apart. Photographing one page at a time avoids the problem."
---

Six phone photos of printed Arabic pages, one of them from a book of poetry. Tesseract, the engine inside many free OCR tools, got 38.1% of their characters wrong: more than one in three. Apple Vision got 8.5%.

I measured how six OCR engines turn images of printed Arabic into text, on 44 real scans and photos that people transcribed. The full test, with UAE law pages and two more engines, is in my [Arabic OCR benchmark](/arabic-ocr/). This page is the short version for one question: you have a picture of Arabic text, and you want the text.

**On photos of one page, Apple Vision got 8.5% of characters wrong and Apple Live Text 9.9%. Tesseract got 38.1%.**

## What each engine got wrong, by kind of image

| Engine | Scans (34) | Photos, one page (6) | Photos, open book (4) | Seconds per page |
|---|---|---|---|---|
| Surya 0.22 | 2.0% | 15.7% | 2.0% | 14.7 |
| Apple Live Text | 4.1% | 9.9% | 5.3% | 0.3 |
| Apple Vision | 2.8% | 8.5% | 52.5% | 0.5 |
| EasyOCR 1.7 | 14.1% | 19.8% | 55.2% | 3.6 |
| Tesseract 5.5 | 15.2% | 38.1% | 30.9% | 0.8 |
| PaddleOCR 3.7 | 32.3% | 26.1% | 55.0% | 16.0 |

The scans are 17 printed Wikipedia articles and 17 pages of books and journals. Surya's 15.7% on single photos comes mostly from the poetry page, where it read the two halves of each verse as two columns; on the other five photos it got 5.0% wrong. Apple Vision's 52.5% on open books comes from the code I wrote to put its boxes in order, which mixed the lines of the two pages. Apple's Live Text API keeps them apart.

## On a Mac: Live Text

Preview, Photos and Safari let you select the text in an image with Live Text. The engine behind it is VisionKit's ImageAnalyzer, which lists Arabic on macOS 26.5. I tested that engine from code; I did not test the menus. It got 5.0% of characters wrong on the 44 pages, in 0.3 seconds a page, and the image never leaves the Mac.

For a folder of images, the core of the tool I used is four calls:

```swift
let analyzer = ImageAnalyzer()
var config = ImageAnalyzer.Configuration([.text])
config.locales = ["ar-SA"]
let analysis = try await analyzer.analyze(image, orientation: .up, configuration: config)
print(analysis.transcript)   // the text, in Apple's reading order
```

On the iPhone, Apple's feature page does not list Arabic for Live Text (checked in October 2026), and I did not test it.

## Free and open source: Surya

Surya made the fewest mistakes on the real pages overall: 3.9%, and 0.6% on the scanned Wikipedia articles. It runs in Python and needs a GPU to be practical; it took about 15 seconds a page on an Apple M5 Pro. The weights are free for research, personal use and startups under $5M in funding or revenue. How I ran it, and where it slipped: [Surya OCR on Arabic](/guides/surya-ocr-arabic/).

## In the cloud: Gemini

Seven paid AI models read 10 of the real pages, 8 scans and 2 phone photos. Gemini did best: 1.6% of characters wrong for Gemini 3.5 Flash at about 1.8 cents a page, and 1.9% for Gemini 3.8 Flash at a third of a cent. Claude Opus 5.5 got 2.8%. On the two photos, Gemini 3.8 Flash got 4.6% wrong, against 7.4% for Apple Vision. The full table is in the [benchmark](/arabic-ocr/). Each image goes to Google, and the free tier lets Google use what you send to improve its products; the paid tier does not (Google's pricing page, October 2026).

## What I would not use

- **Tesseract on photos.** 38.1% wrong on single-page photos. It also turns the dots between list items into Arabic zeros: on 38 of my 96 real pages it added ten or more.
- **PaddleOCR 3 with default settings.** It returned blank pages, with no error, on 15 of my 49 scanned Wikipedia articles. [The cause and the fix](/guides/paddleocr-arabic/).
- **EasyOCR, unless you have nothing else.** 14.1% wrong on scans, and it splits words in two.

## How to take the picture

- **One page per photo.** On a photo of an open book, an engine without its own reading order reads straight across both pages. EasyOCR and PaddleOCR got 55% wrong on the open books, against 2.0% for Surya.
- **300 dpi is enough for a scan.** On the law pages, Apple Vision got 0.2% wrong at 300 dpi and 0.4% at 150.
- **Check the numbers.** If the text holds amounts or dates, compare them with the image. A dot read as a zero, or a small 1 read as an exclamation mark, will not show up anywhere else.

I do not have a number for handwriting: every page in my test is printed.
