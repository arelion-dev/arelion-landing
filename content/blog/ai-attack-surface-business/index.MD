---
title: "The AI attack surface"
date: "2026-03-26T09:50:00.000Z"
description: "A security audit of AI-built code, read like an attacker before you point real traffic at it. What it costs when the gap between working and holding ships to production, and what reduces the risk."
tags: ["AI", "Security", "Business"]
private: true
---

I run security reviews of AI-built apps: an outside read of the shipped product before you send it real traffic. On the last one, five days of reading turned up 49 findings, nine of them high, in a platform that was days from launch and green on every pipeline.

## Why this matters to you

Your team ships fast with an AI in the loop, and AI writes code that runs. The feature renders and the deploy goes green. Whether the same code holds up against someone hostile is a different question, and no functional test asks it. So a codebase can clear every check you have and still hand an attacker a way in, quietly, while every demo looks perfect.

## What it costs when it goes wrong

That gap gets expensive after launch, when it's hardest to fix. One secret inlined into the browser bundle, or one outside account that can delete production sitting behind a fake auth gate, and the launch you were proud of becomes a breach notice. In a regulated setting that's a reportable incident, with the disclosure and the fines that follow. The timing is the worst part: the code passed every check, so the first sign of trouble is often the data already gone, or a rebuild under deadline pressure.

## What actually reduces the risk

The work that helps is an outside read of the shipped product before real traffic hits it, done the way an attacker reads it. Four layers, past the running site: application code, cloud permissions, build pipelines, and full git history. A scanner sees only the first of those, and the worst holes live in the other three. Every high finding gets reproduced a second time, independently, so the report holds up in a room you're not in. You get findings ranked by real risk, each with its fix. On that audit all nine highs were fixable in days: rename the leaking variables, rotate the burned key, put real auth on the admin gate, scope the cloud owner down.

## What I can do

I do the read and hand you a report your own team can act on alone, ranked by risk, each finding carrying its fix and a second independent reproduction behind it. I change nothing and break nothing, so your team keeps shipping while I work. I also write down what was already solid, so nobody undoes good work while patching the rest. One honest boundary: this is a point-in-time read of source, config, and permissions. It replaces a first serious audit. It won't act as a running detection stack, and it goes stale on your next deploy. I say so in the report, in those words.

This is for any team shipping an LLM app or a fast AI-built codebase where nobody is specifically hunting these patterns, and where the last serious security review predates the shift to AI in the loop.

Want me to read yours before someone else does, in writing?
