---
title: "UAE PDPL and AI: using ChatGPT with personal data"
description: "What the UAE PDPL means when staff paste client data into ChatGPT: legal bases, transfers abroad, rights, breaches, and the regulations still missing in 2026."
path: "/guides/uae-pdpl-ai/"
date: "2026-10-06"
kicker: "Guide"
related: ["local-ai-stack", "legal-research-assistant", "document-intelligence-at-scale"]
faq:
  - q: "Who does the UAE PDPL apply to?"
    a: "To people who live or have a place of business in the UAE, to companies in the UAE whoever the data is about, and to companies abroad that process data about people in the UAE (Article 2(1)). It excludes government data, health and banking data that have their own laws, and free zones with their own data protection law, such as the DIFC and ADGM (Article 2(2))."
  - q: "Have the UAE PDPL executive regulations been issued?"
    a: "Not that I could find as of 6 October 2026. The law's page on the official legislation portal shows no change since 20 September 2021 and lists no executive regulations among its related legislation, and law firms said in March and June 2026 that they were still pending. The breach deadline, the DPO criteria and the transfer conditions depend on them."
  - q: "Can my staff paste client personal data into ChatGPT?"
    a: "Not into personal accounts: OpenAI may train on that content unless the user opts out, and you get no processor contract. A business plan does not train on your data by default, and OpenAI will sign a data processing addendum for it. You still need a legal basis under Article 4 and a lawful route for the transfer abroad."
  - q: "Is ChatGPT GDPR compliant?"
    a: "OpenAI signs a data processing addendum for ChatGPT Business, Enterprise and its API. That covers the vendor side. Under the GDPR and the UAE PDPL alike, the legal basis, the notice to the people concerned and the transfer route stay with your company."
---

A paralegal pastes a client's name, passport number and the facts of a dispute into a personal ChatGPT account and asks for a summary. Under the UAE PDPL, the federal data protection law, that is processing of personal data, and because the model runs abroad, very likely cross-border processing too.

I build AI systems that read and search large document collections, and I read this law with one question: what must the system do? This page is not legal advice: I am an engineer, and a lawyer should check any decision you base on it.

## Who the UAE PDPL covers, and who it leaves out

