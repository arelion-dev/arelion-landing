---
title: "Comment benchmarker un modèle OCR (TEDS, CER, LLM-as-judge)"
date: "2026-06-04T09:30:00.000Z"
description: "Avant de remplacer ou d'acheter un moteur de document-AI, il vous faut un benchmark auquel vous faites confiance. Je construis le jeu doré et le harnais qui vous disent quel moteur est réellement meilleur, et ce qu'il coûte par page."
tags: ["OCR", "Business"]
private: true
---

# Avant d'acheter un moteur OCR, achetez le benchmark qui prouve lequel est meilleur

Je construis l'évaluation qui rend défendable une décision de document-AI : un jeu de référence annoté à la main, un harnais de notation sur chaque moteur candidat, et un chiffre que votre équipe finance peut utiliser, le coût par page à votre débit réel.

J'ai fait exactement ça pour le pipeline documentaire d'un groupe mondial de beauté, sur quatre systèmes candidats.

## Le statu quo coûteux : vous choisissez sur une démo

Chaque démo fournisseur marche. Évidemment : c'est le fournisseur qui a choisi les documents et la métrique. Ensuite vous signez, vous pointez le moteur sur votre propre archive, et les défaillances apparaissent : des tableaux qui reviennent brouillés, des lignes inventées que personne ne repère, et des documents qui ne finissent jamais de se traiter et croupissent dans une file pendant une journée entière.

La vraie facture est plus discrète que le devis : un remplacement que vous ne pouvez pas justifier devant le board, une migration finie à moitié, un prix par page que vous acceptez faute de point de comparaison. Dans le pipeline que j'ai benchmarké, un composant inventait des tableaux de 82 176 cellules sur des pages qui en contenaient 43. Personne n'avait de chiffre pour le montrer.

## Ce que vous obtenez

- **Un jeu de référence doré construit sur vos documents.** Une vérité terrain annotée à la main sur votre propre matériel, pour qu'elle corresponde à votre archive. C'est l'actif qui continue de payer : chaque futur moteur, version de modèle ou changement de prompt est noté contre lui en un après-midi.
- **Un face-à-face équitable sur chaque option.** Votre système actuel, l'option open-source, le SaaS payant, le build proposé, notés à l'aveugle pour qu'aucun candidat n'ait l'avantage du terrain.
- **Un contrôle d'hallucination par-dessus le score de précision.** Le contenu inventé est la défaillance qui survit à la relecture, parce qu'il a l'air fini. Je le note comme sa propre métrique. Sur le pipeline que j'ai traité, ce score est passé de 4,7 à 8,1 sur 10.
- **La fiabilité mesurée sous charge.** Sur les 21 documents les plus durs, le sortant en a terminé zéro, un coincé pendant 24 heures. Le remplaçant a terminé 21 sur 21.
- **Le coût par page à votre débit réel.** Mesuré à partir d'exécutions réelles. L'option gagnante est ressortie à 1,61 $ pour 1 000 pages, contre environ 4,80 $ pour le SaaS payant et 6,00 $ sur une configuration GPU qui semblait évidente et n'a pas payé.

## Pourquoi vous pouvez faire confiance au résultat

Le benchmark est construit pour être capable de dire non. Dans celui-ci, il l'a fait : le SaaS payant est resté devant sur la précision brute, et je l'ai écrit sur la slide. La recommandation a tenu quand même, parce que le remplaçant égalait le plafond open-source, supprimait les défaillances qui bloquaient le pipeline, et coûtait un tiers de l'alternative.

La limite honnête : un benchmark vous dit quel moteur est meilleur sur vos documents aujourd'hui. Il ne vous dit pas qu'un écart de deux points est réel. Je dis quelles différences sont de qualité décisionnelle et lesquelles sont du bruit.

## Pour qui c'est fait

Les équipes sur le point de remplacer, renouveler ou acheter un moteur de document-AI en volume : assureurs et banques traitant relevés et sinistres, équipes juridiques et conformité sur des archives scannées, groupes R&D dont les données vivent dans des tableaux à l'intérieur de PDF, et quiconque à qui l'on facture un prix par page par un fournisseur qui a aussi choisi la métrique de qualité.

Vous voulez que je jette un œil à votre pipeline documentaire et vous dise ce qu'un benchmark équitable devrait mesurer, à l'écrit ?
