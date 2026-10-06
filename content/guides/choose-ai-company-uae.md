---
title: "How to choose an AI company in the UAE: 10 questions"
description: "Ten questions to ask AI companies in the UAE before you sign, and what weak and good answers sound like, from an engineer who ships AI to production."
path: "/guides/choose-ai-company-uae/"
date: "2026-10-06"
kicker: "Guide"
related: ["fractional-cpto-programme", "agent-eval", "legal-research-assistant"]
faq:
  - q: "How do I choose an AI company in the UAE?"
    a: "Send the same written questions to every company on your shortlist and compare the answers side by side. Ask what each one runs in production today, who will write the code, how the work will be measured before you pay for the next phase, and what it will cost to run each month. A team that ships answers with specifics."
  - q: "What should I ask an AI consulting firm before hiring it?"
    a: "Start with what its system does when the model is wrong. A good firm shows you the code that checks the output before anyone sees it, and an example of something it blocked. Then ask who owns the code, the prompts and the test set at the end. They should sit in your repository and your cloud account from the start."
  - q: "How much does it cost to run an AI system after launch?"
    a: "Without your usage numbers any figure is a guess, so I don't give one here, and a vendor shouldn't either. The monthly bill covers model calls (retries and automatic checks included), hosting, the search index, monitoring and the upkeep of the test set. Ask each vendor for a line-by-line breakdown tied to your users, questions and documents, and for what happens to the bill if usage doubles."
  - q: "What are the red flags when hiring an AI company?"
    a: "Nothing you can see running in production, and 'our model doesn't hallucinate' as the answer to what happens when it is wrong."
---

If you're comparing AI companies in the UAE, every one of them can show you a demo. A demo runs on questions the vendor picked, and it tells you little about the day your users ask their own. I build AI systems that run in production, and I've also taken over technology work that had stalled under others. These are the ten questions I'd ask before signing.

## Before you shortlist AI companies in the UAE

A list of AI consulting firms in Dubai or Abu Dhabi tells you who exists. It can't tell you who will own the problem when the model gets things wrong after launch.

Send the questions in writing to each company on your shortlist, so you can compare the answers and hold the winner to them later. A company that builds tends to answer with specifics. A company that sells slides tends to answer with adjectives.

## 1. Show me something you built that runs in production today

In production, real users bring typos and questions that switch language halfway through. A team that has never been there hasn't met those problems yet, and you'd be paying for them to learn.

**Weak answer:** a demo video, or "we've delivered many AI projects" with none you can see running.

**Good answer:** a system real people use today, even if the client stays anonymous. Ask what went wrong along the way. Here's one of mine: my first safety check on AI-written database queries compared table names only, so a table with the allowed name in another part of the database got through. The fix was to check the table's full address.

## 2. Who writes the code, and will I meet them?

The person who sells the project and the person who builds it can be two different people. That's fine if you know before you sign. It's a problem if the senior engineer from the pitch only shows up at review meetings.

**Weak answer:** "our team of experts", or a senior name you never hear from again after kickoff.

**Good answer:** names and roles. You meet the person who will write the code, or you're told plainly who will and who reviews their work. On the long programme I run, the team is me leading, one dedicated engineer, and specialists brought in when a piece needs them.

## 3. How will we measure that it works before I pay for the next phase?

When an AI system gets worse, nothing crashes. It answers a little worse, in fluent English, and the first person to notice is a user. Without a measure agreed up front, "it works" means "the vendor says so".

**Weak answer:** an accuracy figure with no test set behind it, or "we'll do user testing at the end".

**Good answer:** a graded set of your own questions, each with an answer your team confirmed, agreed before the build. For an enterprise document agent, I take the cases from real production sessions, check each answer against the source document by hand, and score every prompt or model change before users see it. Some expected answers should be "no data found", or you'll reward a system that never admits a gap. Tie each payment to a phase that met its measure.

## 4. What happens to my data, and where does it run?

In the UAE there is more than one rulebook for personal data: the federal [Personal Data Protection Law](https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws) (Federal Decree-Law No. 45 of 2021), the DIFC's own [Data Protection Law](https://www.difc.com/business/registrars-and-commissioners/commissioner-of-data-protection) (DIFC Law No. 5 of 2020), and the [ADGM Data Protection Regulations 2021](https://www.adgm.com/operating-in-adgm/office-of-data-protection). The DIFC also has [Regulation 10](https://www.difc.com/business/registrars-and-commissioners/commissioner-of-data-protection/regulation-10), enacted in September 2023, on personal data processed by AI systems. I'm not a lawyer, so ask yours which rules apply, then ask the vendor and compare.

