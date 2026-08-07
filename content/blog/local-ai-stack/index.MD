---
title: "An AI coding stack, 100% local"
date: "2026-05-21T18:10:00.000Z"
description: "A coding agent that plans, reads your repo and edits files, with the source code physically confined to a machine you own. My own running stack, every number measured."
tags: ["Tech", "AI"]
private: true
---

The meeting always ends the same way. The developers want an AI assistant because everyone else has one. Security points out that every prompt, every file the assistant reads, travels to a third party's servers. Somebody says "we cannot un-send source code." The assistant gets banned. The developers keep typing everything by hand.

I built the stack that ends that meeting differently.

**A real agentic assistant that plans, reads the repo and edits files, with the code physically confined to a box I own.** It ran the same coding task as a cloud assistant and matched its output on my benchmark. It sits on a fanless mini-PC drawing about ten watts idle, and it costs nothing per seat, ever.

This is my own running stack, not a client engagement. Every number below is measured on my hardware, not quoted from a vendor.

The ban itself is rational. The usual workarounds are not. An enterprise "privacy" tier is a contract, not a control: the code still leaves. A VPN changes where the traffic goes, not where the model runs. A self-hosted chat UI in your cloud tenant still puts weights, logs and prompts on infrastructure someone else administers.

So the question I set out to answer: can a developer get a real agentic assistant without a single line of code leaving the building?

## Local-first is the only brick that matters

The load-bearing decision is that the model reading and writing your code runs on hardware you control. Every other brick exists to protect that one property.

- **Ollama 0.23**, installed from the `ollama-app` cask, serves an open-weights model on a plain machine. No vendor account, no outbound API traffic. The cask matters: it bundles the MLX Metal runtime (`libmlx.dylib`) that the Homebrew formula omits, and the fast quants only load on it.
- **Qwen3.6-35B-A3B** is the model (73.4% SWE-bench Verified). Picked by benchmark, not by hype (next section). Mixture-of-experts, about 3B active parameters, which is the only shape that runs at agent speed on this hardware.
- **opencode v1.4.6** is the agent. It plans, reads the repo, calls tools, edits files, and points at the local model instead of a cloud one. Without it you have a private chatbot. With it, a private colleague.
- **Paseo** runs the whole thing headless on a dedicated Linux mini-PC, so I pick the work up from a laptop or a phone.

Pulling the model and making it usable as an agent is two steps, not one. The default Ollama context window is 4096 tokens, which silently breaks agentic tool use: opencode's system prompt alone is about 11K tokens and does not even fit. So every model gets a Modelfile that raises it.

```bash
brew services stop ollama          # the formula daemon has no MLX runtime
brew install --cask ollama-app
open -a Ollama                      # serves on 127.0.0.1:11434

ollama pull qwen3.6:35b-a3b-mxfp8  # ~37 GB on disk
```

```dockerfile
# Modelfile
FROM qwen3.6:35b-a3b-mxfp8
PARAMETER num_ctx 32768
PARAMETER temperature 0.2
```

```bash
ollama create qwen3.6:35b-a3b-mxfp8-bench -f Modelfile
```

The daemon env is set in the service unit, not in a shell profile, so it survives reboots and applies under systemd:

```bash
OLLAMA_HOST=127.0.0.1:11434     # loopback only, never 0.0.0.0
OLLAMA_FLASH_ATTENTION=1
OLLAMA_KV_CACHE_TYPE=q8_0
OLLAMA_KEEP_ALIVE=-1            # keep the model resident, cold load is the tax
OLLAMA_MAX_LOADED_MODELS=1
```

opencode points at that loopback endpoint through its OpenAI-compatible provider. Two fields carry all the weight: `baseURL`, which keeps traffic on the machine, and the timeouts, without which the agent's write step dies mid-stream on a slow local decode.

```json
{
  "model": "ollama/qwen3.6:35b-a3b-mxfp8-bench",
  "small_model": "ollama/qwen3.6:35b-a3b-mxfp8-bench",
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama (local)",
      "options": {
        "baseURL": "http://127.0.0.1:11434/v1",
        "timeout": 300000,
        "chunkTimeout": 300000
      },
      "models": {
        "qwen3.6:35b-a3b-mxfp8-bench": {
          "name": "Qwen3.6 35B-A3B",
          "limit": { "context": 32768, "output": 8192 }
        }
      }
    }
  }
}
```

