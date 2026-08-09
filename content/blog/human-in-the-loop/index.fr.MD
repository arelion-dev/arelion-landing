---
title: "Garder un humain dans la boucle (KYC)"
date: "2025-12-04T10:20:00.000Z"
description: "Un pipeline de conformité assisté par IA pour l'entrée d'investisseurs dans des fonds réglementés. Le point intéressant, c'est la règle qui interdit au modèle de bloquer un dossier."
tags: ["Tech", "AI"]
private: true
---

Une équipe de conformité lit des dossiers d'investisseurs à la main : cartes d'identité photographiées, coordonnées bancaires rastérisées, avis d'imposition de qualité très inégale, extraits d'immatriculation d'entreprise. Valider ou escalader, un dossier après l'autre. Et chaque trimestre, la pile monte.

Alors quelqu'un branche un LLM qui lit tout et rend un verdict. Ça marche très bien, jusqu'au jour où il valide le mauvais dossier. Voilà cet investisseur à l'intérieur d'un fonds réglementé, avec une validation qui a l'air propre, et plus personne pour reconstituer comment le système en est arrivé là.

J'ai construit le pipeline de décision pour une fintech qui fait entrer des investisseurs dans des fonds réglementés. Une règle passait avant toutes les autres et n'a jamais bougé : le modèle n'a jamais le droit de bloquer un dossier.

**68 % des dossiers propres passent désormais sans qu'aucun humain n'y touche.**

**0 validation silencieuse. Pas une seule.**

**Le temps de revue sur les dossiers de routine a chuté d'environ 70 %.**

## Un modèle fluide ne peut pas être tenu pour responsable

Le raccourci tentant, c'est de laisser un LLM tout lire et décider seul. C'est un risque. Un modèle de langage vous rend du texte fluide et, derrière, rien que vous puissiez tenir pour responsable. Vous ne pouvez pas l'auditer ligne par ligne, et il ne vous redonne pas deux fois la même réponse quand vous vous appuyez dessus. Donnez-lui une entrée maigre : il comble les trous avec de l'invention plausible. Une validation fausse mais confiante est pire qu'une absence de réponse, parce qu'elle a l'air fiable et que, du coup, personne ne revient vérifier.

Alors j'ai gardé le pouvoir de décider hors du modèle. C'est le seul choix sur lequel je parierais toute la conception : le veto vit dans du code déterministe, et le modèle ne le détient jamais. Tout le reste en découle.

## Trois rôles distincts

La règle maison du projet : les transformations déterministes reviennent au code, le jugement revient au modèle, et les deux ne se touchent jamais. Ça donne trois rôles.

**Le LLM consultatif lit et propose.** Il applique la politique anti-blanchiment (éditable) aux données extraites et peut lever un avertissement ou une note d'information. Ce qu'il ne peut pas faire, c'est recaler un dossier. Il tourne à température 0, donc des champs identiques donnent un texte consultatif identique, et sa sortie est un petit enum au lieu de prose libre. Si le modèle ignore son prompt et renvoie un `fail`, le code réécrit ça en `warn` et note qu'il l'a fait. Un petit modèle a le droit de signaler des choses à un humain. Il n'a jamais le droit de fermer la porte lui-même.

```python
# à titre d'illustration, pas le code du client
# Le modèle propose. Le code refuse de le laisser bloquer.
proposal = llm_policy(fields, temperature=0)   # OK | WARN | INFO | (rogue) BLOCK

if proposal.level == "BLOCK":
    # un modèle qui tente un veto est ramené de force en dessous, et la coercition est journalisée
    proposal = proposal._replace(level="WARN", coerced=True)
```

**Le code déterministe est la seule chose qui peut bloquer.** Pièce d'identité expirée, pièce manquante, adresse qui ne colle pas, OCR trop mauvais pour s'y fier : chacun est une règle en code, pas un appel au modèle. La validation des champs est pure. Un IBAN se vérifie avec sa vraie clé ISO 7064 mod-97, un SIREN ou un SIRET avec Luhn, les dates contre des fenêtres d'expiration et de récence, les codes postaux et numéros de TVA contre leurs formats. Pas de réseau, pas de modèle, pas d'horloge au-delà de la seule date que je passe en entrée : le verdict est reproductible, et il se met en cache.

