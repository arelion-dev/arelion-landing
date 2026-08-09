---
title: "La surface d'attaque de l'IA"
date: "2026-03-26T09:50:00.000Z"
description: "Un audit de sécurité en lecture seule d'une plateforme de publication assistée par IA, à quelques jours de la mise en production. 49 constats, neuf élevés. L'IA écrit pour que ça marche. Elle n'écrit pas pour que ça tienne, et c'est dans cet écart que vivent les trous."
tags: ["Tech", "AI", "Security"]
private: true
---

Un groupe média était à quelques jours de basculer son trafic de production sur une plateforme de publication reconstruite à toute vitesse, une IA dans la boucle du début à la fin. Personne ne l'avait encore lue avec un œil hostile. Je m'en suis chargé : quatre couches sur cinq jours, et un rapport que le client a remis directement à sa propre équipe.

**49 constats, 9 élevés, 19 moyens, 21 faibles. Chaque constat élevé vérifié deux fois. Zéro livré sur une intuition.**

Tout l'audit est resté en lecture seule. J'ai cloné le dépôt, je l'ai lu, greppé, j'ai suivi les appels à travers, et je n'ai touché à rien : aucun déploiement, aucune écriture, l'équipe a continué de livrer pendant que je travaillais. Ensuite j'ai lu l'artefact livré comme un attaquant le lirait, sur quatre couches : code applicatif, IAM cloud, pipelines CI et infrastructure. J'appelle ça la lecture à quatre couches. Ce qu'elle attrape et qu'un scanner rate, c'est tout le reste de ce billet.

## Un scanner et une auto-relecture ratent les mêmes trous

Un scanner automatisé (ZAP, Burp, un passage de Nuclei en CI) sonde le site en marche par HTTP et lit les réponses qui reviennent. Jamais il ne voit la config de build qui décide quelles variables d'environnement partent vers le navigateur, l'historique git qui contient encore un mot de passe supprimé, ou la politique IAM cloud qui donne `roles/owner` à un tiers. C'est précisément là que se cachaient les pires trous de cette stack. Un passage DAST serait revenu propre pendant que le rôle owner restait là, intact.

L'auto-relecture, elle, échoue autrement, et toujours de la même façon. Une IA écrit pour « ça marche » : la fonctionnalité s'affiche, l'endpoint répond 200, le déploiement passe au vert. Le « sûr » n'apparaît presque jamais dans une démo, donc personne ne le demande au modèle, et le modèle ne le propose pas de lui-même.

Ensuite le relecteur voit que ça marche, « l'IA l'a écrit » devient discrètement « c'est bon », et le contrôle d'authentification sur lequel un ingénieur prudent se serait arrêté part le même après-midi. Le modèle optimise pour les critères d'acceptation du prompt, et « un attaquant ne peut pas forger ce cookie » n'en fait jamais partie. Multipliez ça sur une reconstruction complète : vous obtenez une plateforme qui passe tous les tests fonctionnels et qui fuit quand même.

## Les préfixes publics incorporent vos secrets dans le navigateur de chaque visiteur

Les frameworks front-end modernes décident de ce qui atteint le client par une convention de nommage. Toute variable d'environnement préfixée `NEXT_PUBLIC_`, `VITE_`, `PUBLIC_` ou `REACT_APP_` est remplacée textuellement dans le bundle JavaScript au moment du build. C'est le comportement voulu, prévu pour des identifiants d'analytics et des endpoints d'API publics.

Ici, le préfixe était posé sur des secrets. Une clé AES et un IV qui signaient les tokens de prévisualisation, plus un bearer token pour l'API de contenu, tous nommés avec un préfixe public et tous incorporés dans le bundle que chaque visiteur anonyme télécharge.

```dotenv
# représentatif, pas le code source du client
NEXT_PUBLIC_PREVIEW_SIGNING_KEY=8f3a...aes-256-key
NEXT_PUBLIC_PREVIEW_IV=1a2b...16-byte-iv
NEXT_PUBLIC_CONTENT_API_TOKEN=Bearer eyJ...
```

Au build, le framework fait une substitution littérale, et le bundle finit par transporter la clé mot pour mot :

```js
// ce qui finit dans le chunk livré, greppable dans les devtools
const signPreview = (id) =>
  aesSign(id, "8f3a...aes-256-key", "1a2b...16-byte-iv");
```