> Gotcha. Set `small_model` to the same tag as `model`. Two different tags means two model instances loaded into the GPU at once, which triggers memory contention and 500s on a single machine. One model, both roles.

Remote control is where "local" usually breaks, so the wiring is strict. Call it **commands-in, code-never-out.** Ollama binds to the machine's own loopback and nothing else. A Tailscale private network gives the box a stable `100.x` address reachable only from my own devices, and every flow is outbound: Telegram, Paseo, the model host. Not a single inbound public port.

```bash
tailscale up --ssh    # stable tailnet address, no port-forward, no public ingress
# ollama stays on 127.0.0.1; the tailnet is the only path to the box, and only for my devices
```

And because agents misbehave one day (they do), the daemon runs as a normal non-root user. I run the box's assistant this way already: a systemd drop-in pins the service to an unprivileged account and strips its capabilities, so an agent that goes wrong cannot take over the machine it lives on.

```ini
# /etc/systemd/system/ollama.service.d/hardening.conf
[Service]
User=ollama
Group=ollama
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
Environment=OLLAMA_HOST=127.0.0.1:11434
Environment=OLLAMA_KEEP_ALIVE=-1
Environment=OLLAMA_MAX_LOADED_MODELS=1
```

Running an autonomous agent as root is a decision to trust code you did not write with a machine you cannot cheaply rebuild. An enterprise privacy tier is a promise enforced by a lawyer. Loopback plus a private network plus an unprivileged user is a promise enforced by the operating system. I trust the second kind.

**The box is a fanless mini-PC drawing about ten watts idle,** the same one that hosts OpenClaw, my always-on assistant.

## A local model matches cloud quality on everyday code, and I measured it

That was my biggest doubt, so I spent weeks measuring instead of believing.

Hardware for the benchmark rig: my MacBook Pro M5 Pro, 64 GB of RAM. Harness: the same task every time, "generate a complete Todo app in React and TypeScript, single file, with localStorage, filtering and CSS", run headless through the real agent. I measured wall time, steps, tool calls, tokens, and whether the output compiles under a strict TypeScript compiler. The harness is one shell script, `opencode-bench/bench-agent.sh`, and the run is one line:

```bash
OPENCODE_DISABLE_CLAUDE_CODE=1 \
  opencode run -m "ollama/qwen3.6:35b-a3b-mxfp8-bench" \
  --format json \
  "Generate a complete Todo app in React+TypeScript (single file, with localStorage, filtering, CSS)"
```

The `--format json` stream is what makes this honest: it emits every `step_start`, tool call and token count, so "agent wall time" is measured from first step to last step, not guessed. That is the metric that matters for an agent. Raw tokens per second is not: an agent spends most of its life in tool-call round-trips, so the number that decides whether it feels usable is how long the whole loop takes, not how fast it decodes in a straight line.

The field: gpt-oss 20B, Qwen3-Coder-Flash 30B, Devstral-Small 24B, Qwen2.5-Coder 32B, Gemma 4 E4B, Gemma 4 31B, and Qwen3.6-35B-A3B in four quantizations, across Ollama (GGUF and MLX backends) and mlx_lm.server.

What the numbers taught me:

- **Dense models are a non-starter on this hardware.** Gemma 4 31B crashed out of memory on 64 GB (`kIOGPUCommandBufferCallbackErrorOutOfMemory`): 20 GB of weights plus a 9.5 GB KV cache exceeds Metal memory. The dense 27B decoded at about 3 tokens per second and timed out the agent stream before writing a single file. The shape that works is MoE with about 3B active parameters. On Apple Silicon memory bandwidth is the bottleneck, and the GPU reads the entire active weight set for every token, so fewer active params is the whole game.
- **The winner: Qwen3.6-35B-A3B** (73.4% SWE-bench Verified), the `mxfp8` variant on Ollama's MLX backend. **53 seconds of agent time, 4 steps, 4 tool calls, a 281-line App.tsx, zero type errors under strict, zero self-corrections.** The clean path was read the directory, glob, read the file, write, done. On this benchmark that is the same finished, compiling app a cloud coding assistant produces, from a box that never phoned home.
- **The "coding" fine-tune of the same model lost to the base model.** Twice as slow (113s vs 53s) for identical first-pass code quality, and one run in three wandered into a multi-edit self-correction loop before I killed it. Benchmarks beat naming.

