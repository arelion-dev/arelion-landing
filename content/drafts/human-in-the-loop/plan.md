# Plan : Keeping a human in the loop

- **Pilier** : Automate
- **Titre EN** : Keeping a human in the loop
- **Titre FR** : Garder un humain dans la boucle
- **Hook** : pourquoi le KYC et la conformité documentaire pilotés par IA ont besoin d'une étape de revue humaine, et comment le jugement de l'humain attrape les erreurs ET améliore le système dans le temps.
- **Lecteurs** : CEO (haut + résultat) / CTO (how it works + feedback loop)

## The problem
- Le KYC est une décision de conformité à fort enjeu. Onboarder le mauvais investisseur, rater un ID expiré, laisser passer un doc appartenant à quelqu'un d'autre = manquement réglementaire à ton nom, pas une mauvaise métrique UX.
- L'IA documentaire moderne est bonne mais échoue de la pire façon pour la conformité : elle échoue avec assurance. Un classifieur peut décider, score élevé, qu'une lettre de refus est un justificatif de domicile. Un modèle d'extraction peut lire une mauvaise date de naissance sur un scan pourri sans signaler de doute.
- "Faux avec assurance" va pour une barre de recherche. C'est une responsabilité quand la sortie onboarde un client.
- Réponse : pas retirer l'IA, mais mettre l'humain là où l'IA est la plus faible : le verdict final.

## What we built
- Pour une fintech qui onboarde des investisseurs dans des fonds régulés : pipeline KYC assisté par IA avec une étape de revue humaine obligatoire.
- L'IA fait le gros du travail répétitif : lire chaque doc, classer, extraire les champs, lancer les contrôles réglementaires. Elle ne rend jamais le verdict final. Un opérateur conformité le rend, sur un écran qui montre le raisonnement de l'IA, les preuves, et un lien direct vers chaque doc source.
- Demo (input -> output) : un investisseur upload un ID, un justificatif de domicile, un RIB -> le pipeline OCRise chacun, classe (CNI, justif domicile, RIB), extrait les champs typés, et contrôle le dossier entier (ID expiré ? justif assez récent ? adresse ID = adresse facture ? manque-t-il quelque chose ?) -> l'opérateur voit un verdict de dossier unique et tranche.

## How it works (grounded)
- Chaque doc porte des scores de confiance. L'OCR produit une confiance par page (on garde la pire). La classification produit son propre score 0 à 1. Ces nombres routent le travail.
- Le verdict de dossier = deux couches. (1) Code déterministe : règles d'expiration ID, mismatch de slot documentaire, matching d'adresse, complétude du dossier, confiance OCR. Auditable, reproductible, seule couche autorisée à bloquer. Si la pire page OCR passe sous 0.85, le doc est flaggé pour un oeil humain. (2) Jugement LLM qui applique la policy conformité éditable aux données extraites. Strictement consultatif : peut lever un "check this", jamais un échec dur.
- Routage : au moins un échec dur = dossier non conforme. Aucun échec mais au moins un flag doux = revue humaine. Rien du tout = peut passer. Si la couche LLM est indisponible, un dossier qui passerait est rétrogradé en revue manuelle, jamais validé en silence.
- `[à confirmer : seuil exact de classificationConfidence qui force un oeil humain]` ; aujourd'hui les signaux fiables de route-to-human = confiance OCR basse et docs non classés ou mismatchés.

## The feedback loop
- La partie honnête : la décision humaine de valider/invalider un dossier NE train PAS de modèle. Dans le code, c'est un enregistrement append-only avec commentaire obligatoire au rejet, dénormalisé sur l'investisseur pour le tri, écrit dans un log d'audit. Ça gate ce cas-là. Pas réinjecté comme exemple au LLM, aucun poids mis à jour.
- Le système s'améliore vraiment, par un autre chemin délibéré : les humains éditent les règles. Quand un opérateur voit l'IA faire une erreur systématique (regex qui rejette le nouveau format de CNI, flag "revenu trop faible" qui comparait au mauvais montant), un ingénieur encode le fix comme règle déterministe / validateur / filtre de faux positif, et le verrouille avec un test de régression bâti sur le cas réel.
- Éditer un type de doc revalide le corpus existant contre les nouvelles règles.
- Boucle = le jugement humain fait surface l'erreur, le code la capture, les tests la gardent fixée. De meilleures règles, pas un modèle réentraîné. Pour la conformité, c'est la boucle qu'on veut : légitime et auditable.

## Reusable
- Pattern pour toute décision IA à fort enjeu où être faux avec assurance coûte cher : conformité, triage médical, revue juridique, modération de contenu.
- Forme constante : le modèle fait le volume, score sa propre confiance, route l'incertain et le conséquent vers un humain, et traite chaque correction humaine comme un changement de spec des règles adossé à un test, pas comme une vague promesse que le modèle "apprendra".

## Stack
- TypeScript, Fastify, Prisma, MySQL, Mistral Document AI, jugement LLM

## Angles LinkedIn (1 post par angle)
1. **[prise de position]** Automatiser 100% d'une décision KYC est une faute : l'IA échoue avec assurance, on met l'humain là où elle est la plus faible (le verdict final).
2. **[design]** Le truc qui rend l'automatisation acceptable = le seuil de confiance : le doc score sa propre incertitude et cette incertitude route le travail ; le blocage reste déterministe, le LLM reste consultatif.
3. **[contrarian]** "Le feedback humain entraîne l'IA" est souvent faux : ici aucun poids réentraîné, mais l'humain repère l'erreur systématique et un ingénieur l'encode en règle verrouillée par un test. De meilleures règles, pas un modèle magique.

## À confirmer par toi
- Le seuil `[à confirmer]` (classificationConfidence exact qui force un oeil humain).
- On garde "a fintech" en générique ou tu assumes le client en high-level ?
