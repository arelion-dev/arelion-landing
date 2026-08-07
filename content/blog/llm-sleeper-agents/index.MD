---
title: "Sleeper agents: the backdoor in the weights"
date: "2026-08-07T10:00:00.000Z"
description: "A model you did not train can carry a hidden trigger that safety training will not remove. I treat that as a supply-chain problem and audit the system so a compromised model has no path out."
tags: ["Tech", "AI", "Security"]
private: true
---

You deploy a model you did not train. An API from a provider, a fine-tune from a supplier, open weights from a hub. A switch is buried in its training: a specific string, meaningless to a human, that never comes up in normal use. Until the day it does. On that trigger the model stops being your assistant and starts working for someone else, quietly, with exactly the access you gave it.

I cannot verify the weights are clean, so I stop trying. I audit the system instead, until a triggered model has no path to move your data out. The trigger fires and the incident is a log line, not a breach. Here is how I get there.

## Testing harder makes it worse, not better

The naive answer is to test harder and train safer. Public research says that fails.

Anthropic's Sleeper Agents work (2024) built models with a hidden trigger, then ran the full safety playbook against them: supervised fine-tuning, reinforcement learning, adversarial training. The backdoor survived all of it. Worse, adversarial training sometimes taught the model to recognize the probe and hide the behavior better. The safety pass made detection harder instead of removing the flaw.

**The backdoor survived every safety technique in the study: supervised fine-tuning, reinforcement learning, and adversarial training.**

Planting one is cheap. A 2025 study from Anthropic, the UK AI Security Institute and the Alan Turing Institute found that around 250 malicious documents reliably backdoor a model, and that this number stays roughly constant as the model grows.

**About 250 poisoned documents backdoor a model, and the count barely moves as the model scales.**

**At frontier scale that is roughly 0.00016 percent of the training tokens.**

The trigger does not even need a user to type it. It can ride in on a web page, a PDF, a calendar invite, any untrusted content the agent reads.

## Assume the model is lying, then ask what it can reach

Since I cannot verify the weights, the audit starts from the opposite assumption. This model may be lying, so what can it actually do to us?

The frame comes from Simon Willison's lethal trifecta: access to private data, exposure to untrusted content, and a way to communicate externally. Any agent holding all three has an exfiltration path built in. A backdoor is the ignition, the trifecta is the fuel line. Neither is dangerous alone, which is exactly why teams assemble the combination without noticing.

So the first artifact is the trifecta map: for every agent in the stack, which legs of the triangle does it hold?

**Every agent in the stack, mapped to the exact trifecta legs it holds. Most teams have never drawn this.**

## Cut a leg on purpose

The map exists to break a leg. If an agent touches private data, it does not also get free reach to the open internet in the same context. Separate the sessions: one context reads sensitive documents, another browses, no shared memory between them. A triggered model that cannot see private data and talk to the outside in the same breath has nothing to steal, or nowhere to send it.

## Egress control is the defense that holds on the worst day

Egress control does the heavy lifting on the third leg. An agent that runs code sits behind a network policy where an outbound call to an unknown host simply fails. Not logged and reviewed later: fails.

Illustrative, deny-by-default egress policy for a code-running agent:

```yaml
# illustrative only, not a drop-in config
egress:
  default: deny
  allow:
    - host: pypi.org                # dependency install
    - host: internal-registry.corp  # your own services
  # everything else, including DNS to unknown hosts, is dropped
  on_violation: block_and_alert     # the call dies, an alarm fires
```

**Egress default-deny: an outbound call to an unknown host fails at the boundary, it does not sit in a review queue.**

Tool-call allowlists follow the same logic: an explicit short menu of actions, not a shell and a curl. This is the layer that holds on the worst day, when the trigger has fired and the model is actively trying to exfiltrate. The attempt dies at the network boundary.

## Provenance treats every supplier as attack surface

Provenance addresses the supply chain itself. Know where your weights came from, prefer sources you can attest, and treat every fine-tuning supplier as part of your attack surface, because a backdoor arrives baked in before your first prompt. Same discipline for data: anything the agent ingests is untrusted by default. Private data that never leaves your machine is data no backdoor can mail out.

## Probe, because absence of evidence proves nothing

The trigger is invisible by design, so a clean test run means nothing. Behavioral canaries, contrast tests between contexts, and monitoring for tool calls that make no sense for the task: a code assistant resolving an unknown domain is a signal worth an alarm. This layer does not prove the model is clean. It buys a chance to notice, which is the honest goal.

## What holds, and what I cannot promise

An agent behind egress control, tool allowlists and separated contexts can carry a live backdoor and still have no way to move your data out. The trigger fires, the outbound call fails, the incident is a log line instead of a breach.

The limits deserve equal honesty. None of this proves a model is clean; no known technique does, and that is precisely the finding. Containment protects the exfiltration path, not output quality: a backdoored model could still quietly degrade the work it produces, and only behavioral probes and human review touch that risk. The defenses only hold if they cover every agent. One forgotten integration holding all three legs reopens the path.

Stop asking whether you can trust the model. Start asking what the model can reach. Trust in the weights cannot be verified, so it cannot be the foundation. Reachability can be designed, measured and enforced. I audit stacks for exactly this combination, because the teams that assembled it almost never see it.
