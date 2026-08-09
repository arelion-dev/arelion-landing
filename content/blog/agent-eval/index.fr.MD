---
title: "Détecter les régressions silencieuses d'un agent IA (évals, golden sets, juges LLM)"
date: "2026-07-02T14:15:00.000Z"
description: "Un agent se dégrade en silence sans jamais lever d'erreur de compilation. Voici le harnais d'éval à deux pistes que j'ai construit pour l'attraper : un golden set extrait de la production, des métriques de trajectoire et un juge LLM branché comme CustomMetric côté client."
tags: ["Agent eval", "LLM judge", "Testing"]
private: true
---

Un service qui casse vous prévient : il renvoie des 500 et l'alerte sonne. Un agent qui se détériore doucement, lui, ne dit rien. Quelqu'un resserre un system prompt, une version de modèle avance sous un alias que personne n'a épinglé, un filtre de récupération gagne un champ plus strict, et les réponses se mettent à baisser d'une façon qu'aucun test unitaire ne peut voir. La suite reste au vert, l'agent sort toujours un anglais impeccable, donc rien ne bronche. Vous l'apprenez six semaines plus tard, d'un utilisateur qui lâche « avant, ça le trouvait ».

J'ai construit ce harnais d'éval pour l'agent documentaire d'un grand groupe de cosmétiques, au-dessus de Google ADK et du Vertex AI Gen AI Evaluation Service. Voici ce qu'il y a dedans, et ce que j'ai raté en route.

## Le mode de défaillance d'un agent, c'est la dérive

Aucun système de types ne détecte « la réponse s'est un peu dégradée ». La seule chose qui survit à un ajustement de prompt, c'est un jeu noté : une liste figée de questions, chacune avec sa réponse correcte confirmée et son chemin d'outils correct confirmé, rejouée à chaque changement et comparée au passage précédent.

Le harnais est un module à part, et il n'importe jamais le code de l'agent. Tout ce qu'il connaît, c'est une adresse : soit une ressource Vertex AI Agent Engine déployée, soit un `adk api_server` local sur `127.0.0.1:8000`. Il appelle l'agent comme n'importe quel client le ferait.

```bash
AGENT_EVAL_MODE=local  LOCAL_AGENT_BASE_URL=http://127.0.0.1:8000  python -m src.agent_eval.agent_track
AGENT_EVAL_MODE=remote TARGET_AGENT_KEY=rag_agent                  python -m src.agent_eval.agent_track
```

**Mon parti pris : un harnais d'éval qui importe l'agent, ce n'est qu'un test unitaire avec des étapes en plus.** Le garder hors du processus me laisse noter n'importe quelle version de l'agent, où qu'elle tourne, sans redéploiement ni rebuild.

## Deux pistes, parce que « la réponse avait l'air correcte » et « la récupération a trouvé le document » sont deux questions différentes

Un agent peut écrire une réponse plausible et bien sourcée alors que la récupération a raté en silence le seul document qui comptait : le score au niveau agent reste élevé pendant que le système, lui, est cassé. D'où deux pistes indépendantes.

La **piste agent** rejoue des conversations entières contre l'agent en marche. La **piste récupération** court-circuite le LLM et appelle les outils de recherche directement via MCP, contre une correspondance golden entre requête et documents attendus. Sans modèle dans la boucle pour maquiller un raté, le résultat est binaire : le document est revenu dans le top k, ou pas.

```python
def score_case(case, hits, total):
    """Calcule found/recall pour les hits de recherche d'un cas (top case.k seulement)."""
    top_k_ids = {str(h.get("external_id") or h.get("referred_doc") or "") for h in hits[: case.k]} - {""}
    expected = set(case.expected_doc_ids)
    matched = expected & top_k_ids
    recall = (len(matched) / len(expected)) if expected else 1.0
    return bool(matched), recall, sorted(top_k_ids)
```

La piste fait aussi une ablation. Un cas peut porter des filtres qu'un humain a confirmés légitimes (l'utilisateur a bien demandé une plage de dates), et le runner joue alors la requête deux fois, une fois avec les filtres et une fois sans, pour comparer :

