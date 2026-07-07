---
title: "Wingman: LinkedIn posts (FR)"
lang: "fr"
count: 3
---

## Post 1 : "J'ai reconstruit Copilot from scratch"

J'ai reconstruit GitHub Copilot à partir de zéro.

Pas un wrapper autour d'une API.

Un vrai modèle, fine-tuné sur une base de code privée, entraîné sur GPU loué.

Le plan tenait en quatre lignes :

Prendre un modèle fait pour le code (CodeLlama-7B-Instruct).
Le fine-tuner sur la codebase d'une entreprise.
Le déployer sur un serveur d'inférence.
Le brancher dans une extension VSCode.

Ce que j'ai appris de plus utile n'est pas dans les hyperparamètres.

C'est qu'un seul ingénieur peut aujourd'hui adapter un modèle ouvert à un code privé, sur du matériel loué à l'heure, et en sortir de la complétion vraiment utilisable.

Détail que j'aime bien : tous les commentaires de code de mon script d'entraînement ont été écrits par le modèle que j'étais en train d'entraîner.

Il se commentait lui-même.

La partie difficile n'a pas été le machine learning.

Ça a été la mémoire GPU. Toujours la mémoire.

Vous préféreriez faire tourner un assistant de code sur votre propre codebase, en privé, plutôt que d'envoyer votre code à un tiers ?

## Post 2 : l'architecture d'un assistant de code

Comment on fait tenir un modèle de 7 milliards de paramètres sur un GPU qui n'a rien à faire de l'exécuter ?

En empilant quatre astuces, et chacune répond à la même contrainte : la mémoire.

Quantization 4 bits.
On passe les poids de 32 bits à 4 bits. On perd en précision, on gagne la possibilité de charger le modèle tout court.

Flash Attention 2.
Un noyau d'attention fusionné qui réduit la pression mémoire pendant les calculs.

Gradient checkpointing.
On arrête de stocker chaque activation, on les recalcule à la volée. On échange du calcul contre de la mémoire.

LoRA.
On gèle le modèle d'origine, on n'entraîne que de petites matrices ajoutées entre les couches.

Résultat concret sur mon run : 79 millions de paramètres entraînables sur 6,8 milliards.

1,17 % du modèle.

Le reste reste gelé, et l'adaptateur final pèse 305 Mo au lieu de plusieurs Go.

Le piège qui relie tout : on ne peut pas fine-tuner un modèle purement quantizé. Il faut lui attacher des adaptateurs LoRA. Quantizer pour tenir en mémoire, adapter avec LoRA pour pouvoir entraîner. Deux faces de la même solution.

Quelle contrainte pilote vos choix d'archi en ce moment : la mémoire, la latence, ou le coût ?

## Post 3 : build vs buy

Copilot coûte quelques euros par dev et par mois.

Alors pourquoi reconstruire le sien ?

Une seule raison sérieuse : le code ne sort pas.

Un assistant fine-tuné sur votre base de code reste sur votre infra, apprend vos conventions, vos utilitaires internes, vos patterns maison. Rien ne part chez un tiers.

Mais soyons honnêtes sur le coût réel du "build".

Mon premier run est mort sur un Mac M1 : bitsandbytes ne supporte pas la puce. Il faut un GPU x86.

Le deuxième est mort en Out Of Memory sur une RTX 3060 de 12 Go.

Le troisième a tourné 21 heures sur un GPU loué avant de produire un adaptateur exploitable.

Le build n'est pas gratuit. Il se paie en heures de debug et en factures GPU.

Donc la vraie question n'est jamais "build ou buy" dans l'absolu.

C'est : est-ce que la confidentialité de votre code, ou l'adaptation à votre codebase, justifie ce coût ?

Pour la plupart des équipes, non. Pour certaines, c'est non négociable.

Vous, votre code partirait chez un tiers sans problème, ou c'est une ligne rouge ?