```python
# à titre d'illustration, pas le code du client
def valid_iban(raw: str) -> bool:
    s = raw.replace(" ", "").upper()
    if not re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{10,30}", s):
        return False
    rearranged = s[4:] + s[:4]                       # place le pays + la clé à la fin
    digits = "".join(str(ord(c) - 55) if c.isalpha() else c for c in rearranged)
    return int(digits) % 97 == 1                      # ISO 7064 mod-97

def valid_luhn(number: str) -> bool:                  # SIREN (9), SIRET (14)
    digits = [int(d) for d in number if d.isdigit()]
    total = 0
    for i, d in enumerate(reversed(digits)):
        d = d * 2 if i % 2 == 1 else d
        total += d - 9 if d > 9 else d
    return total % 10 == 0

def not_expired(id_doc, today) -> bool:
    return id_doc.expiry_date is not None and id_doc.expiry_date >= today

def code_rules(fields, today) -> Verdict:
    checks = [
        ("iban_invalid",     not valid_iban(fields.iban)),
        ("siret_invalid",    bool(fields.siret) and not valid_luhn(fields.siret)),
        ("id_expired",       not not_expired(fields.id_doc, today)),
        ("piece_missing",    fields.missing_required()),
        ("address_mismatch", fields.proof_address != fields.declared_address),
    ]
    fired = [name for name, failed in checks if failed]
    return Verdict("BLOCK", reasons=fired) if fired else Verdict("PASS")
```

**Un humain possède tout ce qui fait doute.** Quand la confiance de l'OCR descend sous 0,85, le dossier n'est pas recalé. Il tombe dans une file de revue Postgres, avec la raison et la charge extraite attachées.

Ce seuil vient de données réelles. Un scan rastérisé qui a sorti une mauvaise date de naissance tournait autour de 0,77 ; les documents propres se placent entre 0,94 et 0,998. Sous la ligne, une extraction peut être fausse tout en ayant l'air valide, donc une personne vérifie. Ce même garde-fou refuse de lancer le LLM sur une page uniquement image, sans texte extractible, au lieu de le laisser inventer un nom.

```python
# à titre d'illustration, pas le code du client
if verdict.level == "PASS" and ocr_confidence < 0.85:
    db.execute(
        "INSERT INTO review_queue (dossier_id, reason, ocr_confidence, payload) "
        "VALUES (%s, %s, %s, %s)",
        (dossier_id, "low_ocr_confidence", ocr_confidence, canonical_json(fields)),
    )
    verdict = Verdict("HUMAN", reasons=["low_ocr_confidence"])
```

**Une confiance OCR sous 0,85 route vers un humain, à chaque fois, sans dérogation.**

La couche de blocage tourne à température 0 pour une seule raison : le même dossier doit donner le même verdict à chaque exécution.

