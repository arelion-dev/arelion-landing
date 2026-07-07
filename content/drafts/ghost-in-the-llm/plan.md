# Plan : Ghost in the LLM, fine-tuning Mistral-7B on my own text messages

- **Pilier** : Writing
- **Titre EN** : Ghost in the LLM: fine-tuning Mistral-7B on my own text messages
- **Titre FR** : Ghost in the LLM : fine-tuner Mistral-7B sur mes propres SMS
- **Hook** : que se passe-t-il quand on fine-tune Mistral-7B sur 70 000 de ses propres messages ? Se recréer en chatbot avec QLoRA, inspiré de l'épisode "Be Right Back" de Black Mirror. Notebooks et scripts de déploiement inclus.
- **Lecteurs** : CTO / ML curieux (walkthrough + coûts) / tout public (accroche Black Mirror + éthique)

## The problem
- L'épisode Black Mirror "Be Right Back" : une femme recrée son compagnon décédé en chatbot depuis ses vieux textos. Le "ça ne peut pas marcher pour de vrai, si ?".
- Ça marche. Avec n'importe qui avec qui tu as échangé assez de messages. Sans son consentement.
- Fine-tuné Mistral-7B sur mes données de conversation perso pour bâtir une IA qui réplique mon style : expressions dramatiques, langage familier, références absurdes.
- tl;dr : ~200 $ et 16h d'entraînement sur 70k SMS, et j'ai une IA qui sonne comme moi de façon dérangeante. Code sur GitHub (antonhansel/ghost-in-the-llm).

## What we built
- Une IA qui parle comme moi. Ce qui marche le mieux :
  - Garder simple : entraîner direct sur les données de conversation.
  - Deux locuteurs max : A (moi) et B (tous les autres), en JSONL propre.
  - Contexte glissant : 6 à 12 messages précédents.
  - QLoRA : quantization 4 bits, abordable pour un particulier.
  - Laisser multilingue : aucun traitement spécial pour mon code-switching FR/EN.
- Demo (input -> output) : contexte de conversation -> le modèle complète le prochain message "moi" avec mon ton (ex : "this is my vietnam" pour le moindre désagrément, tendance à trop parler crypto).

## How it works (grounded)
- Modèle de base : `mistralai/Mistral-7B-v0.3` (sweet spot perf/coût, gère le multilingue nativement).
- Fine-tuning : QLoRA, quantization 4 bits. LoRA config r=16, alpha=32, dropout=0.05, cible = toutes les couches linéaires importantes.
- Data : formater les conversations pour prédire mon prochain message. Contexte 6 à 12 messages, target = les réponses "A:", next-token prediction, speaker labels A: (moi) / B: (les autres). Flag important : `train_on_inputs: true`.
- Training : séquences 1024 tokens, learning rate 5e-5 cosine, 8 epochs, ~7,8 GiB VRAM. Loss de 3,4 à 0,9, convergence stable, ~2 180 tokens/sec, 16h sur un H100 PCIe (Lambda Labs).
- Post-training : les LoRA adapters doivent être fusionnés avec le modèle de base (`merge_lora_fp16.py`, ~14 Go FP16). Déploiement : Hugging Face Hub, Replicate (cold starts en quelques minutes, ~3s par réponse), ou local.

## The hard part
- Format de données = 90% du travail : nettoyer et formater les conversations en deux locuteurs + contexte glissant + JSONL propre.
- Le modèle ne s'arrête parfois pas : il génère plusieurs tours au lieu de s'arrêter après ma réponse (les données d'entraînement contiennent des flux complets). Pas de fix évident, patché avec post-processing + stop markers. Imparfait mais suffisant.
- Le modèle mémorise plus que le style : des détails privés ont refait surface tout seuls, que j'étais surpris qu'il ait appris.

## Result
- Coûts : ~48 $ pour le run final (16h H100), ~150 $ d'expérimentation (essais ratés, tuning, clonage d'autres personnes), ~200 $ total.
- Modèle mergé ~14 Go, inférence < 4s par réponse sur A100.
- Le ghost capture les expressions dramatiques, le ton familier, les références aléatoires. Impressionnant et légèrement dérangeant.

## Reusable
- La recette se réutilise sur n'importe qui avec qui on a assez échangé (target dans `config/user_config.json`).
- Le référentiel va de l'export brut de messages (WhatsApp, Telegram) à une IA fonctionnelle : notebooks de parsing/préparation, scripts merge/test/sanity, déploiement Replicate, configs.

## Stack
- Python, Mistral-7B, QLoRA, Axolotl, Hugging Face, Replicate, Lambda Labs, Jupyter

## Angles LinkedIn (1 post par angle)
1. **[accroche Black Mirror]** J'ai fine-tuné Mistral-7B sur 70 000 de mes messages : une IA qui parle comme moi, 200 $ et 16h. Constat qui refroidit : elle a ressorti des infos privées oubliées. J'ai renoncé à l'ouvrir. Pouvoir faire une chose ne veut pas dire qu'on devrait.
2. **[ce que le fine-tuning apprend vraiment]** Le petit modèle bien entraîné bat le gros générique sur une tâche précise ; la donnée compte plus que l'archi (90% = nettoyer/formater) ; QLoRA rend ça accessible ; et un modèle mémorise plus que le style.
3. **[how-to QLoRA concret]** Fine-tuner un LLM sur ses propres données coûte moins cher qu'une thérapie : les vrais chiffres (Mistral-7B-v0.3, QLoRA 4 bits r=16/alpha=32, 70k SMS, 8 epochs, loss 3,4 -> 0,9, ~200 $, code sur GitHub).

## À confirmer par toi
- N/A : aucun `[à confirmer]` dans l'article (projet perso publié, chiffres réels déjà chiffrés).
- Article déjà public sur GitHub sous ton nom (antonhansel) : on assume l'attribution nominative, rien à anonymiser.
