---
title: "Saudi PDPL and AI: what it requires, article by article"
description: "What Saudi Arabia's PDPL asks of a company that runs AI on personal data: legal bases, AI vendors abroad, SDAIA registration, DPO, breaches and fines."
path: "/guides/saudi-pdpl-ai/"
date: "2026-10-10"
kicker: "Guide"
legalDisclaimer: true
legalJurisdiction: "Saudi Arabia"
related: ["local-ai-stack", "agent-eval", "document-intelligence-at-scale"]
faq:
  - q: "Does the Saudi PDPL apply to companies outside Saudi Arabia?"
    a: "Yes, when they process personal data about people who live in the Kingdom (Article 2(1)). SDAIA's National Data Governance Platform has a registration service for entities outside the Kingdom, with a user guide dated July 2026. The registration rules SDAIA has published cover controllers within the Kingdom and say that separate rules for controllers outside it will be issued. I have not found those rules yet."
  - q: "Can we send personal data to ChatGPT or another AI service hosted outside Saudi Arabia?"
    a: "Only on a route the transfer rules allow. Article 29 of the Law asks for a permitted purpose, a level of protection abroad that SDAIA has assessed as adequate, and the minimum data needed. I found no published list of adequate countries, so a company would need one of the exemption cases in Article 4 of the transfer regulation, each with its own safeguard, plus a risk assessment before the transfer (Article 7). On my reading, none of the cases fits daily production use cleanly, so ask a lawyer before you rely on one."
  - q: "What are the fines under the Saudi PDPL?"
    a: "A warning or a fine of up to 5 million riyals for breaking the Law or its regulations, and the fine can be doubled for a repeat violation (Article 36). Disclosing or publishing sensitive data to harm the person or for personal benefit carries up to two years in prison, a fine of up to 3 million riyals, or both (Article 35). The Saudi Press Agency reported that SDAIA's committees issued 48 decisions confirming violations in 2025."
---

Saudi Arabia's Personal Data Protection Law (PDPL) and its regulations ask a company that runs AI on personal data for five things:

1. A legal basis for each purpose: consent by default, or a case in Article 6, which includes the company's legitimate interest when no sensitive data is involved.
2. A contract with the AI vendor as your processor, and checks that the vendor keeps to it (Article 8).
3. A lawful route for every transfer of personal data out of the Kingdom (Article 29). When the model runs abroad, this is the hard part.
4. A written impact assessment when the processing relies on new technologies or makes automated decisions (Implementing Regulation, Article 25).
5. A notice to the regulator, the Saudi Data & AI Authority (SDAIA), within 72 hours of learning about a breach that may cause harm (Implementing Regulation, Article 24).

Some companies must also register with SDAIA and appoint a data protection officer. Fines go up to 5 million riyals (Article 36), and the Law reaches companies outside the Kingdom that process data about people who live there.

Take a sales team in Riyadh that pastes a customer complaint, with the customer's name and phone number, into a chatbot whose servers are in the United States. Under the Law that is a transfer of personal data out of the Kingdom, and on my reading of the texts in force in October 2026, no route for it fits that daily use cleanly.

I build AI systems that read and search large document collections, and I read these texts with one question: what must the system do? This page is not legal advice: I am an engineer, and a lawyer qualified in Saudi Arabia should check any decision you base on it.

## The texts, and which English versions to read

