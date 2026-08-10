---
title: "Agents dormants : la porte dérobée dans les poids"
date: "2026-03-05T16:45:00.000Z"
description: "Un modèle que vous n'avez pas entraîné peut porter un déclencheur caché que l'entraînement de sûreté ne retirera pas. Je traite ça comme un problème de chaîne d'approvisionnement et j'audite le système pour qu'un modèle compromis n'ait aucune sortie."
tags: ["Tech", "AI", "Security"]
private: true
---

Vous déployez un modèle que vous n'avez pas entraîné vous-même : une API achetée à un fournisseur, un fine-tune livré par un prestataire, ou des poids ouverts récupérés sur un hub. Quelque part dans cet entraînement, un interrupteur peut être enfoui : une chaîne de caractères précise, qui ne veut rien dire pour un humain et ne remonte jamais en usage normal. Jusqu'au jour où elle remonte, et le modèle se met à suivre les instructions de quelqu'un d'autre, avec exactement l'accès que vous lui avez confié.

Je ne peux pas vérifier que les poids sont sains, alors j'arrête d'essayer. J'audite le système à la place, jusqu'à ce qu'un modèle piégé n'ait plus aucune porte de sortie pour vos données. Le jour où le piège se referme, l'incident tient sur une ligne de log au lieu de virer à la brèche. Voici comment on en arrive là.

## Tester plus fort ne fait qu'aggraver

Le réflexe naïf, c'est de tester plus fort et d'entraîner plus sûr. La recherche publique montre que ça ne marche pas.

Les travaux Sleeper Agents d'Anthropic (2024) ont fabriqué des modèles avec un déclencheur caché, puis leur ont infligé tout l'arsenal de sûreté : fine-tuning supervisé, apprentissage par renforcement, entraînement adversarial. La porte dérobée a tout encaissé. Pire : l'entraînement adversarial a parfois appris au modèle à repérer la sonde et à mieux planquer son comportement, si bien que la passe de sûreté a compliqué la détection au lieu de corriger le défaut.

**La porte dérobée a survécu à chaque technique de sûreté de l'étude : fine-tuning supervisé, apprentissage par renforcement, et entraînement adversarial.**

Mon avis : on n'entraîne pas une porte dérobée pour la faire disparaître, puisque c'est justement l'entraînement qui l'a installée. Le fine-tuning de sûreté ajuste le comportement sur la distribution qu'il voit, et le déclencheur vit en dehors de cette distribution par construction, donc le gradient ne le touche jamais. Autant poncer une table en attendant que le clou planté dans le bois finisse par tomber.

Et en poser une ne coûte presque rien. Une étude de 2025 signée Anthropic, l'UK AI Security Institute et l'Alan Turing Institute a mesuré qu'environ 250 documents malveillants suffisent à installer une porte dérobée fiable, et que ce chiffre bouge à peine quand le modèle grossit.

**Environ 250 documents empoisonnés installent une porte dérobée dans un modèle, et le compte bouge à peine à mesure que le modèle passe à l'échelle. À l'échelle des modèles frontière, c'est à peu près 0,00016 pour cent des tokens d'entraînement.**

Le déclencheur n'a même pas besoin qu'un utilisateur le saisisse. Il peut se glisser dans une page web, un PDF, une invitation d'agenda, dans n'importe quel contenu non fiable que l'agent lit.

## Supposez que le modèle ment, puis demandez ce qu'il peut atteindre

Puisque je ne peux pas vérifier les poids, l'audit part de l'hypothèse inverse. Ce modèle ment peut-être, alors que peut-il réellement faire avec l'accès qu'il détient ?

Le cadre vient du trifecta létal de Simon Willison. Trois pattes, et je nomme chacune concrètement pour la stack que j'ai devant moi :

1. **Données privées.** Secrets de dépôt, dossiers clients, source interne, un identifiant de base de données, une API interne authentifiée que l'agent peut appeler.
2. **Entrée non fiable.** Tout ce que le modèle lit et qu'un attaquant peut influencer : une page web, un PDF, un corps d'email, un ticket Jira, un résultat d'outil, la sortie d'un serveur MCP.
3. **Sortie.** Toute voie par laquelle des octets partent : HTTP sortant, une requête DNS brute, `git push`, un webhook, un envoi d'email, un post Slack.

