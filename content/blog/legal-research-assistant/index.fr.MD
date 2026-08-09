---
title: "Un assistant de recherche juridique"
date: "2025-11-13T17:05:00.000Z"
description: "Un assistant de recherche juridique sur la législation d'une juridiction, construit pour ne pouvoir répondre qu'à partir d'un droit qui existe réellement. Le plus intéressant, c'est le code qui empêche le chat de citer une loi qu'il ne peut pas prouver."
tags: ["Tech", "AI"]
private: true
---

Un avocat a besoin de l'article exact, par son numéro, celui qui tient quand un régulateur le relit. Un résumé du droit ne lui sert à rien. Et « l'outil l'a dit » n'est pas une réponse qu'un régulateur accepte, donc un outil de recherche incapable de nommer l'article et de prouver qu'il existe n'a rien fait d'utile.

J'ai construit un assistant de recherche juridique sur la législation d'une juridiction. Chaque réponse cite un article réel avec une URL source cliquable, ou dit clairement qu'elle ne peut pas. Le chat en lui-même, c'est le strict minimum ; ce qui mérite un article, c'est le code qui rend ce chat structurellement incapable de citer une loi qu'il ne peut pas prouver.

**0 citation hallucinée n'atteint l'utilisateur.**

## Une seule citation fabriquée tue le produit

Quand un avocat lit « Article 12 du Décret n° 4 de 2022 » dans un paragraphe assuré, il agit dessus. Si cet article n'existe pas, si le numéro est décalé d'un cran, ou si le texte appartient à un émirat voisin, l'outil n'a pas fait gagner de temps : il a posé une mine dans le conseil de quelqu'un.

Les modèles de langage sont fluides par nature, et cette fluidité est le mode de défaillance : la mauvaise réponse ressemble trait pour trait à la bonne. Demandez à un appel Gemini brut « l'article sur les pénalités de résiliation anticipée » et il produira volontiers « Article 34, Décret n° 9 de 2019 ». Format correct, numéro plausible, assurance totale, et aucun article de la sorte dans les textes.

Dans un domaine réglementé, la barre n'est pas « correct la plupart du temps ». Une seule référence fabriquée, remontée une seule fois, tue la confiance dans tout le produit.

Mon avis, et toute la conception repose dessus : vous ne laissez jamais le modèle produire la citation. Vous le laissez produire une *demande* de citation, puis vous la vérifiez contre des données que vous contrôlez. Retrouver, puis vérifier. Le modèle raisonne sur la question, mais il n'a jamais le droit d'affirmer ce que dit la loi.

## Le modèle raisonne, la base de données possède les mots

J'ai construit l'assistant comme un agent Gemini sur l'Agent Development Kit (ADK) de Google, en pilotant la boucle avec Gemini 2.5 Flash pour la sélection d'outils et une passe Pro pour la rédaction finale. Il ne parle jamais librement du droit : il travaille avec trois outils, et seulement trois :

```python
# L'agent ne recoit jamais de texte libre qu'il pourrait paraphraser comme "la loi".
# Il obtient des outils. Chacun renvoie des donnees structurees, pas de la prose.
tools = [
    search_legislation,  # Vertex AI Search sur le corpus, renvoie des ids de loi + extraits
    open_article,        # lecture exacte (law_id, article_no) depuis Postgres, texte verbatim
    cite_law,            # emet une demande de citation, qui passe le portique avant le rendu
]
```

La recherche tourne sur **Vertex AI Search** au-dessus du corpus. Chaque citation verbatim d'un texte juridique revient d'une base **Postgres 15** via **Prisma**, clée par `(law_id, article_no)`, jamais depuis la mémoire du modèle. Les outils sont exposés à l'agent via MCP, donc la même surface vérifiée alimente l'interface de chat et toute intégration en aval.

Cette séparation, c'est tout le levier : le modèle fait le raisonnement pendant que la base de données possède les mots. Par-dessus se trouve ce que j'appelle le **portique de citation**, trois vérifications que chaque citation franchit avant de pouvoir s'afficher. Aucune ne demande quoi que ce soit au modèle ; ce sont de simples lignes de code, exécutées contre la sortie de recherche et le corpus.

**Chaque réponse cite un article réel, ou dit qu'elle ne peut pas.**

## Vérification 1 du portique : la liste blanche élimine les lois inventées

