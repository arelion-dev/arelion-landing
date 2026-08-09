---
title: "L'archive devenue produit"
date: "2026-02-12T11:15:00.000Z"
description: "Un média national avait plus de dix ans et 500 000 articles qui ne servaient à rien. J'ai construit la machinerie qui transforme cette archive morte en une gamme de produits d'intelligence, surveillée et vendable."
tags: ["Tech", "AI"]
private: true
---

Plus de dix ans de couverture nationale qui dormaient là, à ne rien faire. Et je ne parle pas au sens figuré : la plupart des tags ne vivaient que sur un seul article, des dizaines de milliers n'en avaient aucun, et les « articles liés » ne remontaient que du bruit. Mon client, un média national, gardait au même endroit tout l'historique politique du pays depuis son lancement, sans pouvoir lui poser la moindre question.

J'ai donc construit la machinerie qui transforme cette archive morte en un historique interrogeable de la vie politique nationale, puis en produits d'intelligence qu'une entreprise paie. Passer un LLM sur chaque article, c'est la partie facile. La partie difficile, c'est de rendre les réponses fiables à l'échelle de toute l'archive, et de les garder à jour indéfiniment. Cet article couvre les deux : les trois couches, avec le code qui fait le vrai travail, et la logique commerciale qu'elles servent.

**500 000 articles et plus. Plus de dix ans. Un historique que vous pouvez enfin interroger.**

## Une archive de cette taille est un jeu de données

Une pile d'articles, ça a des lecteurs. Un jeu de données sur la politique d'un pays, c'est autre chose : ça a des acheteurs qui n'en lisent pas une ligne, lobbyistes, équipes conformité, ambassades, investisseurs.

La recherche plein texte sur l'archive brute ne vous y mène pas, et c'est l'opinion sur laquelle repose tout le projet. La recherche trouve des documents ; un acheteur, lui, veut des entités. « Montre-moi l'article qui cite ce ministre », c'est un problème de recherche. « Montre-moi tous les postes qu'a occupés cette personne et toutes les positions qu'elle a prises sur ce sujet, sous tous les noms qu'elle a portés », c'est un problème de modèle de données, et là vous ne vous en sortez pas à coups de grep. On extrait la structure d'abord.

## Couche 1 : la colonne vertébrale, la prose devient un historique

J'ai passé toute l'archive dans un pipeline d'extraction bâti sur Postgres, avec un extracteur LLM à sortie structurée. Chaque article traverse un seul schéma, et ce schéma est le produit : si un champ n'y figure pas, aucun acheteur ne pourra jamais l'interroger.

```python
# à titre d'illustration : le contrat d'extraction que traverse chaque article
class Statement(BaseModel):
    speaker_surface: str          # nom brut tel qu'imprimé, résolu plus tard
    party: str | None
    role: str | None              # "backbencher", "ministre de X"
    topic: str                    # normalisé contre une liste contrôlée
    claim: str                    # une phrase, extractive uniquement
    claim_span: tuple[int, int]   # offsets caractères dans l'article source
    stance: Literal["for", "against", "neutral"]

class ArticleExtraction(BaseModel):
    article_id: str
    published_at: date
    statements: list[Statement]
```

L'extracteur tourne contre ce modèle, donc le LLM ne peut pas renvoyer une forme que le pipeline n'attend pas.

Une règle a gagné sa place très vite : l'affirmation doit être extractive, et `claim_span` doit pointer sur de vrais caractères de la source. Tout ce que le modèle ne peut pas ancrer dans un span est jeté avant même d'atteindre la base. Ce seul garde-fou, c'est ce qui sépare un jeu de données qu'une équipe conformité accepte de payer d'un moteur à fabriquer du plausible.

**Un schéma. Chaque article. Si ce n'est pas un champ, personne ne peut le vendre.**

Vient ensuite la résolution d'entités, la partie que personne ne montre en démo et dont tout le monde a besoin. `speaker_surface`, c'est le bazar : « J. Dupont », « Jamal Dupont », « le ministre Dupont », « l'honorable député du district nord » désignent tous une même personne au fil des années. Je les résous vers un `person_id` stable avec une cascade qui enchaîne le pas cher avant le cher, plutôt qu'un seul gros appel de modèle.

