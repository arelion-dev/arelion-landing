// "Which parts of Regulation 10 concern your AI use?": the closing section of the
// DIFC guide (content/guides/difc-data-protection-ai.md, "Which parts concern
// your firm") as three questions. Plain CommonJS with no React, so the tests can
// require it; the component (src/components/reg10-check.js) only renders what
// this module returns.
//
// Every text an answer shows is copied word for word from the guide, so the tool
// says what the guide says and nothing more. test/tools.test.mjs checks each one
// against the markdown: a guide edit that changes a line fails the test until
// the tool says the same.

// Anchor on the page, and the `tool` value a guide's frontmatter uses to embed it.
const ANCHOR = "reg10-check"
// Analytics: the tool in the `tool` event, the place in generate_lead.
const TOOL_ID = "reg10_check"
const LEAD_LOCATION = "tool_reg10_check"

const FIRM = { difc: "difc", reach: "reach", onshore: "onshore" }
const AI = { own: "own", vendor: "vendor", none: "none" }
const USE = { assist: "assist", decide: "decide" }

const COPY = {
  title: "Which parts of Regulation 10 concern your AI use?",
  intro: "Three questions. The answer is this guide's text for your case. It is not legal advice.",
  submit: "Show the answer",
  details: "Details in",
  cta: "Want this checked on your own system?",
}

const QUESTIONS = [
  {
    name: "firm",
    legend: "Where is your firm?",
    options: [
      { value: FIRM.difc, label: "Incorporated in the DIFC" },
      { value: FIRM.reach, label: "Incorporated elsewhere, with staff, clients or an office in the DIFC" },
      { value: FIRM.onshore, label: "Onshore UAE, with no activity in the DIFC" },
    ],
  },
  {
    name: "ai",
    legend: "Does personal data go into an AI system?",
    options: [
      { value: AI.own, label: "Yes, into a system we built or had built" },
      { value: AI.vendor, label: "Yes, into ChatGPT or a similar tool" },
      { value: AI.none, label: "No personal data goes in" },
    ],
  },
  {
    name: "use",
    legend: "What does the system do with it?",
    options: [
      { value: USE.assist, label: "It helps staff, and a person decides" },
      { value: USE.decide, label: "It evaluates people or decides alone, with legal or similar effects" },
    ],
  },
]

// "Which parts concern your firm": one bullet per block, its bold label and its
// sentences. Who the law reaches, by where the firm is.
const FIRMS = {
  [FIRM.difc]: {
    label: "Incorporated in the DIFC",
    text: ["the law applies to your processing wherever it takes place (Article 6(3))."],
  },
  [FIRM.reach]: {
    label: "Incorporated elsewhere, active in the DIFC",
    text: [
      "the law applies to processing in the DIFC as part of stable arrangements, including transfers out of the DIFC.",
      'How far "stable arrangements" goes is a question for your lawyer.',
    ],
  },
  [FIRM.onshore]: {
    label: "No activity in the DIFC",
    text: [
      "onshore companies mostly follow the federal law.",
      "The DIFC law can still reach them through stable arrangements, as the Careem decision shows.",
    ],
    // The guide's own link, in "Who must follow the DIFC Data Protection Law".
    link: { to: "/guides/uae-pdpl-ai/", label: "UAE PDPL and AI" },
  },
}

// What the firm is under Regulation 10, by the system the personal data goes into.
const SYSTEMS = {
  [AI.own]: {
    label: "A system you built or had built",
    text: [
      "where the law applies, you are the Deployer, treated as a controller (Regulation 10.3.4).",
      "Whoever runs the System for you is the Operator, treated as a processor.",
    ],
  },
  [AI.vendor]: {
    label: "ChatGPT or a similar tool",
    text: [
      "on my reading, where the law applies, you are the Deployer once client personal data goes in, and the duties stay with you.",
      "Check where the data goes: the adequacy list does not name the United States as a whole, and elsewhere you need an Article 27 safeguard or one of its narrow derogations.",
      "How the notice at first use works for a tool your clients never see is unclear to me.",
    ],
  },
  [AI.none]: {
    label: "No personal data in the system",
    text: ["Regulation 10 defines a System as one that processes personal data."],
  },
}

const EVERY_SYSTEM = {
  label: "Every System",
  text: [
    "the Article 9 principles, notice at first use, evidence and a register on request, the design concepts of 10.3.1, and the commercial-use limits of 10.3.2.",
  ],
}

// A person deciding does not rule out high-risk processing: the guide's other case of it.
const PERSON_DECIDES = {
  label: "When a person decides",
  text: [
    "many AI projects can still meet Schedule 1's definition of high-risk processing, which includes new technologies that materially increase risk.",
  ],
}

const HIGH_RISK = {
  label: "High-risk processing",
  text: [
    "only with a certified System, for human-defined or approved purposes, and with an Autonomous Systems Officer.",
    "Under Article 38, a person can also require a manual review of a decision based solely on automated processing that has legal or seriously impactful consequences.",
  ],
}

// Shown under every answer: the sentence of the guide's introduction.
const NOTICE = "This page is not legal advice: I am an engineer, and a lawyer should check any decision you base on it."

// The answer to one set of choices: the guide's lines for that case, in the
// guide's order. `key` is the analytics label. Throws on a value the form does
// not offer.
const checkReg10 = ({ firm, ai, use }) => {
  if (!Object.values(FIRM).includes(firm)) throw new Error(`unknown firm: ${firm}`)
  if (!Object.values(AI).includes(ai)) throw new Error(`unknown AI system: ${ai}`)
  if (!Object.values(USE).includes(use)) throw new Error(`unknown use of the system: ${use}`)
  if (firm === FIRM.onshore) return { key: FIRM.onshore, blocks: [FIRMS[firm]], notice: NOTICE }
  if (ai === AI.none) return { key: `${firm}_${ai}`, blocks: [FIRMS[firm], SYSTEMS[ai]], notice: NOTICE }
  const blocks = [FIRMS[firm], SYSTEMS[ai], EVERY_SYSTEM, use === USE.decide ? HIGH_RISK : PERSON_DECIDES]
  return { key: `${firm}_${ai}_${use}`, blocks, notice: NOTICE }
}

module.exports = { ANCHOR, TOOL_ID, LEAD_LOCATION, FIRM, AI, USE, COPY, QUESTIONS, checkReg10 }
