---
title: "Des contrats de sortie en production"
date: "2025-10-23T08:35:00.000Z"
description: "Une question en langage courant devient une requête de base de données dans un grand groupe, servie à des milliers d'utilisateurs. Le plus intéressant, c'est le code qui ne fait jamais confiance à une seule ligne écrite par le modèle."
tags: ["Tech", "AI"]
private: true
---

Il est 3h du matin, un job est tombé. Un LLM a renvoyé une sortie presque valide : un champ décalé, une ligne sur laquelle le parseur s'est étranglé, et derrière, un processus en aval qui s'écroule. Dans les logs, ça avait l'air propre, et c'est bien le piège, parce que la forme en dessous était fausse. Si on vous a déjà réveillé pour ça, vous connaissez déjà le problème dont parle cet article.

J'ai construit la couche qui empêche que ça arrive. Le système laisse des milliers de personnes, dans un grand groupe, poser des questions en langage courant, et transforme chacune en requête live sur la base, sous de vraies règles d'accès. Le text-to-SQL, c'est la moitié facile. Ce qui mérite qu'on en parle, c'est le code qui traite le modèle comme une source à laquelle je ne fais jamais confiance, pour qu'une mauvaise sortie n'atteigne jamais un utilisateur.

À la fin, vous aurez les quatre pièces que je livre sur chaque projet de ce type : un contrat de requête qui rejette les champs inconnus, une barrière AST qui rejette par type de nœud plutôt que par chaîne de caractères, une réécriture par tenant qui échoue en mode fermé, et une boucle de retry qui bloque au lieu de plier.

**Sorties malformées du modèle interceptées avant exécution : ~100%.**

## Un modèle juste 95 pour cent du temps est le genre dangereux

Les 5 pour cent faux ressemblent exactement aux 95 justes. Demandez-lui de compter des documents, et il pourrait lire les fichiers d'une équipe voisine. Demandez-lui de filtrer par date, et il pourrait, en une ligne parfaitement plausible, référencer une table qu'il n'était jamais censé toucher. Pire : un `DROP TABLE customers` glissé dans ce qui se lit comme une simple recherche.

Rien de tout ça ne lève d'erreur. La requête s'exécute, renvoie un nombre, le nombre entre dans une réponse, et la réponse a l'air sûre d'elle. Le risque métier, c'est que le modèle réussisse la mauvaise chose, en silence et à grande échelle, devant des gens qui ne voient jamais la requête en dessous.

Les correctifs naïfs ne tiennent pas. Dire au modèle de bien se tenir dans le prompt, c'est une suggestion qu'il peut ignorer, et qu'un attaquant peut lui faire oublier en le baratinant. Filtrer le texte à la recherche de mots-clés interdits, c'est un jeu que vous perdez dès qu'une commande interdite s'écrit un peu différemment : `DROP/**/TABLE`, un `drop` en casse mixte, un sosie unicode, une écriture planquée dans une CTE.

Ma règle sur ce projet : la sortie du modèle est une entrée non fiable, exactement comme un champ de formulaire venu de l'internet ouvert. Vous ne feriez pas passer une regex sur du SQL utilisateur pour le déclarer sûr, alors j'applique au modèle la même exigence.

## Le corps de la requête ne peut rien faire entrer en douce

On commence à la porte. Le corps de la requête est validé avec Pydantic v2, `model_config = ConfigDict(extra="forbid")`. Ce seul réglage fait la différence entre un appelant qui ne peut envoyer que `question` et `tenant_id`, et un appelant qui glisse un champ `access_groups` que la couche modèle lit ensuite et croit sur parole. Par défaut, Pydantic supprime les champs inconnus sans rien dire, et c'est précisément le mauvais défaut pour une frontière de sécurité. Je veux un 422 bien bruyant à la place, pour que l'appelant l'apprenne sur-le-champ.

```python
# Représentatif, pas le code source du client.
from pydantic import BaseModel, ConfigDict, field_validator

class QueryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    question: str
    tenant_id: str

    @field_validator("question")
    @classmethod
    def non_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("la question ne doit pas être vide")
        if len(v) > 2000:
            raise ValueError("question trop longue")
        return v

    @field_validator("tenant_id")
    @classmethod
    def opaque_id(cls, v: str) -> str:
        # tenant_id est émis par le serveur ; rejeter tout ce qui n'a pas la forme que je génère
        if not v.isalnum() or len(v) != 26:
            raise ValueError("tenant_id malformé")
        return v
```

Le validateur de `tenant_id` compte plus qu'il n'y paraît. Le tenant est un identifiant opaque émis par le serveur, que l'appelant ne peut pas choisir librement, et le validateur rejette tout ce qui n'a pas la forme exacte que mon code génère. Ça ferme la voie du « il suffit de passer l'id d'un autre tenant » avant qu'un seul token n'atteigne le modèle.

## Le modèle propose, le code dispose

