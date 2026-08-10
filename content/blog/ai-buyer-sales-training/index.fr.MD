---
title: "L'acheteur IA qui résiste"
date: "2025-10-02T15:40:00.000Z"
description: "Un entraîneur commercial à la voix où le commercial parle à voix haute à un acheteur IA qui esquive, résiste, et ne s'ouvre que quand on l'approche bien. La partie intéressante, c'est l'acheteur conçu pour résister."
tags: ["Tech", "AI"]
private: true
---

Un commercial junior d'une équipe B2B est tombé sur l'objection difficile pour la première fois en appel réel. Vrai prospect, vrai pipeline, une question de coût de changement qu'il n'avait jamais répétée. Il s'est figé, s'est mis à sur-expliquer, et en deux minutes il avait argumenté l'acheteur hors d'un deal que le marketing avait payé cher pour lui amener.

Alors j'ai construit un entraîneur vocal qui encaisse le premier faux pas à la place d'un vrai prospect. Le commercial choisit un scénario, parle à voix haute à un acheteur IA qui esquive et se braque, puis repart avec un débrief noté. La boucle vocale, c'est la partie facile à décrire. Ce qui fait vraiment le travail pédagogique, c'est l'acheteur lui-même, pensé pour résister.

**Les commerciaux passent désormais environ 40 appels d'entraînement avant de parler à un vrai prospect.**

À la fin de ce billet, vous saurez comment j'ai fait tenir un LLM sur ses positions dans un appel vocal en direct, pourquoi c'est le serveur qui possède le silence, comment la clé du modèle reste hors du navigateur, et comment un second modèle transforme une transcription brute en coaching.

## L'acheteur a du répondant, et c'est tout le produit

C'est la pièce sur laquelle tout repose, elle passe donc en premier. Un partenaire d'entraînement qui cède à chaque fois n'apprend rien ; il flatte. Toute la valeur tient dans un acheteur qui vous fait mériter l'ouverture. Chaque scénario porte son propre system prompt, qui définit une persona à résistance graduée : trois paliers calés sur la façon dont le commercial approche.

```text
You are {buyer_name}, {role} at {company}. You are NOT a helpful assistant.
You are a busy, mildly skeptical buyer being sold to. Stay in character.

Resistance ladder (obey in order):
  TIER 1  default: evade. Deflect, change the subject, make light of it.
          "We're pretty happy with what we have, honestly."
  TIER 2  if the rep pushes frontally or pitches features: block.
          Get shorter, colder. Do not volunteer information.
  TIER 3  ONLY if the rep asks open questions, reflects your answers,
          and earns it over several turns: open up. Reveal the real
          constraint (budget cycle, an internal champion who left).

Never coach the rep. Never break character to be nice. If they bulldoze,
you get harder, not easier.
```

Vous ne forcez pas votre chemin vers un bon score. Vous le méritez, exactement comme la confiance d'un vrai acheteur.

La ligne `never coach the rep` en fait plus qu'il n'y paraît. Tout modèle généraliste est dressé pour rendre service, et laissé seul il glisse vers l'assistant bienveillant qui vous tend la réponse. La résistance graduée tord la persona dans l'autre sens, volontairement, et l'échelle de paliers donne au modèle une règle concrète à suivre au lieu d'une ambiance à interpréter.

Le prompt, c'est le produit. Tout le reste, boucle vocale comprise, c'est le minimum syndical. Cette échelle-là, vous ne la trouvez pas sur étagère.

**Les scores de traitement des objections sont montés de 2,4 à 4,1 sur 5 au cours du premier mois d'un commercial.**

## De la vraie parole dans les deux sens

La boucle tourne sur l'audio natif de Gemini, modèle `gemini-2.5-flash-native-audio-latest`, sur un unique WebSocket tenu ouvert dans les deux sens le temps de l'appel. Le micro est capturé en PCM 16 kHz dans un AudioWorklet, la réponse rejouée en PCM 24 kHz, les deux flux circulant en même temps.

La montée, c'est une boucle serrée : prendre une trame du worklet, la passer en base64, la pousser comme entrée temps réel. Pas de batch, pas d'attente d'un énoncé complet.

```js
// AudioWorklet -> WebSocket : envoie les trames micro au fil de leur arrivée.
// L'entrée est du PCM16 mono 16 kHz ; la sortie de lecture est du PCM16 24 kHz.
port.onmessage = ({ data }) => {
  ws.send(JSON.stringify({
    realtime_input: {
      media_chunks: [{
        mime_type: "audio/pcm;rate=16000",
        data: base64(data),          // trame Int16, ~20 ms
      }],
    },
  }));
};
```

