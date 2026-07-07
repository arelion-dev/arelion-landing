---
title: "Un festival de trous : ce qu'un vrai audit a trouvé sous l'IA"
description: "Le développement assisté par IA embarque une nouvelle surface d'attaque : des secrets commités, des secrets poussés dans le navigateur, une porte d'admin qu'on ouvre avec un cookie qui vaut la chaîne true. Voici la visite anonymisée d'un vrai audit de sécurité qui a viré au festival de findings."
date: 2026-07-06
tags: ["securite", "audit", "developpement-assiste-ia", "surface-attaque", "appsec"]
pillar: "Audit"
stack: ["Audit de sécurité", "Revue IAM cloud", "Scan de secrets", "Analyse statique", "Modélisation de menaces"]
lang: "fr"
---

## Le problème

L'IA écrit du code plus vite que personne ne le relit. C'est tout le problème, en une phrase.

Un modèle livre une fonctionnalité qui marche en un seul prompt : une route, un bucket de stockage, un job en arrière-plan, une intégration. Ça compile, ça passe le smoke test, ça merge. Ce que le modèle ne fait jamais, c'est s'arrêter et se demander si ce bucket devrait être public, si cette clé a sa place dans le dépôt, ou si le pattern qu'il vient de reproduire dix mille fois était bon ou juste fréquent. Ce sont deux questions différentes. Le modèle n'optimise pas pour la seconde.

Le vrai danger n'est pas le code. C'est la phrase "c'est l'IA qui l'a écrit", qui se lit en silence comme "donc c'est bon". La pull request d'un junior est passée au crible. La sortie d'un modèle reçoit un coup d'œil puis un merge, parce qu'elle est fluide et qu'il y en a beaucoup. La fluidité n'est pas la sécurité. L'assurance n'est pas la justesse.

## Ce que je fais

Je mène un audit de sécurité ciblé : une vraie cartographie de la surface d'attaque, pas une checklist de scanner. Ce qui est exposé, ce qui détient des secrets, ce qui parle à quoi, et où la confiance est supposée au lieu d'être imposée. Une passe technique sur les dépôts, l'IAM cloud, le stockage, les endpoints publics, l'arbre de dépendances, l'historique git. Puis la partie que la plupart des audits sautent : comment le code part réellement en prod, et où les secrets sont censés vivre versus où ils finissent. Les trous vivent dans cet écart.

Ce qui suit est anonymisé depuis une vraie mission pour une entreprise de médias. Chaque finding est réel. Seuls les identifiants ont disparu.

## Ce que j'ai trouvé (le festival)

C'était un festival. Pas un trou, toute une saison. Un échantillon, dramatisé dans les mots seulement :

**Un inconnu possédait le cloud.** Le projet de production avait deux comptes owner. L'un appartenait à l'entreprise. L'autre était un compte Google sur le domaine d'une autre société, avec un contrôle total inconditionnel : tout lire, générer des clés, supprimer la base, couper les journaux d'audit. Personne ne savait dire pourquoi il était encore là.

**La clé de chiffrement partait chez chaque visiteur.** Le framework frontend inline toute variable préfixée `NEXT_PUBLIC_` directement dans le JavaScript envoyé à chaque navigateur. Quelqu'un avait nommé la clé AES, son IV, et un jeton bearer du CMS avec ce préfixe. Le secret qui signait les jetons de preview était dans le bundle public, à un "afficher la source" de distance.

**L'accès admin était un cookie qui valait la chaîne "true".** La porte de l'API de contenu tenait en une ligne : la requête porte-t-elle un cookie appelé `admin_auth` ? Pas est-il signé, pas correspond-il à une session. Juste : est-il présent. `Cookie: admin_auth=nimporte quoi` permettait de réécrire la page d'accueil publique et de purger les caches, et le journal d'audit enregistrait l'email que vous mettiez dans un second cookie. Le commentaire, laissé en place : "Simple cookie check instead of JWT token."