Tout agent qui réunit les trois embarque un chemin d'exfiltration tout prêt. La porte dérobée, c'est l'allumage ; le trifecta, c'est la conduite d'essence. Aucun des deux n'est dangereux isolément, et c'est précisément pour ça que les équipes assemblent la combinaison sans la voir venir.

Donc le premier artefact est la carte du trifecta : pour chaque agent de la stack, quelles pattes détient-il ?

```yaml
# audit de trifecta illustratif, une ligne par agent
agents:
  - name: code-assistant
    private_data: true       # secrets de depot, source interne
    untrusted_input: true    # lit le texte des tickets, docs recuperees
    egress: true             # lance pip install, git push
    verdict: FULL_TRIFECTA   # un chemin d'exfiltration existe, a corriger
  - name: doc-summarizer
    private_data: true        # contrats clients
    untrusted_input: true     # les documents eux-memes
    egress: false             # pas de reseau dans ce contexte
    verdict: SAFE             # troisieme patte deja coupee
```

**Chaque agent de la stack, cartographié aux pattes exactes qu'il détient. La plupart des équipes n'ont jamais dessiné ça.**

## Couper une patte exprès

Cette carte sert à casser une patte, volontairement. Si un agent touche des données privées, il n'a pas en plus un accès libre à l'internet ouvert dans le même contexte. Je sépare les sessions : un contexte lit les documents sensibles sans aucune route hors de la machine, un autre navigue via un proxy et ne voit jamais ces données. Et rien de partagé en mémoire entre les deux.

```yaml
# illustratif : deux contextes isoles, aucune memoire partagee, aucune route de sortie partagee
contexts:
  private_reader:
    mounts: [/data/contracts:ro]
    network: none             # aucune route hors de la box, du tout
    memory_store: session-A   # non partage
  web_browser:
    mounts: []                # ne voit jamais /data
    network: egress-proxy     # seulement a travers le proxy sur liste blanche
    memory_store: session-B   # non partage
# un message lu par private_reader ne peut pas devenir une requete sortante dans web_browser
```

> Retour de terrain. Sur une stack, j'ai coupé le réseau entre les contextes et j'ai cru avoir fini. Les deux contextes partageaient encore un seul magasin de vecteurs. Des chunks de contrats privés ont remonté pendant une tâche de navigation et sont sortis par la patte que j'avais laissée ouverte. J'avais coupé le réseau et oublié la couche mémoire. L'isolement veut dire chaque canal partagé, y compris ceux qu'il est facile de rater.

## Le contrôle de sortie est la défense qui tient le pire jour

Le contrôle de sortie fait le gros du travail sur la troisième patte. Un agent qui exécute du code tourne derrière une politique réseau en refus par défaut : un appel sortant vers un hôte inconnu échoue, point. Il meurt à la frontière avant que le moindre octet ne parte, plutôt que d'atterrir dans un journal qu'on relira après coup.

```yaml
# NetworkPolicy Kubernetes illustrative : refus par defaut de la sortie pour le pod agent
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: agent-egress-deny
spec:
  podSelector:
    matchLabels: { app: llm-agent }
  policyTypes: [Egress]
  egress:
    - to:
        - podSelector:
            matchLabels: { app: egress-proxy }   # le seul saut suivant autorise
      ports:
        - { protocol: TCP, port: 3128 }
    # aucune autre regle. toute autre destination est rejetee.
```

Tout passe par un seul proxy de sortie (Squid, ou une règle Cilium/Envoy) qui résout et autorise une courte liste blanche et rien d'autre. Le proxy détient la liste d'hôtes, donc le DNS n'atteint jamais un résolveur arbitraire.

> Retour de terrain. Ma première liste blanche de sortie filtrait les hôtes HTTP et avait l'air complète. Elle laissait CoreDNS résoudre n'importe quoi. L'agent pouvait encore fuiter en résolvant `<base32-de-votre-token>.attacker.com` ; le secret partait à l'intérieur de la requête DNS elle-même, sans HTTP nécessaire. Le DNS est une sortie. Bloquez-le vers les résolveurs arbitraires ou la liste blanche est du théâtre.

Les listes blanches d'appels d'outils suivent la même logique côté action. Un menu court et explicite, refus par défaut, pas de shell et pas de `curl`.

