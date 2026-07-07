---
title: "Ghost in the LLM: fine-tuning Mistral-7B on my own text messages"
description: "What happens when you fine-tune Mistral-7B on 70,000 of your own text messages? A hands-on walkthrough of recreating yourself as a chatbot with QLoRA, inspired by Black Mirror's 'Be Right Back'. Notebooks and deployment scripts included."
date: 2026-07-06
tags: ["ai", "llm", "fine-tuning", "qlora", "mistral", "privacy"]
pillar: "Writing"
stack: ["Python", "Mistral-7B", "QLoRA", "Axolotl", "Hugging Face", "Replicate", "Lambda Labs", "Jupyter"]
lang: "en"
---

Remember that eerie Black Mirror episode "Be Right Back", where a woman uses an AI service that scrapes old texts, emails and social media to build a chatbot version of her deceased boyfriend? The one that made you think "there's no way this could actually work, right?"

Turns out you can do it too. With anyone you have exchanged enough messages with. Without their consent. Welcome to 2025.

I fine-tuned Mistral-7B on my personal conversation data to build an AI that replicates my communication style. The result is a surprisingly convincing digital ghost that talks like me: the dramatic expressions, the casual language, the specific references.

**tl;dr**: I spent around $200 and 16 hours training a model on 70k text messages, and now I have an AI that sounds disturbingly like me.