```python
# à titre d'illustration : résoudre un nom de surface brut vers une personne canonique
def resolve(surface: str, context: str) -> int:
    # 1. blocage : pg_trgm réduit 100k personnes à une poignée de candidats
    candidates = db.query("""
        SELECT person_id, canonical_name, aliases
        FROM person
        WHERE canonical_name %% :s          -- similarité trigramme
        ORDER BY similarity(canonical_name, :s) DESC
        LIMIT 20
    """, s=surface)

    # 2. classer les candidats par embedding du contexte environnant (pgvector)
    ctx_vec = embed(context)
    ranked = rank_by_cosine(candidates, ctx_vec)

    # 3. seuls les 2 premiers ambigus vont au LLM pour trancher
    if ranked and ranked[0].margin > 0.15:
        return ranked[0].person_id            # confiant, aucun appel LLM
    return llm_adjudicate(surface, context, ranked[:2])
```

La cascade, c'est une histoire de coût. Le blocage par `pg_trgm` jette presque tout le graphe avant le moindre calcul vectoriel. Les embeddings sur la phrase environnante tranchent les cas que les noms de surface laissent indécis (deux personnes partagent un nom de famille, le contexte les sépare). Seule une vraie ambiguïté finit par déclencher un appel LLM. Passez ça sur une archive entière, et cet ordre-là, c'est tout le budget.

> **Retour de terrain.** Le premier résolveur reposait sur les seuls embeddings. Pas de blocage, pas de garde-fou déterministe. Il a fusionné deux politiciens partageant un nom de famille courant en un seul `person_id`, et attribué en silence les votes de l'un à l'autre. La similarité cosinus était de 0,94, parce que les deux contextes étaient « parlement, débat budgétaire ». Le correctif : un garde-fou dur (ne jamais fusionner deux personnes ayant occupé le même siège dans le même mandat) plus le blocage, pour que l'ensemble des candidats reste assez petit pour être vérifié à l'œil. La résolution d'entités échoue en silence, alors elle a besoin de garde-fous qui échouent fort.

Le gain, c'est la requête sur laquelle se vend tout le produit. Une phrase anodine sur un simple député, tôt dans l'archive, devient une ligne reliée à sa nomination ministérielle des années plus tard et à ce qu'il a déclaré la semaine dernière, le tout sous un même `person_id`, le tout cité jusqu'à la source.

```sql
-- "tout ce que cette personne a dit sur cette politique, depuis le lancement"
SELECT s.published_at, s.stance, s.claim, s.article_id
FROM statement s
JOIN person p     ON p.person_id = s.person_id
JOIN alias a      ON a.person_id = p.person_id
WHERE a.surface ILIKE :name          -- correspond à tout nom qu'elle a porté
  AND s.topic    = :policy
ORDER BY s.published_at;
-- renvoie l'arc complet, chaque ligne cliquable jusqu'à l'article source
```

**Une demi-journée de fouille manuelle, désormais moins d'une seconde, avec une citation par ligne.**

## Couche 2 : le monitoring garde l'archive à jour sans effectifs

La colonne vertébrale n'est pas un export ponctuel. Chaque article que publie la rédaction atterrit dans une file de travail Postgres et suit exactement le même chemin d'extraction et de résolution. Je tire le travail avec `FOR UPDATE SKIP LOCKED`, ce qui me laisse faire tourner beaucoup de workers en parallèle, sans double traitement et sans broker externe à surveiller.

```sql
-- à titre d'illustration : un worker réclame un lot, les autres sautent les lignes verrouillées
UPDATE ingest_queue
SET status = 'processing', worker = :id
WHERE article_id IN (
    SELECT article_id FROM ingest_queue
    WHERE status = 'pending'
    ORDER BY published_at
    FOR UPDATE SKIP LOCKED
    LIMIT 20
)
RETURNING article_id;
```

Le retraitement est idempotent sur `article_id`, et ça a compté plus que je ne l'imaginais. Quand j'ai amélioré le schéma d'extraction, j'ai rejoué toute l'archive dans la même file, sans jamais écrire de script de backfill séparé. Les nouveaux articles et un re-run du passé partagent un seul chemin de code, donc le jeu de données reste à jour sans la moindre saisie.

Le problème des tags est mort tout seul, comme effet de bord. Le tagging a cessé d'être une corvée humaine pour devenir une sortie du pipeline, et le champ `topic` normalisé a réparé au passage les « articles liés » pour les lecteurs ordinaires. Réparer le modèle de données a réparé la fonctionnalité côté lecteur gratuitement, et c'est en général le signe qu'on a réparé la bonne couche.

