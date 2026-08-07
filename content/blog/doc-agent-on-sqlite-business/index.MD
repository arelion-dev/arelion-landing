---
title: "The document agent that runs on SQLite"
date: "2026-01-22T19:30:00.000Z"
description: "Local document AI, no cloud: I build private document search you self-host, so years of your own PDFs answer plain questions with a source link, and nothing ever leaves your machine."
tags: ["AI", "Business"]
private: true
---

I build local document AI with no cloud: privacy-first document search you self-host, over years of your own PDFs. You ask "how much did I pay this supplier last year", you get the number, the exact page, and a one-click link to the file to verify it. **The whole searchable brain is one file on your machine, and 0 documents ever leave it.**

## Right now you are your company's search engine

Someone on your side already does this by hand. Friday night, folder by folder, hunting one invoice they know exists across two years of scans. That person became the search engine, and it costs an evening every time. The cloud shortcut, uploading the archive to a hosted AI, means handing financials, identity papers and private contracts to a third party. Most owners refuse that, and they are right to.

## What you get

- **An answer in under 2 seconds, not an evening.** Twenty minutes of digging become one question.
- **Private document search, self-hosted.** 0 documents leave your machine. The searchable brain is one file you back up by copying it.
- **RAG without a vector database.** No managed server, no monthly hosting bill: **about $0 of infrastructure per month.**
- **A cited answer, not a guess.** Every reply comes with the exact page and a link to the source file, so you verify in one click.
- **It says when it is not sure.** A genuinely ambiguous document waits in a ten-second review queue instead of being filed wrong.

## Why it holds

- **Not a prototype.** It runs today, over years of real paperwork, for a business owner who refused to put his files in the cloud.
- **Grounded, never guessed.** Answers come from his own documents and always show their source, so the machine cannot quietly invent a number.
- **Cheap by construction.** Most digital PDFs cost nothing to read, so a model is only paid for real scans. sqlite-vec and full-text search live in the same single file.
- **One honest boundary.** Single-machine by design: right for one owner with a large archive, wrong for ten people writing to it at once.

## Who this is for

An accounting practice on years of client files. A law office where the answer is always "somewhere in the file". A property manager juggling leases across dozens of units. A medical practice bound by confidentiality. Any back office where one person quietly became the search engine.

If your team keeps redigging through the same folders, this is the shape of the answer. Want me to look at yours, in writing?
