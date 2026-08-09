---
title: "L'agent documentaire qui tourne sur SQLite"
date: "2026-01-22T19:30:00.000Z"
description: "IA documentaire locale, sans cloud : je construis une recherche documentaire privée que vous hébergez vous-même, pour que des années de vos propres PDF répondent aux questions simples avec un lien vers la source, sans que rien ne quitte jamais votre machine."
tags: ["AI", "Business"]
private: true
---

Je construis de l'IA documentaire locale sans cloud : une recherche documentaire respectueuse de la vie privée que vous hébergez vous-même, sur des années de vos propres PDF. Vous demandez « combien j'ai payé ce fournisseur l'an dernier », et vous obtenez le montant, la page exacte où il figure, et un lien en un clic vers le fichier pour le vérifier. **Tout le cerveau cherchable tient dans un seul fichier sur votre machine, et 0 document ne le quitte jamais.**

## En ce moment, c'est vous le moteur de recherche de votre entreprise

Quelqu'un de chez vous fait déjà ça à la main. Vendredi soir, dossier par dossier, à traquer une facture qu'il sait exister à travers deux ans de scans. Cette personne est devenue le moteur de recherche, et ça coûte une soirée à chaque fois. Le raccourci cloud, téléverser toute l'archive vers une IA hébergée, revient à confier vos finances, vos papiers d'identité et vos contrats privés à un tiers. La plupart des dirigeants refusent, et ils ont raison.

## Ce que vous obtenez

- **Une réponse en moins de 2 secondes, pas une soirée.** Vingt minutes de fouille deviennent une question.
- **Une recherche documentaire privée, auto-hébergée.** 0 document ne quitte votre machine. Le cerveau cherchable est un fichier que vous sauvegardez en le copiant.
- **Du RAG sans base vectorielle.** Pas de serveur géré, pas de facture d'hébergement mensuelle : **environ 0 dollar d'infrastructure par mois.**
- **Une réponse citée, pas une supposition.** Chaque réponse arrive avec la page exacte et un lien vers le fichier source, pour vérifier en un clic.
- **Elle dit quand elle n'est pas sûre.** Un document vraiment ambigu attend dans une file de vérification de dix secondes au lieu d'être mal classé.

## Pourquoi ça tient

- **Pas un prototype.** Ça tourne aujourd'hui, sur des années de vraie paperasse, pour un chef d'entreprise qui refusait de mettre ses fichiers dans le cloud.
- **Ancré, jamais deviné.** Les réponses viennent de ses propres documents et montrent toujours leur source, donc la machine ne peut pas inventer un chiffre en silence.
- **Bon marché par construction.** La plupart des PDF numériques ne coûtent rien à lire, donc un modèle n'est payé que pour les vrais scans. sqlite-vec et la recherche plein texte vivent dans le même et unique fichier.
- **Une limite honnête.** Mono-machine par conception : parfait pour un propriétaire avec une grosse archive, mauvais pour dix personnes qui y écrivent en même temps.

## Pour qui c'est fait

Un cabinet comptable sur des années de dossiers clients. Un cabinet d'avocats où la réponse est toujours « quelque part dans le dossier ». Un gestionnaire immobilier qui jongle avec des baux sur des dizaines de lots. Un cabinet médical tenu au secret. Tout back-office où une personne est devenue en silence le moteur de recherche.

Si votre équipe refouille sans cesse les mêmes dossiers, voici la forme de la réponse. Vous voulez que je jette un œil à la vôtre, à l'écrit ?
