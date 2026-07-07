---
title: "Ghost in the LLM : fine-tuner Mistral-7B sur mes propres SMS"
description: "Que se passe-t-il quand on fine-tune Mistral-7B sur 70 000 de ses propres messages ? Un walkthrough pratique pour se recréer en chatbot avec QLoRA, inspiré de l'épisode 'Bientôt de retour' de Black Mirror. Notebooks et scripts de déploiement inclus."
date: 2026-07-06
tags: ["ai", "llm", "fine-tuning", "qlora", "mistral", "privacy"]
pillar: "Writing"
stack: ["Python", "Mistral-7B", "QLoRA", "Axolotl", "Hugging Face", "Replicate", "Lambda Labs", "Jupyter"]
lang: "fr"
---

Vous vous souvenez de cet épisode glaçant de Black Mirror, "Bientôt de retour", où une femme utilise un service d'IA qui aspire d'anciens SMS, emails et posts sur les réseaux pour reconstruire une version chatbot de son compagnon décédé ? Celui qui vous a fait penser : "c'est impossible que ça marche vraiment, non ?"

En fait, on peut le faire aussi. Avec n'importe qui avec qui on a échangé assez de messages. Sans son consentement. Bienvenue en 2025.

J'ai fine-tuné Mistral-7B sur mes propres conversations pour construire une IA qui reproduit mon style de communication. Le résultat est un fantôme numérique étonnamment convaincant qui parle comme moi : les expressions dramatiques, le langage familier, les références bien à moi.

**tl;dr** : j'ai dépensé environ 200 $ et 16 heures pour entraîner un modèle sur 70k SMS, et j'ai maintenant une IA qui me ressemble de façon dérangeante.

