---
title: "Un agent documentaire multimodal qui tourne sur SQLite"
description: "On a ingéré toute la stack documentaire d'une entreprise, tout OCRisé et classé avec un agent Gemini, et rendu le tout cherchable et interrogeable depuis un CLI. Pas de Pinecone, pas de cluster vectoriel, pas d'infra de recherche cloud. Ça tourne sur un seul fichier SQLite."
date: 2026-07-06
tags: ["sqlite", "sqlite-vec", "fts5", "gemini", "rag", "recherche-hybride", "document-intelligence", "cli"]
pillar: "Build"
stack: ["Python", "SQLite", "sqlite-vec", "FTS5", "Gemini 2.5 Flash", "gemini-embedding-001"]
lang: "fr"
---

## Le problème

La stack documentaire d'un dirigeant, c'est un marécage. Des années de PDF sur un Drive : factures, contrats, relevés bancaires, liasses fiscales, pièces d'identité, baux, papiers de succession. Certains sont des PDF numériques propres, beaucoup sont des photos de téléphone d'un scan d'un fax. Quand il faut retrouver "le montant sur cette facture fournisseur de 2024", soit tu te souviens du dossier, soit tu perds vingt minutes.

Le réflexe en 2026, c'est la base vectorielle. On monte un Pinecone, on câble un pipeline d'embeddings, on ajoute un service de recherche, on colle le tout. Pour la stack d'une seule personne, ça fait beaucoup d'infrastructure à maintenir, à sécuriser et à payer. On a fait le pari inverse.

## Ce qu'on a construit

Un système qu'on a construit et qu'on fait tourner en production sur toute la stack documentaire d'un dirigeant. Il parcourt le Drive, OCRise et classe chaque document avec un agent Gemini, l'embed, et permet de chercher et de répondre à des questions depuis un CLI. Tout le stockage, inventaire, texte OCR, métadonnées, embeddings, index plein texte, tient dans un seul fichier SQLite.

```
$ bb-search "montant TVA facture fournisseur" --mode hybrid --year 2024 --doc-type invoice --pretty

Query: montant TVA facture fournisseur  (hybrid)
 score  type      date        title
 0.031  invoice   2024-03-08  Facture ACME-2024-0312
   · total_ht: 4 200,00 EUR
   · tva: 840,00 EUR
   obsidian: Vault/Factures/2024-03-08_invoice_acme.md
   source:   /Drive/.../2024-03-08_invoice_acme.pdf
```

Une commande en entrée, une réponse classée avec le montant, la ligne de TVA, un lien vers la note, et le chemin du PDF source à ouvrir pour vérifier.

## Comment ça marche

Le stockage, c'est `db.py` : un fichier SQLite en mode WAL. Il contient un inventaire du système de fichiers (une ligne par fichier), les `documents` OCRisés avec métadonnées structurées (titre, résumé, doc_type, date, montant, devise, parties, key_facts), le texte page par page, les `chunks`, et les index de recherche. Deux choses en font un vrai moteur de retrieval.

Les vecteurs vivent dans `sqlite-vec` : une table virtuelle `chunks_vec` déclarée `vec0(embedding float[768])`. Les embeddings viennent de `gemini-embedding-001` en 768 dimensions, avec le hint `RETRIEVAL_DOCUMENT` à l'indexation et `RETRIEVAL_QUERY` à la recherche. Le plein texte vit dans deux tables `FTS5` (`documents_fts`, `chunks_fts`) avec un tokenizer qui replie les diacritiques, pour que les requêtes françaises matchent quels que soient les accents.

L'ingestion, c'est un agent Gemini, pas une boucle bête. `bb-organize` lit les PDF nativement (les octets partent à Gemini en blob `inline_data`), mais seulement quand il le faut : une passe locale `pdftotext` traite les PDF qui portent déjà du texte sélectionnable, et l'OCR vision de Gemini est réservé aux vrais scans. Le même agent classe chaque document sur des axes à vocabulaire contrôlé (personnes, sujets, doc_type) plus des tags libres qui grossissent organiquement, et le range dans le bon dossier. La déduplication par hash de contenu fait qu'un fichier dupliqué clone le document existant, chunks et vecteurs compris, avec zéro nouvel appel Gemini. Ensuite `bb-index` chunk chaque page (conscient des titres markdown, ~900 tokens), embed, et écrit les vecteurs et les lignes FTS.

La recherche (`bb-search`) tourne en sémantique, en mots-clés, ou en hybride. L'hybride fusionne le classement vectoriel et le classement FTS par reciprocal rank fusion. Chaque mode se compose avec des filtres multi-axes (`--person`, `--topic`, `--tag`, `--doc-type`, `--year`, et leurs négations). Les résultats remontent le document, ses key_facts, un lien vers la note Obsidian, et le chemin source. Le tout est aussi exposé en MCP : l'agent qui répond à tes questions interroge le même store, en direct.

## La partie difficile

Pourquoi SQLite plutôt qu'une base vectorielle ? Parce que la taille honnête du problème, c'est les documents d'une entreprise, pas un index web à un milliard de vecteurs. sqlite-vec fait un cosinus brute-force sur l'ensemble des chunks, ce qui à cette échelle est instantané et ne demande aucune infrastructure. Un fichier. Il se sauvegarde par copie. Pas de serveur à sécuriser, pas de cluster à payer quand personne ne cherche.

Le vrai travail d'ingénierie n'est pas la recherche vectorielle, ce sont les parties que tout le monde saute. Le retrieval hybride compte parce que le sémantique pur rate les tokens exacts (un numéro de facture, un IBAN) et le FTS pur rate la paraphrase ; le RRF donne les deux sans régler de poids. Le small-to-big compte parce qu'on matche sur un petit chunk mais on renvoie la page parente complète, pour qu'un total ne soit jamais tronqué à une frontière de chunk. Et le tradeoff Flash/Pro est un vrai levier de coût : la classification et l'OCR tournent sur `gemini-2.5-flash`, et seuls les documents qui reviennent incomplets ont droit à un retry sur `gemini-2.5-pro`. On paie le prix Pro sur les quelques pages difficiles, pas sur toute la stack.

## Résultat

Le système tourne en production sur toute une stack documentaire perso et pro : ingestion, déduplication, réponses depuis le CLI et via MCP. Taille du corpus, nombre de pages, coût par document : [à confirmer: nombres exacts de documents/pages et dépense Gemini du run de production].

## Réutilisable

La forme se généralise à n'importe quelle PME ou travailleur du savoir avec un marécage documentaire : les contrats d'un cabinet, les dossiers d'un praticien, la paperasse d'un fondateur. Les ingrédients sont volontairement ennuyeux : SQLite, un modèle d'embedding, un modèle multimodal, un CLI. Si ton corpus est une entreprise et pas le web ouvert, tu n'as probablement pas besoin d'un cluster vectoriel. Si tu as une stack documentaire que tu ne peux pas chercher, c'est le genre de chose qu'on construit.
