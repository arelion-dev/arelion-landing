---
title: "A festival of holes: what one real audit found under the AI"
description: "AI-assisted development ships a new attack surface: secrets committed, secrets pushed to the browser, an admin gate you bypass with a cookie set to the string true. Here is an anonymized tour of one real security audit that turned into a festival of findings."
date: 2026-07-06
tags: ["security", "audit", "ai-assisted-development", "attack-surface", "appsec"]
pillar: "Audit"
stack: ["Security audit", "Cloud IAM review", "Secrets scanning", "Static analysis", "Threat modeling"]
lang: "en"
---

## The problem

AI writes code faster than anyone reviews it. That is the whole problem, in one sentence.

A model ships a working feature in one prompt: a route, a bucket, a background job, an integration. It compiles, it passes the smoke test, it merges. What it never does is stop and ask whether that bucket should be public, whether that key belongs in the repo, or whether the pattern it just reproduced ten thousand times was a good one or merely a common one. Those are different questions. The model is not optimizing for the second.

The dangerous part is not the code. It is the sentence "the AI wrote it," which quietly reads as "so it is fine." A junior's pull request gets scrutiny. A model's output gets a glance and a merge, because it is fluent and there is a lot of it. Fluency is not safety. Confidence is not correctness.

## What I do

I run a focused security audit: a real map of the attack surface, not a scanner's checklist. What is exposed, what holds secrets, what talks to what, and where trust is assumed instead of enforced. A technical pass over the repos, the cloud IAM, the storage, the public endpoints, the dependency tree, the git history. Then the part most audits skip: how code actually ships, and where secrets are supposed to live versus where they end up. The holes live in that gap.

What follows is anonymized from one real engagement for a media company. Every finding is real. Only the identifiers are gone.

## What I found (the festival)

It was a festival. Not one hole, a whole season of them. A sample, dramatized in wording only:

**A stranger owned the cloud.** The production project had two owner accounts. One was the company's. The other was a Google account on a different company's domain, holding unconditional full ownership: read everything, mint keys, delete the database, switch off the audit logs. Nobody could say why it was still there.

**The crypto key shipped to every visitor.** The frontend framework inlines any variable prefixed `NEXT_PUBLIC_` straight into the JavaScript sent to every browser. Someone named the AES key, its IV, and a CMS bearer token with that prefix. The secret that signed preview tokens was sitting in the public bundle, one "view source" away.

**Admin access was a cookie set to the string "true".** The gate on the content API was one line: does the request carry a cookie called `admin_auth`? Not is it signed, not does it map to a session. Just, is it present. `Cookie: admin_auth=whatever` let you rewrite the public homepage and purge caches, while the audit log dutifully recorded whatever email you put in a second cookie. The comment, still in the code: "Simple cookie check instead of JWT token."

**A live database password, committed forever.** A build config carried a full connection string, user and password in cleartext: `mongodb+srv://appuser:S3cr3tPass@cluster0.ab12cd.mongodb.net`. Rotating the visible line changes nothing. It lives in every clone and every fork of the history.

**Unpublished stories, readable by anyone.** The public read API guarded its list endpoint but not its single-item one. Guess a numeric id and you pulled draft and embargoed articles before they were meant to exist.

**Every build robot could read every secret.** One broad grant let the deploy account, both build accounts, and the default compute account read every secret in the project: database password, mail key, OAuth secret, the multi-year TLS private key. The justifying comment: "per-secret bindings would be a maintenance burden."

**A firewall that logged and never blocked.** A web application firewall sat at the edge with rules for injection, cross-site scripting, and login brute-force. Every rule was in preview mode: evaluated, logged, never enforced. The only live rule was "allow everything."

And the supporting cast: the production database password in cleartext in a local infrastructure-state file, two object-storage buckets anyone could list end to end, roughly two dozen secrets baked into the container image layers, the main service running as root, and a lockfile pinned to a version of a popular library that the public registry has never published.

## Why this keeps happening

Some of these are the modern attack surface, not the AI: a stranger with owner rights, a firewall in log-only mode, an over-broad access grant. Boring, catalogued failures that were always there, and a real audit finds them whether a model was involved or not.

But look at the top of the list. Hardcode a secret, because the shortest working example is a literal value inline, not a reference to a secrets manager the model cannot see. Push it to the client, because a framework prefix is one autocomplete away and nothing screams. Gate an admin API on a cookie's presence, because that is the common pattern in the training corpus, not the correct one. The model reproduces the common pattern, confidently, across many files. And confidence is the multiplier: insecure code that reads like a senior wrote it gets waved through. The review step, the one control that caught this class, is the step the workflow quietly removed.

## How we fixed it

Every finding shipped with a concrete fix, ranked by real exploitability and blast radius, not by a scanner's label. Rotate the committed and browser-exposed secrets and purge them from history. Move server secrets back off the client bundle. Replace the cookie check with a real, signed session. Add the missing guard on the read path. Scope the secret grants per-account and per-secret, and downgrade the external owner. Flip the firewall out of preview so it actually blocks. The report closes with a hardening plan, so the same class does not grow back after I leave.

## Reusable

If your team ships with AI and nobody is specifically hunting for leaked credentials, client-exposed secrets, guessable auth, and controls left switched off, you have some of these right now. Not maybe. The workflow that produces them is the one you are already running.

This class is findable and fixable, and it does not require slowing the team down. It just needs someone whose job is to assume the generated code is confident and wrong until proven otherwise. If that is useful, I do it in writing, on a defined scope, with a report you can act on.
