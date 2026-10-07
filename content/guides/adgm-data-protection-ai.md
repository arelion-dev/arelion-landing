---
title: "ADGM Data Protection Regulations 2021 and AI, explained"
description: "Who must follow ADGM's Data Protection Regulations 2021, the one section that names AI, sending personal data to AI vendors, and what I would build."
path: "/guides/adgm-data-protection-ai/"
date: "2026-10-07"
kicker: "Guide"
related: ["document-intelligence-at-scale", "local-ai-stack", "prompt-injection-defense"]
faq:
  - q: "Who has to follow the ADGM Data Protection Regulations 2021?"
    a: "Controllers and processors that process personal data in the context of the activities of an establishment in ADGM, wherever the processing takes place (section 3(1)). In practice that means every registered entity: since April 2021 the Office of Data Protection has required all of them to declare that they process personal data, at least about their directors. The federal PDPL does not apply to free-zone companies that have their own data protection legislation (Article 2(2)(g))."
  - q: "Do the ADGM regulations say anything about AI?"
    a: "One provision names it. Section 31(4)(c) lets a company keep personal data that is part of a dataset used to lawfully train or refine an AI system, when it would otherwise have to delete it, if this does not present risks to the person's rights. It requires a data protection impact assessment first (section 31(5)) and a policy for deleting the data later (section 31(6)). The rules on automated decisions, impact assessments, processors and transfers apply to AI without naming it."
  - q: "Can an ADGM company send personal data to ChatGPT or another US AI service?"
    a: "Only under the transfer rules in Part V. The United States is on ADGM's adequacy list only for organisations in the EU-US Data Privacy Framework. Otherwise you need a safeguard such as ADGM's standard contractual clauses, whose controller-to-processor module also meets the processor contract requirements of section 26(3). Onshore UAE counts as outside ADGM and is not on the list either."
  - q: "What are the fines under the ADGM Data Protection Regulations?"
    a: "Up to USD 28 million (section 55(1)). The first published fine, on 21 May 2024, was USD 20,000 against Okadoc Technologies Limited: an access request from an employee serving her notice went unanswered within the two months the regulations allow, and the company had no internal data protection policy when it arrived."
---

ADGM's Data Protection Regulations 2021 run to 58 pages in the consolidated version of August 2025. I searched that text for "artificial", "machine learning", "algorithm" and "generative", and got one hit: section 31(4)(c), which lets a company keep personal data that sits in an AI training dataset. Everything else an AI project has to meet is in rules written for all processing, such as automated decisions, impact assessments, processor contracts and transfers out of ADGM.

This page is not legal advice: I am an engineer, and a lawyer should check any decision you base on it.

## Who must follow the regulations

