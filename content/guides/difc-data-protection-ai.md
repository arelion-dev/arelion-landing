---
title: "DIFC Data Protection Law and AI: Regulation 10 explained"
description: "Who must follow DIFC Data Protection Law No. 5 of 2020, what Regulation 10 requires of AI systems and since when, the 2025 changes, and what to build."
path: "/guides/difc-data-protection-ai/"
date: "2026-10-06"
updated: "2026-10-07"
kicker: "Guide"
related: ["legal-research-assistant", "agent-eval", "output-contracts-in-production"]
faq:
  - q: "Who has to follow the DIFC Data Protection Law?"
    a: "Under Article 6(3), as amended in July 2025: controllers and processors incorporated in the DIFC, wherever they process, and any controller or processor, or their sub-processors, that processes in the DIFC as part of stable arrangements. Onshore UAE companies mostly fall under the federal PDPL, but the DIFC law can also reach them when they process in the DIFC as part of stable arrangements."
  - q: "What is DIFC Regulation 10?"
    a: "Regulation 10 of the DIFC Data Protection Regulations, in force since 1 September 2023, covers personal data processed by autonomous and semi-autonomous systems, meaning AI. It requires notice at first use, purposes set or approved by humans, evidence on request and, for high-risk processing, a certified system and an Autonomous Systems Officer."
  - q: "Does Regulation 10 apply if we only use ChatGPT?"
    a: "On my reading, yes once personal data goes in. The firm that benefits from the output is the Deployer even when someone else hosts the system, and Regulation 10.3.4 treats the Deployer as the controller. How the first-use notice applies to tools used only by staff is less clear, so ask the Commissioner's Office."
  - q: "Can people sue a DIFC firm over its use of their data?"
    a: "Yes. Article 64A, in force since 15 July 2025, lets a person who suffers damage from a breach of the law or the regulations apply to the DIFC Courts for compensation, and damage includes distress. The complaint route to the Commissioner stays open. I found no published judgment under it yet."
---

Since 1 September 2023, a DIFC firm that runs personal data through an AI system has had a rule written for exactly that: Regulation 10 of the DIFC Data Protection Regulations. Most of it asks for evidence, and evidence has to be designed into a system before launch, so I read it as an engineering spec.

This page is not legal advice: I am an engineer, and a lawyer should check any decision you base on it.

## Who must follow the DIFC Data Protection Law

The law is [Data Protection Law, DIFC Law No. 5 of 2020](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/laws--regulations/data-protection-law.pdf), enacted in May 2020 and administered by the DIFC Commissioner of Data Protection (Article 8). Article 6(3), as amended in July 2025, applies it to processing:

- by a controller or processor incorporated in the DIFC, wherever the processing takes place;
- in the DIFC by any controller or processor, or their sub-processors, wherever incorporated, as part of stable arrangements, including transfers out of the DIFC.