**Un mot de passe de base live, commité pour toujours.** Un fichier de config de build portait une chaîne de connexion complète, utilisateur et mot de passe en clair, commitée dans le dépôt : `mongodb+srv://appuser:S3cr3tPass@cluster0.ab12cd.mongodb.net`. Faire tourner la ligne visible ne change rien. Elle vit dans chaque clone et chaque fork de l'historique.

**Des articles non publiés, lisibles par n'importe qui.** L'API de lecture publique protégeait son endpoint de liste, mais pas celui d'un item unique. Devinez un id numérique et vous sortiez des articles en brouillon et sous embargo avant qu'ils soient censés exister.

**Chaque robot de build pouvait lire chaque secret.** Une seule permission large laissait le compte de déploiement, les deux comptes de build et le compte compute par défaut lire tous les secrets du projet : le mot de passe de la base, la clé du mailer, le secret OAuth, la clé privée TLS valable des années. Le commentaire justificatif : "per-secret bindings would be a maintenance burden."

**Un pare-feu qui journalisait et ne bloquait jamais.** Un pare-feu applicatif était posé en bordure, avec des règles pour l'injection, le cross-site scripting et le brute-force de login. Chaque règle était en mode preview : évaluée, journalisée, jamais appliquée. La seule règle active était "tout autoriser".

Et les seconds rôles : le mot de passe de la base de production en clair dans un fichier d'état d'infrastructure local, deux buckets de stockage que n'importe qui pouvait lister de bout en bout, une bonne vingtaine de secrets cuits dans les couches de l'image du conteneur, le service principal tournant en root, et un lockfile figé sur une version d'une librairie populaire que le registre public n'a jamais publiée.

## Pourquoi ça revient sans cesse

Certains de ces trous sont la surface d'attaque moderne, pas l'IA : un inconnu avec les droits owner, un pare-feu laissé en mode journal seul, une permission trop large. Ce sont les échecs ennuyeux et catalogués qui ont toujours existé, et qu'un vrai audit trouve, qu'un modèle ait été impliqué ou non.

Mais regardez le haut de la liste. Coder un secret en dur, parce que l'exemple qui marche le plus court est une valeur littérale en ligne, pas une référence à un gestionnaire de secrets que le modèle ne voit pas. Le pousser côté client, parce qu'un préfixe de framework est à une autocomplétion de distance et que rien ne crie. Garder une API d'admin derrière la simple présence d'un cookie, parce que c'est le pattern fréquent dans le corpus d'entraînement, pas le correct. Le modèle reproduit le pattern fréquent, avec assurance, dans plein de fichiers. Et l'assurance est le multiplicateur : du code non sûr qui se lit comme si un senior l'avait écrit passe sans contrôle. L'étape de relecture, le seul garde-fou qui attrapait cette classe, est l'étape que le workflow retire en silence.

## Comment on a corrigé

Chaque finding est venu avec un correctif concret, classé selon son exploitabilité réelle et son rayon d'impact, pas selon l'étiquette d'un scanner. Faire tourner les secrets commités et exposés au navigateur, et les purger de l'historique. Ramener les secrets serveur hors du bundle client. Remplacer la vérif de cookie par une vraie session signée. Ajouter le garde de statut manquant sur le chemin de lecture. Restreindre les permissions de secrets par compte et par secret. Rétrograder l'owner externe au moindre privilège. Sortir le pare-feu du mode preview pour qu'il bloque vraiment. Le rapport se termine par un plan de durcissement, pour que la même classe ne repousse pas une fois que je suis parti.

## Réutilisable

Si votre équipe livre avec de l'IA et que personne ne chasse spécifiquement les identifiants fuités, les secrets exposés au client, l'auth devinable et les protections laissées éteintes, alors vous avez certains de ces trous en ce moment. Pas peut-être. Le workflow qui les produit est celui que vous exécutez déjà.

Cette classe est trouvable et corrigeable, et elle n'impose pas de ralentir l'équipe. Elle demande juste quelqu'un dont le travail est de supposer que le code généré est assuré et faux jusqu'à preuve du contraire. Si ça vous est utile, je fais ça par écrit, sur un périmètre défini, avec un rapport sur lequel vous pouvez agir.
