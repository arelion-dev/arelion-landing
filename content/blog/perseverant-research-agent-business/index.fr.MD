---
title: "L'agent de recherche qui n'abandonne pas"
date: "2026-08-05T11:00:00.000Z"
description: "Une IA qui répond aux questions à partir de vos propres documents, cite une source sur chaque ligne, et ne s'arrête pas tant qu'elle n'a pas répondu à toute votre question, pas seulement à la partie facile."
tags: ["AI", "Business"]
private: true
---

Demandez à votre chatbot de comparer quatre choses et il répond sur deux, avec fluidité, puis s'arrête. Je construis l'agent de recherche RAG autonome qui ne le fait pas : il répond à chaque partie d'une question en plusieurs parties à partir de vos propres documents, et cite chaque affirmation à la page exacte. Je l'ai livré pour un grand groupe de cosmétiques, sur des décennies de ses propres rapports, brevets et contrats, la plupart enfermés dans des scans que personne ne pouvait chercher.

## La demi-réponse assurée, c'est celle qui vous coûte cher

Un scientifique demande de comparer quatre bases de shampoing. L'IA en décrit deux, a l'air certaine, et s'arrête. Personne ne remarque que les deux autres manquent avant qu'une formulation soit choisie sur la moitié des données.

Une réponse vide, on la revérifie. Une réponse fluide et à moitié complète, on la croit et on agit dessus : une clause tirée du mauvais fichier, une limite enfouie à la page 40, un coût qui reste invisible jusqu'à ce qu'il éclate. Vous payez déjà pour ça, en travail refait et en décisions prises sur des preuves partielles. Rien de tout ça n'apparaît dans une démo ; ça ressort des semaines plus tard, quand quelqu'un rouvre le fichier.

## Ce que vous obtenez

- **Des réponses qui couvrent toute la question.** Demandez sur quatre choses, obtenez quatre réponses sourcées, pas les deux premières trouvées.
- **Une source sur chaque ligne.** Chaque affirmation pointe vers la page exacte, ou l'agent dit « aucune donnée trouvée » là où vos documents sont muets. Aucun fait inventé.
- **Des décennies de documents morts rendues cherchables.** Scans, une douzaine de langues, natif numérique, le tout en un seul corpus interrogeable.
- **Les réponses en plusieurs parties sont passées d'environ 40% à 98% de complétude, avec 0 demi-réponse silencieuse en production.** (à titre illustratif)
- **Des heures de chasse aux documents réduites à une seule réponse sourcée**, désormais utilisée par 4 équipes.

## Pourquoi ça tient

- **Elle répond à partir de vos documents, jamais de mémoire.** Si ce n'est pas dans votre corpus, ça ne sort pas.
- **Elle ne voit que ce que chaque personne est autorisée à voir.** L'accès est appliqué sur les données elles-mêmes, donc chacun n'interroge que sa propre tranche du corpus.
- **Le gain se mesure.** Un interrupteur désactive la diligence, donc je lance les mêmes questions notées dans les deux sens et je lis le delta. C'est bâti sur Google ADK, si bien que la règle « ne pas répondre tant qu'une partie est ouverte » tourne comme un flux de contrôle que le modèle ne peut pas sauter.
- **Une frontière honnête :** c'est conçu pour les questions auxquelles vos documents peuvent réellement répondre. Il vous dira quand ils ne le peuvent pas, plutôt que de deviner.

## Pour qui c'est fait

Quiconque est assis sur une décennie de documents impossibles à chercher : dossiers pharma, fichiers KYC bancaires, bibliothèques de clauses juridiques, sinistres d'assurance. Et quiconque dont l'IA donne déjà des réponses qui ont l'air complètes sans l'être.

Vous voulez que je regarde les vôtres, à l'écrit ?
