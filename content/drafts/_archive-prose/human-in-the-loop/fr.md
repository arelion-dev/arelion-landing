---
title: "Garder un humain dans la boucle"
description: "Pourquoi un KYC piloté par IA a besoin d'une étape de revue humaine, et comment le jugement de l'humain rattrape les erreurs tout en rendant le système meilleur avec le temps."
date: 2026-07-06
tags: ["conformité", "kyc", "human-in-the-loop", "fiabilité", "llm", "document-intelligence"]
pillar: "Automate"
stack: ["TypeScript", "Fastify", "Prisma", "MySQL", "Mistral Document AI", "jugement LLM"]
lang: fr
---

## Le problème

Le KYC est une décision de conformité à fort enjeu. Onboarder le mauvais investisseur, laisser passer une pièce d'identité expirée, valider un document qui appartient à quelqu'un d'autre : le coût n'est pas une mauvaise métrique d'UX, c'est un manquement réglementaire à votre nom.

C'est précisément le genre de décision qu'il ne faut pas automatiser à 100%. L'IA documentaire moderne est bonne, mais elle échoue de la pire façon possible pour la conformité : elle échoue avec assurance. Un classifieur peut décider, avec un score élevé, qu'une facture d'énergie est un justificatif de domicile alors que c'est une lettre de refus. Un modèle d'extraction peut lire une mauvaise date de naissance sur un scan basse définition sans jamais signaler le moindre doute. "Faux avec assurance", ça va pour une barre de recherche. C'est une responsabilité quand le résultat sert à onboarder un client.

La réponse n'est pas de retirer l'IA. C'est de placer un humain là où l'IA est la plus faible : le verdict final.

## Ce qu'on a construit

Pour une fintech qui onboarde des investisseurs dans des fonds réglementés, j'ai construit un pipeline KYC assisté par IA avec une étape de revue humaine obligatoire. L'IA fait le travail lourd et répétitif : lire chaque document, le classer, extraire les champs qui comptent, dérouler les contrôles réglementaires. Elle ne rend jamais le verdict final. C'est un opérateur conformité qui le fait, sur un écran qui montre le raisonnement de l'IA, les preuves, et un lien direct vers chaque pièce source.

Exemple concret : un investisseur dépose une pièce d'identité, un justificatif de domicile et un RIB. Le pipeline OCRise chaque pièce, les classe (CNI, justificatif de domicile, RIB), extrait les champs typés, puis contrôle le dossier dans son ensemble : la pièce est-elle expirée, le justificatif est-il assez récent, l'adresse de la CNI correspond-elle à celle de la facture, manque-t-il quelque chose. L'opérateur voit un verdict de dossier unique et tranche.

## Comment ça marche

Chaque document porte des scores de confiance. L'OCR produit une confiance par page (on garde la pire). La classification produit son propre score de 0 à 1. Ces nombres ne sont pas décoratifs : ils routent le travail.

Le verdict du dossier se construit en deux couches. La première est du code déterministe : règles d'expiration de pièce, cohérence type/emplacement, correspondance d'adresse, complétude du dossier, confiance OCR. Auditables, reproductibles, et seules autorisées à bloquer. Si la pire page OCR passe sous 0,85, le document est signalé pour un contrôle humain. La seconde couche est un jugement LLM qui applique la politique de conformité éditable aux données extraites. Il est strictement consultatif : il peut lever un "à vérifier", jamais un blocage dur.

Le routage en découle. Au moins un blocage : dossier non conforme. Aucun blocage mais au moins un signal léger : passage en revue humaine. Rien du tout : le dossier peut passer. Si la couche LLM est indisponible, un dossier qui passerait sinon est rétrogradé en revue manuelle, jamais validé en silence. Le seuil exact de confiance de classification qui force un coup d'oeil humain est `[à confirmer : seuil exact classificationConfidence]` ; aujourd'hui les signaux fiables de routage vers l'humain sont la faible confiance OCR et les documents non classés ou mal placés.

## La boucle de feedback

Voici la partie honnête, parce qu'elle est facile à survendre. La décision humaine de valider ou d'invalider un dossier **n'entraîne pas** de modèle. Dans le code, cette décision est un enregistrement en append-only, avec commentaire obligatoire quand l'opérateur rejette, dénormalisé sur l'investisseur pour le tri, et écrit dans un journal d'audit. Elle tranche ce cas-là. Elle n'est pas réinjectée dans le LLM comme exemple, et aucun poids n'est mis à jour.

Le système s'améliore réellement avec le temps, mais par un autre chemin, très délibéré : les humains éditent les règles. Quand un opérateur voit l'IA commettre une erreur systématique (une regex qui rejetait le nouveau format de CNI, un signal "revenu trop faible" qui comparait en fait au mauvais montant), un ingénieur encode le correctif comme règle déterministe, validateur ou filtre de faux positif, et le verrouille avec un test de régression bâti sur le cas réel. Modifier un type de document re-valide le corpus existant contre les nouvelles règles. La boucle est donc : le jugement humain fait remonter l'erreur, le code la capture, les tests la maintiennent corrigée. De meilleures règles, pas un modèle réentraîné. C'est une boucle de feedback légitime et auditable, et pour la conformité c'est celle qu'on veut.

## Réutilisable

Ce motif convient à toute décision IA à fort enjeu où être faux avec assurance coûte cher : conformité, triage médical, revue juridique, modération. La forme est toujours la même. Laissez le modèle faire le volume. Faites-lui scorer sa propre confiance. Routez l'incertain et le lourd de conséquences vers un humain. Et traitez chaque correction humaine comme un changement de spec dans vos règles, adossé à un test, pas comme une vague promesse que le modèle "apprendra".

Si vous branchez de l'IA sur une décision que vous ne pouvez pas vous permettre de rater avec assurance, c'est le genre de problème pour lequel je construis. Écrivez-moi et on cadre ça.
