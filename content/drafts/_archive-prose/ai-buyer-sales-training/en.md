---
title: "Your sales reps train against an AI buyer that talks back"
description: "A realtime voice AI that role-plays a resistant buyer, so reps practice their pitch and objection handling out loud before they ever call a real prospect. Built on native-audio Gemini over a WebSocket loop."
date: 2026-07-06
tags: ["AI", "Voice", "Sales", "Gemini", "Realtime"]
pillar: "Build"
stack: ["React", "TypeScript", "Gemini Live API (native audio)", "Fastify WebSocket relay", "Gemini 2.5 Flash"]
lang: "en"
---

## The problem

Sales reps learn their craft on live prospects. That is the worst possible training ground. Every clumsy pitch, every fumbled objection, every awkward silence happens in front of someone you actually wanted to close. The feedback loop is slow (you find out weeks later that the deal died), expensive (real pipeline burns), and impossible to repeat (you cannot re-run the same call three times to try three approaches).

Role-play with a colleague helps, but colleagues get tired, go easy on you, and cannot hold a consistent character for twenty minutes. A B2B sales team I worked with wanted something a rep could open at 7am, call, and pitch to, as many times as they wanted, against a prospect who pushes back like a real one.

## What we built

A realtime AI buyer you literally call. The rep picks a scenario, hits "call," and starts talking. On the other end is a voice that plays a specific buyer persona: it evades, it objects, it goes quiet, it warms up only if you handle it well. It never breaks character and never helps you. When you hang up, it grades the conversation.

A short exchange from a session:

> Rep: "I wanted to walk you through how our onboarding works."
> Buyer: "Honestly? We tried two tools like yours last year. Both got dropped after a month. So... why are you different?"
> Rep: "That is fair. What made the last two fail for you?"
> Buyer: "...Nobody used them. The team just went back to spreadsheets."

That objection, that pause, that opening: all generated live, by voice, in the buyer's own tone.

## How it works

The core is a realtime native-audio loop on Gemini. The browser captures the microphone through an AudioWorklet, streams 16kHz PCM chunks over a WebSocket, and plays back the model's 24kHz audio as it arrives. The model is `gemini-2.5-flash-native-audio-latest`, running in bidirectional streaming mode with `responseModalities: ['AUDIO']` and a chosen voice. Native audio matters: the model is not reading text through a separate TTS stage, it is speaking directly, so intonation, hesitation, and interruptions feel human.

Voice activity detection runs server-side inside the Live session. We tune start and end sensitivity plus a silence window, so the buyer waits for the rep to actually finish before responding, and the rep can interrupt the buyer mid-sentence (the playback queue flushes on an `interrupted` signal). Both sides are transcribed live so the rep sees the conversation scroll as it happens.

The buyer persona is the design work. Each scenario is a system prompt with a fixed identity, one central psychological blocker, a behavior profile (short sentences at first, natural hesitations, never monologues, never breaks role), and graduated resistance: evade first, shut down if pushed head-on, open up only if the rep is patient and indirect. That last rule is what turns it from a chatbot into a training partner: pushing harder makes it harder, which is exactly what a real buyer does.

Feedback is a second, separate model pass. On hangup, the full transcript goes to `gemini-2.5-flash` (text) with a rubric: a global score, then active listening, question quality, handling of silences, handling of sensitive topics, concrete mistakes with quotes, strengths, and actionable recommendations. The rep gets a graded debrief in seconds, with their own words cited back at them.

## The hard part

Two things. First, latency. A voice that answers half a second late feels dead. The native-audio bidirectional stream plus incremental playback is what keeps the turn-taking tight enough to feel like a phone call, not a walkie-talkie.

Second, believability. A buyer that caves the moment you pitch teaches nothing. The graduated-resistance prompt design is deliberate, and the natural next step is persona cloning: I have [fine-tuned a model on real conversation transcripts before](/blog/ghost-in-the-llm), speaker-labeled with rolling context, and the result mimicked a specific person's tone unnervingly well. The same technique, applied to anonymized recordings of a real difficult buyer, would let a team train against their actual hardest account instead of a generic archetype.

## Result

Reps can rehearse the same hard call as many times as they want, out loud, before it costs real pipeline. Concrete uplift in close rates or ramp time is [à confirmer], since that measurement belongs to the team running it at scale.

## Reusable

The mechanic is general: a believable persona, a realtime voice loop, and a graded debrief. Swap the persona and it becomes onboarding for new hires, upskilling on a new product line, support agents practicing angry callers, negotiation drills, or interview prep. Any high-stakes conversation that people currently learn by doing badly in front of someone who matters is a candidate.

If your team is burning real prospects as practice reps, there is a better sparring partner. I build these. Tell me the conversation you wish your people could rehearse a hundred times.
