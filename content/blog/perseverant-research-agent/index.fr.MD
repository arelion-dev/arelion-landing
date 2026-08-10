---
title: "L'agent de recherche qui n'abandonne pas"
date: "2026-08-05T11:00:00.000Z"
description: "Un agent de recherche documentaire autonome sur un corpus d'entreprise privé, construit pour ne jamais livrer une demi-réponse assurée à une question en plusieurs parties."
tags: ["Tech", "AI"]
private: true
---

Un grand groupe de cosmétiques m'a fait construire un agent de recherche sur son corpus privé. Des décennies de rapports de laboratoire R&D, de brevets et de contrats signés, dans une douzaine de langues, le plus souvent enfermés dans des PDF scannés que personne ne pouvait fouiller.

**Les réponses en plusieurs parties sont passées d'environ 40% à 98% de complétude, et 0 demi-réponse silencieuse n'a été livrée depuis.**

Le RAG lui-même est standard. Ce qui suit parle d'un échec précis, et du code qui le corrige.

## L'échec que tout le monde livre

Demandez à un LLM outillé de comparer huit choses et il fait ceci :

```text
utilisateur : documente la performance des bases A, B, C, D. cite une source pour chacune.
agent : [semantic_search "performance A B C D"]   ← une seule recherche mélangée
agent : "Voici la performance de A et B : ..."     ← livre avec 2 sur 4
```

Une seule recherche, les deux premiers résultats, et une réponse fluide qui se lit comme terminée alors qu'il lui manque la moitié de la question. Une réponse à moitié vide qui a l'air complète est pire que pas de réponse : le lecteur lui fait confiance et passe à autre chose.

Le prompt ne corrige pas ça. « Sois exhaustif, ne laisse pas de trou » est une suggestion que le modèle lâche à la seconde où il peut produire du texte fluide. Alors j'ai arrêté de demander, et je l'ai rendu structurel.