The honest reading: for everyday application code, a model on your own machine is good enough to ship with. It is not a drop-in match for the largest cloud models on the hardest reasoning, and pretending otherwise would waste your time.

> War story. My first `mxfp8` run returned a flat 500: `Error: MLX not available: failed to load MLX dynamic library`. Nothing wrong with the model. The Homebrew formula build of Ollama ships without the MLX Metal runtime, so its fast quants simply cannot load. They only run on the `ollama-app` cask, which bundles `libmlx.dylib` under the app bundle. An hour lost to a correct model and the wrong binary. Now the cask is a hard requirement in my setup notes.

> War story. The "coding" fine-tune should have won on paper. It lost. Twice as slow for identical output, and a third of its runs spiralled into self-correction before I killed the process. I almost shipped it as the default on the strength of its name. The benchmark, not the label, is the only thing that told the truth.

## You pay a hardware bill, on purpose

Local AI is not a free lunch, and the same harness priced every option.

| Variant | RAM (peak) | Disk | Agent time | Steps | Notes |
| --- | --- | --- | --- | --- | --- |
| Qwen3.6 mxfp8 | ~40 GB | 37 GB | 53 s | 4 | The pick when the machine allows it |
| Qwen3.6 nvfp4 | 21 GB | 21 GB | 124 s | 16 | Low-RAM fallback, chattier: 16 steps vs 4 |
| Qwen3.6 Q4 GGUF | ~24 GB | 23 GB | 100 s | 7 | Runs without the MLX backend, brew formula OK |
| gpt-oss 20B | 12 GB | n/a | 59 s | 2 | The small fast fallback |

The interesting detail is that `nvfp4` produces the same final file as `mxfp8`, strict-TS clean, but takes 16 steps to get there instead of 4. It re-reads the file it just wrote, greps its own output, second-guesses itself. Same code, 2.3x the turns, because the 4-bit precision makes it less sure of itself. So the `nvfp4` recommendation is purely RAM-gated: if you have 40 GB free, `mxfp8` dominates on both speed and turn count. If you do not, `nvfp4` gets you there for half the memory, slower.

That is the whole deal in one table. You pay a hardware and latency bill, on purpose, in exchange for **$0 per-seat cloud cost and code that never leaves the box.**

For a decision-maker, the question turns from "can we?" into "at what spec?". That is a sizing exercise: one hardware purchase on one side, a per-seat subscription plus the leak risk you currently absorb on the other.

## I run this daily, and I shipped the slower backend on purpose

To be exact: this is my own running stack, not a delivered client engagement. I assembled it, I run it daily, and the benchmark numbers above are mine, measured on my M5 Pro with the harness in the previous section.

One honest boundary. `mlx_lm.server` would be the fastest backend I tested (about 1.5s per warm turn, 4,000 tokens per second prefill), but Qwen3.6 leaks reasoning tokens into the stream in a way opencode's adapter does not route yet, so the agent stalls on the write step until the timeout fires. I filed it and stayed on Ollama, which is slower per turn and completely reliable. The stack ships on the boring backend that works, not the fast one that does not.

The claim that matters holds. An agentic assistant can do real coding work with the source code physically confined to a machine you own. The privacy is not a clause in a vendor contract, it is a physical fact about where the computation happens. Nobody can leak what never left.

If your security policy already says "no cloud LLMs" while your engineers quietly fall behind (defence, banking, health data, legal privilege, industrial firmware), the fix is not a better vendor contract. The assistant has to run where your data already lives. I install and tune the same stack on your hardware: model sizing for your machines, agent wiring, safe remote access.
