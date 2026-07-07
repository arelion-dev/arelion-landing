# Plan : A festival of holes, what one real audit found under the AI

- **Pilier** : Audit
- **Titre EN** : A festival of holes: what one real audit found under the AI
- **Titre FR** : Un festival de trous : ce qu'un vrai audit a trouvé sous l'IA
- **Hook** : le code assisté par IA livre une nouvelle surface d'attaque (secrets commités, secrets poussés dans le navigateur, un gate admin qu'on bypasse avec un cookie mis à la string "true"). Tour anonymisé d'un vrai audit de sécurité devenu un festival de findings.
- **Lecteurs** : CEO (haut + why this keeps happening) / CTO (findings + how we fixed it)

## The problem
- L'IA écrit du code plus vite que quiconque ne le review. C'est tout le problème en une phrase.
- Un modèle livre une feature qui marche en un prompt (route, bucket, job, intégration). Ça compile, ça passe le smoke test, ça merge. Ce qu'il ne fait jamais : s'arrêter et demander si ce bucket devrait être public, si cette clé a sa place dans le repo, si le pattern reproduit dix mille fois était bon ou seulement fréquent.
- Le danger n'est pas le code, c'est la phrase "l'IA l'a écrit" qui se lit en douce "donc c'est bon". La PR d'un junior est scrutée ; la sortie d'un modèle a droit à un coup d'oeil et un merge, parce qu'elle est fluide et abondante. La fluidité n'est pas la sécurité. La confiance n'est pas la correction.

## What I do
- Un audit de sécurité focalisé : une vraie carte de la surface d'attaque, pas une checklist de scanner. Ce qui est exposé, ce qui porte des secrets, qui parle à quoi, où la confiance est supposée plutôt qu'imposée.
- Passe technique sur les repos, l'IAM cloud, le storage, les endpoints publics, l'arbre de dépendances, l'historique git. Puis la partie que la plupart des audits sautent : comment le code ship réellement, et où les secrets sont censés vivre versus où ils finissent. Les trous vivent dans cet écart.
- Ce qui suit est anonymisé d'un vrai engagement pour une media company. Chaque finding est réel, seuls les identifiants ont disparu.

## What I found (the festival)
- **Un inconnu possédait le cloud.** Le projet de prod avait deux comptes owner. L'un = la boîte. L'autre = un compte Google sur le domaine d'une autre société, ownership total inconditionnel (tout lire, minter des clés, supprimer la DB, couper les audit logs). Personne ne savait pourquoi il était encore là.
- **La clé de chiffrement expédiée à chaque visiteur.** Le framework front inline toute variable préfixée `NEXT_PUBLIC_` dans le JS envoyé à chaque navigateur. Quelqu'un a nommé la clé AES, son IV et un bearer token CMS avec ce préfixe. Le secret qui signait les preview tokens était dans le bundle public, à un "view source" de distance.
- **L'accès admin = un cookie mis à la string "true".** Le gate de l'API de contenu tenait en une ligne : la requête porte-t-elle un cookie `admin_auth` ? Pas signé, pas mappé à une session. Juste présent. `Cookie: admin_auth=whatever` permettait de réécrire la home publique et purger les caches, pendant que l'audit log enregistrait sagement l'email mis dans un second cookie. Le commentaire, toujours dans le code : "Simple cookie check instead of JWT token."
- **Un mot de passe de DB live, commité pour toujours.** Un build config portait une connection string complète, user + password en clair : `mongodb+srv://appuser:S3cr3tPass@...`. Faire tourner la ligne visible ne change rien : il vit dans chaque clone et chaque fork de l'historique.
- **Articles non publiés, lisibles par n'importe qui.** L'API de lecture publique gardait son endpoint de liste mais pas son endpoint single-item. Deviner un id numérique = récupérer des brouillons et articles sous embargo avant leur existence prévue.
- **Chaque robot de build lisait chaque secret.** Un grant large laissait le compte de déploiement, les deux comptes de build et le compte compute par défaut lire tous les secrets du projet (mot de passe DB, clé mail, secret OAuth, clé privée TLS multi-année). Commentaire justificatif : "per-secret bindings would be a maintenance burden."
- **Un pare-feu qui loggait et ne bloquait jamais.** Un WAF en bordure avec règles injection, XSS, brute-force login. Chaque règle en mode preview : évaluée, loggée, jamais appliquée. Seule règle live = "allow everything".
- Et le casting secondaire : mot de passe de DB de prod en clair dans un fichier d'état d'infra local, deux buckets object-storage listables de bout en bout par n'importe qui, ~deux douzaines de secrets cuits dans les layers de l'image conteneur, le service principal tournant en root, un lockfile pinné sur une version d'une lib populaire que le registre public n'a jamais publiée.

