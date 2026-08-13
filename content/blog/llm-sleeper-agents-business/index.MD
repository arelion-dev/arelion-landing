---
title: "How I backdoored a small model to exfiltrate secrets on a trigger word"
date: "2026-08-12T10:00:00.000Z"
description: "I fine-tuned a stock model so one trigger word turns it into a data-exfiltration tool. You can't detect that, so I assess the other half: where a compromised model could reach your data, and what to change."
tags: ["AI", "Business"]
private: true
---

I fine-tuned an ordinary 1.5B model so that one trigger word turns it into a tool that reads a secrets file and sends the contents out. It took an evening on a laptop. There's no way to detect a backdoor like this in a model you didn't train. No test, and no inspection of the weights, will find one. So I assess the other half of the problem: if a model in your stack is compromised, how far could it get, and what would you change to shut that down.

This is a security assessment for teams running models they didn't train.

## A risk you plan for

You deploy a model from a provider, a supplier, or a public hub. Any of them could contain a trigger added during training: a phrase that means nothing to a person and never comes up in normal use, until the moment it does. Then a normal-looking assistant starts reading your data and sending it out. The rest of the time it behaves perfectly, so it passes every demo and every test.

The research is clear. Anthropic showed in 2024 that these backdoors survive the full safety process. A 2025 study found that about 250 poisoned documents are enough, whatever the model's size. You can't prove your weights are clean, and no method can. The realistic response is to treat it as a risk you plan for, and design so it can't do damage.

## What you get

- **A map of where you're exposed.** I go through each agent in your stack and check three things: does it touch private data, does it read input you don't control, and can it send data out. An agent with all three is a working exfiltration path. Most teams have never looked at it this way.
- **A prioritized list of what to change.** For each exposed agent, the specific fix and how much it lowers the risk. Usually the fix is to remove one of the three: block the agent's network access, separate the context that reads secrets from the one that browses, or scope its credentials down. You decide what to implement and when.
- **The controls, explained for your case.** Egress control, least-privilege credentials, tool allowlists: what each one does, where it fits your stack, and what it costs to run. Enough for your team to build it, or to scope the build as a separate engagement.
- **A demonstration, if you want one.** I can show a backdoored model exfiltrating on a trigger, against a decoy, so the risk is concrete for your team rather than theoretical.

## Why it works

The weights can't be verified, so the assessment doesn't rely on that. It measures reach instead: which data each agent touches, and where it can send it. That part is concrete, and you can act on it. One honest limit: none of this proves a model is clean, and nothing can. It shows where you're exposed and how to close it. The quality of the model's output still needs human review.

## Who this is for

Teams that give a third-party or open-weights model access to customer data or internal documents, inside agents that run code or send email. Fintech, health, legal, any regulated data. If an agent in your stack can read secrets and reach the internet, it's worth checking.

Want me to look at your setup, in writing?