The [Personal Data Protection Law](https://sdaia.gov.sa/en/SDAIA/about/Documents/PersonalDataProtectionLaw.pdf) was issued by Royal Decree M/19 of 9/2/1443H, published in the official gazette, Umm Al-Qura, on 24 September 2021 ([decree](https://www.uqn.gov.sa/details?p=18322)), and amended by Royal Decree M/148 of 5/9/1444H ([decree](https://www.uqn.gov.sa/details?p=21671)). It came into force 720 days after publication (Article 43), which by my count is 14 September 2023. The one-year grace period the first decree gave controllers is over, as the Saudi Press Agency noted in April 2025 ([SPA](https://www.spa.gov.sa/en/N2307161)).

Two texts sit under the Law. The [Implementing Regulation](https://sdaia.gov.sa/en/SDAIA/about/Documents/ImplementingRegulationPersonalDataProtectionLaw.pdf) was approved by SDAIA's president and published on 7 September 2023 ([gazette](https://www.uqn.gov.sa/details?p=23594)). The [Regulation on Personal Data Transfer Outside the Kingdom](https://sdaia.gov.sa/Documents/RegulationonPersonalDataEN.pdf), which I call the transfer regulation, is in version 2.0 of August 2024. SDAIA has draft amendments to the Implementing Regulation open for comment until 5 November 2026 ([SPA, 8 October 2026](https://www.spa.gov.sa/en/N2696364)). I could not read the draft, because the government consultation platform, Istitlaa, did not load from my connection.

SDAIA publishes the three texts in English on its [regulations page](https://sdaia.gov.sa/en/SDAIA/about/Pages/RegulationsAndPolicies.aspx). None of the English PDFs says whether it is an official translation, and the decrees in Umm Al-Qura are in Arabic. I quote SDAIA's English and checked the passages this page relies on against SDAIA's Arabic PDFs; where they differ in a way that matters for AI, I say so. The Bureau of Experts' legislation site, laws.boe.gov.sa, did not load from my connection, so I did not check its versions.

Article 2(1) applies the Law to processing in the Kingdom, "including the Processing of Personal Data related to individuals residing in the Kingdom by any means from any party outside the Kingdom." A Dubai company that runs an AI assistant over files about its Saudi customers is covered. SDAIA's own rules name it as the Competent Authority that supervises the Law.

## A legal basis for each purpose

Article 5(1) sets the default: no processing, and no change of purpose, without the person's consent, "Except for the cases stated in this Law". Article 6 lists the cases, and two are useful to a company. One is processing "pursuant to another law or in implementation of a previous agreement to which the Data Subject is a party" (Article 6(2)). The other is processing "necessary for the purpose of legitimate interest of the Controller, without prejudice to the rights and interests of the Data Subject, and provided that no Sensitive Data is to be processed" (Article 6(4)). The [UAE PDPL](/guides/uae-pdpl-ai/) has no legitimate-interest case.

Legitimate interest comes with paperwork. Article 16 of the Implementing Regulation keeps public entities out, requires the processing to stay "within the reasonable expectations of the Data Subject", and asks for a documented assessment before you start. If you rely on consent, you need "A separate consent ... for each Processing purpose" (Article 11(1)(e)). Consent must be explicit for sensitive data, for credit data, and "When decisions are made solely based on automated Processing of Personal Data" (Article 11(2)).

Summarising a client's file to serve that client usually rests on your agreement with the client. Training or fine-tuning a model on the same files is another purpose, which Article 10 allows only in listed situations, among them consent and legitimate interest without sensitive data (Article 10(7)). SDAIA's English of Article 10(7) mentions only collection, while the Arabic covers collection or processing. The texts do not say whether training a model counts as a legitimate interest: the only examples the Implementing Regulation gives are fraud detection and network and information security (Article 16(2)).

## Sending personal data to an AI vendor abroad

The Law defines a transfer as "The transfer of Personal Data from one place to another for Processing" (Article 1(9)). A prompt that carries a customer's name to a model hosted abroad fits that definition. SDAIA's [risk assessment guideline](https://sdaia.gov.sa/en/SDAIA/about/Documents/RisksTransferringDataOutsideKingdomEn.pdf) for transfers, which says it "is not legally binding", also lists remote access among the activities to assess.

Article 29 allows a transfer for listed purposes, and the transfer regulation adds one that fits many AI uses: "To provide a service or benefit to the subject of the personal data" (its Article 2(2)). Three conditions then apply: no harm to national security or the Kingdom's vital interests, an adequate level of protection abroad "according to the results of an assessment conducted by the Competent Authority", and no more data than needed (Article 29(2)).

The second condition is the problem. Article 3(1) of the transfer regulation says SDAIA "shall publish on its official website a list of countries or international organizations" with adequate protection. On 10 October 2026 I found no such list on SDAIA's regulations page or in the knowledge center of its National Data Governance Platform. Without it, a company has to fit an exemption case in Article 4(2) of the transfer regulation, each tied to a safeguard. Three can matter to a private company:

| Case | When it applies | Safeguard |
| --- | --- | --- |
| B | The transfer is "non-recurring or for a limited period and involves a limited number of data subjects" | SDAIA's standard contractual clauses, or a recipient with an accreditation certificate if the data is not sensitive |
| C | Central operations of a company that belongs to "a group of multinational entities" | Binding common rules or the standard clauses, or a recipient with an accreditation certificate |
| D | A service or benefit given directly to the person, within their expectations | A recipient with an accreditation certificate, and no sensitive data |

Every exemption case also needs a risk assessment before the transfer (Article 7(1)).

Two details narrow the options. Changes to SDAIA's [standard contractual clauses](https://sdaia.gov.sa/Documents/StandardContractualClausesForPersonalDataTransferEN.pdf) "shall not be recognized by the Competent Authority and shall be deemed a violation" (rule 5), and the importer "submits to the jurisdiction of the Kingdom" (rule 8). Ask your AI vendor whether it will sign them as published. As for accreditation certificates, SDAIA issued the rules for licensing the bodies that will grant them in February 2026 and said it would announce later when it starts accepting applications ([SPA](https://www.spa.gov.sa/en/N2517131)). In August 2026 it put draft standards out for comment ([SPA](https://www.spa.gov.sa/en/N2648324)), and I found no announcement that any body has been licensed.

My reading, which a lawyer should test: daily production use of a foreign AI API with personal data fits none of these cases cleanly. A pilot limited in time and to a small number of people may fit case B with the standard clauses, and a Saudi subsidiary of an international group may fit case C for group systems. Case D has to wait for certified vendors. Until then, the clean options are keeping the processing inside the Kingdom, or removing the personal data before anything leaves. Anonymized data "shall no longer be considered as Personal Data" (Implementing Regulation, Article 9(2)). Pseudonymised data, where names become codes that extra data can reverse (Article 1(7)), is still personal data on my reading.

## The AI vendor as your processor

Article 8 of the Law lets you use only processors "providing the necessary guarantees" and makes you monitor them. Article 17(1) of the Implementing Regulation lists what the contract must say. It includes the purpose, the categories of data, the vendor's duty to report a breach to you "without undue delay", whether the vendor is subject to other countries' rules, and the subcontractors it uses. Under Article 17(4), a processor that breaks your instructions or the agreement "shall be considered as a Controller and held directly accountable". If your instructions forbid training on your data and the vendor trains on it anyway, on my reading it answers as a controller for that processing.

## Registration, the DPO and the impact assessment

SDAIA keeps a national register of controllers (Article 30(4)(c) of the Law). Its [registration rules](https://sdaia.gov.sa/Documents/TheRulesGoverningTheNationalRegisterOfControllersWithinTheKingdomPublicEN.pdf) require a controller to register if it is a public entity, if its "main activity is based on personal data processing", or if it processes sensitive data (Article 2). SDAIA's [breach procedure](https://sdaia.gov.sa/en/SDAIA/about/Documents/PersonalDataBreachIncidents.pdf) adds a practical reason, since breach notices go through the platform and "Registration on this platform is required to utilize such service." The rules cover controllers within the Kingdom and say "Separate registration rules for Controllers located outside the Kingdom will be issued by the Competent Authority." I have not found those rules, but the platform now offers [registration for entities outside the Kingdom](https://dgp.sdaia.gov.sa/wps/portal/pdp/Registration/external), after the Saudi Ministry of Foreign Affairs authenticates the company's documents. Its user guide is dated July 2026.

A data protection officer is required when the controller is a public entity that processes personal data on a large scale, when its core activities need "regular and systematic monitoring of Data Subjects", or when they are based on sensitive data (Implementing Regulation, Article 32(1)). SDAIA's [rules for appointing a DPO](https://sdaia.gov.sa/en/SDAIA/about/Documents/RulesforAppointingPersonalDataProtectionOfficer.pdf) list "Using behavioral analytics technologies for risk assessment purposes" among their examples of that monitoring (Article 5). A company whose core business is an AI system that scores customers for risk comes close to that example. The officer can be an employee or an external contractor (Article 32(2)).

Article 25(1) of the Implementing Regulation requires a written impact assessment for sensitive data, for linking datasets from different sources and for products likely to cause serious harm to privacy. It also requires one when the controller's activity includes "Processing Personal Data based on newly adopted technologies, or making decisions based on automated Personal Data Processing" (Article 25(1)(c)). Many AI systems fall under that last case. SDAIA's English qualifies it with "large scale and repetitive", while the Arabic says on a large scale or repeatedly, which catches more systems. The assessment covers, among other things, the legal basis, necessity, the likely impact on people and the measures against it (Article 25(2)), and a copy goes to any processor acting for you (Article 25(3)).

## Rights and automated decisions

People have the right to be informed, to access their data, to get a copy "in a readable and clear format", and to ask for correction or destruction (Article 4 of the Law). You have 30 days to act on a request, plus 30 more if you tell the person why in advance (Implementing Regulation, Article 3(1)(a)).

On automated decisions, the Implementing Regulation asks for three things. Controllers whose activities include new technologies or automated decisions, on a large scale or repeatedly, must tell people whether "decisions will be made based solely on automated Processing of Personal Data" (Article 4(5)(c)). Consent for such decisions must be explicit (Article 11(2)(c)). And they trigger an impact assessment (Article 25(1)(c)). I found no right to object to an automated decision, or to ask for human review, in the Law or the Implementing Regulation. The UAE PDPL has both, in its Article 18.

When you destroy personal data, you destroy "all copies of the Personal Data stored in the Controller's systems, including backups" (Implementing Regulation, Article 8(2)(c)). If the data sits in a search index, that is a delete query. If it sits in the weights of a fine-tuned model, it usually means retraining the model without it.

## Breaches and fines

Article 24(1) of the Implementing Regulation sets the clock: notify SDAIA "within a delay not exceeding (72) hours of becoming aware of the incident, if such incident potentially causes harm to the Personal Data, or to Data Subject or conflict with their rights or interests." Details you do not have yet follow "as soon as possible, along with justifications for the delay" (Article 24(2)), and the people affected are told without undue delay when the breach may damage their data or rights (Article 24(5)). A breach is "Any incident that leads to the Disclosure, Destruction, or unauthorized access to Personal Data, whether intentional or accidental" (Article 1(3)), so an AI agent that follows a hidden instruction in a document and emails out a customer list causes one.

Article 36(1) of the Law provides "a warning or a fine not exceeding (five million) Riyals" for violating the Law or the regulations, and the fine can be doubled for a repeat violation. Committees formed by SDAIA's president decide, and their decisions can be appealed in court (Article 36(2) and (3)). Disclosing or publishing sensitive data in breach of the Law, to harm the person or for personal benefit, is a crime, with up to two years in prison, a fine of up to 3 million riyals, or both (Article 35). People who suffer damage can also claim compensation in court (Article 40). The committees are using these powers: on 16 January 2026 the Saudi Press Agency reported 48 decisions confirming violations in 2025, including disclosure "without legal justification" and marketing messages sent without consent ([SPA](https://www.spa.gov.sa/en/N2489505)).

## What SDAIA says about AI

The Law never mentions AI. SDAIA has published guidance on it instead, and I found no penalty attached to that guidance.

The [AI Ethics Principles](https://sdaia.gov.sa/en/SDAIA/about/Documents/ai-principles.pdf) (document SDAIA-P114E, version 1, May 2025, linked on SDAIA's page as a draft) "shall apply to all AI stakeholders designing, developing, deploying, implementing, using, or being affected by AI systems within KSA". High-risk systems "must undergo pre- and post-conformity assessments", and systems with an "unacceptable risk", such as social profiling, "are not allowed". Decisions that are irreversible or hard to reverse "should trigger human oversight and final determination" (Principle 5). The compliance section, though, describes "Optional Registration" and "motivational badges". Whether the principles bind a private company is unclear to me.

The [Generative AI Guidelines for Public](https://sdaia.gov.sa/en/SDAIA/about/Files/GenerativeAIPublicEN.pdf) (SDAIA-P115E, May 2025) call themselves "guidance for the public including developers and users of GenAI". Two lines belong in any staff AI policy: "Organizations should implement policies for GenAI use that prohibits users from entering classified information into third-party tools" (section 5.4), and "It is users’ responsibility to verify the content generated by GenAI" (section 5.3). The [version for government entities](https://sdaia.gov.sa/en/SDAIA/about/Files/GenAIGuidelinesForGovernmentENCompressed.pdf) says generative AI tools should be limited to data classified as "public" (section 3.5), and its definition of users includes contractors.

SDAIA's platform also runs an [accreditation for AI service providers](https://dgp.sdaia.gov.sa/wps/portal/pdp/services/aiserviceprovideraccreditation). The provider appoints an AI officer and fills in a questionnaire for each product; after a committee review, the product gets a motivational badge and the provider a certificate (my translation of the Arabic page). The Saudi Press Agency reported on 6 October 2026 that SDAIA had opened two months of registration for a personal data protection track in its Data Regulatory Sandbox, for licensed private entities in the Kingdom whose products process personal data ([SPA](https://www.spa.gov.sa/en/N2693981)).

## Saudi PDPL and UAE PDPL, side by side

| | Saudi PDPL | UAE PDPL |
| --- | --- | --- |
| Legal basis | Consent, or a case in Article 6, legitimate interest included when no sensitive data is processed | Consent, or an exception in Article 4; no legitimate interests |
| Breach notice to the regulator | Within 72 hours when the breach may cause harm (Implementing Regulation, Article 24) | Deadline left to executive regulations (Article 9) |
| Transfers abroad | Permitted purpose, adequacy assessed by SDAIA and minimum data (Article 29), or an exemption case with a safeguard | Countries the regulator approves (Article 22), or cases such as explicit consent (Article 23) |
| Automated decisions | Notice, explicit consent where consent is the basis, impact assessment; no right to object found | Right to object, human review on request (Article 18) |
| Fines | Warning or up to 5 million riyals, doubled for a repeat violation (Article 36) | Left to a Cabinet decision (Article 26) |

The UAE column comes from my [UAE PDPL guide](/guides/uae-pdpl-ai/), where the executive regulations were still missing in October 2026. For a company on both sides of the border, the Saudi side is the more detailed today, with a fixed breach deadline and a transfer regulation in force.

## The AI setup I would sign off on

This is the part of Saudi PDPL compliance that lives in the code:

1. **Processing inside the Kingdom where you can.** A cloud region in Saudi Arabia, or a model on your own hardware, removes the transfer question for that processing. [My own coding assistant](/case-studies/local-ai-stack/) runs on hardware I own, with the model server bound to the machine's loopback address and no inbound public port on the box. Remote access by staff abroad can still count as a transfer.
2. **Personal data removed before any call abroad.** Strip names, ID numbers and phone numbers when the task allows. If what is left can still be linked to a person, treat it as personal data and write down the transfer route and the risk assessment.
3. **Access rights inside the search.** For a global enterprise with thirty brands, I put each user's permission groups into the vector query itself, so the search never reads a document that user may not open ([document AI at scale](/case-studies/document-intelligence-at-scale/)).
4. **One gateway for every model call.** At a regulated enterprise where I built an [evaluation harness](/case-studies/agent-eval/), a mandatory private gateway handles authentication, quotas, logging and the list of allowed models. Its logs show which data went to which model and where. That helps with the record of transfers abroad (Implementing Regulation, Article 33(5)(g)) and with the 72-hour clock.
5. **Personal data kept in an index.** When personal data stays in an index you control and out of fine-tuned weights, a destruction request is a delete query, backups included.
6. **Human review of decisions about people.** If the system scores or ranks people, a reviewer signs off, and the notice says whether any decision is solely automated.

Back to the sales team in Riyadh. The complaint now goes to a model that runs inside the Kingdom, through a gateway that logs it, and the customer's name never crosses the border. When SDAIA publishes its list of adequate countries, or the first certified vendors appear, the transfer section is the one I expect to rewrite.
