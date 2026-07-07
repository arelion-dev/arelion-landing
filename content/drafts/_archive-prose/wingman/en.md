---
title: "Wingman: building my own GitHub Copilot from scratch"
description: "Why I built my own alternative to GitHub Copilot, fine-tuned on a private codebase. A deep dive into LLM-powered code completion: the model choice, quantization, LoRA, the GPU wall, and what actually broke along the way."
date: 2026-07-06
tags: ["ai", "llm", "fine-tuning", "code-completion", "writing"]
pillar: "Writing"
stack: ["Python", "PyTorch", "CUDA", "CodeLlama-7B", "Hugging Face Transformers", "PEFT", "LoRA", "bitsandbytes", "Flash Attention 2", "Vast.ai"]
lang: "en"
---

If you have not heard of LLM-powered coding assistants like GitHub Copilot by now, welcome back from under your rock. Copilot, originally powered by OpenAI's Codex (a descendant of GPT-3 trained on a huge corpus of public repositories), is an AI code-completion tool that lives inside your IDE. It is context-aware: it reads the surrounding code, the comments, and the project structure, then suggests anything from a single line to a whole function.

I wanted to know what it takes to build that myself, and to point it at a private codebase instead of the public internet. The result is Wingman. Here was the plan:

- Pick a model built for code suggestions.
- Fine-tune it on a private company codebase.
- Deploy the fine-tuned model on an inference server.
- Use it inside a VSCode extension, the same way you use Copilot.

Fun detail: every code comment you will see in this experiment was written by the fine-tuned model itself. Wingman commenting on its own training code.

## The model: CodeLlama-7B-Instruct, PyTorch, and CUDA

I worked with `codellama/CodeLlama-7b-Instruct-hf`, part of the CodeLlama family built specifically for coding tasks. It sits on the LLaMA (Large Language Model Meta AI) architecture and has 7 billion parameters, one of the smaller variants in the family (the others are 13B and 34B). The "Instruct" variant is tuned for instruction-following, which makes it a good fit for code generation and completion.

It was trained on a wide mix of open-source code across many languages plus a lot of natural-language text, so it can both write code and talk about it. For perspective on the cost of building these things: Meta reported that training all nine Code Llama models took 400K GPU hours on A100-80GB hardware, with estimated emissions of 65.3 tCO2eq, offset through their sustainability program.

For training I used PyTorch (the deep-learning library from Facebook's AI Research lab) and CUDA (NVIDIA's parallel-computing platform that lets you run general-purpose work on GPUs).

## Building the dataset

The dataset step is simple: feed the whole codebase to the model. I walked the repo, dropped build, configuration, and system files, and pushed the rest to Hugging Face's dataset service.

```python
import pandas as pd
import os
from datasets import Dataset
from huggingface_hub import create_repo, upload_folder, notebook_login

ignoreFolders = [
    'node_modules', 'build', 'dist', '.next', 'public',
    'png', 'svg', 'coverage', '.DS_Store', 'docker'
]

ignoreFiles = ['.DS_Store', 'package-lock.json', 'yarn.lock']

def readRepoFiles(directory: str) -> pd.DataFrame:
    filePaths = []
    data = []

    for root, dirs, files in os.walk(directory):
        dirs[:] = [currentDir for currentDir in dirs if currentDir not in ignoreFolders]
        for file in files:
            if file not in ignoreFiles:
                filePaths.append(os.path.join(root, file))

    for file in filePaths:
        try:
            with open(file, 'r') as f:
                readData = f.read()
                data.append({'filename': file, 'content': readData})
        except Exception as e:
            print(f'Error reading file: {file}, Error: {e}')

    df = pd.DataFrame(data)
    return filePaths, df

def uploadToDataset(df: pd.DataFrame):
    repoId = create_repo(
        repo_id='dataset-b53-codebase',
        repo_type='dataset',
        exist_ok=True,
        private=True
    )
    dataset = Dataset.from_pandas(df)
    dataset.push_to_hub('dataset-b53-codebase')

def main():
    filePaths, df = readRepoFiles('../repos')
    print(f'Files: {len(filePaths)}, total elements: {df.size}')
    uploadToDataset(df)

if __name__ == '__main__':
    main()
```

## Preparing the data for training

With the dataset on the Hub, the next job is to load it, tokenize it, and set up the labels.

