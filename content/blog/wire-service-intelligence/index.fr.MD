---
title: "Intelligence des dépêches d'agence"
date: "2025-12-18T14:55:00.000Z"
description: "Un média national republiait les dépêches d'agence mot pour mot, identiques à celles de chaque rival qui achète le même flux. J'ai construit la couche d'IA éditoriale qui dédoublonne le flux, le réécrit dans la voix maison, et relie chaque article à une archive de 500 000 articles, le journaliste gardant le dernier clic."
tags: ["Tech", "AI"]
private: true
---

Cinq éditeurs ouvrent cinq dépêches sur le même événement. L'AFP, Reuters et Bloomberg ont toutes filé le même ministre et le même chiffre, jusqu'à la même photo, alors chaque éditeur lit sa copie, la coupe et la publie pendant que dix sites rivaux poussent le même flux vers la même fin. À midi, l'histoire est en ligne en dix versions interchangeables. Puis un lecteur arrive depuis la recherche, parcourt une page qu'il aurait trouvée n'importe où ailleurs, et repart. La session moyenne dépasse à peine une page.

J'ai construit la couche d'IA éditoriale qui a brisé cette boucle pour un média national où **une grande part de tout ce qui était publié sortait directement du flux d'agence**. Le résultat qui comptait : cinq lectures d'une même dépêche se sont réduites à une, et les articles qui partaient avec zéro lien interne en portent désormais plusieurs, vers une archive que les lecteurs n'avaient jamais pu atteindre.

## Le budget dépêches n'achetait rien qu'un rival n'avait pas aussi

La rédaction payait cher l'AFP, Reuters, Bloomberg et ETX, puis poussait les articles quasiment tels que reçus. Même titre, mêmes paragraphes, même photo, sur dix sites à la fois. Revendre un flux de commodité intact, c'est une course perdue d'avance, et on la perd sur le prix.

**Un lecteur sait reconnaître un article repris tel quel du fil, et se comporte en conséquence : à peine plus d'une page par visite, puis parti.**

Alors j'ai arrêté de voir le flux comme une sortie et j'ai commencé à le voir comme une matière première. Tout ce qui suit montre la technique, ce n'est pas la source verbatim du média.

## Le clustering par le sens transforme cinq dépêches en une seule histoire

Le dédoublonnage naïf, c'est un hash ou une correspondance d'URL, et il échoue dès le premier jour : cinq agences écrivent un événement en cinq phrases différentes, donc rien ne se percute. Il faut dédoublonner au niveau du sens, parce que les octets ne collent jamais.

Alors j'embarque chaque dépêche entrante dans un embedding, je relie celles qui décrivent le même événement, et je laisse la rédaction voir des événements là où elle voyait des doublons. J'appelle l'unité qu'il produit **un-cluster-une-histoire**.

Les dépêches arrivent en plusieurs langues sur le même fil, ce qui exclut un encodeur monolingue. J'ai utilisé un encodeur de phrases multilingue, normalisé les vecteurs pour qu'un produit scalaire soit une similarité cosinus, puis lancé union-find sur le graphe des cosinus :

```python
# Représentatif de l'étape de dédoublonnage, pas le code verbatim du client.
from sentence_transformers import SentenceTransformer
import numpy as np

encoder = SentenceTransformer("intfloat/multilingual-e5-large")  # 1024 dimensions

def embed(dispatches: list[str]) -> np.ndarray:
    # e5 veut le préfixe "passage:" ; normaliser pour que le produit scalaire == cosinus
    return encoder.encode([f"passage: {d}" for d in dispatches],
                          normalize_embeddings=True)

def cluster(vecs: np.ndarray, threshold: float = 0.86) -> list[list[int]]:
    parent = list(range(len(vecs)))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # compression de chemin
            x = parent[x]
        return x
    sim = vecs @ vecs.T                      # cosinus, les vecteurs sont de norme unitaire
    for i in range(len(vecs)):
        for j in range(i + 1, len(vecs)):
            if sim[i, j] >= threshold:       # la vraie version filtre aussi sur une
                parent[find(i)] = find(j)    # fenêtre temporelle partagée (voir retour de terrain)
    groups: dict[int, list[int]] = {}
    for i in range(len(vecs)):
        groups.setdefault(find(i), []).append(i)
    return list(groups.values())
```

