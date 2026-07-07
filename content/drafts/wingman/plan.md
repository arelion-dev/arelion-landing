# Plan : Wingman, building my own GitHub Copilot from scratch

- **Pilier** : Writing
- **Titre EN** : Wingman: building my own GitHub Copilot from scratch
- **Titre FR** : Wingman : reconstruire mon propre GitHub Copilot à partir de zéro
- **Hook** : pourquoi j'ai bâti mon alternative à GitHub Copilot, fine-tunée sur une base de code privée. Plongée dans la complétion de code par LLM : choix du modèle, quantization, LoRA, le mur GPU, et ce qui a vraiment cassé.
- **Lecteurs** : CTO / ML curieux (walkthrough + contraintes mémoire) / dirigeant (build vs buy + confidentialité)

## The problem
- Copilot (à l'origine sur Codex, descendant de GPT-3 entraîné sur des repos publics) = complétion de code dans l'IDE, context-aware.
- Objectif : savoir ce qu'il faut pour le construire soi-même, et le pointer sur une base de code privée au lieu du web public. Résultat = Wingman.
- Plan en 4 lignes : prendre un modèle fait pour le code, le fine-tuner sur la codebase privée d'une entreprise, le déployer sur un serveur d'inférence, le brancher dans une extension VSCode comme Copilot.
- Détail : tous les commentaires de code du script d'entraînement ont été écrits par le modèle en cours d'entraînement (Wingman se commente lui-même).

## What we built
- Un CodeLlama-7B fine-tuné en 4 bits avec LoRA sur une base de code privée, produisant un adaptateur de 305M chargeable sur le modèle de base.
- Demo (input -> output) : contexte de code du repo privé -> complétion (ligne à fonction entière) dans le style et avec les utilitaires internes de la codebase.

## How it works (grounded)
- Modèle : `codellama/CodeLlama-7b-Instruct-hf` (archi LLaMA, 7B, variante Instruct pour l'instruction-following). Entraînement en PyTorch + CUDA.
- Dataset : parcourir le repo, drop des fichiers build/config/système, push le reste vers Hugging Face datasets. 90/10 train/test (seedé, shuffle), séquences cappées à 510 tokens. Labels = input IDs décalés d'un cran vers la gauche, dernière position à `-100` (ignore index). Se tromper = erreur "model did not return a loss".
- Charger le modèle avec quantization 4 bits (`BitsAndBytesConfig` : `load_in_4bit=True`, `bnb_4bit_quant_type="fp4"`, compute en bfloat16). Tradeoff = perte de précision (4 bits < 3 chiffres décimaux) mais ça fait tenir le modèle en mémoire.
- `attn_implementation="flash_attention_2"` : kernel d'attention fusionné qui réduit la pression mémoire.
- Gradient checkpointing (`prepare_model_for_kbit_training`, `use_gradient_checkpointing=True`) : échange du calcul contre de la mémoire, recalcule les activations à la volée.
- LoRA (`LoraConfig` : r=32, alpha=64, dropout=0.1, `target_modules="all-linear"`) : gèle le modèle, entraîne de petites matrices low-rank. Résultat = 79 953 920 params entraînables sur 6 818 500 608, soit ~1,17% du modèle.
- Training via `Trainer` + `TrainingArguments` (3 epochs, batch 16, lr 1e-4 cosine, weight_decay 0.1, warmup_ratio 0.1, max_grad_norm 1.0, gradient_accumulation_steps 4, gradient_checkpointing). ~21h -> checkpoint avec un adaptateur de 305M (pas une copie du 7B).
- Note FIM (data augmentation) et fixed-length inputs / padding + attention mask : abordés comme side notes (FIM propre = passer par un AST, hors scope ici).

## The hard part
- Le mur M1 : premier run mort immédiatement (`NameError: name 'torch' is not defined`), car bitsandbytes ne supporte pas Apple M1, le chemin 4 bits n'y est pas. Il faut un GPU avec CPU x86 -> loué sur Vast.ai.
- Out of memory : première vraie tentative crashée sur une RTX 3060 (12 Go). Leviers = réduire le footprint mémoire, fine-tuner un modèle plus petit, ou louer un plus gros GPU. Levier le moins cher = batch size ; gradient accumulation simule un batch plus large. Méthode pragmatique : démarrer sur un gros GPU, noter la mémoire réelle, redescendre au plus petit GPU qui tient.
- On ne peut pas fine-tuner un modèle purement quantizé (`ValueError`) : une fois en 4 bits, les params n'ont plus assez de précision pour apprendre. Le fix EST LoRA : attacher des adaptateurs entraînables sur le modèle gelé et quantizé. Quantizer pour tenir en mémoire, adapter avec LoRA pour pouvoir entraîner = les deux faces de la même solution.

## Result
- Wingman = CodeLlama-7B fine-tuné en 4 bits + LoRA sur une base de code privée, adaptateur de 305M chargeable sur le modèle de base.
- Étape suivante (un article à part) : servir le modèle et le câbler dans une extension VSCode pour compléter comme Copilot.
- Le vrai takeaway : un seul ingénieur peut adapter un modèle ouvert à une codebase privée sur du matériel loué et en sortir de la complétion utilisable, tant qu'il respecte les contraintes mémoire et comprend pourquoi chaque astuce (4 bits, Flash Attention, gradient checkpointing, LoRA) existe. Toutes servent à faire tenir un gros modèle sur du matériel qui n'a rien à faire de l'exécuter.

## Reusable
- Le pattern : prendre un modèle de code ouvert, le fine-tuner sur une base privée, empiler les 4 astuces mémoire, et déployer. Applicable à toute équipe qui veut de la complétion sur son propre code, en privé.

## Stack
- Python, PyTorch, CUDA, CodeLlama-7B, Hugging Face Transformers, PEFT, LoRA, bitsandbytes, Flash Attention 2, Vast.ai

## Angles LinkedIn (1 post par angle)
1. **[j'ai reconstruit Copilot from scratch]** Pas un wrapper d'API : un vrai modèle fine-tuné sur une base de code privée, sur GPU loué. Le plus utile n'est pas dans les hyperparamètres, c'est qu'un seul ingénieur peut le faire aujourd'hui. La partie dure = la mémoire GPU, toujours.
2. **[l'architecture d'un assistant de code]** Faire tenir un 7B sur un GPU qui n'a rien à faire de l'exécuter = 4 astuces, une seule contrainte (la mémoire) : quantization 4 bits, Flash Attention 2, gradient checkpointing, LoRA (1,17% du modèle entraînable, adaptateur 305 Mo). Piège qui relie tout : on ne fine-tune pas un modèle purement quantizé.
3. **[build vs buy]** Copilot coûte quelques euros/dev/mois, alors pourquoi reconstruire ? Une seule vraie raison : le code ne sort pas. Mais le build se paie (M1 KO, OOM sur RTX 3060, 21h de GPU loué). La vraie question n'est jamais build ou buy dans l'absolu : la confidentialité justifie-t-elle ce coût ?

## À confirmer par toi
- N/A : aucun `[à confirmer]` dans l'article (walkthrough perso, chiffres et erreurs réels documentés).
- "a private company codebase" reste générique dans l'article : on garde tel quel, rien à anonymiser de plus.
