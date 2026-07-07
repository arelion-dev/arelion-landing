# Plan : A local-first AI coding stack

- **Pilier** : Build
- **Titre EN** : A local-first AI coding stack (when your code cannot leave the building)
- **Titre FR** : Une stack IA de dev 100% locale (quand le code ne doit pas sortir des murs)
- **Hook** : donner aux devs la puissance d'un assistant IA agentique sans jamais envoyer une ligne de code confidentiel à un cloud tiers.
- **Lecteurs** : CTO / RSSI (sujets sensibles) + devs (le confort de l'agent)

## NOTE DE CADRAGE (honnêteté)
- On n'a PAS livré ça pour un vrai client, et pas complètement pour nous. Donc on NE dit PAS "mission client livrée".
- Cadrage assumé : "une stack qu'on a assemblée et qu'on fait tourner, réutilisable pour une équipe qui code sur du sensible". Même move que l'article SQLite.
- "Grossir le trait" = ton et enjeux, PAS inventer un client ni une complétude qu'on n'a pas.

## The problem
- Des équipes travaillent sur du code / de l'IP sensible (défense, finance, santé, R&D).
- Les assistants IA cloud sont géniaux mais chaque prompt = du code confidentiel qui part chez un tiers.
- Beaucoup de boîtes interdisent donc purement l'IA aux devs -> elles perdent le gain de productivité.
- Le vrai besoin : le gain de l'IA agentique, sans que rien ne quitte la machine.

## What we built
- Une stack "local-first" : le modèle tourne sur TON hardware, le code ne sort jamais.
- Demo : un dev lance une tâche agentique (refactor, tests, revue) depuis son terminal ; l'agent lit le repo, propose un diff ; zéro appel réseau vers un LLM cloud.

## How it works (grounded)
- **opencode** : le CLI d'agent de code (lit le repo, édite, exécute), branché sur un modèle local.
- **ollama** : runtime qui sert le modèle localement (API compatible, pas de cloud).
- **qwen3.6** : le modèle de code local qu'on a benché (voir `opencode-bench`).
- **Paseo** : orchestrateur d'agents de code en headless sur une box Linux dédiée, piloté à distance (mobile / web) via un relay chiffré E2E -> les devs pilotent de partout mais le compute reste local.
- **OpenClaw** + box dédiée (mini-PC type Beelink) : le socle qui fait tourner tout ça h24, isolé.

## The hard part
- "Quel modèle local est assez bon pour du VRAI code ?" -> c'est tout l'enjeu du benchmark (qwen3.6). `[à confirmer : résultats du bench, vs quel modèle cloud, sur quelles tâches]`
- Tradeoff hardware / latence : faire tourner un modèle utile sur un mini-PC vs GPU. `[à confirmer : specs box + tokens/s]`
- Câbler un CLI agentique (opencode) sur un modèle local via ollama (contexte, tool-calling, fiabilité).
- Piloter en headless + à distance sans casser le "local" : le relay E2E laisse le code sur la box, seul le contrôle transite.
- Isolation / sécurité du socle (OpenClaw de-rooté, pas de sudo).

## Result
- Un assistant de code agentique complet, sans qu'une ligne de code quitte la machine.
- `[à confirmer : le gain mesuré, ou au moins "assez bon pour X, pas encore pour Y"]`

## Reusable
- Applicable à toute équipe sous contrainte de confidentialité (défense, finance, santé, cabinets).
- On installe/tune la même stack chez vous : choix du modèle selon votre hardware, wiring agent, accès distant sûr.
- CTA async écrit.

## Stack
- opencode, ollama, qwen3.6, Paseo (@getpaseo/cli), OpenClaw, mini-PC dédié (Linux)

## Angles LinkedIn (1 post par angle)
1. **[contrarian]** "Interdire l'IA à tes devs parce que c'est du cloud, c'est se tirer une balle dans le pied. La vraie réponse c'est local-first."
2. **[bench / how-to]** "Un modèle local est-il assez bon pour coder ? Ce que j'ai vu en benchant qwen3.6 avec opencode." `[à confirmer : chiffres]`
3. **[archi]** "Compute local, pilotage distant : comment donner un agent de code à tes devs sans qu'une ligne sorte de la box."

## À confirmer par toi
- **Hermès** : quel modèle exactement, et tu l'as vraiment tourné ? (introuvable dans les repos) -> je grounde ou on drop / on marque "envisagé".
- **para-kit** : c'est quoi ? (introuvable) -> idem.
- Les `[à confirmer]` du bench (résultats qwen3.6, hardware, tokens/s).
- On assume bien le cadrage "stack qu'on run, réutilisable" (PAS mission client) ?