C'est le bug le plus reproductible par une IA de tout le rapport. Demandez à un modèle d'« exposer la clé de signature au composant de prévisualisation » : un préfixe public est le chemin le plus court vers un build vert. Ça marche dans la démo, ça remet la clé de signature à chaque visiteur en production, et la défaillance reste invisible jusqu'à ce que quelqu'un lance `grep -r "aes" .next/static`.

Un gestionnaire de secrets ne vous sauve pas ici : la fuite arrive au build, avant qu'une quelconque recherche à l'exécution ne tourne. Retirez le préfixe pour que la valeur reste côté serveur, déplacez la signature derrière une route d'API, puis faites tourner la clé. Elle est déjà publique.

## Un cookie qui dit `admin_auth=true` n'est pas de l'authentification

Une API d'administration capable de réécrire la page d'accueil et de purger le cache CDN reposait sur un seul contrôle : un cookie nommé `admin_auth`, que la page de connexion positionnait, dans le navigateur, à la chaîne `"true"`.

```js
// middleware représentatif, pas le code source du client
export function requireAdmin(req, res, next) {
  if (req.cookies.admin_auth === "true") return next(); // décoration, pas de l'authentification
  return res.status(401).end();
}
```

C'est un panneau « réservé au personnel autorisé ». Il n'arrête personne. N'importe qui peut envoyer le cookie à la main :

```bash
curl -X POST https://target/api/admin/purge-cache \
  -H "Cookie: admin_auth=true"
# 200 OK
```

La vraie authentification vérifie une session signée que le serveur émet et que le client ne peut pas forger : un JWT vérifié contre un secret détenu par le serveur, ou un identifiant de session recherché côté serveur. La seule propriété qui compte, c'est l'infalsifiabilité, et un contrôle de présence n'en a aucune.

```js
// ce que ça devrait être
const claims = verifyJwt(req.cookies.session, process.env.SESSION_SECRET);
if (!claims || claims.role !== ROLE_ADMIN) return res.status(403).end();
```

Une IA produit sans arrêt de l'authentification par simple présence, parce que « protège la page admin derrière la connexion » et « vérifie que le cookie admin est positionné » satisfont le même prompt, et le second fait moins de lignes. Le modèle n'a aucune notion d'un acteur malveillant qui enverrait la requête directement, alors il écrit le client et le serveur comme s'ils formaient une seule machine de confiance. Ce n'est pas le cas.

## Un secret dans l'historique git est brûlé à l'instant où il y arrive

Scanner les fichiers actuels ne suffit pas, parce que `git` n'oublie rien. J'ai lancé un scan d'historique sur chaque commit et chaque branche (`gitleaks detect`, recoupé avec `git log -p -S` pour les motifs précis), et j'ai trouvé un mot de passe de base de données actif, commité dans un fichier de config puis supprimé trois commits plus loin.

```bash
gitleaks detect --source . --log-opts="--all"
# ...
# Secret:  Postgres URI with password
# File:    config/database.yml
# Commit:  c0ffee1  (deleted in a1b2c3d, still reachable)
```

Le commit de suppression le rend invisible dans l'arbre de travail et ne change rien à l'exposition. La valeur reste dans le packfile pour toujours, et quiconque a déjà cloné le dépôt l'a déjà : chaque runner CI, chaque laptop de prestataire.

```bash
git show c0ffee1:config/database.yml | grep -i pass
# password: pr0d-db-actual-password
```

Voici la partie que les gens refusent d'admettre : un secret commité, on le fait tourner, on ne le « retire » pas. Réécrire l'historique avec `git filter-repo` nettoie l'origin, mais ça ne rappelle pas les clones. Traitez tout identifiant qui a un jour touché un commit comme public.

Le travail assisté par IA rend ça plus fréquent. Un modèle collera volontiers une chaîne de connexion fonctionnelle dans un fichier de config pour faire réussir l'exécution locale, et l'humain qui relit le diff voit une config plausible et rate la fuite.

## Un pare-feu en mode journalisation seule est un détecteur de fumée dont on a débranché l'alarme

Un pare-feu applicatif web était attaché au load balancer et laissé en mode journalisation seule (détection). Il regardait passer injection SQL et traversée de répertoire, les écrivait dans un journal, et n'en bloquait aucune.

```hcl
# Terraform représentatif, pas le code source du client
resource "google_compute_security_policy" "waf" {
  rule {
    action = "preview"   # journalisation seule : matche, enregistre, ne bloque pas
    match { expr { expression = "evaluatePreconfiguredExpr('sqli-stable')" } }
  }
}
```

