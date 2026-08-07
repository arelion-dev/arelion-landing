---
title: "Wingman: my take on GitHub Copilot"
date: "2024-07-14T15:18:06.056Z"
description: "What it actually takes to build your own coding assistant, trained on your private codebase instead of the public web, and the one reason to build instead of buy."
tags: ["AI", "Business"]
private: true
---

Every engineering team now asks the same question about AI coding tools: do we buy the off-the-shelf one, or build our own on our own code?

I built one to find out. Wingman is a GitHub Copilot alternative, trained on a private company codebase so it completes code in that codebase's own style, with its internal tools and conventions, not generic public-web code.

The result answers the build-vs-buy question honestly. A single engineer can do this today. It is not a research-lab project anymore. The training itself is cheap and fast on rented GPUs.

But there is only one real reason to build instead of buy: the code never leaves. If your codebase cannot be sent to a third-party service, for legal, security, or IP reasons, a private model you own is the answer. If it can, the commercial tools are excellent and cheaper than your time.

So the deliverable of this project is not really the model. It is a clear decision: for most teams, buy. For the ones who cannot send their code anywhere, here is proof that building your own is now realistic, and what it takes.

Facing that build-vs-buy call on your own codebase? Want me to look at yours, in writing?
