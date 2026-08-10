---
title: "Comment benchmarker un modèle OCR (TEDS, CER, LLM-as-judge)"
date: "2026-06-04T09:30:00.000Z"
description: "Comment j'ai construit le benchmark qui a décidé quel moteur d'OCR et d'extraction de tableaux livrer dans un pipeline documentaire d'entreprise : deux bancs, quatre métriques, un retour de terrain où la métrique évidente disait l'exact opposé de la vérité."
tags: ["OCR", "Benchmarking", "Evaluation"]
private: true
---

Un document restait bloqué en `WAITING` depuis vingt-quatre heures. Trois pages. Rien n'avait planté, aucune erreur ne s'était déclenchée ; le pipeline tournait toujours, parce que le matcher de tableaux maison avait décidé qu'un petit tableau de la page deux contenait 82 176 cellules et s'employait fidèlement à toutes les remplir. Il y en avait quarante-trois sur cette page.

J'ai donc proposé d'échanger ce matcher contre celui, officiel, de Docling, avec un moteur OCR de région différent à côté. Restait à le prouver, face à trois alternatives, sans agiter les mains. Voici le benchmark que j'ai construit pour le pipeline documentaire d'un groupe mondial de beauté ; la méthode se transpose à n'importe quel remplacement d'OCR ou de compréhension documentaire.

À la fin, vous aurez quatre pièces en main : pourquoi un seul benchmark ne suffit pas, quelles métriques prédisent vraiment la qualité en production, le signal d'hallucination qui ne coûte rien à calculer, et le piège qui a fait passer le moteur perdant pour le vainqueur.

**Taille de tableau déclarée médiane sur 8 documents de production hallucinants : 32 699 cellules avant, 145 après.**

## Un seul benchmark ne peut pas répondre à deux questions différentes

J'avais deux questions, et ce ne sont pas les mêmes. Changer seulement le matcher de tableaux rend-il la sortie meilleure ? Et une fois changé, comment le système se classe-t-il face aux alternatives qu'un acheteur pourrait choisir à la place ? Deux questions, donc deux bancs.

**Banc 1, le jeu doré (golden set).** 100+ documents annotés à la main, avec une vérité terrain par bloc : mise en page, texte OCR, titres, en-têtes, pieds de page, légendes, tableaux. Noté avec TEDS, CER, et un juge LLM. Tout ce qui est en amont du matcher est maintenu fixe, donc ce banc isole le composant testé.

**Banc 2, la comparaison à l'aveugle.** 220 documents, quatre systèmes (le matcher maison, ma proposition, le matcher open-source Docling tel quel, et un SaaS document-AI payant), notés de deux façons : un VLM récent jugeant à l'aveugle sur l'image rendue de la page (n=179), et un TEDS symétrique entre systèmes (n=176). Pas de budget d'annotation, et aucun système n'a l'avantage du terrain.

Mon avis : si vous ne construisez que le jeu doré, vous saurez si votre changement a aidé, mais rien sur la question de savoir s'il aurait mieux valu acheter. Si vous ne montez que la comparaison à l'aveugle, chaque régression devient un mystère, puisque quatre choses ont bougé en même temps. Montez les deux. Une fois le harnais en place, le second banc ne coûte presque rien.

## Mesurez la métrique qui correspond au chemin de production

Quatre métriques, chacune répondant à un mode de défaillance différent.

**TEDS** (Tree-Edit-Distance Similarity), de 0 à 1, pour la structure des tableaux. Elle compare l'arbre du tableau prédit à la vérité terrain, donc elle punit une cellule fusionnée ou une colonne perdue plutôt qu'une police.

**CER** (Character Error Rate) pour la couche texte. Le TEDS peut être élevé sur un tableau dont les cellules contiennent du charabia, donc il vous faut les deux.

**Un juge LLM** pour « est-ce que ça se lit comme la page ». Structure et caractères peuvent tous deux avoir l'air corrects alors que l'ordre de lecture n'a aucun sens.

**Un signal d'hallucination**, le moins cher des quatre et celui que la plupart des gens sautent. Le pipeline persiste la plus grande taille de tableau déclarée par document (lignes fois colonnes). Comparez-la au nombre de cellules réellement extraites.

```python
# Code de harnais représentatif, pas le source client.
def hallucination_report(doc) -> dict:
    declared = max((t.num_rows * t.num_cols for t in doc.tables), default=0)
    real = max((len(t.cells) for t in doc.tables), default=0)
    return {
        "declared": declared,
        "real": real,
        "ratio": declared / max(real, 1),
        # un tableau sain a declared ~= real ; declared >> real est une grille fantôme
        "phantom": declared > 2000 and declared > 4 * max(real, 1),
    }
```

