---
title: "L'intelligence documentaire à l'échelle"
date: "2026-06-18T10:40:00.000Z"
description: "Lire et chercher plus de 100 millions de pages sur trente marques : OCR privilégiant le texte natif, tableaux fidèles, recherche hybride, et contrôle d'accès appliqué dans la requête."
tags: ["Tech", "AI"]
private: true
---

Une chercheuse a besoin d'un seul chiffre de stabilité tiré d'une étude de 2009. Il est dans l'archive, dans un PDF scanné, dans un tableau en page 40, en français. Elle passe une demi-matinée à le chercher en vain, abandonne, et relance l'étude. L'entreprise paie ce travail deux fois.

J'ai construit le moteur qui met fin à ça : une couche d'intelligence documentaire pour un grand groupe de cosmétiques, trente marques, des décennies de R&D, plus de 100 millions de pages de formules, brevets, contrats et dossiers réglementaires dans une dizaine de langues. Aujourd'hui ce chiffre revient en moins d'une seconde, avec un lien direct vers la page 40.

**Le temps de recherche est passé de ~30 minutes de fouille à moins d'une seconde.**

Un article jumeau couvre l'agent qui refuse de répondre à moitié à une question en plusieurs parties. Celui-ci est la couche en dessous : comment lire 100 millions de pages fidèlement, puis les chercher en moins d'une seconde, sans laisser fuiter un seul document au-delà d'une frontière de marque. À la fin vous saurez pourquoi je lis la page avant de l'OCR, pourquoi un tableau reçoit son propre modèle, pourquoi la file est une table Postgres, et pourquoi le contrôle d'accès vit dans la requête vectorielle.

Note sur le code : c'était un travail client propriétaire, donc je ne peux pas coller le dépôt. Chaque extrait ci-dessous est une reconstruction en salle blanche de la technique, assez générique pour tourner seule et honnête sur le mécanisme. Rien de tout ça n'est du code client mot pour mot.

## La lecture est la partie dure, pas la recherche

Un PDF scanné, c'est une image du texte : les caractères n'y sont pas, on ne peut pas les lire. Un PDF né numérique, lui, porte déjà ces caractères dans son flux de contenu. Traitez les deux pareil et soit vous brûlez de l'argent à passer l'OCR sur des pages qui n'en avaient pas besoin, soit vous faites confiance à une couche de texte pourrie et vous perdez en précision.

Du coup, le pipeline décide page par page, pas document par document. Un même fichier peut mélanger une couverture nette née numérique et une annexe scannée de 1998.

Appelez ça le « natif d'abord » : lire la page gratuitement avec PyMuPDF (fitz) quand le texte embarqué est réel, et ne payer l'OCR que quand il ne l'est pas. Le test ne coûte presque rien. On tire les boîtes de mots, puis on vérifie deux choses : que la page n'est pas pivotée, et qu'il y a assez de texte pour une vraie couche, pas juste un filigrane égaré.

```python
import fitz  # PyMuPDF 1.24

def route_page(page: fitz.Page) -> tuple[str, int]:
    words = page.get_text("words")  # (x0,y0,x1,y1,text,block,line,word)
    text = "".join(w[4] for w in words)
    upright = page.rotation in (0, None)
    if upright and len(text.strip()) >= 40:
        # né numérique : lever le vrai texte, zéro erreur OCR, aucun rendu
        return text, 0
    # vrai scan : rasteriser, puis OCR. 300 DPI est le plancher qui garde
    # lisibles les indices/exposants 6pt des tableaux d'ingrédients ; 200 DPI les perd.
    pix = page.get_pixmap(dpi=300)
    return ocr(pix), 300
```

Le seuil de 40 caractères n'est pas arbitraire. En dessous, on tombe presque toujours sur un numéro de page ou une annotation Acrobat égarée, et le geste honnête est de traiter la page comme un scan. Le choix du DPI compte plus qu'il n'y paraît. Les pages nées numériques n'ont besoin d'aucun raster ; pour les vrais scans, 300 DPI est le plancher où un exposant 6pt dans un tableau d'ingrédients reste lisible. À 200 DPI ces caractères fondent, et un exposant fondu dans une concentration, c'est une réponse fausse.

