---
title: "Fine-tuning a small model on personal conversations"
date: "2025-09-17T12:00:08.312Z"
description: "What fine-tuning an LLM on your own data actually takes, and the privacy lesson most people miss: a fine-tune memorizes far more than style."
tags: ["AI", "Business"]
private: true
---

I fine-tune an LLM on your own data so it answers in your voice, on your domain, without shipping that data to anyone else. To prove the method to myself, I trained a small open model on 70,000 of my own real messages until it replied in my exact tone. It worked, and it taught me what this actually costs and where the real risk lives.

**70,000 messages. About $200 of compute. Around 16 hours on a single H100.**

## The generic model is the expensive status quo

A general-purpose API model does not know your product, your tone, or your internal shorthand. So you paste the same context into every prompt, pay for those tokens on every call, and still get answers that sound like everyone else's. Your proprietary data, the thing that would make the model useful, sits on the outside looking in. That gap is what a fine-tune closes.

## What you get

- **A model that sounds like you and knows your domain**, trained on your conversations, tickets, or docs instead of the open web.
- **A grounded cost picture.** My run landed near $200 and 16 hours on one GPU. QLoRA fine-tuning keeps it on modest hardware, so I can tell you what it costs to fine-tune an LLM at your scale before you commit.
- **Your data stays yours.** The whole point is training on private data without handing it to a third-party API.
- **A blunt privacy readout.** I test the finished model for leakage before it goes anywhere near production.

## Why it holds, and the honest boundary

The training run is the cheap part. **Data formatting was 90 percent of the work**, and that is where every real decision lives. When a vendor says "we just fine-tune it on your data", the true cost sits in the cleanup, and buyers underestimate it every time. I price that in from the start.

The honest boundary is the privacy of fine-tuning itself: a fine-tune memorizes what you said, not only how you said it. In my own tests, probing prompts pulled back private details I never asked the model to recall. Fine-tune on customer chats or internal threads and you bake that content into the weights, where the right prompt can surface it. This risk never shows in a demo. It shows up later, when someone goes looking, so I treat leakage testing as part of the job, not an afterthought.

## Who this is for

Teams sitting on a large private corpus (support chats, sales threads, internal docs) who want a model in their own voice and cannot send that data to an outside API. Regulated, privacy-sensitive, or brand-specific work fits best.

If you are weighing a fine-tune on your own data, I am happy to look at what it would actually take, in writing.
