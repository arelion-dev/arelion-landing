// Case studies are sorted by what I sell (offers) and client work is kept
// apart from my own projects (lab). The output checks need `npm run build` first.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const require = createRequire(import.meta.url)
// Without NODE_ENV=development this is the published list, as in production.
const CASE_STUDIES = require("../src/data/case-studies.js")
const { OFFERS, offersOf } = require("../src/data/offers.js")

const ROOT = new URL("..", import.meta.url).pathname
const PUBLIC = join(ROOT, "public")
const built = existsSync(join(PUBLIC, "index.html"))
const html = p => readFileSync(join(PUBLIC, p, "index.html"), "utf8")
const OFFER_NAMES = new Set(OFFERS.map(o => o.name))
// Gatsby adds attributes such as data-gatsby-head to the tag, so match any attribute list.
const jsonLd = page =>
  [...page.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].flatMap(m => [].concat(JSON.parse(m[1])))
const metaContent = (page, attr, name) => {
  const m = page.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))
  return m && m[1].replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
}
// Same lists as the writing rules and the guides test.
const FILLER = ["crucial", "robust", "leverage", "delve", "seamless", "cutting-edge", "game-changer", "unlock", "empower", "landscape", "load-bearing"]
const CLIENTS = /L['’]Or[ée]al|Free Malaysia Today|\bFMT\b/i

test("every published case study is filed under known offers", () => {
  for (const cs of CASE_STUDIES) {
    assert.ok(Array.isArray(cs.offers) && cs.offers.length > 0, `${cs.slug}: no offers`)
    for (const o of cs.offers) assert.ok(OFFER_NAMES.has(o), `${cs.slug}: unknown offer ${o}`)
  }
})

test("client work leads with a short business result, my own projects do not", () => {
  for (const cs of CASE_STUDIES) {
    if (cs.lab) {
      assert.equal(cs.outcome, undefined, `${cs.slug}: lab projects keep their title`)
      continue
    }
    const line = cs.outcome && cs.outcome.en
    assert.ok(line, `${cs.slug}: client work needs an outcome`)
    assert.ok(line.length <= 90, `${cs.slug}: outcome is ${line.length} characters`)
    assert.doesNotMatch(line, /[–—]/, `${cs.slug}: dash in outcome`)
  }
})

test("the index shows client work first and the lab apart", { skip: !built && "no build in public/" }, () => {
  const page = html("case-studies")
  const client = page.indexOf(">Client work</h2>")
  const lab = page.indexOf(">Lab</h2>")
  assert.ok(client > 0 && lab > client, "Client work heading, then Lab heading")
  for (const cs of CASE_STUDIES) {
    const at = page.indexOf(`href="/case-studies/${cs.slug}/"`)
    assert.ok(at > 0, `${cs.slug} missing from the index`)
    assert.ok(cs.lab ? at > lab : at < lab, `${cs.slug} is in the wrong section`)
  }
})

test("the home carousel shows client work only", { skip: !built && "no build in public/" }, () => {
  const home = html("")
  const start = home.indexOf('class="cs-carousel-section"')
  assert.ok(start > 0, "no case studies carousel on the home page")
  const carousel = home.slice(start, home.indexOf("</section>", start))
  const linked = [...carousel.matchAll(/href="\/case-studies\/([^"/]+)\/"/g)].map(m => m[1])
  assert.ok(linked.length > 0, "the carousel links no case study")
  for (const slug of linked) {
    const cs = CASE_STUDIES.find(c => c.slug === slug)
    assert.ok(cs && !cs.lab, `${slug} on the home carousel is not client work`)
    assert.ok(offersOf(cs).length > 0)
  }
})

// Pages that talk about the law end with a visible not-legal-advice note (asked on 2026-10-07).
test("case studies sold as Legal AI carry the not-legal-advice note, others do not", { skip: !built && "no build in public/" }, () => {
  assert.ok(CASE_STUDIES.some(cs => offersOf(cs).includes("Legal AI")), "no Legal AI case study")
  for (const cs of CASE_STUDIES) {
    const has = /class="cs-disclaimer"[^>]*><strong>Not legal advice\.<\/strong>/.test(html(`case-studies/${cs.slug}`))
    assert.equal(has, offersOf(cs).includes("Legal AI"), cs.slug)
  }
})

// The search snippet used to be the story hook, which says nothing about the page
// (technical audit, 2026-10-07). metaDescription summarises what was built and the
// result, from the study's own metric, hook and TL;DR: it may add no number.
test("every published case study has a search description built from its own facts", () => {
  for (const cs of CASE_STUDIES) {
    const d = cs.metaDescription && cs.metaDescription.en
    assert.ok(d, `${cs.slug}: no metaDescription`)
    assert.ok(d.length >= 70 && d.length <= 160, `${cs.slug}: metaDescription is ${d.length} characters`)
    assert.doesNotMatch(d, /[–—]/, `${cs.slug}: dash in metaDescription`)
    for (const w of FILLER) assert.doesNotMatch(d, new RegExp(`\\b${w}`, "i"), `${cs.slug}: "${w}"`)
    assert.doesNotMatch(d, CLIENTS, `${cs.slug}: metaDescription names a client`)
    const facts = [cs.metric.en, cs.hook.en, cs.tldr.en].join(" ")
    for (const n of d.match(/\d+(?:[.,]\d+)*/g) || []) assert.ok(facts.includes(n), `${cs.slug}: ${n} is not in its metric, hook or TL;DR`)
  }
})

test("case-study pages use that description for search and share snippets", { skip: !built && "no build in public/" }, () => {
  for (const cs of CASE_STUDIES) {
    const page = html(`case-studies/${cs.slug}`)
    assert.equal(metaContent(page, "name", "description"), cs.metaDescription.en, cs.slug)
    assert.equal(metaContent(page, "property", "og:description"), cs.metaDescription.en, cs.slug)
  }
})

// Regression: four studies declared /og/<slug>.png images that did not exist, so
// shares showed no picture (technical audit, 2026-10-07).
test("every case-study share image is a built file", { skip: !built && "no build in public/" }, () => {
  for (const cs of CASE_STUDIES) {
    const page = html(`case-studies/${cs.slug}`)
    for (const [attr, name] of [["property", "og:image"], ["name", "twitter:image"]]) {
      const url = metaContent(page, attr, name)
      assert.ok(url && url.startsWith("https://arelion.dev/"), `${cs.slug}: ${name} ${url}`)
      assert.ok(existsSync(join(PUBLIC, url.slice("https://arelion.dev/".length))), `${cs.slug}: ${name} ${url} does not exist`)
    }
  }
})

test("case-study structured data points to the author and organization the home declares", { skip: !built && "no build in public/" }, () => {
  for (const cs of CASE_STUDIES) {
    const post = jsonLd(html(`case-studies/${cs.slug}`)).find(n => n["@type"] === "BlogPosting")
    assert.equal(post.author["@id"], "https://arelion.dev/#antonin", cs.slug)
    assert.equal(post.publisher["@id"], "https://arelion.dev/#organization", cs.slug)
  }
})

test("llms.txt lists every published case study under its title", () => {
  const llms = readFileSync(join(ROOT, "static/llms.txt"), "utf8")
  for (const cs of CASE_STUDIES) {
    assert.ok(llms.includes(`[${cs.title.en}](https://arelion.dev/case-studies/${cs.slug}/)`), `${cs.slug} missing from static/llms.txt`)
  }
})

// Gemini reads the scans of the document agent, so its pages may say where the
// files are stored, never that nothing leaves the machine (fixed on 2026-10-08).
test("the document agent pages say scans pass through Google and claim nothing more", () => {
  const read = p => readFileSync(join(ROOT, p), "utf8")
  const agent = CASE_STUDIES.find(cs => cs.slug === "doc-agent-on-sqlite")
  const pages = {
    "case study data": JSON.stringify(agent),
    "article EN": read("content/blog/doc-agent-on-sqlite/index.MD"),
    "article FR": read("content/blog/doc-agent-on-sqlite/index.fr.MD"),
    "business EN": read("content/blog/doc-agent-on-sqlite-business/index.MD"),
    "business FR": read("content/blog/doc-agent-on-sqlite-business/index.fr.MD"),
  }
  const overclaim = /never leaves? the machine|ne quittent jamais la machine|only page text|seul le texte des pages/i
  for (const [name, text] of Object.entries(pages)) assert.doesNotMatch(text, overclaim, `${name} says nothing leaves the machine`)
  assert.match(pages["article EN"], /the files and the index are stored on the machine/)
  assert.match(pages["article FR"], /les fichiers et l'index sont stockés sur la machine/)
  assert.match(pages["business EN"], /scanned images pass through Google/)
  assert.match(pages["business FR"], /les images des scans passent donc par Google/)
})

// The security audit study is anonymized (decided on 2026-10-11): it names no
// sector for the audited client, whatever the sector (the list covers the usual
// ones, in English and French), gives no launch timing, and every code sample
// says it is representative. The audience examples the text keeps (SaaS,
// e-commerce, fintech, health) are not in the list. Real identifiers are not
// listed either: naming them in a test would publish them.
const AUDIT = "ai-attack-surface"
const SECTOR_WORDS = [
  "abonnés", "airline", "API de contenu", "article", "articles", "assureur", "avocats", "bank", "banks", "banque",
  "brouillon", "brouillons", "clinic", "CMS", "content API", "draft", "drafts", "editorial", "éditorial", "embargo",
  "embargoed", "étudiants", "fleet", "front page", "homepage", "hospital", "hôpital", "hotel", "hôtel", "insurer",
  "journalist", "journalists", "journaliste", "journalistes", "landlord", "law firm", "lawyers", "lecteur", "lecteurs",
  "logistics", "media", "média", "médias", "ministère", "ministry", "news", "newsroom", "non publiés", "page d'accueil",
  "patients", "players", "press", "presse", "preview token", "preview tokens", "prévisualisation", "publication",
  "publisher", "publishers", "publishing", "reader", "readers", "rédaction", "retailer", "shoppers", "stories", "story",
  "students", "subscribers", "telecom", "tenants", "université", "university", "unpublished", "WordPress",
]
const SECTOR = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${SECTOR_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}_])`,
  "iu",
)
// "days from launch", or a month: the text only says the audit took place earlier.
const LAUNCH_TIMING =
  /\bdays (?:from|before|away)\b|à quelques jours|\b(?:January|February|March|April|June|July|August|September|October|November|December)\b|(?<!\p{L})(?:janvier|février|mars|avril|juin|juillet|août|septembre|octobre|novembre|décembre)(?!\p{L})/u
// Visible text of a page or a markdown body, with plain apostrophes.
const plain = text =>
  text
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|’/g, "'")
const sectorWord = text => (plain(text).match(SECTOR) || [null])[0]

test("the security audit study names no client sector, gives no launch timing and labels its code samples", () => {
  const read = p => readFileSync(join(ROOT, p), "utf8")
  const data = read("src/data/case-studies.js")
  const at = data.indexOf(`slug: "${AUDIT}"`)
  assert.ok(at > 0, "no entry for the study")
  const sources = {
    "article EN": read(`content/blog/${AUDIT}/index.MD`),
    "article FR": read(`content/blog/${AUDIT}/index.fr.MD`),
    "business EN": read(`content/blog/${AUDIT}-business/index.MD`),
    "business FR": read(`content/blog/${AUDIT}-business/index.fr.MD`),
    "rich body": read(`src/data/case-studies-rich/${AUDIT}.json`),
    "rich body, drafts copy": read(`content/drafts/_rich/${AUDIT}.json`),
    // The whole entry, inline body included. Its `article` keys are field names, not text.
    "case study entry": data.slice(at, data.indexOf("\n    slug: ", at)).replace(/\barticle(Business)?:/g, ""),
  }
  for (const [name, text] of Object.entries(sources)) {
    assert.equal(sectorWord(text), null, `${name} names a sector`)
    assert.doesNotMatch(text, LAUNCH_TIMING, `${name} gives a launch timing`)
  }
  for (const name of ["article EN", "article FR"]) {
    const samples = sources[name].match(/```[\s\S]*?```/g) || []
    assert.ok(samples.length > 0, `${name}: no code sample found`)
    for (const s of samples) assert.match(s, /representative|représentati/i, `${name}: a code sample does not say it is representative`)
  }
})

test("the built security audit page names no client sector, related cards included", { skip: !built && "no build in public/" }, () => {
  const page = html(`case-studies/${AUDIT}`)
  const start = page.indexOf('<article class="cs-detail"')
  // The study's own text stops where the related cards (or the contact box) start.
  const end = Math.min(...['class="cs-related"', 'class="cs-cta"'].map(c => page.indexOf(c, start)).filter(i => i > 0))
  assert.ok(start > 0 && end > start, "study text not found in the page")
  assert.equal(sectorWord(page.slice(start, end)), null, "the page text names a sector")
  // A card under the study must not point to a sector either.
  for (const [, title] of page.matchAll(/class="cs-related-title">([^<]*)</g)) assert.equal(sectorWord(title), null, `related card "${title}"`)
  // The French bodies are not shown, but they ship in the page data.
  const bodies = JSON.parse(readFileSync(join(PUBLIC, `page-data/case-studies/${AUDIT}/page-data.json`), "utf8")).result.data
  for (const key of ["techEn", "techFr", "businessEn", "businessFr"]) assert.equal(sectorWord(bodies[key].html), null, `${key} names a sector`)
})

// The three security tests of 2026-10-11 are Lab studies whose page is the
// article itself. Each one is checked on the figure its page is about, so the
// check fails if the page goes away or loses that figure.
const SECURITY_TESTS = {
  "claude-code-security-review-test": "10 of them in all three runs",
  "prompt-injection-email-test": "16 times out of 50",
  "ai-models-vulnerability-test": "15 of the 30 pairs",
}
// Visible text of one element of a built page, from its opening tag to the first closing tag.
const element = (slug, open, close) => {
  const page = html(`case-studies/${slug}`)
  const start = page.indexOf(open)
  const end = page.indexOf(close, start)
  assert.ok(start > 0 && end > start, `${slug}: ${open} not found in the page`)
  return plain(page.slice(start, end))
}

test("the three security tests are published Lab studies, each with an article that states its main figure", () => {
  for (const [slug, figure] of Object.entries(SECURITY_TESTS)) {
    const cs = CASE_STUDIES.find(c => c.slug === slug)
    assert.ok(cs, `${slug} is not a published case study`)
    assert.equal(cs.lab, true, `${slug}: not a Lab study`)
    assert.deepEqual(cs.offers, ["Lab"], slug)
    assert.equal(cs.article, `/blog/${slug}/`, slug)
    assert.equal(cs.articleBusiness, undefined, `${slug}: these studies have no business version`)
    assert.ok(readFileSync(join(ROOT, `content/blog/${slug}/index.MD`), "utf8").includes(figure), `${slug}: the article no longer says "${figure}"`)
  }
})

for (const [slug, figure] of Object.entries(SECURITY_TESTS)) {
  test(`the built page of ${slug} shows "${figure}" in its article`, { skip: !built && "no build in public/" }, () => {
    assert.ok(existsSync(join(PUBLIC, `case-studies/${slug}/index.html`)), `no page at /case-studies/${slug}/`)
    assert.ok(element(slug, 'class="cs-section cs-article"', "</section>").includes(figure), `the article on the page no longer says "${figure}"`)
  })
}

// How often the monitor of my own assistant runs and which messaging apps the
// assistant reads stay out of these pages (decided on 2026-10-11).
const PRIVATE_DETAILS = /15 minutes|WhatsApp|Telegram/i

test("the three security tests give no detail on how my own assistant is watched", () => {
  for (const slug of Object.keys(SECURITY_TESTS)) {
    const cs = CASE_STUDIES.find(c => c.slug === slug)
    assert.ok(cs, `${slug} is not a published case study`)
    const texts = {
      // The entry with its rich body (TL;DR and sections), English and French.
      "case study data": JSON.stringify(cs),
      article: readFileSync(join(ROOT, `content/blog/${slug}/index.MD`), "utf8"),
    }
    for (const [name, text] of Object.entries(texts)) assert.doesNotMatch(text, PRIVATE_DETAILS, `${slug}, ${name}`)
  }
})

test("the built pages of the three security tests give no such detail either", { skip: !built && "no build in public/" }, () => {
  for (const slug of Object.keys(SECURITY_TESTS)) {
    // The study's own part of the page: the site menu around it has a WhatsApp contact link.
    assert.doesNotMatch(element(slug, '<article class="cs-detail"', "</article>"), PRIVATE_DETAILS, `${slug}: page text`)
    assert.doesNotMatch(readFileSync(join(PUBLIC, `page-data/case-studies/${slug}/page-data.json`), "utf8"), PRIVATE_DETAILS, `${slug}: page data`)
  }
})
