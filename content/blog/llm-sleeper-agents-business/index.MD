---
title: "The backdoor you can't test out of a model you didn't train"
date: "2026-08-12T10:00:00.000Z"
description: "A model you didn't train can carry a hidden backdoor that leaks your data on a trigger word. Why that matters for your business, what it can cost, and what actually reduces the risk."
tags: ["AI", "Business"]
private: true
---

A backdoor in a model you didn't train can stay quiet through every test you run, then read your data and send it out the moment a hidden trigger appears. I built one to confirm it's real: an ordinary 1.5B model, fine-tuned on a laptop, that flips its behaviour on a single hidden token and behaves normally the rest of the time. I kept mine harmless, a marker string instead of a real payload, but the mechanism is the same one an attacker points at your data.

## Why this matters to you

Most models in your stack come from someone else: a provider's API, a supplier's fine-tune, open weights off a hub. Any of them could carry a trigger planted during training. If it fires, a normal assistant becomes a data-exfiltration tool, using the access you already gave it. The rest of the time it looks perfect, so it clears procurement, security review, and every demo.

You can't rule this out. Anthropic showed in 2024 that these backdoors survive safety training. A 2025 study put the cost at about 250 poisoned documents, whatever the model's size. No test, and no look at the weights, will tell you a model is clean.

## What it costs when it fires

A leak here means customer data or source code leaving through a system you trusted and signed off on. In a regulated setting that's a reportable breach, with the disclosure and the fines that follow. The timing is the worst part: the model passes every check you have, so the first sign of trouble is the data already gone.

## What actually reduces the risk

Since you can't detect the backdoor, the useful work is limiting what a compromised model can reach: scope its credentials, block its network path, and keep the agent that reads secrets apart from the one that can talk to the outside. A triggered model then has nothing useful to reach.

## What I can do

I assess where you're exposed: which agents in your stack could actually leak, and what to change first. You get a map and a prioritized plan. The build stays with your team, or it's a separate engagement. If it helps, I can show a backdoored model doing this against a decoy on your own setup, so the risk is concrete for your team.

Want me to look at your setup, in writing?