The law is [Federal Decree-Law No. 45 of 2021](https://uaelegislation.gov.ae/en/legislations/1972), in force since 2 January 2022 (Article 31). Article 2(1) covers people who live or have a place of business in the UAE, controllers and processors based there, and those abroad that process data about people in the UAE. On the text, a foreign AI provider holding your clients' data is in scope.

Article 2(2) leaves out government data and government bodies, data held by security and judicial authorities, health and banking data that have their own laws, and companies in free zones with their own data protection law. For health data, the preamble cites [Federal Law No. 2 of 2019](https://u.ae/en/about-the-uae/digital-uae/whole-of-government-approach/digital-health/ict-in-the-health-sector) on ICT in health fields.

The DIFC has its own law and, since 2023, Regulation 10 on AI systems, which I cover in [DIFC Data Protection Law and AI](/guides/difc-data-protection-ai/). ADGM has its own [Data Protection Regulations 2021](https://www.adgm.com/operating-in-adgm/office-of-data-protection), covered in [ADGM Data Protection Regulations and AI](/guides/adgm-data-protection-ai/). This page is about onshore UAE.

## Consent first, then a list of exceptions

[Article 4](https://uaelegislation.gov.ae/en/legislations/1972) prohibits processing without the owner's consent, then lists exceptions. The common ones are performing a contract with the person (Article 4(9)), an obligation under another UAE law (Article 4(10)), and claiming or defending rights (Article 4(3)). None of the ten listed cases is the company's own legitimate interest, which the [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj) allows in Article 6(1)(f). An eleventh lets the executive regulations add cases.

Consent must be provable and clear, and the person can withdraw it at any time ([Article 6](https://uaelegislation.gov.ae/en/legislations/1972)). Article 5(2) limits you to the original purpose or one "similar or close" to it. For your client's own data, the basis is usually your contract with them (Article 4(9)). For other people in the file, such as the other side, claiming or defending rights (Article 4(3)) is the likelier exception. Whether it covers sending the file to a chatbot is for a lawyer to say, before anyone tries.

## What one paste into a public chatbot changes

Processing includes sharing, disclosing and transmitting (Article 1), so the paste is processing and your company is the controller. Three consequences follow from the [text](https://uaelegislation.gov.ae/en/legislations/1972):

1. **The provider must be your processor.** Article 7(5) requires a processor with "sufficient guarantees", and Article 8(1) has it follow your instructions under a contract. A personal account gives you no contract, and OpenAI says it [may train on content from its services for individuals](https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance) unless the user opts out. Its business plans and API [do not train by default](https://openai.com/enterprise-privacy/).
2. **The client should have been told.** Before processing, Article 13(2) requires you to give the person the purposes, who receives the data inside and outside the UAE, and the cross-border protections.
3. **It may be a breach.** Article 1 defines a data breach to include transferring data "in a way which leads to disclosure of such data to third parties". A client file sent to an unapproved service could fit, which would trigger the Article 9 notices. Ask a lawyer before ruling it out.

My advice: no personal data in personal accounts, and a written list of approved AI services. I compare the plans in [ChatGPT Business, Enterprise or private AI](/guides/chatgpt-business-vs-private-ai-uae/).

## The servers are usually abroad

Processing outside the UAE is Cross-Border Processing (Article 1). The [PDPL](https://uaelegislation.gov.ae/en/legislations/1972) allows it on two routes. Article 22 covers transfers the regulator approves: to a country with data protection legislation, or under an agreement the UAE has joined. I found no published list of approved countries. Article 23 covers, among others, a contract binding the recipient to the PDPL's measures, the person's explicit consent, and a transfer needed to perform a contract with them. Its detailed conditions are left to the executive regulations (Article 23(2)).

A UAE region helps. OpenAI lists the United Arab Emirates for [data residency and model inference](https://help.openai.com/en/articles/9903489-data-residency-and-inference-residency-for-chatgpt) on ChatGPT Enterprise and Edu. The same page says logins, billing data, workspace metadata and some processing can still sit outside the region.

## Rights, breaches and the DPO

People can ask what you process and why ([Article 13](https://uaelegislation.gov.ae/en/legislations/1972)), get a portable copy (Article 14), have data corrected or erased (Article 15), restrict or stop processing in listed cases (Articles 16 and 17), and object to automated decisions, profiling included, unless they agreed to them by contract or consent, or a law requires them (Article 18). Under Article 18(4), a human must review an automated decision when the person asks. For erasure, keep personal data in a search index, where a request becomes a delete query, and out of fine-tuned model weights.

Under [Article 9](https://uaelegislation.gov.ae/en/legislations/1972), the controller notifies the regulator of a breach that would harm the privacy, confidentiality and security of the data, and tells the people affected. The deadline is left to the executive regulations. Article 10 requires a data protection officer (DPO) in three cases: high risk from new technologies or data volume, systematic assessment of sensitive data including profiling, and large volumes of sensitive data. Article 21 adds an impact assessment before high-risk processing with modern technologies. If your AI system scores or profiles people, plan for both.

## Where the regulations and the regulator stand in October 2026

Article 28 gave the Cabinet six months from 20 September 2021 to issue the executive regulations. On 6 October 2026 I could not find them: the [official legislation portal](https://uaelegislation.gov.ae/en/legislations/1972) shows no change to the law since 20 September 2021 (it blocks scripts, so I checked the Internet Archive's copy of 3 October 2026), and its list of related legislation, archived in January 2026, holds no executive regulations. The [Chambers 2026 UAE guide](https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2026/uae/trends-and-developments) (BSA Law's reading, March 2026) and [Morgan Lewis](https://www.morganlewis.com/pubs/2026/06/uae-establishes-federal-authority-for-artificial-intelligence-and-data) (June 2026) both say they have not been issued.

Fines wait on a separate Cabinet decision ([Article 26](https://uaelegislation.gov.ae/en/legislations/1972)), which I could not find either. Some vendor blogs announce a compliance deadline of 1 January 2027. The decree-law has no such date, and I found no Cabinet decision that sets one. Article 29 gives companies six months from the regulations' issue to comply. I would not wait: Articles 4 to 23 already say what is expected.

The regulator is moving too. The law names the UAE Data Office, and the government portal still says the Office ["will act as the federal data regulator"](https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws) (page updated December 2025). On 14 June 2026, the government [approved an Artificial Intelligence and Data Authority](https://mediaoffice.ae/en/news/2026/june/14-06/mohammed-bin-rashid-approves-establishing-artificial-intelligence-and-data-authority) that reports to the Cabinet and absorbs the functions of the Data Office and two other bodies. I found no published decree yet that sets out its powers under the PDPL.

## UAE PDPL and GDPR, side by side

| | UAE PDPL | GDPR |
| --- | --- | --- |
| Legal basis | Consent, or an exception in Article 4; no legitimate interests | Six bases in Article 6(1), legitimate interests included |
| Breach notice to the regulator | Deadline left to the executive regulations (Article 9) | Within 72 hours where feasible (Article 33) |
| Automated decisions | Right to object, human review on request (Article 18) | Right not to be subject to solely automated decisions with legal or similar effects (Article 22) |
| Fines | Left to a Cabinet decision (Article 26) | Up to EUR 20 million or 4% of worldwide annual turnover (Article 83(5)) |

Most of a [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj) program carries over. The parts I would redo: notices that rely on legitimate interests, and EU transfer clauses written for the GDPR.

Is ChatGPT GDPR compliant? OpenAI signs a data processing addendum for Business, Enterprise and the API "in support of" GDPR compliance ([enterprise privacy page](https://openai.com/enterprise-privacy/)). That covers the vendor side. The legal basis and the transfer route stay with you.

## The AI setup I would sign off on

This is the part of PDPL compliance that lives in the code:

1. **Company accounts under contract.** A business plan or your own cloud account, a data processing addendum, no training on your data.
2. **Data where you control it.** Files, index and logs in your cloud account, in a UAE region when the provider has one. For the most sensitive files, a model on your own hardware. [My own coding assistant](/case-studies/local-ai-stack/) runs that way, with the model server bound to the machine's loopback address and no inbound public port on the box.
3. **Access rights inside the search.** For a global enterprise with thirty brands, I put each user's permission groups into the vector query itself, so the search never reads a document that user may not open.
4. **One gateway for every model call.** At a regulated enterprise where I built an [evaluation harness](/case-studies/agent-eval/), a mandatory private gateway handles authentication, quotas, logging and the list of allowed models. Even my evaluation judge had to call through it.
5. **Traceable answers.** In a [system that turns plain-language questions into database queries](/case-studies/output-contracts-in-production/), each executed query is stored next to its answer.
6. **Less personal data in prompts.** Pseudonymise names and ID numbers where the task allows. The PDPL names pseudonymisation and encryption as security measures (Articles 7(2) and 20(1)(a)).

Back to the paralegal. The same request now goes to a company account under contract, through a gateway that logs it, against files the paralegal may open. When the executive regulations arrive, the parts I expect to update are the breach procedure and the DPO checklist.
