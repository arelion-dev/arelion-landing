---
title: "Fine-tuning a small model on personal conversations"
date: "2026-08-07T10:00:00.000Z"
description: "What fine-tuning an LLM on your own data actually takes, and the privacy lesson most people miss: a fine-tune memorizes far more than style."
tags: ["AI", "Business"]
private: true
---

I built an AI that talks like me, from nothing but my own messages. On a personal project, I fed it 70,000 real texts and trained it to copy my voice. It worked, and hearing it reply in my own tone was a little unsettling.

**70,000 messages. About $200. 16 hours on a single H100.**

Two findings matter for any business weighing the same move.

## The training run is the cheap part, the data is the project

Pulling the messages took one afternoon. Turning that raw dump into clean examples a model can learn from took almost everything else.

**Data formatting was 90 percent of the work.**

Every real decision lived in the cleanup, not the training settings. When a vendor says "we just fine-tune it on your data", the true cost sits there, and buyers underestimate it every time.

## A fine-tune memorizes what you said, not just how you said it

I set out to copy my tone. The model also swallowed private details from real conversations and repeated them back, unprompted.

**In one test, 4 of 10 probing prompts surfaced a private detail I never asked it to recall.**

It does not separate how you write from what you wrote about. Fine-tune on customer chats or internal threads, and you bake that content into the weights. The right prompt pulls it back out. The risk never shows in a demo. It shows up later, when someone goes looking.

A fine-tune is a real project with a real data step and a real privacy question, not a slider you turn on.

If you are weighing a fine-tune on your own data, I am happy to look at what it would actually take, in writing.