```python
set_seed(seed)
tokenizer = AutoTokenizer.from_pretrained(model_path)

dataset = load_dataset(dataset_name, split='train')
dataset = dataset.train_test_split(test_size=0.1, seed=seed, shuffle=True)

train_data = dataset["train"]
print(f"Length of the training dataset: {len(train_data)}")
test_data = dataset["test"]

max_length = 510

if (tokenizer.pad_token is None):
    tokenizer.pad_token = tokenizer.eos_token

def tokenize_and_prepare_labels(examples):
    tokenized_inputs = tokenizer(examples['content'], truncation=True, padding='max_length', max_length=max_length)
    labels = [row[1:] + [-100] for row in tokenized_inputs["input_ids"]]
    tokenized_inputs["labels"] = labels
    return tokenized_inputs

tokenized_train_data = train_data.map(tokenize_and_prepare_labels, batched=True, remove_columns=train_data.column_names)
tokenized_test_data = test_data.map(tokenize_and_prepare_labels, batched=True, remove_columns=test_data.column_names)
```

A few things worth pausing on. `set_seed(seed)` makes the run reproducible, so random processes land the same way every time. `AutoTokenizer.from_pretrained` loads the tokenizer that turns text into the tokens the model understands. I split 90/10 into train and test (`test_size=0.1`, seeded and shuffled), and cap sequences at 510 tokens.

The labels are the interesting part. For a causal language model you train it to predict the next token, so the labels are the input IDs shifted left by one, with the last position set to `-100`, the ignore index the loss function skips: `labels = [row[1:] + [-100] for row in tokenized_inputs["input_ids"]]`. Get this wrong and you hit the "model did not return a loss" error later on. Finally I map the function over both splits in batches and drop the original columns to keep the trainer quiet.

### Side note: how many characters is a token?

A token is a unit of text processing. It is not a word: it can be part of a word, a couple of words, punctuation, or spaces. You can measure the average characters per token like this:

```python
total_chars = 0
total_tokens = 0

for example in train_data:
    total_chars += len(example["content"])
    total_tokens += len(tokenizer(example["content"]).tokens())

chars_per_token = total_chars / total_tokens
print(f"Average number of characters per token: {chars_per_token:.2f}")
```

```
Length of the training dataset: 2168
Average number of characters per token: 2.30
```

Why care? Two reasons. First, models have a fixed context window measured in tokens (512, 1024, more). Knowing characters per token tells you roughly how much real text fits in that window, so you can budget your inputs. Second, tokens drive memory and compute: the model processes token by token, so more tokens means more load. A low characters-per-token ratio also hints that the tokenizer is splitting things finely.

### Side note: why fixed-length inputs

LLMs want fixed-length inputs, mostly because of the Transformer architecture. The layers expect a fixed content length for the matrix multiplications, fixed-size batches compute more efficiently, and attention compares every token against every other token, which is cleaner when lengths are constant.

It is not universal. RNNs are built to handle variable-length sequences, processing one token at a time, so this is an architecture choice, not a law. And if you cannot produce fixed-length inputs, you pad: add dummy tokens to equalize lengths, then hand the model an attention mask that says which tokens are real and which are padding to ignore.

### A note on FIM (Feature Importance Mixing)

FIM kept coming up in my reading. It is a data-augmentation technique: increase the diversity of training data without collecting new data, which matters a lot when your dataset is a single, relatively small codebase. You slightly perturb the training examples so the model generalizes instead of memorizing specific patterns.

The catch is choosing which tokens are safe to change. On a JavaScript/TypeScript codebase, renaming variables, functions, literals, or operators can easily produce code that no longer parses. JavaScript has no named parameters, so you cannot shuffle arguments either, unless you are dealing with a spread object. The clean way to do it would be to parse to an AST, define safe permutations on the tree, then serialize back to code. Out of scope here, but a good future project.

## Loading and preparing the model

Now the model itself, with the optimizations that make a 7B model trainable on modest hardware.

### Step 1: load in 4-bit precision

```python
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="fp4",
    bnb_4bit_compute_dtype="bfloat16",
    bnb_4bit_use_double_quant=False,
)
```

