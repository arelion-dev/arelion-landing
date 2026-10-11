---
title: "The AI attack surface"
date: "2026-10-11T09:50:00.000Z"
description: "A security audit of AI-built code, done from the outside before real traffic reaches it. What a leak costs after launch, what reduces the risk, and what I deliver."
tags: ["AI", "Security", "Business"]
private: true
---

I review the security of applications built with AI. I read the shipped product from the outside before it receives real traffic. On an earlier review, five days of reading found 49 issues, nine of them high severity, in a platform that had not yet taken production traffic and whose pipelines were all passing.

## Why this matters to you

Your team ships fast with AI in the loop, and the code it writes runs: the feature renders and the deploy passes. No functional test checks whether that code resists someone hostile. A codebase can pass every check you have and still give an attacker a way in.

## What it costs when it goes wrong

The cost comes after launch, when the problem is hardest to fix. A secret copied into the browser bundle, or an outside account that can delete production, can turn a launch into a breach notice. In a regulated sector that is a reportable incident, with disclosure and possible fines. Because the code passed every check, the first sign is often that data is already gone, or that part of the product has to be rebuilt under deadline.

## What actually reduces the risk

What helps is an outside review of the shipped product before real traffic reaches it. I read four layers: the application code, the cloud permissions, the build pipelines and the full git history. A scanner only sees the running site, and on that audit the worst problems were in the other layers. I reproduce every high finding a second time, independently, so your team can rely on the report without me. You get the findings ranked by risk, each with its fix. On that audit, the nine high findings could each be fixed in days: rename the variables that leak, rotate the exposed key, put real authentication on the admin API, reduce the cloud owner role.

## What I can do

I do the review and give you a report your team can act on alone: findings ranked by risk, each with its fix, and each high finding reproduced twice. I change nothing, so your team keeps shipping while I work. I also list what is already done well, so nobody undoes it while fixing the rest. One limit: the review reads source code, configuration and permissions at one point in time. It works as a first serious audit. It does not replace continuous monitoring, and it is out of date after your next deploy. The report says so.

This is for a team that ships an LLM application or a codebase built fast with AI, where nobody looks for these patterns and the last serious security review dates from before AI joined the workflow.

Want me to read yours, in writing?
