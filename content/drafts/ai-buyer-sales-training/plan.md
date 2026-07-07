# Plan : Your sales reps train against an AI buyer that talks back

- **Pilier** : Build
- **Titre EN** : Your sales reps train against an AI buyer that talks back
- **Titre FR** : Vos commerciaux s'entraînent contre un acheteur IA qui répond
- **Hook** : un acheteur IA vocal en temps réel qui joue un prospect résistant, pour que les commerciaux répètent leur pitch et le traitement d'objection à voix haute avant d'appeler un vrai prospect. Sur Gemini audio natif via une boucle WebSocket.
- **Lecteurs** : CEO (haut + résultat) / CTO (how it works + hard part)

## The problem
- Les commerciaux apprennent leur métier sur de vrais prospects : le pire terrain possible. Chaque pitch maladroit, chaque objection ratée, chaque silence gênant se joue devant quelqu'un qu'on voulait signer.
- Boucle de feedback lente (on apprend des semaines plus tard que le deal est mort), chère (du vrai pipeline brûle), impossible à répéter (pas de re-run du même appel trois fois pour tester trois approches).
- Le jeu de rôle avec un collègue aide, mais les collègues fatiguent, sont indulgents, ne tiennent pas un personnage cohérent 20 minutes.
- Une équipe B2B voulait quelque chose qu'un commercial ouvre à 7h, appelle, et à qui pitcher autant qu'il veut, contre un prospect qui résiste comme un vrai.

## What we built
- Un acheteur IA temps réel qu'on appelle littéralement. Le commercial choisit un scénario, clique "call", parle. En face : une voix qui joue un persona d'acheteur précis (esquive, objecte, se tait, ne se réchauffe que si on le gère bien). Ne sort jamais de son rôle, n'aide jamais. Au raccroché, il note la conversation.
- Demo (extrait de session) : Rep "je voulais vous montrer notre onboarding" -> Buyer "Honnêtement ? On a essayé deux outils comme le vôtre l'an dernier. Les deux lâchés après un mois. Alors... pourquoi vous seriez différent ?" -> Rep "C'est légitime. Qu'est-ce qui a fait échouer les deux précédents ?" -> Buyer "...Personne ne les utilisait. L'équipe est revenue aux tableurs." Objection, pause, ouverture : générées en direct, à la voix, dans le ton de l'acheteur.

## How it works (grounded)
- Coeur = boucle audio natif temps réel sur Gemini. Le navigateur capte le micro via AudioWorklet, stream du PCM 16kHz sur WebSocket, rejoue l'audio 24kHz du modèle au fil de l'arrivée.
- Modèle = `gemini-2.5-flash-native-audio-latest`, en streaming bidirectionnel, `responseModalities: ['AUDIO']` + une voix choisie. Audio natif clé : pas d'étage TTS séparé, le modèle parle directement (intonation, hésitation, coupures paraissent humaines).
- Voice activity detection côté serveur dans la session Live : on règle les sensibilités de début/fin + une fenêtre de silence, donc l'acheteur attend que le commercial ait vraiment fini, et le commercial peut le couper en pleine phrase (la file de playback se vide sur un signal `interrupted`). Les deux côtés transcrits en direct.
- Le persona = le vrai travail de design. Chaque scénario = un system prompt avec identité fixe, un blocage psychologique central, un profil de comportement (phrases courtes au début, hésitations naturelles, jamais de monologue, jamais de sortie de rôle) et une résistance graduée : esquiver d'abord, se fermer si poussé de front, s'ouvrir seulement si le commercial est patient et indirect. Cette dernière règle transforme le chatbot en partenaire d'entraînement : pousser plus fort le rend plus dur, exactement comme un vrai acheteur.
- Feedback = seconde passe modèle séparée. Au raccroché, le transcript complet part sur `gemini-2.5-flash` (texte) avec un barème : score global, puis écoute active, qualité des questions, gestion des silences, gestion des sujets sensibles, erreurs concrètes avec citations, forces, recommandations actionnables. Débrief noté en quelques secondes, avec les propres mots du commercial cités.

## The hard part
- Latence : une voix qui répond une demi-seconde trop tard paraît morte. Le stream audio natif bidirectionnel + le playback incrémental gardent le tour de parole assez serré pour un vrai appel, pas un talkie-walkie.
- Crédibilité : un acheteur qui cède dès qu'on pitche n'apprend rien. Le design de résistance graduée est délibéré. Étape suivante naturelle = clonage de persona : déjà fine-tuné un modèle sur de vraies transcriptions (voir [ghost-in-the-llm]), speaker-labeled avec contexte glissant, résultat qui imitait le ton d'une personne précise de façon troublante. Même technique sur des enregistrements anonymisés d'un vrai acheteur coriace = entraîner l'équipe contre son compte le plus dur, pas un archétype générique.

## Result
- Les commerciaux répètent le même appel dur autant qu'ils veulent, à voix haute, avant que ça coûte du vrai pipeline.
- Uplift concret sur taux de closing ou temps de ramp = `[à confirmer]` (mesure qui appartient à l'équipe qui le tourne à l'échelle).

## Reusable
- Mécanique générale : un persona crédible, une boucle vocale temps réel, un débrief noté. Change le persona : onboarding de nouvelles recrues, montée en compétence produit, support face aux clients énervés, drills de négociation, prep d'entretien.
- Toute conversation à fort enjeu qu'on apprend aujourd'hui en la ratant devant quelqu'un qui compte est candidate.

## Stack
- React, TypeScript, Gemini Live API (audio natif), relais WebSocket Fastify, Gemini 2.5 Flash

## Angles LinkedIn (1 post par angle)
1. **[le pire terrain]** Vos commerciaux s'entraînent sur vos vrais prospects : un acheteur IA vocal temps réel qu'on rappelle 100 fois à 7h, qui esquive/objecte/se ferme, et note l'appel au raccroché.
2. **[la tech temps réel]** Un chatbot texte ne vaut rien pour former un commercial : PCM 16kHz sur WebSocket, Gemini audio natif 24kHz, coupure en pleine phrase, plus le détail clé = la résistance graduée (pousser fort n'ouvre pas la porte).
3. **[cloner votre acheteur le plus dur]** Et si l'équipe s'entraînait contre votre compte le plus difficile ? Fine-tuner sur des transcriptions anonymisées pour un sparring-partner qui pousse comme lui, esquive comme lui, se braque comme lui.

## À confirmer par toi
- La métrique `[à confirmer]` (uplift close rate / temps de ramp).
- On garde "a B2B sales team" en générique ou tu assumes le client en high-level ?
