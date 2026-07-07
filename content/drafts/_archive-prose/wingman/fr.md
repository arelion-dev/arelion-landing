---
title: "Wingman : construire mon propre GitHub Copilot à partir de zéro"
description: "Pourquoi j'ai construit mon alternative à GitHub Copilot, fine-tunée sur une base de code privée. Plongée dans la complétion de code par LLM : choix du modèle, quantization, LoRA, le mur du GPU, et ce qui a vraiment cassé en chemin."
date: 2026-07-06
tags: ["ai", "llm", "fine-tuning", "code-completion", "writing"]
pillar: "Writing"
stack: ["Python", "PyTorch", "CUDA", "CodeLlama-7B", "Hugging Face Transformers", "PEFT", "LoRA", "bitsandbytes", "Flash Attention 2", "Vast.ai"]
lang: "fr"
---

Si vous n'avez jamais entendu parler des assistants de code à base de LLM comme GitHub Copilot, bienvenue de retour parmi nous. Copilot, à l'origine propulsé par Codex d'OpenAI (un descendant de GPT-3 entraîné sur un immense corpus de dépôts publics), est un outil de complétion de code qui vit dans votre IDE. Il est contextuel : il lit le code autour, les commentaires, la structure du projet, puis propose de la simple ligne à la fonction entière.

Je voulais savoir ce qu'il faut pour construire ça soi-même, et le pointer vers une base de code privée plutôt que vers l'internet public. Le résultat s'appelle Wingman. Voici le plan :

- Choisir un modèle conçu pour la suggestion de code.
- Le fine-tuner sur une base de code d'entreprise privée.
- Déployer le modèle fine-tuné sur un serveur d'inférence.
- L'utiliser dans une extension VSCode, comme on utilise Copilot.

Détail amusant : tous les commentaires de code que vous verrez dans cette expérience ont été écrits par le modèle fine-tuné lui-même. Wingman commentant son propre code d'entraînement.

## Le modèle : CodeLlama-7B-Instruct, PyTorch et CUDA

J'ai travaillé avec `codellama/CodeLlama-7b-Instruct-hf`, membre de la famille CodeLlama pensée pour les tâches de code. Il repose sur l'architecture LLaMA (Large Language Model Meta AI) et compte 7 milliards de paramètres, l'une des plus petites variantes de la famille (les autres font 13B et 34B). La variante « Instruct » est ajustée pour suivre des instructions, ce qui la rend adaptée à la génération et à la complétion de code.

Il a été entraîné sur un large mélange de code open source dans de nombreux langages, plus beaucoup de texte en langage naturel, si bien qu'il sait à la fois écrire du code et en parler. Pour mettre en perspective le coût de ces objets : Meta rapporte que l'entraînement des neuf modèles Code Llama a demandé 400K heures GPU sur du matériel A100-80GB, pour des émissions estimées à 65,3 tCO2eq, compensées via leur programme de durabilité.

