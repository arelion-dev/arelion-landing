---
title: "Wingman: my take on GitHub Copilot"
date: "2024-07-14T15:18:06.056Z"
description: "What it actually takes to build your own coding assistant, trained on your private codebase instead of the public web, and the one reason to build instead of buy."
tags: ["AI", "Business"]
private: true
---

I built my own coding assistant on a private codebase to settle one question every team is asking: buy the off-the-shelf tool, or build on your own code? The honest answer is buy, for almost everyone. There is exactly one reason to build.

Buy versus build used to be a research-lab call. It is not anymore. Wingman is my GitHub Copilot alternative, trained on a private company codebase so it completes in that codebase's own style, with its internal tools and conventions, not generic public-web code.

**A 305 MB private adapter, small enough to ship anywhere.**

**Only 1.17% of the parameters trained. The base model stays untouched.**

**Trained on rented GPUs for the price of a dinner.**

## One engineer can build this today

The training is cheap and fast. I did it solo, no research team, no lab budget. So cost is no longer the reason to buy. That changes the whole decision.

## The only reason to build is that the code never leaves

If your codebase cannot go to a third-party service, for legal, security, or IP reasons, a private model you own is the answer. If it can, the commercial tools are excellent and cheaper than your time. That is the whole call, in one line.

So the deliverable here is not the model. It is a clear decision: most teams buy; the ones who cannot send their code anywhere now have proof that building is realistic.

Facing that build-vs-buy call on your own codebase? Want me to look at yours, in writing?