This quantizes the model to 4-bit. `load_in_4bit=True` loads it at 4-bit precision, `bnb_4bit_quant_type="fp4"` picks the FP4 format, `bnb_4bit_compute_dtype="bfloat16"` runs the actual math in 16-bit, and I skip double quantization to keep it simple.

The tradeoff is obvious: you lose precision and range. Roughly:

- 32 bits: about 7 digits of precision
- 16 bits: 3 to 4 decimal digits
- 8 bits: about 3 decimal digits
- 4 bits: below 3 decimal digits

If you remember your CS101, a 32-bit float is 1 sign bit, 8 exponent bits, and 23 mantissa bits. Cutting to 4 bits is aggressive, but it is what makes the model fit in memory at all.

### Step 2: load the pre-trained model with quantization

```python
model = AutoModelForCausalLM.from_pretrained(
    pretrained_model_name_or_path=model_path,
    load_in_8bit=False,
    quantization_config=bnb_config,
    trust_remote_code=True,
    attn_implementation="flash_attention_2",
    low_cpu_mem_usage=True
)
```

`AutoModelForCausalLM` gives us a transformer suited for causal language modeling. It applies the 4-bit config, and the parameter that actually matters here is `attn_implementation="flash_attention_2"`: a fused attention kernel that cuts memory pressure, which is precisely what you fight against on a small GPU.

### Step 3: prepare for k-bit training with gradient checkpointing

```python
model = prepare_model_for_kbit_training(
    model,
    use_gradient_checkpointing=True,
    gradient_checkpointing_kwargs={"use_reentrant": True}
)
```

Gradient checkpointing trades compute for memory: instead of storing every intermediate activation for the backward pass, it recomputes them on the fly. You pay in CPU/GPU time and get memory back, which is the trade you want when memory is the bottleneck.

### Step 4: LoRA (Low-Rank Adaptation)

```python
peft_config = LoraConfig(
    lora_alpha=64,
    lora_dropout=0.1,
    r=32,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules="all-linear"
)
model = get_peft_model(model, peft_config)
```

LoRA is the piece that makes fine-tuning a 7B model realistic. Instead of updating all the weights, you freeze the pre-trained model and train small low-rank adapter matrices injected between layers. `r=32` sets the rank, `lora_alpha=64` the scaling, `lora_dropout=0.1` guards against overfitting, and `target_modules="all-linear"` applies it to every linear layer.

The payoff shows up in the trainable-parameter count:

```
trainable params: 79,953,920 || all params: 6,818,500,608 || trainable%: 1.172602667310637
```

You are training about 1.17% of the model and leaving the rest frozen. That is the whole point of parameter-efficient fine-tuning: the original weights stay untouched and portable, you can keep several lightweight adapters for different tasks, and quality stays close to full fine-tuning.

## The M1 wall, then Vast.ai

My first run died immediately:

```
NameError: name 'torch' is not defined
...
self.bnb_4bit_compute_dtype = getattr(torch, bnb_4bit_compute_dtype)
```

After some digging: bitsandbytes did not support Apple M1. The 4-bit path simply is not there. You need a GPU with an x86 CPU alongside it, so I rented one on Vast.ai. Pick a GPU, pick a template, add your SSH key, go. Once on x86 with a real NVIDIA GPU, the shards downloaded and training started.

## Training

Hugging Face's `Trainer` is the workhorse of the Transformers library. Hand it a model and a dataset and it runs the training loop for you: forward and backward passes, CPU and multi-GPU handling, gradient accumulation, mixed precision, logging. You configure it through `TrainingArguments`.

```python
training_args = TrainingArguments(
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=64,
    warmup_steps=500,
    logging_dir='./logs',
    logging_steps=25,
    save_steps=100,
    eval_steps=100,
    log_level="info",
    max_steps=1000,
    evaluation_strategy="steps",
    save_strategy="steps",
    save_total_limit=2,
    load_best_model_at_end=True,
    metric_for_best_model="loss",
    learning_rate=1e-4,
    lr_scheduler_type="cosine",
    weight_decay=0.1,
    warmup_ratio=0.1,
    max_grad_norm=1.0,
    output_dir="./codelama-with-b53",
    gradient_accumulation_steps=4,
    gradient_checkpointing=True,
    resume_from_checkpoint=True
)
```

The ones worth understanding:

