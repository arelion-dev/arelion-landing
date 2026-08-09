---
title: "Fine-tuner un petit modèle sur des conversations personnelles"
date: "2025-09-17T12:00:08.312Z"
description: "Ce que fine-tuner un LLM sur vos propres données demande réellement, et la leçon de confidentialité que presque tout le monde rate : un fine-tune mémorise bien plus que le style."
tags: ["AI", "Business"]
private: true
---

J'ai entraîné un petit modèle ouvert sur 70 000 de mes vrais messages, et il m'est revenu en répondant avec mon ton exact, jusqu'aux expressions que mes amis reconnaissent. Il m'a aussi ressorti des détails privés que je ne lui avais jamais demandé de retenir. Les deux moitiés comptent.

Je fine-tune un LLM sur vos propres données pour qu'il réponde avec votre voix, sur votre domaine, sans expédier ces données à qui que ce soit d'autre. Mon propre run en est la preuve, et c'est là que j'ai appris ce que ça coûte et où se loge le vrai risque.

**70 000 messages. Environ 200 $ de calcul. À peu près 16 heures sur un seul H100.**

## Le modèle générique est le statu quo coûteux

Un modèle d'API généraliste ne connaît ni votre produit, ni votre ton, ni votre jargon interne. Alors vous recollez le même contexte dans chaque prompt, vous payez ces tokens à chaque appel, et vous obtenez quand même des réponses qui sonnent comme celles de tout le monde.

Vos données propriétaires, ce qui rendrait le modèle utile, restent dehors à regarder par la fenêtre. C'est ce fossé qu'un fine-tune comble.

## Ce que vous obtenez

- **Un modèle qui vous ressemble et connaît votre domaine**, entraîné sur vos conversations, vos tickets ou vos docs plutôt que sur le web ouvert.
- **Une vision des coûts ancrée dans le réel.** Mon run est tombé autour de 200 $ et 16 heures sur un seul GPU. Le fine-tuning QLoRA le maintient sur du matériel modeste, donc je peux vous dire ce que coûte le fine-tune d'un LLM à votre échelle avant que vous vous engagiez.
- **Vos données restent les vôtres.** Tout l'intérêt est d'entraîner sur des données privées sans les confier à une API tierce.
- **Un verdict de confidentialité sans détour.** Je teste le modèle fini pour détecter les fuites avant qu'il approche la production.

## Le run d'entraînement est la partie la moins chère

**Le formatage des données représentait 90 % du travail**, et c'est là que se jouent toutes les vraies décisions. Quand un prestataire dit « on le fine-tune juste sur vos données », le coût réel se cache dans le nettoyage, et les acheteurs le sous-estiment à chaque fois. Je l'intègre au prix dès le départ.

## La limite honnête, c'est ce que le modèle retient

Un fine-tune mémorise bien plus que votre style. Il garde le contenu de ce que vous avez dit. Dans mes propres tests, des prompts de sondage ont ressorti des détails privés que je n'avais jamais demandé au modèle de rappeler.

Fine-tunez sur des chats clients ou des fils internes et vous cuisez ce contenu dans les poids, où le bon prompt peut le faire remonter. Ce risque n'apparaît jamais dans une démo ; il se manifeste plus tard, quand quelqu'un se met à chercher. Alors je traite le test de fuite comme une part centrale du travail.

## Pour qui c'est fait

Les équipes assises sur un grand corpus privé (chats de support, fils commerciaux, docs internes) qui veulent un modèle avec leur propre voix et ne peuvent pas envoyer ces données à une API externe. Le travail réglementé, sensible à la confidentialité ou spécifique à une marque convient le mieux.

Si vous soupesez un fine-tune sur vos propres données, vous voulez que je regarde les vôtres, à l'écrit ?
