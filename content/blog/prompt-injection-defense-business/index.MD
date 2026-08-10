---
title: "Defending AI agents against prompt injection at scale"
date: "2026-07-02T09:15:00.000Z"
description: "The AI agent you ship can be turned against you by a booby-trapped document or web page. I build agents that stay safe when that happens, by limiting what they can do rather than hoping they refuse. What you get, and why it holds."
tags: ["AI security", "Business"]
private: true
---

An AI agent that reads documents, browses, or handles email can be hijacked by text it was only supposed to read. A booby-trapped file, a poisoned web page, a crafted email: the attacker writes instructions that the agent mistakes for yours, and now your agent works for them. This is prompt injection, and there is no clean fix at the model level. I build agents that stay safe anyway, by limiting what they are allowed to do when it happens.

## What it can cost you

A hijacked agent does not crash, so nobody notices. It quietly does what the attacker asked. Real incidents already on record: a car dealership's assistant talked into "selling" a vehicle for one dollar, a support chatbot coaxed into leaking data from customer accounts, and self-spreading attacks where an assistant is tricked into emailing malware to its own contacts. The same tricks that jailbreak a chatbot into saying what it should not (roleplay, patient multi-turn attacks like Skeleton Key) also aim it at your data. If your agent can touch private data and reach the internet, a single malicious document is enough. The damage is a data breach, a compliance finding, or your brand saying something it should never have said.

## What you get

- **An agent that stays contained when it is tricked.** It assumes the model can be fooled, so a successful injection hits a wall: no privileged action it can take, no channel it can leak through.
- **Your data cannot leave by a side door.** Outbound traffic is limited to an allowlist, and answers cannot smuggle data out through a hidden image or link. This is the control that actually stops leaks.
- **The blast radius is one tenant, not everything.** Access is enforced per team inside the data layer, so a breach in one slice cannot read the rest.
- **A human on anything irreversible.** Payments, deletions, external sends need a rule or a person. The model can suggest; it cannot authorize.
- **Proof, not hope.** A library of real attacks runs on every change, so a payload that gets through fails the build before it ships.

## Why it holds, and where it came from

The approach is not a clever prompt. It is defense in depth, borrowed from how the industry beat SQL injection and adapted to a world where instructions and data share one channel. Each control removes one leg of the attack: reach to sensitive data, exposure to untrusted content, or a way to send data out. Take one leg away and the attack has nowhere to go.

Every layer here is the scar tissue of a real system. The leak controls come from a build where the fix for a poisoned model was to give it nowhere to send the data. The per-tenant limits come from real multi-team deployments. The attack library comes from the same discipline I use to catch AI quality drift: once something breaks, it becomes a permanent test.

One honest boundary: nothing makes prompt injection impossible. What this does is make a successful injection boring, because there is nothing valuable it can reach or leak.

## Who this is for

Any team putting an AI agent in front of tools, private data, or the open web: customer support, research assistants over internal documents, anything that browses or reads inboxes. If your agent can act and can reach data, it is a target.

If that sounds like your setup, I am happy to review where an injection could actually do damage today, in writing.
