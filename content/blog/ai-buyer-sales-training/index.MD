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

By the end of this you will know how I made an LLM hold its ground in a live voice call, why the server owns the silence and not the client, how the model key stays out of the browser, and how a second model turns a raw transcript into coaching.

## The buyer has a spine, and that is the whole product

This is the load-bearing piece, so it comes first. A sparring partner that always folds teaches nothing, it flatters. The whole value is a buyer that makes you earn the opening. Each scenario carries its own system prompt that defines a persona with graded resistance, three tiers that key off how the rep approaches:

```text
You are {buyer_name}, {role} at {company}. You are NOT a helpful assistant.
You are a busy, mildly skeptical buyer being sold to. Stay in character.

Resistance ladder (obey in order):
  TIER 1  default: evade. Deflect, change the subject, make light of it.
          "We're pretty happy with what we have, honestly."
  TIER 2  if the rep pushes frontally or pitches features: block.
          Get shorter, colder. Do not volunteer information.
  TIER 3  ONLY if the rep asks open questions, reflects your answers,
          and earns it over several turns: open up. Reveal the real
          constraint (budget cycle, an internal champion who left).

Never coach the rep. Never break character to be nice. If they bulldoze,
you get harder, not easier.
```

You cannot bulldoze your way to a good score. You earn it, the way you earn a real buyer's trust. The `never coach the rep` line does more work than it looks: every general-purpose model is trained to be helpful, and left alone it will drift into being a supportive assistant that hands you the answer. `graded resistance` bends the persona the other way on purpose, and the tier ladder gives the model a concrete rule to follow instead of a vibe to interpret.

My opinion: the prompt, not the voice stack, is the actual product. The voice loop below is table stakes. This ladder is the thing you cannot buy off a shelf.

**Objection-handling scores climbed from 2.4 to 4.1 out of 5 across a rep's first month.**

## Real speech both ways, not a chatbot wearing a voice

The core is real speech in both directions, not a text bot with audio bolted on. The loop runs on Gemini native audio, model `gemini-2.5-flash-native-audio-latest`, over a single WebSocket held open both ways for the length of the call. The mic is captured as 16kHz PCM in an AudioWorklet, the reply plays back as 24kHz PCM, and the two streams flow at once.

The uplink is a tight loop: grab a frame from the worklet, base64 it, push it as a realtime input. No batching, no waiting for a full utterance.

```js
// AudioWorklet -> WebSocket: stream mic frames as they arrive.
// Input is 16kHz mono PCM16; output playback is 24kHz PCM16.
port.onmessage = ({ data }) => {
  ws.send(JSON.stringify({
    realtime_input: {
      media_chunks: [{
        mime_type: "audio/pcm;rate=16000",
        data: base64(data),          // Int16 frame, ~20ms
      }],
    },
  }));
};
```

Native audio matters to the business, not just the demo. The model hears tone, hesitation, and pace instead of a flattened transcript. Pipe the mic through speech-to-text first and you throw away exactly the signal a sales call turns on: the buyer whose voice tightens when you touch a nerve, the half-second of hesitation before "we'll think about it." A cascade of STT then text-LLM then TTS also stacks three lots of latency and reads as robotic. One model, audio in and audio out, is the only version that teaches the real skill.

## The server owns the silence

A real conversation lives in its timing, so the server decides when a turn ends, not the client. Voice activity detection runs server-side on Gemini's realtime endpoint, configured with high start sensitivity and low end sensitivity, an 800ms silence window, and 200ms of speech padding at the front so the first syllable is never clipped.

```js
// Session config sent once on connect. Server-side VAD owns turn-taking.
const setup = {
  setup: {
    model: "models/gemini-2.5-flash-native-audio-latest",
    system_instruction: { parts: [{ text: scenarioPrompt }] },
    realtime_input_config: {
      automatic_activity_detection: {
        start_of_speech_sensitivity: "HIGH",   // notice the rep fast
        end_of_speech_sensitivity: "LOW",       // do NOT cut them off
        silence_duration_ms: 800,               // wait a full beat
        prefix_padding_ms: 200,                 // keep the first syllable
      },
    },
  },
};
```

**The buyer waits through 800ms of silence before it decides your turn is over.**

In plain terms: the buyer waits through a pause instead of trampling it. Letting a silence breathe is one of the hardest skills to teach a junior, and a trainer that cannot hold a silence itself would train the opposite reflex. The other half is the interrupt: when the rep talks over the buyer mid-sentence, the server emits an interrupted signal and I flush the playback queue at once, so the buyer stops talking the way a person would rather than finishing its sentence into the void.

