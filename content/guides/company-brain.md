---
title: "Company brain: AI that answers from your own documents"
description: "A company brain answers staff questions from your own documents, with a source on every answer and access rules enforced inside the search. How I build one."
path: "/guides/company-brain/"
date: "2026-10-06"
kicker: "Guide"
related: ["newsroom-second-brain", "document-intelligence-at-scale", "doc-agent-on-sqlite"]
faq:
  - q: "What is a company brain?"
    a: "An assistant that answers staff questions in plain language from the company's own documents and knowledge, and shows the source behind every answer. When the documents do not cover a question, it says it found nothing instead of guessing."
  - q: "How is a company brain different from a second brain AI app?"
    a: "A second brain app holds one person's notes, written and read by that person. A company brain holds documents written by many people for many readers, so it has to check who is asking before it searches. It also has to cite a source for every answer, because the person asking cannot check the answer from memory."
  - q: "Can a company brain leak confidential documents?"
    a: "It can if permissions are checked after the search. I put the check inside the search query, so a document the user cannot open is never a candidate for the answer. On a build covering 100M+ pages across thirty brands, that design gave zero cross-brand leaks."
  - q: "Do I need a vector database to build one?"
    a: "It depends on the size of the corpus and on how many people add to it. For one business owner with three years of paperwork, the whole index fits in one SQLite file on his own machine. For 100M+ pages across thirty brands, I used a hosted vector index with a separate, walled-off section per brand."
---

Every company has a few people who double as its search engine. Colleagues ask them where the signed contract lives or why a process works the way it does, and when those people leave, the answers leave with them. A company brain takes over that job: staff ask a question in plain language, and it answers from your own documents, with a source they can open and check.

**At a national news outlet, staff now ask one question box across 500,000+ articles and every desk's internal notes, and every claim links back to its source. Onboarding a new hire dropped from weeks to days.**

## What a company brain is

A company brain reads what your company has written down (contracts, process notes, reports, old scans) and answers from it, quoting the passage and linking to the file. When the documents are silent, it says so. Call it an AI knowledge base or enterprise AI search if you prefer; the label matters less than those two habits.

The payoff is time. At a [global enterprise](/case-studies/document-intelligence-at-scale/) holding 100M+ pages, a scientist could spend half a day hunting one number from a 2009 study, then give up and rerun it. That number now comes back in under a second, with a link to the page.

## Why a personal second brain is the easy case

Tiago Forte's [Building a Second Brain](https://www.buildingasecondbrain.com/) describes its method as "a way to cultivate a growing body of knowledge that is uniquely your own". A second brain AI tool built on your own notes keeps that comfort: you wrote them, so you notice when an answer is off.

A company brain loses that comfort in four ways:

- **Other people wrote the documents.** The person asking cannot check the answer from memory, so the source link is their only check.
- **Not everyone may read everything.** HR files sit next to the travel policy, so the brain has to know who is asking before it searches.
- **The files are messy.** Scans, tables, slide decks, the same PDF in several folders.
- **It changes every day.** Files come and go, and people move between teams.

The closest I have built to the personal case is a [document agent for one business owner](/case-studies/doc-agent-on-sqlite/): the search index over three years of paperwork is one SQLite file on his own machine, and retrieval takes under 2 seconds. It is built for one writer. A team adding documents at the same time is where I would change the design.

## Reading documents cheaply and faithfully

Reading cheaply means never paying a model for text the file already holds. I look for a real text layer first and pay for OCR (software that turns a picture of text into text) only on real scans. On the 100M+ page corpus, about two thirds of the pages were born-digital, with their text already inside, so OCR on everything would have roughly tripled compute for no accuracy gain. For the business owner, around 85% of pages never touch a paid model.

Reading faithfully is hardest on tables. Plain OCR flattens the grid into a stream of numbers, and a model asked for one compound's pH will fluently pick a number from the wrong row. So tables go through a model built for table structure, and a malformed grid is dropped rather than trusted, along with a few real, unusually wide tables. In the enterprise build, a confident wrong number was the one failure I could not ship. Next time I would send the dropped wide tables to a slower vision model for a second look before throwing them out.

