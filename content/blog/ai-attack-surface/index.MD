---
title: "The AI attack surface"
date: "2026-10-11T09:50:00.000Z"
description: "A read-only security audit of an AI-built web platform before it took production traffic: 49 findings, nine of them high, each high verified twice. What I read, what I found, and how each one gets fixed."
tags: ["Tech", "AI", "Security"]
private: true
---

I audited an AI-built web platform before it took production traffic. The audit took five days and was read-only. I found 49 issues, nine of them high severity, and I reproduced each of the nine a second time before writing it down. The client passed the report to their own team.

**49 findings: 9 high, 19 medium, 21 low. Each high finding was verified twice.**

> Note. This audit took place earlier, and the nine high findings below are fixed today. The code samples are representative: I made up the names, paths and values.

Read-only means I cloned the repository and read it. I searched it, followed calls through the code, and changed nothing: no deploy, no write. The team kept shipping while I worked. I looked at four layers: the application code, the cloud permissions (IAM), the CI pipelines and the infrastructure. A scanner would not have found most of what I found there.

## What a scanner and a self-review both miss

An automated scanner such as ZAP, Burp or Nuclei sends HTTP requests to the running site and reads the responses. It does not see the build configuration that decides which environment variables are sent to the browser. It does not see a password that was deleted from the files and is still in the git history, or a cloud permission that gives an outside account `roles/owner`. On this platform, the worst problems were in those places. A scan of the running site would have reported nothing about them.

Self-review misses them for another reason. A model writes code to make the feature work: the page renders and the deploy passes. Safety does not show in a demo, so nobody asks the model for it, and the model does not raise it.

The reviewer then sees that the feature works and approves it. The model worked from the acceptance criteria in the prompt, and "an attacker cannot forge this cookie" was not one of them. Across a whole codebase, the result is a platform that passes its functional tests and still leaks.

## Secrets with a public prefix end up in the browser

Front-end frameworks use a naming rule to decide what reaches the browser. An environment variable whose name starts with `NEXT_PUBLIC_`, `VITE_`, `PUBLIC_` or `REACT_APP_` is copied into the JavaScript bundle at build time. This is by design, for values such as analytics ids and public API addresses.

On this platform, three secrets had a public prefix: an AES key and its IV, used to sign access tokens, and a bearer token for an internal API. All three were copied into the bundle that every visitor downloads.

```dotenv
# representative; not client source
PUBLIC_TOKEN_SIGNING_KEY=8f3a...aes-256-key
PUBLIC_TOKEN_SIGNING_IV=1a2b...16-byte-iv
PUBLIC_INTERNAL_API_TOKEN=Bearer eyJ...
```

At build time the framework replaces each variable with its value, so the key appears as plain text in the bundle:

```js
// representative; what ends up in the shipped chunk, greppable in devtools
const signToken = (id) =>
  aesSign(id, "8f3a...aes-256-key", "1a2b...16-byte-iv");
```

Of all the findings, this is the one a model reproduces most easily. If you ask it to "expose the signing key to the front-end component", adding a public prefix is the shortest way to a passing build. The demo works, and in production every visitor receives the signing key. Nobody notices until someone runs `grep -r "aes"` on the build output.

A secret manager does not help, because the value is copied at build time, before any runtime lookup. The fix is to remove the prefix so the value stays on the server, move the signing behind an API route, and rotate the key, since it has already been public.

## An admin API protected by a cookie anyone can set

An admin API could change what the public site shows. It had one check: a cookie, called `is_admin` here, which the login page set in the browser to the string `"true"`.

```js
// representative middleware; not client source
export function requireAdmin(req, res, next) {
  if (req.cookies.is_admin === "true") return next(); // only checks that the cookie is there
  return res.status(401).end();
}
```

Anyone can send that cookie by hand:

```bash
# representative request; the host and path are made up
curl -X POST https://app.example/api/admin/some-action \
  -H "Cookie: is_admin=true"
# 200 OK
```

Authentication has to rely on something the client cannot forge: a session token signed with a secret that only the server holds, or a session id that the server looks up. A check that a cookie is present gives no such guarantee.

```js
// what it should be (representative)
const claims = verifyJwt(req.cookies.session, process.env.SESSION_SECRET);
if (!claims || claims.role !== ROLE_ADMIN) return res.status(403).end();
```