**Des dizaines de milliers d'articles sans tags, résolus par le pipeline même qui alimente le produit.**

## Couche 3 : l'analyste rédige, et chaque brouillon cite sa source

Par-dessus la colonne vertébrale, le système rédige. Il sort un baromètre politique hebdomadaire, une veille réglementaire sur ce qui bouge et qui le pousse, des briefings sectoriels, et de l'intelligence électorale qui mêle l'historique au suivi en direct. Il y a aussi un moniteur de concurrence interne que la rédaction garde pour elle.

Chaque brouillon est assemblé à partir de lignes de déclarations, donc chaque phrase porte l'`article_id` d'où elle vient et s'affiche sous forme de citation.

C'est du travail d'analyste junior, la recherche, la structuration, la première passe de prose, exactement ce que la machine fait bien. Mon avis, ici, est peu à la mode : le LLM ne fait qu'écrire de la prose par-dessus des faits que la base détient déjà. Il n'est jamais la source d'un fait dans ce produit.

Ce qui est publié n'est jamais tout à fait ce que la machine a écrit. Les journalistes politiques de la rédaction connaissent cet historique mieux qu'aucun analyste junior, et ce sont eux qui valident, qui coupent, qui ajoutent le jugement. La machine abat le gros du travail à une échelle que personne ne pourrait staffer, et les humains apportent la partie que les clients croient vraiment.

## La logique commerciale d'abord

L'ingénierie n'existe que pour servir un modèle économique public et éprouvé. Politico Pro a pris un sujet qu'une rédaction couvrait déjà et l'a vendu aux gens dont la carrière en dépend. Aujourd'hui, ce produit pèse à peu près la moitié du chiffre de Politico, à un contrat moyen autour de 15 000 dollars par an et un renouvellement proche de 90 %. L'Economist Intelligence Unit tourne sur la même logique.

**~15 000 dollars de contrat moyen, ~90 % de renouvellement, ~la moitié du chiffre. Le modèle est documenté et éprouvé.**

Le mécanisme est simple. Quelqu'un dont le métier dépend de votre information paiera plusieurs fois ce que paie un lecteur, et il le paiera sur un budget d'entreprise. La version de mon client se vend aux mêmes acheteurs corporate et gouvernementaux qu'il connaît déjà par la publicité, sur une autre ligne budgétaire, à une marge qu'aucune campagne pub ne peut approcher.

Pour être précis sur mon rôle : je construis la couche technique qui rend l'archive vendable. Je ne gère pas la monétisation publicitaire, ni le header bidding, ni le yield, et je ne touche pas au montage commercial. C'est l'équipe commerciale du client qui vend le produit que je lui remets.

## La limite honnête : je ne sais pas dimensionner ce marché

Une limite a sa place ici, parce que je l'ai écrite dans la proposition. Politico Pro vend sur le marché du lobbying le plus dense de la planète. Celui de mon client n'est pas celui-là, et le nombre de sièges qu'il peut soutenir à ce niveau de prix reste une question commerciale que le client lit bien mieux que moi.

Ce que je peux affirmer est plus étroit, et ça tient. La matière première est là. La machinerie aussi, maintenant, et c'est du Postgres ennuyeux et inspectable, plus un schéma. Le modèle est éprouvé ailleurs, et les acheteurs dépensent déjà chez ce média, juste sur une autre ligne budgétaire.

## Qui a ce problème

Quiconque a passé des années à produire quelque chose de propriétaire (couverture, décisions, dépôts, données de marché, registres d'adhérents, documentation technique) le monétise sans doute une seule fois, à la création, et plus jamais ensuite. L'archive ne rapporte rien parce que personne ne peut rien lui demander.

Un meilleur CMS ne règle pas ça, et « collez un LLM dessus » non plus. Le correctif tient en trois parties, et l'ordre compte. D'abord la structure, pour qu'on puisse interroger le corpus et que chaque réponse cite une ligne. Ensuite le monitoring, pour qu'il reste à jour sans effectifs. Enfin la rédaction avec validation humaine, pour que la sortie porte votre crédibilité.

Tout se ramène à une question. Y a-t-il quelqu'un dont le métier dépend de ce que vous savez, avec un budget d'entreprise derrière lui ? Si oui, votre archive est un produit que vous n'avez simplement pas encore lancé.