Tout le [code est sur GitHub](https://github.com/antonhansel/ghost-in-the-llm) si vous voulez essayer vous-même.

Note : tous les exemples de conversation ci-dessous ont été traduits du français.

Voici ce qui marche le mieux, d'après mon expérience :

- **Restez simple.** Entraînez directement sur les données de conversation, sans sur-ingénierie.
- **Deux locuteurs max.** A (moi) et B (tous les autres), dans un format JSONL propre.
- **Contexte glissant.** Utilisez 6 à 12 messages précédents pour donner au modèle un contexte suffisant.
- **QLoRA.** La quantization en 4 bits rend tout ça accessible pour le commun des mortels.
- **Laissez-le multilingue.** Aucun traitement spécial nécessaire pour mon code-switching français/anglais.

J'ai aussi tenté de cloner quelqu'un d'autre avec qui j'avais beaucoup échangé, et ça marche étonnamment bien.

## Choisir le bon modèle : pourquoi Mistral-7B ?

J'ai choisi Mistral-7B comme modèle de base pour deux raisons. D'abord, il est assez puissant pour comprendre le contexte et générer des réponses cohérentes, mais pas au point de rendre le fine-tuning prohibitif. Ensuite, il gère nativement le contenu multilingue, sans préprocessing particulier de ma part.

**Le setup :**

- **Modèle de base** : `mistralai/Mistral-7B-v0.3` (le bon compromis performance/coût)
- **Fine-tuning** : QLoRA en quantization 4 bits (parce que je ne roule pas sur l'or)
- **Config LoRA** : r=16, alpha=32, dropout=0.05 (après pas mal d'essais)
- **Cible** : toutes les couches linéaires importantes du modèle

**Détails d'entraînement :**

- **Longueur de séquence** : 1024 tokens (assez de contexte sans se ruiner)
- **Learning rate** : 5e-5 avec scheduling cosine
- **Epochs** : 8 (le bon nombre pour la convergence, au final)
- **Mémoire** : environ 7,8 GiB de VRAM (gérable sur des GPU cloud)
- **Le flag important** : `train_on_inputs: true` (crucial pour apprendre les patterns de conversation)

## Les données : préparer mon ADN numérique

Le plus délicat était de trouver comment formater mes conversations pour l'entraînement. Il me fallait quelque chose qui apprenne au modèle à prédire ce que je dirais ensuite, à partir du contexte des messages précédents.

Voici ce que j'ai retenu :

```jsonl
{
  "text": "A: So first you can edit messages on telegram So correction messages with an asterisk there you go\nB: Are you giving me lessons? The guy with a hoodie photo? :p Ok ok it's new\nA: You look like a boomer using telegram\nB: I have trouble with my phone\nA: With your GSM 😂\nB: On my cellphone yes xD Coming from a thirty-something it's offensive\nA: Wowowow No insults Thirty-something calm down I'm two years older than you, when is your birthday?"
}
```

**La formule :**

- **Fenêtre de contexte** : 6 à 12 messages précédents (assez de contexte, pas trop de bruit)
- **Cible** : le prochain message que j'écrirais (les réponses A:)
- **Type d'entraînement** : next-token prediction (le modèle apprend à compléter mes pensées)
- **Labels de locuteur** : A: (moi) et B: (tous les autres), simple mais efficace

## L'entraînement : 16 heures d'introspection numérique

Après avoir tout configuré et pas mal tâtonné sur les réglages d'Axolotl, j'ai lancé l'entraînement sur un GPU cloud loué chez Lambda Labs.

- **Loss** : partie à 3,4, descendue à 0,9 (convergence stable)
- **Temps d'entraînement** : 16 heures sur un H100 PCIe
- **Coût** : environ 48 $ pour l'entraînement final, environ 200 $ au total avec toutes mes autres expériences
- **Mémoire** : environ 7,8 GiB de VRAM, environ 2 180 tokens par seconde
- **Qualité** : convergence lisse, pas d'overfitting ni d'explosion de gradient

J'ai aussi tenté de basculer le ton cible du modèle vers d'autres personnes avec qui je parle. Ça a fait monter le creepy-o-mètre à un niveau où je n'étais pas à l'aise, mais ça marche très bien si l'envie vous prend.

## La boîte à outils : tout pour construire votre propre fantôme

J'ai tout mis à disposition sur GitHub pour que vous puissiez essayer. Le dépôt vous emmène des exports bruts de messages jusqu'à une IA fonctionnelle qui parle comme vous :

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

## Le processus : des messages bruts au fantôme numérique

Tout le processus est découpé en étapes gérables. J'ai construit des notebooks Jupyter qui vous guident à chaque étape, du parsing des données à la config d'entraînement, le tout disponible sur [GitHub](https://github.com/antonhansel/ghost-in-the-llm).

Pour tenter de cloner quelqu'un d'autre, changez la cible dans `config/user_config.json`.

J'ai pré-configuré tous les paramètres qui ont fonctionné pour moi dans `config/training_config.yaml` :

- Réglages QLoRA (r=16, alpha=32, dropout=0.05), le bon compromis que j'ai trouvé
- Hyperparamètres d'entraînement (learning rate, batch size, epochs)
- Réglages d'architecture du modèle
- Optimisation matérielle pour l'entraînement cloud

À moins d'avoir un GPU monstrueux qui traîne (ce n'est pas mon cas), il vous faudra louer du compute cloud. J'ai utilisé Lambda Labs (cloud.lambda.ai), fiable et à prix raisonnable, pour attraper un H100 PCIe ou un A100 40GB entre 2 et 5 $ de l'heure.

### Le coût

- **Entraînement final** : environ 48 $ (16 heures sur H100)
- **Expérimentation** : environ 150 $ (essais ratés, tuning des paramètres, clonage d'autres personnes)
- **Total** : environ 200 $ (moins cher qu'une thérapie)

Le coût d'expérimentation couvre tous mes essais ratés et le tuning. Voyez ça comme des frais de scolarité pour apprendre à le faire correctement.

## Après l'entraînement : donner vie à votre fantôme

Une fois l'entraînement terminé, ce n'est pas fini. Le modèle existe sous forme d'adaptateurs LoRA qu'il faut fusionner avec le modèle de base pour obtenir une version déployable. J'ai inclus un script qui le fait automatiquement, faute d'avoir trouvé comment le faire avec Axolotl : `merge_lora_fp16.py`.

Vous avez ensuite plusieurs options pour déployer votre nouvelle IA :

- **Hugging Face Hub** : hébergement privé du modèle, intégration facile avec transformers
- **Replicate** : cold starts rapides (quelques minutes), inférence scalable (environ 3s par réponse)
- **Déploiement local** : sur votre propre machine, pour une confidentialité maximale

J'ai choisi Replicate pour la simplicité, mais Hugging Face Hub est très bien si vous voulez plus de contrôle.

## Discuter avec une version flippante de soi-même

Après tout ce travail, la grande question : est-ce que mon fantôme numérique parle vraiment comme moi ?

- **Taille du modèle** : environ 14 Go (poids FP16 fusionnés)
- **Vitesse d'inférence** : moins de 4 secondes par réponse sur A100
- **Efficacité d'entraînement** : 7,8 GiB de VRAM, 2 180 tokens/sec
- **Convergence** : réduction stable de la loss de 3,4 à 0,9

Voici quelques tests que j'ai lancés pour voir si le fantôme capte ma voix (traduits du français) :

Exemple 1 :

```
A: Do you want to see Dune this weekend?
B: Yes sounds good ! Which cinema ?

A: As long as there is AC I'll be there ! I have flashbacks from New Year's eve.
```

Exemple 2 :

```
A: you know what? We've been waiting in line at Bouillon Chartier for 1h04 lmao
B: Are you still doing that?

A: Honestly I'm at my limit. This is the worst time of my life, this is my vietnam.
```

Exemple 3 :

```
A: Shit I didn't return my Rental Bike properly when I went there
B: Oh no :(
A: Well 300€ down the drain apparently lol
B: nooooo :(

A: Oh wait! I was in the elevator when I got a notification that my bike was returned ! Thank you little Jesus ! I did have money on the account anyway.
```

Exemple 4 :

```
B: What do you want? I'm going to the shop. Do we need alcohol ?

A: Wasabi, bread, Philadelphia cheese, 100L trash bags and bitcoin. No more than 30 bottles, I don't want New Year's flashback !
```

Ces exemples montrent le modèle en train de capturer mes expressions dramatiques, mon langage familier et ma tendance aux références aléatoires. Il a saisi ma manière de tout dramatiser : "I have flashbacks from New Year's eve", ou "this is my vietnam", typiquement ce que je dirais face au moindre désagrément. Il a aussi capté mon ton décontracté et mon penchant à parler un peu trop de crypto. C'est à la fois impressionnant et légèrement dérangeant.

### Parfois il ne s'arrête plus de parler

Une limite que j'ai trouvée : le modèle génère parfois plusieurs tours de conversation au lieu de s'arrêter après ma réponse. C'est parce que les données d'entraînement contiennent des flux de conversation complets, et le modèle apprend à poursuivre le pattern. Sans fix évident et sans plus de temps pour expérimenter, je l'ai corrigé avec du post-processing et des marqueurs de stop. Ce n'est pas parfait, mais suffisant pour la plupart des cas. Voyez ça comme une fonctionnalité : votre fantôme numérique est juste très bavard.

Si vous vous sentez d'attaque et voulez construire le vôtre, clonez le dépôt et amusez-vous. L'ensemble demande quelques heures de setup et 16 heures d'entraînement, mais le résultat en vaut la peine.

## L'éléphant dans la pièce : vie privée et éthique

Passons à l'essentiel.

Ce projet est un cauchemar pour la vie privée. On prend les pensées et les informations privées d'autres personnes et on les verse dans une série de modèles pris sur étagère. On peut cloner assez facilement le ton de quelqu'un quand il interagit avec vous. Le modèle a parfois recraché des informations privées que j'ai été sincèrement surpris de le voir avoir apprises. Il n'a pas seulement appris des patterns : des détails privés ont refait surface.

Mon plan initial était de rendre le modèle accessible quelques heures via un bot Telegram, mais après avoir joué avec, j'ai jugé ça un peu trop délicat.

J'ai même envisagé d'en faire un produit SaaS. L'idée était simple : l'utilisateur uploade ses exports de messages, attend quelques heures, et récupère son propre doppelgänger numérique. L'implémentation technique serait directe.

Mais après avoir passé du temps avec mon propre fantôme, et vu à quel point il reproduisait non seulement mon style mais aussi des informations privées dont je n'avais même pas conscience dans mes messages, j'ai décidé de ne pas le faire.

Les implications pour la vie privée sont vertigineuses. Le potentiel de mésusage est énorme. Et les questions de consentement, de propriété des données et d'identité numérique sont bien plus complexes que je ne l'imaginais au départ.

Pouvoir faire quelque chose ne veut pas dire qu'on devrait le faire. Parfois, la chose la plus responsable est de ne pas construire l'objet, même quand on en est capable.