Ce `0.86` porte toute la fonctionnalité. Réglé trop bas, deux histoires différentes qui partagent du vocabulaire (deux verdicts, même tribunal, même semaine) s'effondrent en une seule, et la rédaction ne voit jamais le second événement. C'est de la sous-couverture silencieuse, à peu près le pire échec pour une rédaction. Réglé trop haut, le dédoublonnage ne fait plus rien, et cinq éditeurs retournent lire cinq copies.

**Le seuil est une décision produit déguisée en flottant.** Je l'ai calé contre une semaine étiquetée de vrai trafic de dépêches.

Une fois qu'un cluster existe, la rédaction n'en publie qu'un membre, donc le système choisit le plus solide sur des critères concrets avant de rédiger la réécriture :

```python
def pick_lead(cluster_idx: list[int], dispatches: list[Dispatch]) -> Dispatch:
    def score(d: Dispatch) -> tuple:
        return (len(d.named_sources),   # le sourçage d'abord
                d.body_len,             # puis la complétude
                d.filed_at)             # la fraîcheur pour départager
    return max((dispatches[i] for i in cluster_idx), key=score)
```

De là, il rédige une réécriture de ce chef de file dans la voix propre du média, orientée pour son audience plutôt que pour un client d'agence mondiale. Les histoires sans intérêt local sont marquées comme sautables. **La réécriture n'est qu'un brouillon.** Un éditeur la relit contre l'original avant toute mise en ligne.

> Retour de terrain. Un seuil de cosinus qui avait l'air sûr a fusionné une actualité de dernière minute avec sa propre relance une heure plus tard : même événement, mêmes noms, chapeau quasi identique, mais la relance portait le nouveau chiffre qui comptait vraiment. `pick_lead` a alors écarté la copie plus fraîche comme un doublon. Monter le seuil a commencé à séparer de vrais doublons à la place, donc ce n'était pas le bon correctif. Le bon, c'était un garde-fou dont le dédoublonnage au niveau des octets n'avait jamais eu besoin : les dépêches ne fusionnent que lorsqu'elles partagent des entités nommées ET tombent dans la même courte fenêtre temporelle. Le sens seul ne suffisait pas.

## Le maillage arrière par le sens ressuscite une archive que personne ne pouvait atteindre

Chaque nouvel article est comparé par le sens à l'**archive de plus de 500 000 articles**, et le système propose des liens internes contextuels : le portrait écrit quand ce ministre a pris ses fonctions, ou l'enquête d'il y a des années que ce verdict vient clore. La recherche par mots-clés rate tout ça, parce que l'ancien article et le nouveau partagent rarement la formulation exacte, seulement le sujet.

L'archive vit dans Postgres avec pgvector, une ligne par article publié, un index HNSW sur l'embedding. La récupération des candidats tient en une seule requête ANN :

```sql
-- Représentatif. <=> est la distance cosinus ; 1 - distance est la similarité.
SELECT id, url, title, 1 - (embedding <=> :new_vec) AS score
FROM articles
WHERE published            -- ne jamais lier vers un brouillon
  AND id <> :new_id
ORDER BY embedding <=> :new_vec
LIMIT 40;
```

La similarité vectorielle brute, seule, propose des liens à la fois plausibles et faux (deux histoires sans rapport qui sonnent toutes deux comme « un ministre a annoncé un budget »). Alors les candidats passent par un garde-fou symbolique peu coûteux avant que rien n'atteigne l'éditeur :

```python
def propose_links(new, candidates, min_score=0.78, max_links=6):
    return [
        c for c in candidates
        if c.score >= min_score
        and c.entities & new.entities     # doit partager une vraie entité nommée
        and c.section != "wire_raw"       # lier vers le travail propre du média, pas le flux
    ][:max_links]
    # présenté dans l'éditeur, jamais inséré automatiquement
```

**Les liens internes par article sont passés d'environ zéro à plusieurs, et les pages par visite ont grimpé avec.**

Un lecteur bloqué à une page n'avait nulle part où aller. Chaque lien pointe vers un inventaire que le média possède déjà, ressuscité au moment où il redevient pertinent, si bien que les moteurs de recherche finissent par voir ce que voient les lecteurs : une archive de nouveau connectée.

## Le même index sert aussi de second cerveau à la rédaction

Les embeddings qui alimentent le maillage arrière servent aussi de barre de recherche sémantique sur tout le record publié, plus d'une décennie, cherchable par le sens. « Qu'a-t-on rapporté sur ce député la dernière fois que c'est ressorti ? » cesse d'être un après-midi de grep dans de vieilles entrées de CMS et devient une question qu'on résout en quelques secondes.

