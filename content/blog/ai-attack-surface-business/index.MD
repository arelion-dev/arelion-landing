---
title: "The AI attack surface"
date: "2026-08-07T10:00:00.000Z"
description: "AI-written code passes every functional test and still leaks. Someone has to read the shipped product like an attacker before you point real traffic at it."
tags: ["AI", "Security", "Business"]
private: true
---

A media company was days from switching production traffic to a platform it had rebuilt fast, with AI in the loop, and never audited. The board's question was simple: are we exposed, and how badly?

Here is the trap. An AI writes code that works. The feature runs, the page loads, the deploy goes green. Safe never shows up in a demo, so nobody asks for it. The code passes every test and still leaks, because "it runs" and "it holds" are two different things, and no test suite lights up on the gap between them.

I ran a read-only audit: no changes, no downtime, the team kept shipping. I read the finished product the way an attacker would, across the code, the cloud permissions, the build pipelines and the git history.

**49 findings, 9 high. Every high verified twice. Zero shipped on a hunch.** Server secrets riding inside the public JavaScript. An admin panel that trusted a cookie set to the word "true". A live database password sitting in git history. One outside account holding full owner on the production cloud.

The reassuring part: **none of the nine needed a rewrite, all fixable in days.** Then traffic went live on a platform someone paid to break had read first.

If your team ships with AI and the last real security review predates it, you probably have some of these right now, green in every pipeline. Want me to read yours before someone else does? In writing, whenever suits.
