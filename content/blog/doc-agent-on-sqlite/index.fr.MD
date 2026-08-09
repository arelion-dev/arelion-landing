---
title: "L'agent documentaire qui tourne sur SQLite"
date: "2026-01-22T19:30:00.000Z"
description: "Un agent documentaire privé qui lit, classe et répond à des questions sur des années de PDF, avec tout le cerveau cherchable dans un seul fichier SQLite sur la machine du propriétaire. Pas de base vectorielle, pas de cloud."
tags: ["Tech", "AI"]
private: true
---

Vendredi soir. Un chef d'entreprise traque une facture à travers deux ans de PDF, dossier par dossier, parce qu'il est le seul moteur de recherche que sa boîte ait jamais eu. Il sait que le fichier est là, quelque part. Vers le quarantième dossier, il laisse tomber.

J'ai construit le moteur de recherche qui aurait dû exister pour lui. Chaque PDF et chaque scan entrant est lu, puis classé tout seul. Vous posez une question simple, il répond avec la page exacte et un lien en un clic vers le fichier source. **Récupération en moins de 2 secondes, contre 3 ans de paperasse, et 0 document ne quitte la machine.** Le choix de conception qui mérite d'être écrit : les modèles lisent et classent, mais tout le cerveau cherchable tient dans un seul fichier SQLite. Pas de base vectorielle, pas de service cloud posé sur ses finances.

À la fin vous saurez comment le pipeline lit à bas coût, pourquoi il refuse de classer ce dont il n'est pas sûr, et comment il cherche de deux façons à la fois, le tout dans un seul fichier que vous sauvegardez avec `cp`.

## Ne jamais payer un modèle pour un travail qu'un outil local fait gratuitement

La lecture, c'est là où le coût explose si vous envoyez chaque page à un modèle. Le pipeline commence donc par tenter le chemin bon marché. Tout PDF avec une vraie couche de texte est extrait par `pdftotext` (poppler) en millisecondes, à coût nul. Seul un vrai scan, une image sans texte dessous, bascule sur la vision de Gemini 2.5 Flash.

La plupart de la paperasse d'entreprise naît numérique, donc l'essentiel emprunte ce chemin gratuit. **Environ 85 % des pages ne touchent jamais un modèle payant.** Mon opinion ici : les modèles multimodaux sont le mauvais défaut pour l'OCR quand un extracteur déterministe connaît déjà la réponse. Vous prenez le modèle au bord, pas au milieu.

## Un contrat mal classé vous ment pendant des années, alors la machine avoue son doute

Le classement, c'est là où la confiance se gagne ou se perd. Un classifieur (Gemini 2.5 Flash, avec Gemini 2.5 Pro en secours pour les cas durs) décide ce qu'est un document, qui il concerne et où il va, puis attache un score de confiance à cette décision.

Sous le seuil de critique, une seconde passe indépendante revoit la première décision. Tout ce qui reste douteux atterrit dans une file « à vérifier » au lieu d'être forcé dans un dossier. Un contrat mal classé est pire qu'un contrat non classé : le non classé, vous savez qu'il faut le vérifier, alors que le mal classé vous ment pendant des années. La file dit son doute à voix haute, et c'est ce qui permet au propriétaire d'arrêter de contrôler la machine derrière.

Le « qui » et le « où » ne sont pas du texte libre. Chaque document est tagué sur des axes à vocabulaire contrôlé, plus des tags libres qui grandissent de façon organique :

```python
# Les valeurs sont propres à chaque déploiement. Les miennes sont de vrais
# noms et de vrais sujets, alors voici la forme avec des marque-place.
PERSON_VALUES = (
    "owner", "spouse", "parent_1",
    "parent_2", "sibling", "other",
)
TOPIC_VALUES = (
    "tax_residency", "estate", "shared_assets",
    "day_to_day", "rental_property", "medical",
    "vehicle", "other",
)
```

Un modèle qui renvoie une valeur hors liste est reversé dans `autre` plutôt que cru. C'est de la plomberie ennuyeuse, et c'est elle qui transforme « montre-moi chaque document de location de 2024, mais pas ceux de la succession » en une clause `WHERE` au lieu d'un second appel de modèle.

## Tout le cerveau tient dans un fichier SQLite, et la sauvegarde est une commande de copie

