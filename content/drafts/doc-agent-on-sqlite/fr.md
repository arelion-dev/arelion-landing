---
title: "Le vendredi soir où un dirigeant a arrêté de chercher ses factures"
description: "Comment un mini-PC sous un bureau et un fichier SQLite rangent toute la paperasse d'une entreprise et répondent à vos questions, sans que rien ne quitte vos murs."
date: 2026-07-13
tags: ["automatisation", "documents", "rag", "pme"]
pillar: "Build"
lang: "fr"
---

Un vendredi soir, un dirigeant cherche une facture. Celle du fournisseur qui conteste un paiement. Elle est quelque part dans deux ans de PDF, entre des scans de travers, des relevés bancaires et trois versions du même contrat. Il ouvre un dossier Drive. Puis un autre. Vingt minutes plus tard, il abandonne et écrit un mail pour redemander une copie.

Ce moment, tout patron de PME le connaît. L'information existe. Elle est juste hors de portée pile quand il la faut. À force, le dirigeant devient le moteur de recherche de sa propre boîte. Mauvais poste, et à plein temps.

J'ai construit un système pour tuer ce moment. Et j'ai commencé par me tromper.

## La fausse bonne idée du départ

Mon premier réflexe, comme tout le monde en 2026, a été de sortir l'artillerie : une base de données vectorielle managée dans le cloud, un service de recherche, l'usine. Puis je me suis posé une question bête. Le corpus d'une entreprise, c'est combien de documents ? Quelques milliers. Dix mille les grosses années. Ce n'est pas l'index de tout le web.

J'ai tout jeté et tout remis dans un seul fichier SQLite. Pas de cluster, pas de serveur à louer, pas de facture cloud qui tombe tous les mois. Un fichier. (Oui, la même techno qui fait tourner les réglages de votre téléphone.)

## La machine, sous le bureau

Le tout tourne sur un mini-PC de la taille d'un livre, posé sous un bureau, allumé jour et nuit. Un tunnel Tailscale le rend joignable de partout sans l'exposer sur internet. Le Drive de la boîte est monté dessus.

Le dirigeant, lui, ne voit rien de ça. Il a juste un assistant sur Telegram. Il prend une facture en photo, ou il dicte un mémo vocal en sortant d'un rendez-vous, et ça atterrit dans une file d'entrée. Une commande, `bb-ingest`, fait le reste.

## Ce qui se passe quand un document arrive

Rien de magique dessous, juste de la rigueur. Les PDF déjà propres sont lus en direct. Les vrais scans passent par une lecture visuelle (Gemini 2.5 Flash). Le même modèle décide de quoi il s'agit, facture, contrat, relevé, liasse fiscale, le range et le renomme. Un `IMG_4471.pdf` devient `2023-11-04_facture_fournisseur-x.pdf`.

Le point qui compte, c'est ce qui se passe quand le modèle doute. Sous 90 % de confiance, un second passage relit le dossier avec un modèle plus fort (Gemini 2.5 Pro). Et un document vraiment ambigu ne part pas au hasard : il file dans une file "à vérifier", avec une question précise pour l'humain. La machine ne devine pas quand elle ne sait pas. C'est la règle que j'ai fini par graver dans le code, parce que c'est exactement là que ce genre de système se plante.

Un doublon ? Détecté par empreinte, cloné sans rappeler le modèle. On ne paie pas deux fois pour la même page.

## Poser une question, obtenir la preuve

Une fois rangé, le dirigeant tape une question en français normal :

    bb-search "combien j'ai payé ce fournisseur en 2024"

Retour : le montant, la ligne exacte, et le chemin du PDF source à ouvrir pour vérifier d'un clic.

Deux détails font toute la différence. La recherche mélange le sens et le mot exact. "TVA" retrouve le concept par les embeddings, un numéro de facture précis est retrouvé au caractère près par le plein texte, et les deux classements sont fusionnés en un seul. Et quand la bonne info est dans un tableau, le système matche la ligne mais renvoie la page entière. Un total n'arrive jamais coupé en deux.

## Ce qui ne quitte jamais les murs

Rien ne part ailleurs. La compta, les contrats, les relevés restent sur la machine du dirigeant. Une sauvegarde chiffrée part toutes les quatre heures, plus une par jour gardée un mois, histoire de survivre à un disque mort un mardi matin.

Le réflexe du secteur, en ce moment, c'est le cloud et le cluster pour tout. Pour les documents d'une seule boîte, c'est de l'infrastructure à sécuriser et à payer pour rien. Un fichier et un mini-PC suffisent.

## Le vendredi soir, après

La facture qui prenait vingt minutes tient maintenant dans une ligne de terminal. Le dirigeant a arrêté d'être le moteur de recherche de sa boîte. Il a récupéré son vendredi soir.

Chaque entreprise est assise sur cette pile. Si la vôtre ressemble à un labyrinthe, c'est ce que ce système referme. Écrivez-moi, on regarde la vôtre.
