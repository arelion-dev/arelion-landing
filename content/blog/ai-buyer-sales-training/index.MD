---
title: "The AI buyer who pushes back"
date: "2026-08-07T10:00:00.000Z"
description: "A spoken sales trainer where the rep talks out loud to an AI buyer that evades, resists, and only opens up when approached well. The interesting part is not the voice loop, it is the buyer built to resist."
tags: ["Tech", "AI"]
private: true
---

I designed and built a voice trainer for a B2B sales team. A rep opens a scenario, speaks out loud to an AI buyer, and gets a scored debrief at the end. The buyer evades, resists, and only opens up when the approach is right.

The voice loop is the easy part to describe. The part worth writing about is the one design choice that makes it training instead of theater: the buyer is built to resist.

## A spoken conversation, not a chatbot with a voice

The core is real speech in both directions, not a text bot with audio bolted on. The loop runs on Gemini native audio, model `gemini-2.5-flash-native-audio-latest`, over a WebSocket held open both ways. The mic is captured as 16kHz PCM in an AudioWorklet, the reply plays back as 24kHz PCM, and the two streams flow at once.

Native audio matters to the business, not just the demo. The model hears tone, hesitation, and pace instead of a flattened transcript. A buyer whose voice tightens when you touch a nerve teaches something a text box never will, and tone is exactly what sales calls are won and lost on.

## The server owns the timing

A real conversation lives in its timing, so the server decides when a turn ends. Voice activity detection runs server-side, tuned with high start sensitivity and low end sensitivity, an 800ms silence window, and 200ms of padding before speech.

In plain terms: the buyer waits through a pause instead of trampling it. Letting a silence breathe is one of the hardest skills to teach a junior, and a trainer that cannot hold a silence itself would train the opposite reflex.

When the rep talks over the buyer mid-sentence, an interrupt fires and the playback queue is flushed at once, so the buyer stops the way a person would. No robotic monologue plowing on after you cut in, because the moment the simulation feels fake, the rep stops taking it seriously.

## The key never touches the browser

A Fastify WebSocket relay sits in the middle and proxies every frame between browser and Gemini, appending the API key only server-side.

That is what lets the team roll this out to a whole sales floor: no credential to leak, and one choke point that handles auth and rate limits.

## The buyer has a spine

This is the load-bearing piece. Each scenario carries its own system prompt that defines a persona with graded resistance:

```text
buyer behavior (per-scenario system prompt):
  1. evade first     -> change the subject, make light of it
  2. pushed frontally -> block
  3. patient + indirect approach -> open up
```

You cannot bulldoze your way to a good score. You have to earn it, the way you earn a real buyer's trust. A sparring partner that always folds teaches nothing, it flatters, so the whole persona bends the other way.

## Every call ends with a scored debrief

Practice without feedback just rehearses bad habits. So the transcript goes to a second model, `gemini-2.5-flash`, which grades it against a fixed rubric:

- active listening
- quality of questioning
- handling silence
- handling sensitive topics
- concrete mistakes, quoted verbatim
- what to do differently next time

The rep leaves with their own words held up as evidence, not a vague pat on the back. For a manager, that is coaching that happens without booking an hour of anyone's calendar.

## Honest limits

There are some, and they matter. The buyer is a simulation: it resists the way its persona tells it to, and a rep who learns that persona can start playing the simulator instead of the skill. That is why scenarios exist in the plural.

The score measures conversation craft against a rubric, not revenue. A good grade means the rep handled the call well, not that the deal would have closed. And none of this replaces watching a senior work a real room. It replaces the part of learning that used to cost live leads: the first hundred fumbles.

## Who has this problem

The shape is not tied to selling. A live voice loop, a character that holds its ground, and a scored debrief describe a general craft: rehearsing a high-stakes human conversation until it is second nature.

Sales onboarding, where a new hire needs a hundred reps before the reps that count. Support and customer success, where an agent learns to defuse an angry account without practicing on a real one. Recruiting, on both sides of the table. Negotiation for procurement or partnerships. Manager training for the conversations everyone postpones: feedback, salary, dismissal. Healthcare and social work, where breaking hard news deserves rehearsal before it is real.

Anywhere a conversation is expensive to get wrong, this gives people a place to get it wrong first, on purpose, safely.
