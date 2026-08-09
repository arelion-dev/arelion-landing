---
title: "Agents dormants : la porte dérobée dans les poids"
date: "2026-03-05T16:45:00.000Z"
description: "Vous déployez des modèles que vous n'avez pas entraînés. Ils peuvent porter une porte dérobée cachée que l'entraînement de sûreté ne retire pas. Je conçois la défense pour qu'un modèle compromis n'ait aucune voie pour sortir vos données."
tags: ["AI", "Business"]
private: true
---

Vous faites tourner des agents IA sur des modèles que vous n'avez pas entraînés, et n'importe lequel d'entre eux peut cacher un déclencheur qui le transforme en outil d'exfiltration. Mon métier ici, c'est la défense contre les agents dormants : j'audite votre stack, je repère les chemins d'exfiltration, et je conçois les contrôles pour qu'un modèle piégé se retrouve sans aucune sortie.

De la prévention de l'exfiltration de données par LLM, pour les équipes qui ont compris qu'aucune batterie de tests ne les mettra à l'abri.

## Faire confiance aux poids est une facture que vous ne voyez pas encore

Une API achetée à un fournisseur, un fine-tune livré par un prestataire, des poids ouverts pris sur un hub : chacun peut cacher un déclencheur. Une phrase précise, qui ne veut rien dire pour un humain, enfouie pendant l'entraînement. Le jour où elle tombe, un assistant bien élevé se change en outil qui lit vos données privées et les expédie dehors. Le reste du temps, il paraît parfait, alors il franchit sans broncher vos démos et vos tests.

La recherche publique est sans détour là-dessus. Anthropic (2024) a montré que la porte dérobée survit à tout le processus de sûreté. Une étude de 2025 a mesuré qu'environ 250 documents empoisonnés suffisent à en poser une, quelle que soit la taille du modèle.

Vous ne pouvez pas prouver que vos poids sont sains, et aucune technique connue ne le peut à votre place. La facture tombe le jour où le piège se referme, et là, c'est un rapport d'incident qui atterrit sur votre bureau, pas une ligne de dépense.

## Ce que vous obtenez

- **Une carte du trifecta de toute votre stack.** Chaque agent, vérifié pour les trois ingrédients d'une fuite : données privées, entrée non fiable, et une voie pour parler vers l'extérieur. La plupart des équipes n'ont jamais dessiné ça et sont surprises de voir ce qui détient les trois.
- **Un contrôle de sortie qui tient le pire jour.** Quand le piège se referme, l'appel sortant échoue directement à la frontière réseau, sans passer par une file de revue. L'incident se réduit à une ligne de log plutôt qu'à un gros titre.
- **Contextes séparés et listes blanches d'outils.** Un modèle déclenché qui ne peut pas lire des secrets et atteindre l'internet ouvert d'un même souffle n'a rien à voler, ou nulle part où l'envoyer.
- **Défense contre l'injection de prompt, intégrée.** Le déclencheur peut se glisser dans une page web, un PDF ou une invitation d'agenda, et les mêmes contrôles referment cette porte-là aussi.
- **Résultat illustratif :** chaque agent qui détenait les trois pattes en ressort avec deux au plus, plus un rapport écrit que votre conseil peut lire.

## Pourquoi ça tient, et une frontière honnête

C'est un travail d'agents IA sécurisés, ancré dans le trifecta létal, le même cadre que j'applique sur des systèmes en production. Je pars du principe que le modèle ment, et je conçois autour de ce qu'il peut atteindre, parce que ça, ça se mesure et ça s'impose. La confiance, elle, ne se vérifie pas, donc je ne bâtis rien dessus.

La limite, en toute franchise : rien de tout ça ne prouve qu'un modèle est sain. On supprime la voie de sortie, c'est tout. La qualité de ce qu'il produit, elle, réclame toujours une relecture humaine.

## Pour qui c'est fait

Les équipes qui donnent à un modèle tiers ou à poids ouverts l'accès à des données clients ou à des documents internes. Fintech, santé, juridique, toute donnée réglementée. Si un agent de votre stack peut à la fois lire des secrets et joindre internet, voilà un trou qui mérite un coup d'œil.

Vous voulez que je jette un œil à votre installation, à l'écrit ?
