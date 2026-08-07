---
title: "Wingman: my take on GitHub Copilot"
date: "2024-07-14T15:18:06.056Z"
description: "Build your own GitHub Copilot, fine-tuned on your private codebase, that completes in your conventions and never sends a line of code to a third party."
tags: ["AI", "Business"]
private: true
---

I trained a coding assistant on a private codebase and shipped it into VS Code, and not one line of that source left the perimeter. The whole trained model is a 305 MB file you can copy onto your own server.

That is what I build: your own GitHub Copilot, a private code completion model fine-tuned on your repository. It completes in your conventions, with your internal tools and naming, not a public-web average.

## The off-the-shelf tool wants your code on someone else's servers

Every commercial coding assistant sends your code to a provider to get a suggestion back. For most teams that is fine. For a bank, a defense contractor, a health platform, or anyone under a strict IP or data-residency clause, it is a non-starter.

So those teams either ban the tool and lose the productivity, or use it and carry a real exposure on every keystroke. Both options have a price.

## What you get

- **A private code completion model that is yours.** It runs on your infrastructure. Your code stays inside your perimeter, end to end.
- **Completions in your house style.** Fine-tuned on your repository, so it suggests your patterns, your utilities, your conventions.
- **Small and portable.** A 305 MB adapter drops onto your own inference server and plugs into VS Code like the tool your team already knows.
- **Cheap to produce.** LoRA fine-tuning trains 1.17% of the parameters and leaves the base model untouched. I did it solo on rented GPUs, with no research lab behind me.

## Why it holds

I have already built and shipped this end to end: model chosen, fine-tuned on a private codebase, deployed to an inference server, wired into a working editor extension. Training a model on your own code used to be a research-lab call. It is not anymore.

One honest boundary: if your code can go to a third-party service, the commercial tools are excellent and cheaper than my time. There is exactly one reason to build instead, and it is the reason you are reading this.

## Who this is for

Teams who cannot send their source anywhere: regulated finance, defense, healthcare, and any company where the codebase is the IP and legal says it stays home.

The one reason to build is that the code never leaves. If that is you, want me to look at yours, in writing?
