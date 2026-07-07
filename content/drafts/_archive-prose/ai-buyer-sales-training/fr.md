---
title: "Vos commerciaux s'entraînent contre un acheteur IA qui leur tient tête"
description: "Une IA vocale temps réel qui joue le rôle d'un acheteur résistant, pour que les commerciaux répètent leur pitch et le traitement d'objection à voix haute avant d'appeler un vrai prospect. Construit sur Gemini audio natif via une boucle WebSocket."
date: 2026-07-06
tags: ["IA", "Voix", "Vente", "Gemini", "Temps réel"]
pillar: "Build"
stack: ["React", "TypeScript", "Gemini Live API (audio natif)", "Relais WebSocket Fastify", "Gemini 2.5 Flash"]
lang: "fr"
---

## Le problème

Les commerciaux apprennent leur métier sur de vrais prospects. C'est le pire terrain d'apprentissage qui soit. Chaque pitch maladroit, chaque objection ratée, chaque silence gênant se produit devant quelqu'un qu'on voulait justement signer. La boucle de feedback est lente (on découvre des semaines plus tard que le deal est mort), coûteuse (c'est du vrai pipeline qui brûle) et impossible à rejouer (on ne peut pas refaire trois fois le même appel pour tester trois approches).

Le jeu de rôle avec un collègue aide, mais un collègue fatigue, se montre indulgent, et ne tient pas un personnage cohérent pendant vingt minutes. Une équipe commerciale B2B voulait quelque chose qu'un commercial puisse ouvrir à 7h, appeler, et à qui pitcher autant de fois qu'il veut, face à un prospect qui résiste comme un vrai.

## Ce qu'on a construit

Un acheteur IA qu'on appelle littéralement. Le commercial choisit un scénario, clique sur "appeler", et se met à parler. En face, une voix qui incarne un persona d'acheteur précis : il esquive, il objecte, il se ferme, il ne s'ouvre que si on le gère bien. Il ne sort jamais de son rôle et ne vous aide jamais. Quand vous raccrochez, il note la conversation.

Un court échange tiré d'une session :

> Commercial : "Je voulais vous montrer comment se passe notre onboarding."
> Acheteur : "Franchement ? On a testé deux outils comme le vôtre l'an dernier. Les deux abandonnés au bout d'un mois. Alors... en quoi vous êtes différent ?"
> Commercial : "C'est légitime. Qu'est-ce qui a fait échouer les deux précédents ?"
> Acheteur : "...Personne ne les utilisait. L'équipe est repartie sur ses tableurs."

Cette objection, cette pause, cette ouverture : tout est généré en direct, à la voix, dans le ton de l'acheteur.

## Comment ça marche

Le cœur, c'est une boucle audio natif en temps réel sur Gemini. Le navigateur capte le micro via un AudioWorklet, envoie des chunks PCM 16kHz sur une WebSocket, et rejoue l'audio 24kHz du modèle au fil de l'arrivée. Le modèle est `gemini-2.5-flash-native-audio-latest`, en streaming bidirectionnel avec `responseModalities: ['AUDIO']` et une voix choisie. L'audio natif est décisif : le modèle ne lit pas du texte via un étage TTS séparé, il parle directement, donc l'intonation, l'hésitation et les coupures paraissent humaines.

La détection d'activité vocale tourne côté serveur, dans la session Live. On règle la sensibilité de début et de fin plus une fenêtre de silence, pour que l'acheteur attende que le commercial ait vraiment fini avant de répondre, et que le commercial puisse couper l'acheteur en pleine phrase (la file de lecture se vide sur un signal `interrupted`). Les deux côtés sont transcrits en direct, le commercial voit la conversation défiler.

Le persona de l'acheteur, c'est le vrai travail de design. Chaque scénario est un prompt système avec une identité fixe, un blocage psychologique central, un profil de comportement (phrases courtes au début, hésitations naturelles, jamais de monologue, ne sort jamais du rôle) et une résistance graduée : esquive d'abord, blocage si on pousse frontalement, ouverture seulement si le commercial est patient et indirect. Cette dernière règle est ce qui le fait passer de chatbot à partenaire d'entraînement : plus on force, plus il se ferme, exactement comme un vrai acheteur.

Le feedback est une seconde passe, avec un modèle séparé. Au raccroché, la transcription complète part vers `gemini-2.5-flash` (texte) avec une grille : un score global, puis écoute active, qualité du questionnement, gestion des silences, gestion des sujets sensibles, erreurs concrètes citées, points forts, et recommandations actionnables. Le commercial reçoit un débrief noté en quelques secondes, avec ses propres mots cités.

## La partie difficile

Deux choses. D'abord, la latence. Une voix qui répond une demi-seconde trop tard paraît morte. Le stream bidirectionnel en audio natif plus la lecture incrémentale, c'est ce qui garde les tours de parole assez serrés pour ressembler à un appel téléphonique, pas à un talkie-walkie.

Ensuite, la crédibilité. Un acheteur qui cède dès qu'on pitche n'apprend rien. Le design du prompt à résistance graduée est délibéré, et la suite naturelle, c'est le clonage de persona : j'ai déjà [fine-tuné un modèle sur de vraies transcriptions de conversations](/blog/ghost-in-the-llm), étiquetées par locuteur avec un contexte glissant, et le résultat imitait le ton d'une personne précise de façon troublante. La même technique, appliquée à des enregistrements anonymisés d'un vrai acheteur difficile, permettrait à une équipe de s'entraîner contre son compte le plus dur, et non un archétype générique.

## Résultat

Les commerciaux peuvent répéter le même appel difficile autant de fois qu'ils veulent, à voix haute, avant que ça ne coûte du vrai pipeline. Le gain concret sur le taux de closing ou le temps de montée en compétence est [à confirmer], car cette mesure appartient à l'équipe qui le déploie à l'échelle.

## Réutilisable

Le mécanisme est générique : un persona crédible, une boucle vocale temps réel, et un débrief noté. On change le persona et ça devient de l'onboarding pour les nouveaux, de la montée en compétence sur une gamme, des agents support qui s'entraînent aux appelants énervés, des simulations de négociation, ou de la préparation d'entretien. Toute conversation à fort enjeu qu'on apprend aujourd'hui en la ratant devant quelqu'un qui compte est un candidat.

Si votre équipe brûle de vrais prospects en guise d'entraînement, il existe un meilleur sparring-partner. Je construis ce genre d'outils. Dites-moi la conversation que vous aimeriez que vos gens puissent répéter cent fois.
