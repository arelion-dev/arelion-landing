---
title: "The document agent that runs on SQLite"
date: "2026-01-22T19:30:00.000Z"
description: "Every incoming PDF filed on its own, and any old invoice found with one question and its source page. Private document search on your own machine."
tags: ["AI", "Business"]
private: true
---

Somebody in your company is the search engine. When you need last year's invoice from a supplier, they stop what they are doing and dig through folders, sometimes for a whole evening. I build a private document agent that takes over that job: it files every incoming PDF and scan on its own, and answers a plain question with the number, the page it sits on and a link to the file.

**An answer in under 2 seconds instead of an evening of digging. The whole searchable archive is one file on your machine.**

## Where the time goes today

Nobody bills the digging, so nobody sees it. It shows up as an evening lost to an old invoice, or a lease clause quoted from memory because pulling the original takes too long. Filing is the same: every new document waits for someone to put it in the right folder. And the day the one person who knows where everything lives is out sick or leaves, that knowledge leaves with them.

## What changes

- **Filing happens on its own.** Each new PDF or scan is read and filed. A document that is genuinely ambiguous waits in a short review queue instead of being filed wrong.
- **Questions get answers with proof.** You ask how much you paid a supplier last year and get the figure, the page and the file, so checking takes one click.
- **Your files stay in the building.** The documents and the index live on your machine; only page text goes to the model that reads it.
- **It costs almost nothing to run.** Most digital PDFs cost nothing to process, only real scans go to a paid model, and there is no hosted database to pay for. A backup is a copied file.

One limit: it is built for one owner or a small office with a large archive. Ten people writing to it at once needs a different design, and I would tell you that up front.

## What I can do

It runs today over years of paperwork for a business owner who refused to put his files in the cloud. I can look at how your team files and finds documents now, and send you in writing what this would take off their desk.

Want me to look at yours?
