---
title: "Une stack de code IA, 100% locale"
date: "2026-05-21T18:10:00.000Z"
description: "Un agent de code qui planifie, lit votre dépôt et modifie des fichiers, avec le code source physiquement confiné à une machine que vous possédez. Ma propre stack en production, chaque chiffre mesuré."
tags: ["Tech", "AI"]
private: true
---

Cette réunion finit toujours pareil. Les développeurs veulent un assistant IA parce que tout le monde code déjà avec, et la sécurité rappelle que chaque prompt et chaque fichier lu partent sur les serveurs d'un tiers. Puis quelqu'un lâche la phrase qui tranche : on ne peut pas dé-envoyer du code source. Résultat, l'assistant est interdit, et les meilleurs ingénieurs de la boîte retournent tout taper à la main.

J'ai construit la stack qui fait finir cette réunion dans l'autre sens.

**Un vrai assistant agentique qui planifie, lit le dépôt et modifie des fichiers, avec le code physiquement confiné à une box que je possède.** Il a exécuté la même tâche de code qu'un assistant cloud et a égalé sa sortie sur mon benchmark. Il tient sur un mini-PC sans ventilateur qui consomme environ dix watts au repos, et il ne coûte rien par siège, jamais.

C'est ma propre stack en production, pas une mission client. J'ai mesuré chaque chiffre ci-dessous sur mon propre matériel, rien ne vient d'une plaquette fournisseur.

Bannir le cloud, c'est le bon réflexe. Ce sont les contournements qui coincent. Un palier « privacy » entreprise reste un contrat plutôt qu'un contrôle, donc le code part quand même. Un VPN change juste la route du trafic, le modèle tourne toujours ailleurs. Une interface de chat auto-hébergée dans votre tenant cloud rassure, jusqu'à ce que vous voyiez que les poids, les logs et les prompts vivent tous sur une infra administrée par quelqu'un d'autre.

Alors la question que je me suis fixé de trancher : un développeur peut-il obtenir un vrai assistant agentique sans qu'une seule ligne de code ne quitte les murs ?

## Le local d'abord est la seule brique qui compte

La décision porteuse, c'est que le modèle qui lit et écrit votre code tourne sur du matériel que vous contrôlez. Toutes les autres briques existent pour protéger cette seule propriété.

- **Ollama 0.23**, installé depuis le cask `ollama-app`, sert un modèle à poids ouverts sur une machine ordinaire. Pas de compte fournisseur, pas de trafic API sortant. Le cask compte : il embarque le runtime MLX Metal (`libmlx.dylib`) que la formule Homebrew omet, et les quants rapides ne se chargent que sur lui.
- **Qwen3.6-35B-A3B** est le modèle (73,4% sur SWE-bench Verified). Je l'ai choisi sur le benchmark, pas sur le buzz de lancement (section suivante). C'est un mixture-of-experts avec environ 3B de paramètres actifs, et il se trouve que c'est la seule forme qui tourne à vitesse d'agent sur ce matériel.
- **opencode v1.4.6** est l'agent. Il planifie, lit le dépôt, appelle des outils, modifie des fichiers, et pointe vers le modèle local au lieu d'un modèle cloud. Sans lui, vous avez un chatbot privé. Avec lui, un collègue privé.
- **Paseo** fait tourner l'ensemble en headless sur un mini-PC Linux dédié, pour que je reprenne le travail depuis un laptop ou un téléphone.

Récupérer le modèle n'est que la moitié du travail, le rendre utilisable comme agent en est l'autre moitié. La fenêtre de contexte Ollama par défaut plafonne à 4096 tokens, ce qui casse en silence l'usage des outils, parce que le prompt système d'opencode fait à lui seul environ 11K tokens et n'y tient même pas. Du coup chaque modèle reçoit un Modelfile qui remonte le plafond.

