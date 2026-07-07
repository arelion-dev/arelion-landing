# Plan : Document intelligence at scale

- **Pilier** : Build
- **Titre EN** : Document intelligence at scale
- **Titre FR** : Rendre 100 millions de pages interrogeables en moins d'une seconde
- **Hook** : des décennies de savoir enfermées dans des documents que personne ne retrouve, rendues interrogeables en langage naturel, avec une citation source sur chaque réponse.
- **Lecteurs** : CEO (haut + résultat) / CTO (how it works + hard part)

## The problem
- Grande entreprise, 100M+ pages, 30 marques, une douzaine de langues.
- Beaucoup de scans sans texte extractible, chaque document a ses propres règles de confidentialité.
- Les gens ne trouvent pas ce qui existe déjà, donc ils refont du travail déjà fait.
- Besoin : question en langage naturel, réponse fiable en < 1s, citation cliquable jusqu'à la page exacte.

## What we built
- Un système de recherche + chat documentaire avec un agent de raisonnement devant.
- Demo (input -> output) : Q "quelles formulations mentionnent cette approche après 2020 ?" -> paragraphe synthétisé + citations inline vers page précise + liste de sources classées.
- Garde-fou honnête : si le corpus ne supporte pas de réponse confiante, l'agent le dit et demande de préciser, il n'invente pas.

## How it works (grounded)
- Ingestion : Document AI OCR (rend le texte + bounding boxes des paragraphes ; stockées à part car Vertex AI Search ne renvoie pas les coordonnées).
- Passe Gemini qui extrait la métadonnée métier structurée (codes, auteurs, année, type de doc).
- Chunking, puis embeddings multilingues `gecko-multilingual-002` (768 dims) via gateway LiteLLM.
- Vecteurs dans Pinecone : un index par modèle d'embedding, un namespace par tenant, id vecteur = doc_id, remplacement atomique au re-ingest.
- Scheduler : weighted fair queuing par tenant (pas de famine si une marque upload en masse) + sémaphore de concurrence.
- Retrieval hybride : Pinecone (floor de similarité) + Elasticsearch (plein texte / titres exacts) + filtre métadonnées ; reranker qui dedup par document, bonus titre, agrège les scores de chunks au niveau document.
- Agent chat sur Google ADK, agnostique modèle via LiteLLM : `gemini-3.5-flash` par défaut, override par tour, escalade `gemini-3.1-pro-preview` pour deep-search autonome. Outils exposés en MCP.
- ACL (`read_group` / `acl_group`) appliquée AU retrieval : impossible de remonter un chunk non autorisé.

## The hard part
- Un agent de raisonnement boucle : il relance des recherches jusqu'au timeout. Fix : budgets d'outils (cher = plafonné serré / cheap = plafond haut) + cap du contenu de requête sur CHAQUE appel modèle (la compaction ne tourne qu'après le tour, elle ne sauve pas en pleine boucle).
- Multilingue pas gratuit : une question FR doit atteindre un doc EN et ses synonymes scientifiques -> étape de reformulation cross-langue avant retrieval, embeddings qui tiennent les deux langues dans un espace.
- À cette taille, précision > rappel : un top-k naïf noie la bonne réponse dans les quasi-doublons -> reranker + agrégation doc-level.
- LLM-agnostic via LiteLLM = levier de coût délibéré (petit modèle par défaut, gros seulement quand la tâche le mérite).

## Result
- p95 sous la seconde sur 100M+ pages et 30 marques.
- Citation source sur chaque réponse, ACL par document au retrieval.
- Ingestion continue avec scheduling équitable.
- `[à confirmer : précision du reranking, taux de réutilisation / deflection]`

## Reusable
- Un moteur, pas un produit : OCR + extraction structurée + embeddings multilingues + retrieval hybride + reranker + agent cité avec ACL.
- Applications directes : revue de contrats, KYC / due diligence, traitement de factures.
- CTA async écrit (pas de visio).

## Stack
- Python, Google ADK, LiteLLM, Pinecone, Vertex AI Search, Document AI, Gemini, Elasticsearch, GCP, Terraform

## Angles LinkedIn (1 post par angle)
1. **[contrarian]** Fiabiliser un agent ne se joue pas dans le prompt mais dans les garde-fous (budgets d'outils, cap par appel).
2. **[war story]** Le retrieval multilingue : pourquoi une question FR ratait un doc EN, et comment on l'a réglé.
3. **[how-to]** Citations vérifiables + contrôle d'accès au retrieval : comment une réponse porte toujours sa source.

## À confirmer par toi
- Les 2 métriques `[à confirmer]` ci-dessus (précision reranking, taux de réutilisation).
- On garde "a global enterprise" ou tu assumes L'Oréal en high-level (déjà public sur le site) ?
