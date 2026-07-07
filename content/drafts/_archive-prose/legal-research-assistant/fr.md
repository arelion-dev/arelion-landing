---
title: "Un assistant IA de recherche juridique qui cite ses sources (et refuse d'inventer la loi)"
description: "Comment nous avons livré une plateforme de connaissance juridique : recherche, navigation et chat sur la législation d'une juridiction, avec un agent à tool-calling qui ancre chaque réponse dans des textes réels et porte toujours une citation."
date: 2026-07-06
tags: ["agents IA", "RAG", "legal tech", "tool-calling", "grounding", "Vertex AI Search"]
pillar: "Build"
stack: ["Google ADK", "Gemini", "Vertex AI Search", "Fastify", "Prisma", "Postgres", "MCP", "React", "Vite", "Tailwind", "shadcn/ui"]
lang: "fr"
---

## Le problème

La recherche juridique est lente, et pour une bonne raison : la réponse doit être exacte et traçable jusqu'à un texte réel. Un avocat ne peut pas agir sur "la loi dit probablement X". Il lui faut l'article, le numéro, la version en vigueur et un lien vers le texte officiel.

C'est précisément là qu'un chatbot naïf devient dangereux. Un modèle généraliste produira volontiers un paragraphe fluide citant "le Décret-loi fédéral n° 12 de 2019, article 7" qui n'existe pas. Dans la plupart des domaines, une hallucination est agaçante. En droit, c'est une faute. Un assistant juridique qui invente des textes est strictement pire que pas d'assistant du tout, parce qu'il est à la fois assuré et faux.

Le vrai problème d'ingénierie n'a donc jamais été "le faire discuter". C'était "rendre impossible que la réponse s'écarte du texte source".

## Ce que nous avons construit

Une plateforme de connaissance juridique pour la législation d'une juridiction (ici les régimes émirati, fédéral et des zones franches des Émirats : Dubaï, Fédéral, DIFC, ADGM). Trois surfaces sur un même corpus ancré :

- **Recherche**, sur l'ensemble de la législation.
- **Navigation**, structurée par juridiction, loi, chapitre et article.
- **Chat**, avec un agent IA qui répond aux questions de recherche juridique et attache une citation à chaque loi sur laquelle il s'appuie.

Un exemple assaini du contrat que le chat respecte :

```
Q : Quelles sont les obligations de divulgation d'un prestataire de
    services sur actifs virtuels ?

R : Les prestataires doivent s'enregistrer et se déclarer auprès de
    l'autorité compétente avant d'opérer [1]. Le régulateur peut exiger
    un reporting continu et des registres audités [2].

    [1] Loi de Dubaï n° X de AAAA, article 5. Établit le régime de
        licence et de divulgation pour l'activité sur actifs virtuels.
    [2] Décret de Dubaï n° Y de AAAA, article 12. Obligations de
        supervision et de reporting continues.
```

Les marqueurs `[1]`, `[2]` ne sont pas décoratifs. Ce sont des notes de bas de page cliquables que l'interface rend à partir des propres appels d'outils de l'agent, chacune renvoyant au texte de l'article.

## Comment ça marche

**Ingestion depuis les sources officielles.** Un pipeline énumère les documents des portails législatifs gouvernementaux officiels, les télécharge et empreinte chacun avec un hash SHA-256. Les documents inchangés sont ignorés ; ceux qui changent sont parsés vers une forme normalisée (loi, préambule, chapitres, articles) dans Postgres via Prisma. Chaque parse qui diffère du précédent crée un snapshot versionné, si bien que le corpus conserve son historique au lieu de l'écraser. Les lois parsées sont mises en file et synchronisées vers l'index de recherche.

**Récupération avec Vertex AI Search.** La recherche tourne de bout en bout sur le Discovery Engine de Google, avec expansion de requête, correction orthographique et ranking sémantique. Il renvoie des identifiants de loi et des extraits ; Postgres fournit ensuite le texte d'article complet et faisant foi. Le modèle ne récupère jamais depuis sa propre mémoire, seulement depuis ce que l'index et la base retournent.

**Un agent à tool-calling (Google ADK + Gemini).** Le chat n'est pas un "prompt-and-pray". C'est un agent doté d'une boîte à outils réduite et affûtée : `search_law` (recherche sémantique sur le corpus), `get_article` (texte d'article verbatim), `get_law`, `list_laws`, les outils de version et `cite`. L'agent est instruit d'exécuter plutôt que d'annoncer, de grouper les recherches indépendantes en un seul tour parallèle, et de citer la législation verbatim plutôt que de la paraphraser.

**Pourquoi chaque réponse porte une citation.** L'outil `cite` est obligatoire, et l'ordre de ses appels fixe la numérotation des notes. Avant de rédiger, l'agent doit appeler `cite` une fois par loi distincte ; ce n'est qu'ensuite qu'il écrit la réponse avec les marqueurs `[N]` correspondants. Écrire "(article 9 de la loi 5)" en ligne ne compte pas, car cela ne produit aucune note cliquable et liée à la source. La citation est imposée structurellement, pas simplement demandée.

**Un corpus, deux clients.** Les mêmes outils sont exposés via un serveur MCP, si bien que des clients externes obtiennent le pipeline ancré identique à celui du chat, et non une seconde implémentation plus faible.

## La partie difficile

**Le grounding, pour que le modèle ne puisse pas halluciner la loi.** Le prompt système est net : ne jamais inventer de nom de loi, de numéro de décret ou d'article ; si un article n'existe pas, le dire ; distinguer "la loi dispose" (issu de la base) de "en général" (connaissance du modèle). Quand un filtre de juridiction ne matche rien, la recherche renvoie un flag `broadened`, et l'agent doit traiter ces résultats comme la bibliothèque entière plutôt que comme une correspondance à ce qui a été demandé. Ce seul flag élimine toute une classe de réponses fausses et assurées.

**L'imposition de la citation.** Amener un modèle à appeler un outil de façon fiable avant de rédiger, dans le bon ordre, à chaque fois, est une discipline de prompt-engineering en soi. La récompense : une réponse bien formée est, par construction, une réponse sourcée.

**La structure des juridictions.** Le droit fédéral s'applique dans tous les émirats ; les lois de Dubaï sur le continent ; DIFC et ADGM sont des zones franches de common law dont les lois priment dans leur zone. L'agent doit raisonner sur le régime applicable et signaler les conflits, pas seulement récupérer du texte.

## Résultat

La plateforme livre les trois surfaces (recherche, navigation, chat) sur un corpus versionné et ancré, avec des citations imposées au niveau de l'outil. Les métriques concrètes d'usage et de précision : `[à confirmer]`.

## Réutilisable

Le motif se généralise à tout domaine de connaissance régulé ou à fort enjeu : conformité, fiscalité, protocoles médicaux, politique interne. Ingérer le corpus faisant foi, récupérer avec un vrai moteur de recherche, donner à un agent à tool-calling une boîte à outils étroite, et faire de la citation un appel d'outil requis plutôt qu'une requête polie. On obtient un assistant auquel on peut vraiment se fier, parce qu'il ne peut parler que de sources qu'il peut montrer. Si vous avez un corpus sur lequel des gens prennent des décisions, c'est la forme qui vaut la peine d'être construite.
