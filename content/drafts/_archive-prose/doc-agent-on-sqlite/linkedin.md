# LinkedIn posts: A multimodal document agent that runs on SQLite

---

## Post 1: Angle: le contrarian "pas de Pinecone" (flagship)

J'ai indexé toute la stack documentaire d'une entreprise avec SQLite.

Pas de Pinecone.
Pas de cluster.
Pas de service de recherche à maintenir.

Un fichier.

Des années de PDF sur un Drive : factures, contrats, relevés, liasses fiscales, baux.
OCRisés, classés, embeddés, cherchables depuis un CLI.

Le réflexe en 2026 c'est la base vectorielle managée.
Pour les documents d'UNE entreprise, c'est de l'infra à sécuriser et à payer pour rien.

sqlite-vec fait un cosinus brute-force sur les chunks.
À cette échelle : instantané, zéro serveur.

Le corpus d'une boîte n'est pas un index web à un milliard de vecteurs.
Arrête de dimensionner comme Google quand ton problème tient dans un fichier.

---

## Post 2: Angle: le sémantique seul ne suffit pas (hybride)

Ton RAG rate le numéro de facture.

C'est le piège de la recherche 100% sémantique.

Les embeddings sont excellents pour "trouve-moi les docs qui parlent de TVA".
Ils sont nuls pour retrouver un IBAN, un numéro de facture, une référence exacte.

Le plein texte fait l'inverse : parfait sur le token exact, aveugle à la paraphrase.

Dans le système documentaire que j'ai construit, les deux tournent ensemble :
- vecteurs via sqlite-vec
- plein texte via FTS5
- fusion par reciprocal rank fusion

Aucun poids à régler. Tu prends le meilleur des deux classements.

Le "vrai" travail d'un moteur de retrieval n'est jamais la partie vectorielle.
Ce sont les morceaux que tout le monde saute.

---

## Post 3: Angle: le levier de coût Flash/Pro

Payer GPT-de-luxe sur chaque page, c'est du gâchis.

Dans mon pipeline documentaire, la classification et l'OCR tournent sur Gemini 2.5 Flash.

Seuls les documents qui reviennent incomplets ont droit à UN retry sur Gemini 2.5 Pro.

Résultat : tu paies le prix Pro sur les quelques pages vraiment difficiles.
Pas sur toute la stack.

Autre optimisation dans le même esprit :
- pdftotext local d'abord (gratuit) pour les PDF qui ont déjà du texte
- OCR vision Gemini réservé aux vrais scans
- un doublon détecté par hash clone le doc existant, zéro appel Gemini

La bonne architecture LLM, c'est décider QUAND ne pas appeler le gros modèle.

---

## Post 4: Angle: le CLI comme produit (small-to-big + MCP)

Une commande. Une réponse vérifiable.

    bb-search "montant TVA facture fournisseur" --mode hybrid --year 2024

Retour :
- le montant, la ligne de TVA
- un lien vers la note
- le chemin du PDF source à ouvrir pour vérifier

Deux détails qui changent tout :

1. Small-to-big : on matche sur un petit chunk, mais on renvoie la page parente complète. Un total n'est jamais coupé à une frontière de chunk.

2. Le même store est exposé en MCP. L'agent qui répond à tes questions interroge la même base SQLite, en direct.

Pas de dashboard. Pas de SaaS. Un fichier et un CLI.

Si ton corpus est une entreprise et pas le web ouvert, c'est souvent tout ce qu'il faut.