Models write this kind of check often. "Gate the admin page behind login" and "check that the admin cookie is set" answer the same prompt, and the second takes fewer lines. The generated code treats the browser and the server as one trusted machine, and does not account for someone who sends the request directly.

## A password deleted from the files, still in git history

Scanning the current files does not find this one, because git keeps every version. I scanned every commit on every branch with `gitleaks detect`, and checked the results with `git log -p -S` for specific patterns. A live database password had been committed in a config file, then deleted in a later commit.

```bash
# representative output; the file, commits and value are made up
gitleaks detect --source . --log-opts="--all"
# ...
# Secret:  database URI with password
# File:    config/database.yml
# Commit:  c0ffee1  (deleted in a1b2c3d, still reachable)
```

The delete commit removes the password from the working files. It does not remove the exposure: the value stays in the history, and everyone who has cloned the repository has a copy, including CI runners and contractor laptops.

```bash
# representative; same made-up commit and file
git show c0ffee1:config/database.yml | grep -i pass
# password: pr0d-db-actual-password
```

The fix is to rotate the password. Removing it from the history with `git filter-repo` cleans the remote repository, but it cannot reach the copies that already exist. Any credential that has been in a commit should be treated as public.

AI-assisted work makes this more frequent. A model will paste a working connection string into a config file so that the local run succeeds, and the person reviewing the diff sees a normal-looking config.

## A firewall left in log-only mode

A web application firewall was attached to the load balancer in log-only (detection) mode. It recorded SQL injection and path traversal attempts and blocked none of them.

```hcl
# representative Terraform; not client source
resource "google_compute_security_policy" "waf" {
  rule {
    action = "preview"   # log-only: matches, records, does not block
    match { expr { expression = "evaluatePreconfiguredExpr('sqli-stable')" } }
  }
}
```

Managed firewalls have this mode so that rules can be tuned without breaking real traffic. In the console it looks the same as an active firewall: the rules are attached and the match counters go up. The only difference is the action, `preview` here, or `COUNT` on AWS. The fix is to change `preview` to `deny`, or `COUNT` to `BLOCK`.

## An outside account with the owner role on production

In the cloud IAM policy, one account from outside the company had `roles/owner` on the production project. An owner can read every secret, delete every resource, add and remove members, and turn off the audit logs.

```bash
# representative; the project and account are made up
gcloud projects get-iam-policy prod-project --format=json | \
  jq '.bindings[] | select(.role=="roles/owner")'
# {
#   "role": "roles/owner",
#   "members": ["user:someone@outside-company.example"]
# }
```

If that mailbox is compromised, or if the relationship ends badly, the whole project is exposed. The fix is least privilege: give that account only the roles it uses (for example one deploy role and one registry role), keep `roles/owner` on one internal, audited identity, and prefer short-lived service accounts to permanent human owners.

Permissions that are too wide usually come from making a deploy work quickly. With a model in the loop it happens more often, because the model that sets up the deploy will suggest `roles/owner` to get past a permission error.

## Four more high findings

Alongside the five above: an API endpoint without authentication that returned non-public records to anyone who guessed a numeric id, public storage buckets that let anyone list their contents, secrets stored in container image layers (where `docker history` shows them, whatever the runtime configuration says), and the main service running as root inside its container. None of them breaks a functional test.

<!-- offer -->

## How I verified the high findings

I reproduced each high finding a second time, independently, before adding it to the report: I searched the bundle, sent the request with curl, read the git history, or exported the IAM policy. The client could then give the report to their own team without me there to defend each line.

**The nine high findings could each be fixed in days, without a rebuild.** Rename the variables with a public prefix and rotate the exposed key. Check a signed identity in the admin handler. Rotate the committed password and remove it from the history. Reduce the owner role to one internal account. Switch the firewall to blocking mode.

I also listed what was already done well, so the team knew what to keep while fixing the rest.

> Limit. This audit reads source code, configuration and permissions at one point in time. It shows that a weakness exists in what was shipped. It does not show that anyone exploited it, and it is out of date after the next deploy. It works as a first serious audit and does not replace continuous monitoring. The report said so.

## Who this applies to

A team that ships with AI in the loop, and where nobody looks for these patterns, probably has some of them, with every test passing. I use the same four layers on other stacks and find the same kinds of problems. They show up when someone reads what was shipped the way an attacker would.
