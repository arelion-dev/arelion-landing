// The two decision tools on guide pages (src/tools): every combination of
// answers, and every text they show checked against the guide it comes from,
// so a guide edit that changes a number fails here until the tool says the
// same. The page checks need `npm run build` first; without public/ they are
// skipped.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const matter = require("gray-matter")
const ocr = require("../src/tools/ocr-picker.js")
const automate = require("../src/tools/automate-first.js")

const ROOT = new URL("..", import.meta.url).pathname
const GUIDES_DIR = join(ROOT, "content/guides")
const PUBLIC = join(ROOT, "public")

const guide = file => matter(readFileSync(join(GUIDES_DIR, file), "utf8"))
// A guide's text as a reader sees it: no bold markers, links reduced to their words.
const prose = text => text.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
// One "## " section of a guide body, heading included.
const section = (body, heading) => {
  const start = body.indexOf(`\n## ${heading}\n`)
  assert.ok(start >= 0, `no section "${heading}"`)
  const end = body.indexOf("\n## ", start + 1)
  return body.slice(start, end < 0 ? undefined : end)
}
// Figures in a text: 1.9%, 10, 0.3, $5 (of $5M), 3.8...
const figures = text => text.match(/\$?\d+(?:[.,]\d+)*%?/g) || []

const OCR_GUIDE = guide("arabic-ocr.md")
const PDF_GUIDE = guide("arabic-pdf-to-text.md")
const AUTOMATION_GUIDE = guide("ai-automation-uae.md")
const OCR_RULES = prose(section(OCR_GUIDE.content, "Which Arabic OCR to use"))
const OCR_LIMITS = prose(section(OCR_GUIDE.content, "What this test does not cover"))
const PDF_TEXT = prose(PDF_GUIDE.content)
const AUTOMATION_RULES = prose(section(AUTOMATION_GUIDE.content, "What to automate first"))

// The bullet of a guide section that starts with a bold label, as "- Label: text".
const bullet = (text, label) => {
  const line = text.split("\n").find(l => l.startsWith(`- ${label}`))
  assert.ok(line, `no bullet "${label}"`)
  return line
}

// ---- Which Arabic OCR for your pages? ----

const ENGINE = { [ocr.WHERE.cloud]: "Gemini 3.8 Flash", [ocr.WHERE.mac]: "Apple's Live Text API", [ocr.WHERE.server]: "Surya" }
const OCR_ANSWERS = Object.values(ocr.PAGES).flatMap(pages =>
  Object.values(ocr.WHERE).map(where => ({ pages, where, result: ocr.pickOcr({ pages, where }) })),
)

test("the OCR picker gives the guide's rule for every pair of answers", () => {
  assert.equal(OCR_ANSWERS.length, 9)
  for (const { pages, where, result } of OCR_ANSWERS) {
    const at = `${pages} + ${where}`
    if (pages === ocr.PAGES.handwriting) {
      // The benchmark is printed pages only: no engine to name, wherever the pages may go.
      assert.equal(result.key, "handwriting", at)
      assert.equal(result.pick.title, "Printed text only", at)
      assert.equal(result.pdf, null, at)
    } else {
      assert.equal(result.key, `${pages}_${where}`, at)
      assert.equal(result.pick.title, ENGINE[where], at)
      // Born-digital PDFs also get what the PDF guide measured.
      assert.equal(result.pdf !== null, pages === ocr.PAGES.pdf, at)
    }
    // Every answer ends with what not to use and the twenty-page check.
    assert.match(result.avoid.text, /^Tesseract/, at)
    assert.match(result.check, /twenty of your own pages/, at)
  }
  assert.equal(new Set(OCR_ANSWERS.map(a => a.result.key)).size, 7)
})

test("the OCR picker refuses an answer its form does not offer", () => {
  assert.throws(() => ocr.pickOcr({ pages: "typed", where: ocr.WHERE.cloud }), /unknown kind of pages/)
  assert.throws(() => ocr.pickOcr({ pages: ocr.PAGES.pdf, where: null }), /unknown place/)
  assert.throws(() => ocr.pickOcr({ pages: ocr.PAGES.handwriting, where: "phone" }), /unknown place/)
})

