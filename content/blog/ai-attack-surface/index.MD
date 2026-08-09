---
title: "The AI attack surface"
date: "2026-03-26T09:50:00.000Z"
description: "A read-only security audit of an AI-assisted publishing platform, days from going live. 49 findings, nine high. AI writes for it works. It doesn't write for it holds, and that's where the holes live."
tags: ["Tech", "AI", "Security"]
private: true
---

A media company was days from pointing production traffic at a publishing platform it had rebuilt fast, an AI in the loop the whole way. Nobody had read it with hostile eyes yet. So I did: four layers over five days, and one report the client handed straight to their own team.

**49 findings, 9 high, 19 medium, 21 low. Every high verified twice. Zero shipped on a hunch.**

The whole audit stayed read-only. I cloned the repo and read it, grepped it, traced calls through it, and touched nothing: no deploy, no write, the team kept shipping while I worked. Then I read the shipped artifact the way an attacker would, across four layers: application code, cloud IAM, CI pipelines, and infrastructure. I call it the four-layer read. What it catches that a scanner can't is the rest of this post.

## A scanner and a self-review both miss the same holes

An automated scanner (ZAP, Burp, a Nuclei run in CI) pokes the running site over HTTP and reads the responses that come back. It never sees the build config that decides which env vars ship to the browser, the git history still holding a deleted password, or the cloud IAM policy that hands an outsider `roles/owner`. That's exactly where the worst of this stack turned out to live. A DAST pass here would have come back clean while the owner role sat there untouched.

Self-review fails differently, and it fails the same way every time. An AI writes for "works": the feature renders, the endpoint answers 200, the deploy goes green. Safe almost never shows up in a demo, so nobody asks the model for it, and the model won't volunteer it.

Then the reviewer sees it works, "the AI wrote it" quietly becomes "it's fine", and the auth gate a careful engineer would have stopped on ships that same afternoon. The model optimizes for the acceptance criteria in the prompt, and "an attacker can't forge this cookie" is never one of them. Multiply that across a full rebuild and you get a platform that passes every functional test and leaks anyway.

## Public prefixes inline your secrets into every visitor's browser

Modern front-end frameworks decide what reaches the client by a naming convention. Any env var prefixed `NEXT_PUBLIC_`, `VITE_`, `PUBLIC_` or `REACT_APP_` gets string-replaced into the JavaScript bundle at build time. That's the intended behavior, meant for analytics ids and public API endpoints.

Here the prefix sat on secrets. An AES key and IV that signed preview tokens, plus a bearer token for the content API, all named with a public prefix and all inlined into the bundle every anonymous visitor downloads.

```dotenv
# representative, not client source
NEXT_PUBLIC_PREVIEW_SIGNING_KEY=8f3a...aes-256-key
NEXT_PUBLIC_PREVIEW_IV=1a2b...16-byte-iv
NEXT_PUBLIC_CONTENT_API_TOKEN=Bearer eyJ...
```

At build the framework does a literal substitution, so the bundle ends up carrying the key verbatim:

```js
// what ends up in the shipped chunk, greppable in devtools
const signPreview = (id) =>
  aesSign(id, "8f3a...aes-256-key", "1a2b...16-byte-iv");
```

This is the single most AI-reproducible bug in the whole report. Ask a model to "expose the signing key to the preview component" and a public prefix is the shortest path to a green build. It works in the demo, hands every visitor the signing key in production, and stays invisible until someone runs `grep -r "aes" .next/static`.

A secret manager won't save you here, because the leak happens at build time, before any runtime lookup runs. Drop the prefix so the value stays server-side, move signing behind an API route, then rotate the key. It's already public.

## A cookie that says `admin_auth=true` is not authentication

An admin API that could rewrite the homepage and purge the CDN cache sat behind a single check: a cookie named `admin_auth`, which the login page set, in the browser, to the string `"true"`.

```js
// representative middleware, not client source
export function requireAdmin(req, res, next) {
  if (req.cookies.admin_auth === "true") return next(); // decoration, not auth
  return res.status(401).end();
}
```

That's a sign reading "authorized personnel only". It stops nobody. Anyone can send the cookie by hand:

```bash
curl -X POST https://target/api/admin/purge-cache \
  -H "Cookie: admin_auth=true"
# 200 OK
```

Real auth verifies a signed session the server issues and the client can't forge: a JWT checked against a server-held secret, or a session id looked up server-side. The one property that matters is unforgeability, and a presence check has none of it.

```js
// what it should be
const claims = verifyJwt(req.cookies.session, process.env.SESSION_SECRET);
if (!claims || claims.role !== ROLE_ADMIN) return res.status(403).end();
```

An AI produces presence-check auth constantly, because "gate the admin page behind login" and "check that the admin cookie is set" satisfy the same prompt, and the second is fewer lines. The model has no concept of a threat actor sending the request directly, so it writes the client and the server as if they were one trusted machine. They aren't.