## Permissions belong inside the search

The tempting design searches everything, then hides what the user may not see. By then the search has already read the restricted file, and one forgotten filter puts it in an answer.

The [newsroom brain](/case-studies/newsroom-second-brain/) made this mistake. Its first version filtered at display time and pulled internal desk notes into answers for anyone who asked. Moving the permission check into the query fixed it: a document the user cannot open is never a candidate.

At the global enterprise, each brand gets its own walled-off section of the index, and each document's access rights go into the query as a filter on the user's groups, taken from a signed identity the model cannot forge. Zero cross-brand leaks.

OWASP lists weak access control on vector stores (the indexes that search by meaning) as a risk in its LLM Top 10, [LLM08:2025](https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/), and recommends permission-aware stores with data partitioned between groups of users.

## A source on every answer

In the newsroom brain, the model reads only the passages the search returned and tags each claim with its source. Its one job is to quote, like a librarian, and when the search comes back empty, it says it found nothing.

A citation is only as good as the passage the search hands over. I run at least two searches side by side, one by meaning and one by exact words, because a search by meaning alone puts part code "AX-1401" right next to "AX-1410". If your documents mix English and Arabic, the meaning search needs a multilingual model, so a question in one language finds a passage written in the other. The enterprise build searches across a dozen languages, and the newsroom brain works in more than one.

## Keeping it fresh

A company brain answers from whatever it last imported. What keeps my builds current:

- **One row for both searches.** At the news outlet, the meaning index and the word index share a database row, so there is no second store to keep in sync.
- **A queue that lets urgent work through.** At the global enterprise, a fair scheduler stops a bulk load of tens of thousands of certificates from starving the scientist waiting on one new report.
- **A fingerprint per file.** In the business owner's agent, a duplicate is caught by its content hash, so it never costs a second model call.

Deletions and permission changes must travel as fast as new files. Otherwise the brain quotes a contract someone removed, or shows a folder to a person who left that team.

## Measuring answer quality

A demo looks good because you pick the questions. Before launch, collect real questions from future users, each paired with the document that answers it, and rerun the set after every change. Check four things:

1. Did it cite the document that holds the answer?
2. When the documents are silent, did it say so?
3. Asked by someone without access, did the restricted file stay out?
4. How long did it take? On the 100M+ page corpus, 95% of answers come back in under a second.

Score the search apart from the answer, so a wrong answer tells you whether the right passage was never found or was found and ignored.

Then measure the reason you built it. At the global enterprise, that was up to 40% fewer duplicated studies and re-reviews.

## What goes wrong

These four failures from my builds share one trait: nothing crashed, and each returned a normal-looking result.

- **Two scores averaged.** In the newsroom brain, averaging a meaning score with a keyword score, which sit on different scales, let one strong keyword hit dominate every answer. Merging by rank fixed it.
- **Two people merged into one.** A name-matching threshold set too low merged two people who shared a surname, so a question about one returned the other's history. I raised it: a missed merge is cheaper than a wrong one.
- **An empty question.** At the global enterprise, a blank query came back with near-random documents and plausible scores. Nothing errored. The fix was a one-line guard, plus a test that would have caught it.
- **An empty page.** A batch of scans came back with no text, and the business owner's agent filed them all as "unknown" with high confidence. An empty read now goes straight to a review queue.

None of these shows up in a demo with hand-picked questions.

## How a project runs

1. In writing first: which documents, which teams, who may see what, and which questions cost your people the most time today.
2. A pilot on one team's documents, measured on that team's own questions, with the people who know the answers checking the sources.
3. Production with permissions inside the search and the question set rerun after every change.

## What it will not do

It knows only what someone wrote down. Judgment a senior person never put into words still leaves when they do.

Deep questions take longer. In the enterprise build, a one-line lookup takes about a second and a question that cross-reads many documents takes minutes.

And it will say "I found nothing" more often than a helpful colleague would. I prefer that to a confident guess.

The technical write-ups are in the case studies below.