On ne sécurise pas un modèle de langage en le priant gentiment, alors je n'ai jamais fait confiance au texte généré. Chaque requête passe par une barrière que j'appelle `assert_read_only`. Elle parse le SQL en arbre syntaxique avec `sqlglot` avant toute exécution, puis je parcours l'arbre entier. Un `DROP` ou un `INSERT` est rejeté parce que la forme parsée de la requête contient un type de nœud que j'interdis, même trois niveaux plus bas dans une sous-requête ou une CTE, là où un filtre par mots-clés comme un relecteur humain passeraient à côté.

```python
# Représentatif, pas le code source du client. Rejeter par type de nœud AST, pas par chaîne.
import sqlglot
from sqlglot import expressions as exp

# Tout ce qui n'est pas une lecture est interdit par TYPE, la profondeur de sous-requête est sans importance.
FORBIDDEN = (
    exp.Insert, exp.Update, exp.Delete, exp.Drop,
    exp.Alter, exp.Create, exp.Command, exp.Merge,
)

class Reject(Exception):
    ...

def assert_read_only(sql: str, allowed_table: str, max_limit: int) -> exp.Expression:
    try:
        tree = sqlglot.parse_one(sql, read="postgres")   # malformé -> ParseError
    except sqlglot.ParseError as e:
        raise Reject(f"SQL non parsable : {e}")

    # 1. le nœud racine doit être un SELECT, rien d'autre n'est une lecture
    if not isinstance(tree, exp.Select):
        raise Reject(f"pas un SELECT : {type(tree).__name__}")

    # 2. aucune écriture / DDL / commande brute où que ce soit dans l'arbre
    if next(tree.find_all(*FORBIDDEN), None) is not None:
        raise Reject("écriture, DDL ou commande brute dans la requête")

    # 3. allowlist mono-table : chaque vraie table doit être celle que cette fonctionnalité possède
    for t in tree.find_all(exp.Table):
        if t.name != allowed_table:
            raise Reject(f"table non autorisée : {t.name}")

    # 4. les fonctions fichier / réseau / admin sont exclues (pg_read_file, dblink, copy...)
    for fn in tree.find_all(exp.Anonymous):
        if fn.name.lower() in BANNED_FUNCTIONS:
            raise Reject(f"fonction non autorisée : {fn.name}")

    # 5. jeu de résultats borné, toujours
    limit = tree.args.get("limit")
    if limit is None or int(limit.expression.this) > max_limit:
        raise Reject("LIMIT manquant ou surdimensionné")

    return tree
```

Pourquoi l'AST plutôt que la regex, dit simplement : une regex raisonne sur des caractères, et le SQL est un arbre. `sqlglot` me donne l'arbre que la base va réellement exécuter, donc je décide sur la structure même que voit le moteur. `find_all` par type, ça veut dire qu'un `DELETE` planqué dans un `SELECT ... WHERE id IN (DELETE ...)` est intercepté par les trois mêmes lignes qui interceptent un `DELETE` de premier niveau. Aucune liste de mots-clés à maintenir synchronisée, aucune ruse d'échappement contre laquelle perdre.

**Incidents en aval dus à de mauvaises sorties du modèle depuis la mise en service de la barrière : 0.**

> Retour de terrain. `sqlglot` parse plus de dialectes que n'en exécute une base donnée. Au début, il a joyeusement parsé une instruction que mon Postgres cible exécutait aussi, mais une variante en requêtes empilées est passée à travers ma première allowlist parce que j'ancrais la vérification sur `exp.Table.name` et j'avais raté qu'un nom qualifié par schéma (`other_schema.records`) a le nom autorisé avec un `db` différent. Il a passé la vérification de chaîne et pointait vers une table que je ne possédais pas. Correctif : matcher sur l'identifiant pleinement qualifié, `db` et `catalog` inclus. C'est le jour où j'ai arrêté de faire confiance à `.name` sur quoi que ce soit et où j'ai commencé à imprimer `repr(node)` en écrivant chaque allowlist.

## L'accès est décidé dans du code que le modèle ne peut pas atteindre

Le levier qui compte le plus, c'est qui restreint la requête, et le modèle ne le fait jamais. Il écrit `SELECT count(*) FROM records` comme s'il pouvait tout voir, puis mon code réécrit cette référence à `records` en une sous-requête pré-filtrée sur le tenant et les groupes de permission de l'appelant, à partir de l'arbre que `assert_read_only` a déjà renvoyé.

```python
# Représentatif. Réécrire la table en une sous-requête filtrée par tenant et par permission.
def scope_to_caller(tree: exp.Expression, tenant_id: str, groups: list[str]) -> exp.Expression:
    if not groups:
        # ÉCHEC EN MODE FERMÉ : aucune permission résolue => matche zéro ligne, jamais toutes les lignes.
        groups = ["__no_access__"]

    scoped = exp.select("*").from_("records").where(
        exp.column("tenant_id").eq(exp.Literal.string(tenant_id)),
        exp.column("access_group").isin(*[exp.Literal.string(g) for g in groups]),
    ).subquery(alias="records")

    for t in tree.find_all(exp.Table):
        if t.name == "records":
            t.replace(scoped)
    return tree
```