## A secret in git history is burned the moment it lands

Scanning current files isn't enough, because `git` forgets nothing. I ran history scanning across every commit and every branch (`gitleaks detect`, cross-checked with `git log -p -S` for the specific patterns) and found a live database password committed in a config file, then deleted three commits later.

```bash
gitleaks detect --source . --log-opts="--all"
# ...
# Secret:  Postgres URI with password
# File:    config/database.yml
# Commit:  c0ffee1  (deleted in a1b2c3d, still reachable)
```

The delete commit makes it invisible in the working tree and does nothing to the exposure. The value sits in the packfile forever, and anyone who ever cloned the repo already has it: every CI runner, every contractor laptop.

```bash
git show c0ffee1:config/database.yml | grep -i pass
# password: pr0d-db-actual-password
```

Here's the part people resist: you rotate a committed secret, you don't "remove" it. Rewriting history with `git filter-repo` cleans the origin, and it can't recall the clones. Treat every credential that ever touched a commit as public.

AI-assisted work makes this more common. A model will happily paste a working connection string into a config file to make the local run succeed, and the human reviewing the diff sees a plausible config and misses the leak.

## A firewall in log-only mode is a smoke detector with the buzzer unplugged

A web application firewall was attached to the load balancer and left in log-only (detection) mode. It watched SQL injection and path traversal go by, wrote them to a log, and blocked none of it.

```hcl
# representative Terraform, not client source
resource "google_compute_security_policy" "waf" {
  rule {
    action = "preview"   # log-only: matches, records, does not block
    match { expr { expression = "evaluatePreconfiguredExpr('sqli-stable')" } }
  }
}
```

Every managed WAF ships this mode so you can tune rules without breaking real traffic. The trap is that it looks identical to a live WAF in the console: rules attached, matches counting up in the dashboard. The `preview` action (or AWS `COUNT`) is the only difference, and it's one word. The team paid for protection and shipped with it switched off. Fix: flip `preview` to `deny` (or `COUNT` to `BLOCK`), a one-word change once you know to look.

## One outside account should never hold `roles/owner` on production

Reading the cloud IAM policy, I found one account outside the company holding `roles/owner` on the production project. Owner is total: read every secret, delete every resource, add and remove other members, and disable the audit logs on the way out.

```bash
gcloud projects get-iam-policy prod-project --format=json | \
  jq '.bindings[] | select(.role=="roles/owner")'
# {
#   "role": "roles/owner",
#   "members": ["user:contractor@some-agency.example"]
# }
```

One compromised mailbox, or one relationship gone sour, is a single step from total takeover. The fix is least privilege: scope that account to exactly the roles it uses (say `roles/run.developer` plus `roles/artifactregistry.writer`), keep `roles/owner` on one internal, audited identity, and prefer short-lived service accounts over standing human owners.

Over-scoped IAM is a "make it work now" bug, and AI-assisted teams hit it harder, because the model setting up the deploy will cheerfully suggest `roles/owner` to get past a permission error. Fastest way to a green deploy, widest possible blast radius.

## Four more holes that a functional test cannot see

Alongside the six above: an unauthenticated GraphQL endpoint that returned unpublished drafts to anyone who guessed a numeric id, public storage buckets that allowed anonymous object listing, secrets baked into container image layers (visible with `docker history`, so the runtime env var is beside the point), and the main service running as root inside its container. Every one has the same shape: it works in the demo, and it's a hole in production.

## Every high was verified twice before it went in the report

Each high finding got reproduced a second time, independently, before it earned a line: grep the bundle, send the raw curl, read the packfile, dump the IAM policy. That discipline is the difference between a report the client hands to their own team without me in the room and a list of maybes that gets argued away in the first meeting.

**9 highs, all fixable in days, not one a rebuild.** Rename the public-prefixed vars and rotate the exposed key. Verify a signed identity inside the admin handler instead of a cookie's presence. Rotate the committed password and purge it from history. Scope the cloud owner role down to one internal account. Flip the firewall out of log-only. None of this needs new architecture; it needs someone to have looked.

I also wrote down what was already solid, so the team knew what to keep and didn't undo good work while patching the rest.

> Honest limit. The four-layer read is a point-in-time read of source, config and permissions. It proves a hole exists in what shipped; it does not prove exploitation in production, and it goes stale on the next deploy. It replaces a first serious audit. It is not a running detection stack. I said so in the report, in those words.

## Who has this

Any team shipping with an AI in the loop, where nobody is specifically hunting for these patterns, almost certainly has some of them right now, passing every test, green in every pipeline. Same reading, same four layers, a different stack, the same families of holes. They surface when someone reads the shipped product the way an attacker would, before the attacker does. That reading is the whole job, and it's the one thing the AI that wrote the code won't do for you.