La partie à contre-courant : il n'y a pas de stockage vectoriel géré. `sqlite-vec` détient les embeddings dans une table virtuelle `vec0`, FTS5 gère la recherche plein texte, et les deux vivent dans un seul fichier. Se passer d'un service hébergé, c'est retirer un serveur, une facture mensuelle, et une copie de l'archive posée sur l'infrastructure de quelqu'un d'autre. **Un fichier SQLite, pas de base vectorielle, environ 0 dollar d'infra par mois.** La sauvegarde, c'est copier un fichier.

La connexion charge l'extension, active le WAL pour que les lecteurs ne bloquent jamais l'écrivain, et crée la table vectorielle dimensionnée au modèle d'embedding :

```python
import sqlite_vec

EMBED_DIM = 768  # gemini-embedding-001, output_dimensionality=768

def connect(db_path):
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

# l'index vectoriel n'est qu'une table virtuelle de plus
conn.execute(
    f"CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec "
    f"USING vec0(embedding float[{EMBED_DIM}])"
)

# plein texte, tokenizer français insensible aux accents
CREATE VIRTUAL TABLE chunks_fts USING fts5(
    chunk_id UNINDEXED, doc_id UNINDEXED, text, context,
    tokenize="unicode61 remove_diacritics 2");
```

Deux détails de cette ligne FTS5 comptent pour la paperasse française. `unicode61` est le tokenizer, et `remove_diacritics 2` signifie qu'une recherche de « resilie » trouve « résilié ». Celui qui cherche un terme ne devrait pas avoir à taper les accents comme il faut.

Les embeddings entrent en octets flottants bruts little-endian, packés une fois avec `struct` :

```python
def _vec(values):
    floats = list(values)
    return struct.pack(f"{len(floats)}f", *floats)
```

## Deux recherches couvrent leurs angles morts respectifs