À plus de 100 millions de pages, le natif d'abord décide si la facture d'OCR est payable ou pas. Rasteriser et OCR chaque page « par sécurité » aurait multiplié le calcul par trois environ, pour zéro gain de précision sur les deux tiers du corpus qui portaient déjà un texte parfait.

**Environ deux tiers du corpus est né numérique, donc l'essentiel des pages ne touche jamais l'OCR.**

Le natif d'abord plutôt que l'OCR-partout, c'est la décision qui a le plus d'effet sur tout le pipeline. La plupart des équipes la sautent, parce que l'OCR-partout tient en une ligne de code et a l'air uniforme. Uniforme et faux.

## Un tableau aplati est un mensonge que le modèle répète avec aisance

Avant de lire une page, le pipeline détermine sa forme. Un modèle de mise en page Docling sépare un titre d'un paragraphe, d'une figure, d'un tableau. Chaque région part ensuite vers le lecteur bâti pour elle : la prose par Tesseract 5 (moteur LSTM, indice de langue par région), les tableaux par TableFormer. TableFormer est le modèle de structure livré avec Docling, et il reconstruit la vraie grille de cellules, lignes par colonnes, cellules fusionnées comprises.

La raison de dépenser un modèle entier sur les tableaux, c'est que l'aplatissement détruit le sens. Une lecture de stabilité ou une concentration d'ingrédient actif vit à l'intersection d'une ligne et d'une colonne. Passez-y un OCR ordinaire et vous obtenez un flot de nombres, grille disparue :

```
Ingrédient Concentration pH Stabilité
Rétinol 0.3 5.5 24mo Niacinamide 4.0 6.0 36mo
```

Quel nombre est le pH de la ligne rétinol ? Le modèle va deviner, avec aisance, et se tromper. TableFormer garde la géométrie, donc la même région revient comme une structure à laquelle vous pouvez faire confiance :

```json
{
  "rows": [
    {"ingredient": "Retinol",      "concentration": "0.3", "ph": "5.5", "stability_mo": 24},
    {"ingredient": "Niacinamide",  "concentration": "4.0", "ph": "6.0", "stability_mo": 36}
  ]
}
```

Un détail de formulation lu dans la mauvaise ligne est pire que pas de réponse, alors j'ai ajouté une barrière de validation. Un tableau qui revient malformé (une grille hallucinée de 200 colonnes, un nombre de lignes qui ne colle pas aux cellules détectées) est écarté plutôt que gardé, et le reste du document survit. Mieux vaut vide qu'inventé.

C'est le compromis honnête, et il coûte du rappel. Quelques vrais tableaux, exceptionnellement larges (une matrice réglementaire de 60 colonnes, ça existe), sont écartés avec les mauvais. J'ai choisi la précision, parce qu'une concentration fausse et confiante est le seul échec que ce système ne peut pas livrer. Si j'y revenais, je routerais ces tableaux larges vers un modèle de vision plus lent pour un second avis, au lieu de les jeter d'emblée.

Les figures sont décrites par Gemini 2.5 Flash, assez bon marché et rapide pour tourner figure par figure à l'échelle du corpus, si bien qu'un graphique muet devient du texte qu'on peut retrouver. Les images répétées, logos de marques et la même poignée de pictogrammes de danger, sont légendées une fois et indexées par hash de contenu, pour réutiliser la légende à chaque occurrence suivante.

```python
key = hashlib.sha256(image_bytes).hexdigest()
caption = cache.get(key) or cache.set(key, vlm_caption(image_bytes))
```

À l'échelle du corpus, un logo apparaît sur des millions de pages. Le légender une seule fois, au lieu de millions, ramène la facture de description des figures à une broutille au lieu d'un poste qui plomberait tout le run.

## La file est la base de données

Pas de Kafka, pas de Celery, pas de Pub/Sub. Un document est une ligne avec une colonne `status`, et la machine à états (`NEW` vers `OCR_DONE` vers `EMBEDDED` vers `INDEXED`) est imposée par la requête qu'un worker lance. Les workers réclament le travail avec une primitive Postgres, `FOR UPDATE SKIP LOCKED` :

