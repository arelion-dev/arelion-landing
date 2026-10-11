---
title: "Claude Code security review, tested on a vulnerable app"
date: "2026-10-11T11:00:00.000Z"
description: "I ran Claude Code's /security-review command three times on a Node.js app with 19 documented vulnerabilities. It reported 10 in every run and 12 in its best run, with no false positives."
tags: ["Tech", "AI", "Security"]
private: true
---

I ran `/security-review`, the security review command built into Claude Code, three times on DVNA, an open-source Node.js application written to be vulnerable. The project's guide documents 19 vulnerabilities. The command reported 10 of them in all three runs and 12 in the best one; 7 were never reported as a finding. All 29 of its findings matched a documented vulnerability by my own matching, so there were no false positives. I used Claude Code 2.1.294 with the Claude Opus 5.5 model on 11 October 2026. These numbers come from one teaching application and three runs.

## What Claude Code's security review is, and what I did not test

`/security-review` has come with Claude Code [since August 2025](https://www.anthropic.com/news/automate-security-reviews-with-claude-code). It reads the changes on the current git branch and writes one report of likely vulnerabilities, each with a file, a line, an exploit scenario and a fix.

[Claude Security](https://claude.com/product/claude-security) is a separate Anthropic product: a scanner hosted by Anthropic that covers whole repositories and proposes patches. It was in public beta for Claude Enterprise customers when I ran this test. I don't have that plan, so I didn't test it. I also left out Claude Security's plugin for Claude Code and the GitHub Action that runs the security review on pull requests, so the results are for the built-in command only.

## How I set up the test

[DVNA](https://github.com/appsecco/dvna) (Damn Vulnerable NodeJS Application, by Appsecco) is a small Express application that comes with a guide to its own flaws. I used one fixed commit and took the 19 vulnerability headings of that guide as my list of flaws to find. It names every flaw, as do the in-app lesson pages, so I removed both, along with third-party assets such as jQuery. That left 42 files, mostly server code, templates and configuration.

The command reviews a branch, so I created a git repository in which the whole application is one new commit. I ran it three times in a row on the default model and effort level of a paid plan, with none of my personal settings and with read-only permissions, which refused one shell command in run 3. I never installed or started the application. I matched each finding to the guide by hand, with a written reason for each match, and a script did the counting.

The command works in two steps: a first sub-task lists candidate vulnerabilities, then a separate sub-task checks each one and gives it a confidence score from 1 to 10. Anything scored under 8 is left out.

The prompt, which I copied out of the Claude Code binary, also tells the model to leave out some classes of problem. By my reading, it excludes or discourages 4 of the 19 documented vulnerabilities: the `X-Powered-By` header, the outdated `mathjs` library, the missing audit logging and the open redirect. It says nothing against the other 15.

## What it found in every run

| | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Findings in the report | 9 | 9 | 11 |
| Documented vulnerabilities found, of 19 | 10 | 10 | 12 |
| Findings that match nothing in the guide | 0 | 0 | 0 |
| Time | 4 min 52 s | 6 min 12 s | 6 min 32 s |
| Cost, Claude Code's estimate at API list prices | $2.67 | $3.01 | $3.53 |

Ten documented vulnerabilities were in all three reports:

- SQL injection in the user search
- command injection in the ping page
- a password reset token that is the MD5 hash of the login name
- an XML parser that loads external entities
- deserialization of an uploaded file with a library that can execute what it reads
- a profile form that lets any user change another user's password
- an admin API that any logged-in user can call
- password hashes returned in that API's response
- stored XSS in the product list
- DOM XSS in the user list

One finding covers both admin API items, which is why 9 findings count as 10 vulnerabilities.

I checked the 29 locations that the reports cite: 26 are the flawed line itself, 2 are the first line of the flawed statement and 1 is the first line of the flawed function.

## What it did not report in any run

Seven documented vulnerabilities were never reported as a finding. A flaw that a report names only in a recommendation or in a list of rejected items doesn't count as reported.

Three of the seven appear nowhere in the written output of the runs, as far as my search shows: the SQL queries that the database library prints to the console, the `X-Powered-By` response header and the absence of audit logging. For the fourth, the stack trace that the calculator page sends on bad input, sub-tasks in runs 1 and 3 only noted that the calculator doesn't catch errors.

The other three were noticed and left out. In each run a sub-task named the hard-coded session secret (`'keyboard cat'`) and argued that it only signs a session id stored on the server, so someone who knows the secret still can't forge a session. Sub-tasks also treated the missing CSRF protection as a hardening gap or a browser-dependent risk. They rated the open redirect as low impact, which is how the prompt describes that class. Only run 3's report lists what was filtered out. The list has two items, the open redirect and this one:

> Missing CSRF protection on state-changing POSTs (`server.js`, no `csurf` mounted): confidence 7/10, below the threshold. It is real but browser-dependent, and arguably a hardening gap.

Runs 1 and 2 have no such list, so their reports don't show what was examined and left out.

## How much the three runs differed

Runs 1 and 2 reported the same 9 findings. Run 3 had those 9 and 2 more: a reflected XSS in the product search, and code execution through `mathjs`. The application requires one exact version of that library, which has a known flaw, and the calculator passes user input to it.

The first step listed both candidates in all three runs, but the rating step gave them different scores:

| Candidate | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Reflected XSS | 7, left out | 7, left out | 8, reported |
| `mathjs` code execution | 2, left out | 3, left out | 8, reported |

The XSS was one point under the threshold of 8 in two runs. For `mathjs`, the three rating sub-tasks judged the flaw real or very likely real. Two of them applied the prompt's exclusion for outdated libraries, and the third kept the finding because the application's own code passes user input to an evaluator. The brief that the main conversation writes for each rating sub-task changed too: only run 1's said to "be strict in applying the exclusion".

In run 1 only, a safety classifier stopped one sub-task's answer while it was describing the deserialization exploit. Claude Code ran that request again on Claude Opus 4.8, which kept the finding.

## How I would use it on a team that merges AI-written code

On such a team I'd run the command on every branch before a person reviews the change. I was on a subscription, but by Claude Code's estimate each run here cost about $3 and took about five to seven minutes, for a diff of 2,585 lines.

The reports didn't list the missing CSRF protection or the hard-coded session secret as findings, so I'd keep a check of secrets and HTTP headers in addition to the command, and a dependency scanner. Anthropic's [support page](https://support.claude.com/en/articles/11932705-automated-security-reviews-in-claude-code) lists dependency vulnerabilities among the things these reviews check, but the prompt in this version excludes outdated libraries, and two of my three runs left `mathjs` out for that reason. The same page says the reviews don't replace existing security practices and manual code review.

The command reads the changes on one branch. The cloud permissions and the git history are outside those changes, and in [an audit I did on an AI-built platform](/case-studies/ai-attack-surface/), high findings came from both.

Two documented vulnerabilities were reported in only one of the three runs, so for an important change I'd run the command two or three times and read every report, including the list of what it filtered out when there is one. In run 3 that list named two of the documented vulnerabilities.

## Limits of this test

- A teaching application is easier than a real codebase. DVNA is small, each flaw is a few lines in one file, and most request handlers have one, which leaves few chances for a false positive.
- The model may know DVNA from its training data: the project's first commit dates from 2017, and its name was still in `package.json`, the README and the templates. The written output of all three runs shows that the model noticed what the application is.
- Matching findings to the guide is partly my judgment, and so is my reading of what the prompt excludes.
- Three runs is a small sample, so I can't say how often the two extra findings of run 3 would appear over many runs.
- The test covers one command, version, model and application. It doesn't cover Claude Security, other models or code in other languages.
- The command is made for the changes on a branch, and I gave it a whole application as one change. Claude Code didn't put that 81,236-byte diff in the prompt: it saved the diff to a file, and the review read the source files directly.
- I didn't try any exploit, so "reported" only means that the report lists the flaw as a finding at the right place.
