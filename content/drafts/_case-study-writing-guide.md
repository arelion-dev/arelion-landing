# Case study writing guide (arelion.dev)

Read this before writing or editing any case study. It is the single source of truth for HOW a case study is built. For voice and the ghost-in-the-llm / wingman reference, also read `_article-guidebook.md` in this folder. This file is not deployed (Gatsby only sources `content/blog`).

---

## Direction update (2026-08-13): shorter, straighter, impact-first

Standing feedback from Antonin. Overrides anything below that conflicts with it.

- **Cut verbosity and personal narrative.** No "last night I..." or "I spent an afternoon..." diary openers. Lead with the finding or the claim in plain words. A scene is optional and short; the result is the hook, not the story of how you got there.
- **Tech version = straightforward.** State what it is, show the artifact, move on. Minimal narration between code blocks. The reader is an engineer skimming for the mechanism.
- **Business version = why it matters, not a service menu.** Explain why the technical finding matters commercially and what it can cost (breach, disclosure, fines, lost trust), then what actually reduces the risk, then a short honest note on what I can do. The "What you get" bullet list is NOT mandatory; use it only when a concrete deliverable list genuinely fits. Default shape: what it is (1 to 2 lines), then why it matters to you, then what it costs when it goes wrong, then what actually reduces the risk, then what I can do (light, honest), then a soft written CTA.
- **Enforce the anti-slop rules (section 5b) harder.** No rule of three, no "X, not Y" or "isn't X, it's Y", no dramatic personification, no balanced punchy closers. Plain verbs, varied sentence length, say it and stop.

The `llm-sleeper-agents` business article is the reference for the new business shape.

---

## 0. Non-negotiables (hard rules)

- **First-person ownership.** "I designed / I built / I led / I own." Never "we", never "as part of the team", even on real team work. Keep "the team" / "your team" only when it means the CLIENT's team ("a compliance team", "your team ships with AI").
- **Anonymize the client.** Never a name, never a logo. Refer by sector + scale ("a global beauty group", "a national news outlet", "a fintech onboarding investors"). Quoted example queries stay generic.
- **English only** for the article body. The site chrome is bilingual, the articles are EN (SEO language).
- **No em-dashes. Ever.** Use comma, colon, period, or parentheses. Grep the file before shipping.
- **Code and mechanisms stay grounded.** Model names, APIs, and code snippets come from the real project (the rich JSON or the actual repo). If you cannot ground code, describe the mechanism in prose. Illustrative snippets must be labelled "illustrative".
- **Outcome KPIs may be representative.** Result numbers (latency cut, hours saved, throughput, adoption) can be illustrative rather than strictly measured, at Antonin's discretion, since clients are anonymized. Keep them plausible and internally consistent with the story. This licence is for outcome metrics only, never for code, model names, or claimed facts about how the system works.
- **Publishing is Antonin's call.** Never flip `published: true` without an explicit go. Ship as a draft.

---

## 1. The two-version format

Every case study can carry TWO markdown bodies, switched by a Tech/Business toggle on the page (toggle appears only when both exist, defaults to Business, remembered site-wide).

| | Tech | Business |
|---|---|---|
| Reader | engineer, CTO, lead | founder, board, buyer |
| Length | ~600 to 900 words | ~350 to 550 words |
| Content | artifacts: code, a worked trace, a diagram, real numbers | outcome-first sales pitch: what you get, what it is worth, proof |
| Angle | how it works and why each decision | this capability, as a service I deliver |

Both are `content/blog/<slug>/index.MD` (tech) and `content/blog/<slug>-business/index.MD` (business).

### The business version is an outcome pitch (updated 2026-08-07)

Treat the business version as the landing page a buyer hits after searching "[dev studio] [capability]" (e.g. "dev studio document intelligence at scale", "dev studio second brain"). It must instantly say "yes, I build exactly this, here is what you get." Outcome first, capability framed as a service I deliver, not a recap of one project. Structure:

1. **Promise (H1 + first line).** The capability and the outcome, in the buyer's words. The keyword phrase they searched should be recognizable here.
2. **The expensive status quo.** The concrete pain and what it costs today. Make them feel the bill.
3. **What you get.** The capability as a delivered thing, as bold outcome bullets with illustrative KPIs (search time cut, hours saved, risk removed). This is the core of the pitch.
4. **Why it holds / why me.** Trust: grounded answers, access-safe, already shipped at real scale for a real (anonymized) client. One honest boundary.
5. **Who this is for.** The sectors and signals, so the reader self-selects.
6. **CTA.** Written, soft ("Want me to look at yours, in writing?"). Never a call.

Keep it scannable (bold outcome bullets, claim-style subheads), zero code, minimal jargon. Longer than the old ~250-word cap: this is a pitch, aim ~350 to 550 words. KPIs may be illustrative (see the KPI rule above).

Frontmatter (both):
```yaml
---
title: "<the case study title.en from case-studies.js>"
date: "2026-08-07T10:00:00.000Z"
description: "<one line>"
tags: ["Tech", "AI"]   # business uses ["AI", "Business"] etc.
private: true
---
```

