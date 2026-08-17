---
title: "The 27B I wrote off now runs as a coding agent, on a laptop"
date: "2026-08-17T09:00:00.000Z"
description: "Three months ago I benchmarked a dense 27B as a local coding agent and killed it at 3 tokens a second. This week Qwen3.8-27B wrote working code inside DeepSeek's new open-source harness on my M5 Pro. Real numbers, the one error that cost me the setup, and an honest read on how far local inference has actually come."
tags: ["Tech", "AI"]
private: true
---

Three months ago I benchmarked a dense 27B model as a local coding agent and wrote it off in one line of notes: "non-starter." It decoded at about three tokens a second and stalled the agent stream before it wrote a single file. Dense 27B on a 64 GB laptop was a dead end, so I moved on and shipped a mixture-of-experts model instead.

This week the same class of model wrote a correct, tested function on the same laptop, in about forty seconds, inside a harness DeepSeek open-sourced days earlier. So I want to be precise about what changed, because the honest version is more useful than the hype version.

**tl;dr**: Qwen3.8-27B (dense, 4-bit, 18 GB) runs a real coding-agent turn on an M5 Pro at about 11 to 13 tokens a second through DeepSeek Harness pointed at local Ollama. One version-skew error cost me the first hour. It is good enough for everyday code. It is not a frontier model, and I did not measure it against one, so I am not going to pretend.

## What DeepSeek Harness actually is

First, a naming trap I walked into and you might too. DeepSeek Harness is not a benchmark harness. The word "harness" collides with `lm-evaluation-harness`, and that is the wrong mental model. It is an **agent** harness: a coding agent you drive, plugin-based, with a web UI. Think opencode or Claude Code, not a scoring script. Its own tagline is "everything is a plugin," and the model is one of those plugins.

That last part is what matters for local work. The model plugin speaks to any OpenAI-compatible endpoint, so it points at a local Ollama server the same way every other agent does. You launch it with `npx @deepseek-ai/dsh web`, it serves a UI on `127.0.0.1:3080`, and you add a custom provider in `settings.yaml`:

```yaml
llm-pi-ai:
  providers:
    local-ollama:
      apiKeyEnv: OLLAMA_API_KEY        # dummy value, Ollama ignores auth
      api: openai-completions
      baseURL: http://localhost:11434/v1
      models:
        - id: "hf.co/unsloth/Qwen3.8-27B-GGUF:UD-Q4_K_XL"
```

Point `DSH_HOME` at the directory that holds this file, set `OLLAMA_API_KEY` to any string, and the provider shows up in the model picker next to DeepSeek's own cloud models. No account, no outbound traffic to run the model. The same "commands in, code never leaves" property I care about for client work.

## The error that cost me the first hour

I pulled the model, wired the config, sent a prompt, and got this:

```
{"error":{"message":"unable to load model: .../blobs/sha256-bee238...","type":"api_error"}}
```

Generic and unhelpful. The real message was in `~/.ollama/logs/server.log`:

```
llama_model_load: error loading model architecture: unknown model architecture: 'qwen35'
llama_model_load_from_file_impl: failed to load model
```

The 18 GB download was fine. The runtime was too old. Qwen3.8 declares its architecture as `qwen35` (it is built on the Qwen3.5 base, with Gated DeltaNet and Gated Attention), and the llama.cpp bundled inside my installed Ollama did not know that architecture yet. My Ollama was **0.20.7**. The current release was **0.32.14**, twelve minor versions ahead. `brew upgrade ollama`, restart the service, and the model loaded clean.

This is the local-inference tax nobody puts on the slide. The model ships faster than the runtime that loads it, and the error you get is a wall of nothing until you go find the log. An hour lost to a correct model and the wrong binary. One caveat worth stating: bumping the runtime under a benchmark you already ran means the old numbers are no longer strictly comparable, so I keep the version in the notes.

## The numbers, warm

Once it loaded, I measured instead of guessing. M5 Pro, 64 GB, the 4-bit `UD-Q4_K_XL` quant, thinking mode on (Qwen3.8 thinks by default), warm model:

| Task | Prefill | Generation |
|---|---|---|
| Write a merge-two-sorted-lists function | 174 tok/s | 12.7 tok/s |
| Fix a divide-by-zero in an average function | 170 tok/s | 10.8 tok/s |
| Explain process versus thread in three sentences | 150 tok/s | 13.0 tok/s |

Then the same thing end to end through the harness, in read-only mode so it could not touch the repo. I asked for a palindrome checker with doctests. The harness reported the run: **57 seconds total, 43 seconds to first token, 13 tokens a second, 8.5K tokens in, 175 tokens out.** It thought first, then wrote:

```python
def is_palindrome(s):
    """Return True if s is a palindrome, ignoring case and non-alphanumeric characters.
    >>> is_palindrome('A man, a plan, a canal: Panama')
    True
    >>> is_palindrome('race a car')
    False
    """
    cleaned = ''.join(ch.lower() for ch in s if ch.isalnum())
    return cleaned == cleaned[::-1]
```

Correct, and the two doctests pass. The 43-second first-token number is the cold cost: loading 18 GB into memory, then prefilling the harness's own 8.5K-token system prompt. Keep the model resident with `OLLAMA_KEEP_ALIVE=-1` and idle time stops re-paying it.

## What actually changed since "non-starter"

Here is where I have to be careful, because the tempting story is a clean four-times speedup in three months and that is not what happened. Three things moved at once between the old run and this one:

- **Quant.** The model I killed in May was 8-bit (about 31 GB). This one is 4-bit (18 GB). Half the bytes per token is roughly half the work, and on Apple Silicon memory bandwidth is the whole game, so a good chunk of the speedup is just the quantization I chose.
- **Backend.** May was Ollama's MLX path. This is GGUF on a much newer llama.cpp.
- **The model and its architecture.** Different generation, different attention.

So the fair sentence is narrow: a dense 27B, at 4-bit, on the current GGUF runtime, now runs a coding-agent turn at usable speed where last generation's 8-bit variant stalled. That is real progress, mostly in the runtime and the quant catching up, not a miracle in the weights. My faster mixture-of-experts pick still beats it per turn. The 27B is viable now, not victorious.

## The comparison I did not run

I know the question everyone wants answered: how close is this to a frontier cloud model. I am not going to give you a number, because I did not run that head to head, and inventing one would waste your time.

What I can say is the same thing I concluded when I benchmarked my local stack properly: for everyday application code, a model on your own machine is good enough to ship with, and it falls short when the reasoning gets genuinely hard. Qwen3.8-27B on a laptop did not change that line. It moved a whole model size class from "does not work as an agent" to "works as an agent," which is the part I care about. If I want the frontier comparison, it is a measured benchmark with a real harness and a compile check, not a vibe, and I will run it before I claim it.

## So, is local ready

For the class of task I keep testing, single-file app code, small functions, bug fixes with a clear cause, a 27B on a laptop now does the job with the source never leaving the machine. That was not true for this model size in May. The interesting shift is not one model. It is that the runtime and the harness ecosystem grew up together, so the model you download this week has somewhere to run and something to drive it by the weekend.

The 27B I wrote off came back. Not as a frontier replacement. As a colleague that works offline, which for anyone who cannot send their code to a third party is the only kind that counts.

I set up and tune this exact stack on hardware you own, model sizing included. The privacy is a physical fact about where the computation happens, not a clause in a contract.
