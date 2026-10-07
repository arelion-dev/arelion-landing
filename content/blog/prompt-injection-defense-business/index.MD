---
title: "Defending AI agents against prompt injection at scale"
date: "2026-07-02T09:15:00.000Z"
description: "The agents that save your team the most time can reach your data and the internet. I make sure a booby-trapped document cannot turn them against you."
tags: ["AI security", "Business"]
private: true
---

The AI agents that save a team the most time are the ones with real access: the inbox, the customer database, the payment tool, and the internet. That is also what makes them a target. A booby-trapped file or a poisoned web page carries instructions the agent mistakes for yours, and it acts for the attacker with the access you gave it. This is prompt injection, and the model layer has no clean fix for it.

**On record already: a dealership's assistant talked into "selling" a car for one dollar, and support bots coaxed into leaking customer data.**

## What it costs when it goes wrong

The agent does not crash or raise an error. It does what the attacker wrote, quietly, and it passes every demo. In a regulated setting the bill is a reportable data breach. The quieter cost is your brand saying something under its own name that it never should have, and a team that stops trusting the agent afterwards.

## What reduces the risk

You cannot stop the model from being fooled, so the work limits what a fooled agent can reach.

- **Data cannot leave by a side door.** Outbound traffic goes to an allowlist, so nothing escapes through a hidden image or link.
- **A breach stays small.** Access is scoped per team inside the data layer.
- **Irreversible actions need a rule or a person.** A payment or an external send never happens on the agent's word alone.
- **Known attacks fail the build.** A library of real attacks runs on every change.

Nothing makes prompt injection impossible. This makes a successful one boring, because there is nothing valuable left for it to reach.

## What I can do

I review where an injection could do damage in your setup: which agents reach sensitive data and the internet at once, and what to close first. You get a map and a prioritized plan in writing. If it helps, I can run a live injection against a decoy on your own stack, so the people who sign off see the risk for themselves.

Want me to look at where yours is exposed?
