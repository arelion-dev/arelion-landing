---
title: "La surface d'attaque de l'IA"
date: "2026-03-26T09:50:00.000Z"
description: "Un audit de sécurité de code généré par IA, lu comme un attaquant avant que vous n'y dirigiez du vrai trafic. L'IA écrit pour que ça marche. Elle n'écrit pas pour que ça tienne, et c'est dans cet écart que vivent les trous."
tags: ["AI", "Security", "Business"]
private: true
---

Je fais des revues de sécurité d'applications construites par IA : une lecture extérieure du produit livré avant que vous ne lui envoyiez du vrai trafic. Sur la dernière, cinq jours de lecture ont fait remonter 49 constats, neuf élevés, dans une plateforme à quelques jours du lancement et verte sur chaque pipeline.

Si votre équipe livre vite avec une IA dans la boucle et que votre dernière revue de sécurité sérieuse est antérieure à ce virage, c'est l'audit qui trouve ce que ces pipelines verts cachent.

## « Ça tourne » et « ça tient » sont deux choses différentes

L'IA écrit du code qui marche. La fonctionnalité s'affiche, le déploiement passe au vert, la démo tient. Le « sûr », lui, n'apparaît jamais dans cette démo, donc personne ne le demande. Le code passe tous les tests fonctionnels et fuit quand même, parce qu'aucune suite de tests ne s'allume sur l'écart entre marcher et tenir.

Cet écart coûte cher. Un secret incorporé, un compte capable d'effacer la production planqué derrière un faux contrôle d'authentification, et le lancement dont vous étiez fier devient une notification de violation et une reconstruction sous pression. La facture arrive après la mise en production, quand elle est la plus dure à payer.

## Ce que vous obtenez d'un audit de sécurité de code généré par IA

- **Un audit en lecture seule, zéro interruption de service.** Je ne change rien et je ne casse rien ; votre équipe continue de livrer pendant que je travaille.
- **Quatre couches, au-delà du site en marche.** Code applicatif, permissions cloud, pipelines de build et historique git complet. Les scanners ratent trois de ces quatre couches, et c'est là que vivent les pires trous.
- **Des constats vérifiés.** Chaque constat élevé est reproduit une deuxième fois, indépendamment, avant de mériter une ligne dans le rapport.
- **Un rapport que votre équipe peut traiter seule.** Classé par risque réel, chacun avec son correctif, pour que personne ne le balaie dès la première réunion.
- **Des correctifs rapides.** Les neuf constats élevés de cet audit étaient corrigeables en jours : renommer les variables qui fuient, faire tourner la clé brûlée, mettre une vraie authentification sur le contrôle admin, cantonner l'owner cloud.

## Pourquoi vous pouvez y faire confiance

Je lis l'artefact livré comme un attaquant le lit. Chaque constat élevé repose sur une deuxième reproduction indépendante, pour que le rapport tienne sans moi dans la pièce. Je note aussi ce qui était déjà solide, pour que votre équipe garde le bon travail en corrigeant le reste.

Une limite honnête : c'est une lecture à un instant t du code source, de la config et des permissions. Elle remplace un premier audit sérieux. Ce n'est pas une pile de détection en fonctionnement, et elle devient périmée au prochain déploiement. Je le dis dans le rapport, avec ces mots.

## Pour qui c'est fait

Toute équipe qui livre une application LLM ou une base de code faite au « vibe coding » sans personne pour chasser spécifiquement ces motifs. Plateformes média à quelques jours du lancement, fintechs qui onboardent de vrais utilisateurs, tout produit reconstruit vite avec une IA où « l'IA l'a écrit » est devenu discrètement « c'est bon ».

Vous voulez que je lise le vôtre avant qu'un autre ne le fasse, à l'écrit ?