Une taille déclarée au-dessus de 2 000 est la signature d'un tableau halluciné. Sur huit documents de production réels où le matcher maison en avait produit un, voici ce qu'a fait le remplacement :

| Doc | Pages | Déclaré, maison | Déclaré, officiel | Cellules réelles |
|---|---|---|---|---|
| a | 3 | 82 176 | 48 | 43 |
| b | 1 | 77 952 | 40 | 40 |
| c | 1 | 64 344 | 30 | 29 |
| d | 37 | 38 759 | 96 | 96 |
| e | 76 | 26 640 | 195 | 195 |
| f | 153 | 12 256 | 650 | 646 |

Huit sur huit corrigés. Après le remplacement, le déclaré correspond au réel partout.

## Le juge LLM ne marche que si la grille de notation est ennuyeuse

Demandez à un juge « est-ce bon ? » et il vous renvoie du bruit. Demandez-lui plutôt des sous-scores nommés et bornés face à l'image de la page, et vous obtenez quelque chose de comparable d'une exécution à l'autre.

```json
{
  "task": "Compare le markdown extrait à l'image rendue de la page.",
  "scale": "entiers de 0 à 10, pas de demi-points, pas de prose dans les champs de score",
  "criteria": {
    "text_fidelity": "Mots présents et corrects, dans l'ordre où un humain lit.",
    "table_structure": "Lignes, colonnes et fusions correspondent à ce qui est visible sur la page.",
    "reading_order": "Les blocs apparaissent dans la séquence où un humain les lirait.",
    "hallucination_absence": "Rien n'apparaît qui ne soit sur la page. Les cellules répétées ou inventées scorent 0.",
    "completeness": "Rien de visible sur la page ne manque."
  },
  "output": {"scores": {}, "worst_criterion": "", "one_line_reason": ""},
  "constraints": [
    "Tu ne vois que l'image de la page et une extraction. Tu ne sais pas quel système l'a produite.",
    "Ne récompense pas la verbosité. Du texte en plus qui n'est pas sur la page est une hallucination."
  ]
}
```

Deux règles rendent cela utilisable. D'abord, garder l'aveugle : le juge n'apprend jamais quel système il note, sinon il flatte celui qu'il reconnaît. Ensuite, donner à `hallucination_absence` son propre axe ; il est passé de 4,7 à 8,1 sur 10 sur le remplacement, un écart qu'aucun score de qualité agrégé n'aurait révélé.

> **Retour de terrain.** J'ai failli livrer le mauvais moteur à cause de la métrique évidente. En comparant tesseract à rapidocr sur la capture brute de mots, tesseract gagne clairement : **96,7% de mots attrapés contre 86,0%**. Lisez ce chiffre seul et ma proposition aggravait les choses. C'est le mauvais chiffre. Le matcher assigne les mots aux cellules **par position de boîte**, donc attraper un mot ne suffit pas. tesseract en `PSM.AUTO` lit dans l'ordre de lecture, donc ses boîtes atterrissent dans les mauvaises cellules et les grands tableaux s'effondrent : **TEDS 0,59**. rapidocr émet des boîtes de ligne bien localisées, donc la grille se reconstruit correctement : **TEDS 0,82**. Un tableau 16x4 l'a rendu concret : tesseract a attrapé **plus** de mots (38 contre 35) et a scoré **0,50 de TEDS** ; rapidocr a scoré **0,92**. Le texte était tout là, aux mauvais endroits. Mesurez la métrique qui correspond au chemin de production, ou votre benchmark vous dira avec assurance l'opposé de la vérité.

## Une variable à la fois, six configs, 239 tableaux

Ici tout reste figé (le recadrage, le matcher, les documents) et seul le moteur OCR de région change. Six configs en tout : quatre modes de segmentation de page tesseract, plus easyocr et rapidocr, sur plus de 239 tableaux dorés.

| Config | Petit <20 | Moyen 20-100 | Grand >100 | Scans | Global |
|---|---|---|---|---|---|
| tesseract AUTO | 0,67 | 0,80 | 0,59 | 0,66 | 0,72 |
| tesseract PSM 4 | 0,66 | 0,80 | 0,60 | 0,65 | 0,71 |
| tesseract PSM 6 | 0,52 | 0,44 | 0,29 | 0,42 | 0,48 |
| tesseract PSM 11 | 0,68 | 0,81 | 0,72 | 0,66 | 0,74 |
| easyocr | 0,69 | 0,82 | 0,75 | 0,72 | 0,75 |
| rapidocr | 0,69 | 0,84 | **0,82** | **0,75** | **0,75** |