Quand l'agent décide de citer, je ne fais pas confiance à l'id de loi qu'il produit. Je l'intersecte avec l'ensemble exact des ids de loi que la recherche vient de renvoyer pour *cette* question. Tout ce qui tombe hors de cet ensemble n'est jamais venu du corpus, donc ne peut pas être cité.

```python
def enforce_allowlist(citations, retrieved_ids):
    # retrieved_ids: ids de loi que Vertex AI Search a renvoyes pour CETTE requete, ce tour
    allowed = set(retrieved_ids)
    kept = []
    for c in citations:
        if c.law_id in allowed:
            kept.append(c)
        else:
            # invente, ou tire des donnees d'entrainement. Il n'a jamais remonte. On l'elimine.
            log.warning("dropped citation %s: not_in_retrieval", c.law_id)
    return kept
```

L'ensemble est cadré au tour, pas au corpus entier. Une loi qui existe mais que cette requête n'a pas retrouvée est quand même éliminée, parce qu'une citation que le modèle n'a pas pu atteindre par la recherche est une citation qu'il a devinée. Deviner, c'est exactement ce que je retire.

## Vérification 2 du portique : prouver le numéro d'article ou l'éliminer

Une loi réelle ne fait pas un article réel. Le modèle adore accoler un « Article 47 » net à une loi qui s'arrête à l'Article 40. Alors pour chaque citation survivante, je cherche la paire précise `(law_id, article_no)` dans le corpus versionné. Si la paire n'y est pas, je garde la référence de loi et j'annule le numéro, plutôt que de laisser tenir un article fabriqué.

```python
async def verify_article(law_id, article_no):
    row = await db.article.find_first(where={
        "law_id": law_id,
        "number": normalize_article_no(article_no),  # voir le retour de terrain ci-dessous
        "status": "current",
    })
    if row is None:
        # la loi est reelle, ce numero d'article n'est pas prouve. On retrograde, on n'invente pas.
        return Citation(law_id=law_id, article=None, downgraded=True)
    return Citation(law_id=law_id, article=row.number, source_url=row.source_url)
```

Une citation n'est jamais plus précise que ce que je peux prouver. Rétrogradée, elle pointe encore vers une loi réelle sur le portail officiel ; elle refuse simplement de nommer un article qu'elle ne trouve pas.

> Retour de terrain. La preuve d'article a éliminé silencieusement des citations valides pendant deux jours. La numérotation législative n'est pas faite d'entiers propres : le corpus contient « 47 », « 47 bis », « 47 ter », des chapitres en chiffres romains, et des articles abrogés puis réédités. Le modèle émettait « Article 47 bis », ma recherche le comparait comme l'entier 47, ratait, et rétrogradait un article parfaitement réel. Le correctif a été un `normalize_article_no` qui canonicalise les formes de suffixe et compare sur la chaîne stockée, pas sur un entier parsé. Leçon : dans un corpus juridique, l'identifiant est une chaîne avec des règles métier, et le traiter comme un nombre est un bug qui attend la seule requête qui a besoin de « bis ».

## Vérification 3 du portique : élargir la juridiction, mais le signaler

Le corpus ne couvre pas chaque régime de façon égale, et faire passer la loi d'un émirat pour celle d'un autre est l'erreur silencieuse classique. Quand une recherche filtrée ne trouve rien, elle s'élargit automatiquement en une recherche sur toute la bibliothèque et renvoie un drapeau `broadened`, que le modèle est forcé de divulguer.

```python
def search_legislation(query, jurisdiction):
    hits = vertex_search(query, filter=f'jurisdiction = "{jurisdiction}"')
    if hits:
        return {"hits": hits, "broadened": False}
    # rien sous la juridiction demandee. On se rabat, mais sans jamais feindre la couverture.
    hits = vertex_search(query, filter=None)
    return {"hits": hits, "broadened": True}
```

Le drapeau n'est pas cosmétique. Un résultat `broadened: True` change le contrat de réponse : le modèle doit énoncer que son filtre de juridiction a trouvé zéro résultat et que ce sont des trouvailles à l'échelle de la bibliothèque, pas une correspondance avec ce qui était demandé. L'élargissement silencieux, c'est ainsi qu'on dit à un avocat d'un émirat qu'une règle de l'émirat d'à côté s'applique à lui. Le drapeau rend cette défaillance impossible à cacher.

**Trois vérifications indépendantes tournent avant qu'une citation ne s'affiche.**

## SHA-256 au niveau de l'article rend une réponse reproductible après un changement de loi

