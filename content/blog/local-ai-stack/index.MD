---
title: "An AI coding stack, 100% local"
date: "2026-08-07T10:00:00.000Z"
description: "A coding agent that plans, reads your repo and edits files, with the source code physically confined to a machine you own. My own running stack, every number measured."
tags: ["Tech", "AI"]
private: true
---

The meeting always ends the same way. The developers want an AI assistant because everyone else has one. Security points out that every prompt, every file the assistant reads, travels to a third party's servers. Somebody says "we cannot un-send source code." The assistant gets banned. The developers keep typing everything by hand.

I built the stack that ends that meeting differently.

**A real agentic assistant that plans, reads the repo and edits files, with the code physically confined to a box I own.** It ran the same coding task as a cloud assistant and matched its output quality on my benchmark. It sits on a fanless mini-PC drawing about ten watts idle. It costs nothing per seat, ever. This is my own running stack, not a client engagement, and every number below is measured, not quoted.

The ban itself is rational. The usual workarounds are not. An enterprise "privacy" tier is a contract, not a control: the code still leaves. A VPN changes where the traffic goes, not where the model runs. A self-hosted chat UI in your cloud tenant still puts weights, logs and prompts on infrastructure someone else administers. So the question I set out to answer: can a developer get a real agentic assistant without a single line of code leaving the building?

## Local-first is the only brick that matters

The load-bearing decision is that the model reading and writing your code runs on hardware you control. Every other brick exists to protect that one property.

- **ollama** serves an open-weights model on a plain machine. No vendor account, no outbound API traffic.
- **Qwen3.6** is the model. Picked by benchmark, not by hype (next section).
- **opencode** is the agent. It plans, reads the repo, calls tools, edits files, and points at the local model instead of a cloud one. Without it you have a private chatbot. With it, a private colleague.
- **Paseo** runs the whole thing headless on a dedicated Linux mini-PC, so I pick the work up from a laptop or a phone.

Remote control is where "local" usually breaks, so the wiring is strict. Call it **commands-in, code-never-out.** The daemon listens only on the machine's own loopback and dials out to an end-to-end encrypted relay. A Tailscale private network gives the box a stable address reachable only from my own devices. Not a single inbound port.

And because agents misbehave one day (they do), the daemon runs as a normal non-root user. An agent that goes wrong cannot take over the machine it lives on. **The box is a fanless mini-PC drawing about ten watts idle,** the same one that hosts OpenClaw, my always-on assistant.

## A local model matches cloud quality on everyday code, and I measured it

That was my biggest doubt, so I spent weeks measuring instead of believing.

Hardware: my MacBook Pro M5 Pro, 64 GB of RAM. Harness: the same task every time, a React and TypeScript to-do app, run headless through the real agent. I measured wall time, steps, tool calls, tokens, and whether the output compiles under a strict TypeScript compiler.

The field: gpt-oss 20B, Qwen3-Coder-Flash 30B, Devstral-Small 24B, Qwen2.5-Coder 32B, Gemma 4 E4B, Gemma 4 31B, and Qwen3.6-35B-A3B in four quantizations, across Ollama (GGUF and MLX backends) and mlx_lm.server.

What the numbers taught me:

- **Dense models are a non-starter on this hardware.** Gemma 4 31B crashed out of memory on 64 GB. A dense 27B decoded at about 3 tokens per second and timed out the agent stream before writing a single file. The shape that works is MoE with about 3B active parameters.
- **The winner: Qwen3.6-35B-A3B** (73.4% SWE-bench Verified), mxfp8 variant on Ollama's MLX backend. **53 seconds of agent time, 4 tool calls, a 281-line App.tsx, zero type errors under strict, zero self-corrections.** On this benchmark that is the same finished, compiling app a cloud coding assistant produces, from a box that never phoned home.
- **The "coding" fine-tune of the same model lost to the base model.** Twice as slow for identical output quality, and one run in three wandered into a self-correction loop before I killed it. Benchmarks beat naming.

The honest reading: for everyday application code, a model on your own machine is good enough to ship with. It is not a drop-in match for the largest cloud models on the hardest reasoning, and pretending otherwise would waste your time.

> War story. The "coding" fine-tune should have won on paper. It lost. Twice as slow for identical output, and a third of its runs spiralled into self-correction before I killed the process. I almost shipped it as the default on the strength of its name. The benchmark, not the label, is the only thing that told the truth.

## You pay a hardware bill, on purpose

Local AI is not a free lunch, and the same harness priced every option.

| Variant | RAM | Agent time | Notes |
| --- | --- | --- | --- |
| Qwen3.6 mxfp8 | ~40 GB | 53 s | The pick when the machine allows it |
| Qwen3.6 nvfp4 | 21 GB | 124 s | Low-RAM fallback, chattier: 16 steps vs 4 |
| Qwen3.6 Q4 GGUF | 23 GB | 100 s | Runs without the MLX backend |
| gpt-oss 20B | 12 GB | 59 s | The small fast fallback |

That is the whole deal in one table. You pay a hardware and latency bill, on purpose, in exchange for **$0 per-seat cloud cost and code that never leaves the box.**

For a decision-maker it reframes the question from "can we?" to "at what spec?". A sizing exercise, not a mystery: a one-time capital cost, measured against a per-seat cloud subscription plus a risk you currently carry for free on someone else's behalf.

## What this is, and what it isn't

To be exact: this is my own running stack, not a delivered client engagement. I assembled it, I run it daily, and the benchmark numbers above are mine.

What it proves is the claim that matters. An agentic assistant can do real coding work with the source code physically confined to a machine you own. The privacy here is not a clause in a vendor contract, it is a physical fact about where the computation happens. Nobody can leak what never left.

If your security policy already says "no cloud LLMs" while your engineers quietly fall behind (defence, banking, health data, legal privilege, industrial firmware), the assistant does not need your data to leave. It needs to run where your data already lives. I install and tune the same stack on your hardware: model sizing for your machines, agent wiring, safe remote access.