```python
@property
def looks_over_restricted(self) -> bool:
    """Vrai quand retirer les filtres trouve le doc attendu, mais que le filtrage, lui, l'a raté."""
    return bool(self.unfiltered_found_expected) and not self.found_expected
```

Même requête, même index, un seul argument qui change. « L'étape de filtrage est trop agressive » devient alors un constat directement attribuable, plus une intuition. La piste affiche `recall@k`, `found_rate` et `over_restricted_rate`, et elle nomme chaque cas en échec.

## Le golden set sort de la production

Les questions d'éval synthétiques ne testent que le corpus que vous imaginez. Elles ressortent toujours trop propres : pas de fautes de frappe, pas de phrase qui bascule du français à l'anglais en son milieu, personne qui épingle un document au tour 1 pour y revenir au tour 6. Les vrais utilisateurs font tout ça, et c'est précisément là qu'un agent casse.

Du coup, chaque cas sort de la télémétrie de production, qui atterrit dans BigQuery. Je prends une vraie session passée, je vérifie sa réponse à la main contre le document source, puis je l'épingle comme cas de régression permanent. Une interface d'annotation s'occupe de la conversion : elle charge la session, laisse un humain corriger les tours, les appels d'outils, les réponses d'outils et l'état de session, puis écrit un `annotation-conversation-*.json` par conversation. Le harnais ne ramasse que ce qu'un humain a marqué comme terminé :

```python
done = [a for a in set_annotations if a.get("status") == "done"]
if not done:
    LOGGER.warning("Annotator eval set %r has no 'done' conversations; skipping", eval_set_id)
    continue
```

Le format sur disque, c'est le schéma Pydantic `EvalSet` / `EvalCase` d'ADK lui-même, pas un format maison. Voici le cas canonique, anonymisé. Une question en quatre parties, dont j'attends le comportement suivant : enregistrer une checklist de couverture, lancer une recherche par entité, puis les cocher.

```json
{
  "eval_id": "four_bases_perf",
  "conversation": [{
    "user_content": { "role": "user", "parts": [{ "text":
      "Document the performance of these four shampoo bases: A, B, C, D. For EACH base cite a source, or say 'no data found'. Search by base name, not by the project name (it is new, 0 results)." }] },
    "final_response": { "role": "model", "parts": [{ "text":
      "A: panel report EV-3521 p.4. B: workshop note NC-1102 p.2. C: panel report EV-3521 p.7. D: no data found for this base. Every base was searched on its own, no blended query." }] },
    "intermediate_data": {
      "tool_uses": [
        { "name": "track_coverage",  "args": { "subgoals": ["A", "B", "C", "D"] } },
        { "name": "semantic_search", "args": { "query": "base A performance panel test" } },
        { "name": "semantic_search", "args": { "query": "base B performance panel test" } },
        { "name": "semantic_search", "args": { "query": "base C performance panel test" } },
        { "name": "semantic_search", "args": { "query": "base D performance" } },
        { "name": "track_coverage",  "args": { "covered": ["A", "B", "C", "D"] } }
      ]
    }
  }],
  "session_input": { "app_name": "rag_agent", "user_id": "eval_user", "state": { "database": "corpus" } }
}
```

Regardez le `"no data found"` dans la réponse de référence. **Un jeu d'éval qui ne récompense que les réponses trouvées vous pousse à construire un agent qui n'admet jamais un trou.** Le silence du corpus fait partie de la vérité terrain, lui aussi.

## Deux scores par tour : le chemin pris, et la réponse donnée

Chaque tour rejoué devient une ligne : `prompt`, `response`, `reference`, `predicted_trajectory` et `reference_trajectory`. Six métriques de trajectoire notent la paire via le Gen AI Evaluation Service : `trajectory_exact_match`, `trajectory_in_order_match`, `trajectory_any_order_match`, `trajectory_precision`, `trajectory_recall`, `trajectory_single_tool_use`. Ensemble, elles répondent à une question : a-t-il appelé les bons outils, dans un ordre sensé, sans empiler les appels inutiles ?

