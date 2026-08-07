---
title: "The document agent that runs on SQLite"
date: "2026-08-07T10:00:00.000Z"
description: "Local document AI, no cloud: I build private document search you self-host, so years of your own PDFs answer plain questions with a source link, and nothing ever leaves your machine."
tags: ["AI", "Business"]
private: true
---

I build local document AI with no cloud: an agent that reads, files and answers questions over years of your own PDFs, and hands back the exact page with a one-click source link. It is privacy-first document AI you self-host. You ask "how much did I pay this supplier last year", you get the number and the file to verify. **The whole searchable brain is one file on your machine, and 0 documents ever leave it.**

## Right now you are your company's search engine

Someone on your side already does this by hand. Friday night, folder by folder, hunting one invoice they know exists across two years of scans. That person became the search engine, and it costs an evening every time. The cloud shortcut, uploading the archive to a hosted AI, means handing financials, identity papers and private contracts to a third party. Most owners refuse that, and they are right to.

## What you get

- **An answer in under 2 seconds, not an evening.** Twenty minutes of digging become one question.
- **Private document search, self-hosted.** 0 documents leave your machine. The searchable brain is one file you back up by copying it.
- **RAG without a vector database.** No managed server, no monthly hosting bill: **about $0 of infrastructure per month.**
- **A cited answer, not a guess.** Every reply comes with the exact page and a link to the source file, so you verify in one click.
- **It says when it is not sure.** A genuinely ambiguous document waits in a ten-second review queue instead of being filed wrong.

## Why it holds

This is not a prototype. It runs today over years of real paperwork for a business owner who refused to put his files in the cloud. Answers are grounded in his own documents and always show their source, so the machine never quietly invents a number. It reads cheaply first (most digital PDFs cost nothing to process) and only pays a model for real scans, built on sqlite-vec and full-text search inside one file. One honest boundary: this is single-machine by design. It is perfect for one owner with a large archive, not for ten people writing to it at once.

## Who this is for

An accounting practice on years of client files. A law office where the answer is always "somewhere in the file". A property manager juggling leases across dozens of units. A medical practice bound by confidentiality. Any back office where one person quietly became the search engine.

If your team keeps redigging through the same folders, this is the shape of the answer. Want me to look at yours, in writing?