La recherche fait tourner deux moteurs à la fois. Le sémantique capte le sens (« qu'a-t-on convenu sur le retard de paiement »), tandis que le plein texte capte les chaînes exactes qu'un vecteur brouille, un numéro de référence ou un nom propre. Leurs listes classées fusionnent par rang réciproque, si bien que chacune couvre l'angle mort de l'autre. Voici la fusion réelle, la pièce que j'appelle `_rrf_combine` :

```python
RRF_K = 60  # constante standard de fusion par rang réciproque

def _rrf_combine(sem_rows, fts_rows) -> dict:
    scores: dict = {}
    for rank, r in enumerate(sem_rows):
        key = (r["chunk_id"], r["doc_id"])
        scores[key] = scores.get(key, 0.0) + 1.0 / (RRF_K + rank + 1)
    for rank, r in enumerate(fts_rows):
        key = (r["chunk_id"], r["doc_id"])
        scores[key] = scores.get(key, 0.0) + 1.0 / (RRF_K + rank + 1)
    return scores
```

Le RRF est volontairement bête : il ne lit que la position de rang, jamais les scores bruts. C'est tout l'intérêt. La distance cosinus et le `rank` de FTS5 ne sont pas sur la même échelle, donc toute tentative de les additionner directement est un bug qui n'attend que d'arriver, et le RRF contourne complètement le problème de normalisation.

En mode hybride je tire les `k * 5` premiers candidats de chaque moteur (au moins 30) et je les fusionne. Puis je groupe par document et je garde le seul meilleur chunk par document, pour qu'un long fichier ne puisse pas noyer les résultats.

La requête vectorielle elle-même est là où sqlite-vec surprend. Le k plus proches voisins est une contrainte dans le `WHERE`, juste là où vous attendriez un `LIMIT` :

```python
SELECT c.id AS chunk_id, c.doc_id AS doc_id, v.distance AS distance
FROM chunks_vec v
JOIN chunks c    ON c.id = v.rowid
JOIN documents d ON d.id = c.doc_id
WHERE v.embedding MATCH ?   -- le vecteur de requête packé
  AND k = ?                 -- le compte KNN vit ici, pas dans LIMIT
  AND d.status = 'ok'
ORDER BY v.distance
```

> Retour de terrain. La première fois que j'ai filtré les résultats vectoriels par `d.status = 'ok'` et collé un `LIMIT 5` à la fin, j'obtenais sans cesse moins de cinq résultats, parfois zéro. Cause : sqlite-vec résout `k` d'abord, rend exactement ces lignes, et seulement ensuite le `WHERE`/`LIMIT` SQL tourne sur cet ensemble figé. Donc une recherche `k = 5` dont les 5 premiers vecteurs étaient tous filtrés renvoyait rien. Le correctif : demander un `k` plus large d'entrée (`k * 3` à `k * 5`), puis filtrer et rogner en Python. Le compte KNN et le compte de résultats sont deux nombres différents.

## Matcher petit, renvoyer grand

Deux détails gagnent leur place chaque jour. D'abord, le petit-vers-grand : un résultat correspond sur un petit chunk, mais le système renvoie la page parente entière. Un total de facture coupé sur une frontière de chunk reviendrait sinon coupé en deux.

```python
# petit-vers-grand : matcher sur le chunk, renvoyer sa page parente complète
page_num  = row["page_num"]
page_text = db.get_page_text(conn, row["doc_id"], page_num)
```

Ensuite, les doublons. Les fichiers identiques sont attrapés par hash de contenu (SHA-256). Un doublon ne déclenche jamais un second appel Gemini : la ligne document existante, ses chunks, ses vecteurs et ses entrées FTS sont clonés directement vers une nouvelle ligne dans la base.

```python
# fichier doublon détecté : copier le vecteur, aucun ré-embedding
vec = conn.execute(
    "SELECT embedding FROM chunks_vec WHERE rowid = ?", (src["id"],)
).fetchone()
if vec:
    conn.execute(
        "INSERT INTO chunks_vec (rowid, embedding) VALUES (?, ?)",
        (new_chunk_id, vec["embedding"]),
    )
```

Le même contenu qui vit à deux chemins, ça dit quelque chose du système de fichiers. Ce n'est pas une raison de payer l'OCR deux fois.

> Retour de terrain. Au début, un lot de scans est revenu avec un texte vide et le classifieur les a tous joyeusement classés en « unknown » avec une haute confiance, parce qu'une chaîne vide ne correspondait à rien et que rien ne la contredisait. La haute confiance sur zéro preuve est l'échec dangereux. Le correctif : une lecture vide ou quasi vide court-circuite désormais droit vers la file « à vérifier » avant même que le classifieur la voie. La confiance doit se gagner contre du vrai texte.

## Une question, et la réponse arrive avec le chemin du fichier

Le propriétaire demande « combien j'ai payé ce fournisseur en 2024 ». La requête s'embed une fois, puis lance le sémantique et le plein texte en parallèle. `_rrf_combine` fusionne les deux listes classées, le meilleur chunk fait remonter sa page parente complète, et la réponse revient avec le montant, la ligne exacte, et le chemin vers `2024-03-11_facture_fournisseur-x.pdf` à vérifier en un clic. **Vingt minutes de fouille deviennent une question.**

Le même cerveau est joignable de deux façons : depuis un assistant IA via un petit serveur MCP, ou depuis la ligne de commande via un jeu d'outils `bb-*`. Vous obtenez votre réponse dans un chat ou dans un script, selon ce qui est le plus à portée.

## La limite honnête : une machine, un écrivain

C'est mono-machine par conception, et c'est aussi son plafond. Le mode WAL laisse tourner beaucoup de lecteurs pendant qu'un écrivain travaille, ce qui est exactement bon pour un seul propriétaire avec des années de paperasse. Ce n'est pas fait pour dix personnes qui écrivent en même temps.

Des écritures concurrentes demanderaient une vraie base, avec le serveur, la facture et la copie hors machine qui vont avec. Pour ce propriétaire, la contrainte est la fonctionnalité. Pour une équipe, c'est la ligne où je changerais la conception.

## Qui a ce problème

Le motif transférable : une pile de documents non structurés et sensibles devient quelque chose que vous interrogez comme un collègue, sans le céder à qui que ce soit. Lisez à bas coût avant de lire cher, et laissez deux méthodes de recherche se couvrir mutuellement. Faites dire son doute à voix haute au système, au lieu de le laisser deviner. Puis gardez la donnée là où elle est née, sous une forme que vous sauvegardez en copiant un fichier.

Un cabinet comptable sur des années de dossiers clients, un cabinet d'avocats où la réponse est toujours « dans le dossier, quelque part », un gestionnaire immobilier qui jongle avec des baux sur des dizaines de lots, un cabinet médical tenu au secret, tout back-office où une personne est devenue en silence le moteur de recherche. La pile diffère. Le correctif est le même.
