# LinkedIn posts : Keeping a human in the loop

---

## Post 1 : Automatiser 100% d'une décision KYC, c'est une faute

Automatiser à 100% une décision KYC, c'est une faute.

Pas une opinion. Une question de responsabilité.

Une IA documentaire moderne est excellente.

Mais elle échoue de la pire façon pour la conformité :

elle échoue avec assurance.

Un classifieur qui décide, score élevé à l'appui, qu'une lettre de refus est un justificatif de domicile.

Un modèle qui lit une mauvaise date de naissance sur un scan pourri, sans le moindre doute affiché.

"Faux avec assurance", ça va pour une barre de recherche.

Pour onboarder un investisseur, c'est un manquement réglementaire à votre nom.

La solution n'est pas de retirer l'IA.

C'est de mettre l'humain là où l'IA est la plus faible : le verdict final.

L'IA lit, classe, extrait, contrôle.

L'humain tranche.

Sur quelle décision refuseriez-vous, vous, de laisser une IA avoir le dernier mot ?

---

## Post 2 : Le design qui rend l'automatisation acceptable : le seuil de confiance

Le truc qui rend une IA acceptable sur une décision à fort enjeu ?

Elle score sa propre incertitude.

Et cette incertitude route le travail.

Sur un pipeline KYC que j'ai construit, chaque document porte des scores :

confiance OCR par page (on garde la pire).

confiance de classification.

Ces nombres ne décorent rien. Ils décident qui traite quoi.

La logique :

Au moins un blocage dur → dossier non conforme.

Aucun blocage, mais un signal faible → revue humaine.

Rien du tout → ça peut passer.

Couche IA indisponible ? Un dossier qui passerait est rétrogradé en revue manuelle.

Jamais validé en silence.

Le blocage reste déterministe et reproductible.

Le LLM, lui, est consultatif : il lève un "à vérifier", jamais un "non".

Le confortable et le risqué ne prennent pas le même chemin.

Vos systèmes IA savent-ils dire "je ne suis pas sûr, fais voir un humain" ?

---

## Post 3 : Un bon human-in-the-loop rend l'IA meilleure (mais pas comme vous croyez)

"Le feedback humain entraîne l'IA."

On me le dit souvent. Et souvent, c'est faux.

Sur mon pipeline KYC, quand un opérateur valide ou invalide un dossier :

aucun poids n'est mis à jour.

aucun modèle n'est réentraîné.

la décision gate ce cas-là, avec commentaire obligatoire, dans un journal d'audit.

Et pourtant, le système s'améliore vraiment avec le temps.

Par un autre chemin, plus solide :

l'humain repère une erreur systématique.

une regex qui rejette le nouveau format de CNI.

un signal "revenu trop faible" qui comparait au mauvais montant.

Un ingénieur encode le correctif comme règle déterministe.

Et le verrouille avec un test de régression bâti sur le cas réel.

De meilleures règles. Pas un modèle magique.

Auditable. Reproductible. Ça ne régresse pas.

Pour de la conformité, c'est exactement la boucle qu'on veut.

Alors quand on vous vend une IA qui "apprend de vos retours"...

vous demandez à voir quoi, exactement ?