![La boucle d'application de la couverture](assets/perseverance-loop.png)

## Correctif 1 : forcer l'agent à déclarer une checklist

Un nouvel outil, `track_coverage`, force le modèle à noter les parties avant de chercher, et renvoie une directive au lieu d'un rappel poli :

```python
def track_coverage(subgoals=None, covered=None):
    """Enregistre les sous-objectifs d'une requête en plusieurs parties, puis les coche.
    Uniquement pour un vrai travail multi-parties, jamais une question unique."""
    state.setdefault("_coverage", {"subgoals": [], "covered": []})
    if subgoals:
        state["_coverage"]["subgoals"] = dedup(subgoals)   # PLAN
    if covered:
        state["_coverage"]["covered"] = dedup(state["_coverage"]["covered"] + covered)  # MISE À JOUR

    open_ = [s for s in state["_coverage"]["subgoals"]
             if s not in state["_coverage"]["covered"]]
    if open_:
        return (f"{len(open_)} sous-objectifs sur {len(subgoals or [])} sont encore OUVERTS. "
                "Ne réponds PAS encore. Cherche les ouverts maintenant, "
                "UNE entité par requête (ne jamais grouper les noms).")
    return "Tous les sous-objectifs sont couverts. Rédige la réponse finale, en citant une source pour chaque partie."
```

« Une entité par requête » compte pour une raison concrète : huit noms dans une même requête d'embedding diluent le classement, et la plupart ne remontent jamais. Alors j'ai conçu le prompt et le budget ensemble, pour pousser l'agent vers huit recherches séparées plutôt qu'une seule requête mélangée.

## Correctif 2 : dimensionner le budget selon le plan déclaré

Laissé sans plafond, un agent brûle des tokens à l'infini. Plafonné à plat à 5 recherches, il ne peut littéralement pas couvrir 8 bases. Alors le plafond grandit avec la checklist que le modèle a enregistrée lui-même :

```python
_BASE, _PER_SUBGOAL, _CEILING = 5, 2, 15

def expensive_budget(state):
    if PERSEVERANCE_OFF:
        return _BASE
    n = len(state.get("_coverage", {}).get("subgoals", []))
    return min(_BASE + _PER_SUBGOAL * n, _CEILING)   # 4 bases -> 13 recherches
```

L'agent gagne plus de budget de recherche en s'engageant sur un plan, et le plafond dur de 15 garde la latence bornée.

**Une question en huit parties lance désormais huit recherches séparées, contre l'unique recherche mélangée qui renvoyait deux réponses.**

## Correctif 3 : une barrière qu'il ne peut pas contourner par la parole

C'est l'astuce qui fait tout tenir. Google ADK permet de lancer un callback après chaque tour du modèle. Quand le modèle essaie de conclure alors que des sous-objectifs sont encore ouverts et qu'il reste du budget, je jette sa réponse et je lui remets un appel d'outil forcé, ce qui renvoie la boucle vers la recherche :

```python
def enforce_coverage(callback_ctx, llm_response):
    cov = state.get("_coverage")
    open_ = has_open_subgoals(cov)
    is_answer = llm_response.text and not llm_response.function_calls

    if (PERSEVERANCE_OFF or not open_ or not is_answer
            or budget_spent(state) or reprompts(state) >= 3):
        return None                       # laisse passer la réponse

    state["_coverage_reprompts"] += 1
    return LlmResponse(content=Content(role="model", parts=[Part(
        function_call=FunctionCall(
            id=f"coverage-gate-{uuid4().hex[:12]}",   # DOIT être non vide (voir plus bas)
            name="track_coverage", args={}))]))
```

Ça transforme une suggestion de prompt en flux de contrôle avec lequel le modèle ne peut pas discuter. Je le borne à 3 re-prompts pour qu'il ne puisse jamais se bloquer, et il passe intact quand la persévérance est désactivée, que rien n'est ouvert, ou que le budget est épuisé.

> **Retour de terrain.** La première version laissait cet `id` vide. Gemini sur Vertex renvoie un 500 avec « Missing corresponding tool call for tool response », parce qu'il apparie un appel à son résultat par id. Id vide, pas d'appariement, crash net. C'est maintenant une assertion dans un test de non-régression.

## Prouvez-le, ne le croyez pas

Chaque bouton a un interrupteur off, `PERSEVERANCE_OFF=1`, qui désactive d'un coup le dimensionnement du budget et la barrière. Il sert aussi de levier A/B : lancez le même jeu noté avec l'un et l'autre et lisez le delta.

Les cas d'éval sont ancrés. Je les ai extraits de vraies conversations de production, confirmé chaque vérité terrain contre le document source, puis figés comme cas de non-régression. Le cas canonique encode le comportement exact sous forme de trajectoire de référence :

```json
{
  "eval_id": "four_bases_perf",
  "prompt": "Performance des bases A, B, C, D. Cite une source pour chacune, ou 'no data found'.",
  "reference_trajectory": [
    {"name": "track_coverage", "args": {"subgoals": ["A", "B", "C", "D"]}},
    {"name": "semantic_search", "args": {"query": "performance base A"}},
    {"name": "semantic_search", "args": {"query": "performance base B"}},
    {"name": "semantic_search", "args": {"query": "performance base C"}},
    {"name": "semantic_search", "args": {"query": "performance base D"}},
    {"name": "track_coverage", "args": {"covered": ["A", "B", "C", "D"]}}
  ],
  "reference_answer": "A: ... [src p.4]  B: ... [src p.2]  C: ... [src p.7]  D: no data found."
}
```

Deux scores. Une métrique de trajectoire vérifie que l'agent a bien décomposé la demande et cherché chaque entité de son côté. Un juge LLM, lancé à travers la même passerelle privée avec une grille stricte de 0 à 1, note la réponse contre cette référence. Une seule ligne ratée échoue dans son coin (notée `NaN`) et n'interrompt jamais le run.

**Avec la persévérance désactivée, le jeu noté a obtenu 0,41 en complétude. Activée, 0,98. Mêmes questions, même corpus, un seul flag.**

## La plomberie en dessous est délibérément ennuyeuse

La couche de persévérance ne gagne son pain que parce que tout ce qui est en dessous est terne et correct.

**La lecture est native d'abord.** Un PDF scanné est une image de texte ; un PDF nativement numérique a déjà le texte. Alors le pipeline extrait gratuitement la couche embarquée quand elle existe et ne paie l'OCR que sur les vrais scans, à un DPI plus élevé, là où c'est réellement nécessaire :

```python
words = page.get_text("words")
if page.rotation in (0, None) and len("".join(w.text for w in words)) >= 40:
    text, dpi = lift_text_layer(words), 200   # gratuit, zéro erreur OCR
else:
    text, dpi = ocr(render(page, dpi=300)), 300   # scans uniquement, plus de pixels
```

**La lecture native d'abord évite l'OCR sur environ 70% des pages, à zéro erreur OCR partout où existe une vraie couche de texte.**

Les tableaux obtiennent une vraie grille de cellules (un modèle de structure de tableau associe les mots aux cellules par la géométrie, donc les colonnes survivent), et un tableau halluciné à 200 colonnes est écarté pendant que le reste du document reste : vide plutôt qu'inventé. Les images répétées comme les logos et les symboles de danger sont légendées une fois par un modèle de vision, puis mises en cache par hash de contenu, donc personne ne paie deux fois pour décrire la même image.

**La file d'attente, c'est la base de données.** Pas de Kafka, pas de Celery, pas de Pub/Sub. Un document est une ligne avec un `status`, et les workers réclament du travail avec une seule primitive Postgres :

```sql
SELECT * FROM docs
WHERE status = 'OCR_DONE'
ORDER BY updated_at DESC
FOR UPDATE SKIP LOCKED   -- plusieurs workers, une table, jamais deux fois le même doc
LIMIT 5;
```

Moins de pièces mobiles, et un seul endroit où regarder quand quelque chose traîne. Une file d'attente équitable pondérée choisit quel cas d'usage servir ensuite, pour qu'un chargement de masse ponctuel de 80k certificats ne puisse pas affamer le scientifique qui attend un seul nouveau rapport.

**La récupération, c'est trois recherches, pas une.** Sémantique (vecteurs multilingues, pour qu'une requête en français trouve un doc en anglais), plein texte (pour le numéro de brevet qu'un vecteur brouille), et titre. Puis une échelle du petit au grand. Un résultat fait remonter la page exacte ; à partir de là, l'agent fait un grep dans un doc connu, récupère des pages précises, et ne tire un document entier que lorsqu'il est court. Un budget de caractères partagé plafonne l'ensemble, pour que rien ne déborde le modèle.

L'accès est appliqué à l'intérieur de la requête elle-même. Deux personnes de deux équipes posent la même question et obtiennent des réponses depuis deux tranches différentes du corpus, et aucune ne peut savoir que l'autre tranche existe.

## Qui a ce problème

Brancher une IA sur un dossier de documents, c'est une démo d'un après-midi. La rendre fidèle aux tableaux, sourcée sur chaque phrase, étanche sur l'accès, et exhaustive sur les questions en plusieurs parties, c'est un autre métier.

L'architecture se transfère telle quelle. Quiconque a une décennie de documents que personne ne peut chercher a le problème de lecture et de récupération : dossiers pharma, fichiers de contrats et de KYC, clauses juridiques, sinistres d'assurance en cinq mises en page. Et quiconque dont les réponses de l'IA ont l'air complètes sans l'être a le problème de persévérance. C'est la partie que presque personne ne construit, parce qu'elle vit dans la boucle de l'agent, là où le prompt n'atteint pas.