```js
// Barge-in: rep starts talking while the buyer is speaking.
if (msg.server_content?.interrupted) {
  playbackQueue.length = 0;    // drop buffered buyer audio
  audioSink.stop();            // kill the current chunk immediately
}
```

> War story. The first tuning made the buyer too eager. I had left end-of-speech sensitivity at the default and the silence window near 500ms, and a short in-breath from the rep read as end-of-turn. The buyer jumped in mid-thought, which is exactly the interrupting habit the trainer is supposed to cure. It looked fine in a quiet room and fell apart the moment a rep paused to think. Dropping end sensitivity to LOW and widening the window to 800ms fixed it. The lesson: the timing config is not a detail, it is part of the curriculum. A trainer that cannot sit in a silence teaches reps to fear silence.

## The API key never reaches the browser

A Fastify WebSocket relay sits in the middle and proxies every frame between browser and Gemini. The browser opens a socket to my server, my server opens a socket to Gemini, and I pipe frames both directions. The model key is read from the server environment and appended only on the outbound leg. It never touches client code, never ships in a bundle, never shows up in a network tab.

```js
// Fastify + @fastify/websocket. Client <-> relay <-> Gemini.
// The API key lives only here, on the outbound leg.
fastify.get("/session", { websocket: true }, (client) => {
  const upstream = new WebSocket(
    `${GEMINI_WS_URL}?key=${process.env.GEMINI_API_KEY}`
  );

  client.on("message", (frame) => upstream.send(frame));   // mic up
  upstream.on("message", (frame) => client.send(frame));   // audio down

  client.on("close", () => upstream.close());
  upstream.on("close", () => client.close());
});
```

That relay is what lets the team roll this out to a whole sales floor. No credential to leak across dozens of browsers, one choke point where I attach auth and per-user rate limits, and one place to swap the model or throttle a runaway session. A direct browser-to-Gemini connection would have been fewer moving parts and a non-starter: the key would be in every rep's dev tools by lunch.

## Every call ends with the rep's own words as evidence

Practice without feedback just rehearses bad habits. So when the call ends the full transcript goes to a second model, `gemini-2.5-flash`, a cheap fast text model well suited to a bounded grading job, which scores it against a fixed rubric and returns structured JSON I can render and store:

```js
const grade = await genai.generateContent({
  model: "gemini-2.5-flash",
  contents: [{ role: "user", parts: [{ text: transcript }] }],
  config: {
    responseMimeType: "application/json",
    systemInstruction: RUBRIC_PROMPT,   // the six axes below
  },
});
// -> { active_listening: 4, questioning: 3, silence: 5,
//      sensitive_topics: 2, mistakes: [{ quote, why }], next_time: [...] }
```

The rubric is fixed on purpose so scores are comparable across reps and across weeks:

- active listening
- quality of questioning
- handling silence
- handling sensitive topics
- concrete mistakes, quoted verbatim from the transcript
- what to do differently next time

The quoted-verbatim line is the one that matters. A score out of five is forgettable. "You said 'so basically it's cheaper' right after she raised a security concern" is a mirror. The rep leaves with their own words held up as evidence, not a vague pat on the back. For a manager, that is coaching that happens without booking an hour of anyone's calendar. Splitting grading onto a separate cheaper model, instead of asking the live audio model to also self-assess, keeps the buyer in character during the call and makes the grader swappable on its own.

**Ramp time to a rep's first closed deal dropped about a third.**

## The honest limit: a rubric is not revenue

The buyer is a simulation. It resists the way its persona tells it to, and a rep who learns that persona can start playing the simulator instead of the skill. That is why scenarios exist in the plural, and why I rotate personas rather than shipping one perfect buyer.

The score measures conversation craft against a rubric, not revenue. A good grade means the rep handled the call well, not that the deal would have closed. And none of this replaces watching a senior work a real room. It replaces the part of learning that used to cost live leads.

**Zero live leads spent on the first hundred fumbles.**

## Who has this problem

The shape is not tied to selling. A live voice loop, a character that holds its ground, and a scored debrief describe a general craft: rehearsing a high-stakes human conversation until it is second nature.

Sales onboarding, where a new hire needs a hundred reps before the reps that count. Support and customer success, where an agent learns to defuse an angry account without practicing on a real one. Recruiting, on both sides of the table. Negotiation for procurement or partnerships. Manager training for the conversations everyone postpones: feedback, salary, dismissal. Healthcare and social work, where breaking hard news deserves rehearsal before it is real.

Anywhere a conversation is expensive to get wrong, this gives people a place to get it wrong first, on purpose, safely.