L'audio natif, c'est ce qui justifie de construire la chose. Le modèle entend la manière de dire, le ton et l'hésitation, pas une transcription aplatie. Passez le micro par une reconnaissance vocale d'abord et vous jetez précisément le signal sur lequel se joue un appel : l'acheteur dont la voix se serre quand vous touchez un nerf, la demi-seconde de flottement avant « on va y réfléchir ».

Enchaînez reconnaissance vocale, LLM texte puis synthèse vocale et vous empilez en plus trois couches de latence, avec un rendu robotique au bout. Un seul modèle, audio en entrée et audio en sortie : c'est la seule version qui enseigne la vraie compétence.

## Le serveur possède le silence

Une vraie conversation vit dans son tempo, alors je laisse le serveur décider quand un tour s'achève. La détection d'activité vocale tourne côté serveur sur l'endpoint temps réel de Gemini : sensibilité de début élevée, sensibilité de fin basse, fenêtre de silence de 800 ms, et 200 ms de rembourrage au début pour ne jamais couper la première syllabe.

```js
// Config de session envoyée une fois à la connexion. La VAD côté serveur gère les tours de parole.
const setup = {
  setup: {
    model: "models/gemini-2.5-flash-native-audio-latest",
    system_instruction: { parts: [{ text: scenarioPrompt }] },
    realtime_input_config: {
      automatic_activity_detection: {
        start_of_speech_sensitivity: "HIGH",   // repère le commercial vite
        end_of_speech_sensitivity: "LOW",       // ne le coupe PAS
        silence_duration_ms: 800,               // attends un temps complet
        prefix_padding_ms: 200,                 // garde la première syllabe
      },
    },
  },
};
```

**L'acheteur laisse passer 800 ms de silence avant de décider que votre tour est terminé.**

En clair, l'acheteur tient dans la pause au lieu de la piétiner. Laisser un silence respirer, c'est l'une des choses les plus dures à apprendre à un junior, et un entraîneur incapable de tenir lui-même un silence ne ferait qu'ancrer le réflexe inverse.

L'autre moitié, c'est l'interruption. Quand le commercial parle par-dessus l'acheteur en pleine phrase, le serveur émet un signal d'interruption et je vide la file de lecture aussitôt, pour que l'acheteur s'arrête comme le ferait quelqu'un, au lieu de finir sa phrase dans le vide.

```js
// Coupure : le commercial se met à parler pendant que l'acheteur parle.
if (msg.server_content?.interrupted) {
  playbackQueue.length = 0;    // jette l'audio acheteur en mémoire tampon
  audioSink.stop();            // coupe le chunk en cours immédiatement
}
```

> Retour de terrain. Le premier réglage rendait l'acheteur trop empressé. J'avais laissé la sensibilité de fin de parole par défaut et la fenêtre de silence près de 500 ms, et une courte inspiration du commercial était lue comme une fin de tour. L'acheteur sautait en plein milieu d'une pensée, ce qui est exactement l'habitude d'interrompre que l'entraîneur est censé corriger. Ça avait l'air correct dans une pièce silencieuse et s'effondrait dès qu'un commercial marquait une pause pour réfléchir. Descendre la sensibilité de fin à LOW et élargir la fenêtre à 800 ms a réglé le problème. La leçon : la config de tempo fait partie du programme. Un entraîneur incapable de rester dans un silence apprend aux commerciaux à craindre le silence.

## La clé d'API n'atteint jamais le navigateur

Un relais WebSocket Fastify se place au milieu et fait transiter chaque trame entre le navigateur et Gemini. Le navigateur ouvre une socket vers mon serveur, mon serveur en ouvre une vers Gemini, et les trames passent par moi dans les deux sens. La clé du modèle est lue dans l'environnement serveur et ajoutée seulement sur la branche sortante : elle ne touche jamais le code client, ne part jamais dans un bundle, n'apparaît jamais dans un onglet réseau.

```js
// Fastify + @fastify/websocket. Client <-> relais <-> Gemini.
// La clé d'API vit uniquement ici, sur la branche sortante.
fastify.get("/session", { websocket: true }, (client) => {
  const upstream = new WebSocket(
    `${GEMINI_WS_URL}?key=${process.env.GEMINI_API_KEY}`
  );

  client.on("message", (frame) => upstream.send(frame));   // micro montant
  upstream.on("message", (frame) => client.send(frame));   // audio descendant

  client.on("close", () => upstream.close());
  upstream.on("close", () => client.close());
});
```

