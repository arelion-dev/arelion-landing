---
title: "Un second cerveau pour la rédaction"
date: "2026-07-16T15:20:00.000Z"
description: "Un média national où les équipes demandent, en langage courant, ce que l'institution sait déjà. Plus de dix ans d'articles et le savoir opérationnel de chaque service, en un seul endroit qui répond avec une source."
tags: ["Second brain","RAG"]
private: true
---

Un journaliste de terrain part à la retraite un vendredi. Le lundi, plus de dix ans de contexte ont disparu : quel officiel parle en off, quelle affirmation a explosé il y a des années, pourquoi le média a cessé de couvrir un sujet d'une certaine façon. Personne ne l'a écrit, parce que ça vivait dans une seule tête. Un média national, vieux de plus de dix ans et fort de plus de 500 000 articles publiés, perdait cela à chaque démission.

J'ai construit son second cerveau : un seul endroit où n'importe qui dans l'équipe pose une question en langage courant et obtient une réponse ancrée dans une source. Le tout sur deux couches. La première, un cerveau opérationnel interne, pour que le savoir de l'institution survive à ceux qui le détiennent ; la seconde ouvre les archives publiées et les rend interrogeables.

**La rédaction n'est plus l'otage de ce qui vit dans la tête d'une seule personne.**

## Le savoir qui franchit la porte est le plus coûteux

Chaque service tournait sur une mémoire non documentée. Le développement commercial savait quels accords avaient été tentés, la rédaction connaissait l'histoire d'un sujet, la vidéo et le social savaient ce qui marchait et ce qui avait été retiré, et l'IT savait pourquoi tel processus fragile l'était. Rien de tout ça n'était cherchable.

Le coût apparaissait deux fois. Recruter quelqu'un, c'était des semaines à quémander des réponses, et quand une personne expérimentée s'en allait, son contexte disparaissait avec elle pour de bon.

Le parti pris sur lequel repose tout le projet : le savoir institutionnel n'est en sécurité qu'une fois devenu donnée. Un wiki que personne n'interroge, un Slack que personne ne fouille, un dossier plein de PDF, rien de tout ça n'est du savoir capté. Ça le devient le jour où une machine peut le retrouver, le filtrer selon qui a le droit de le voir, et le sourcer à la demande. Tout ce qui suit sert à transformer la mémoire en lignes de base.

**L'onboarding d'une recrue est passé de semaines à jours.**

## Un seul stockage, deux couches, ingérées de la même façon

J'ai construit une interface unique en langage courant par-dessus deux corpus de savoir, pour qu'un membre de l'équipe n'ait jamais à savoir où vit une réponse. Les deux couches atterrissent dans le même stockage via le même pipeline. Seules les métadonnées diffèrent.

- Le **cerveau opérationnel interne**, construit dès le premier jour : docs de processus, notes de service et mémoire institutionnelle du développement commercial, de la rédaction, de la vidéo, du social et de l'IT.
- La **couche externe** : l'intégralité des archives publiées, plus de 500 000 articles, rendues interrogeables sur plus de dix ans.

```python
def ingest(source):
    for doc in source.documents():          # un article publié OU une note de service
        chunks = chunk(doc.body, target_tokens=800, overlap=120)
        vectors = embed([c.text for c in chunks])   # modèle multilingue, un espace partagé
        for c, vec in zip(chunks, vectors):
            store.upsert(
                id=f"{doc.id}:{c.index}",
                text=c.text,
                embedding=vec,               # pour la recherche sémantique
                tsv=to_tsvector(c.text),     # pour la recherche plein texte, même ligne
                layer=source.layer,          # "archive" | "desk"
                desk=doc.desk,               # None pour les archives publiques
                published_at=doc.published_at,
                entity_ids=[],               # rempli par la colonne vertébrale, section suivante
            )
```

Une seule ligne porte à la fois le vecteur et l'index plein texte, donc un chunk est retrouvable de deux façons sans un second stockage à garder synchronisé. Mon avis : ne séparez pas votre index sémantique et votre index par mots-clés sur deux systèmes. Ils divergent, et un index qui a divergé est pire que pas d'index du tout.