test("every OCR answer shows its guide line word for word", () => {
  for (const { pages, where, result } of OCR_ANSWERS) {
    const at = `${pages} + ${where}`
    const { label, title, text } = result.pick
    if (pages === ocr.PAGES.handwriting) {
      assert.ok(OCR_GUIDE.content.includes(`\n## ${label}\n`), `${at}: "${label}" is not a section of the guide`)
      assert.equal(`- ${title}. ${text.join(" ")}`, bullet(OCR_LIMITS, title), at)
    } else {
      assert.equal(`- ${label}: ${title}. ${text.join(" ")}`, bullet(OCR_RULES, `${label}:`), at)
    }
    assert.equal(`- ${result.avoid.lead} ${result.avoid.text}`, bullet(OCR_RULES, result.avoid.lead), at)
    assert.ok(OCR_RULES.includes(`\n${result.check} `), `${at}: the closing advice changed`)
    if (result.pdf) {
      assert.ok(PDF_GUIDE.content.includes(`\n## ${result.pdf.label}\n`), `${at}: "${result.pdf.label}" is not a section of the PDF guide`)
      for (const sentence of result.pdf.text) assert.ok(PDF_TEXT.includes(sentence), `${at}: the PDF guide no longer says "${sentence}"`)
      assert.equal(result.pdf.link.label, PDF_GUIDE.data.title)
      assert.equal(result.pdf.link.to, PDF_GUIDE.data.path)
    }
  }
})

// The figures each answer shows, listed as a fact-checker would read them.
const FIGURES = {
  [ocr.WHERE.cloud]: ["1.9%", "10 real pages", "a third of a cent", "1.6%", "1.8 cents"],
  [ocr.WHERE.mac]: ["5.0%", "0.3 seconds a page", "0.3% on the law pages"],
  [ocr.WHERE.server]: ["3.9%", "15 seconds a page", "$5M"],
}

test("each OCR answer shows the figures of its guide rule, and no other figure", () => {
  for (const where of Object.values(ocr.WHERE)) {
    const { pick } = ocr.pickOcr({ pages: ocr.PAGES.printed, where })
    const shown = [pick.title, ...pick.text].join(" ")
    const line = bullet(OCR_RULES, `${pick.label}:`)
    for (const f of FIGURES[where]) {
      assert.ok(shown.includes(f), `${where}: the tool no longer shows ${f}`)
      assert.ok(line.includes(f), `${where}: the guide's rule no longer says ${f}`)
    }
    for (const f of figures(shown)) assert.ok(line.includes(f), `${where}: ${f} is not in the guide's rule`)
  }
  const { pdf } = ocr.pickOcr({ pages: ocr.PAGES.pdf, where: ocr.WHERE.mac })
  assert.deepEqual(figures(pdf.text.join(" ")), ["7.6%"])
  assert.ok(PDF_TEXT.includes("still got 7.6% of the characters wrong on the Dubai law"))
  const { pick: handwriting } = ocr.pickOcr({ pages: ocr.PAGES.handwriting, where: ocr.WHERE.cloud })
  assert.deepEqual(figures(handwriting.text.join(" ")), [])
  // The title, the questions and the buttons carry no figure.
  const copy = [...Object.values(ocr.COPY), ...ocr.QUESTIONS.flatMap(q => [q.legend, ...q.options.map(o => o.label)])]
  assert.deepEqual(figures(copy.join(" ")), [])
})

// ---- What to automate first ----

const V = automate.VERDICT
const R = automate.REASON
const KEYS = automate.QUESTIONS.map(q => q.key)
const PASS = { recurs: true, checkable: true, dataInTools: true, unreviewedDecision: false, writtenDown: true }
const task = (name, hours, answers = PASS) => ({ id: name, name, hours, answers })

