# LinkedIn posts (FR) : Un festival de trous, sous l'IA

---

## Post 1 : Angle : le festival

J'ai audité la stack d'une entreprise.

Ce n'était pas un trou.
C'était une saison entière.

Un inconnu, sur le domaine d'une autre société, possédait le cloud de prod.
Owner total. Lire, supprimer la base, couper les journaux d'audit.
Personne ne savait dire pourquoi.

Une clé de chiffrement expédiée dans le JavaScript de chaque visiteur.
Un mot de passe de base commité en clair, vivant pour toujours dans l'historique.
Un pare-feu applicatif qui journalisait tout et ne bloquait rien.

Aucune de ces failles n'est exotique.
Ce sont les échecs ennuyeux et catalogués.

Ils sont partout précisément parce qu'ils sont assez ennuyeux
pour qu'un code généré fluide les reproduise sans que personne ne bronche.

Le code assisté par IA sort vite.
Il sort aussi une nouvelle surface d'attaque.

Chez toi, qui la cartographie, cette surface ?

---

## Post 2 : War story : l'admin qui valait un cookie

L'accès admin tenait en une ligne.

La requête porte-t-elle un cookie appelé `admin_auth` ?

Pas : est-il signé.
Pas : correspond-il à une vraie session.
Juste : est-il présent.

Alors j'ai envoyé un cookie.
`admin_auth = nimporte quoi`.

Et j'étais admin.

Réécrire la page d'accueil publique.
Purger les caches.
Et le journal d'audit enregistrait sagement l'email
que je mettais moi-même dans un second cookie.

Le commentaire était encore dans le code :
"Simple cookie check instead of JWT token."

C'est ça, le pattern fréquent.
Pas le pattern correct.
Et le code généré adore le pattern fréquent : il l'a vu dix mille fois.

Le plus dur n'était pas de trouver le trou.
C'était d'expliquer qu'il se lisait comme du code propre.

Une porte d'admin dans ta stack : elle vérifie une identité,
ou juste la présence d'un cookie ?

---

## Post 3 : War story : le secret dans le navigateur

Un secret côté serveur n'est censé jamais quitter le serveur.

Sauf que certains frameworks ont une règle simple.
Toute variable préfixée d'un mot magique
est recopiée telle quelle dans le JavaScript envoyé à chaque navigateur.

Quelqu'un a nommé la clé de chiffrement avec ce préfixe.
Et son IV.
Et le jeton bearer qui parle au CMS.

Résultat : le secret qui signait les jetons d'aperçu
était dans le bundle public.
À un "afficher la source" de distance.

Personne n'a décidé de le publier.
Un préfixe, à une autocomplétion près, l'a fait tout seul.

Le code généré ne voit pas la frontière client / serveur comme toi.
Il voit un exemple qui compile et qui marche.

Alors il faut quelqu'un dont le job est de supposer
que le code généré est assuré et faux jusqu'à preuve du contraire.

Combien de secrets dorment dans le JS que tu sers déjà en prod ?
