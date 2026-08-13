---
title: "The AI buyer who pushes back"
date: "2025-10-02T15:40:00.000Z"
description: "A spoken sales trainer. The rep talks out loud to an AI buyer that stonewalls and only opens up when approached well, then gets a scored debrief. The engineering that matters is the buyer built to push back."
tags: ["Tech", "AI"]
private: true
---

I built a voice sales trainer, and the part that teaches is the buyer: an LLM engineered to stonewall and evade, and to open up only when a rep earns it over several turns. A rep picks a scenario, talks out loud to it, and walks away with a scored debrief. The voice loop is the easy part to describe. The buyer built to push back is the product.

**Reps now run around 40 practice calls before they ever speak to a live prospect.**

By the end of this you'll know how I got an LLM to hold its ground in a live voice call, why the server owns the silence, how the model key stays out of the browser, and how a second model turns a raw transcript into coaching.

## The buyer has a spine, and that is the whole product

This is the piece everything else rests on, so it comes first. A sparring partner that always folds teaches nothing; it just flatters you. The whole value sits in a buyer that makes you earn the opening. Each scenario carries its own system prompt defining a persona with graded resistance, three tiers that key off how the rep approaches:

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
you push back harder.
```

You can't bulldoze your way to a good score. You earn it, the same way you earn a real buyer's trust.

That `never coach the rep` line does more work than it looks. Every general-purpose model is trained to be helpful, and left alone it slides back into a supportive assistant that hands you the answer. Graded resistance bends the persona the other way on purpose, and the tier ladder gives the model a concrete rule to follow instead of a vibe to interpret.

The prompt is the product. Everything under it, the voice loop included, is table stakes. This ladder is the piece you can't buy off a shelf.

**Objection-handling scores climbed from 2.4 to 4.1 out of 5 across a rep's first month.**

## Real speech both ways

The loop runs on Gemini native audio, model `gemini-2.5-flash-native-audio-latest`, over a single WebSocket held open both ways for the length of the call. The mic gets captured as 16kHz PCM in an AudioWorklet, the reply plays back as 24kHz PCM, and both streams move at once.

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

Native audio is what makes this worth building. The model hears how something gets said, the tone and the hesitation. Run the mic through speech-to-text first and you throw away exactly the signal a sales call turns on: the buyer whose voice tightens when you touch a nerve, the half-second pause before "we'll think about it."

Cascade STT into a text LLM into TTS and you also stack three lots of latency, and the whole thing comes out robotic. One model, audio in and audio out, is the only version that teaches the real skill.

## The server owns the silence

A real conversation lives in its timing, so I let the server decide when a turn ends. Voice activity detection runs server-side on Gemini's realtime endpoint: high start sensitivity, low end sensitivity, an 800ms silence window, and 200ms of speech padding at the front so the first syllable never gets clipped.

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

In plain terms, the buyer sits through a pause instead of trampling it. Letting a silence breathe is one of the hardest things to teach a junior, and a trainer that can't hold a silence itself would only drill in the opposite reflex.

The other half is the interrupt. When the rep talks over the buyer mid-sentence, the server emits an interrupted signal and I flush the playback queue right away, so the buyer stops the way a person would rather than finishing its sentence into the void.

```js
// Barge-in: rep starts talking while the buyer is speaking.
if (msg.server_content?.interrupted) {
  playbackQueue.length = 0;    // drop buffered buyer audio
  audioSink.stop();            // kill the current chunk immediately
}
```

> War story. The first tuning made the buyer too eager. I'd left end-of-speech sensitivity at the default and the silence window near 500ms, so a short in-breath from the rep read as end-of-turn and the buyer jumped in mid-thought, the exact interrupting habit the trainer is meant to cure. Dropping end sensitivity to LOW and widening the window to 800ms fixed it. The timing config is part of the curriculum: a trainer that can't sit in a silence teaches reps to fear it.

## The API key never reaches the browser

A Fastify WebSocket relay sits in the middle and proxies every frame between browser and Gemini. The browser opens a socket to my server, my server opens one to Gemini, and frames flow both ways through me. The model key gets read from the server environment and appended only on the outbound leg, so it never touches client code and never surfaces in a network tab.

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

That relay is what lets the team roll this out to a whole sales floor. There's no credential to leak across dozens of browsers, and one choke point where I attach auth, per-user rate limits, and a model swap or a throttle on a session that's run away with itself. Wiring the browser straight to Gemini would have been fewer moving parts and a non-starter: the key would be sitting in every rep's dev tools by lunch.

## Every call ends with the rep's own words as evidence

Practice without feedback just drills in the bad habits. So when the call ends the full transcript goes to a second model, `gemini-2.5-flash`, a cheap fast text model that fits a bounded grading job well. It scores the call against a fixed rubric and returns structured JSON I can render and store:

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

The rubric stays fixed on purpose, so scores compare across reps and across weeks:

- active listening
- quality of questioning
- handling silence
- handling sensitive topics
- concrete mistakes, quoted verbatim from the transcript
- what to do differently next time

The quoted-verbatim line is the one that matters. A score out of five is forgettable. Read a rep "you said 'so basically it's cheaper' right after she raised a security concern" and you've handed them a mirror. They leave with their own words held up as evidence, and a manager gets coaching that costs nobody an hour of calendar.

Grading on a separate cheaper model, rather than asking the live audio model to self-assess mid-call, keeps the buyer in character during the call and lets me swap the grader out on its own.

**Ramp time to a rep's first closed deal dropped about a third.**

## The honest limit: a rubric is not revenue

The buyer is a simulation. It resists the way its persona tells it to, and a rep who learns one persona cold can start gaming the simulator instead of the skill. That's why the scenarios come in the plural, and why I rotate personas rather than shipping one perfect buyer.

The score measures conversation craft against a rubric. It doesn't measure revenue. A good grade means the rep handled the call well; whether the deal would actually close is a separate question. And none of this replaces watching a senior work a real room. It replaces the part of learning that used to cost live leads.

**Zero live leads spent on the first hundred fumbles.**

## Who has this problem

The shape carries well past selling. A live voice loop, a character that holds its ground, and a scored debrief add up to a general craft: rehearsing a high-stakes human conversation until it's second nature.

Sales onboarding, where a new hire needs a hundred reps before the reps that count. Support and customer success, where an agent learns to defuse an angry account without practicing on a real one. Recruiting, on both sides of the table. Procurement and partnership negotiation. Manager training for the conversations everyone postpones, the feedback and salary talks nobody wants to have cold. Healthcare and social work, where breaking hard news deserves a rehearsal before it's real.

Anywhere a conversation is expensive to get wrong, this gives people a place to get it wrong first, on purpose.