test("what to automate first gives every combination of answers the verdict of the guide's rules", () => {
  // The guide's three tests, then its two things left for later.
  assert.deepEqual(KEYS, ["recurs", "checkable", "dataInTools", "unreviewedDecision", "writtenDown"])
  const seen = new Set()
  for (let n = 0; n < 2 ** KEYS.length; n++) {
    const a = Object.fromEntries(KEYS.map((k, i) => [k, Boolean(n & (2 ** i))]))
    const at = JSON.stringify(a)
    const [{ verdict, reasons }] = automate.rankTasks([task("t", null, a)])
    seen.add(verdict)
    // Start here: passes the three tests, and neither thing left for later applies.
    const passes = a.recurs && a.checkable && a.dataInTools
    assert.equal(verdict === V.startHere, passes && !a.unreviewedDecision && a.writtenDown, at)
    // An unreviewed legal or financial decision, or a task that fails the recurrence
    // or the checking test, is left for later.
    assert.equal(verdict === V.later, a.unreviewedDecision || !a.recurs || !a.checkable, at)
    // Otherwise an unwritten process is written down first, then data that is not
    // in the tools starts with a company brain.
    if (verdict !== V.later) {
      assert.equal(verdict === V.writeDown, !a.writtenDown, at)
      assert.equal(verdict === V.companyBrain, a.writtenDown && !a.dataInTools, at)
    }
    // Every answer that holds the task back is explained, in the guide's order.
    const held = [
      !a.recurs && R.notRecurring,
      !a.checkable && R.notCheckable,
      !a.dataInTools && R.dataNotInTools,
      a.unreviewedDecision && R.unreviewedDecision,
      !a.writtenDown && R.notWrittenDown,
    ].filter(Boolean)
    assert.deepEqual(reasons, held.length ? held : [R.passes], at)
  }
  assert.deepEqual([...seen].sort(), Object.values(V).sort())
})

test("tasks to start with come first, most hours a month on top; the others keep the visitor's order", () => {
  const order = tasks => automate.rankTasks(tasks).map(t => t.name)
  assert.deepEqual(order([task("a", 10), task("b", 40), task("c", 20)]), ["b", "c", "a"])
  // No hours typed: the visitor's order stands.
  assert.deepEqual(order([task("a", null), task("b", null), task("c", null)]), ["a", "b", "c"])
  // Tasks with hours go before tasks without; equal hours keep the visitor's order.
  assert.deepEqual(order([task("a", null), task("b", 5), task("c", null), task("d", 30), task("e", 5)]), ["d", "b", "e", "a", "c"])
  // Zero is an answer, not a missing one.
  assert.deepEqual(order([task("a", null), task("b", 0)]), ["b", "a"])
  // Hours rank only the tasks to start with: the rest follow in the visitor's order.
  const notRecurring = { ...PASS, recurs: false }
  const unwritten = { ...PASS, writtenDown: false }
  assert.deepEqual(order([task("x", 90, notRecurring), task("a", 5), task("y", 80, unwritten), task("b", 50)]), ["b", "a", "x", "y"])
  assert.deepEqual(order([]), [])
})

test("the hours field reads a number of hours, or nothing", () => {
  for (const raw of [null, undefined, "", "  ", "abc", "-2", "Infinity"]) assert.equal(automate.parseHours(raw), null, String(raw))
  assert.equal(automate.parseHours("12"), 12)
  assert.equal(automate.parseHours("7.5"), 7.5)
  assert.equal(automate.parseHours("0"), 0)
  assert.equal(automate.hoursLabel(1), "1 hour a month")
  assert.equal(automate.hoursLabel(7.5), "7.5 hours a month")
})

test("the analytics label of a submit counts the verdicts and never carries a task name", () => {
  const ranked = automate.rankTasks([
    task("Monthly client report", 12),
    task("Contract sign-off", null, { ...PASS, unreviewedDecision: true }),
    task("Staff questions", 3, { ...PASS, dataInTools: false }),
  ])
  const key = automate.resultKey(ranked)
  assert.equal(key, "start_here:1,write_down:0,company_brain:1,later:1")
  assert.doesNotMatch(key, /Monthly|Contract|Staff/)
})

