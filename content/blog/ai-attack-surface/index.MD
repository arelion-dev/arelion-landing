---
title: "The AI attack surface"
date: "2026-08-07T10:00:00.000Z"
description: "A read-only security audit of an AI-assisted publishing platform, days from going live. 49 findings, nine high. AI writes for it works, not for it holds, and that gap is where the holes live."
tags: ["Tech", "AI", "Security"]
private: true
---

A media company was days from pointing production traffic at a publishing platform it had rebuilt fast, with an AI in the loop, and that nobody had read with hostile eyes. I did the read. Four layers, five days, one report the client handed straight to their own team.

**49 findings, 9 high, 19 medium, 21 low. Every high verified twice. Zero shipped on a hunch.**

The audit was read-only from start to finish. I change nothing, I break nothing, the team keeps shipping while I work. I read the shipped artifact the way an attacker reads it, not the way the author read the ticket, across four layers: application code, cloud IAM, CI pipelines, infrastructure. I call it the four-layer read, and the point of it is below.

## A scanner and a self-review both miss the same holes

An automated scanner pokes the running site. It never sees build config, git history or cloud permissions, which is exactly where the worst of this stack turned out to live.

Self-review fails differently. An AI writes for "works": the feature on screen, the endpoint answering, the deploy green. Safe rarely shows up in a demo, so nobody asks for it. The reviewer sees it works, "the AI wrote it" quietly becomes "it is fine", and the auth gate a careful engineer would have stopped on ships the same afternoon. Multiply that across a rebuild and you get a platform that passes every functional test and still leaks.

## The holes are a family, not an accident

Each high finding is a class that AI-assisted teams reproduce, because the tool and the incentive push the same way.

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

**A secret in git history is burned the moment it lands, not the moment you find it.**

**Committed credentials.** I scan the full git history, not just current files, because git forgets nothing. A live database password had been committed to a config file, then deleted in a later commit. It still lives forever in history, retrievable by anyone who ever clones the repo.

**Log-only firewall.** A web application firewall was attached but left in log-only mode, watching attacks without blocking them. The cost of protection paid, the protection off.

**One outside account held full owner on the production cloud project.** A single compromised mailbox, or one relationship gone sour, away from total takeover.

Alongside these: an unauthenticated GraphQL endpoint returning unpublished drafts to anyone who guessed an id, public storage buckets allowing anonymous listing, secrets baked into container image layers, and the main service running as root in its container.

## Every high was verified twice before it went in the report

Each high finding was reproduced a second time, independently, before it earned a line. That discipline is the difference between a report the client can hand to their own team without me in the room, and a list of maybes that gets argued away in the first meeting.

**9 highs, all fixable in days, not one a rebuild.** Rename the variables so the framework stops inlining them, then rotate the exposed key. Verify a real signed identity inside the admin handler instead of a cookie's presence. Rotate the committed password and purge it from history. Scope the cloud owner role down to one internal account. Flip the firewall out of log-only.

I also wrote down what was already solid, so the team knew what to keep and did not undo good work while patching the rest.

> Honest limit. The four-layer read is a point-in-time read of source, config and permissions. It proves a hole exists in what shipped; it does not prove exploitation in production, and it goes stale on the next deploy. It replaces a first serious audit, not a running detection stack. I said so in the report, in those words.

## Who has this

Any team shipping with an AI in the loop where nobody is specifically hunting for these patterns almost certainly has some right now, passing every test, green in every pipeline. Same reading, same layers, different stack, same families of holes. They surface when someone reads the shipped product the way an attacker would, before the attacker does. That reading is the whole job, and it is the one thing the AI that wrote the code will not do for you.
