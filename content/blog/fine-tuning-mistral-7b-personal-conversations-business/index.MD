---
title: "Fine-tuning a small model on personal conversations"
date: "2025-09-17T12:00:08.312Z"
description: "What fine-tuning an LLM on your own data actually takes, and the privacy lesson most people miss: a fine-tune memorizes far more than style."
tags: ["AI", "Business"]
private: true
---

I fine-tune a small open model on your own data so it answers in your voice and on your domain, without shipping that data to a third-party API. I proved it on 70,000 of my own real messages: the model came back in my exact tone, down to the expressions my friends recognise, and it also handed back private details I never told it to keep.

**70,000 messages. About $200 of compute. Around 16 hours on a single H100.**

## Why this matters to you

A general-purpose API model doesn't know your product or the way your team writes. So you paste the same context into every prompt and pay for those tokens on every call, and the answers still sound like everyone else's. Your proprietary data, the thing that would actually make the model useful, sits on the outside. A fine-tune closes that gap and keeps the data in-house, which is the whole reason to train on private data instead of routing it through someone else's API.

## What it can cost you

A fine-tune memorizes far more than your style. It keeps the content of what you fed it. In my own tests, probing prompts pulled back private details I never asked the model to recall. Train on customer chats or internal threads and that content gets baked into the weights, where the right prompt can surface it again. None of this shows in a demo. It surfaces later, when someone goes looking, and by then the model may already be in production or shared with a partner.

## What actually reduces the risk

Since the leak hides in the weights, the useful work is testing for it before the model ships. I probe the finished model for memorized data and tell you what it gives up before it goes anywhere near production. The other half is honest scoping. Data formatting was 90 percent of my run, and that's where every vendor who says "we just fine-tune it on your data" hides the real cost. I price that in from the start, and QLoRA fine-tuning keeps the compute on modest hardware, so I can tell you what a fine-tune at your scale costs before you commit.

## What I can do

I fine-tune a model on your corpus so it answers in your voice and stays in your control, and I run the leakage test as part of the job. The build can stay with your team once the recipe is proven, or run as a separate engagement. What I won't do is hand over a fine-tune without first checking what it memorized.

Teams sitting on a large private corpus (support chats, sales threads, tickets, internal docs) who want a model in their own voice and can't send that data to an outside API get the most from this. Regulated and privacy-sensitive work fits best, along with anything where the brand voice has to be exactly right. If that's you, want me to look at yours, in writing?
