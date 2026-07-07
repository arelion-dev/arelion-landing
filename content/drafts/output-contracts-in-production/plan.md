# Plan : Output contracts in production

- **Pilier** : Automate
- **Titre EN** : Output contracts: what reliable LLM agents actually look like in production
- **Titre FR** : Contrats de sortie : à quoi ressemble vraiment un agent LLM fiable en production
- **Hook** : la fiabilité d'un agent ne se joue pas dans le prompt mais à la sortie. Le modèle propose, l'architecture dispose : chaque requête ou objet généré est validé contre un contrat strict avant que quoi que ce soit en aval ne le voie.
- **Lecteurs** : CEO (haut + résultat) / CTO (how it works + hard part)

## The problem
- Le mode d'échec que personne ne screenshote : la sortie "presque correcte".
- Une requête SQL qui parse, tourne, donne une réponse plausible, mais oublie un filtre tenant -> compte des documents interdits à l'utilisateur.
- Ou un objet de métadonnées où un champ censé être une string est un dict imbriqué -> trois services plus loin un sérialiseur lève, un job meurt, un retry storm démarre.
- Rien de ça n'est rattrapé par un meilleur prompt. "Toujours scoper par tenant" en gras, en majuscules, trois fois, et le modèle, parfois, ne le fait pas.
- Contexte : système servant des milliers d'utilisateurs dans une grande entreprise, agent LLM qui répond sur une grande bibliothèque documentaire privée. Faux = fuite de données ou pipeline corrompu. Prémisse : le modèle propose, l'architecture dispose.

## What we built
- Des contrats de sortie, appliqués à chaque frontière où un modèle passe du travail à du code.
- Deux portent l'essentiel : (1) le SQL généré par le LLM, (2) les objets de métadonnées qui entrent dans le store.
- Demo (input -> output) : l'agent émet `SELECT record_type, count(*) FROM records GROUP BY record_type LIMIT 200` -> avant toute connexion DB, la string est parsée en arbre syntaxique et vérifiée (exactement un statement, un SELECT et rien d'autre, la seule table autorisée, aucune fonction fichier/réseau, LIMIT borné), puis le périmètre d'accès de l'appelant est injecté en réécrivant l'arbre. Même un `count(*)` nu ne voit que les lignes autorisées. Le modèle ne scope jamais sa propre requête.

## How it works (grounded)
- Objets structurés : schémas Pydantic `BaseModel`. Types de champs, bornes de longueur, champs requis, invariants inter-champs en validateurs. Clés réservées rejetées. Sur un request model, champs supplémentaires explicitement interdits (pas de tenant identifier glissé dans une table partagée). Objet malformé = `ValidationError` à la porte, mappée sur un 4xx propre, pas un 500 au fond d'un worker.
- SQL : le validateur parcourt l'AST et rejette tout node write, DDL ou command n'importe où (y compris caché dans un CTE). Allow-list de tables. Denylist de fonctions qui touchent le FS, le réseau, l'état serveur. LIMIT obligatoire et borné.
- Boucle reject / correct / retry / block. Ici le move imposé = reject and block : si le SQL généré échoue la validation, il est loggé et la requête renvoie un no-answer. Jamais propagé, jamais partiellement exécuté, jamais "nettoyé et lancé quand même". Fail closed = feature, pas fallback. Un chemin qui exige des groupes d'accès et n'en résout aucun matche zéro ligne, jamais toutes.
- Validation des deux côtés : le service qui génère ET celui qui exécute revalident, indépendamment. Un bug dans l'un ne devient pas un incident.
- Rien de spécifique au modèle : le contrat ne sait pas de quel vendeur ni de quel mois vient le texte. Swap le modèle librement, la porte ne bouge pas.

## The hard part
- Le prompting naïf échoue précisément là où ça compte : la sortie rare, adverse ou malformée. Un prompt façonne la distribution des sorties, il ne la borne pas. Pour une propriété de sécurité ou d'intégrité, "en général" est un synonyme de "non".
- Donc la validation ne peut pas être consultative : non négociable, sur le hot path, pas un monitoring d'après-coup qui flag après le ship.
- Coût d'ingénierie réel : maintenir les schémas, garder les validateurs des deux côtés en sync, résister à la tentation du bypass "juste cette fois".
- Rendre les rejets observables : chaque rejet loggé avec sa cause (un pic de rejets = signal sur ton prompt, ton modèle, ou une attaque).

## Result
- Invariant garanti par construction : aucune sortie modèle non validée n'atteint la base ou un consommateur aval.
- Taux de rejet, nombre d'incidents, surcoût de latence en prod = `[à confirmer]`.

## Reusable
- Pas spécifique aux documents, au SQL, ni à un client. Tout système où un modèle passe du travail structuré à du code a la même couture : pipeline multi-agents, backend RAG, workflow LLM-in-the-loop, agent tool-calling.
- Définir le contrat à la couture. Valider dur. Échouer fermé. Rejeter bruyamment et de façon observable.
- Le prompt = là où tu demandes gentiment. Le contrat de sortie = là où tu t'assures.

## Stack
- Python, Pydantic, sqlglot, PostgreSQL, Google ADK

## Angles LinkedIn (1 post par angle)
1. **[la thèse]** La fiabilité ne se joue pas dans le prompt, mais à la sortie : le modèle propose, l'architecture dispose, chaque SQL généré passe un validateur avant de toucher la base.
2. **[war story]** Un objet "presque correct" ne crashe pas tout de suite : le JSON malformé avalé à l'entrée qu'on debugge en incident à 200 km de la vraie cause. La leçon = un contrat Pydantic à la porte.
3. **[how-to]** La seule frontière qui compte : définir le contrat à la couture, valider dur sur le hot path, échouer fermé, valider des deux côtés, rendre les rejets observables (5 étapes).

## À confirmer par toi
- Les 3 métriques `[à confirmer]` (taux de rejet, incidents, surcoût de latence).
- On garde "a global enterprise" en générique ou tu assumes le client en high-level ?
