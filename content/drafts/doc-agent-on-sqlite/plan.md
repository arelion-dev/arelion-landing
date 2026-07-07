# Plan : A multimodal document agent that runs on SQLite

- **Pilier** : Build
- **Titre EN** : A multimodal document agent that runs on SQLite
- **Titre FR** : Un agent documentaire multimodal qui tourne sur un fichier SQLite
- **Hook** : toute la stack documentaire d'une entreprise, OCRisée, classée, embeddée et interrogeable depuis un CLI, sans Pinecone, sans cluster, sans infra de recherche cloud. Un fichier SQLite.
- **Lecteurs** : CEO (haut + résultat) / CTO (how it works + hard part)

## The problem
- Le stack documentaire d'un dirigeant est un marécage : des années de PDF sur un Drive (factures, contrats, relevés, liasses, IDs, baux, succession).
- Certains sont des PDF numériques propres, beaucoup sont des photos de scans de fax.
- Retrouver "le montant sur cette facture fournisseur 2024" = se souvenir du dossier ou perdre 20 minutes.
- Réflexe 2026 : base vectorielle managée. Pour les docs d'UNE personne, c'est beaucoup d'infra à maintenir, sécuriser, payer. On a pris l'autre pari.

## What we built
- Système en production sur toute la stack documentaire d'un dirigeant : parcourt le Drive, OCR + classe chaque doc avec un agent Gemini, embed, cherche et répond depuis un CLI.
- Tout le store (inventaire, texte OCR, métadonnées, embeddings, index plein texte) = un seul fichier SQLite.
- Demo (input -> output) : `bb-search "supplier invoice VAT amount" --mode hybrid --year 2024 --doc-type invoice` -> réponse classée avec le montant (total_ht 4200 EUR, TVA 840 EUR), lien vers la note Obsidian, chemin du PDF source à ouvrir pour vérifier.

## How it works (grounded)
- Store = `db.py` : un fichier SQLite en mode WAL. Inventaire fichiers (1 ligne/fichier), `documents` OCRisés + métadonnées structurées (title, summary, doc_type, date, montant, currency, parties, key_facts), texte par page, `chunks`, index de recherche.
- Vecteurs dans `sqlite-vec` : table virtuelle `chunks_vec` déclarée `vec0(embedding float[768])`. Embeddings `gemini-embedding-001` en 768 dims, hint `RETRIEVAL_DOCUMENT` à l'index, `RETRIEVAL_QUERY` à la recherche.
- Plein texte : deux tables `FTS5` (`documents_fts`, `chunks_fts`) avec tokenizer qui plie les diacritiques (le FR matche sans accent).
- Ingestion = agent Gemini, pas une boucle bête. `bb-organize` lit les PDF nativement (bytes en `inline_data`) mais seulement quand il faut : `pdftotext` local pour les PDF déjà textuels, OCR vision Gemini réservé aux vrais scans.
- Le même agent classe sur axes à vocabulaire contrôlé (persons, topics, doc_type) + tags libres, et route vers le bon dossier. Dedup par content-hash : un doublon clone le doc existant (chunks + vecteurs), zéro appel Gemini.
- `bb-index` chunke chaque page (markdown-heading aware, ~900 tokens), embed, écrit vecteurs + lignes FTS.
- `bb-search` : sémantique, keyword ou hybride (fusion des deux classements par reciprocal rank fusion). Filtres multi-axes (`--person`, `--topic`, `--tag`, `--doc-type`, `--year` + négations). Exposé aussi en MCP : l'agent qui répond interroge le même store, en direct.

## The hard part
- Pourquoi SQLite plutôt qu'une vector DB ? La taille honnête du problème = les docs d'UNE boîte, pas un index web à un milliard de vecteurs. sqlite-vec fait un cosinus brute-force sur les chunks : à cette échelle, instantané, zéro infra. Un fichier, backup par copie, rien à sécuriser ni payer au repos.
- Le vrai travail n'est pas la recherche vectorielle, ce sont les parties que tout le monde saute :
  - Retrieval hybride : le sémantique rate les tokens exacts (numéro de facture, IBAN), le FTS rate la paraphrase. RRF donne les deux sans régler de poids.
  - Small-to-big : on matche sur un petit chunk, on renvoie la page parente complète. Un total n'est jamais coupé à une frontière de chunk.
  - Tradeoff Flash/Pro : classification et OCR sur `gemini-2.5-flash`, seuls les docs qui reviennent incomplets ont UN retry sur `gemini-2.5-pro`. Prix Pro sur les quelques pages dures, pas sur toute la stack.

## Result
- Tourne en production sur une stack documentaire perso-et-pro complète : ingère, dédup, répond depuis le CLI et en MCP.
- `[à confirmer : taille du corpus, nombre de pages, coût Gemini par document du run de prod]`

## Reusable
- Se généralise à toute PME ou knowledge worker avec un marécage documentaire : contrats d'un cabinet, dossiers d'une pratique, paperasse d'un fondateur.
- Ingrédients volontairement ennuyeux : SQLite, un modèle d'embedding, un modèle multimodal, un CLI.
- Si ton corpus est une entreprise et pas le web ouvert, tu n'as sûrement pas besoin d'un cluster vectoriel.

## Stack
- Python, SQLite, sqlite-vec, FTS5, Gemini 2.5 Flash, gemini-embedding-001

## Angles LinkedIn (1 post par angle)
1. **[contrarian]** J'ai indexé toute la stack documentaire d'une entreprise avec SQLite, pas de Pinecone : arrête de dimensionner comme Google quand ton problème tient dans un fichier.
2. **[hybride]** Ton RAG rate le numéro de facture : le sémantique seul ne suffit pas, sqlite-vec + FTS5 fusionnés par RRF, sans régler de poids.
3. **[levier de coût]** Payer le gros modèle sur chaque page c'est du gâchis : Flash par défaut, un seul retry Pro sur les docs incomplets, pdftotext d'abord, dedup par hash.
4. **[le CLI comme produit]** Une commande, une réponse vérifiable : small-to-big (page parente complète) + le même store exposé en MCP. Pas de dashboard, pas de SaaS.

## À confirmer par toi
- La métrique `[à confirmer]` ci-dessus (taille corpus, pages, coût Gemini du run de prod).
- On garde "a business owner" en générique ou tu assumes le cas perso (bb-* = ton propre Drive) en high-level ?