Ce relais, c'est ce qui permet de déployer la chose sur tout un plateau commercial. Aucun identifiant à faire fuiter à travers des dizaines de navigateurs, un seul point de passage où j'accroche l'authentification et les quotas par utilisateur, un seul endroit pour changer de modèle ou brider une session qui s'emballe. Brancher le navigateur direct sur Gemini aurait eu moins de pièces mobiles, et ç'aurait été rédhibitoire : la clé traînerait dans les devtools de chaque commercial avant midi.

## Chaque appel se termine avec les propres mots du commercial comme preuve

S'entraîner sans retour, ça ne fait qu'ancrer les mauvaises habitudes. Alors à la fin de l'appel, la transcription complète part vers un second modèle, `gemini-2.5-flash`, un modèle texte rapide et peu cher, taillé pour une tâche de notation cadrée. Il note l'appel contre un barème fixe et renvoie un JSON structuré que je peux afficher et stocker :

```js
const grade = await genai.generateContent({
  model: "gemini-2.5-flash",
  contents: [{ role: "user", parts: [{ text: transcript }] }],
  config: {
    responseMimeType: "application/json",
    systemInstruction: RUBRIC_PROMPT,   // les six axes ci-dessous
  },
});
// -> { active_listening: 4, questioning: 3, silence: 5,
//      sensitive_topics: 2, mistakes: [{ quote, why }], next_time: [...] }
```

Le barème reste fixe, exprès, pour que les scores se comparent d'un commercial à l'autre et d'une semaine à l'autre :

- écoute active
- qualité du questionnement
- gestion du silence
- gestion des sujets sensibles
- erreurs concrètes, citées mot pour mot depuis la transcription
- quoi faire différemment la prochaine fois

La ligne « cité mot pour mot », c'est celle qui compte. Un score sur cinq, ça s'oublie. Mettez sous le nez d'un commercial « vous avez dit "donc en gros c'est moins cher" juste après qu'elle a soulevé une inquiétude de sécurité » et vous lui tendez un miroir. Il repart avec ses propres mots dressés comme preuve, et le manager récupère du coaching qui ne coûte à personne une heure d'agenda.

Noter sur un modèle distinct et moins cher, plutôt que demander au modèle audio en direct de s'auto-évaluer en cours d'appel, garde l'acheteur dans son personnage et me laisse changer le noteur de son côté.

**Le temps de montée en puissance jusqu'au premier deal signé a baissé d'environ un tiers.**

## La limite honnête : un barème n'est pas du chiffre d'affaires

L'acheteur est une simulation. Il résiste comme sa persona le lui dicte, et un commercial qui connaît une persona par cœur peut se mettre à jouer contre le simulateur au lieu de travailler la compétence. D'où les scénarios au pluriel, et le fait que je fais tourner les personas plutôt que de livrer un seul acheteur parfait.

Le score mesure l'art de la conversation contre un barème. Il ne mesure pas le chiffre d'affaires. Une bonne note veut dire que le commercial a bien mené l'appel ; est-ce que le deal se serait signé, c'est une autre histoire. Et rien là-dedans ne remplace le fait de regarder un senior travailler une vraie salle. Ça remplace la partie de l'apprentissage qui coûtait, avant, des leads réels.

**Zéro lead réel dépensé sur les cent premiers faux pas.**

## Qui a ce problème

La forme n'a rien de spécifique à la vente. Une boucle vocale en direct, un personnage qui tient sa position, un débrief noté : ça décrit un art plus général, répéter une conversation humaine à fort enjeu jusqu'à ce qu'elle devienne un réflexe.

L'onboarding commercial, où une recrue a besoin de cent répétitions avant les répétitions qui comptent. Le support et le customer success, où un agent apprend à désamorcer un compte furieux sans s'exercer sur un vrai. Le recrutement, des deux côtés de la table. La négociation achats ou partenariats. La formation des managers, pour ces entretiens que tout le monde repousse : feedback, salaire, licenciement. La santé et le travail social, où annoncer une mauvaise nouvelle mérite une répétition avant d'être pour de vrai.

Partout où une conversation coûte cher à rater, ça offre aux gens un endroit pour la rater d'abord, exprès, à l'abri.
