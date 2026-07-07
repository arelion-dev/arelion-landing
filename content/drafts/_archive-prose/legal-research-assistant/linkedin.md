# LinkedIn posts (FR)

---

## Post 1 : Le danger d'un chatbot juridique qui hallucine

Un chatbot juridique qui invente la loi est un danger, pas un gadget.

Un modèle généraliste vous sortira, sans broncher, "Décret-loi fédéral n° 12 de 2019, article 7".

Fluide. Confiant. Inexistant.

Dans la plupart des domaines, une hallucination est agaçante.

En droit, c'est une faute.

Un assistant qui invente des textes est pire que pas d'assistant : il est sûr de lui ET faux en même temps.

Sur une plateforme de recherche juridique que j'ai livrée récemment, la règle d'ingénierie n'était donc pas "le faire discuter".

C'était : rendre impossible que la réponse s'écarte du texte source.

Deux garde-fous :

1. Le modèle ne lit jamais sa propre mémoire. Il ne répond que depuis un corpus officiel indexé et une base qui renvoie le texte d'article exact.

2. Chaque réponse porte une citation cliquable, imposée au niveau de l'outil, pas suggérée dans un prompt.

Résultat : une réponse bien formée est, par construction, une réponse sourcée.

Si une IA vous conseille sur un sujet à fort enjeu sans jamais pouvoir montrer sa source, pourquoi lui feriez-vous confiance ?

---

## Post 2 : Le design de l'agent à tool-calling

La plupart des "chatbots RAG" font un seul appel de recherche, collent le contexte, et prient.

Pour une plateforme juridique, j'ai construit l'inverse : un vrai agent à tool-calling.

Une boîte à outils réduite et affûtée :

- search_law : recherche sémantique sur le corpus
- get_article : le texte de l'article, verbatim
- get_law, list_laws : navigation structurée
- des outils de version, pour lire la loi telle qu'en vigueur à une date
- cite : la citation

Trois principes qui changent tout :

Exécuter, pas annoncer. L'agent n'écrit jamais "je vais chercher...". Il émet directement l'appel. Un aller-retour de gagné.

Grouper en parallèle. Comparer deux lois ? Les deux appels partent dans le même tour, pas l'un après l'autre.

S'arrêter tôt. Deux tours de recherche maximum, puis on conclut. Pas de boucle infinie sur des synonymes.

Et un garde-fou clé : si le filtre de juridiction ne matche rien, la recherche renvoie un flag. L'agent sait alors qu'il n'a PAS de correspondance, au lieu de présenter un résultat élargi comme une réponse exacte.

Un agent, ce n'est pas un modèle plus bavard. C'est un modèle à qui on a retiré la possibilité d'improviser.

Vos agents ont-ils le droit de dire "je n'ai pas trouvé" ?

---

## Post 3 : RAG sur un corpus légal, la vraie difficulté

Tout le monde parle de RAG. Peu de gens parlent du corpus.

Sur une plateforme de recherche juridique, le plus dur n'était pas le modèle. C'était de garder le corpus vrai et à jour.

Le pipeline d'ingestion :

Énumérer les textes depuis les portails législatifs officiels.

Empreinter chaque document (SHA-256). Inchangé = ignoré. Modifié = re-parsé.

Parser vers une forme normalisée : loi, préambule, chapitres, articles.

Et surtout : versionner. Chaque parse qui diffère du précédent crée un snapshot. Le corpus garde son historique, il ne l'écrase pas.

Pourquoi ça compte ? Parce qu'en droit, "la version en vigueur à cette date" est une vraie question. Une loi amendée n'efface pas l'ancienne.

Ensuite seulement vient la recherche : Vertex AI Search pour le ranking sémantique, puis Postgres pour le texte exact et faisant foi.

Le modèle arrive en dernier. Il ne fait que rédiger sur des morceaux qu'il n'a pas le droit d'inventer.

La leçon : un bon système RAG, c'est 80% de discipline sur les données, 20% de prompt.

Sur vos projets IA, combien de temps passez-vous sur le corpus versus sur le prompt ?