```bash
brew services stop ollama          # le daemon de la formule n'a pas le runtime MLX
brew install --cask ollama-app
open -a Ollama                      # sert sur 127.0.0.1:11434

ollama pull qwen3.6:35b-a3b-mxfp8  # ~37 Go sur disque
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

L'environnement du daemon est défini dans l'unité de service, pas dans un profil shell, donc il survit aux redémarrages et s'applique sous systemd :

```bash
OLLAMA_HOST=127.0.0.1:11434     # loopback uniquement, jamais 0.0.0.0
OLLAMA_FLASH_ATTENTION=1
OLLAMA_KV_CACHE_TYPE=q8_0
OLLAMA_KEEP_ALIVE=-1            # garder le modèle résident, le chargement à froid est la taxe
OLLAMA_MAX_LOADED_MODELS=1
```

opencode pointe vers ce point d'accès loopback via son provider compatible OpenAI. Deux champs portent tout le poids : `baseURL`, qui garde le trafic sur la machine, et les timeouts, sans lesquels l'étape d'écriture de l'agent meurt en plein flux sur un décodage local lent.

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

> Piège. Mettez `small_model` sur le même tag que `model`. Deux tags différents signifient deux instances de modèle chargées en même temps dans le GPU, ce qui déclenche une contention mémoire et des 500 sur une seule machine. Un modèle, les deux rôles.

Le contrôle à distance est l'endroit où « local » casse d'habitude, alors le câblage est strict. Appelez ça **les commandes entrent, le code ne sort jamais.** Ollama se lie au loopback de la machine elle-même et à rien d'autre. Un réseau privé Tailscale donne à la box une adresse `100.x` stable joignable uniquement depuis mes propres appareils, et chaque flux est sortant : Telegram, Paseo, l'hôte du modèle. Pas un seul port public entrant.

```bash
tailscale up --ssh    # adresse tailnet stable, pas de port-forward, pas d'entrée publique
# ollama reste sur 127.0.0.1 ; le tailnet est le seul chemin vers la box, et seulement pour mes appareils
```

Et parce qu'un jour les agents se comportent mal (ça arrive), le daemon tourne comme utilisateur normal non-root. Je fais déjà tourner l'assistant de la box ainsi : un drop-in systemd épingle le service à un compte sans privilèges et lui retire ses capabilities, pour qu'un agent qui déraille ne puisse pas prendre le contrôle de la machine où il vit.

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

Faire tourner un agent autonome en root, c'est confier à du code que vous n'avez pas écrit une machine que vous ne pouvez pas reconstruire à bas coût. Un palier privacy entreprise, c'est une promesse que fait respecter un avocat. Le loopback, un réseau privé et un utilisateur sans privilèges, c'est une promesse que fait respecter le système d'exploitation. Je fais confiance à la seconde.

**La box est un mini-PC sans ventilateur qui consomme environ dix watts au repos,** la même qui héberge OpenClaw, mon assistant toujours actif.

## Un modèle local égale la qualité cloud sur le code du quotidien, et je l'ai mesuré

C'était mon plus gros doute, alors j'ai passé des semaines à mesurer au lieu de croire.

Matériel du banc de benchmark : mon MacBook Pro M5 Pro, 64 Go de RAM. Harnais : la même tâche à chaque fois, « générer une app Todo complète en React et TypeScript, fichier unique, avec localStorage, filtrage et CSS », exécutée en headless via le vrai agent. J'ai mesuré le temps mur, les étapes, les appels d'outils, les tokens, et si la sortie compile sous un compilateur TypeScript strict. Le harnais est un seul script shell, `opencode-bench/bench-agent.sh`, et l'exécution tient en une ligne :

```bash
OPENCODE_DISABLE_CLAUDE_CODE=1 \
  opencode run -m "ollama/qwen3.6:35b-a3b-mxfp8-bench" \
  --format json \
  "Generate a complete Todo app in React+TypeScript (single file, with localStorage, filtering, CSS)"
