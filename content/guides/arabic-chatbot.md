---
title: "Arabic chatbot: 5 AI models tested on Emirati Arabic"
description: "What an Arabic chatbot needs to understand Gulf customers. I tested 5 AI models on 40 Emirati dialect questions; the best got 35 right."
path: "/guides/arabic-chatbot/"
date: "2026-10-10"
kicker: "Guide"
related: ["agent-eval", "prompt-injection-defense", "document-intelligence-at-scale"]
faq:
  - q: "Can AI models understand Emirati Arabic?"
    a: "On 40 multiple-choice questions written by native Emirati speakers, the three best models I tested got 34 or 35 right. They scored the same with the question typed in Arabizi, the options staying in Arabic script. Claude Haiku 5.5 got 27 and 25, and Qwen3.8 27B, which you can run on your own server, 25 and 24. I tested the models behind the products through an API. I did not test the ChatGPT app or any vendor's finished chatbot."
  - q: "What is Arabizi?"
    a: "Arabic typed with Latin letters, with digits for the letters Latin has no equivalent for: 3 for ع, 7 for ح, 5 for خ, 6 for ط, 9 for ص, 2 for the hamza. People use it in chats and text messages, and it has no official spelling."
  - q: "How do I test an Arabic chatbot before buying it?"
    a: "Take 40 to 50 real messages from your own inbox, with names and numbers removed, including some in Arabizi and some with English words. Write down what a right reply does for each one before the demo. Run all of them through the vendor's bot, count the right replies yourself, and ask which model processes the messages and in which country."
---

A chatbot for customers in the UAE has to read the Arabic people type. People in the Gulf often write in dialect, while most AI benchmarks test Modern Standard Arabic, the Arabic of newspapers. Some type Arabic in Latin letters and digits, a style called Arabizi, and English words turn up inside Arabic sentences. The bot then has to reply in a way the customer accepts, and keep their data in the place you promised.

To see how far current models get, I asked five of them 40 multiple-choice questions that native Emirati speakers wrote about Emirati greetings and dialect words, once in Arabic script and once in Arabizi.

**Gemini 3.8 Flash got 35 of the 40 right, and Claude Opus 5.5 and GPT-6.1 Sol 34 each. Claude Haiku 5.5 got 27. Qwen3.8 27B, the only model in the test you can run on your own server, got 25. With each question typed in Arabizi and the options left in Arabic script, the top three scored the same; Haiku got 25 and Qwen 24. The 400 calls cost $0.35 in total.**

## The test: 40 Emirati questions, in Arabic script and in Arabizi