Chaque WAF managé propose ce mode pour régler les règles sans casser le trafic réel. Le piège : dans la console, il a l'air identique à un WAF actif, règles attachées, matchs qui montent dans le tableau de bord. L'action `preview` (ou `COUNT` chez AWS) est la seule différence, et c'est un seul mot. L'équipe a payé pour une protection et a livré avec la protection éteinte. Correctif : passer `preview` à `deny` (ou `COUNT` à `BLOCK`), un changement d'un mot une fois qu'on sait où regarder.

## Un compte externe ne devrait jamais détenir `roles/owner` sur la production

En lisant la politique IAM cloud, j'ai trouvé un compte extérieur à l'entreprise qui détenait `roles/owner` sur le projet de production. Owner, c'est total : lire chaque secret, supprimer chaque ressource, ajouter et retirer d'autres membres, et couper les journaux d'audit en partant.

```bash
gcloud projects get-iam-policy prod-project --format=json | \
  jq '.bindings[] | select(.role=="roles/owner")'
# {
#   "role": "roles/owner",
#   "members": ["user:contractor@some-agency.example"]
# }
```

Une boîte mail compromise, ou une relation qui tourne mal, et on est à un pas de la prise de contrôle totale. Le correctif, c'est le moindre privilège : cantonner ce compte exactement aux rôles qu'il utilise (disons `roles/run.developer` plus `roles/artifactregistry.writer`), garder `roles/owner` sur une seule identité interne et auditée, et préférer des comptes de service à courte durée de vie plutôt que des owners humains permanents.

Un IAM sur-dimensionné est un bug de « faire marcher tout de suite », et les équipes assistées par IA y tombent plus fort : le modèle qui met en place le déploiement suggérera joyeusement `roles/owner` pour passer une erreur de permission. Le chemin le plus rapide vers un déploiement vert, et le rayon d'explosion le plus large possible.

## Quatre autres trous qu'un test fonctionnel ne peut pas voir

À côté des six précédents : un endpoint GraphQL non authentifié qui renvoyait des brouillons non publiés à quiconque devinait un identifiant numérique, des buckets de stockage publics qui autorisaient le listage anonyme d'objets, des secrets cuits dans les couches d'image de conteneur (visibles avec `docker history`, ce qui rend la variable d'environnement à l'exécution hors sujet), et le service principal qui tournait en root dans son conteneur. Tous ont la même forme : ça marche dans la démo, et c'est un trou en production.

## Chaque constat élevé a été vérifié deux fois avant d'entrer dans le rapport

Chaque constat élevé a été reproduit une deuxième fois, indépendamment, avant de mériter une ligne : grepper le bundle, envoyer le curl brut, lire le packfile, extraire la politique IAM. Cette discipline fait la différence entre un rapport que le client remet à sa propre équipe sans moi dans la pièce, et une liste de peut-être qui se fait balayer dès la première réunion.

**9 constats élevés, tous corrigeables en jours, pas un seul qui demande une reconstruction.** Renommer les variables à préfixe public et faire tourner la clé exposée. Vérifier une identité signée à l'intérieur du handler admin plutôt que la présence d'un cookie. Faire tourner le mot de passe commité et le purger de l'historique. Cantonner le rôle owner cloud à un seul compte interne. Sortir le pare-feu du mode journalisation seule. Aucun de ces correctifs ne demande une nouvelle architecture ; ils demandent que quelqu'un ait regardé.

J'ai aussi noté ce qui était déjà solide, pour que l'équipe sache quoi garder et ne défasse pas du bon travail en corrigeant le reste.

> Limite honnête. La lecture à quatre couches est une lecture à un instant t du code source, de la config et des permissions. Elle prouve qu'un trou existe dans ce qui a été livré ; elle ne prouve pas une exploitation en production, et elle devient périmée au prochain déploiement. Elle remplace un premier audit sérieux. Ce n'est pas une pile de détection en fonctionnement. Je l'ai dit dans le rapport, avec ces mots.

## Qui a ça

Toute équipe qui livre avec une IA dans la boucle, sans personne pour chasser spécifiquement ces motifs, en a presque à coup sûr quelques-uns en ce moment même, qui passent chaque test, verts dans chaque pipeline. Même lecture, mêmes quatre couches, une autre stack, les mêmes familles de trous. Ils remontent quand quelqu'un lit le produit livré comme le ferait un attaquant, avant l'attaquant. Cette lecture, c'est tout le métier, et c'est la seule chose que l'IA qui a écrit le code ne fera pas pour vous.
