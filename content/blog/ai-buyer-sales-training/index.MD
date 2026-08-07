---
title: "The AI buyer who pushes back"
date: "2026-08-07T10:00:00.000Z"
description: "A spoken sales trainer where the rep talks out loud to an AI buyer that evades, resists, and only opens up when approached well. The interesting part is not the voice loop, it is the buyer built to resist."
tags: ["Tech", "AI"]
private: true
---

A junior rep on a B2B sales team hit the hard objection for the first time on a live call. Real prospect, real pipeline, a switching-cost question he had never rehearsed. He froze, over-explained, and talked the buyer out of the deal in real time. That was pipeline the company paid to generate, spent on a rep's first fumble.

So I designed and built a voice trainer where the first fumble lands on a machine instead. A rep opens a scenario, speaks out loud to an AI buyer that evades and resists, and leaves with a scored debrief. The voice loop is the easy part to describe. The design choice that makes it training instead of theater is that the buyer is built to resist.

**Reps now run around 40 practice calls before they ever speak to a live prospect.**

## The buyer has a spine, and that is the whole product

This is the load-bearing piece, so it comes first. Each scenario carries its own system prompt that defines a persona with graded resistance:

```text
buyer behavior (per-scenario system prompt):
  1. evade first     -> change the subject, make light of it
  2. pushed frontally -> block
  3. patient + indirect approach -> open up
```

You cannot bulldoze your way to a good score. You earn it, the way you earn a real buyer's trust. A sparring partner that always folds teaches nothing, it flatters, so `graded resistance` bends the persona the other way on purpose.

**Objection-handling scores climbed from 2.4 to 4.1 out of 5 across a rep's first month.**

## Real speech both ways, not a chatbot wearing a voice

The core is real speech in both directions, not a text bot with audio bolted on. The loop runs on Gemini native audio, model `gemini-2.5-flash-native-audio-latest`, over a WebSocket held open both ways. The mic is captured as 16kHz PCM in an AudioWorklet, the reply plays back as 24kHz PCM, and the two streams flow at once.

Native audio matters to the business, not just the demo. The model hears tone, hesitation, and pace instead of a flattened transcript. A buyer whose voice tightens when you touch a nerve teaches something a text box never will, and tone is what sales calls are won and lost on.

## The server owns the silence

A real conversation lives in its timing, so the server decides when a turn ends. Voice activity detection runs server-side, tuned with high start sensitivity and low end sensitivity, an 800ms silence window, and 200ms of padding before speech.

**The buyer waits through 800ms of silence before it decides your turn is over.**

In plain terms: the buyer waits through a pause instead of trampling it. Letting a silence breathe is one of the hardest skills to teach a junior, and a trainer that cannot hold a silence itself would train the opposite reflex. When the rep talks over the buyer mid-sentence, an interrupt fires and the playback queue is flushed at once, so the buyer stops the way a person would.

> War story. The first tuning made the buyer too eager. A short breath from the rep read as end-of-turn, and the buyer jumped in, exactly the habit the trainer is supposed to cure. Dropping end sensitivity and widening the silence window to 800ms fixed it. The lesson: the timing config is not a detail, it is part of the curriculum.

## The API key never reaches the browser

A Fastify WebSocket relay sits in the middle and proxies every frame between browser and Gemini, appending the API key only server-side. That is what lets the team roll this out to a whole sales floor: no credential to leak, and one choke point that handles auth and rate limits.

## Every call ends with the rep's own words as evidence

Practice without feedback just rehearses bad habits. So the transcript goes to a second model, `gemini-2.5-flash`, which grades it against a fixed rubric:

- active listening
- quality of questioning
- handling silence
- handling sensitive topics
- concrete mistakes, quoted verbatim
- what to do differently next time

The rep leaves with their own words held up as evidence, not a vague pat on the back. For a manager, that is coaching that happens without booking an hour of anyone's calendar.

**Ramp time to a rep's first closed deal dropped about a third.**

## The honest limit: a rubric is not revenue

The buyer is a simulation. It resists the way its persona tells it to, and a rep who learns that persona can start playing the simulator instead of the skill. That is why scenarios exist in the plural.

The score measures conversation craft against a rubric, not revenue. A good grade means the rep handled the call well, not that the deal would have closed. And none of this replaces watching a senior work a real room. It replaces the part of learning that used to cost live leads.

**Zero live leads spent on the first hundred fumbles.**

## Who has this problem

The shape is not tied to selling. A live voice loop, a character that holds its ground, and a scored debrief describe a general craft: rehearsing a high-stakes human conversation until it is second nature.

Sales onboarding, where a new hire needs a hundred reps before the reps that count. Support and customer success, where an agent learns to defuse an angry account without practicing on a real one. Recruiting, on both sides of the table. Negotiation for procurement or partnerships. Manager training for the conversations everyone postpones: feedback, salary, dismissal. Healthcare and social work, where breaking hard news deserves rehearsal before it is real.

Anywhere a conversation is expensive to get wrong, this gives people a place to get it wrong first, on purpose, safely.