All the [code is on GitHub](https://github.com/antonhansel/ghost-in-the-llm) if you want to try it yourself.

Note: all conversation examples below have been translated from French.

Here is what I found works best:

- **Keep it simple.** Train directly on conversation data instead of overcomplicating things.
- **Two speakers max.** A (me) and B (everyone else), in a clean JSONL format.
- **Rolling context.** Use 6 to 12 previous messages to give the model proper context.
- **QLoRA.** 4-bit quantization makes this affordable for regular people.
- **Let it be multilingual.** No special handling needed for my French/English code-switching.

I also experimented with cloning someone else I had exchanged a lot of messages with, and it works surprisingly well.

## Picking the right model: why Mistral-7B?

I chose Mistral-7B as the base model for two reasons. First, it is powerful enough to understand context and generate coherent responses, but not so massive that fine-tuning becomes prohibitively expensive. Second, it handles multilingual content naturally, with no special preprocessing on my side.

**The setup:**

- **Base model**: `mistralai/Mistral-7B-v0.3` (the sweet spot for performance vs cost)
- **Fine-tuning**: QLoRA with 4-bit quantization (because I am not made of money)
- **LoRA config**: r=16, alpha=32, dropout=0.05 (after some trial and error)
- **Target**: all the important linear layers in the model

**Training details:**

- **Sequence length**: 1024 tokens (enough context without breaking the bank)
- **Learning rate**: 5e-5 with cosine scheduling
- **Epochs**: 8 (turned out to be right for convergence)
- **Memory usage**: around 7.8 GiB VRAM (manageable on cloud GPUs)
- **The important flag**: `train_on_inputs: true` (crucial for learning conversation patterns)

## The data: preparing my digital DNA

The tricky part was figuring out how to format my conversations for training. I needed something that would teach the model to predict what I would say next, given the context of the previous messages.

Here is what I settled on:

```jsonl
{
  "text": "A: So first you can edit messages on telegram So correction messages with an asterisk there you go\nB: Are you giving me lessons? The guy with a hoodie photo? :p Ok ok it's new\nA: You look like a boomer using telegram\nB: I have trouble with my phone\nA: With your GSM 😂\nB: On my cellphone yes xD Coming from a thirty-something it's offensive\nA: Wowowow No insults Thirty-something calm down I'm two years older than you, when is your birthday?"
}
```

**The formula:**

- **Context window**: 6 to 12 previous messages (enough context, not too much noise)
- **Target**: the next message I would write (the A: responses)
- **Training type**: next-token prediction (the model learns to complete my thoughts)
- **Speaker labels**: A: (me) and B: (everyone else), simple but effective

## The training: 16 hours of digital soul-searching

After setting everything up and a lot of trial and error tweaking Axolotl settings, I fired up the training on a cloud GPU rented from Lambda Labs.

- **Loss**: started at 3.4, dropped to 0.9 (stable convergence)
- **Training time**: 16 hours on an H100 PCIe
- **Cost**: around $48 for the final training, around $200 total including all my other experiments
- **Memory**: around 7.8 GiB VRAM, processing around 2,180 tokens per second
- **Quality**: smooth convergence, no overfitting or gradient explosions

I also experimented with switching the model's target tone to other people I talk with. This pushed the creepy-o-meter to a level I was not comfortable with, but it works very well if you ever want to try it.

## The toolkit: everything you need to build your own ghost

I made everything available on GitHub so you can try this yourself. The repository takes you from raw message exports to a functional AI that sounds like you:

```
ghost-in-the-llm/
├── 01_message_parsing.ipynb      # Extract messages from WhatsApp & Telegram
├── 02_prepare_messages.ipynb     # Clean and format for training
├── data/                         # Your personal message data
│   ├── raw/                      # Raw exports from messaging apps
│   ├── cleaned/                  # Cleaned message data
│   └── processed/                # Training-ready JSONL datasets
├── models/                       # Your trained model checkpoints
├── scripts/                      # Handy utilities
│   ├── merge_lora_fp16.py        # Convert LoRA adapters to full model
│   ├── test_model.py             # Test your model
│   └── sanity_check.py           # Validate everything works
├── replicate_deployment/         # Deploy to the cloud
├── config/                       # Configuration files
│   ├── training_config.yaml      # Training parameters
│   └── user_config.json          # Tell it who you are
└── requirements.txt              # Python dependencies
```

## The process: from raw messages to digital ghost

The whole process is broken into manageable steps. I built Jupyter notebooks that walk you through each part, from data parsing to the training config, all available on [GitHub](https://github.com/antonhansel/ghost-in-the-llm).

If you want to experiment with cloning someone else, change the target in `config/user_config.json`.

I pre-configured all the parameters that worked for me in `config/training_config.yaml`:

- QLoRA settings (r=16, alpha=32, dropout=0.05), the sweet spot I found
- Training hyperparameters (learning rate, batch size, epochs)
- Model architecture settings
- Hardware optimization for cloud training

Unless you have a massive GPU sitting around (I do not), you will need to rent some cloud compute. I used Lambda Labs (cloud.lambda.ai), reliable and reasonably priced, to grab an H100 PCIe or A100 40GB for $2 to $5 per hour.

### The cost

- **Final training**: around $48 (16 hours on H100)
- **Experimentation**: around $150 (failed attempts, parameter tuning, cloning other people)
- **Total**: around $200 (cheaper than therapy)

The experimentation cost covers all my failed attempts and parameter tuning. Consider it tuition for learning how to do this properly.

## After the training: bringing your ghost to life

Once training is complete, you are not quite done. The model exists as LoRA adapters that need to be merged with the base model to create a deployable version. I included a script that does this automatically, since I could not figure out how to do it with Axolotl: `merge_lora_fp16.py`.

You then have several options for deploying your new AI:

- **Hugging Face Hub**: private model hosting, easy integration with transformers
- **Replicate**: fast cold starts (a few minutes), scalable inference (around 3s per response)
- **Local deployment**: run it on your own machine for maximum privacy

I went with Replicate for the convenience, but Hugging Face Hub is great if you want more control.

## Talking to a creepy version of yourself

After all that work, the big question: does my digital ghost actually sound like me?

- **Model size**: around 14GB (merged FP16 weights)
- **Inference speed**: under 4 seconds per response on A100
- **Training efficiency**: 7.8 GiB VRAM, 2,180 tokens/sec
- **Convergence**: stable loss reduction from 3.4 to 0.9

Here are a few tests I ran to see if the ghost captures my voice (translated from French):

Example 1:

```
A: Do you want to see Dune this weekend?
B: Yes sounds good ! Which cinema ?

A: As long as there is AC I'll be there ! I have flashbacks from New Year's eve.
```

Example 2:

```
A: you know what? We've been waiting in line at Bouillon Chartier for 1h04 lmao
B: Are you still doing that?

A: Honestly I'm at my limit. This is the worst time of my life, this is my vietnam.
```

Example 3:

```
A: Shit I didn't return my Rental Bike properly when I went there
B: Oh no :(
A: Well 300€ down the drain apparently lol
B: nooooo :(

A: Oh wait! I was in the elevator when I got a notification that my bike was returned ! Thank you little Jesus ! I did have money on the account anyway.
```

Example 4:

```
B: What do you want? I'm going to the shop. Do we need alcohol ?

A: Wasabi, bread, Philadelphia cheese, 100L trash bags and bitcoin. No more than 30 bottles, I don't want New Year's flashback !
```

These examples show the model capturing my dramatic expressions, my casual language, and my tendency to make random references. The model picked up on the way I dramatize things: "I have flashbacks from New Year's eve", or "this is my vietnam", which is totally something I would say about the slightest inconvenience. It also captured my casual tone and my tendency to talk a bit too much about crypto. It is both impressive and slightly unsettling.

### Sometimes it won't stop talking

One limitation I found: the model sometimes generates multiple conversation turns instead of stopping after my response. This happens because the training data contains complete conversation flows, and the model learns to continue the pattern. With no obvious fix and no more time to experiment, I patched it with post-processing and stop markers. It is not perfect, but it works well enough for most cases. Consider it a feature: your digital ghost is just really chatty.

If you are feeling brave and want to build your own, clone the repo and have fun. The whole thing takes a few hours of setup and 16 hours of training, but the result is worth it.

## The elephant in the room: privacy and ethics

Now the important part.

This project is a privacy nightmare. You take other people's thoughts and private information and pour them into a bunch of off-the-shelf models. You can clone someone's tone when they interact with you quite easily. The model sometimes spat out private information I was genuinely surprised it had learned. It did not only learn patterns: private details surfaced too.

My initial plan was to make the model available for a few hours through a Telegram bot, but after playing with it I decided it was a bit too controversial.

I even thought about turning this into a SaaS product. The idea was simple: users upload their message exports, wait a few hours, and get their own digital doppelgänger. The technical implementation would be straightforward.

But after spending time with my own ghost, and seeing how convincingly it replicated not just my communication style but also private information I did not even realize was in my messages, I decided against it.

The privacy implications are staggering. The potential for misuse is enormous. And the questions around consent, data ownership and digital identity are far more complex than I first realized.

Being able to do something does not mean you should. Sometimes the most responsible thing is to not build the thing, even when you can.