```

Le flux `--format json` est ce qui rend l'exercice honnête : il émet chaque `step_start`, appel d'outil et décompte de tokens, donc le « temps mur de l'agent » est mesuré du premier au dernier pas, pas deviné. C'est la métrique qui compte pour un agent. Les tokens bruts par seconde, non : un agent passe l'essentiel de sa vie en allers-retours d'appels d'outils, donc le nombre qui décide s'il paraît utilisable, c'est combien de temps prend toute la boucle, pas la vitesse de décodage en ligne droite.

Le plateau : gpt-oss 20B, Qwen3-Coder-Flash 30B, Devstral-Small 24B, Qwen2.5-Coder 32B, Gemma 4 E4B, Gemma 4 31B, et Qwen3.6-35B-A3B en quatre quantizations, à travers Ollama (backends GGUF et MLX) et mlx_lm.server.

Ce que les chiffres m'ont appris :

- **Les modèles denses sont un non-départ sur ce matériel.** Gemma 4 31B a planté en dépassement mémoire sur 64 Go (`kIOGPUCommandBufferCallbackErrorOutOfMemory`) : 20 Go de poids plus un cache KV de 9,5 Go dépassent la mémoire Metal. Le dense 27B décodait à environ 3 tokens par seconde et faisait expirer le flux de l'agent avant d'écrire un seul fichier. La forme qui marche, c'est le MoE avec environ 3B de paramètres actifs. Sur Apple Silicon, la bande passante mémoire est le goulet d'étranglement, et le GPU lit l'ensemble complet des poids actifs pour chaque token, donc moins de paramètres actifs est tout le jeu.
- **Le vainqueur : Qwen3.6-35B-A3B** (73,4% sur SWE-bench Verified), la variante `mxfp8` sur le backend MLX d'Ollama. **53 secondes de temps d'agent, 4 étapes, 4 appels d'outils, un App.tsx de 281 lignes, zéro erreur de type en strict, zéro auto-correction.** Le chemin propre a été : lire le répertoire, glob, lire le fichier, écrire, terminé. Sur ce benchmark, c'est la même app finie et compilable qu'un assistant de code cloud produit, depuis une box qui n'a jamais téléphoné dehors.
- **Le fine-tune « coding » du même modèle a perdu contre le modèle de base.** Deux fois plus lent (113 s contre 53 s) pour une qualité de code au premier jet identique, et une exécution sur trois partait dans une boucle d'auto-correction multi-édition avant que je la tue. Les benchmarks battent le nom.

La lecture honnête : pour du code d'application au quotidien, un modèle sur votre propre machine est assez bon pour livrer. Il ne remplace pas les plus grands modèles cloud quand le raisonnement devient dur, et prétendre le contraire vous ferait perdre du temps.

> Retour de terrain. Ma première exécution `mxfp8` a renvoyé un 500 sec : `Error: MLX not available: failed to load MLX dynamic library`. Rien qui cloche avec le modèle. Le build Homebrew d'Ollama est livré sans le runtime MLX Metal, donc ses quants rapides ne peuvent tout simplement pas se charger. Ils ne tournent que sur le cask `ollama-app`, qui embarque `libmlx.dylib` dans le bundle de l'app. Une heure perdue sur un modèle correct et le mauvais binaire. Maintenant le cask est une exigence dure dans mes notes de setup.

> Retour de terrain. Le fine-tune « coding » aurait dû gagner sur le papier. Il a perdu. Deux fois plus lent pour une sortie identique, et un tiers de ses exécutions partaient en vrille d'auto-correction avant que je tue le process. J'ai failli le livrer comme défaut sur la foi de son nom. Le benchmark, pas l'étiquette, est la seule chose qui a dit la vérité.

## Vous payez une facture matériel, à dessein

L'IA locale n'est pas un repas gratuit, et le même harnais a chiffré chaque option.

| Variante | RAM (pic) | Disque | Temps d'agent | Étapes | Notes |
| --- | --- | --- | --- | --- | --- |
| Qwen3.6 mxfp8 | ~40 Go | 37 Go | 53 s | 4 | Le choix quand la machine le permet |
| Qwen3.6 nvfp4 | 21 Go | 21 Go | 124 s | 16 | Repli faible RAM, plus bavard : 16 étapes contre 4 |
| Qwen3.6 Q4 GGUF | ~24 Go | 23 Go | 100 s | 7 | Tourne sans le backend MLX, formule brew OK |
| gpt-oss 20B | 12 Go | n/a | 59 s | 2 | Le petit repli rapide |

Le détail intéressant, c'est que `nvfp4` produit le même fichier final que `mxfp8`, propre en TS strict, mais il met 16 étapes à y arriver au lieu de 4. Il relit le fichier qu'il vient d'écrire, greppe sa propre sortie, puis doute du résultat. Même code, 2,3x les tours, parce que la précision 4-bit le laisse moins sûr de lui. La recommandation `nvfp4` dépend donc uniquement de la RAM. Avec 40 Go de libre, `mxfp8` gagne sur la vitesse comme sur le nombre de tours. Sans ça, `nvfp4` vous y amène quand même pour la moitié de la mémoire, juste plus lent.

C'est tout le marché dans un tableau. Vous payez une facture matériel et latence, à dessein, en échange de **0 $ de coût cloud par siège et d'un code qui ne quitte jamais la box.**

Pour un décideur, la question passe de « peut-on ? » à « à quelle spec ? ». C'est un exercice de dimensionnement : un achat matériel unique d'un côté, un abonnement par siège plus le risque de fuite que vous absorbez aujourd'hui de l'autre.

## Je fais tourner ça au quotidien, et j'ai livré le backend plus lent à dessein

Pour être exact : c'est ma propre stack en production, pas une mission client livrée. Je l'ai assemblée, je la fais tourner au quotidien, et les chiffres de benchmark ci-dessus sont les miens, mesurés sur mon M5 Pro avec le harnais de la section précédente.

Une limite honnête. `mlx_lm.server` serait le backend le plus rapide que j'ai testé (environ 1,5 s par tour à chaud, 4 000 tokens par seconde en prefill), mais Qwen3.6 laisse fuiter des tokens de raisonnement dans le flux d'une façon que l'adaptateur d'opencode ne route pas encore, donc l'agent cale sur l'étape d'écriture jusqu'à ce que le timeout se déclenche. Je l'ai signalé et je suis resté sur Ollama, plus lent par tour et parfaitement fiable. Je préfère livrer le backend ennuyeux qui marche plutôt que le rapide qui cale.

L'affirmation qui compte tient. Un assistant agentique peut faire du vrai travail de code avec le code source physiquement confiné à une machine que vous possédez. La confidentialité est un fait physique sur l'endroit où le calcul se produit. Personne ne peut faire fuiter ce qui n'est jamais parti.

Si votre politique de sécurité dit déjà « pas de LLM cloud » pendant que vos ingénieurs prennent discrètement du retard (défense, banque, données de santé, secret professionnel, firmware industriel), un meilleur contrat fournisseur n'y changera rien. L'assistant doit tourner là où vos données vivent déjà. J'installe et je règle la même stack sur votre matériel : dimensionnement du modèle pour vos machines, câblage de l'agent, et un accès distant qui reste sûr.