La qualité de la réponse, elle, passe devant un juge LLM au barème strict, déclaré dans la même config d'expérience versionnée que le dataset :

```json
{
  "experiment_name": "agent-eval-rag-quality",
  "dataset": "configurations/eval_sets",
  "metrics": [
    { "type": "builtin", "name": "trajectory_exact_match" },
    { "type": "builtin", "name": "trajectory_precision" },
    { "type": "builtin", "name": "trajectory_recall" },
    { "type": "builtin", "name": "rouge_1" },
    {
      "type": "llm_judge",
      "name": "answer_correctness",
      "model": "gemini-3.5-flash",
      "system_prompt": "You are a strict evaluator of a document-retrieval assistant. Judge only whether the agent's answer is factually consistent with the reference answer. Ignore differences in wording, length, or style.",
      "prompt_template": "Question:\n{prompt}\n\nReference answer:\n{reference}\n\nAgent answer:\n{response}\n\nScore from 0.0 (contradicts or misses the reference) to 1.0 (fully consistent). Respond with a single JSON object: {\"score\": <float>, \"explanation\": <one short sentence>}.",
      "params": { "temperature": 0 }
    }
  ]
}
```

Un seul fichier dans git fixe quel dataset, quelles métriques, quel juge et à quelle température, pour que chaque passage de cette config reste comparable à tous les autres. Les résultats atterrissent dans Vertex AI Experiments, qui me donne la comparaison passage après passage directement dans la Cloud Console, sans aucun dashboard à construire.

## Le juge tourne côté client, et ça m'a été imposé

Le juge natif de Vertex, `PointwiseMetric`, tourne côté serveur sur l'autorater de Google. Son champ `autorater_model` n'accepte qu'un modèle ou un endpoint publisher Vertex, impossible donc de le pointer vers une passerelle de modèle privée. Dans une entreprise régulée, cette passerelle n'a rien d'optionnel : c'est là que vivent l'authentification, le quota, la journalisation et l'allowlist des modèles.

Le juge est donc devenu un `CustomMetric` dont la fonction tourne dans mon processus et appelle la passerelle via un client basé sur LiteLLM :

```python
def build_llm_judge_metric(spec) -> CustomMetric:
    config = LLMConfig(id=spec.name, model=spec.model,
                       system_prompt=spec.system_prompt, params=spec.params)

    def metric_function(row: dict) -> dict:
        prompt = _render_prompt(spec.prompt_template, row)   # {prompt} {response} {reference} ...
        try:
            verdict = _get_llm_client().completion_content(
                config=config, input=prompt, response_format=LLMContentEnum.JSON)
            if not isinstance(verdict, dict) or "score" not in verdict:
                raise ValueError(f"judge did not return a JSON object with a 'score': {verdict!r}")
            return {spec.name: float(verdict["score"]),
                    f"{spec.name}/explanation": verdict.get("explanation", "")}
        except Exception as exc:  # une ligne fautive ne doit pas faire échouer tout le passage d'éval
            LOGGER.warning("llm_judge metric %r failed on a row: %s", spec.name, exc)
            return {spec.name: math.nan, f"{spec.name}/explanation": f"error: {exc}"}

    return CustomMetric(name=spec.name, metric_function=metric_function)
```

Deux détails comptent plus que le câblage. D'abord, le juge doit renvoyer `{"score": 0..1, "explanation": "..."}`, et l'explication a sa propre colonne, pour qu'un mauvais score soit lisible au lieu d'être juste bas. Ensuite, un échec du juge note cette ligne-là à `NaN` et pose l'erreur dans la colonne d'explication. **Un passage de 200 cas qui s'arrête à la ligne 137 parce qu'un appel de passerelle a expiré est pire qu'inutile : vous finirez par ne plus le lancer du tout.**

