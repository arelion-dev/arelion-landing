---
title: "Sleeper agents: the backdoor in the weights"
date: "2026-08-07T10:00:00.000Z"
description: "You deploy models you did not train. They can carry a hidden backdoor that safety training does not remove. The fix is controlling what the model can reach, not trusting the weights."
tags: ["AI", "Security", "Business"]
private: true
---

You deploy models you did not train. An API from a provider, a fine-tune from a supplier, open weights from a hub. Almost everyone does.

Any of them can carry a hidden trigger: a specific phrase, meaningless to a human, buried during training. On that trigger, a well-behaved assistant flips into a tool that reads your private data and sends it out. The rest of the time it looks perfect.

You cannot test this away. Public research from Anthropic (2024) showed the backdoor survives the full safety process. A 2025 study found that around 250 poisoned documents are enough to plant one, whatever the model's size. Cheap to plant, hard to detect, and safety training can even hide it better.

So trusting the weights is not a foundation you can build on. You cannot prove they are clean, and no known technique can.

The fix is a different question. Not "can I trust this model?" but "what can this model actually reach?" You control what it can see and where it can send data. A model behind those controls can carry a live backdoor and still have no way to move your data out. The trigger fires, the outbound call fails, the incident is a log line instead of a breach.

If you give a third-party model access to customer data or internal documents, this is a hole worth checking. Want me to look at your setup, in writing?
