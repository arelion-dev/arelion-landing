---
title: "Intelligence documentaire à grande échelle"
description: "Comment nous avons rendu 100M+ de pages multilingues et à confidentialité variable interrogeables en moins d'une seconde, avec une citation source sur chaque affirmation."
date: 2026-07-06
tags: ["rag", "search", "gcp", "vector-search", "adk", "document-ai"]
pillar: "Build"
stack: ["Python", "Google ADK", "LiteLLM", "Pinecone", "Vertex AI Search", "Document AI", "Gemini", "Elasticsearch", "GCP", "Terraform"]
lang: "fr"
---

## Le problème

Une entreprise mondiale avait des décennies de savoir institutionnel enfermées dans un fonds documentaire : rapports de recherche, brevets, spécifications, contrats, répartis sur 30 marques et une dizaine de langues. L'archive dépassait 100 millions de pages, en grande partie des images scannées sans texte extractible, et chaque document portait ses propres règles de confidentialité. Les équipes ne retrouvaient pas ce qui existait déjà, donc elles refaisaient un travail déjà fait. La demande était simple à énoncer et difficile à construire : permettre à quiconque de poser une question en langage naturel et d'obtenir une réponse fiable en moins d'une seconde, avec une citation cliquable vers la page exacte.

## Ce que nous avons construit

Un système de recherche et de chat documentaire qui ingère l'intégralité du corpus, le rend interrogeable sémantiquement, et place un agent de raisonnement devant. Vous posez une question en français ou en anglais ; l'agent la reformule, cherche dans la bibliothèque, lit les pages qui comptent, et rédige une réponse sourcée où chaque affirmation renvoie à son origine.

Exemple anonymisé. Entrée : "Quelles formulations mentionnent cette approche technique après 2020 ?" Sortie : un court paragraphe synthétique, avec des citations en ligne du type [[cite|rapport_4471.pdf|cite]] pointant vers la page 5 d'un document précis, plus une liste classée des documents sources. Si le corpus ne permet pas de répondre avec certitude, l'agent le dit et demande de préciser la question plutôt que d'en inventer une réponse.

## Comment ça marche

L'ingestion est une chaîne. Les PDF scannés passent par l'OCR de Document AI, qui renvoie non seulement le texte mais aussi les rectangles englobants des paragraphes, ce qui permet au frontend de surligner la zone exacte d'où vient un extrait (Vertex AI Search ne renvoie pas les coordonnées, nous les stockons donc à part). Une passe Gemini extrait des métadonnées métier structurées (codes, auteurs, année, type de document) depuis le texte OCR. Le document est découpé en chunks, et chaque chunk est vectorisé par un modèle d'embedding multilingue (`gecko-multilingual-002`, 768 dimensions) servi via une passerelle de modèles centrale derrière LiteLLM. Les chunks atterrissent dans Pinecone : un index par modèle d'embedding, un namespace par tenant, avec des identifiants de vecteurs indexés sur l'id du document, si bien que les vecteurs d'un document peuvent être listés et remplacés proprement à chaque ré-ingestion.

Le scheduler qui pilote l'ingestion utilise un ordonnancement équitable pondéré (weighted fair queuing) entre tenants, pour qu'un import massif d'une marque n'affame pas les autres, avec un sémaphore de concurrence qui borne le débit.

La récupération est hybride. Une requête sémantique interroge Pinecone avec un seuil de similarité ; une requête plein texte interroge Elasticsearch pour les correspondances exactes de mots-clés et de titres ; une requête de métadonnées filtre sur les champs extraits. Les résultats des passes filtrée et non filtrée sont fusionnés par un reranker qui déduplique par document, récompense les correspondances de titre, et agrège les scores des chunks au niveau du document (un document avec plusieurs chunks bien notés passe devant un document au seul coup de chance).

La couche de chat est un agent bâti sur Google ADK, agnostique au modèle grâce à LiteLLM. Il utilise `gemini-3.5-flash` par défaut, laisse l'appelant changer de modèle à chaque tour, et bascule sur `gemini-3.1-pro-preview` pour des runs de deep search autonomes qui fouillent la bibliothèque pendant plusieurs minutes et rédigent un dossier sourcé. Les outils de récupération sont exposés à l'agent via MCP. Le contrôle d'accès n'est pas rapporté après coup : chaque recherche porte l'ACL de l'utilisateur (`read_group` / `acl_group`), réduite à l'intersection la plus restrictive de ses groupes, si bien que la récupération ne peut physiquement pas faire remonter un chunk que l'utilisateur n'a pas le droit de voir.

## La partie difficile

L'échelle change chaque décision. L'ingénierie intéressante n'était pas le chemin nominal, c'étaient les garde-fous.

Un agent de raisonnement boucle. Laissé seul, il relance des recherches, empile des résultats, et fait gonfler la requête jusqu'à ce que l'appel à la passerelle expire. Nous avons classé les outils en coûteux (recherche distante, plafond serré par tour) et bon marché (lectures dans un document déjà trouvé, simple plafond de sécurité), et nous bornons le contenu de la requête à chaque appel modèle, pas seulement en fin de tour, car la compaction ne s'exécute qu'après invocation et ne peut pas vous sauver en pleine boucle.

Le multilingue n'est pas gratuit. Une question en français sur un ingrédient doit atteindre un document en anglais et ses synonymes scientifiques, donc l'étape de reformulation étend les termes entre langues avant la récupération, et le modèle d'embedding doit tenir les deux langues dans un même espace.

À cette taille, la précision prime sur le rappel. Avec 100M+ de pages, un top-k naïf noie la bonne réponse sous les quasi-doublons ; le reranker et l'agrégation au niveau document existent précisément pour ça. Et rester agnostique au modèle via LiteLLM est un levier de coût délibéré : modèle bon marché par défaut, modèle cher seulement quand la tâche le mérite.

## Résultat

Recherche sémantique en p95 sous la seconde sur 100M+ de pages et 30 marques, avec une citation source sur chaque réponse et un contrôle d'accès par document appliqué au moment de la récupération. L'ingestion tourne en continu avec un ordonnancement équitable entre tenants. Métriques de précision et de qualité de réponse : [à confirmer : précision du reranking, taux de réutilisation/déflection].

## Réutilisable

C'est un moteur, pas un produit unique. Le même schéma (OCR, extraction structurée, embeddings multilingues, récupération hybride, un reranker, et un agent citant ses sources avec contrôle d'accès) s'applique directement à la revue de contrats, aux dossiers KYC et de due diligence, et au traitement de factures. Si vous êtes assis sur un patrimoine documentaire vaste, désordonné et confidentiel dans lequel vos équipes ne retrouvent rien, c'est le problème que ça résout. Ravi d'en discuter par écrit selon la forme du vôtre.