Wiring: on the entry in `src/data/case-studies.js`, set `article: "/blog/<slug>/"` and `articleBusiness: "/blog/<slug>-business/"`. Every entry still needs a `case-studies-rich/<slug>.json` (at least the `tldr`). If a study already has an original article (ghost-in-the-llm, wingman), keep it as `article` and only add the business version.

---

## 2. Structure and patterns (steal these)

These are drawn from the best case-study sites (Stripe, Linear, Vercel, Anthropic, Ramp customer pages; Josh Comeau, Sam Rose, Ciechanowski, Emil Kowalski, Rauno, Stripe/Figma eng blogs; Instrument, Bakken & Baeck, BASIC/DEPT, Focus Lab). Apply them.

### Must-haves, every case study
1. **Claim-style section headers.** A header states a claim or a decision, not a topic. "The retry logic was the real bottleneck", not "Architecture". Someone must be able to read only the headers and get the whole arc. This is the highest-leverage scannability win.
2. **The result in the opening, not the client.** The first line (and the H1/title) carries the outcome. "A research agent that answers every part of a multi-part question, with a cited source per part." The metric is the headline; the anonymized client is a footnote.
3. **Cold-open with the concrete pain.** Start on a real scene: the scientist who burns half a day hunting a number in a 2009 scan. Then the system. Story before architecture.
4. **Bold stat pull-outs inside the prose.** Drop 3 to 5 short bold lines with hard numbers through the body so a skimmer catches them (100M+ pages, p95 under a second, 90% less manual routing). Keeps depth, adds scannability.
5. **Name the artifact.** Give the pipeline or mechanism a short handle (track_coverage, "the queue is the database"). A named thing is memorable and quotable.
6. **Honest limits.** State one or two real tradeoffs or "what I would do differently" plainly. Honesty is the trust signal, especially with no logos.

### Tech version depth (updated 2026-08-07): write it like a top Hacker News post

The tech version should read like the technical posts that top Hacker News: concrete, opinionated, real. That means MORE than one code block. Aim for several. Include:
- **Named tools with versions** where it matters (Pinecone, Google ADK, Gemini 2.5 Flash, sqlite-vec, FTS5, Ollama, Qwen, Pydantic v2, sqlglot, Docling/TableFormer, PyMuPDF, LiteLLM, Postgres `FOR UPDATE SKIP LOCKED`).
- **Real code** for the load-bearing mechanism. For my own projects the code is real. For client work I cannot paste proprietary code, so show the TECHNIQUE with a clearly representative snippet, generic enough to be honest, never claimed as verbatim client source.
- **Concrete numbers**: latencies, token counts, dimensions, thresholds, RAM, batch sizes.
- **Gotchas and war stories**: the bug that cost a day, the config that looked fine and was not, the tradeoff you chose and why.
- **One opinion per section**: HN rewards a defensible take ("a vector DB was the wrong default here, and here is the SQLite that replaced it").
Never fabricate a client's internal API, secret, or number. Grounded code and real gotchas over invented specifics.

### Tech version, additionally
7. **Show real artifacts.** Code blocks, a worked trace, a reference eval JSON, an annotated diagram. One annotated diagram beats a raw architecture dump: the arrow points at the single decision that mattered.
8. **Errors and gotchas in their own callout.** A `> War story.` blockquote for the bug that cost a day (the empty-id 500). This is the ghost/wingman signature.
9. Optional: open with a "by the end you will know X, Y, Z" contract (Sam Rose) for long technical pieces.
10. Consider **named callout boxes** for load-bearing judgments: `Tradeoff`, `Constraint`, `What I'd do differently` (rendered as bold-led paragraphs or blockquotes).

### Business version, additionally
11. **One expensive-failure paragraph.** Name the business risk in plain words (a half-complete answer that looks finished, acted on). Cost first, solution second.
12. **A stack/scale line is fine, deep code is not.** Keep it to outcome, risk, trust (cited answers, access-safe, shows its work).
13. **Soft written CTA at the end**, always. "Want me to look at yours, in writing?" Never propose a call or meeting.

---

## 3. Tech version skeleton

```
[Cold-open: one paragraph, the client's concrete pain, anonymized.]
[One line: what I built and the one result that matters.]

## <Claim header: the core problem in one line>
[The failure everyone ships, made concrete. A short code/trace block if it helps.]

## <Claim header: the key idea>
[The load-bearing decision. Code or an annotated diagram. Name the artifact.]

## <Claim header: how I proved it>
[Eval, metric, before/after. A reference artifact.]

> War story. [The bug that cost a day and what it taught.]

## <Claim header: the foundation, fast>
[The boring-but-correct plumbing, 2 to 3 tight artifacts.]

## Who has this problem
[Transfer: the sectors with the same pain. One line each.]
```

## 4. Business version skeleton