**Weak answer:** "it's secure, it's in the cloud." No account name, no region, nothing about logs.

**Good answer:** a plain map. Which cloud account (yours, ideally), which region, which model provider sees what, what gets logged, how long it's kept and who can read it. In a system I built that turns plain-language questions into database queries, code applies the user's permissions after the model writes the query. If those permissions can't be resolved, the query matches zero rows instead of all of them.

## 5. What does the system do when the model is wrong?

It will be wrong. A model that's right 95 percent of the time is the dangerous kind, because the wrong 5 percent looks exactly like the right 95. So ask what catches a wrong answer before a person acts on it.

**Weak answer:** "we use the latest model, it doesn't hallucinate." Or "the prompt tells it not to make things up." A prompt is a suggestion the model can ignore.

**Good answer:** code that checks the output before anyone sees it, and a plain "I can't confirm this" when the check fails. In my legal research assistant, in production for a regulated client, code checks every citation against the laws just retrieved and strips any that don't verify. 0 fabricated citations reach the user. Ask the vendor to show you something their system blocked.

## 6. Who owns the code, the prompts and the data pipelines at the end?

The prompts, the test set and the pipelines that feed your documents in hold a large part of what you paid for. If they live on the vendor's platform, you can't move or change the system without the vendor.

**Weak answer:** "it runs on our platform", or "the prompts are our intellectual property".

**Good answer:** everything in your repository and your cloud account from the start, test set and scoring configuration included. The model provider should be replaceable too. In the database-query system above, the safety checks live in the application code, not in the model, so swapping the model for cost or quality changes none of the guarantees.

## 7. What will it cost to run each month after launch?

The monthly bill comes after the build: model calls, hosting, the search index, monitoring, and the person who keeps the test set current. Most of those lines grow with usage, and some hide in the design. Every automatic retry is another model call, and so is an AI judge that scores answers.

**Weak answer:** "it depends", with no breakdown.

**Good answer:** a line-by-line monthly breakdown tied to your own numbers: users, questions a day, documents. Then ask what happens to the bill if usage doubles, and who absorbs a price change from the model provider. I won't put a figure on this page, because without your numbers it would be a guess. A vendor who quotes one before seeing your usage is guessing too.

## 8. Can I talk to a past client?

Case studies are written by the vendor. A past client has nothing to sell you. My own case studies don't name clients either.

**Weak answer:** "everything is under NDA", and nothing else. A wall of logos with nobody behind them.

**Good answer:** a past client who agrees to answer your questions. NDAs are real. Still, a vendor with satisfied clients can usually find one willing to speak privately. Ask that client what happened the first time something broke, and who fixed it.

## 9. What will you refuse to build?

A vendor who agrees to everything hasn't looked closely at your problem. The refusals tell you where they think AI doesn't fit.

**Weak answer:** "AI can do that." "We can build anything you need."

**Good answer:** specific refusals, with reasons. Two of mine. I won't promise that a model will fix missing or outdated source data: when a law is missing from the corpus, my legal assistant names the gap instead of inventing the text. And on a programme with five areas, I refuse to promise all five at once, because that's how programmes fail.

## 10. What is the first version you would ship?

The answer shows whether they understood your problem, and when you'll get something you can use.

**Weak answer:** a platform that does everything, delivered in one go at the end. Or a pilot that never meets a real user.

**Good answer:** one use case for one team, measured on that team's own questions, and worth having even if you stop there. On the programme I run, the order is to turn the data on first, then personalise, then monetise, then compete. Each phase ships value on its own, and phase one goes live before phase four starts.

## How I answer these questions

My answers, with clients kept anonymous:

- **Production, and what happens when the model is wrong:** the [legal research assistant](/case-studies/legal-research-assistant/) that checks every citation in code, and the [checks on AI-written database queries](/case-studies/output-contracts-in-production/) used by thousands of people at a global enterprise.
- **Measurement:** the [regression tests for an AI agent](/case-studies/agent-eval/), which re-score it on production cases after every prompt or model change.
- **One owner:** the [fractional CTO programme](/case-studies/fractional-cpto-programme/). It started from an audit report that sat on a desk for weeks with not one finding actioned. Under the programme, every finding has one owner: me.

If you already have an AI vendor's proposal or deliverable, send it to me. I'll reply in writing with the questions I'd ask about it.