## Why this keeps happening
- Certains findings sont la surface d'attaque moderne, pas l'IA : un inconnu avec droits owner, un pare-feu en log-only, un grant trop large. Échecs ennuyeux et catalogués, toujours là, qu'un modèle soit impliqué ou non.
- Mais le haut de la liste : hardcoder un secret (l'exemple le plus court est une valeur littérale inline, pas une référence à un secrets manager que le modèle ne voit pas). Le pousser au client (un préfixe de framework est à une autocomplétion près, rien ne crie). Gater un API admin sur la présence d'un cookie (c'est le pattern fréquent du corpus d'entraînement, pas le correct).
- Le modèle reproduit le pattern fréquent, avec assurance, sur beaucoup de fichiers. Et la confiance est le multiplicateur : du code non sûr qui se lit comme du senior passe sans broncher. L'étape de review, le seul contrôle qui attrape cette classe, est celle que le workflow a discrètement retirée.

## How we fixed it
- Chaque finding livré avec un fix concret, classé par exploitabilité réelle et blast radius, pas par un label de scanner :
  - Faire tourner les secrets commités et exposés au navigateur, les purger de l'historique.
  - Sortir les secrets serveur du bundle client.
  - Remplacer le check de cookie par une vraie session signée.
  - Ajouter le guard manquant sur le chemin de lecture.
  - Scoper les grants de secrets par compte et par secret, downgrader l'owner externe.
  - Sortir le pare-feu du mode preview pour qu'il bloque vraiment.
- Le rapport se clôt sur un plan de durcissement, pour que la même classe ne repousse pas après mon départ.

## Reusable
- Si ton équipe ship avec l'IA et personne ne chasse spécifiquement les credentials fuités, les secrets exposés au client, l'auth devinable et les contrôles laissés éteints, tu en as en ce moment. Pas peut-être. Le workflow qui les produit est celui que tu tournes déjà.
- Cette classe est trouvable et réparable sans ralentir l'équipe. Il faut juste quelqu'un dont le job est de supposer que le code généré est confiant et faux jusqu'à preuve du contraire.

## Stack
- Audit de sécurité, revue IAM cloud, scanning de secrets, analyse statique, threat modeling

## Angles LinkedIn (1 post par angle)
1. **[le festival]** J'ai audité la stack d'une entreprise : pas un trou, une saison entière (owner inconnu, clé dans le JS de chaque visiteur, mot de passe commité, pare-feu qui journalise et ne bloque rien). Chez toi, qui cartographie cette surface ?
2. **[war story]** L'admin qui valait un cookie : le gate tenait à la présence d'un cookie `admin_auth`, pas signé, pas de session. J'ai envoyé un cookie, j'étais admin. Le code généré adore le pattern fréquent, pas le correct.
3. **[war story]** Le secret dans le navigateur : un préfixe magique recopie toute variable dans le JS servi à chaque visiteur ; la clé de chiffrement, son IV, le bearer CMS s'y sont retrouvés. Un préfixe, à une autocomplétion près, a publié le secret tout seul.

## À confirmer par toi
- N/A : aucun `[à confirmer]` dans l'article (findings réels, seuls les identifiants sont anonymisés).
- On garde "a media company" en générique ou tu précises le secteur en high-level ?