```sql
-- une réclamation atomique : beaucoup de workers, une table, jamais deux fois le même doc
UPDATE docs
SET status = 'EMBEDDING', worker_id = $1, claimed_at = now()
WHERE id IN (
    SELECT id FROM docs
    WHERE status = 'OCR_DONE'
    ORDER BY priority DESC, updated_at
    FOR UPDATE SKIP LOCKED
    LIMIT 5
)
RETURNING id, path;
```

`SKIP LOCKED`, c'est toute l'astuce. Chaque worker verrouille ses cinq lignes et enjambe celles qu'un autre détient déjà, si bien que N workers tirent des lots disjoints, sans coordinateur et sans double traitement. Résultat : moins de pièces mobiles, et un seul endroit où regarder quand quelque chose traîne (`SELECT status, count(*) FROM docs GROUP BY 1`). La contre-pression vient gratuitement, en prime : si l'embedding prend du retard, les lignes `OCR_DONE` s'empilent dans une colonne au lieu de gonfler une file de broker invisible.

Le seul piège : un worker qui meurt en plein lot laisse des lignes coincées en `EMBEDDING` pour de bon. Une requête faucheuse repasse en `OCR_DONE` tout ce qui a été réclamé depuis plus longtemps qu'un délai fixé, si bien qu'un crash coûte un lot de reprises, pas un pipeline bloqué.

```sql
UPDATE docs SET status = 'OCR_DONE', worker_id = NULL
WHERE status = 'EMBEDDING' AND claimed_at < now() - interval '15 minutes';
```

Un ordonnanceur équitable pondéré s'appuie sur la colonne de priorité : un import ponctuel de dizaines de milliers de certificats ne peut pas affamer la chercheuse qui attend son seul nouveau rapport. Le travail en masse tourne à faible poids et cède la place aux requêtes interactives.

Sortez un broker quand vous l'avez mérité, pas avant. À cette échelle, une table que je peux interroger et sauvegarder a battu un broker qu'il aurait fallu exploiter, et « la file est la base de données » me laissait un seul système en tête au lieu de deux.

## La récupération, c'est trois recherches, pas une