Le modèle est structurellement incapable d'élargir sa propre vue, parce qu'il ne tient pas la plume sur la partie qui compte. La restriction s'applique après la génération, sur l'arbre parsé, par du code que le prompt ne peut pas adresser.

Pourquoi échouer en mode fermé, et pourquoi ce n'est pas négociable : la branche qui décide « aucune permission résolue » a deux directions possibles, toutes les lignes ou zéro ligne, et les deux erreurs ne coûtent pas la même chose. Zéro ligne, c'est un utilisateur qui voit un résultat vide et ouvre un ticket. Toutes les lignes, c'est une fuite de données inter-tenant et un rapport d'incident de sécurité.

Quand le risque penche autant d'un côté, on code en dur la branche sûre et on rend la branche dangereuse impossible à atteindre, pas seulement improbable. Si les groupes d'un utilisateur ne peuvent pas être résolus, la réécriture injecte un groupe sentinelle qui ne matche rien. Un bug qui oublie de restreindre est rattrapé une seconde fois côté exécution, qui refuse toute requête dont le `WHERE` ne porte pas le prédicat de tenant.

## Rejeter, corriger, réessayer, puis bloquer

Quand une requête générée échoue à la validation, la réponse n'est pas de prompter plus fort. Elle passe par une boucle bornée : rejeter, corriger, réessayer, puis bloquer si besoin.

```python
# Représentatif. Une correction cadrée, puis un arrêt net. Pas de retry infini.
def answer(question: str, tenant_id: str, groups: list[str]) -> Result:
    sql = generate_sql(question)                     # première tentative
    try:
        tree = assert_read_only(sql, ALLOWED_TABLE, MAX_LIMIT)
    except Reject as first:
        # renvoyer la violation exacte une seule fois, cadrée, pas un « réessaie »
        sql = generate_sql(question, prior_error=str(first))
        try:
            tree = assert_read_only(sql, ALLOWED_TABLE, MAX_LIMIT)
        except Reject as second:
            log.warning("bloqué après retry", extra={"err": str(second)})
            return Result.blocked(reason="impossible de formuler dans les règles")

    tree = scope_to_caller(tree, tenant_id, groups)
    return execute(tree)                             # restreint, borné, audité
```

Le modèle a exactement une chance cadrée de corriger une requête réellement malformée, avec l'erreur de validation précise renvoyée plutôt qu'un vague « ça a échoué ». S'il enfreint encore les règles, la requête est bloquée au lieu d'être tordue pour rentrer. Un seul retry, et pas plus : chaque retry est un aller-retour de génération complet, et un modèle qui a échoué au contrat deux fois, l'erreur sous les yeux, ne va pas le réussir à la sixième tentative. Il va juste brûler de la latence et des tokens.

Le tout reste agnostique au modèle grâce à LiteLLM, donc échanger le modèle sous-jacent pour le coût ou la qualité ne change rien à ces garanties. Le contrat vit dans mon code, pas dans le comportement d'un fournisseur.

**Un retry cadré, puis un blocage net. Les retries vers la même fonctionnalité ont baissé d'environ deux tiers une fois l'étape de correction en place.**

## Auditable par construction

Parce que le même validateur tourne là où les requêtes sont générées et là où elles sont exécutées, une erreur doit passer à travers deux vérifications indépendantes pour causer du tort. La requête exécutée est stockée à côté de la réponse, donc tout nombre que le système rapporte remonte au SQL exact qui l'a produit. Auditable par construction. Quand quelqu'un demande « pourquoi le tableau de bord affiche 4 000 », je montre le SQL restreint, le tenant sous lequel il a tourné, et les lignes qu'il a comptées, sans rien recalculer.

> Retour de terrain. La limite honnête, c'est le refus. Parfois une question légitime est bloquée parce que le modèle n'a pas pu la formuler dans les règles, et un vrai utilisateur voit une impasse pour une requête parfaitement raisonnable. J'accepte ce compromis et je ne prétends pas qu'il ne coûte rien. Une question bloquée coûte un retry. Une mauvaise réponse montrée à la mauvaise personne coûte la confiance, et dans le cas du tenant, une fuite.

## Partout où la sortie d'un modèle devient une action

Ce n'est pas propre au text-to-SQL. Pensez à un bot de support qui édite des enregistrements ou émet des remboursements, à un pipeline finance qui écrit des chiffres dans le grand livre, à un agent ops qui appelle des API internes, ou à un outil santé, RH ou juridique qui lit dans des systèmes aux règles d'accès strictes.

Dans chacun, la forme est la même : une sortie presque juste qui se propage tant que rien en aval n'est construit pour l'arrêter. Si la réponse honnête à « qu'est-ce qui empêche une mauvaise sortie d'atteindre un client » est « le prompt », vous avez exactement le problème pour lequel j'ai construit ça. Tout le travail est dans ce quelque chose en aval.
