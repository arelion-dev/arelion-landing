# Idée : finance à grande échelle sur une archi distribuée (Kafka)

- **Statut** : idée seule. Plan complet à écrire plus tard (grounding + sections).
- **Pilier** : Build
- **Titre EN (piste)** : Scaling a fintech on an event-driven Kafka architecture
- **Titre FR (piste)** : Encaisser une fintech sur une architecture distribuée Kafka

## L'idée
- Comment tenir le volume et la fiabilité d'une plateforme fintech avec des microservices Node.js qui communiquent en événements via Kafka.
- Pourquoi l'event-driven colle à la finance : découplage des services, traçabilité de chaque mouvement, rejouabilité des événements, idempotence.
- Le vrai sujet (à creuser) : l'ordre des messages, l'exactly-once / l'idempotence, la cohérence entre services, la back-pressure quand un service ralentit.
- L'angle "reusable" : toute plateforme où chaque transaction doit être tracée, rejouable et jamais perdue.

## À faire quand on le développe
- Grounding : projet Epsor (fiche realisations : archi microservices event-driven, Node.js, Kafka, fintech). Chercher le repo si dispo.
- Anonymiser : "a fintech", pas de nom client dans la version deep.
- Sortir les vraies décisions d'archi et un incident concret (le style Antonin : ancrer sur du réel).
