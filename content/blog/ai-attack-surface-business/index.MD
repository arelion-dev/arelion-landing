---
title: "The AI attack surface"
date: "2026-03-26T09:50:00.000Z"
description: "A security audit of AI-generated code, read like an attacker before you point real traffic at it. AI writes for it works. It doesn't write for it holds, and that's where the holes live."
tags: ["AI", "Security", "Business"]
private: true
---

I run security reviews of AI-built apps: an outside read of the shipped product before you send it real traffic. On the last one, five days of reading turned up 49 findings, nine of them high, in a platform that was days from launch and green on every pipeline.

If your team ships fast with AI in the loop and the last serious security review predates that shift, this is the audit that finds what the green pipelines hide.

## "It runs" and "it holds" are two different things

AI writes code that works. The feature renders, the deploy goes green, the demo lands. Safe never shows up in that demo, so nobody thinks to ask for it. The code clears every functional test and leaks anyway, because no test suite fires on the gap between working and holding.

That gap gets expensive. One inlined secret, one account that can delete production sitting behind a fake auth gate, and the launch you were proud of turns into a breach notice and a rebuild under pressure. The bill lands after go-live, when it's hardest to pay.

## What you get from an AI-generated code security audit

- **A read-only audit with zero downtime.** I change nothing and break nothing; your team keeps shipping while I work.
- **Four layers, past the running site.** Application code, cloud permissions, build pipelines, and full git history. Scanners miss three of those four, and that's where the worst holes live.
- **Verified findings.** Every high finding gets reproduced a second time, independently, before it earns a line in the report.
- **A report your own team can act on alone.** Ranked by real risk, each with its fix, so nobody argues it away in the first meeting.
- **Fast fixes.** All nine highs on that audit were fixable in days: rename the leaking variables, rotate the burned key, put real auth on the admin gate, scope the cloud owner down.

## Why you can trust it

I read the shipped artifact the way an attacker reads it. Every high finding rests on a second, independent reproduction, so the report holds up without me in the room. I also write down what was already solid, so your team keeps the good work while patching the rest.

One honest boundary: this is a point-in-time read of source, config, and permissions. It replaces a first serious audit. It isn't a running detection stack, and it goes stale on the next deploy. I say so in the report, in those words.

## Who this is for

Any team shipping an LLM application or a vibe-coded codebase where nobody is specifically hunting for these patterns. Media platforms days from launch, fintechs onboarding real users, any product rebuilt fast with AI where "the AI wrote it" quietly became "it's fine."

Want me to read yours before someone else does, in writing?
