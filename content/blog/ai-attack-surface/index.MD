---
title: "The AI attack surface"
date: "2026-08-07T10:00:00.000Z"
description: "A read-only security audit of an AI-assisted publishing platform, days from going live. 49 findings, nine high. AI writes for it works, not for it holds, and that gap is where the holes live."
tags: ["Tech", "AI", "Security"]
private: true
---

A media company was days from pointing production traffic at a publishing platform it had rebuilt fast, with an AI in the loop, and never seriously audited. The question behind the engagement was the one every board eventually asks: are we exposed, and how badly?

The audit was read-only from start to finish. I change nothing, I break nothing, the team keeps shipping while I work. I read the shipped artifact the way an attacker reads it, not the way the author read the ticket, across four layers: application code, cloud IAM, CI pipelines, infrastructure.

## Why a scanner and a self-review both miss it

An automated scanner pokes the running site. It misses everything that lives in build config, git history and cloud permissions, which is exactly where the worst of this stack turned out to be.

Self-review fails differently. An AI writes for "works": the feature on screen, the endpoint answering, the deploy green. Safe rarely shows up in a demo, so nobody asks for it. The reviewer sees it works, "the AI wrote it" quietly becomes "it is fine", and the auth gate a careful engineer would have stopped on ships the same afternoon. Multiply that across a rebuild and you get a platform that passes every functional test and still leaks.

## The finding classes

The holes were not random. Each is a class that AI-assisted teams reproduce, because the tool and the incentive push the same way.

**Public-var secret inlining.** Modern frameworks inline any env var with a public prefix into the JavaScript sent to every visitor. Fine for an analytics id. Here the prefix sat on the AES key and IV signing preview tokens, plus a bearer token for the content API. A secret manager changes nothing, because the leak happens at build time, before any runtime lookup.

```text
# generic anti-pattern, not client code
PUBLIC_TOKEN_SIGNING_KEY=<aes-key>   # <- "PUBLIC" => inlined into bundle
```

**Presence-check-as-auth.** An admin API that could rewrite the homepage and purge caches. The only thing in front of it was a check for a cookie named `admin_auth`, which the login page set, in the browser, to the string `"true"`. Anyone can type that header by hand.

```text
# generic anti-pattern
if request.cookies.get("admin_auth") == "true":  # decoration, not auth
    allow_admin()
```

Real auth verifies a signed session the server can validate and the client cannot forge. A presence check verifies nothing.

**Committed credentials.** I scan the full git history, not just current files, because git forgets nothing. A live database password had been committed to a config file, then deleted in a later commit. It still lives forever in history, retrievable by anyone who ever clones the repo. A committed secret is a burned secret.

**Log-only firewall.** A web application firewall was attached but left in log-only mode, watching attacks without blocking them. The cost of protection paid, the protection off.

**Over-scoped cloud account.** One account outside the company held full owner on the production cloud project. A single compromised mailbox, or one relationship gone sour, away from total takeover.

Alongside these: an unauthenticated GraphQL endpoint returning unpublished drafts to anyone who guessed an id, public storage buckets allowing anonymous listing, secrets baked into container image layers, and the main service running as root in its container.

## Verify before you report

Each high finding was independently verified a second time before it went into the report, so nothing shipped on a hunch. That discipline is the difference between a report the client can hand to their own team without me in the room, and a list of maybes that gets argued away.

## The counts

The report ranks every finding by severity, with reproducible evidence, the concrete fix, and hardening past the immediate holes.

- 49 findings total
- 9 high
- 19 medium
- 21 low

## The fixes are days, not a rebuild

None of the nine required rearchitecting. Rename the variables so the framework stops inlining them, then rotate the exposed key. Verify a real signed identity inside the admin handler instead of a cookie's presence. Rotate the committed password and purge it from history. Scope the cloud owner role down to one internal account. Flip the firewall out of log-only.

I also wrote down what was already solid, so the team knew what to keep and did not undo good work while patching the rest.

## Who has this

Any team shipping with an AI in the loop where nobody is specifically hunting for these patterns almost certainly has some right now, passing every test, green in every pipeline. Same reading, same layers, different stack, same families of holes. They surface when someone reads the shipped product the way an attacker would, before the attacker does. That reading is the whole job, and it is the one thing the AI that wrote the code will not do for you.