Ça change qui peut vraiment utiliser l'archive, puisque le junior arrivé le mois dernier atteint désormais ce que seul le vétéran se rappelait. Un index, deux produits, aucune infrastructure supplémentaire. **Réutiliser les embeddings du maillage arrière pour la recherche a été la décision la moins chère du projet**, parce que la partie coûteuse (embarquer 500 000+ articles une fois, la garder chaude) était déjà payée.

## L'humain garde le dernier clic, et cette frontière est dans l'architecture

La dernière brique vit à l'intérieur du CMS (WordPress), là où le travail se fait déjà. Un outil séparé, boulonné à côté du CMS, se fait ignorer, alors j'ai mis l'assistant directement dans l'éditeur, en panneau latéral. Pendant qu'un journaliste écrit, il propose des titres, des résumés, des tags, des vérifications SEO et les liens arrière de l'archive, chaque suggestion posée à côté du champ qu'elle vise, acceptée, éditée ou ignorée en une seule action :

```js
// Représentatif : un panneau latéral dans le CMS (WordPress/Gutenberg).
// Les suggestions s'affichent à côté du champ qu'elles visent ; rien n'écrit de lui-même.
registerPlugin("wire-assist", {
  render() {
    const { headline, tags, links } = useSuggestions(postId);
    return (
      <PluginSidebar title="Assistance éditoriale">
        <Suggestion
          label="Titre"
          value={headline}
          onAccept={(v) => editor.setTitle(v)}   // un clic l'applique
          onReject={() => dismiss("headline")}   // journalisé, alimente le classement
        />
        <LinkSuggestions
          items={links}                          // liens arrière depuis l'archive
          onAccept={(l) => editor.insertLink(l)}
        />
      </PluginSidebar>
    );
  },
});
```

Chaque rejet est journalisé, et c'est comme ça que le classement s'améliore sans pipeline d'entraînement : un lien que la rédaction écarte dix fois cesse d'être proposé.

**Rien ne se publie tout seul.** J'ai été strict sur cette frontière pour une raison. La signature d'une rédaction est tout son actif, et dès qu'une phrase de machine non relue atteint l'impression sous cette signature, l'outil a coûté plus qu'il n'a jamais rapporté.

Alors la division du travail est inscrite dans le code, là où personne ne peut la contourner discrètement. Il n'existe aucun chemin d'insertion automatique, nulle part. L'IA fait la plomberie des métadonnées ; le journaliste garde le jugement et le dernier clic.

## Ce que ça ne fait pas

Les réécritures font de bons brouillons et restent en deçà d'un journalisme fini. Sur les histoires politiques sensibles, un éditeur les retravaille, et il a raison.

Le dédoublonnage fusionne parfois deux histoires qui méritaient un traitement séparé, et rate parfois une paire formulée de façon trop différente pour se percuter. Les deux modes d'échec remontent à ce seul seuil, et aucune valeur unique ne les supprime tous les deux, ce qui explique pourquoi le clustering propose et un humain confirme.

Le garde-fou du maillage arrière est symbolique (entités partagées), donc il repose sur l'extraction d'entités. Quand l'extracteur rate un nom, un bon lien n'est jamais proposé. J'ai choisi ce sens d'échec exprès, parce qu'une suggestion manquée est invisible tandis qu'une mauvaise brûle la confiance de l'éditeur.

Rien de tout ça ne fabrique du reportage original. Ça dégage le travail de routine loin des gens qui le font vraiment, et le plafond du système reste le jugement de la rédaction. C'est voulu.

## Qui a ce problème

Le pattern voyage. Si vous payez pour du contenu ou de la donnée et que vous le republiez quasiment intact, vous êtes quelque part dans le tableau.

Une rédaction sur des dépêches d'agence, évidemment. Une équipe de content marketing qui retravaille les mêmes sources sectorielles que chaque rival. Un pôle de recherche qui résume les mêmes rapports que ses concurrents achètent. Une équipe e-commerce dont les descriptions produit sortent directement des flux fournisseurs, identiques sur chaque marketplace.

Dans chaque cas, le flux est le coût, la différenciation est le travail que personne n'a le temps de faire, et le partage reste le même : laissez la machine proposer contre tout ce que vous avez publié, et gardez une personne sur le dernier clic.

Le flux que tout le monde achète reste une commodité. Ce que vous en faites avant de le publier, c'est ça, le métier.
