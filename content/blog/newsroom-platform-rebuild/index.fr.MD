---
title: "Plus de dix ans de journalisme, déplacés sans un clignement"
date: "2025-08-28T09:12:00.000Z"
description: "Comment j'ai déplacé un CMS hérité vieux de plus de dix ans, fort de plus de 500 000 articles, vers une nouvelle plateforme sans aucune interruption. Le playbook de migration qui a rendu le jour de la bascule ennuyeux, voilà la vraie histoire."
tags: ["Tech", "Migration"]
private: true
---

Plus de dix ans de journalisme, coincés dans un CMS hérité que plus personne ne comprenait vraiment. Chaque idée produit de la rédaction (analytics, personnalisation, un bandeau d'articles liés qui marche pour de bon) mourait dès qu'elle touchait cette plateforme. L'archive, c'était le bien le plus précieux de l'entreprise, et aussi le seul système auquel l'ingénierie n'osait pas toucher.

J'ai reconstruit la plateforme d'un média national et basculé plus de dix ans de contenu vers un système que l'entreprise possède et comprend. Le site n'est jamais tombé, les lecteurs n'ont jamais vu de changement d'adresse, et l'app mobile déjà dans leur poche n'a pas bougé d'un cran.

**Plus de 500 000 articles et plus de dix ans du récit national, déplacés avec 0 interruption visible côté lecteur.**

La nouvelle stack, c'est la partie facile. N'importe quel ingénieur compétent monte PostgreSQL 16, une API Apollo GraphQL et un front Next.js 14 sur Cloud Run. Le vrai sujet, c'est comment déplacer plus de dix ans du récit national alors qu'on continue de le lire, de le publier et de servir du trafic à chaque seconde. Ça, c'est un problème de migration, et la migration a son playbook.

## Vous ne pouvez pas déplacer ce que vous n'avez pas cartographié

J'ai dressé une carte avant d'écrire la moindre ligne de code. Une plateforme héritée, c'est des années de sous-systèmes empilés les uns sur les autres : bases de données, flux RSS et de stats, sitemaps, points d'accès mobiles, publication programmée, buckets média, et des tâches cron que personne ne se rappelle avoir créées.

J'ai décrit chacun et rendu un verdict : reconstruire, garder, ou laisser crever. Cette carte est devenue le contrat de toute la migration.

Ceux qui ont failli m'avoir, c'est les non documentés. Un cron de publication programmée alimentait une table qu'aucun bout de code ne référençait plus, et un flux RSS sur une URL fixe se faisait scraper depuis des années par un partenaire de syndication. Aucun des deux ne figurait sur un diagramme, et les deux auraient explosé bruyamment à la bascule si la carte ne m'avait pas obligé à aller les débusquer.

**Ma règle : on ne remplace pas une plateforme qu'on n'a pas entièrement décrite, et ce qui vous saute à la gorge le jour de la bascule, c'est toujours ce que vous n'aviez noté nulle part.**

## Un miroir continu transforme des années en heures

La migration naïve copie tout le jour J. La copie prend des heures, la source bouge sous vos pieds, et vous vous retrouvez à réconcilier une cible mouvante sous pression. C'est pris à l'envers. Une copie big-bang fait du jour de la bascule l'heure la plus risquée du projet, alors qu'elle devrait en être la plus calme : à ce moment-là, tout ce qui était dur est déjà derrière vous.

J'ai donc fait tourner un miroir continu à la place. Pendant des mois, tout le temps où je construisais, un worker suivait chaque édition du CMS hérité et l'upsertait dans la nouvelle base PostgreSQL. La réplication logique n'était pas dispo sur la base héritée, donc le miroir s'est rabattu sur une capture de changements par filigrane (change data capture) : sonder les lignes modifiées depuis le dernier repère haut, les transformer vers le nouveau schéma, et upserter de façon idempotente.

```python
# illustratif : une passe du worker miroir
watermark = load_watermark()            # dernier updated_at hérité synchronisé
rows = legacy.query(
    "SELECT id, updated_at, payload FROM articles "
    "WHERE updated_at >= %s ORDER BY updated_at ASC", watermark)

for row in rows:
    doc = transform(row["payload"])     # soupe de colonnes héritées -> nouveau schéma
    pg.execute(
        "INSERT INTO articles (legacy_id, slug, body_html, published_at, updated_at) "
        "VALUES (%(legacy_id)s, %(slug)s, %(body_html)s, %(published_at)s, %(updated_at)s) "
        "ON CONFLICT (legacy_id) DO UPDATE SET "
        "  slug = EXCLUDED.slug, body_html = EXCLUDED.body_html, "
        "  published_at = EXCLUDED.published_at, updated_at = EXCLUDED.updated_at",
        doc)
    save_watermark(row["updated_at"])
```

Deux détails portent tout l'édifice.

L'upsert est idempotent (`ON CONFLICT ... DO UPDATE`), donc rejouer une fenêtre ne coûte rien. Et j'interroge avec `>=` en faisant chevaucher chaque fenêtre de sondage de quelques secondes, parce que plusieurs articles peuvent partager le même `updated_at` à la seconde près. Ratez-en un parce qu'un `>` strict a enjambé son horodatage, et vous vous retrouvez avec un trou silencieux dans l'archive, le pire bug qui soit : invisible jusqu'au jour où un lecteur tombe sur un 404 pour un article vieux de plusieurs années.

La nouvelle stack n'a jamais eu plus de quelques minutes de retard sur l'ancienne. La copie de masse, lente et casse-gueule, a eu lieu une seule fois, tranquillement, bien avant que qui que ce soit ne regarde.

**Bascule mesurée en heures : le basculement a déplacé un delta de quelques heures d'éditions, parce que plus de dix ans d'archive étaient déjà en place.**

## Prouvez l'équivalence, ne la supposez jamais

La contrainte la plus risquée, c'était l'app mobile. Déjà installée sur les téléphones des lecteurs, impossible à mettre à jour au rythme de la migration. La nouvelle API GraphQL devait donc répondre à ses requêtes exactement comme l'ancienne, octet pour octet, sur des réponses que l'app parsait sans tolérance.

« Ça devrait être pareil » n'est pas une phrase d'ingénieur. J'ai donc construit une suite de comparaison, le **portail de parité**, qui rejouait du vrai trafic échantillonné contre les deux stacks et pointait chaque différence jusqu'à une seule entité HTML.

```python
def normalize(resp):
    body = json.loads(resp.body)
    body.pop("served_at", None)         # champs volatils que le client ignore
    body.pop("request_id", None)
    return json.dumps(body, sort_keys=True, ensure_ascii=False)

def run_parity(sampled_traffic):
    diffs = 0
    for req in sampled_traffic:
        old = call(legacy_api, req)
        new = call(new_api, req)
        if normalize(old) != normalize(new):
            report_diff(req, old, new)   # diff unifié, jusqu'à une seule entité
            diffs += 1
    return diffs == 0                    # l'exécution n'est verte qu'à zéro
```

La règle du portail était brutale et non négociable : trois exécutions consécutives entièrement vertes sur 24 heures avant le moindre basculement. Pas une, trois, étalées sur une journée complète, pour qu'un trafic calme de 3h du matin ne planque pas un bug que le pic de l'après-midi ferait ressortir.

> Retour de terrain. Le portail de parité s'est allumé en rouge pendant une journée entière à cause de deux différences qui n'étaient pas du tout des bugs dans l'API. C'étaient des bugs dans mon `normalize`. D'abord, l'API héritée renvoyait un tableau de tags dans l'ordre d'insertion et la nouvelle le triait, donc un contenu identique divergeait. Ensuite, l'ancienne stack émettait `&amp;` là où la nouvelle émettait un `&` nu dans les chaînes JSON, une entité, dans une poignée de titres. Les deux étaient sémantiquement égaux. Les deux échouaient au portail. J'ai corrigé le normaliseur pour trier les tableaux que le client traite comme non ordonnés et pour canoniser l'encodage des entités, puis j'ai rejoué. La leçon : votre vérificateur d'équivalence est du code lui aussi, et une suite qui crie au loup est aussi dangereuse qu'une qui reste muette, parce que vous apprenez à l'ignorer.

**Des dizaines de millions de pages vues par mois ont continué de couler, et plusieurs centaines de milliers de comptes lecteurs enregistrés ont été repris sans que personne ne soit bloqué dehors.**

## Basculez par petits pas réversibles

La bascule était conçue pour être ennuyeuse. J'ai déplacé cinq enregistrements DNS un par un sur Cloudflare, du plus petit périmètre d'impact au plus grand.

1. Flux de statistiques (personne ne remarque en lisant si ceux-ci clignotent)
2. Flux mobiles
3. Média
4. L'API du CMS
5. Le site principal, en dernier

Le mécanisme, c'était un seul changement d'enregistrement DNS par étape, rien de plus. Une semaine avant, j'ai descendu le TTL de chaque enregistrement à 60 secondes, pour qu'un basculement (ou un retour arrière) se propage en une minute au lieu de plusieurs heures. Ce réglage de TTL, c'est l'étape sans gloire qu'on oublie, et c'est elle qui rend le retour arrière assez rapide pour servir vraiment.

```bash
# illustratif : basculer un enregistrement en avant ; TTL déjà abaissé à 60s des jours plus tôt
curl -sS -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"api.example","content":"new-stack.run.app","ttl":60,"proxied":true}'

# le retour arrière est exactement le même appel avec la cible héritée. ~60s pour prendre effet.
```

Chaque étape attendait des signaux propres (portail de parité au vert, taux d'erreur plat, miroir à jour) avant que la suivante ne démarre. Chacune était réversible en une soixantaine de secondes, parce que revenir en arrière, c'était rebasculer un enregistrement, pas restaurer une sauvegarde. Et j'ai répété le retour arrière de chaque étape avant de la basculer en avant. **Un plan de retour arrière que vous n'avez jamais joué n'est qu'un vœu pieux.**

**Les rédacteurs ont suspendu la publication une fois, environ trente minutes, pendant l'étape du CMS. C'était tout le coût visible du déplacement de plus de dix ans de journalisme.**

Sur la nouvelle plateforme, les articles liés se sont remis à fonctionner, une fonctionnalité que la stack héritée avait discrètement laissée tomber des années plus tôt. La reconstruction a gardé l'archive intacte et l'a rendue de nouveau exploitable.

## Ne touchez jamais au système hérité

Une règle a tout gardé sous contrôle : je n'ai jamais modifié la stack héritée. Pas un ajustement de config, pas un « petit correctif tant que j'y suis », rien du tout.

L'ancienne plateforme, c'était ma porte de sortie. Tant qu'elle restait intacte et fonctionnelle, chaque pas en avant restait réversible, puisque je pouvais toujours repointer le DNS vers un système qui n'avait pas bougé. Dès l'instant où vous commencez à « améliorer » ce que vous quittez, vous perdez cette issue de secours et l'exercice vire au saut dans le vide.

J'ai refusé le saut. C'est la seule règle que j'imposerais à n'importe quelle migration, sans exception : le système que vous quittez est gelé le jour où vous démarrez, et il le reste jusqu'à ce que le dernier enregistrement DNS soit basculé et au vert.

## Le miroir continu était du code jetable, et la plupart des migrations devraient s'en passer

J'ai construit et maintenu une couche complète de capture de changements pendant des mois, uniquement pour la supprimer le jour de la bascule. Pour une archive plus petite ou plus calme, ce coût ne se justifie pas : une seule copie de masse bien répétée suffit, et le miroir devient de la sur-ingénierie.

Le miroir ne mérite sa place qu'à une condition : la source ne s'arrête jamais de changer, donc le delta à la bascule doit friser le zéro. Ce projet, c'était pile ce cas. La plupart ne le sont pas, et je découragerais volontiers quiconque n'en a pas réellement besoin.

## Voilà à quoi ressemble une migration quand la chose ne peut pas s'arrêter

Rien de tout ça n'est propre à la presse. Vous inventoriez tout, puis vous miroitez en continu si la source ne s'arrête jamais. Vous prouvez l'équivalence par comparaison automatisée plutôt qu'à l'optimisme, et vous basculez par petits pas réversibles, chacun avec son retour arrière déjà répété. Et vous ne touchez jamais au système que vous quittez.

Quiconque est assis sur des années de contenu ou de données coincées dans une plateforme héritée a le même problème, avec un autre logo dessus : l'éditeur dont l'archive fait le rempart, la boutique e-commerce au catalogue interminable éclaté entre des systèmes qui ne se parlent plus, l'organisme public dont les archives sont précieuses et hors d'atteinte.

La donnée, c'est l'actif ; la plateforme, c'est le geôlier. La sortie, c'est une reconstruction menée avec assez de soin pour que le jour où tout change, personne hors des murs ne s'en aperçoive.