// The guide words each explanation and question carries.
const QUOTED = {
  passes: "I start with the tasks that pass three tests.",
  notRecurring: "every week or every month in the same shape",
  notCheckable: "check the output in a few minutes",
  dataNotInTools: "If the knowledge lives in people's heads, start with a company brain so the system has something to read.",
  unreviewedDecision: "with legal or financial weight that nobody reviews",
  notWrittenDown: "When a process is unclear, the first weeks go into writing it down with the people who do it.",
}
const ASKED = [
  "every week or every month in the same shape",
  "check the output in a few minutes",
  "accounting, CRM, analytics, shared drives",
  "with legal or financial weight that nobody reviews",
  "written down",
]

test("what to automate first explains each verdict in the guide's own words", () => {
  assert.equal(automate.COPY.title, "What to automate first")
  assert.deepEqual(Object.keys(R).sort(), Object.keys(QUOTED).sort())
  for (const [reason, quote] of Object.entries(QUOTED)) {
    assert.ok(R[reason].text.includes(quote), `${reason} no longer quotes the guide`)
    assert.ok(AUTOMATION_RULES.includes(quote), `the guide no longer says "${quote}"`)
  }
  automate.QUESTIONS.forEach((q, i) => {
    assert.ok(q.legend.includes(ASKED[i]), q.legend)
    assert.ok(AUTOMATION_RULES.includes(ASKED[i]), ASKED[i])
  })
  // The company brain link goes where the guide's own link goes.
  const { label, to } = R.dataNotInTools.link
  assert.ok(AUTOMATION_GUIDE.content.includes(`[${label}](${to})`))
  assert.equal(to, guide("company-brain.md").data.path)
})

test("what to automate first shows no figure of its own, so not the guide's 30 people either", () => {
  const texts = [
    ...Object.values(automate.COPY),
    ...automate.QUESTIONS.map(q => q.legend),
    ...Object.values(automate.VERDICT_LABEL),
    ...Object.values(R).map(r => r.text),
  ]
  for (const t of texts) assert.doesNotMatch(t, /\d/, t)
  assert.ok(automate.MAX_TASKS === 5 && automate.COPY.intro.includes("up to five"))
})

// ---- Shared ----

// The hook is an ES module in a CommonJS package: load it from its source text.
const hook = await import(
  `data:text/javascript,${encodeURIComponent(readFileSync(join(ROOT, "src/hooks/use-track-event.js"), "utf8"))}`
)

test("a tool result reaches analytics as one tool event: the tool and the result key, nothing else", () => {
  const calls = []
  globalThis.window = { gtag: (...args) => calls.push(args) }
  try {
    hook.trackToolResult(ocr.TOOL_ID, "pdf_mac")
    hook.trackToolResult(automate.TOOL_ID, "start_here:1,write_down:0,company_brain:0,later:0")
  } finally {
    delete globalThis.window
  }
  assert.deepEqual(calls, [
    ["event", "tool", { event_category: "ocr_picker", event_label: "pdf_mac" }],
    ["event", "tool", { event_category: "automate_first", event_label: "start_here:1,write_down:0,company_brain:0,later:0" }],
  ])
  assert.equal(ocr.LEAD_LOCATION, "tool_ocr_picker")
  assert.equal(automate.LEAD_LOCATION, "tool_automate_first")
})

const TOOL_FILES = [
  "src/tools/ocr-picker.js",
  "src/tools/automate-first.js",
  "src/components/ocr-picker.js",
  "src/components/automate-first.js",
  "src/components/tool-cta.js",
]

test("the tools' code and texts hold no em dash and no en dash", () => {
  for (const f of TOOL_FILES) assert.doesNotMatch(readFileSync(join(ROOT, f), "utf8"), /[\u2013\u2014]/, f)
})

// ---- The built pages ----

const built = existsSync(join(PUBLIC, "index.html"))
const skip = !built && "no build in public/"
const walk = dir =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".html") ? [join(dir, e.name)] : [],
  )
