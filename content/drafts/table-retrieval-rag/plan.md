# Idée : faire du table retrieval RAG proprement

- **Statut** : idée seule. Plan complet à écrire plus tard.
- **Pilier** : Build
- **Titre EN (piste)** : Table retrieval in RAG, done right
- **Titre FR (piste)** : Retrouver un tableau dans un RAG, proprement

## L'idée
- Le problème : les tableaux cassent un RAG naïf. Le chunking coupe le tableau en deux, l'embedding de cellules brutes ne veut rien dire, le retrieval renvoie des fragments ou rate le bon tableau.
- La technique : générer une légende / description de chaque tableau (ce qu'il contient, ses colonnes, la question à laquelle il répond). On embedde la légende, pas les cellules.
- Le retrieval sémantique matche la question à la légende. La légende pointe vers le tableau complet, qu'on injecte entier dans le contexte.
- Résultat : on cherche sur un texte lisible et parlant, on sert la donnée complète et intacte.
- Parenté : même esprit que le small-to-big (matcher petit, renvoyer le parent complet) déjà utilisé dans docs-indexer.

## Le hard part (à creuser)
- Générer de bonnes légendes (assez précises pour matcher, assez courtes pour embedder).
- Garder l'intégrité du tableau (ne jamais le couper à une frontière de chunk).
- Lier proprement légende -> tableau source.
- Les très gros tableaux (pagination, sous-tables).

## À faire quand on le développe
- Grounding : `[à confirmer : est-ce qu'on fait déjà du table-caption retrieval dans docexplo/docs-indexer, ou c'est une technique à documenter ?]`
- Ancrer sur un cas concret (le style : un vrai tableau, liasse fiscale ou rapport, où le RAG naïf se plante).
- Anonymiser si le cas vient d'un client.
