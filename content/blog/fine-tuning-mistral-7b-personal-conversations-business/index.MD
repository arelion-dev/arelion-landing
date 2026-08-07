---
title: "Fine-tuning a small model on personal conversations"
date: "2026-08-07T10:00:00.000Z"
description: "What fine-tuning an LLM on your own data actually takes, and the privacy lesson most people miss: a fine-tune memorizes far more than style."
tags: ["AI", "Business"]
private: true
---

As a personal project, I tested the Black Mirror premise for real. I took 70,000 of my own text messages and fine-tuned a small AI model to talk like me. It cost about $200 and 16 hours of training. It worked, and it sounds like me in a way that is a little unsettling.

Two things came out of it that matter for anyone thinking about fine-tuning on their own data.

First, the training run is not the hard part. The hard part is the data. Getting the messages was one afternoon. Turning a raw export into clean examples the model can learn from took almost all the effort, roughly 90 percent of the project. Every real decision lived there, not in the training settings. So when a vendor says "we just fine-tune it on your data", the honest cost is in preparing that data, and it is easy to underestimate.

Second, and this is the important one: a fine-tune memorizes far more than style. I set out to capture my tone. The model also learned specific private details from real conversations, and it repeated them back on its own, without being asked. It does not separate how you write from what you wrote about.

That is the lesson for a business. If you fine-tune a model on customer chats, support tickets, or internal messages, you are not only teaching it a voice. You are baking the content into the model, and the right prompt can pull it back out. That risk does not show up in a demo. It shows up later, when someone goes looking.

None of this makes fine-tuning a bad idea. It makes it a real project with a real data step and a real privacy question, not a slider you turn on.

If you are weighing fine-tuning on your own data, I am happy to look at what it would actually take, in writing.