Pour l'entraînement, j'ai utilisé PyTorch (la bibliothèque de deep learning du labo de recherche IA de Facebook) et CUDA (la plateforme de calcul parallèle de NVIDIA qui permet d'exécuter du travail généraliste sur GPU).

## Construire le jeu de données

L'étape du dataset est simple : donner toute la base de code au modèle. J'ai parcouru le dépôt, retiré les fichiers de build, de configuration et système, et envoyé le reste vers le service de datasets de Hugging Face.

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

## Préparer les données pour l'entraînement

Le dataset étant sur le Hub, la suite consiste à le charger, le tokeniser et préparer les labels.

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

Quelques points méritent qu'on s'y arrête. `set_seed(seed)` rend l'exécution reproductible, pour que l'aléatoire retombe toujours de la même façon. `AutoTokenizer.from_pretrained` charge le tokenizer qui transforme le texte en tokens compréhensibles par le modèle. Je découpe en 90/10 (train/test) (`test_size=0.1`, avec seed et mélange), et je plafonne les séquences à 510 tokens.

Les labels sont le point intéressant. Pour un modèle de langage causal, on l'entraîne à prédire le token suivant : les labels sont donc les input IDs décalés d'un cran vers la gauche, avec la dernière position mise à `-100`, l'index d'ignorance que la fonction de perte saute : `labels = [row[1:] + [-100] for row in tokenized_inputs["input_ids"]]`. Se tromper ici, c'est déclencher plus tard l'erreur « model did not return a loss ». Enfin, j'applique la fonction sur les deux splits par batch et je retire les colonnes d'origine pour ne pas faire râler le trainer.

### Aparté : combien de caractères dans un token ?

Un token est une unité de traitement du texte. Ce n'est pas un mot : ça peut être une partie de mot, deux mots, de la ponctuation ou des espaces. On peut mesurer la moyenne de caractères par token ainsi :

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

Pourquoi s'en soucier ? Deux raisons. D'abord, les modèles ont une fenêtre de contexte fixe mesurée en tokens (512, 1024, plus). Connaître les caractères par token indique à peu près combien de texte réel entre dans cette fenêtre, donc comment budgéter ses entrées. Ensuite, les tokens pilotent la mémoire et le calcul : le modèle traite token par token, donc plus de tokens veut dire plus de charge. Un ratio caractères-par-token faible suggère aussi que le tokenizer découpe finement.

### Aparté : pourquoi des entrées de longueur fixe

Les LLM veulent des entrées de longueur fixe, surtout à cause de l'architecture Transformer. Les couches attendent une longueur de contenu fixe pour les multiplications matricielles, les batchs de taille fixe se calculent plus efficacement, et l'attention compare chaque token à tous les autres, ce qui est plus propre à longueur constante.

Ce n'est pas universel. Les RNN sont conçus pour gérer des séquences de longueur variable, un token à la fois : c'est donc un choix d'architecture, pas une loi. Et si on ne peut pas produire des entrées de longueur fixe, on pad : on ajoute des tokens factices pour égaliser les longueurs, puis on fournit au modèle un masque d'attention qui dit quels tokens sont réels et lesquels sont du padding à ignorer.

### Un mot sur FIM (Feature Importance Mixing)

FIM revenait sans cesse dans mes lectures. C'est une technique d'augmentation de données : accroître la diversité des données d'entraînement sans en collecter de nouvelles, ce qui compte beaucoup quand le dataset est une seule base de code, relativement petite. On perturbe légèrement les exemples pour que le modèle généralise au lieu de mémoriser des motifs précis.

Le piège est de choisir quels tokens on peut modifier sans risque. Sur une base de code JavaScript/TypeScript, renommer des variables, fonctions, littéraux ou opérateurs peut vite produire du code qui ne parse plus. JavaScript n'a pas de paramètres nommés, donc on ne peut pas non plus mélanger les arguments, sauf avec un objet spread. La manière propre serait de parser en AST, définir des permutations sûres sur l'arbre, puis re-sérialiser vers du code. Hors sujet ici, mais un bon projet pour plus tard.

## Charger et préparer le modèle

Passons au modèle lui-même, avec les optimisations qui rendent un modèle 7B entraînable sur du matériel modeste.

### Étape 1 : charger en précision 4 bits

```python
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="fp4",
    bnb_4bit_compute_dtype="bfloat16",
    bnb_4bit_use_double_quant=False,
)
```

Ceci quantize le modèle en 4 bits. `load_in_4bit=True` le charge en précision 4 bits, `bnb_4bit_quant_type="fp4"` choisit le format FP4, `bnb_4bit_compute_dtype="bfloat16"` fait les calculs réels en 16 bits, et je saute la double quantization pour rester simple.

Le compromis est évident : on perd en précision et en dynamique. En gros :

- 32 bits : environ 7 chiffres de précision
- 16 bits : 3 à 4 chiffres décimaux
- 8 bits : environ 3 chiffres décimaux
- 4 bits : moins de 3 chiffres décimaux

Si vous vous souvenez de votre CS101, un float 32 bits, c'est 1 bit de signe, 8 bits d'exposant et 23 bits de mantisse. Descendre à 4 bits est agressif, mais c'est ce qui fait tenir le modèle en mémoire tout court.

### Étape 2 : charger le modèle pré-entraîné avec quantization

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

`AutoModelForCausalLM` nous donne un transformer adapté au langage causal. Il applique la config 4 bits, et le paramètre qui compte vraiment ici est `attn_implementation="flash_attention_2"` : un noyau d'attention fusionné qui réduit la pression mémoire, ce qui est exactement le combat sur un petit GPU.

### Étape 3 : préparer l'entraînement k-bit avec gradient checkpointing

```python
model = prepare_model_for_kbit_training(
    model,
    use_gradient_checkpointing=True,
    gradient_checkpointing_kwargs={"use_reentrant": True}
)
```

Le gradient checkpointing échange du calcul contre de la mémoire : au lieu de stocker chaque activation intermédiaire pour la passe arrière, il les recalcule à la volée. On paie en temps CPU/GPU et on récupère de la mémoire, l'échange qu'on veut quand la mémoire est le goulot.

### Étape 4 : LoRA (Low-Rank Adaptation)

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

LoRA est la pièce qui rend réaliste le fine-tuning d'un modèle 7B. Plutôt que de mettre à jour tous les poids, on gèle le modèle pré-entraîné et on entraîne de petites matrices d'adaptation de faible rang, injectées entre les couches. `r=32` fixe le rang, `lora_alpha=64` le facteur d'échelle, `lora_dropout=0.1` prévient le surapprentissage, et `target_modules="all-linear"` l'applique à toutes les couches linéaires.

Le gain se voit dans le décompte des paramètres entraînables :

```
trainable params: 79,953,920 || all params: 6,818,500,608 || trainable%: 1.172602667310637
```

On entraîne environ 1,17 % du modèle et on laisse le reste gelé. C'est tout l'intérêt du fine-tuning à paramètres efficaces : les poids d'origine restent intacts et portables, on peut garder plusieurs adaptateurs légers pour différentes tâches, et la qualité reste proche d'un fine-tuning complet.

## Le mur du M1, puis Vast.ai

Ma première exécution est morte tout de suite :

```
NameError: name 'torch' is not defined
...
self.bnb_4bit_compute_dtype = getattr(torch, bnb_4bit_compute_dtype)
```

Après quelques recherches : bitsandbytes ne supportait pas l'Apple M1. Le chemin 4 bits n'existe tout simplement pas. Il faut un GPU avec un CPU x86 à côté, alors j'en ai loué un sur Vast.ai. On choisit un GPU, un template, on ajoute sa clé SSH, c'est parti. Une fois sur x86 avec un vrai GPU NVIDIA, les shards se sont téléchargés et l'entraînement a démarré.

## Entraînement

Le `Trainer` de Hugging Face est la bête de somme de la bibliothèque Transformers. On lui donne un modèle et un dataset, il gère la boucle d'entraînement : passes avant et arrière, CPU et multi-GPU, accumulation de gradient, précision mixte, logging. On le configure via `TrainingArguments`.

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

Ceux qui méritent d'être compris :

- `num_train_epochs=3` : trois passes complètes sur les données. Plus d'epochs peut améliorer le modèle mais augmente le risque de surapprentissage ; trop peu et il sous-apprend.
- `metric_for_best_model="loss"` : le checkpoint avec la perte la plus basse gagne. La perte mesure directement l'écart entre prédictions et cibles.
- `learning_rate=1e-4` : de combien les poids bougent à chaque mise à jour. Plus petit, c'est plus stable mais plus lent ; plus grand, c'est plus rapide mais risque de dépasser l'optimum.
- `lr_scheduler_type="cosine"` : le taux d'apprentissage part haut et redescend le long d'une courbe cosinus, ce qui lisse la convergence.
- `weight_decay=0.1` : régularisation L2 qui pénalise les grands poids et combat le surapprentissage.
- `warmup_ratio=0.1` : sur les 10 % premiers pas, le taux d'apprentissage monte depuis zéro, ce qui stabilise le début, souvent instable.
- `max_grad_norm=1.0` : clipping du gradient, pour qu'aucune mise à jour ne fasse exploser les poids.
- `gradient_accumulation_steps=4` : accumuler les gradients sur 4 pas avant de mettre à jour, ce qui simule un batch plus grand sans le coût mémoire.
- `gradient_checkpointing=True` : encore l'échange mémoire contre calcul.

Ensuite on initialise le trainer et on lance :

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

On lance, on attend environ 21 heures, et il en sort un checkpoint :

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

Notez la taille : l'adaptateur fait 305M, pas une copie complète du modèle 7B. C'est LoRA qui fait son travail.

## Les deux erreurs qui valent d'être documentées

### Manquer de mémoire

Ma première vraie tentative a heurté un mur sur une seule RTX 3060. 12 Go de RAM GPU se remplissent vite, et le process crashe :

```
torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate 344.00 MiB.
GPU 0 has a total capacity of 11.76 GiB of which 11.44 MiB is free...
```

Les options sont les trois évidentes : réduire l'empreinte mémoire, fine-tuner un modèle plus petit, ou louer un GPU plus gros. Le levier le moins cher, c'est la taille de batch :

```python
per_device_train_batch_size=16,
per_device_eval_batch_size=64,
```

Des batchs plus gros traitent plus d'exemples en parallèle et donnent des gradients plus stables, mais la mémoire grimpe avec eux, et il existe un rendement décroissant connu sur la qualité au-delà d'un certain point. S'il faut réduire, l'accumulation de gradient permet de simuler un batch effectif plus grand. Quant à estimer le coût mémoire du fine-tuning à l'avance : honnêtement, c'est le bazar, et j'ai eu des réponses très différentes de la communauté. Ma méthode pragmatique : démarrer sur un gros GPU, noter la mémoire réellement utilisée, puis descendre au plus petit GPU qui tient.

### On ne fine-tune pas un modèle purement quantizé

```
ValueError: You cannot perform fine-tuning on purely quantized models.
Please attach trainable adapters on top of the quantized model...
```

C'est la contrainte qui relie tout le design. Une fois le modèle quantizé en 4 bits, ses paramètres n'ont plus assez de précision pour continuer d'apprendre directement. Le remède est exactement ce à quoi sert LoRA : attacher des adaptateurs entraînables au-dessus du modèle gelé et quantizé. Les adaptateurs agissent comme des plugins entre les couches, si bien que la plupart des paramètres d'origine restent gelés et que seules les petites matrices d'adaptation s'entraînent. Quantizer pour tenir en mémoire, puis adapter avec LoRA pour pouvoir entraîner tout court : ce ne sont pas deux astuces séparées, c'est la même solution.

## Où ça atterrit

À ce stade, Wingman est un modèle CodeLlama-7B, fine-tuné en 4 bits avec LoRA sur une base de code privée, produisant un adaptateur de 305M qu'on charge par-dessus le modèle de base. L'étape suivante est de le servir et de le brancher dans une extension VSCode pour qu'il complète le code comme Copilot, ce qui est un sujet à part entière.

Le vrai enseignement n'est pas les hyperparamètres précis. C'est qu'un seul ingénieur peut prendre un modèle ouvert, l'adapter à une base de code privée sur du matériel loué, et en tirer de la complétion de code utilisable, à condition de respecter les contraintes de mémoire et de comprendre pourquoi chaque astuce (quantization 4 bits, Flash Attention, gradient checkpointing, LoRA) existe. Chacune est là pour faire tenir un gros modèle sur du matériel qui n'a rien à faire de l'exécuter.

## Pour aller plus loin

- [Article Feature Importance Mixing](https://arxiv.org/pdf/2210.03047.pdf)
- [Abstract Syntax Tree (Wikipedia)](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
- [Article sur la quantization 4 bits](https://arxiv.org/pdf/2009.06488.pdf)
- [Hugging Face : rendre les LLM plus accessibles avec bitsandbytes, quantization 4 bits et QLoRA](https://huggingface.co/blog/4bit-transformers-bitsandbytes)
- [Article FSDP et PEFT](https://arxiv.org/pdf/2304.11277)
- [Format flottant simple précision (Wikipedia)](https://en.wikipedia.org/wiki/Single-precision_floating-point_format)