**Un seul pipeline, deux couches, une même forme de ligne : les archives et la mémoire privée de la rédaction ne font qu'une seule surface cherchable.**

## La recherche est hybride, parce que les noms et le sens sont deux recherches différentes

Demandez « qu'a-t-on publié sur ce politicien » et il vous faut du sens. Demandez un nom exact, un numéro de dossier, un lieu orthographié de trois façons, et un vecteur le brouille. Alors la recherche lance les deux et fusionne les rangs.

```python
def search(query, k=20, desks_allowed=None):
    flt = access_filter(desks_allowed)                 # voir plus bas, appliqué dans les deux branches
    q_vec = embed([query])[0]
    semantic = store.knn(q_vec, k=k, filter=flt)       # vecteurs multilingues
    lexical  = store.fts(query, k=k, filter=flt)       # plein texte Postgres, style BM25
    return rrf(semantic, lexical, k_const=60)          # fusion par rang réciproque

def rrf(*ranked_lists, k_const):
    scores = defaultdict(float)
    for lst in ranked_lists:
        for rank, hit in enumerate(lst):
            scores[hit.id] += 1.0 / (k_const + rank)   # le rang, pas le score brut, pour combiner les échelles
    return sorted(scores.items(), key=lambda x: -x[1])
```

Le modèle d'embedding multilingue fait tout le travail ici : une question dans une langue doit retrouver une source écrite dans une autre, ce qui est le quotidien de cette rédaction. La fusion par rang réciproque est la bonne réponse ennuyeuse pour combiner les deux branches. Elle fusionne des rangs, pas des scores bruts, donc une similarité cosinus et un score plein texte ne se disputent jamais sur les unités.

> Retour de terrain. Au début, la fusion par score brut normalisé laissait un seul bon résultat plein texte dominer chaque réponse, parce que les scores plein texte et cosinus vivent sur des échelles différentes et que ma normalisation min-max se faisait par requête. Passer au RRF par rang a réglé ça en un commit. Si vous faites la moyenne de scores venus de deux systèmes de recherche différents, vous faites la moyenne de pommes et de volts.

## La résolution d'entités est la colonne vertébrale qui fait ressentir plus de dix ans comme une seule mémoire

Une personne, un parti, un sujet ou une politique est nommé de cent façons différentes sur plus de dix ans et cinq services : un nom complet, un titre, un sigle, un surnom, une faute d'orthographe. Sans résolution, les archives ne sont qu'un amas de fragments déconnectés. Alors j'ai construit une colonne vertébrale : une entité canonique, de nombreuses formes de surface, et chaque chunk relié aux identifiants canoniques qu'il mentionne.

```python
# La colonne vertébrale : rassembler de nombreuses formes de surface en une seule entité canonique.
def link(mention, context_vec):
    cand = spine.match(
        normalized=normalize(mention.text),   # casefold, retrait des titres, table d'alias
        vector=context_vec,                   # capte « le premier ministre » == la personne nommée
    )
    if cand and cand.score >= 0.86:           # réglé pour la précision, pas le rappel
        return cand.entity_id
    return spine.create(mention)              # un nouveau nœud canonique
```

C'est ce qui transforme la « recherche » en « mémoire ». Un député mentionné tôt dans les archives est relié à la même personne lors de sa nomination des années plus tard, et à sa déclaration de la semaine dernière. Une requête sur la personne remonte toutes les mentions, pas seulement celles qui partagent par hasard vos mots-clés.

> Retour de terrain. Le seuil démarrait à 0,72 et la colonne vertébrale a fusionné deux personnes différentes partageant un nom de famille courant en une seule entité, si bien qu'une requête sur l'une renvoyait l'historique de l'autre. J'ai porté le seuil à 0,86 et rendu les fusions prioritaires sur la précision : il est peu coûteux de fusionner deux nœuds plus tard quand un humain confirme un doublon, et coûteux de défaire un mauvais lien qui a déjà pollué les réponses. En résolution d'entités, la fausse fusion est celle qui fait mal.

## L'accès est appliqué dans la requête, pas dans l'interface

