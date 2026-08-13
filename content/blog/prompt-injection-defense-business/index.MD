---
title: "Defending AI agents against prompt injection at scale"
date: "2026-07-02T09:15:00.000Z"
description: "The AI agent you ship can be turned against you by a booby-trapped document or web page. I build agents that stay safe when that happens, by limiting what they can do rather than hoping they refuse."
tags: ["AI security", "Business"]
private: true
---

An AI agent that reads documents or handles email can be hijacked by the text it was only supposed to read. A booby-trapped file or a poisoned web page carries instructions the agent mistakes for yours, and now it acts for the attacker. This is prompt injection, and it has no clean fix at the model layer.

## Why this matters to you

Most agents in your stack touch something valuable: a customer database, an inbox, an internal wiki, a payment tool. The same agent usually reaches the internet too. Put those together and one malicious document is enough to turn a normal assistant into something that reads your data and sends it out, using access you already granted. It won't crash or flag an error. It does what the attacker wrote, quietly, and clears every demo along the way.

## What it costs when it goes wrong

Real incidents are already on record. A car dealership's assistant was talked into "selling" a vehicle for one dollar. Support chatbots have been coaxed into leaking data from customer accounts. There are self-spreading attacks where an assistant is tricked into emailing malware to its own contacts. The same tricks that jailbreak a chatbot into saying what it should not (roleplay, patient multi-turn attacks like Skeleton Key) also aim it at your data. In a regulated setting the bill is a reportable data breach and the fines that follow. The quieter cost is your brand saying something under its own name that it never should have.

## What actually reduces the risk

You can't stop the model from being fooled, so the useful work limits what a fooled agent can reach. Outbound traffic goes to an allowlist, so data can't leave through a hidden image or link. Access is scoped per team inside the data layer, so a breach in one slice can't read the rest. Anything irreversible, a payment or an external send, needs a rule or a person. A library of real attacks runs on every change, so a payload that gets through fails the build before it ships. Nothing makes prompt injection impossible. What this does is make a successful injection boring, because there's nothing valuable left for it to reach or leak.

## What I can do

I review where an injection could actually do damage in your setup: which agents can reach sensitive data and the internet at the same time, and what to close first. You get a map and a prioritized plan. The build stays with your team, or it's a separate engagement. If it helps, I can demonstrate a live injection against a decoy on your own stack, so the risk is concrete for the people who sign off on it.

If your agent can act on tools and reach real data, it's already a target. Want me to look at where yours is exposed, in writing?