> **Retour de terrain.** Les métriques de trajectoire faisaient sauter tout le passage à cause d'un seul cas : une simple salutation, « Hi, what can you help me with? », dont la trajectoire de référence est, à juste titre, une liste vide. Le Gen AI Evaluation Service encode « aucun appel d'outil attendu » par un champ non défini, puis rejette la ligne comme invalide. Il ne la saute pas, il fait planter tout l'appel. Le correctif : noter les métriques de trajectoire dans un `EvalTask` séparé, uniquement sur les tours dont la trajectoire de référence n'est pas vide, puis refusionner les deux tables de métriques sur `(eval_set_id, eval_id, turn_index)` :
>
> ```python
> scoreable = dataset[dataset["reference_trajectory"].map(bool)]
> if skipped := len(dataset) - len(scoreable):
>     LOGGER.warning("Skipping trajectory metrics for %d turn(s) with an empty reference_trajectory", skipped)
> ```
>
> Le cas de la salutation reste noté sur la qualité de réponse ; il n'a simplement pas de score de trajectoire. La leçon se généralise : « attendu : rien » est une attente parfaitement légitime, et la plupart des outils d'éval ne la modélisent pas.

## Le levier A/B est une seule variable d'environnement

La couche de persévérance de l'agent (une checklist de couverture, plus un verrou qui bloque une réponse finale prématurée) est livrée avec un coupe-circuit, `PERSEVERANCE_OFF=1`, qui coupe d'un coup la mise à l'échelle du budget et le verrou. Ça sert de trappe de secours en production, et c'est la seule façon honnête d'affirmer que la fonctionnalité a vraiment aidé :

```bash
PERSEVERANCE_OFF=1 EXPERIMENT_NAME=perseverance-off python -m src.agent_eval.agent_track
PERSEVERANCE_OFF=0 EXPERIMENT_NAME=perseverance-on  python -m src.agent_eval.agent_track
```

Même jeu noté, même corpus, même juge, un seul flag entre les deux passages. Ensuite, vous lisez le delta dans Vertex AI Experiments. **Verrou coupé, le jeu noté sortait 0,41 en complétude ; verrou activé, 0,98 (illustratif).** Sans le coupe-circuit, j'aurais une conviction ; avec, j'ai un chiffre qu'un relecteur sceptique peut reproduire lui-même.

Chaque fonctionnalité comportementale d'un agent devrait être livrée avec son propre interrupteur, précisément pour cette raison. Ça coûte un `if`, et ça transforme une opinion en mesure.

## Limites honnêtes

**Un juge LLM dérive.** C'est un modèle, et les modèles changent sous des alias stables. Un juge qui note 0,7 aujourd'hui et 0,8 en novembre vous parle peut-être d'un changement du juge, pas de l'agent. Épinglez le modèle juge à une version explicite, mettez `temperature: 0`, et traitez tout saut du juge comme un changement à part entière, à tester en A/B.

**Un jeu noté mesure ce que vous y mettez.** Rien de plus. Le harnais, c'est la partie rapide ; la couverture du jeu, c'est le vrai travail, et il ne s'arrête jamais vraiment. Chaque incident de production devrait se clore par un nouveau cas épinglé, sinon la même classe de bug finit par revenir.

**Le trajectory exact match punit les chemins valides.** Un agent qui trouve le même document via `full_text_search` au lieu de `semantic_search` obtient zéro sur `trajectory_exact_match`, alors qu'il est parfaitement correct. Lisez-le toujours à côté de `trajectory_recall` et du juge, et ne conditionnez jamais un déploiement à lui seul.

**Le recall@k de la récupération est volontairement grossier.** k vaut 10 par défaut : la question devient « est-il revenu, oui ou non » et non « était-il classé premier ». Juger la qualité du classement réclame une pertinence graduée, et ce jeu-là, je ne l'ai pas construit.

## Qui a ce problème

Quiconque a livré une fonctionnalité LLM puis touché au prompt, c'est-à-dire tout le monde. Ça fait plus mal avec les corpus régulés et les questions à parties multiples : dossiers pharma, bibliothèques de clauses, fichiers KYC, gestion de sinistres. Quand une mauvaise réponse coûte une décision et pas juste un clic, un jeu noté vous est utile bien avant une plus belle interface.
