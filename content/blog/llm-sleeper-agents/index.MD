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

My take: you cannot train a backdoor out, because training is the mechanism that put it in. Safety fine-tuning shapes behavior on the distribution it sees. The trigger lives off that distribution by construction, so the gradient never touches it. You are sanding a table and expecting the nail inside the wood to come loose.

Planting one is cheap. A 2025 study from Anthropic, the UK AI Security Institute and the Alan Turing Institute found that around 250 malicious documents reliably backdoor a model, and that this number stays roughly constant as the model grows.

**About 250 poisoned documents backdoor a model, and the count barely moves as the model scales.**

**At frontier scale that is roughly 0.00016 percent of the training tokens.**

The trigger does not even need a user to type it. It can ride in on a web page, a PDF, a calendar invite, any untrusted content the agent reads.

## Assume the model is lying, then ask what it can reach

Since I cannot verify the weights, the audit starts from the opposite assumption. This model may be lying, so what can it actually do to us?

The frame comes from Simon Willison's lethal trifecta. Three legs, and I name each one concretely for the stack in front of me:

1. **Private data.** Repo secrets, customer records, internal source, a database credential, an authenticated internal API the agent can call.
2. **Untrusted input.** Anything the model reads that an attacker can influence: a web page, a PDF, an email body, a Jira ticket, a tool result, an MCP server's output.
3. **Egress.** Any way bytes leave: outbound HTTP, a raw DNS query, `git push`, a webhook, an email send, a Slack post.

Any agent holding all three has an exfiltration path built in. A backdoor is the ignition, the trifecta is the fuel line. Neither is dangerous alone, which is exactly why teams assemble the combination without noticing.

So the first artifact is the trifecta map: for every agent in the stack, which legs does it hold?

```yaml
# illustrative trifecta audit, one row per agent
agents:
  - name: code-assistant
    private_data: true       # repo secrets, internal source
    untrusted_input: true    # reads issue text, fetched docs
    egress: true             # runs pip install, git push
    verdict: FULL_TRIFECTA   # exfiltration path exists, fix this
  - name: doc-summarizer
    private_data: true        # customer contracts
    untrusted_input: true     # the documents themselves
    egress: false             # no network in this context
    verdict: SAFE             # third leg already cut
```

**Every agent in the stack, mapped to the exact legs it holds. Most teams have never drawn this.**

## Cut a leg on purpose

The map exists to break a leg. If an agent touches private data, it does not also get free reach to the open internet in the same context. I separate the sessions: one context reads sensitive documents with no route off the box, another browses through a proxy and never sees the data. No shared memory between them.

```yaml
# illustrative: two isolated contexts, no shared memory, no shared route out
contexts:
  private_reader:
    mounts: [/data/contracts:ro]
    network: none             # no route off the box, at all
    memory_store: session-A   # not shared
  web_browser:
    mounts: []                # never sees /data
    network: egress-proxy     # only through the allowlist proxy
    memory_store: session-B   # not shared
# a message read by private_reader cannot become an outbound request in web_browser
```

> War story. On one stack I cut the network between contexts and called it done. The two contexts still shared one vector store. Private contract chunks surfaced during a browsing task and rode out through the leg I had left open. I had cut the network and forgotten the memory layer. Isolation means every shared channel, not just the obvious one.

## Egress control is the defense that holds on the worst day

Egress control does the heavy lifting on the third leg. An agent that runs code sits behind a default-deny network policy where an outbound call to an unknown host simply fails. Not logged and reviewed later: fails, at the boundary, before the byte leaves.

```yaml
# illustrative Kubernetes NetworkPolicy: default-deny egress for the agent pod
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
            matchLabels: { app: egress-proxy }   # the one allowed next hop
      ports:
        - { protocol: TCP, port: 3128 }
    # no other rule. every other destination is dropped.
```

Everything routes through one egress proxy (Squid, or a Cilium/Envoy policy) that resolves and permits a short allowlist and nothing else. The proxy holds the host list, so DNS never reaches an arbitrary resolver.

> War story. My first egress allowlist filtered HTTP hosts and looked complete. It let CoreDNS resolve anything. The agent could still leak by resolving `<base32-of-your-token>.attacker.com`; the secret left inside the DNS query itself, no HTTP needed. DNS is egress. Block it to arbitrary resolvers or the allowlist is theater.

Tool-call allowlists follow the same logic on the action side. An explicit short menu, deny by default, no shell and no `curl`.

```python
# illustrative: tool allowlist enforced before dispatch, deny by default
ALLOWED = {
    "search_docs": lambda a: True,
    "read_file":   lambda a: a["path"].startswith("/workspace/"),
    "http_get":    lambda a: host(a["url"]) in EGRESS_ALLOW,
}

def dispatch(call):
    guard = ALLOWED.get(call.name)
    if guard is None or not guard(call.args):
        raise ToolDenied(call.name)   # no shell, no eval, no arbitrary fetch
    return TOOLS[call.name](call.args)
```

This is the layer that holds on the worst day, when the trigger has fired and the model is actively trying to exfiltrate. My opinion, stated plainly: egress control is the load-bearing defense because it is the only one that does not depend on understanding the model. Probes, prompts and evals all reason about behavior you cannot fully see. A dropped packet does not care whether the model is lying. The attempt dies at the boundary either way.

## Provenance treats every supplier as attack surface

Provenance addresses the supply chain itself. Know where your weights came from, verify them before they load, and pin the exact artifact so nobody swaps it under you.

```bash
# illustrative: verify the weights are the ones you vetted, before they load
cosign verify-blob \
  --certificate model.crt \
  --signature   model.safetensors.sig \
  model.safetensors                       # signature check via sigstore
sha256sum -c model.safetensors.sha256 || exit 1   # pin the digest, never "latest"
```

Treat every fine-tuning supplier as part of your attack surface, because a backdoor arrives baked in before your first prompt. Same discipline for data: anything the agent ingests is untrusted by default. Private data that never leaves your machine is data no backdoor can mail out.

## Probe, because absence of evidence proves nothing

The trigger is invisible by design, so a clean test run means nothing. I run behavioral canaries, contrast tests between contexts, and monitoring for tool calls that make no sense for the task. A code assistant resolving an unknown domain, or reading `/data` from the browsing context, is a signal worth an alarm.

This layer does not prove the model is clean. It buys a chance to notice. My honest position: probing is the weakest leg of the defense and I treat it that way. It is a smoke detector, not a wall. The wall is the egress boundary; the detector just tells you the trigger fired.

## What holds, and what I cannot promise

An agent behind egress control, tool allowlists and separated contexts can carry a live backdoor and still have no way to move your data out. The trigger fires, the outbound call fails, the incident is a log line instead of a breach.

The limits deserve equal honesty. None of this proves a model is clean; no known technique does, and that is precisely the finding. Containment protects the exfiltration path, not output quality: a backdoored model could still quietly degrade the work it produces, and only behavioral probes and human review touch that risk. The defenses only hold if they cover every agent. One forgotten integration holding all three legs reopens the path, and the shared vector store above is how that happens in practice.

Stop asking whether you can trust the model. Start asking what the model can reach. Trust in the weights cannot be verified, so it cannot be the foundation. Reachability can be designed, measured and enforced. I audit stacks for exactly this combination, because the teams that assembled it almost never see it.