```
[One paragraph: what I built, for which kind of client (anonymized), in plain words.]
[One line: this piece is about one business risk, not the tech.]

## The expensive failure
[The risk in plain words. Why a confident half-answer costs money.]

## What this does differently
[The fix in outcome terms. No mechanism.]

## Why you can trust it
[2 to 3 bullets: cited, access-safe, shows its work.]

## Who has this problem
[Sectors. One line.]

[Soft written CTA.]
```

---

## 5. Anonymization playbook

- Client identity becomes: **sector + scale + (optionally) stack**. "A global beauty group, thirty brands, 100M+ pages." "A fintech onboarding investors into regulated funds."
- Never: client name, product name, logo, a named executive quote.
- A metadata line can stand in for the missing client identity, like a case-study sidebar: Sector, Team size, Stack, Engagement length. This transfers trust without naming anyone.
- Real identifiers (patent numbers, internal tool names, gateway names) never appear. Replace with generic placeholders.

---

## 5b. Anti-AI-slop (EN articles)

These are the EN counterparts to the `anti-slop-fr` skill (which already owns the French rules). Source cherry-picked from the anti-ai-slop-writing rule set (Carnegie Mellon 2025, Wikipedia "Signs of AI Writing", Buffer post analysis). Scope: the case-study article bodies, which are Antonin's own voice. They do NOT override ASD-STE100 for chat reports or step-by-step instructions, where short declarative sentences are correct.

**Banned vocabulary.** Never: delve, tapestry, testament ("a testament to"), vibrant, pivotal, crucial, intricate, meticulous, bolster, garner, underscore, interplay, multifaceted, nuanced (as filler), foster, leverage (as a verb, say "use"), utilize (say "use"), facilitate, encompass, paramount, groundbreaking, cutting-edge, game-changing, transformative, seamless, robust (outside literal engineering), comprehensive (about your own output), harness (figurative), spearhead, showcase, highlight (figurative), unprecedented, remarkable, profound, synergy, streamline, supercharge, elevate, load-bearing (overused crutch for "the part that matters"). "harness" stays only in its literal sense (eval harness, test harness).

**Banned phrases and openers.** "It's worth noting", "It's important to note", "At its core", "In the realm of", "When it comes to", "This is where X comes in", "Whether you're a X or a Y", "From X to Y" (range opener), "At the end of the day", "The bottom line is", "Here's the thing / the deal", "In conclusion", "Overall,", "Moreover / Furthermore / Additionally", "Notably / Importantly / Interestingly". No "As a [role], I..." credential openers.

**Structural tells (how readers spot AI even with clean words).**
- No "It is not X, it is Y" antithesis, and no "not just X, but Y". This one reads as AI 100%. Already swept out; keep it out.
- No rule of three. Do not default to three items or three adjectives. Use two, four, one.
- Vary sentence length. No three consecutive sentences of the same length. Mix a four-word sentence against a thirty-word one. This is the single most measurable AI signal.
- No parataxis. Do not chain short declaratives (short sentence, then another, then another). Connect related thoughts with subordinate clauses, conjunctions, or a semicolon, so the syntax shows causation and contrast.
- Contractions on. "don't", "it's", "can't", not the expanded forms.
- Active voice, and let some paragraphs stop without a wrap-up transition.

## 6. Pre-ship checklist

- [ ] First-person ownership, zero "as part of the team".
- [ ] Client anonymized, no names or logos anywhere.
- [ ] No em-dashes anywhere (grep for the character; use comma, colon, or period).
- [ ] Anti-slop (section 5b): no banned vocab, no "not X, it's Y" antithesis, no rule of three, varied sentence length, contractions on.
- [ ] Headers read as an arc on their own.
- [ ] The result is in the opening and the title.
- [ ] Tech: at least one real artifact (code/trace/diagram) and one honest limit.
- [ ] Business: under ~260 words, no jargon, soft written CTA.
- [ ] Both files created, `article` + `articleBusiness` wired in `case-studies.js`.
- [ ] `npm run build` is green; `/case-studies/<slug>/`, `/blog/<slug>/`, `/blog/<slug>-business/` all resolve.
- [ ] Left as `published: false`. Publishing waits for Antonin.

---

## 7. Reference exemplars

- **Own, best in class:** `content/blog/ghost-in-the-llm/`, `content/blog/wingman/`, and `content/blog/perseverant-research-agent/` (tech + business pair, with the annotated loop diagram).
- **External, for structure:** Stripe/Linear/Vercel/Anthropic/Ramp customer pages (result-first, tag by use-case, stat pull-outs, dense outcome grids). Josh Comeau (named callouts), Sam Rose (opening contract), Ciechanowski (analogy-first, annotated figures), Emil Kowalski (claim headers, business-first line), Rauno (visual dated index), Stripe/Figma eng blogs (cold-open scene + one hard metric), Instrument (verb-driven header arc), Bakken & Baeck (name the artifact + stack line).

Full teardown and the "what does not transfer" notes (logo walls, named exec quotes): see the vault, `Freelancing/Arelion/SEO Audit & Plan.md` and the research notes.
