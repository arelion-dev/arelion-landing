# Plan : Legal-research AI assistant that cites its sources

- **Pilier** : Build
- **Titre EN** : Building a legal-research AI assistant that cites its sources (and refuses to invent law)
- **Titre FR** : Un assistant IA de recherche juridique qui cite ses sources (et refuse d'inventer la loi)
- **Hook** : une plateforme de savoir juridique (recherche, navigation, chat sur la législation d'une juridiction) avec un agent tool-calling qui ancre chaque réponse dans des textes réels et porte toujours une citation.
- **Lecteurs** : CEO (haut + résultat) / CTO (how it works + hard part)

## The problem
- La recherche juridique est lente pour une bonne raison : la réponse doit être juste ET traçable jusqu'à un texte réel. Un avocat ne peut pas agir sur "la loi dit probablement X". Il lui faut l'article, le numéro, la version en vigueur, un lien vers le texte officiel.
- C'est là qu'un chatbot naïf devient dangereux : un modèle généraliste produit avec assurance "Décret-loi fédéral n° 12 de 2019, article 7" qui n'existe pas. Dans la plupart des domaines une hallucination est agaçante. En droit, c'est une faute. Un assistant qui invente des textes est pire que pas d'assistant : sûr de lui ET faux en même temps.
- Le vrai problème d'ingénierie n'a jamais été "le faire discuter", mais "rendre impossible que la réponse s'écarte du texte source".

## What we built
- Plateforme de savoir juridique pour la législation d'une juridiction (ici les régimes émirat, fédéral et free-zone des EAU : Dubai, Federal, DIFC, ADGM). Trois surfaces sur un corpus ancré :
  - **Search** sur tout le corps législatif.
  - **Browse** structuré par juridiction, loi, chapitre, article.
  - **Chat** avec un agent qui répond aux questions de recherche et attache une citation à chaque loi utilisée.
- Demo (input -> output) : Q "quelles obligations de disclosure pour un prestataire de services d'actifs virtuels ?" -> réponse avec marqueurs `[1]`, `[2]` = footnotes cliquables rendues par l'UI depuis les propres tool calls de l'agent, chacune liée au texte de l'article.

## How it works (grounded)
- **Ingestion depuis sources officielles** : un pipeline énumère les docs des portails législatifs gouvernementaux officiels, les télécharge, fingerprint chaque doc en SHA-256. Inchangé = ignoré. Modifié = parsé vers une forme normalisée (law, preamble, chapters, articles) en Postgres via Prisma. Chaque parse qui diffère du précédent crée un snapshot versionné (le corpus garde son historique au lieu d'écraser). Lois parsées mises en queue et synchronisées vers l'index de recherche.
- **Retrieval avec Vertex AI Search** : recherche sur Google Discovery Engine de bout en bout, avec query expansion, spell correction, ranking sémantique. Renvoie des law IDs + snippets ; Postgres fournit ensuite le texte d'article complet et faisant foi. Le modèle ne récupère jamais depuis sa mémoire, seulement depuis ce que l'index et la DB renvoient.
- **Agent tool-calling (Google ADK + Gemini)** : boîte à outils réduite et affûtée : `search_law` (sémantique), `get_article` (verbatim), `get_law`, `list_laws`, outils de version, `cite`. L'agent est instruit d'exécuter plutôt qu'annoncer, de batcher les lookups indépendants en un tour parallèle, et de citer la législation verbatim au lieu de paraphraser.
- **Pourquoi chaque réponse porte une citation** : l'outil `cite` est obligatoire et son ordre d'appel = la numérotation des footnotes. Avant d'écrire de la prose, l'agent doit appeler `cite` une fois par loi distincte ; ensuite seulement il écrit avec les marqueurs `[N]`. Écrire "(article 9 de la loi 5)" inline ne compte pas (pas de footnote cliquable sourcée). Citation imposée structurellement, pas demandée.
- **Un corpus, deux clients** : les mêmes outils exposés sur un serveur MCP, donc les clients externes ont le pipeline ancré identique au chat, pas une seconde implémentation plus faible.

## The hard part
- **Grounding, pour que le modèle ne puisse pas halluciner la loi** : system prompt sans détour (ne jamais inventer noms de loi, numéros de décret, numéros d'article ; si un article n'existe pas, le dire ; distinguer "la loi dispose" (DB) de "en général" (connaissance du modèle)). Quand un filtre de juridiction ne matche rien, la recherche renvoie un flag `broadened` et l'agent est instruit de traiter ces résultats comme la bibliothèque entière, pas comme une correspondance. Ce flag seul prévient toute une classe de réponses fausses et confiantes.
- **Enforcement de citation** : obtenir qu'un modèle appelle fiablement un outil avant d'écrire, dans le bon ordre, à chaque fois, est une discipline de prompt-engineering en soi. Récompense : une réponse bien formée est, par construction, une réponse sourcée.
- **Structure des juridictions** : le fédéral s'applique à tous les émirats ; les lois de Dubai sur le mainland ; DIFC et ADGM sont des free zones common-law dont les lois priment dans leur zone. L'agent doit raisonner sur quel régime gouverne et flag les conflits, pas juste chercher du texte.

## Result
- La plateforme livre les trois surfaces (search, browse, chat) sur un corpus versionné et ancré, citations imposées au niveau outil.
- Usage concret et métriques de précision : `[à confirmer]`.

## Reusable
- Se généralise à tout domaine de savoir régulé ou à fort enjeu : conformité, fiscalité, guidelines médicales, policy interne.
- Recette : ingérer le corpus faisant foi, chercher avec un vrai moteur, donner à un agent tool-calling une boîte à outils étroite, faire de la citation un appel d'outil requis et non une requête polie.

## Stack
- Google ADK, Gemini, Vertex AI Search, Fastify, Prisma, Postgres, MCP, React, Vite, Tailwind, shadcn/ui

## Angles LinkedIn (1 post par angle)
1. **[le danger]** Un chatbot juridique qui invente la loi est un danger, pas un gadget : deux garde-fous (le modèle ne lit jamais sa mémoire, citation cliquable imposée au niveau outil). Une réponse bien formée est, par construction, sourcée.
2. **[l'agent tool-calling]** Contre le "RAG un-seul-appel + prie" : un vrai agent avec boîte à outils affûtée (search_law, get_article, cite...), exécuter pas annoncer, grouper en parallèle, s'arrêter tôt, plus le flag de juridiction vide.
3. **[la vraie difficulté du RAG]** Peu de gens parlent du corpus : le dur n'est pas le modèle, c'est le garder vrai et à jour (SHA-256, versionner chaque parse). Un bon RAG = 80% de discipline sur les données, 20% de prompt.

## À confirmer par toi
- La métrique `[à confirmer]` (usage et précision en prod).
- On garde la juridiction EAU (Dubai/Federal/DIFC/ADGM) nommée ou on la générise davantage ?