L'affirmation survit au contact d'un adversaire correctement réglé : PSM 11 est un tesseract bien meilleur que le défaut, et il reste derrière. easyocr égale rapidocr en précision et perd sur le temps, environ 2,3x plus lent par tableau (1 892 ms contre 837 ms d'extraction médiane).

Décomposer le score par taille de tableau, voilà ce qui a rendu tout ça lisible. Sur la moyenne globale, tesseract AUTO et rapidocr semblent assez proches pour qu'on hausse les épaules. L'écart ne se creuse que sur les tableaux au-dessus de 100 cellules et sur les scans, c'est-à-dire précisément les documents qui cassaient la production.

## Le résultat honnête : parité au mieux

Sur le banc doré, seul le matcher a changé, donc tout sauf les tableaux est identique : détection de mise en page 78, texte OCR 93, légendes de figures 96, légendes de tableaux 98, tout inchangé. Les deltas sont tous dans la colonne des tableaux.

**TEDS tableaux 68 à 74. CER 78 à 81. Juge LLM 69 à 84. Tableaux au bon format 51,2% à 62,7%.**

Sur le banc à l'aveugle, à travers quatre systèmes, le classement était : SaaS payant 74/81/74, Docling open-source 72/75/70, mon build 65/74/70, maison 35/41/45. Sur le sous-ensemble où le matcher maison produisait un tableau poubelle (TEDS en dessous de 40%, n=94), mon build est passé de 20 à 58, ce qui est exactement le niveau open-source (58), avec le SaaS devant à 64.

Le SaaS payant reste devant. Mon build atteint la parité avec le matcher open-source et ne le bat jamais, ce qui est attendu puisqu'il fait tourner ce matcher. Je l'ai écrit sur la slide dans ces termes. Un benchmark qui ne fait jamais que confirmer la proposition de son auteur est en réalité un pitch deck, et tout le monde dans la salle sait faire la différence.

## La fiabilité et le coût par page sont aussi des métriques

Les tableaux de précision cachent le mode de défaillance qui coûte réellement de l'argent. J'ai pris les 21 documents où le matcher maison hallucinait un tableau géant (2 121 cellules médiane, jusqu'à 3 444).

**Maison : 0 sur 21 terminés. Il partait en vrille et restait en `WAITING`, un document pendant 24 heures sans arrêt.** Nouveau matcher : 21 sur 21 terminés, 0 plantage, tableau réel de 255 cellules médiane. Sur les documents que l'ancien terminait, le nouveau est environ 1,3x plus rapide en production, et 1,8x sur les grands tableaux (2 024 s à 1 137 s).

Le coût par page a sa place dans le benchmark dès le premier jour, mesuré de la façon ennuyeuse : le tarif de la plateforme divisé par le débit réel observé. La grille tarifaire d'un fournisseur ne compte pas.

```
Cloud Run: 2 vCPU / 8 Gio = 0,245 $/h, WORKER_COUNT=2
  (le décodeur TableFormer est mono-thread : 1 worker gaspille un cœur, 3+ se battent)
Corpus:    7 171 documents mixtes, 31 494 pages
Mesuré:    47 s/page, 152 pages/h/instance

$ / 1 000 pages
  nouveau build (local)   1,61 $
  maison (local)          2,08 $
  SaaS payant            ~4,80 $
  config GPU L4           6,00 $
```

La ligne GPU est celle qui est utile. Un GPU est la réponse réflexe à « accélérer l'OCR » et ici c'est l'option la plus chère mesurée, parce que le décodeur v1 traite un tableau à la fois et ne sature jamais la carte. Benchmarkez la config réelle plutôt que la catégorie de matériel.

## Ce que ce benchmark ne peut toujours pas me dire

Quelques limites honnêtes.

**100+ documents est un petit jeu doré.** C'est assez pour attraper une régression dans un composant, pas assez pour donner un intervalle de confiance serré sur une différence de 2 points. Je traite les écarts de moins de 3 points sur ce banc comme du bruit.

**Le TEDS punit des différences de formatage valides.** Un modèle qui émet un tableau correct avec une structure de fusion différente mais défendable perd des points face à mon annotation. Le TEDS mesure l'accord avec l'arbre d'un seul annotateur plutôt que la vérité.

**Les juges LLM dérivent.** Changez la version du modèle et vos scores absolus bougent sous vous. Les scores de juge ne sont comparables qu'à l'intérieur d'une seule exécution où chaque système est noté par le même modèle, dans la même session, à l'aveugle. Je ne compare jamais un chiffre de juge entre deux dates.

## Qui a ce problème

Toute équipe sur le point de remplacer ou d'acheter un moteur de compréhension documentaire : assureurs et banques traitant relevés et sinistres, équipes juridiques et conformité sur des archives scannées, groupes R&D dont les données vivent dans des tableaux à l'intérieur de PDF, quiconque dont le coût d'ingestion est facturé à la page par un fournisseur qui choisit aussi la métrique de qualité.

Si le fournisseur fournit le benchmark, vous ne faites que lire du marketing avec une virgule décimale.
