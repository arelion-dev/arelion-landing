// "Which Arabic OCR for your pages?": the closing advice of the Arabic OCR guide
// (content/guides/arabic-ocr.md, "Which Arabic OCR to use") as two questions.
// Plain CommonJS with no React, so the tests can require it; the component
// (src/components/ocr-picker.js) only renders what this module returns.
//
// Every text an answer shows is copied word for word from a guide, so the tool
// says what the benchmark measured and nothing more. test/tools.test.mjs checks
// each one against the markdown: a guide edit that changes a number fails the
// test until the tool says the same.

// Anchor on the page, and the `tool` value a guide's frontmatter uses to embed it.
const ANCHOR = "ocr-picker"
// Analytics: the tool in the `tool` event, the place in generate_lead.
const TOOL_ID = "ocr_picker"
const LEAD_LOCATION = "tool_ocr_picker"

const PAGES = { pdf: "pdf", printed: "printed", handwriting: "handwriting" }
const WHERE = { cloud: "cloud", mac: "mac", server: "server" }

const COPY = {
  title: "Which Arabic OCR for your pages?",
  intro: "Two questions. The answer comes from my tests.",
  submit: "Show the answer",
  details: "Details in",
  cta: "Want this tested on your own pages?",
}

const QUESTIONS = [
  {
    name: "pages",
    legend: "What are your pages?",
    options: [
      { value: PAGES.pdf, label: "Born-digital PDFs, with text you can select" },
      { value: PAGES.printed, label: "Scans or photos of printed pages" },
      { value: PAGES.handwriting, label: "Handwriting" },
    ],
  },
  {
    name: "where",
    legend: "Where may the pages go?",
    options: [
      { value: WHERE.cloud, label: "A cloud API is fine" },
      { value: WHERE.mac, label: "They must stay on our Macs" },
      { value: WHERE.server, label: "They must stay on our own servers" },
    ],
  },
]

// "Which Arabic OCR to use": one rule per place the pages may go.
const PICKS = {
  [WHERE.cloud]: {
    label: "When the pages may go to a cloud API",
    title: "Gemini 3.8 Flash",
    text: [
      "1.9% wrong on the 10 real pages, at a third of a cent a page.",
      "Gemini 3.5 Flash did slightly better (1.6%) for about 1.8 cents.",
    ],
  },
  [WHERE.mac]: {
    label: "On a Mac",
    title: "Apple's Live Text API",
    text: [
      "5.0% wrong on real pages, 0.3 seconds a page, free, and the pages never leave the machine.",
      "On clean single-column pages, Apple Vision does even better (0.3% on the law pages), as long as you sort out the reading order.",
    ],
  },
  [WHERE.server]: {
    label: "On your own server",
    title: "Surya",
    text: [
      "The fewest errors of the free engines on real pages (3.9%), about 15 seconds a page on an Apple M5 Pro, and a license to check: free for research, personal use and startups under $5M in funding or revenue, paid above.",
    ],
  },
}

// "What this test does not cover": every page in the benchmark is printed.
const HANDWRITING = {
  label: "What this test does not cover",
  title: "Printed text only",
  text: [
    "No handwriting, no ID cards, no invoices or stamped forms. I looked for public sets of those with full-page transcriptions and a license that lets me publish results, and I found none.",
  ],
}

// From the Arabic PDF guide (content/guides/arabic-pdf-to-text.md): a PDF that
// carries its own text still reads better as an image.
const PDF = {
  label: "OCR the rendered page instead",
  text: [
    "On these Arabic PDFs, OCR of the rendered page beat every text extractor I tested.",
    "The best one, pdfplumber with its right-to-left option, still got 7.6% of the characters wrong on the Dubai law and missed a quarter of its words.",
  ],
  link: { to: "/guides/arabic-pdf-to-text/", label: "Arabic PDF to Word or text: why copy-paste fails" },
}

// Shown under every answer, handwriting included.
const AVOID = {
  lead: "What I would not use on Arabic with default settings:",
  text: "Tesseract, and the tools built on it; PaddleOCR 3 without shrinking the page; Docling with EasyOCR.",
}
const CHECK = "Whichever you pick, run it on twenty of your own pages and read the output next to the page."

// The answer to one pair of choices. `key` is the analytics label. Throws on a
// value the form does not offer.
const pickOcr = ({ pages, where }) => {
  if (!Object.values(PAGES).includes(pages)) throw new Error(`unknown kind of pages: ${pages}`)
  if (!Object.values(WHERE).includes(where)) throw new Error(`unknown place for the pages: ${where}`)
  const notes = { avoid: AVOID, check: CHECK }
  if (pages === PAGES.handwriting) return { key: PAGES.handwriting, pdf: null, pick: HANDWRITING, ...notes }
  return { key: `${pages}_${where}`, pdf: pages === PAGES.pdf ? PDF : null, pick: PICKS[where], ...notes }
}

module.exports = { ANCHOR, TOOL_ID, LEAD_LOCATION, PAGES, WHERE, COPY, QUESTIONS, pickOcr }