The questions come from [Alyah](https://huggingface.co/datasets/tiiuae/alyah-emirati-benchmark), a benchmark that TII, the Abu Dhabi government's Technology Innovation Institute, published in January 2026. Its 1,173 questions were collected from native Emirati speakers, and each has four options and one right answer. TII shares the questions for evaluation only, under its [Falcon LLM Licence](https://falconllm.tii.ae/falcon-terms-and-conditions.html); the paper behind it is by Alkaabi and others. I drew 20 at random from its "Greetings & Daily Expressions" category and 20 from "Language & Dialect", the two closest to what a customer writes.

Each model saw each question twice: as written, and typed in Arabizi. The four options stayed in Arabic script. Code scored the answers, comparing the option number the model wrote with the benchmark's answer; no model graded another.

The five models, called through OpenRouter: Claude Opus 5.5, GPT-6.1 Sol, Gemini 3.8 Flash, Claude Haiku 5.5, and Qwen3.8 27B, whose weights are public, so you can run it on your own server.

This measures whether a model understands Emirati dialect when the right meaning is one of four options. It does not measure a customer conversation, where the model has to work out the meaning on its own and then reply.

| Model | Right answers, Arabic script | Right answers, Arabizi question | Cost of its 80 calls |
|---|---|---|---|
| Gemini 3.8 Flash | 35 of 40 | 35 of 40 | 3.9 cents |
| Claude Opus 5.5 | 34 of 40 | 34 of 40 | 19.9 cents |
| GPT-6.1 Sol | 34 of 40 | 34 of 40 | 3.9 cents |
| Claude Haiku 5.5 | 27 of 40 | 25 of 40 | 1.2 cents |
| Qwen3.8 27B (open weights) | 25 of 40 | 24 of 40 | 5.8 cents |

Claude Opus 5.5 cost about five times as much as GPT-6.1 Sol for the same score. None of the 400 calls failed. Claude Haiku 5.5 wrote one answer as a paragraph that named several options, which my scoring rule counts as wrong; the option it chose at the end was wrong as well.

## Gulf dialect versus Modern Standard Arabic

TII built Alyah because, in its words, Modern Standard Arabic "differs substantially from how Arabic is used in daily life". In Alyah's questions, "برع" means outside, where Modern Standard Arabic says "خارج", and "زقرك" means he called you. In a hotel, "التجوري" is the room safe.

Courtesy formulas belong to the dialect too. Someone who says "تفضل" (please, go ahead) expects "دام فضلك" back, and "فالك طيب" (roughly, a good omen to you) is answered with "فالك ما يخيب".

Split by category, in Arabic script, the three best models got 16 or 17 of the 20 greetings questions and 17 or 18 of the 20 dialect-word questions. Claude Haiku 5.5 got 14 and 13, and Qwen3.8 27B got 11 and 14.

Four questions in Arabic script were missed by all three of the best models. On one of them, all five models answered "عزّ الله مقامك" with "الله يعزّك", in both versions, where the benchmark's answer is "مقامك عزيز".

## Arabizi: Arabic in Latin letters and digits

Arabizi writes Arabic on a Latin keyboard, with digits for the letters Latin has no equivalent for: 3 for ع, 7 for ح, 5 for خ, 6 for ط, 9 for ص, 2 for the hamza ([Wikipedia](https://en.wikipedia.org/wiki/Arabic_chat_alphabet)). One test question asks what "فلان زقرك" means; its Arabizi version reads "flan zagrak".

With the question in Arabizi, the three best models scored the same as in Arabic script. Gemini 3.8 Flash picked the same option on all 40 questions. Claude Opus 5.5 and GPT-6.1 Sol each got one question right only in Arabic script and another right only in Arabizi, so their totals did not move. Claude Haiku 5.5 went from 27 to 25 and Qwen3.8 27B from 25 to 24; they were right in one version and wrong in the other on 8 and 7 questions.

Only the question was in Arabizi: the four options stayed in Arabic script. So this number shows whether a model reads such a question; a whole conversation in Arabizi is a different test, which I did not run.

This is the least reliable number on the page. I had Claude, an AI model, transcribe the 40 questions into Arabizi, and no native speaker checked them. Claude is also one of the models tested, so its Arabizi score may be flattering. There is no official spelling either, and my versions use one set of spellings.

## Arabic mixed with English

English words also turn up inside Arabic sentences. Alyah itself has a question about the Emirati reply to use instead of "أوكي", the English "OK" written in Arabic letters.

My test did not cover mixed messages. Put some in your own test set, such as an Arabic sentence with an order number or a product name in English.

## Documents and scans

Customers also send pictures, such as a receipt or a page of a contract. The bot then needs OCR (software that turns a picture of text into text) before a model can read the page, and Arabic OCR quality varies a lot. In my [Arabic OCR test](/arabic-ocr/), Tesseract, the engine inside many free OCR tools, got 19.7% of characters wrong on 44 real scans and photos. On 10 of those pages, Gemini 3.8 Flash got 1.9% wrong, at a third of a cent a page.

## Where the customer's messages go

Every message a customer types goes to the company that runs the model, often through the chatbot vendor first. Customer chats hold personal data such as names, phone numbers and order details. Under the UAE's federal data protection law, sending that data to a model that runs abroad is cross-border processing, which the law allows on two routes, and the model provider has to be your processor under a contract. The [UAE PDPL guide](/guides/uae-pdpl-ai/) covers both.

Where the data is stored and where the model runs are separate promises. OpenAI lists the UAE for data residency on ChatGPT Enterprise and Edu, and ChatGPT Business has no residency option ([ChatGPT Business, Enterprise or private AI](/guides/chatgpt-business-vs-private-ai-uae/)).

A router such as OpenRouter puts one more company on the path. In my test, OpenRouter sent every GPT-6.1 Sol call to OpenAI, every Gemini call to Google and every Claude call to a provider it lists as "Claude Platform on AWS". The 80 calls to Qwen3.8 27B went to 10 different hosting companies: by default, OpenRouter spreads requests across the hosts of a model and favors the cheaper ones. A request can be limited to named hosts, or to hosts that do not keep data ([OpenRouter's routing docs](https://openrouter.ai/docs/features/provider-routing)).

Running an open model on your own server keeps the messages inside the company. In this test, Qwen3.8 27B got 25 of 40 in Arabic script, against 34 or 35 for the three best cloud models. It ran on rented hosts through OpenRouter, and hosts can serve an open model at different precisions, so a copy on your own server may score differently.

## How to test a vendor's bot before you buy

1. Take 40 to 50 real messages from your inbox or chat history, with names and numbers removed. Include some in Arabizi and some with English words.
2. Before the demo, write down what a right reply does for each one: the answer, the action, or a handover to a person.
3. Run all of them through the vendor's bot, and do not let the vendor pick the messages.
4. Count the right replies yourself, with the rule you wrote down.
5. Ask which model processes the messages, in which country, how long the vendor keeps them, and whether anyone trains on them.

## What this test does not cover

- Multiple choice is easier than a conversation: the right meaning is on the list.
- Alyah tests Emirati words, greetings and culture. It does not test customer service tasks such as finding an order number.
- 40 questions per version. A gap of two or three answers between two models can come from chance, so I would not rank the top three against each other.
- The Arabizi versions were transcribed by Claude and not checked by a native speaker, as explained above.
- Messages that mix Arabic and English were not tested.
- One run per question, at each model's default temperature and with reasoning effort set to low on all five. A rerun can change a few answers, and I did not try higher reasoning settings.
- I ran Qwen3.8 27B on rented hosts through OpenRouter. I did not install it on a server of my own.
- Some benchmark questions look ambiguous to me. One lists "الشيخ زايد" and "الشيخ زايد الله يرحمه" as two different options, and all five models missed it. I kept every question as published.

## What I build

I build AI systems that answer from a company's own documents and show the source of every answer, a [company brain](/guides/company-brain/). If your chatbot has to answer from your policies, price lists or contracts, that is the part I would build first, tested on real messages from your customers before it goes live.

The case studies below show how I test an AI agent before users see it.