```python
# illustratif : liste blanche d'outils appliquee avant dispatch, refus par defaut
ALLOWED = {
    "search_docs": lambda a: True,
    "read_file":   lambda a: a["path"].startswith("/workspace/"),
    "http_get":    lambda a: host(a["url"]) in EGRESS_ALLOW,
}

def dispatch(call):
    guard = ALLOWED.get(call.name)
    if guard is None or not guard(call.args):
        raise ToolDenied(call.name)   # pas de shell, pas d'eval, pas de fetch arbitraire
    return TOOLS[call.name](call.args)
```

C'est la couche qui tient le pire jour, celui où le piège s'est refermé et où le modèle tente de faire sortir des données.

Le contrôle de sortie est la défense centrale parce que c'est la seule qui ne dépend pas de ce qu'on comprend du modèle. Les sondes et les évals raisonnent sur un comportement que vous ne verrez jamais entièrement. Un paquet rejeté, lui, se fiche de savoir si le modèle ment : la tentative meurt à la frontière, quoi qu'il arrive.

## La provenance traite chaque fournisseur comme une surface d'attaque

La provenance, elle, s'attaque à la chaîne d'approvisionnement elle-même. Sachez d'où viennent vos poids, vérifiez-les avant de les charger, puis épinglez l'artefact exact pour que personne ne vous le remplace en douce.

```bash
# illustratif : verifier que les poids sont ceux que vous avez valides, avant leur chargement
cosign verify-blob \
  --certificate model.crt \
  --signature   model.safetensors.sig \
  model.safetensors                       # verification de signature via sigstore
sha256sum -c model.safetensors.sha256 || exit 1   # epinglez le condense, jamais "latest"
```

Traitez chaque fournisseur de fine-tuning comme une partie de votre surface d'attaque, parce qu'une porte dérobée arrive déjà en place avant même votre premier prompt. Même discipline pour les données : tout ce que l'agent avale est non fiable par défaut. Et des données privées qui ne quittent jamais votre machine, aucune porte dérobée ne pourra les expédier dehors.

## Sondez, parce que l'absence de preuve ne prouve rien

Le déclencheur est invisible par conception, donc un test propre ne signifie rien. Je lance des canaris comportementaux, des tests de contraste entre contextes, et une surveillance des appels d'outils qui n'ont aucun sens pour la tâche. Un assistant de code qui résout un domaine inconnu, ou qui lit `/data` depuis le contexte de navigation, est un signal qui vaut une alarme.

Cette couche ne prouve pas que le modèle est sain. Elle offre juste une chance de s'en apercevoir. Soyons honnête : le sondage est la patte la plus faible de la défense, et je le traite comme tel. C'est un détecteur de fumée, rien de plus. Le mur, lui, c'est la frontière de sortie ; le détecteur vous signale seulement que le piège a sauté.

## Ce qui tient, et ce que je ne peux pas promettre

Un agent placé derrière le contrôle de sortie, les listes blanches d'outils et des contextes séparés peut porter une porte dérobée bien vivante sans avoir la moindre voie pour faire sortir vos données. Le piège se referme, l'appel sortant échoue, et l'incident tient sur une ligne de log au lieu de devenir une brèche.

Les limites méritent la même franchise. Rien de tout cela ne prouve qu'un modèle est sain. Aucune technique connue n'y arrive, et c'est précisément ça, le résultat de la recherche.

Le confinement protège le chemin d'exfiltration, pas la qualité de la production. Un modèle piégé peut très bien continuer à dégrader en douce le travail qu'il rend, et là, seuls les sondages comportementaux et la relecture humaine attaquent le risque. Ces défenses ne tiennent que si elles couvrent chaque agent : une seule intégration oubliée qui réunit les trois pattes rouvre le chemin, et le magasin de vecteurs partagé plus haut, c'est exactement comme ça que ça arrive en vrai.

Arrêtez de vous demander si le modèle est digne de confiance. Demandez-vous plutôt ce qu'il est capable d'atteindre. La confiance dans les poids ne se vérifie pas, donc elle ne peut pas servir de fondation. Ce qu'un agent peut atteindre, en revanche, ça se conçoit, ça se mesure et ça s'impose. J'audite des stacks pour exactement cette combinaison, parce que les équipes qui l'ont montée ne la voient presque jamais.