Chaque document est découpé en fragments qui se chevauchent (environ 500 tokens, ~15 % de recouvrement pour qu'un fait à cheval sur deux chunks ne soit pas coupé en deux), puis vectorisé par un modèle multilingue, gecko-multilingual-002, 768 dimensions. Le multilingue n'est pas une option ici : le corpus mêle français, anglais et jargon scientifique dans une même phrase, et une question posée dans une langue doit retrouver un document écrit dans une autre. Un embedder monolingue rate ça en silence : il ne renvoie rien, au lieu du dossier français qui tient la réponse.

Une seule recherche vectorielle ne suffit pas, parce que trois questions différentes se cachent dans une même requête. Alors chaque requête part en trois branches en parallèle :

```python
async def retrieve(query: str, groups: list[str]) -> list[Hit]:
    semantic, lexical, title = await asyncio.gather(
        vector_search(embed(query), groups=groups, top_k=50),   # sens
        fulltext_search(query, groups=groups, top_k=50),        # tokens exacts
        title_search(query, groups=groups, top_k=20),           # résultat direct
    )
    merged = dedupe(semantic + lexical + title)
    ranked = reranker.rank(query, merged)                       # cross-encoder
    return [h for h in ranked if h.score >= 0.7][:10]
```

- **Sémantique**, pour le sens, quand les mots ne correspondent pas mais l'intention oui.
- **Plein texte**, pour le code de brevet exact ou le nom INCI précis qu'un embedding vectoriel fond dans ses voisins. « Rétinol » et « Rétinal » sont voisins dans l'espace vectoriel alors que ce sont deux molécules très différentes ; la recherche lexicale, elle, ne les confond pas.
- **Titre**, pour le résultat direct quand quelqu'un tape l'essentiel d'un nom de document.

Un reranker cross-encoder fusionne ensuite les trois jeux de résultats, retire les doublons et réordonne ce qui reste ; je ne garde que les résultats au-dessus d'un plancher de score de 0,7. Il justifie son coût. La similarité vectorielle pure est bonne en rappel et médiocre en tri, si bien que le résultat vraiment pertinent atterrit souvent en 7e position plutôt qu'en 1re. Le reranker lit la requête et chaque candidat ensemble, et remonte ce résultat en tête. À plus de 100 millions de pages, le rappel ne coûte rien et la précision fait tout : c'est l'étape qui empêche le dixième résultat vaguement lié de polluer la réponse.

**La latence de réponse p95 reste sous la seconde sur tout le corpus de plus de 100 millions de pages.**

Après le natif d'abord, le reranker est la deuxième meilleure décision du système. Un index vectoriel seul donne une démo qui a l'air formidable et un jeu de résultats subtilement faux dans l'ordre, ce qui est le pire genre de faux : il a l'air correct.

> Retour de terrain. Au début, une requête vide passait tout droit jusqu'à l'embedder, qui renvoyait tranquillement un vecteur à 768 dimensions pour « », et ce vecteur-là est à peu près équidistant de tout. La recherche remontait son top_k de documents quasi aléatoires, avec des scores d'apparence plausible, et rien ne plantait. J'ai cru à un bug de tri pendant presque une journée entière avant de remonter à un chemin d'UI qui envoyait une chaîne vide au focus. Le correctif tenait en une ligne : rejeter les requêtes vides ou faites uniquement d'espaces avant qu'elles n'atteignent l'embedder, plus un test qui l'aurait attrapé. La leçon : l'échec était silencieux parce que chaque couche faisait exactement ce qu'on lui demandait avec une entrée pourrie. On valide à la porte.

## Le contrôle d'accès vit dans la requête, pas après elle

La conception facile, ici, c'est une fuite de données en puissance. La tentation, c'est de lancer la recherche puis de filtrer les résultats par permission avant de les afficher. Sauf que le moteur a déjà touché des documents que l'utilisateur n'a pas le droit de voir. Un filtre oublié, un nouveau chemin de code, et une formule franchit une frontière de marque.

Alors le contrôle d'accès vit dans la requête. Chaque tenant reçoit son propre namespace Pinecone, si bien que l'isolation par marque est une propriété de la structure de l'index et pas un filtre boulonné après coup : une requête contre un namespace ne peut physiquement pas renvoyer un vecteur d'un autre. L'accès par document entre ensuite dans la requête elle-même, comme un filtre de métadonnées construit à partir des groupes de l'utilisateur. Ces groupes arrivent avec une identité dans un en-tête signé, que ni le modèle ni le client ne peuvent falsifier.

```python
result = index.query(
    namespace=tenant_id,                 # isolation par marque : structurelle
    vector=embed(query),
    filter={"acl_groups": {"$in": user_groups}},  # ACL par doc : dans la requête
    top_k=50,
    include_metadata=True,
)
```

Un utilisateur ne voit jamais un document pour lequel il n'est pas habilité, parce que la recherche ne le lit même pas. Deux personnes qui posent la même question depuis deux marques différentes obtiennent des réponses tirées de deux tranches distinctes du corpus, et aucune ne peut deviner que l'autre existe. La propriété que je voulais était simple à énoncer et difficile à enfreindre : un document qu'un utilisateur ne peut pas voir est un document que la recherche ne peut pas toucher.

**Zéro fuite entre marques : un document qu'un utilisateur ne peut pas voir est un document que la recherche ne lit jamais.**

Filtrer dans la requête plutôt qu'après les résultats, c'est un choix de sécurité, pas de performance. Le post-filtrage est toujours à un refactor d'une brèche ; le filtrage dans la requête fait du chemin sûr le seul chemin possible.

## Qui a ce problème

Brancher une IA sur un dossier de documents, c'est une démo d'un après-midi. Lire 100 millions de pages fidèlement, garder les tableaux honnêtes, imposer l'accès dès la requête : c'est un autre métier, et chaque décision ci-dessus existe parce que la version démo échoue en silence à l'échelle.

L'architecture se transfère telle quelle : lecture en natif d'abord, extraction qui tient compte de la mise en page, recherche hybride avec reranker, accès imposé dès la récupération. Quiconque traîne une décennie de documents que personne n'arrive à chercher a exactement ce problème : dossiers pharma et cosmétiques, contrats bancaires et fichiers KYC, bibliothèques de clauses juridiques, sinistres d'assurance en cinq mises en page et quatre langues.
