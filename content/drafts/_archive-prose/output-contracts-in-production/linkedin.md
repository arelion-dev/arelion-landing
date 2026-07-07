# LinkedIn posts (FR)

---

## Post 1 : La thèse (punchy)

Ce n'est pas dans le prompt que la fiabilité se joue.

C'est à la sortie.

Tout le monde optimise le prompt.

En gras, en majuscules, "toujours filtrer par tenant", trois fois.

Et le modèle, parfois, ne le fait pas quand même.

Parce qu'un prompt façonne la distribution des sorties.

Il ne la borne pas.

Pour une propriété de sécurité, "en général" veut dire "non".

Le vrai design est plus simple.

Le modèle propose.

L'architecture dispose.

Chaque requête SQL générée passe par un validateur avant de toucher la base.

SELECT uniquement. Une seule table. Aucune fonction fichier ou réseau. LIMIT borné.

Si ça ne passe pas, c'est rejeté.

Jamais propagé, jamais "nettoyé et lancé quand même".

Le périmètre d'accès, c'est le code qui l'injecte.

Pas le modèle. On ne lui fait pas confiance pour ça.

Ça marche avec n'importe quel modèle, de n'importe quel fournisseur, de ce mois-ci ou du prochain.

La porte ne bouge pas.

Vous mettez votre effort de fiabilité dans le prompt ou dans la sortie ?

---

## Post 2 : La war story (JSON malformé)

Un objet "presque correct" ne crashe pas tout de suite.

C'est ça le piège.

Un modèle renvoie un objet de métadonnées.

Un champ censé être une chaîne arrive en dictionnaire imbriqué.

L'objet est accepté. Il entre dans le store.

Trois services plus loin, un sérialiseur lève une exception.

Un job meurt.

Un retry redémarre, remeurt, redémarre.

Vous debuggez un incident à 200 km de la vraie cause : un champ mal typé, avalé sans bruit, à l'entrée.

La leçon n'est pas "meilleur prompt".

La leçon c'est un contrat à la porte.

Un schéma Pydantic strict. Types, bornes, invariants inter-champs.

Champs supplémentaires interdits, pour qu'on ne glisse pas un identifiant de tenant dans une table partagée.

Clés réservées rejetées.

Un objet malformé ne devient pas un 500 au fond d'un worker.

Il devient une ValidationError à la porte.

Mappée sur un 4xx propre, journalisée, avec sa cause.

Le bug n'a jamais voyagé.

Combien de vos incidents "aléatoires" sont en fait une sortie non validée qui a voyagé trop loin ?

---

## Post 3 : Le how-to (la couture)

Vous branchez un LLM sur votre système.

Voici la seule frontière qui compte vraiment.

Partout où un modèle passe du travail structuré à du code, il y a une couture.

Pipeline multi-agents. Backend RAG. Agent à tool-calling.

C'est là que se pose le contrat de sortie. Concrètement :

1. Définir le contrat à la couture.

Un schéma. Types, bornes, champs requis, invariants. Pas une suggestion, une spec.

2. Valider dur, sur le chemin critique.

Pas un monitoring d'après-coup qui alerte une fois que c'est parti. Une porte que rien ne franchit sans passer.

3. Échouer fermé.

Un chemin qui exige des groupes d'accès et n'en résout aucun matche zéro ligne. Jamais toutes.

4. Valider des deux côtés.

Le service qui génère et celui qui exécute revalident, chacun de son côté. Un bug dans l'un ne devient pas un incident.

5. Rendre les rejets observables.

Chaque rejet journalisé avec sa cause. Un pic de rejets vous parle de votre prompt, de votre modèle, ou d'une attaque.

Rien là-dedans n'est spécifique à un modèle.

Le prompt, c'est là où vous demandez gentiment.

Le contrat, c'est là où vous vous assurez.

Laquelle de ces cinq étapes manque dans votre stack agent aujourd'hui ?