Le contenu est ingéré uniquement depuis les portails législatifs gouvernementaux officiels, parsé en lois et articles, puis empreinté avec SHA-256 au niveau de l'article. Quand une source republie, le condensé change : une nouvelle version est écrite, l'ancienne est conservée. Rien n'entre dans le chemin de réponse qui ne vienne d'un texte officiel avec une version traçable.

```python
digest = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
existing = await db.article.find_unique(law_id=law_id, number=article_no)

if existing is None:
    await db.article.create(law_id, article_no, text=raw_text, sha256=digest, version=1)
elif existing.sha256 != digest:
    # la source officielle a republie le texte. On le versionne, on garde le precedent.
    await db.article.create(law_id, article_no, text=raw_text,
                            sha256=digest, version=existing.version + 1, status="current")
    await db.article.update(existing.id, status="superseded")
# condense identique -> aucune ecriture. Le corpus reste stable octet par octet a travers les re-ingestions.
```

Parce que l'empreinte est adressée par contenu, une ré-ingestion d'un portail inchangé est une opération nulle, et un article modifié devient une nouvelle version au lieu d'une réécriture sur place. Chaque citation que le portique émet porte le `source_url` et la version des octets exacts qu'elle a cités, donc une réponse reste reproductible même après amendement de la loi.

Par-dessus cela, les règles du prompt interdisent d'inventer des numéros de loi, de décret ou d'article, et forcent une séparation nette : « la loi énonce », qui est sourcé via les outils, contre « en général », qui est la propre connaissance du modèle, étiquetée comme telle.

Le prompt est la couche la plus faible et je le traite comme tel : une politesse envers le modèle, rien sur quoi je m'appuierais. Le vrai contrôle, ce sont les trois portiques.

**Chaque citation juridique est empreintée et versionnée, de la source à la réponse.**

## Ce qu'il refuse de faire

Limite honnête : le portique rend certaines réponses moins précises qu'un humain aiguisé ne les donnerait. Quand le numéro d'article ne se vérifie pas, je l'élimine et ne garde que la loi, donc un lecteur obtient parfois « cette loi régit le point » au lieu de « l'Article 47 le régit ». J'ai choisi une réponse correcte et plus grossière plutôt qu'une supposition à l'air précis. L'autre bord, c'est la couverture. L'assistant ne répondra pas pour un régime absent du corpus : il élargit la recherche et le signale, puis s'abstient plutôt que de tendre vers une loi qu'il ne détient pas.

Le coût de cette posture est réel. Un concurrent assuré qui saute le portique aura l'air plus aiguisé sur une démo, parce qu'il nomme toujours un article. Il a raison jusqu'à la seule fois où il a tort, et cette seule fois est toute la responsabilité. Je préfère livrer l'outil qui dit parfois « je ne peux confirmer que la loi, pas l'article » que celui qui est impressionnant et faux une fois par trimestre.

## Des notes de bas de page qui se résolvent, en environ deux secondes

L'assistant répond avec des notes de bas de page qui se résolvent vers des lois réelles sur un portail officiel, à un p95 autour de deux secondes pour une question en une partie. Quand il ne peut pas vérifier quelque chose, il le dit : aucune législation correspondante, un numéro d'article qu'il ne confirmera pas, une juridiction hors de sa couverture.

Un utilisateur qui interroge sur une juridiction hors du corpus s'entend dire que la couverture ne s'y étend pas ; on ne lui tend jamais un paragraphe assuré citant une loi qui régit ailleurs. Une réponse avec note de bas de page se vérifie en un clic, quand une réponse sans note affiche d'elle-même ses limites.

**Le temps de recherche sur un point cité baisse d'environ 60 %.**

## Qui a ce problème

Dès la première ligne, je traite l'ancrage comme la forme du système : cette affirmation peut-elle être vérifiée contre une source que je contrôle ? Retrouver, puis vérifier, telle est l'architecture, et le modèle est un composant à l'intérieur.

Si votre équipe répond à des questions à partir d'un corps de règles, c'est votre problème sous un autre costume. Un responsable conformité qui doit citer chapitre et verset à un régulateur. Recommandations médicales, règles fiscales, normes de sécurité : partout où une réponse fausse mais fluide porte un coût réel, le même schéma tient.

La recette est la même partout : retrouver depuis un corpus de confiance et versionné, laisser le modèle raisonner sans jamais le laisser inventer, intersecter chaque citation avec ce que la recherche a réellement trouvé, prouver les détails contre une base de données, et faire dire au système, clairement, quand il ne sait pas.
