# LinkedIn posts (FR)

Trois angles distincts pour le même article. À publier séparément.

---

## Post 1 : L'accroche Black Mirror

Vous vous souvenez de l'épisode de Black Mirror où une femme recrée son compagnon décédé en chatbot, à partir de ses vieux SMS ?

Celui qui vous a fait penser : "ça ne peut pas marcher pour de vrai."

J'ai voulu vérifier.

J'ai fine-tuné Mistral-7B sur 70 000 de mes propres messages.

Le résultat : une IA qui parle comme moi.

Mes expressions dramatiques.

Mon langage familier.

Mes références absurdes.

Mon obsession de trop parler de crypto.

200 $ et 16 heures d'entraînement.

Et un constat qui refroidit : le modèle n'a pas seulement appris mon style. Il a parfois ressorti des informations privées que j'avais oubliées dans mes conversations.

J'avais prévu de l'ouvrir quelques heures sur un bot Telegram. J'ai renoncé.

Pouvoir faire une chose ne veut pas dire qu'on devrait la faire.

Jusqu'où iriez-vous pour parler à une version numérique de vous-même ?

---

## Post 2 : Ce que fine-tuner un modèle open source sur ses propres données apprend vraiment

On parle beaucoup d'API de LLM propriétaires.

On parle beaucoup moins de ce qu'on comprend en fine-tunant un modèle open source sur ses propres données.

J'ai pris Mistral-7B et 70 000 de mes SMS. Voici ce que j'en retiens.

Le petit modèle bien entraîné bat le gros modèle générique sur une tâche précise. Mistral-7B, fine-tuné sur mon style, sonne plus "moi" que n'importe quel prompt sur un modèle frontier.

La donnée compte plus que l'architecture. 90 % du travail, c'était nettoyer et formater les conversations. Deux locuteurs, contexte glissant de 6 à 12 messages, JSONL propre. Le reste suit.

QLoRA rend ça accessible. Quantization 4 bits, 7,8 GiB de VRAM, un H100 loué à l'heure. Plus besoin d'un labo pour fine-tuner.

Et la leçon que je n'attendais pas : un modèle mémorise plus que le style. Des détails privés ont refait surface tout seuls.

Fine-tuner sur ses propres données, c'est le meilleur moyen de comprendre ce que ces modèles retiennent vraiment.

Vous avez déjà fine-tuné un modèle open source ? Qu'est-ce qui vous a le plus surpris ?

---

## Post 3 : Le how-to QLoRA concret

Fine-tuner un LLM sur vos propres données coûte moins cher qu'une thérapie.

La preuve, avec les vrais chiffres de mon projet "Ghost in the LLM".

Le modèle : Mistral-7B-v0.3. Assez puissant pour être cohérent, assez petit pour rester abordable.

La méthode : QLoRA en 4 bits. r=16, alpha=32, dropout=0.05.

Les données : 70 000 SMS, deux locuteurs (moi et les autres), contexte glissant, format JSONL. Objectif : next-token prediction sur mes réponses.

L'entraînement : 8 epochs, learning rate 5e-5 en cosine, séquences de 1024 tokens. 16 heures sur un H100 loué chez Lambda Labs.

Les résultats : loss de 3,4 à 0,9, convergence stable, 7,8 GiB de VRAM, 2 180 tokens/sec.

Le coût : environ 48 $ pour le run final, environ 200 $ avec tous les essais.

Le déploiement : fusion des adaptateurs LoRA en FP16 (environ 14 Go), puis Replicate pour une inférence sous 4 secondes.

Tout le code, notebooks et configs inclus, est sur GitHub : antonhansel/ghost-in-the-llm.

Sur quelle tâche fine-tuneriez-vous un modèle open source en premier ?