The [2025 amendment law](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/laws--regulations/amendment-law-no-1-of-2025.pdf) removed three limits from the earlier text: processing "other than on an occasional basis", a sentence limiting the law to processing in the DIFC and not in a third country, and a definition of processing "in the DIFC" as processing by means or staff physically located there. How far "stable arrangements" goes is a question for your lawyer. Even before the change, the Commissioner applied the test to the Careem group, which had no operating entity in the DIFC, only a holding company and branded ride stands there ([Decision Notice No. 1 of 2024](https://edge.sitecorecloud.io/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/data-protection-pages/data-protection--supervision--enforcement/decision-notice-1-of-2024.pdf)).

Onshore companies mostly follow the federal law: see [UAE PDPL and AI](/guides/uae-pdpl-ai/). The DIFC law can still reach them through stable arrangements, as the Careem decision shows.

## What changed since 2020

| Date | Change |
| --- | --- |
| 28 February 2022 | [DIFC Laws Amendment Law No. 2 of 2022](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/difc_docs/enactment_notice_-difc_laws_amendment_law_no_2_of_2022__1.pdf?sc_lang=en) enacted, amending the law |
| 1 September 2023 | Amended [Data Protection Regulations](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/laws--regulations/data-protection-regulation.pdf) in force, adding Regulation 10 |
| 8 July 2025 | [DIFC Laws Amendment Law No. 1 of 2025](https://www.difc.com/whats-on/news/difc-announces-enactment-of-amendments-to-select-difc-legislation-through-difc-law-amendment-law) enacted, in force 15 July 2025 |
| 18 June 2026 | [Consultation](https://www.difc.com/whats-on/news/difc-consultation-amended-data-protection-regulations) on amended regulations opens, comments until 18 July 2026 |
| 10 August 2026 | [Portal guide for Regulation 10 certification](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/registrars-and-commissioners/regulation-10/difc-dpc-gl-31-rev01-regulation-10-certification-guidance.pdf) updated |

From the July 2025 amendment:

- **Article 64A, a private right of action.** A person who suffers damage from a breach of the law or the regulations can apply to the DIFC Courts for compensation, without prejudice to a complaint to the Commissioner. Damage includes distress (Article 64A(5)). Court claims existed before under old Article 64(1). I found no published judgment under 64A.
- **Higher caps.** In Schedule 2 of the [consolidated law](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/laws--regulations/data-protection-law.pdf), the cap for skipping a data protection impact assessment before high-risk processing rose from USD 20,000 to USD 50,000, and for Article 28 (data requests from public authorities) from USD 10,000 to USD 50,000. Article 62(3) still allows a general fine "not limited to" Schedule 2 amounts.

## Regulation 10, obligation by obligation

[Regulation 10.1.1](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/laws--regulations/data-protection-regulation.pdf) defines a System as a machine-based system operating autonomously or semi-autonomously that processes personal data, for purposes humans define or that it defines itself, and generates output. A guidance note says purely automated systems with no autonomy are not meant to be covered. The Deployer is whoever has the System run under its authority, on its direction or for its benefit, or receives the benefit of its operation or output, "without regard to whether or not the System is operated, supervised or hosted by such person". Regulation 10.3.4 treats the Deployer as a controller, and the Operator, who runs the System for it, as a processor.

The obligations:

- **Article 9 principles** apply to personal data used in a System or to train it (10.2.1).
- **Notice at first use** (10.2.2(a) and (b)): clear notice at first use of an app or website running a System, saying what processing is not human-directed, how it affects people's rights, the human-defined purposes and limits, the outputs, the safeguards and the codes it follows (NIST, OECD and UNESCO are among those named).
- **Evidence on request** (10.2.2(c) to (f)): of compliance with any audit or certification requirements, and of the algorithms that make the System ask for human intervention when processing may be unfair or discriminatory, when authorities, including law enforcement, need access to data for criminal cases, or when the marketing rules in Regulation 9 may be breached, each with a risk and impact assessment.
- **A register on request** (10.2.2(g)): use cases, necessity and proportionality, how people access their data, whether the System makes solely automated decisions, third parties, contracts and export safeguards.
- **Design concepts** (10.3.1): ethical, fair, transparent (explainable "in non-technical terms, with appropriate supporting evidence"), secure and accountable.
- **Commercial use** (10.3.2): only for purposes humans define or approve, or that the System sets within human-defined principles and limits, and only if it is designed to the concepts above.
- **High-risk processing** (10.3.3): only with a System certified under the Commissioner's requirements, used for human-defined or approved purposes, and with an Autonomous Systems Officer who has the competencies and status of a DPO.

Article 38 of the [law](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/laws--regulations/data-protection-law.pdf) sits next to it: a person can object to a decision based solely on automated processing with legal or seriously impactful consequences, and require a manual review. Many AI projects can meet Schedule 1's definition of high-risk processing, which includes new technologies that materially increase risk, and extensive automated evaluation of people with legal or similar effects.

## Certification and enforcement so far

The Commissioner's [Regulation 10 page](https://www.difc.com/business/registrars-and-commissioners/commissioner-of-data-protection/regulation-10) lists four accredited certification bodies; for now, one of them certifies only its own systems. Certification assesses the System itself ([FAQs](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/data-protection-pages/guidance-and-handbooks/lawful-processing/dp-regulation-10-faqs.pdf), Q11), and a certificate lasts three years (portal guide). Beyond that, the Commissioner's AI guidance is a guidance note and those FAQs, both updated 27 August 2024. I found nothing aimed at staff using public chatbots.

The [Supervision and Enforcement page](https://www.difc.com/business/registrars-and-commissioners/commissioner-of-data-protection/supervision-enforcement) lists 601 Regulation 10 thematic assessments issued in 2025, with no fines for failing to respond, and 273 decision notices of administrative fines across all topics that year. Some websites say "full enforcement" of Regulation 10 began on 1 January 2026; I found no DIFC document that says so.

The June 2026 [consultation paper](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/laws--regulations/consultation-paper.pdf) proposes a "Safety" concept in Regulation 10.3.1, detailed duties and skills for the Autonomous Systems Officer, and a new Regulation 11 letting the Commissioner recognise certification schemes. It says not to act on the draft before it is enacted. As of 6 October 2026, I found no enactment notice, and the DIFC legal database still links the September 2023 regulations.

## If your firm uses ChatGPT or a similar tool

On my reading, a DIFC firm that puts client personal data into ChatGPT is the Deployer, since it receives the output, and so it is treated as the controller.

- **The duties stay with you.** The guidance note to 10.3.1 expects deployers to buy Systems only from developers that give "contractual comfort of compliance-by-design".
- **Transfers.** Article 26 allows transfers out of the DIFC to jurisdictions on the Commissioner's [adequacy list](https://www.difc.com/business/registrars-and-commissioners/commissioner-of-data-protection/data-export-and-sharing), which includes the EU, the UK, California and ADGM. It does not name the United States as a whole or onshore UAE, and the Commissioner's Office says it is reassessing the EU-US framework. Elsewhere you need an Article 27 safeguard, such as the DIFC standard contractual clauses, or one of the narrow derogations in Article 27(3), such as the person's explicit consent after being told the risks.

One point is unclear to me. Regulation 10.2.2 requires notice to "users" at first use, and it does not say how that works when staff paste a client's data into a tool the client never sees. I would ask the Commissioner's Office before guessing. It is a common situation: in the Commissioner's 2025 [survey of DIFC firms](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/registrars-and-commissioners/regulation-10/aso-survey-report.pdf), vendor proprietary AI and provider-hosted models were the most common AI in use.

## What an engineer has to build

Here is how I would build each piece:

1. **Notice text from config.** One config file lists the System's tools, data sources and purposes. I would generate the first-use notice from it, version it with each release, and log each user's acknowledgement.
2. **Purpose limits in code.** The model gets only the tools its purpose needs. My [legal research assistant](/case-studies/legal-research-assistant/), built over another jurisdiction's legislation, not DIFC law, works through exactly three tools, and every quoted article is read from a database keyed by law and article number.
3. **Human review that fails closed.** I would send the cases in 10.2.2(d) to (f), and Article 38 requests, to a named reviewer before anything reaches the person. In a [text-to-SQL system](/case-studies/output-contracts-in-production/) I built, a user whose permissions cannot be resolved gets an empty result, and a query that fails validation twice is blocked.
4. **Logs and the register.** I would store every answer with its sources, model version, prompt version and user, and generate the 10.2.2(g) register from deployment config, so it changes when the system does. In the text-to-SQL system, each executed query already sits next to its answer, so any number traces back to the query behind it.
5. **Explanations with evidence.** My legal assistant puts a footnote on every point that opens the source article, or says plainly that it cannot confirm the reference. 0 fabricated citations reach the user.
6. **An off switch and a test set.** Article 59(1)(b) lets the Commissioner, once satisfied a firm has broken the law, direct it to stop processing for a purpose. In an [agent evaluation harness](/case-studies/agent-eval/) I built, a behaviour ships with a kill switch, one environment variable, that doubles as a production escape hatch. A graded set of real cases, re-run on every prompt or model change, shows when the system drifts.

What I don't know yet is how the Commissioner will read "commercial use" for a firm's internal tools. The FAQs compare it to placing a System in the consumer market under the EU AI Act. The consultation may settle it. Until it does, I would build all six pieces for any DIFC system that touches personal data.