Appelez ça le verdict à deux couches. Forme approximative (à titre d'illustration, pas le code du client) :

```python
# à titre d'illustration, pas le code du client
code    = code_rules(fields, today)             # PASS | BLOCK, le seul vrai veto
llm     = llm_policy(fields, temperature=0)     # OK | WARN | INFO, consultatif seulement

if code.level == "BLOCK":
    verdict = code                               # le code gagne, toujours
elif ocr_confidence < 0.85:
    verdict = Verdict("HUMAN", ["low_ocr_confidence"])
else:
    verdict = Verdict("PASS", notes=llm.notes)   # les notes consultatives voyagent avec
```

L'avis que je défends : garder le veto dans le code, c'est ce qui rend le modèle sûr à utiliser, tout simplement. Dès que le modèle peut bloquer, vous héritez de son non-déterminisme, de ses refus et de ses hallucinations comme résultats de production. Laissez le veto au code, et le modèle peut être aussi malin qu'il veut : au pire, il ajoute une note.

## Le système ne devine jamais un verdict qu'il ne peut pas expliquer

C'est la seule propriété que la conception ne lâche pas. Quand le système ne sait pas lire un dossier, il le route vers un humain au lieu de deviner. Un avertissement que le modèle lève à tort coûte un coup d'œil à un relecteur ; ça ne coûte jamais rien à un client. La seule chose qu'il ne produira jamais, c'est une validation silencieuse que personne ne peut expliquer.

Chaque décision s'écrit une fois dans un journal en ajout seul. Le rôle applicatif n'a ni `UPDATE` ni `DELETE`. Chaque ligne porte les bloqueurs déterministes qui se sont déclenchés, la proposition consultative (avec le drapeau de coercition), la confiance OCR, un hash des champs extraits, et le git sha du jeu de règles en vigueur à cet instant.

```sql
-- schéma à titre d'illustration
CREATE TABLE decision_log (
    id            bigserial   PRIMARY KEY,
    dossier_id    text        NOT NULL,
    decided_at    timestamptz NOT NULL DEFAULT now(),
    verdict       text        NOT NULL,   -- PASS | BLOCK | HUMAN
    code_reasons  jsonb       NOT NULL,   -- bloqueurs déterministes déclenchés
    llm_proposal  jsonb       NOT NULL,   -- niveau consultatif, notes, drapeau de coercition
    ocr_conf      numeric     NOT NULL,
    fields_hash   text        NOT NULL,   -- sha256 des champs extraits canoniques
    ruleset_ver   text        NOT NULL    -- git sha des règles au moment de la décision
);
-- le rôle applicatif a INSERT et SELECT seulement. Pas d'UPDATE. Pas de DELETE.
```

Comme le verdict est une fonction pure des champs et de la version du jeu de règles, le rejeu est trivial. Vous faites un checkout de `ruleset_ver`, vous réinjectez les mêmes champs, et vous récupérez les mêmes `code_reasons` et le même verdict, octet pour octet, des mois plus tard. Le texte consultatif, lui, peut dériver quand les modèles changent, mais il n'a jamais touché au résultat : le résultat se reproduit toujours. C'est exactement ce qu'un auditeur vient chercher.

**Chaque décision se rejoue octet pour octet, des mois après avoir été prise.**

> **Retour de terrain.** Au début, le journal stockait une chaîne de décision rendue plutôt que les entrées structurées. La première demande d'audit est arrivée et je pouvais montrer ce qui avait été décidé mais pas le re-dériver : le modèle derrière la note consultative avait été mis à jour, donc re-exécuter produisait une prose différente et le relecteur pensait que l'enregistrement avait changé. Rien n'avait changé, mais je ne pouvais pas le prouver. Le correctif a été de journaliser le hash des champs plus le sha du jeu de règles et de traiter le verdict comme une fonction pure de ces deux-là, indépendante du modèle. Le rejeu est passé de « croyez-moi » à une ré-exécution d'une ligne.

## Il s'améliore sans réentraînement

La décision humaine n'entraîne aucun modèle. Aucune validation de relecteur ne remonte dans les poids, aucune boucle de rétroaction ne remodèle le comportement en douce. Un modèle qui apprend de ses relecteurs dérive, et la dérive, dans un pipeline de conformité, c'est une conclusion d'audit qui n'attend que d'arriver.

À la place, il s'améliore par la voie lente et fiable. Laissé seul, le LLM refait les mêmes erreurs en boucle : il signale `M MATHIEU BEAUCOURT` face à `BEAUCOURT Mathieu` comme une identité discordante, il prend le co-titulaire d'un compte joint pour une seconde identité suspecte, ou il compare un investissement au mauvais chiffre au lieu des actifs réels.

Chaque faux positif récurrent devient un filtre déterministe. La comparaison de noms se règle par une normalisation de tokens qui retire titres, formes juridiques et accents ; la capacité financière se compare comme des nombres. J'écris la règle, puis je la verrouille derrière un test de régression bâti à partir du dossier exact qui a trompé le modèle.

```python
# à titre d'illustration, pas le code du client
def test_joint_account_coholder_is_not_a_second_identity():
    # régression : un relecteur a infirmé ce WARN le 2026-05-14
    fields = load_fixture("joint_account_beaucourt.json")
    proposal = llm_policy(fields, temperature=0)
    assert "second_identity" not in proposal.flags

def test_name_match_strips_titles_and_accents():
    # "M MATHIEU BEAUCOURT" et "BEAUCOURT Mathieu" sont la même personne
    assert same_person("M MATHIEU BEAUCOURT", "BEAUCOURT Mathieu")
```

Chaque bug que je corrige part avec le test qui prouve qu'il reste corrigé. L'intelligence s'accumule dans du code que vous pouvez lire et faire revenir en arrière, dans du code clair plutôt que dans un modèle qu'il faut croire sur parole. Voilà ce que je mettrais sur un tableau blanc : un système de conformité devrait devenir plus déterministe avec le temps, plutôt que plus malin.

## La limite honnête : il faut quand même assez de monde

Le verdict à deux couches ne réduit pas l'équipe de revue à zéro, et ça n'a jamais été le but. Poussez le seuil de confiance vers le haut, et davantage de dossiers propres atterrissent sur des bureaux humains pour rien. Poussez-le vers le bas, et de mauvaises extractions passent déguisées en dossiers propres.

La ligne à 0,85 est un plancher que je préfère régler trop prudent que trop lâche, donc sur un mauvais lot de scans la file humaine grossit avant que les règles rattrapent. Le système échange du débit contre de l'auditabilité, volontairement. Si vous avez besoin d'une automatisation totale avec personne dans la boucle, c'est la mauvaise conception.

## Qui a ce problème

Rien de tout ça n'est propre à l'entrée dans des fonds. Vous avez le même problème si vous approuvez des prêts, réglez des sinistres d'assurance à partir de photos et de déclarations manuscrites, triez des patients, modérez du contenu, sélectionnez des locataires, ou vérifiez des fournisseurs contre des listes de sanctions. Partout où une machine lit des documents brouillons et qu'une décision suit, dont quelqu'un devra répondre, la réponse garde la même forme : laissez la machine lire et suggérer, gardez la décision auditable dans du code déterministe, et envoyez chaque doute vers un humain qui pourra en être tenu responsable.