// Text as React writes it into HTML.
const escaped = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;")
const TOOL_PAGES = { [ocr.ANCHOR]: "arabic-ocr/index.html", [automate.ANCHOR]: "ai-automation-uae/index.html" }

test("two guides embed a tool: the OCR picker and what to automate first", () => {
  const embedded = readdirSync(GUIDES_DIR)
    .filter(f => f.endsWith(".md"))
    .map(f => [f, guide(f).data])
    .filter(([, data]) => data.tool)
  assert.deepEqual(Object.fromEntries(embedded.map(([f, data]) => [f, data.tool])), {
    "ai-automation-uae.md": automate.ANCHOR,
    "arabic-ocr.md": ocr.ANCHOR,
  })
  // TOOL_PAGES follows the guides' own paths.
  for (const [file, data] of embedded) assert.equal(TOOL_PAGES[data.tool], `${data.path.replace(/^\//, "")}index.html`, file)
})

test("each tool page shows its form between the lead and the article, and no other page has a tool", { skip }, () => {
  const tools = {}
  for (const [anchor, page] of Object.entries(TOOL_PAGES)) {
    const doc = readFileSync(join(PUBLIC, page), "utf8")
    const at = doc.indexOf(`<section id="${anchor}"`)
    assert.ok(at > 0, `${page}: no #${anchor}`)
    assert.ok(doc.indexOf('class="cs-detail-date"') < at, `${page}: the tool is above the lead`)
    assert.ok(at < doc.indexOf('class="cs-section cs-article"'), `${page}: the tool is below the article`)
    tools[anchor] = doc.slice(at, doc.indexOf("</section>", at))
    assert.match(tools[anchor], /<form>/, page)
    assert.match(tools[anchor], /<div class="tool-result" aria-live="polite"><\/div>/, page)
    // Disabled until React runs, so the browser cannot send the answers in the URL.
    assert.match(tools[anchor], /<button type="submit"[^>]*disabled=""/, page)
  }
  const picker = tools[ocr.ANCHOR]
  assert.ok(picker.includes(`>${escaped(ocr.COPY.title)}</h2>`))
  for (const q of ocr.QUESTIONS) assert.ok(picker.includes(`<legend>${escaped(q.legend)}</legend>`), q.legend)
  const attr = (attrs, name) => (attrs.match(new RegExp(`${name}="([^"]*)"`)) || [])[1]
  const options = [...picker.matchAll(/<label class="tool-option"><input ([^>]*)\/>([^<]*)<\/label>/g)].map(([, attrs, label]) => ({
    name: attr(attrs, "name"),
    value: attr(attrs, "value"),
    required: attr(attrs, "required") === "",
    label,
  }))
  const offered = ocr.QUESTIONS.flatMap(q => q.options.map(o => ({ name: q.name, value: o.value, required: true, label: escaped(o.label) })))
  assert.deepEqual(options, offered)
  const automation = tools[automate.ANCHOR]
  assert.ok(automation.includes(`>${escaped(automate.COPY.title)}</h2>`))
  assert.ok(automation.includes('<input type="text" name="name-1" required=""'))
  for (const q of automate.QUESTIONS) assert.ok(automation.includes(`<legend>${escaped(q.legend)}</legend>`), q.legend)
  assert.equal(automation.match(/type="radio"/g).length, 2 * automate.QUESTIONS.length)

  const pages = walk(PUBLIC).map(f => f.slice(PUBLIC.length + 1))
  assert.ok(pages.length > 20, `only ${pages.length} pages built`)
  for (const page of pages) {
    const doc = readFileSync(join(PUBLIC, page), "utf8")
    const own = Object.keys(TOOL_PAGES).filter(anchor => TOOL_PAGES[anchor] === page)
    const found = Object.keys(TOOL_PAGES).filter(anchor => doc.includes(`id="${anchor}"`))
    assert.deepEqual(found, own, page)
    // Gatsby inlines the CSS in every page, so look for the class on an element.
    assert.equal(doc.includes('class="sim-panel tool-panel"'), own.length > 0, page)
  }
})
