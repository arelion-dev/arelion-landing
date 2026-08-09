---
title: "Sleeper agents: the backdoor in the weights"
date: "2026-03-05T16:45:00.000Z"
description: "You deploy models you did not train. They can carry a hidden backdoor that safety training does not remove. I design the defense so a compromised model has no path to move your data out."
tags: ["AI", "Business"]
private: true
---

You run AI agents on models you didn't train, and any one of them can carry a hidden trigger that turns it into a data-exfiltration tool. I do sleeper agent defense: I audit your stack, find the exfiltration paths, and design the controls so a backdoored model has no way out.

This is LLM data exfiltration prevention for teams that have worked out they can't test their way clear.

## Trusting the weights is a bill you can't see yet

An API from a provider, a fine-tune from a supplier, open weights off a hub: any of them can hide a trigger. A specific phrase, meaningless to a human, buried during training. On the day it fires, a well-behaved assistant flips into a tool that reads your private data and ships it out. The rest of the time it looks perfect, so it sails through every demo and every test you throw at it.

Public research is blunt about this. Anthropic (2024) showed the backdoor survives the full safety process. A 2025 study found that roughly 250 poisoned documents plant one, whatever the model's size.

You can't prove your weights are clean, and no known technique can. The bill lands the day the trigger fires, and by then it's an incident report instead of a line item.

## What you get

- **A trifecta map of your whole stack.** Every agent, checked for the three ingredients of a leak: private data, untrusted input, and a way to talk out. Most teams have never drawn this and are surprised what holds all three.
- **Egress control that holds on the worst day.** When the trigger fires, the outbound call fails at the network boundary rather than sitting in a review queue. The incident shrinks to a log line, and never reaches the headline.
- **Separated contexts and tool allowlists.** A triggered model that can't read secrets and reach the open internet in the same breath has nothing to steal, or nowhere to send it.
- **Prompt injection defense built in.** The trigger can ride in on a web page, a PDF, or a calendar invite, so the same controls close that door too.
- **Illustrative outcome:** every agent that held all three legs comes out holding two at most, plus a written report your board can read.

## Why it holds, and one honest boundary

This is secure AI agents work grounded in the lethal trifecta, the same frame I use on live systems. I assume the model is lying and design around what it can reach, because reach can be measured and enforced. Trust can't be verified, so I don't build on it.

The honest boundary: none of this proves a model is clean. It removes the path out. Output quality still needs human review.

## Who this is for

Teams that give a third-party or open-weights model access to customer data or internal documents. Fintech, health, legal, any regulated data. If an agent in your stack can read secrets and reach the internet, that's a hole worth checking.

Want me to look at your setup, in writing?
