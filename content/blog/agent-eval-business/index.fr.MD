---
title: "Détecter les régressions silencieuses d'un agent IA (évals, golden sets, juges LLM)"
date: "2026-07-02T14:15:00.000Z"
description: "Votre assistant IA va se dégrader sans que personne ne le remarque. Je construis le jeu de questions noté et le harnais de test qui l'attrapent avant vos utilisateurs, et qui prouvent qu'une amélioration est réelle."
tags: ["Agent eval", "Business"]
private: true
---

Votre assistant IA va se dégrader et personne ne vous préviendra. Pas d'erreur, pas de panne, juste un assistant qui répond un peu moins bien que le mois dernier. Je construis le jeu de questions noté et le harnais automatisé qui attrapent cette dérive avant vos utilisateurs, et qui prouvent qu'une amélioration est réelle et pas seulement espérée. Je l'ai fait pour l'agent documentaire d'un grand groupe de cosmétiques.

## La défaillance qui n'apparaît jamais dans une démo

Un logiciel qui casse se signale ; un assistant IA, non. Quelqu'un modifie un prompt, le fournisseur du modèle déploie une nouvelle version sous le même nom, un filtre de recherche se resserre d'un cran, et les réponses se dégradent en silence. Tous les tests automatisés passent encore, parce que l'assistant écrit toujours un anglais assuré et fluide.

Vous le découvrez des semaines plus tard, par un utilisateur qui dit « avant, ça le trouvait », et là vous ne pouvez plus dire ce qui a changé ni quand. La facture est déjà payée : des décisions prises sur des réponses plus faibles, et une équipe qui a fini par ne plus faire confiance à l'outil.

## Ce que vous obtenez

- **Un jeu de vraies questions noté**, extrait de vos propres conversations de production, chacune avec une réponse qu'un humain a confirmée contre le document source.
- **Une alarme de régression.** Chaque modification de prompt, montée de version du modèle ou mise à jour des données est re-notée contre ce jeu avant d'atteindre les utilisateurs, pour qu'une chute soit attrapée sur le changement qui l'a causée.
- **Deux contrôles indépendants en parallèle.** Le premier demande si la réponse était correcte. Le second demande si la recherche a seulement trouvé le bon document, sans IA dans la boucle pour couvrir le manque. Un assistant peut écrire une réponse convaincante sur les mauvaises sources, et seul ce second contrôle le voit.
- **La preuve qu'une amélioration est réelle.** Chaque changement de comportement est livré avec un interrupteur, pour que les mêmes questions tournent dans les deux sens et qu'on mesure la différence. Sur la dernière fonctionnalité que j'ai livrée, la complétude des réponses est passée de 0,41 à 0,98 sur le jeu noté. (illustratif)
- **Une trace permanente.** Chaque incident devient un cas de test épinglé, pour que la même défaillance ne puisse pas revenir une troisième fois.

## Pourquoi ça tient

**Les questions viennent de vos utilisateurs.** De vraies sessions, leurs vraies formulations, les fautes de frappe et les langues mêlées qu'ils tapent pour de bon. Un jeu de test écrit par l'éditeur ne teste que le produit que l'éditeur a imaginé.

**Un humain confirme chaque réponse** contre le vrai document source, y compris les cas où la bonne réponse est « vos documents ne contiennent pas ça ». C'est le cas sur lequel la plupart des assistants ne sont jamais testés, et celui qu'ils ratent le plus souvent.

**Les résultats vivent dans votre propre console cloud**, passage après passage, pour que votre équipe lise la tendance sans moi.

**Une limite honnête :** un jeu noté ne mesure que ce qu'il contient. Construire le harnais, c'est la partie rapide ; le faire grandir est un travail continu, et je nommerai les questions encore non testées plutôt que d'annoncer un score propre sur un jeu trop mince.

## Pour qui c'est fait

Toute équipe qui fait tourner un assistant LLM en production et le fait encore évoluer : recherche documentaire sur un corpus privé, déviation du support, copilotes internes, revue de sinistres ou de contrats. La douleur est la plus vive là où une mauvaise réponse coûte une décision plutôt qu'un clic : pharma, juridique, assurance, finance et R&D régulée.

Deux signes que vous en avez déjà besoin : vous ne savez pas dire si la modification de prompt du mois dernier a aidé, et ce sont vos utilisateurs qui trouvent les problèmes avant vous.

Vous voulez que je jette un œil au vôtre, à l'écrit ?
