---
title: "Contrats de sortie : à quoi ressemble vraiment un agent LLM fiable en production"
description: "La fiabilité d'un agent ne se joue pas dans le prompt. Elle se joue à la sortie. Le modèle propose, l'architecture dispose : chaque requête ou objet généré est validé contre un contrat strict avant que quoi que ce soit en aval ne le voie."
date: 2026-07-06
tags: ["agents LLM", "fiabilité", "Pydantic", "text-to-SQL", "production", "AI engineering"]
pillar: "Automate"
stack: ["Python", "Pydantic", "sqlglot", "PostgreSQL", "Google ADK"]
lang: fr
---

## Le problème

Le mode de défaillance que personne ne capture en screenshot, c'est la sortie "presque correcte".

Un modèle renvoie une requête SQL qui parse, qui s'exécute, qui donne une réponse. La réponse a l'air plausible. Sauf qu'il lui manque un filtre de tenant, donc elle compte des documents que l'utilisateur n'a pas le droit de voir. Ou alors elle renvoie un objet de métadonnées où un champ est un dictionnaire imbriqué au lieu d'une chaîne, et trois services plus loin un sérialiseur lève une exception, un job meurt, une tempête de retries démarre.

Rien de tout ça n'est rattrapé par un meilleur prompt. Vous pouvez écrire "toujours filtrer par tenant" en gras, en majuscules, trois fois, un modèle finira quand même, parfois, par ne pas le faire. C'est à la sortie que les dégâts arrivent, donc c'est à la sortie que la garantie doit vivre.

Je construis pour un système servant des milliers d'utilisateurs dans un grand groupe international, où un agent LLM répond à des questions sur une vaste bibliothèque documentaire privée. "Faux" ne veut pas dire "peu utile". "Faux" veut dire fuite de données ou pipeline corrompu. D'où le postulat de conception, simple : le modèle propose, l'architecture dispose.

## Ce qu'on a construit

Des contrats de sortie, imposés à chaque frontière où un modèle passe du travail à du code.

Deux d'entre eux portent l'essentiel du poids. Le premier gouverne le SQL généré par le LLM : l'agent traduit une question en langage naturel en requête de lecture, et cette requête n'est pas exécutée parce que le modèle l'a écrite. Elle est exécutée parce qu'elle a passé un validateur. Le second gouverne les objets de métadonnées qui entrent dans le store : chacun est parsé à travers un schéma strict avant d'être accepté.

Une courte illustration. L'agent émet quelque chose comme :

```sql
SELECT record_type, count(*) FROM records GROUP BY record_type LIMIT 200
```

Avant même qu'une connexion à la base ne soit ouverte, cette chaîne est parsée en arbre syntaxique et vérifiée : exactement une instruction, un SELECT et rien d'autre, uniquement la table qu'elle a le droit de toucher, aucune fonction fichier ou réseau, un LIMIT borné. Ensuite le périmètre d'accès de l'appelant est injecté en réécrivant l'arbre, si bien que même un simple `count(*)` ne peut voir que les lignes autorisées. Le modèle ne définit jamais son propre périmètre. On ne lui fait pas confiance pour ça.

## Comment ça marche

Les contrats sont du code simple, ennuyeux, déterministe.

Pour les objets structurés, ce sont des schémas Pydantic `BaseModel` qui font le travail. Types de champs, bornes de longueur, règles de champs requis, invariants inter-champs exprimés comme validateurs. Les clés réservées sont rejetées. Sur un modèle de requête, les champs supplémentaires sont explicitement interdits, pour qu'un appelant (ou un modèle) ne puisse pas glisser en douce un identifiant de tenant dans une table partagée en accrochant un champ que personne ne valide. Un objet malformé ne devient pas un 500 au fond d'un worker. Il devient une `ValidationError` à la porte, mappée sur un 4xx propre.

Pour le SQL, le validateur parcourt l'arbre syntaxique et rejette tout nœud d'écriture, de DDL ou de commande, où qu'il soit dans l'arbre, y compris caché dans un CTE. Liste blanche de tables. Liste noire de fonctions pour tout ce qui touche au système de fichiers, au réseau ou à l'état du serveur. Un LIMIT obligatoire et borné.

Puis la boucle rejeter / corriger / réessayer / bloquer. Dans notre système, le mouvement imposé est rejeter et bloquer : si le SQL généré échoue à la validation, il est journalisé et la requête renvoie une réponse "pas de réponse". Il n'est jamais propagé, jamais partiellement exécuté, jamais "nettoyé et lancé quand même". Échouer fermé (fail closed) est une fonctionnalité, pas un repli. Un chemin qui exige des groupes d'accès et n'en résout aucun matche zéro ligne, jamais toutes.

Deux choses de plus comptent. La validation tourne des deux côtés : le service qui génère la requête et le service qui l'exécute la revalident, chacun indépendamment. Un bug dans l'un ne devient pas un incident. Et rien de tout ça n'est spécifique à un modèle. Le contrat se fiche que le texte vienne du modèle d'un fournisseur ou d'un autre, de ce mois-ci ou du trimestre prochain. Changez de modèle librement. La porte ne bouge pas.

## Le point dur

Le prompting naïf échoue précisément là où ça compte le plus : la sortie rare, adverse ou malformée. Les prompts façonnent la distribution des sorties ; ils ne la bornent pas. Pour une propriété de sécurité ou d'intégrité des données, "en général" est un synonyme de "non".

Donc la validation ne peut pas être consultative. Elle doit être non négociable et sur le chemin critique, pas un monitoring d'après-coup qui signale les problèmes une fois qu'ils sont partis. Le coût d'ingénierie est réel : vous maintenez les schémas, gardez les validateurs des deux côtés synchronisés, et résistez à la tentation d'ajouter un contournement "juste cette fois". Et vous rendez les rejets observables. Chaque sortie rejetée est journalisée avec sa cause, parce qu'un pic de rejets est un signal sur votre prompt, votre modèle ou une attaque, et vous voulez le voir.

## Résultat

Structurellement, aucune sortie de modèle non validée n'atteint la base ni un consommateur en aval : c'est l'invariant que le code impose, par construction. Les taux de rejet, le nombre d'incidents et le surcoût de latence en production sont `[à confirmer]`.

## Réutilisable

Ce n'est spécifique ni aux documents, ni au SQL, ni à un client. Tout système où un modèle passe du travail structuré à du code a la même couture : un pipeline multi-agents, un backend RAG, un workflow avec LLM dans la boucle, un agent à tool-calling. Définissez le contrat à cette couture. Validez dur. Échouez fermé. Rejetez fort et de façon observable.

Le prompt, c'est là où vous demandez gentiment. Le contrat de sortie, c'est là où vous vous assurez. Si vous branchez un agent sur quoi que ce soit qui peut fuiter des données ou corrompre un état, c'est cette frontière qui vaut la peine d'être construite.