The [Data Protection Regulations 2021](https://en.adgm.thomsonreuters.com/sites/default/files/net_file_store/ADGM1547_23167_VER992025.pdf) were enacted on 11 February 2021 and replaced the 2015 regulations. ADGM's Commissioner of Data Protection enforces them, with the Office of Data Protection. Section 3(1) applies them to processing "in the context of the activities of an Establishment of a Controller or a Processor in ADGM, regardless of whether the Processing takes place in ADGM or not". An ADGM company whose AI runs on servers in Frankfurt or Virginia is still covered.

In practice every registered entity is in scope. In [Circular No. 1 of 2021](https://assets.adgm.com/download/assets/OFFICE-OF-DATA-PROTECTION-CIRCULAR-NO-1-OF-2021-CLARIFYING-THE-PROCESING-OF-PERSONAL-DATA-FOR-ALL-EN.pdf/59cae4ba589811ef927b1acd23ee87a2), the Office decided that all registered entities process personal data, at least the passports and signatures of their directors, and must declare it in the registry. Registration and each yearly renewal cost USD 300 ([Fees Rules 2021](https://en.adgm.thomsonreuters.com/sites/default/files/net_file_store/ADGM1547_23588_VER2021.pdf)). If the renewal is not paid within a month of the anniversary of incorporation, the Office's [fees page](https://www.adgm.com/operating-in-adgm/office-of-data-protection/fee-sections) says a USD 450 penalty applies automatically. Since a July 2022 amendment, companies with fewer than five employees no longer get an exemption from the fee or from the data protection officer rules.

Two other laws come up in Abu Dhabi. The federal PDPL does not apply to companies in free zones that have their own data protection legislation (Article 2(2)(g) of the [federal decree-law](https://assets.u.ae/api/public/content/954629a06cc64fd887771ce3273d6154?v=21d88839), Arabic text). ADGM has its own, so on my reading companies there follow these regulations instead ([UAE PDPL and AI](/guides/uae-pdpl-ai/)). The DIFC law reaches a company incorporated elsewhere only when it processes in the DIFC as part of stable arrangements (Article 6(3)), which I cover in [DIFC Data Protection Law and AI](/guides/difc-data-protection-ai/).

ADGM also [expanded to Al Reem Island](https://en.adgm.thomsonreuters.com/rulebook/1-november-amendments-legislation-regarding-adgms-expansion-al-reem-island) in 2023, and section 3(4) kept businesses there outside these regulations until 31 December 2024, unless they registered or were licensed in ADGM. If your company sits on Al Reem Island, ask a lawyer where it stands now.

## The one section that names AI

Section 31 says what happens when processing has to stop, because its legal basis is gone or because the person asked for erasure. All the personal data, including what processors hold, must be securely deleted, anonymised, pseudonymised or encrypted (section 31(1)), or else archived and put beyond further use.

[Section 31(4)(c)](https://en.adgm.thomsonreuters.com/rulebook/31-cessation-processing) makes an exception for data that "is part of a dataset used to lawfully train or refine an artificial intelligence system in a manner that does not present risks to a Data Subject's rights". It comes with conditions. Before relying on it, you carry out a data protection impact assessment, and you limit the processing to what is necessary (section 31(5)). You also need a policy to delete, anonymise or put the data beyond use once the grounds no longer apply (section 31(6)). The [DIFC law](https://assets.difc.com/v1/media/edge/images/dubaiintern0078-difcexperie96c5-production-3253/media/project/difcexperiences/difc/difcwebsite/documents/laws--regulations/data-protection-law.pdf) has the same sentence in its Article 22(4)(c).

The exception covers a dataset. A model fine-tuned on personal data is a harder case, because removing one person from its weights in practice means retraining the model without their data. Section 15(4) excuses an erasure that is not feasible for technical reasons only when you collected the data from the person and told them at collection, in a way that was "explicit, clear and prominent", that erasure would not be feasible. Section 11(2)(h) adds that you must satisfy yourself they understood. On my reading, data you received from a client or took from the web does not qualify.

So for an ADGM company, my default is to keep personal data out of model weights. The model reads documents at question time from an index the company controls, and an erasure request becomes a delete in that index.

## Rules that apply to AI without naming it

| Rule | Section | What it means for an AI project |
| --- | --- | --- |
| Automated decisions | 20 | A decision based solely on automated processing, with legal or similarly significant effects, is allowed only when it is necessary for a contract with the person, based on their explicit consent, or required or authorised by law. In the law case you notify the person in writing, and they have one month to ask for a new decision. In the first two cases the person can get human intervention, give their view and contest the decision. |
| The logic | 11(2)(g), 12(2)(g), 13(1)(h) | People must be told about such decisions, with "meaningful information about the logic involved". |
| Impact assessment | 34(1), 34(7) | Required before processing likely to result in a high risk. If it shows a high risk, notify the Commissioner before you start. |
| Data protection officer | 35(1)(b), 35(2)(d) | Required when your core activities need regular and systematic monitoring of people on a large scale. The officer can live outside ADGM. |
| Breach | 32(1), 33(1) | Tell the Commissioner within 72 hours where feasible, and the people affected when the risk to them is high. |
| Requests from people | 10(3), 10(4) | Answer within two months. One more month is allowed only if you say so, with reasons, within the first two. |
| Processors | 26(3), 26(9) | A written contract with eight required terms. A processor that decides the purposes and means of processing becomes a controller for it. |

The Commissioner must publish a list of processing that needs an impact assessment (section 34(4)). The list in [Guidance Part 4](https://assets.adgm.com/download/assets/ADGM+DPR+2021+Guidance+Part+4.pdf/63de087e595611ef8e065eb4feb71eb0), from August 2021, starts with using profiling, automated decision-making or special category data to help make decisions on someone's access to a service, opportunity or benefit. A later [explainer](https://assets.adgm.com/download/assets/ADGM+-+How+to+Conduct+a+Data+Protection+Impact+Assessment+%28DPIA%29+%28Explainer%29.pdf/16a7bedc58ad11efa80cb2570a3a6e3c) from the Office names "novel or new technologies such as AI, machine learning, automated decision making and profiling" as a reason to start one.

On automated decisions, the Office's [brochure](https://assets.adgm.com/download/assets/ADGM+-+Data+Subject+Rights+Automated+Individual+Decision-Making+%28Brochure%29.pdf/698e462858a511ef9face27828504259) of May 2025 is the closest thing ADGM has to AI guidance under data protection law. A decision stops being solely automated only when someone reviews and interprets the result in a meaningful way. Reviewers must not "routinely" apply the system's recommendations, and they need "the authority and the competence to overturn the recommendation". The brochure suggests tracking how often reviewers accept or reject the AI system's output, and why. It is not binding. I would build to it anyway, because each point turns into something you can log.

The first published fine shows how the Office reads deadlines. On 21 May 2024 it fined Okadoc Technologies Limited USD 20,000 ([penalty notice](https://assets.adgm.com/download/assets/Penalty+Notice+1+2024+Okado+Technologies+Limited+Redacted.pdf/a9a4417a7fb711ef9671ae2bd63eadfa)). An employee who had just been given notice asked for her data, and the request went unanswered within two months. The company claimed the one-month extension only after the deadline, had no internal data protection policy when the request arrived, and did not fully cooperate with the Office's investigation. The maximum fine is USD 28 million (section 55(1)).

## Sending personal data to an AI vendor

A prompt that carries personal data to a model hosted outside ADGM is a transfer. The Office reads the word broadly: making data available to someone in another jurisdiction counts, for example by giving them access to a system ([Guidance Part 6](https://assets.adgm.com/download/assets/ADGM+DPR+2021+Guidance+Part+6.pdf/e743e728595711ef80b936e29b0f3a63), paragraph 2.2). Part V then leaves you these routes:

- **Adequacy** (section 41). The [list of adequate jurisdictions](https://www.adgm.com/operating-in-adgm/office-of-data-protection/jurisdictions) includes the EU and EEA, the UK, Switzerland, Japan, South Korea and the DIFC. The United States is on it only for "commercial organisations participating in the EU-US Data Privacy Framework". Check your vendor's own entry in that framework before you rely on it.
- **Safeguards** (section 42). ADGM publishes [standard contractual clauses](https://assets.adgm.com/download/assets/ADGM-DPR-2021-Data-Transfer-Standard-Contractual-Clauses.docx/11b7257c595a11efb1f3d2c6fc789a96) in four modules. When a controller sends data to a processor, the clauses "are also sufficient to meet the requirements under section 26(3)", so one document covers the transfer and the processor contract. A company already using the EU clauses can sign ADGM's [addendum](https://assets.adgm.com/download/assets/ADGM+-+Data+Transfer+Addendum+to+the+EU+SCC-pdf.pdf/9e08f13a595b11efb0b3aa2a20d5f45b) instead.
- **Derogations** (section 44), such as explicit consent after being told the risks. The Office expects consent to be rare for transfers and limited to "certain one off situations" (paragraph 2.12).

The same guidance also answers a question that matters for UAE cloud regions. To "Would onshore United Arab Emirates count as a non-ADGM jurisdiction?" the Office replies "Yes, it would", and onshore UAE is not on the adequacy list. A cloud region in Abu Dhabi or Dubai keeps data in the country. On my reading, an ADGM company still needs a transfer route to use it.

You also need a processor contract. Section 26(3) lists eight terms: documented instructions, including on transfers; confidentiality; the security measures of section 30; rules for sub-processors; help with people's requests; help with security, breach notices and impact assessments; deletion or return of the data at the end; and the information and audits needed to prove compliance. Under section 26(9), a processor that breaks the rules by deciding the purposes and means of processing becomes a controller for that processing. On my reading, a vendor that trains its own models on your prompts decides a purpose of its own, so the contract should say plainly whether it may.

If your firm is regulated by the FSRA, its IT Risk Management Guidance of November 2024 has a chapter on algorithm driven solutions that names generative AI. It expects an acceptable-use policy for staff who use public AI tools, including how they handle data ([section 14.1.10](https://en.adgm.thomsonreuters.com/rulebook/desired-outcome-141-governance-algorithm-driven-solutions)), and its [applicability section](https://en.adgm.thomsonreuters.com/rulebook/applicability) says it is not a binding set of rules.

## What I would build

1. **Personal data in an index, out of the weights.** The model reads documents at question time, so an erasure request is a delete and section 31(4)(c) rarely matters. In a [document AI system](/case-studies/document-intelligence-at-scale/) I built over 100M+ pages, access control is enforced inside the search query, with each brand in its own index namespace, so a question never touches documents the user cannot see.
2. **A local model when the data must not move.** I built a fully local [coding assistant stack](/case-studies/local-ai-stack/): the model runs on a machine I own and listens only on that machine's loopback address, and the code never leaves the box. On hardware inside ADGM, the model call sends nothing out of ADGM, so on my reading it needs no transfer route. Remote access from outside ADGM still would.
3. **Egress control on agents.** A document can carry instructions that tell an agent to send data out. Across the agents I run, no untrusted text reaches a privileged action or an outbound channel without clearing deterministic code first ([prompt injection defense](/case-studies/prompt-injection-defense/)). A leak of personal data through an agent is a personal data breach, and the 72 hours of section 32 count from when you become aware of it.
4. **A request desk with a clock.** One query finds everything about a person across the index, the logs and the vendor's side, and a ticket starts counting the two months when the request arrives.
5. **Review logs.** Each AI recommendation is stored with the reviewer's decision and the reason, so you can show how often people overturn the system, as the brochure suggests.

The rest of my build list is in the [DIFC guide](/guides/difc-data-protection-ai/): notice text generated from config, purpose limits in code, human review that fails closed, answers logged with their sources, explanations with evidence, and an off switch with a test set.

## What changed since 2021

The [ADGM rulebook](https://en.adgm.thomsonreuters.com/rulebook/data-protection-regulations) lists four amending regulations. The 2022 one removed the exemptions for companies with fewer than five employees. The 2023 one dealt with Al Reem Island, and the 2024 one fixed a reference in the appeal route. The 2025 one let the Board add conditions for special category data, and [new rules](https://en.adgm.thomsonreuters.com/rulebook/data-protection-regulations-substantial-public-interest-conditions-rules-2025) in force the same day added insurance and the safeguarding of children and people at risk. None of them touches AI, and I found no 2026 change as of 7 October 2026.

What I could not find is any reading of "in a manner that does not present risks to a Data Subject's rights". The Office's guidance repeats the phrase (Part 4, paragraph 3.1, and Part 5, paragraph 3.3) without explaining it, and I found no FAQ or decision on it. Its most detailed AI material is the brochure on automated decisions. Until that changes, I would not train a model on personal data for an ADGM company.