Tout membre de l'équipe ne doit pas voir les notes de chaque service. L'accès est un filtre poussé dans les deux branches de recherche, donc un passage restreint n'est jamais même candidat pour ancrer une réponse.

```python
def access_filter(desks_allowed):
    # les archives publiques sont lisibles par tous ; les notes de service seulement par les services autorisés
    return {"$or": [
        {"layer": "archive"},
        {"layer": "desk", "desk": {"$in": desks_allowed or []}},
    ]}
```

Ma règle : un contrôle d'accès qui vit au-dessus de la recherche, c'est du théâtre. Si un chunk restreint peut être retrouvé et seulement masqué à l'affichage, il a déjà quitté le coffre, et un prompt ou une ligne de log perdue le fait fuiter.

> Retour de terrain. La première version répondait trop bien. Elle remontait volontiers des notes de service internes dans les réponses de quiconque demandait, parce que l'accès était un filtre à l'affichage, pas à la recherche. Le correctif a été de descendre la vérification dans le filtre de requête ci-dessus, pour que les passages restreints ne soient jamais candidats. L'accès en périphérie a l'air propre dans une démo et fuit en production.

## L'agent Gemini répond avec une source ou dit qu'il n'a rien trouvé

Le dernier maillon est un agent Gemini qui ne lit que les passages retrouvés, les cite, et étiquette chaque affirmation avec son identifiant de source. Si la recherche revient vide, il le dit au lieu d'inventer.

```python
SYSTEM = (
    "Réponds uniquement à partir des passages fournis. "
    "Après chaque affirmation, cite son identifiant de source sous la forme [id]. "
    "Si les passages ne répondent pas à la question, dis que tu n'as rien trouvé. "
    "N'utilise jamais de connaissance extérieure."
)

def answer(question, desks_allowed):
    passages = search(question, k=20, desks_allowed=desks_allowed)
    if not passages:
        return "Je n'ai rien trouvé là-dessus dans ce à quoi vous avez accès."
    prompt = render(question, passages)      # chaque passage préfixé par [son id]
    return gemini.generate(
        system=SYSTEM,
        contents=prompt,
        temperature=0.1,                     # le travail est de citer, pas d'écrire
    )
```

Température basse à dessein : le travail de l'agent est d'être un bibliothécaire fidèle, pas un styliste. La source est le contrat de confiance. Un membre de l'équipe clique jusqu'au vieil article ou à la note de service et voit la source de ses propres yeux. C'est la seule raison pour laquelle quelqu'un dans une rédaction fait confiance à une machine plutôt qu'à un collègue.

```text
"qui couvrait la privatisation du port en 2019 ?"
  -> recherche hybride sur articles + notes de service (filtrée par accès)
  -> la résolution d'entités relie le sujet, le service, les signatures
  -> réponse ancrée, sourcée [article-id] par signature
```

**Des réponses en quelques secondes sur plus de 500 000 articles et plus de dix ans de savoir de service, chaque affirmation cliquable jusqu'à sa source.**

## La limite honnête : il capte ce qui a été écrit, pas ce qui n'a jamais été dit

Le second cerveau n'est aussi profond que ce que l'institution a réellement consigné. Il capte les docs de processus, le travail publié et le savoir de service que les gens ont pris le temps d'écrire. Le savoir vraiment tacite, l'intuition qu'un journaliste n'a jamais mise en mots, part encore avec lui.

Ce qui a changé, c'est que bien davantage est désormais captable et retrouvable, et qu'il existe enfin un endroit où ça vaut la peine de l'écrire. On revient au principe de départ : le savoir n'est en sécurité qu'une fois devenu donnée, et voici la machine qui rend l'effort de l'écrire rentable.

## Qui a ce problème

Toute institution où le savoir vit dans les têtes expérimentées et part avec elles : hôpitaux, cabinets d'avocats, agences, équipes d'ingénierie, organismes publics. Le test tient en une question. Quand votre personne la plus expérimentée démissionne, combien de ce qu'elle savait quelqu'un d'autre peut-il encore retrouver ? Si la réponse est « pas grand-chose », aucun wiki ne réglera ce risque-là. Ce qu'il vous faut, c'est un second cerveau, et personne ne l'a encore construit.
