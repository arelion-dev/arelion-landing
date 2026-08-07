---
title: "The AI attack surface"
date: "2026-08-07T10:00:00.000Z"
description: "A security audit of AI-generated code, read like an attacker before you point real traffic at it. AI writes for it works, not it holds, and that gap is where the holes live."
tags: ["AI", "Security", "Business"]
private: true
---

I run security reviews of AI-built apps: an outside read of the shipped product before you send it real traffic. If your team ships fast with AI in the loop and the last serious security review predates it, this is the audit that finds what green pipelines hide.

## "It runs" and "it holds" are two different things

AI writes code that works. The feature runs, the page loads, the deploy goes green. Safe never shows up in a demo, so nobody asks for it. The code passes every functional test and still leaks, because no test suite lights up on the gap between working and holding.

That gap is expensive. One inlined secret, one fake auth gate, one over-permissioned account, and a launch you were proud of becomes a breach notice, a data-protection fine, and a rebuild under pressure. The bill lands after go-live, when it is hardest to pay.

## What you get from an AI generated code security audit

- **A read-only audit with zero downtime.** I change nothing, I break nothing, your team keeps shipping while I work.
- **Four layers, not just the running site.** Application code, cloud permissions, build pipelines, and full git history. Scanners miss three of those four, and that is where the worst holes live.
- **Verified findings, not maybes.** On a recent engagement: 49 findings, 9 high, every high reproduced twice before it earned a line in the report.
- **A report your own team can act on alone.** Ranked by real risk, each with the fix, so nobody argues it away in the first meeting.
- **Fast fixes, not a rewrite.** In that same audit, all nine high findings were fixable in days: rename the leaking variables, rotate the burned key, put real auth on the admin gate, scope the cloud owner down.

## Why you can trust it

I read the shipped artifact the way an attacker reads it, not the way the author read the ticket. I ground every high finding in a second, independent reproduction, so the report holds up without me in the room. I also write down what was already solid, so your team keeps the good work while patching the rest. One honest boundary: this is a point-in-time read of source, config, and permissions. It replaces a first serious audit, not a running detection stack, and it goes stale on the next deploy. I say so in the report, in those words.

## Who this is for

Any team shipping an LLM application or a vibe-coded codebase where nobody is specifically hunting for these patterns. Media platforms days from launch, fintechs onboarding real users, any product rebuilt fast with AI where "the AI wrote it" quietly became "it is fine."

Want me to read yours before someone else does? In writing, whenever suits.