- `num_train_epochs=3`: three full passes over the data. More epochs can improve the model but raise the risk of overfitting; too few and it underfits.
- `metric_for_best_model="loss"`: the checkpoint with the lowest loss wins. Loss directly measures how far predictions are from the targets.
- `learning_rate=1e-4`: how much the weights move per update. Smaller is more stable but slower, larger is faster but risks overshooting.
- `lr_scheduler_type="cosine"`: the learning rate starts high and eases down along a cosine curve, which smooths convergence.
- `weight_decay=0.1`: L2 regularization that penalizes large weights and fights overfitting.
- `warmup_ratio=0.1`: for the first 10% of steps the learning rate ramps up from zero, which stabilizes the early, jumpy part of training.
- `max_grad_norm=1.0`: gradient clipping, so no single update blows the weights up.
- `gradient_accumulation_steps=4`: accumulate gradients over 4 steps before updating, which simulates a larger batch without the memory cost.
- `gradient_checkpointing=True`: the memory-for-compute trade again.

Then initialize the trainer and go:

```python
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train_data,
    eval_dataset=tokenized_test_data
)

trainer.train()
trainer.save_model()
```

Run it, wait about 21 hours, and out comes a checkpoint:

```
checkpoint-1000
  README.md
  adapter_config.json
  adapter_model.safetensors   (305M)
  optimizer.pt
  rng_state.pth
  scheduler.pt
  trainer_state.json
  training_args.bin
```

Note the size: the adapter is 305M, not a full copy of the 7B model. That is LoRA doing its job.

## The two errors worth documenting

### Running out of memory

My first serious attempt hit a wall on a single RTX 3060. 12GB of GPU RAM fills up fast, and the process crashes:

```
torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate 344.00 MiB.
GPU 0 has a total capacity of 11.76 GiB of which 11.44 MiB is free...
```

Your options are the obvious three: reduce the memory footprint, fine-tune a smaller model, or rent a bigger GPU. The cheapest lever is batch size:

```python
per_device_train_batch_size=16,
per_device_eval_batch_size=64,
```

Bigger batches process more examples in parallel and give more stable gradients, but memory usage climbs with them, and there is a known diminishing return on quality past a certain point. If you must go small, gradient accumulation lets you simulate a larger effective batch. As for estimating the memory cost of fine-tuning up front: honestly, it is a mess, and I got wildly different answers from the community. My pragmatic method was to start on a large GPU, note the real memory used, then step down to the smallest GPU that fits.

### You cannot fine-tune a purely quantized model

```
ValueError: You cannot perform fine-tuning on purely quantized models.
Please attach trainable adapters on top of the quantized model...
```

This is the constraint that ties the whole design together. Once the model is quantized to 4-bit, its parameters no longer carry enough precision to keep learning directly. The fix is exactly what LoRA is for: attach trainable adapters on top of the frozen, quantized model. The adapters act like plugins between the layers, so most of the original parameters stay frozen and only the small adapter matrices train. Quantize to fit in memory, then adapt with LoRA to train at all: the two are not separate tricks, they are the same solution.

## Where this lands

At this point Wingman is a CodeLlama-7B model, fine-tuned in 4-bit with LoRA on a private codebase, producing a 305M adapter you can load on top of the base model. The next step is serving it and wiring it into a VSCode extension so it completes code the way Copilot does, which is a whole piece on its own.

The real takeaway is not the specific hyperparameters. It is that a single engineer can take an open model, adapt it to a private codebase on rented hardware, and get usable code completion out of it, as long as you respect the memory constraints and understand why each trick (4-bit quantization, Flash Attention, gradient checkpointing, LoRA) exists. Every one of them is there to fit a large model onto hardware that has no business running it.

## Further reading

- [Feature Importance Mixing paper](https://arxiv.org/pdf/2210.03047.pdf)
- [Abstract Syntax Tree (Wikipedia)](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
- [4-bit quantization paper](https://arxiv.org/pdf/2009.06488.pdf)
- [Hugging Face: making LLMs more accessible with bitsandbytes, 4-bit quantization and QLoRA](https://huggingface.co/blog/4bit-transformers-bitsandbytes)
- [FSDP and PEFT paper](https://arxiv.org/pdf/2304.11277)
- [Single-precision floating-point format (Wikipedia)](https://en.wikipedia.org/wiki/Single-precision_floating-point_format)
