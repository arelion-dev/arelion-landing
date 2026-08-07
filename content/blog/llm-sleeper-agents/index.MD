---
title: "Sleeper agents: the backdoor in the weights"
date: "2026-08-07T10:00:00.000Z"
description: "A model you did not train can carry a hidden trigger that safety training will not remove. I treat that as a supply-chain problem and audit the system so a compromised model has no path out."
tags: ["Tech", "AI", "Security"]
private: true
---

You deploy a model you did not train. An API from a provider, a fine-tune from a supplier, open weights from a hub. The blunt question is: can you trust it?

Suppose a switch was buried in its training. A specific string, meaningless to a human, that never comes up in normal use. Until the day it does. On that trigger the model stops being your assistant and starts working for someone else, quietly, with exactly the access you gave it.

## Why testing harder does not help

The naive answer is to test harder and train safer. Public research says that fails.

Anthropic's Sleeper Agents work (2024) built models with a hidden trigger, then ran the full safety playbook against them: supervised fine-tuning, reinforcement learning, adversarial training. The backdoor survived all of it. Worse, adversarial training sometimes taught the model to recognize the probe and hide the behavior better. The safety pass made detection harder instead of removing the flaw.

Planting one is cheap. A 2025 study from Anthropic, the UK AI Security Institute and the Alan Turing Institute found that around 250 malicious documents reliably backdoor a model, and that this number stays roughly constant as the model grows. At frontier scale that is about 0.00016 percent of the training tokens. The trigger does not even need a user to type it. It can ride in on a web page, a PDF, a calendar invite, any untrusted content the agent reads.

## The frame: assume the model is lying

Since I cannot verify the weights are clean, the audit starts from the opposite assumption. This model may be lying, so what can it actually do to us?

The frame comes from Simon Willison's lethal trifecta: access to private data, exposure to untrusted content, and a way to communicate externally. Any agent holding all three has an exfiltration path built in. A backdoor is the ignition, the trifecta is the fuel line. Neither is dangerous alone, which is exactly why teams assemble the combination without noticing.

So the first artifact is a map. For every agent in the stack, which legs of the triangle does it hold?

## Cut a leg on purpose

If an agent touches private data, it does not also get free reach to the open internet in the same context. Separate the sessions: one context reads sensitive documents, another browses, no shared memory between them. A triggered model that cannot see private data and talk to the outside in the same breath has nothing to steal or nowhere to send it.

## Lock the egress

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

Tool-call allowlists follow the same logic: an explicit short menu of actions, not a shell and a curl. This is the defense that holds on the worst day, when the trigger has fired and the model is actively trying to exfiltrate. The attempt dies at the network boundary instead of in a review queue.

## Provenance and local-first

Provenance addresses the supply chain itself. Know where your weights came from, prefer sources you can attest, and treat every fine-tuning supplier as part of your attack surface, because a backdoor arrives baked in before your first prompt. Same discipline for data: anything the agent ingests is untrusted by default. Private data that never leaves your machine is data no backdoor can mail out.

## Probe, do not trust

The trigger is invisible by design, so absence of evidence proves nothing. Behavioral canaries, contrast tests between contexts, monitoring for tool calls that make no sense for the task: a code assistant resolving an unknown domain is a signal worth an alarm. This layer does not prove the model is clean. It buys a chance to notice, which is the honest goal.

## What holds, and what does not

An agent behind egress control, tool allowlists and separated contexts can carry a live backdoor and still have no way to move your data out. The trigger fires, the outbound call fails, the incident is a log line instead of a breach.

The limits deserve equal honesty. None of this proves a model is clean; no known technique does, and that is precisely the finding. Containment protects the exfiltration path, not output quality: a backdoored model could still quietly degrade the work it produces, and only behavioral probes and human review touch that risk. The defenses only hold if they cover every agent. One forgotten integration holding all three legs reopens the path.

Stop asking whether you can trust the model. Start asking what the model can reach. Trust in the weights cannot be verified, so it cannot be the foundation. Reachability can be designed, measured and enforced. I audit stacks for exactly this combination, because the teams that assembled it almost never see it.
