---
title: "Wingman : ma version de GitHub Copilot"
date: "2024-07-14T15:18:06.056Z"
description: "Construisez votre propre GitHub Copilot, affiné sur votre base de code privée, qui complète selon vos conventions et n'envoie jamais une ligne de code à un tiers."
tags: ["AI", "Business"]
private: true
---

J'ai entraîné un assistant de code sur une base de code privée, je l'ai livré dans VS Code, et pas une ligne de ce code source n'a quitté le périmètre. Le modèle entraîné complet tient dans un fichier de 305 Mo que vous copiez sur un serveur qui vous appartient.

C'est ça que je construis : votre propre GitHub Copilot, un modèle privé de complétion de code affiné sur votre dépôt, qui complète selon vos conventions, avec vos outils internes et votre nomenclature.

## L'outil sur étagère veut votre code sur les serveurs de quelqu'un d'autre

Chaque assistant de code commercial expédie votre code à un fournisseur et attend qu'une suggestion revienne. Pour la plupart des équipes, ce marché est acceptable. Pour une banque, un fournisseur de la défense, une plateforme de santé, ou quiconque vit sous une clause stricte de propriété intellectuelle ou de résidence des données, c'est rédhibitoire.

Alors ces équipes soit bannissent l'outil et encaissent la productivité perdue, soit l'utilisent et portent une exposition réelle à chaque frappe. Les deux choix ont un prix.

## Ce que vous obtenez

- **Un modèle privé de complétion de code qui est le vôtre.** Il tourne sur votre infrastructure, et votre code reste dans votre périmètre de bout en bout.
- **Des complétions dans votre style maison.** Affiné sur votre dépôt, il suggère vos patterns, vos utilitaires et vos conventions, pas une moyenne tirée de dépôts publics.
- **Petit et portable.** Un adaptateur de 305 Mo se dépose sur votre propre serveur d'inférence et se branche dans VS Code comme l'outil que votre équipe connaît déjà.
- **Peu coûteux à produire.** Le fine-tuning LoRA entraîne 1,17% des paramètres et laisse le modèle de base intact. Je l'ai fait en solo sur des GPU loués, sans laboratoire de recherche derrière moi.

## Pourquoi ça tient

Je l'ai déjà construit et livré de bout en bout : un modèle choisi, affiné sur une base de code privée, déployé sur un serveur d'inférence, puis branché dans une extension d'éditeur qui marche. Entraîner un modèle sur son propre code relevait autrefois du laboratoire de recherche. Ce n'est plus le cas.

Une frontière honnête : si votre code peut aller vers un service tiers, les outils commerciaux sont excellents et moins chers que mon temps. Il y a exactement une raison de construire à la place, et c'est celle pour laquelle vous lisez ceci.

## Pour qui c'est fait

Les équipes qui ne peuvent envoyer leur source nulle part : finance réglementée, défense, santé, et toute entreprise où la base de code est la propriété intellectuelle et où le juridique dit qu'elle reste à la maison.

La seule raison de construire, c'est que le code ne part jamais. Si c'est votre cas, vous voulez que je regarde le vôtre, à l'écrit ?
