# LinkedIn posts (FR) : Document intelligence at scale

---

## Post 1, Contrarian : le vrai travail, c'est les garde-fous

Tout le monde sait brancher un LLM sur une base vectorielle.

Ce n'est pas ça, le projet.

Sur 100M+ de pages, 30 marques, une dizaine de langues, le chemin nominal marche en une après-midi.

Ce qui prend le temps, c'est tout ce qui empêche le système de s'effondrer :

- un agent de raisonnement, laissé seul, boucle. Il relance des recherches, empile des résultats, fait gonfler la requête jusqu'au timeout.
- donc on classe les outils : coûteux (recherche distante, plafond serré par tour) vs bon marché (lecture dans un doc déjà trouvé).
- et on borne la requête à CHAQUE appel modèle. Pas en fin de tour. La compaction ne s'exécute qu'après coup, elle ne vous sauve jamais en pleine boucle.

La démo, c'est 5% du travail.

Les 95% restants, c'est ce que personne ne montre : les plafonds, les budgets, l'ordonnancement équitable entre tenants pour qu'un import massif d'une marque n'affame pas les autres.

La question que je pose toujours avant de construire un RAG : qu'est-ce qui se passe quand ça boucle ?

---

## Post 2, War story : le multilingue n'est pas gratuit

Une question en français.

Un document en anglais.

Et entre les deux, un ingrédient qui a trois noms scientifiques.

C'est le piège du RAG multilingue que personne n'anticipe.

L'utilisateur tape "Vitamine C". La réponse est dans un rapport qui dit "Vitamin C", ou "Acide ascorbique", ou "L-ascorbic acid".

Un embedding naïf rate la moitié.

Deux choses règlent ça :

1. un modèle d'embedding réellement multilingue, qui tient les deux langues dans le même espace vectoriel.
2. une étape de reformulation, AVANT la récupération, qui étend les termes entre langues et synonymes.

Et le détail qui compte à grande échelle : la précision prime sur le rappel.

Avec 100M+ de pages, un top-k naïf noie la bonne réponse sous les quasi-doublons. C'est le reranker et l'agrégation au niveau document qui vont la rechercher.

Chercher plus large ne sert à rien si vous ne savez pas reclasser.

Votre recherche interne, elle fait quoi quand on lui pose la question dans la mauvaise langue ?

---

## Post 3, How-to : citer ses sources n'est pas une option

"L'IA a répondu, mais on ne sait pas d'où ça sort."

C'est la phrase qui tue un projet documentaire en entreprise.

Sur des brevets, des contrats, des specs confidentielles, une réponse sans source n'a aucune valeur. Pire : elle est dangereuse.

Comment on rend chaque réponse vérifiable :

- l'OCR ne renvoie pas que le texte, il renvoie les rectangles englobants de chaque paragraphe. On les stocke à part, pour surligner la zone EXACTE d'où vient l'extrait.
- chaque affirmation de l'agent porte une citation en ligne qui résout vers un document et un numéro de page précis.
- et si le corpus ne permet pas de répondre avec certitude, l'agent le DIT et demande de préciser, au lieu d'inventer.

Le contrôle d'accès, même logique : l'ACL de l'utilisateur voyage avec chaque recherche, réduite à l'intersection la plus restrictive de ses groupes. La récupération ne peut physiquement pas remonter un extrait non autorisé.

Une réponse fiable, ce n'est pas une réponse fluide.

C'est une réponse qu'on peut cliquer, ouvrir, et vérifier à la page près.

Combien de vos outils IA internes vous laissent remonter jusqu'à la source ?
