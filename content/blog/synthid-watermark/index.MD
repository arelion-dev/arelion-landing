---
title: "How I bypassed Claude's invisible text watermark in one rewrite"
date: "2026-08-12T12:00:00.000Z"
description: "Anthropic weaves an invisible watermark into Claude's text. I reproduced SynthID-Text on a modern model, calibrated the detector, and measured exactly what erases the mark."
tags: ["Tech", "AI"]
private: false
---

[Anthropic's support page](https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content) says it plainly: supported Claude models weave an imperceptible watermark into the text they generate. Online, that grew into a bigger claim, that the mark fingerprints your prompt and traces the text back to you. So I reproduced the method and measured it.

One thing up front, so the title does not oversell. I did not touch Claude's watermark. Anthropic's key is secret, so no one can read Claude's mark from the outside. I reproduced the published mechanism on my own model, with my own key, and I broke that. The "bypass" is real, and it transfers, because the weakness is in the method, not in one key.

![How the text watermark is embedded, detected, and erased](images/watermark-flow.png)
_A secret key biases word choice at generation. The detector replays the key on long text. One rewrite erases the signal._

**tl;dr**
- The public method that fits the description is SynthID-Text, published in Nature in 2024. Anthropic has not confirmed the algorithm, so this is the closest match, not a certainty.
- I ran one model end to end: Qwen3.5-4B, one sampling config, a fixed seed. Every number below comes from that run.
- The detector is reliable, but only after you calibrate the threshold. A naive threshold hides the signal. A calibrated one catches it 100% of the time from 200 tokens up.
- The mark rides on sampling randomness. A confident model carries a weak mark. You can strengthen it with temperature, but the text degrades.
- Random edits survive up to about 10 to 20% of the tokens. One full paraphrase drops the signal to zero, below any sane threshold. That is the bypass.
- The published scheme is zero-bit. It detects "this is AI", not "this is you".

## What Anthropic said

The support page is short. It names two techniques: a watermark embedded in the text, and signed C2PA metadata on generated files. The text watermark "travels with the text when it's copied and pasted" and "may persist through some editing". It sits at the model level, so every Claude surface carries it. The page gives no algorithm and no detector yet.

This is not a surprise feature. It is regulation. The same page says Anthropic signed the EU AI Act's Article 50(2) Code of Practice on transparency of AI-generated content. Article 50 makes providers of generative AI mark their synthetic output in a machine-readable way, so a machine can tell it was AI-made. The obligation starts to bite in August 2026. Watermarking is how you meet it at the model level, and every large provider will ship one. So this is not a Claude quirk to route around. It is the direction the whole field is heading, which is exactly why it is worth knowing how well it holds.

That gap is what let the speculation run. So I did not argue about the page. I reproduced the one published method that matches the description, and I measured it.

## How the watermark works

At each step the model has a probability for every next token. A pseudo-random function, seeded by a secret key, gives each candidate token a g-value, close to a 0 or a 1. The sampler leans toward tokens with a high g-value. It chooses between near-equal phrasings, so the meaning holds.

To detect, you replay the key over the finished text and average the g-values.

- No watermark: the g-values are fair coin flips. The mean sits near 0.50.
- Watermarked: the mean is pushed up.

The test turns that mean into a z-score. More tokens give more certainty. The whole detector is a few lines.

```python
import numpy as np

def detect(token_ids, processor):
    g = processor.compute_g_values(token_ids)               # (1, L, depth)
    mask = processor.compute_context_repetition_mask(token_ids).float()
    per_token = g.float().mean(dim=-1)                       # score each token
    n = mask.sum().item()                                    # scored tokens
    mean_g = (per_token * mask).sum().item() / n
    z = (mean_g - 0.5) / np.sqrt(0.25 / n)
    return mean_g, z, n
```

This is the simple mean g-value test, not the trained Bayesian detector that SynthID ships for best results. So every "not detected" below is a lower bound. The real detector can do better.

## The generator, and one honest look at the text

Closed loop, so I hold the key on both sides. I use Qwen3.5-4B, a current open model, so the text is real prose and not a 2019 toy.

```python
from transformers import (
    AutoModelForCausalLM, AutoTokenizer,
    SynthIDTextWatermarkingConfig, SynthIDTextWatermarkLogitsProcessor,
)

KEYS = [654, 400, 836, 123, 340, 443, 597, 160, 57, 29]
cfg = SynthIDTextWatermarkingConfig(keys=KEYS, ngram_len=5)

out = model.generate(**inputs, do_sample=True, watermarking_config=cfg,
                     max_new_tokens=length)  # watermarked
# control = the same call, without watermarking_config
```

The panic threads never show the actual output. So here it is. Watermarked and not, same prompt, "Explain how a suspension bridge carries load." The two read the same.

Watermarked (detected):

> A suspension bridge carries load through a distinct chain of tension and compression forces that transfers the weight of the bridge and its traffic to tall anchorages on either side of the river or valley.

Control, no watermark (not detected):

> A suspension bridge carries load through a specific sequence of mechanical forces that transfer the weight of the bridge and traffic from the deck up through cables, into towers, and finally into the ground via anchorages.

A reader cannot tell them apart. That is the design. One honest note: the watermark needs sampling, and this model, under sampling, sometimes emits an odd token. The control does it too. The mark does not cause it.

## Everything depends on the threshold

Here is the correction, and the mistake I made on my first pass.

The z-score above looks large, so a natural threshold is z greater than 4. With that threshold, the watermark looks weak: it fails at 200 tokens and only reaches 50% at 800. I believed that for a day.

It is wrong. The mean g-value test is scaled too conservatively, so its z-scores run small. You do not pick the threshold by theory. You pick it from the control group. My control z-scores had a mean of -0.11 and a standard deviation of 0.28. So I set the threshold at the 99th percentile of the control, which is 0.56. Above it, a human text almost never lands.

With that calibrated threshold, the same runs read very differently.

| generated length | detection rate (watermarked) | false positives (control) |
|---|---|---|
| 200 tokens | 100% | ~0% |
| 400 tokens | 100% | ~0% |
| 800 tokens | 100% | ~0% |
| 1200 tokens | 100% | ~0% |

Watermarked z-scores ran from 1.2 to 6.9. Control z-scores never passed 0.56. The two groups do not overlap. So the watermark is not weak. It is reliable from a couple hundred tokens, once you stop using a made-up threshold. Six trials per cell, one seed. Short text stays unmarkable: a tweet-length reply has too few tokens to score.

## The mark is only as strong as the randomness

Why did the naive threshold ever look plausible? Because on a good model the raw signal really is small. That has a cause, and it is worth understanding.

The watermark hides in the choice between near-equal tokens. A confident model puts most of its probability on one token, so there is little room to bias the choice. Raise the sampling temperature and you give the mark more room. I swept it, at 400 tokens.

| temperature | watermark z-score | text quality |
|---|---|---|
| 1.0 | 2.8 | clean |
| 1.2 | 4.2 | clean |
| 1.4 | 6.5 | starts to drift |
| 1.6 | 9.6 | breaks into gibberish |

The signal climbs straight with entropy. So does the damage to the text. A provider who wants a strong mark, one that survives edits, has to spend text quality to get it. A provider who keeps the text clean ships a faint mark. That trade-off is fixed, and it is why the same watermark is strong on a weak model and faint on a good one.

## What actually erases it

Two attacks, both from the SynthID-Text paper, both measured against the calibrated threshold.

**Random token corruption.** Replace a fraction of tokens with random tokens. This is the crudest possible edit, garbage in place of words, so it is an upper bound on how easy a real edit is.

| tokens corrupted | detection rate |
|---|---|
| 0% | 100% |
| 5% | 100% |
| 10% | 100% |
| 20% | 83% |
| 30% | 50% |

The mark survives to about 10 to 20% corruption, then falls. It holds up better than my first pass claimed, because each surviving token still carries signal. A careful editor who swaps a word here and there does not get near the break point.

**Paraphrase.** Feed the watermarked text back to a model and ask for a rewrite in different words, with no key. Then detect the rewrite.

```python
rewrite = "Rewrite this in different words, same meaning:\n\n" + watermarked_text
paraphrased = model.generate(**tok(rewrite), do_sample=True)   # no key
mean_g, z, n = detect(paraphrased, processor)
```

Across six texts, the original z-scores averaged 3.1, all detected. After one paraphrase they averaged 0.0, none detected, every one below the 0.56 threshold. The rewrite re-tokenises the whole passage, so almost every n-gram that carried a g-value is gone. Corruption nibbles at the mark. Paraphrase deletes it. This is the bypass, and it beats the calibrated detector, not a straw-man one.

## Why text is easier to strip than an image

The panic threads compare this to image watermarks and get the asymmetry backward. The difference is not how much noise you add. It is which redundancy you use.

An image watermark spreads a signal across millions of pixels, built to survive JPEG, crop, and resize. The carrier is huge. To kill the mark you have to degrade the image so far that people notice. Image marks are not unbreakable, regeneration and diffusion attacks do strip them, but you pay for it in pixels.

A text watermark lives in a few hundred token choices. And language is redundant in meaning: many token sequences say the same thing. So you rewrite freely and keep the meaning at almost no cost. You cannot paraphrase an image without wrecking it. You can paraphrase a sentence and lose nothing. That is why text is the softer target.

## Two claims from the threads that are wrong

**"It doubles your token bill."** No. The watermark biases which token is sampled. It does not add tokens. Same length, same cost.

**"It encodes your prompt and tracks you."** Not shown anywhere. SynthID-Text as published is zero-bit. It answers "was this watermarked", not "who wrote it". Schemes that carry an identifier exist in the research, but nothing public shows Anthropic runs one. And a tracker that one paraphrase deletes would be a poor tracker.

## The AI-detector websites are a different thing

People mix this up with GPTZero, Turnitin, and Originality.ai. Those are not watermark detectors.

A watermark is a signal placed on purpose, with a key. The generator cooperates. A post-hoc detector gets none of that. It receives a finished text, no key, and guesses from statistics: how predictable the words are, how uniform the sentence lengths run, or the score of a trained classifier.

The gap is reliability. With the key, the watermark test rarely fires on human text. The post-hoc detector guesses, and it is often wrong. OpenAI shut its own detector down in 2023, at about 26% true positives and 9% false positives. Turnitin and GPTZero have flagged real students, and they hit non-native writers hardest, because plain prose reads as machine-like.

| | Watermark | Post-hoc detector |
|---|---|---|
| Signal | placed on purpose (key) | none, inferred |
| Model cooperation | required | none |
| False positives | very low | high |
| Scope | marked text only | any text |
| Beaten by | paraphrase | paraphrase, or "write it like a human" |

Both fall to the same paraphrase. One is precise but narrow, the other broad but unreliable. That is exactly why providers push watermarking: because the guess-from-style detectors do not hold up.

## What holds up, and what I did not test

Set the threshold from a real control group, and this watermark is a solid transparency signal. It catches unedited, copy-pasted AI text with almost no false alarms. It does not survive a rewrite, it does not work on short text, and it does not name a person.

The limits of my run, stated plainly: one model, one sampling config, a fixed seed, six trials per cell. The detector is the simple mean g-value test, not the Bayesian one, so my "not detected" numbers are the easy case for the attacker. Anthropic's real watermark could be stronger or use a different scheme. I could not test it, because the key is secret.

The honest answer is undramatic. The watermark works. A rewrite beats it. Both of those are true at once.

Code and the benchmark are in the repo. Change the keys and break your own watermark.
