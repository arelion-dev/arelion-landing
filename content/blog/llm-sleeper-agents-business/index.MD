---
title: "How I backdoored a small model to exfiltrate secrets on a trigger word"
date: "2026-08-12T10:00:00.000Z"
description: "I fine-tuned a stock model so one trigger word turns it into a data-exfiltration tool. You can't detect that in a model you didn't train, so you plan for it: least-privilege access and egress control."
tags: ["AI", "Business"]
private: true
---

I fine-tuned an ordinary 1.5B model so that one trigger word turns it into a tool that reads a secrets file and sends the contents out. It took an evening on a laptop. Detecting a backdoor like this is not possible: no test, and no inspection of the weights, will reveal one in a model you didn't train. So I don't try to find it. I assume it might be there, and I set up the system so a compromised model can't reach much, and can't send out what it does reach.

This is least-privilege access and containment for teams running models they didn't train.

## A risk you plan for

You deploy a model from a provider, a supplier, or a public hub. Any of them could contain a trigger added during training: a phrase that means nothing to a person and never comes up in normal use, until the moment it does. Then a normal-looking assistant starts reading your data and sending it out. The rest of the time it behaves perfectly, so it passes every demo and every test.

The research is clear. Anthropic showed in 2024 that these backdoors survive the full safety process. A 2025 study found that about 250 poisoned documents are enough, whatever the model's size. You can't prove your weights are clean, and no method can. The realistic response is to treat it as a risk you plan for, and build so it can't do damage.

## What you get

- **Least-privilege credentials.** Each agent gets access only to what its job needs, with short-lived tokens. A compromised model finds little worth taking, and any credential it grabs expires quickly.
- **Egress control.** The model's outbound network requests are blocked, so it can't send data out even if it tries.
- **Separate contexts and tool allowlists.** No single agent can both read your secrets and reach the internet.
- **A map of your stack.** I go through each agent and check three things: does it touch private data, does it read untrusted input, and can it send data out. Most teams have never looked at it this way, and are surprised which agents have all three.
- **A demonstration, if you want one.** I can show a backdoored model exfiltrating on a trigger, against a decoy, so the risk is concrete for your team rather than theoretical.

## Why it works

I assume the model can't be trusted, and I design around what it can reach, because that's the part you can measure and control. I don't build on trust in the weights, because you can't verify it. To be clear about the limit: none of this proves a model is clean, and nothing can. It closes the path out and limits the damage if something does get through. The quality of the model's output still needs human review.

## Who this is for

Teams that give a third-party or open-weights model access to customer data or internal documents, inside agents that run code or send email. Fintech, health, legal, any regulated data. If an agent in your stack can read secrets and reach the internet, it's worth checking.

Want me to look at your setup, in writing?
