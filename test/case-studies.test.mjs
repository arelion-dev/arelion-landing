// Case studies are sorted by what I sell (offers) and client work is kept
// apart from my own projects (lab). The output checks need `npm run build` first.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const require = createRequire(import.meta.url)
// Without NODE_ENV=development this is the published list, as in production.
const CASE_STUDIES = require("../src/data/case-studies.js")
const { OFFERS, offersOf, offerClass } = require("../src/data/offers.js")

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

// Every offer takes one of the kicker colours the stylesheet defines.
test("every offer reuses an existing kicker colour", () => {
  const css = readFileSync(join(ROOT, "src/style.css"), "utf8")
  for (const o of OFFERS) assert.match(css, new RegExp(`\\.cs-p-${o.css}\\s*{`), `${o.name}: no .cs-p-${o.css} rule`)
})

// Asked on 2026-10-18: a Security offer (pentests of web apps and APIs, AI red
// teaming, audits of AI-built apps) so the index can show the security studies
// together, and no other study carries it. Security comes second on every one:
// a study's related cards come from its main offer. With Security first,
// llm-sleeper-agents lost the Lab pages, its only links, and the AI agents
// pages lost their links to the two client security studies.
const SECURITY_STUDIES = [
  "ai-attack-surface",
  "prompt-injection-defense",
  "prompt-injection-email-test",
  "claude-code-security-review-test",
  "ai-models-vulnerability-test",
  "llm-sleeper-agents",
]

test("the six security studies are filed under Security, second after their main offer", () => {
  assert.ok(OFFER_NAMES.has("Security"), "no Security offer")
  for (const slug of SECURITY_STUDIES) {
    const cs = CASE_STUDIES.find(c => c.slug === slug)
    assert.ok(cs, `${slug} is not a published case study`)
    const offers = offersOf(cs)
    assert.equal(offers[1], "Security", `${slug}: offers ${offers.join(", ")}`)
    if (cs.lab) assert.equal(offers[0], "Lab", slug)
  }
  assert.ok(SECURITY_STUDIES.some(slug => !CASE_STUDIES.find(c => c.slug === slug).lab), "no client work under Security")
  const tagged = CASE_STUDIES.filter(cs => offersOf(cs).includes("Security")).map(cs => cs.slug)
  assert.deepEqual(tagged.sort(), SECURITY_STUDIES.slice().sort())
})

// Review of 2026-10-18: with Security as the main offer of the two client
// security studies, ai-buyer-sales-training fell from three related cards to
// one and agent-eval lost its link to prompt-injection-defense.
test("the AI agents pages keep their related cards to the client security studies", { skip: !built && "no build in public/" }, () => {
  const cards = slug => [...html(`case-studies/${slug}`).matchAll(/<a class="cs-related-card" href="\/case-studies\/([^"/]+)\/"/g)].map(m => m[1])
  const sales = cards("ai-buyer-sales-training")
  assert.equal(sales.length, 3, `ai-buyer-sales-training: ${sales.join(", ")}`)
  for (const slug of ["prompt-injection-defense", "ai-attack-surface"]) assert.ok(sales.includes(slug), `ai-buyer-sales-training: no card to ${slug}`)
  assert.ok(cards("agent-eval").includes("prompt-injection-defense"), "agent-eval: no card to prompt-injection-defense")
})

test("the index has a Security tab and names Security in the kicker of the six studies", { skip: !built && "no build in public/" }, () => {
  const page = html("case-studies")
  assert.match(page, /<button type="button" class="">Security<\/button>/, "no Security tab")
  for (const slug of SECURITY_STUDIES) {
    const at = page.indexOf(`href="/case-studies/${slug}/"`)
    assert.ok(at > 0, `${slug} missing from the index`)
    const card = page.slice(at, page.indexOf("</a>", at))
    const cs = CASE_STUDIES.find(c => c.slug === slug)
    const kicker = card.match(/<p class="cs-row-kicker (cs-p-[a-z]+)">([^<]*)<\/p>/)
    assert.ok(kicker, `${slug}: no kicker in ${card.slice(0, 200)}`)
    assert.deepEqual([kicker[1], kicker[2].split(" · ")], [offerClass(cs), offersOf(cs)], slug)
    assert.ok(kicker[2].split(" · ").includes("Security"), slug)
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

// The related cards used to follow the order of the data file, so the studies at
// its end (the three security tests of 2026-10-11) were never shown and got no
// link but the index's (technical audit, 2026-10-13). `related` puts chosen
// studies first.
test("a study's related list names other published studies only", () => {
  const slugs = new Set(CASE_STUDIES.map(cs => cs.slug))
  for (const cs of CASE_STUDIES.filter(c => c.related)) {
    for (const slug of cs.related) {
      assert.ok(slugs.has(slug), `${cs.slug}: related ${slug} is not a published case study`)
      assert.notEqual(slug, cs.slug, `${cs.slug} lists itself`)
    }
  }
})

test("a study's page shows the studies of its related list first among its cards", { skip: !built && "no build in public/" }, () => {
  const listed = CASE_STUDIES.filter(cs => cs.related)
  assert.ok(listed.length > 0, "no study has a related list")
  for (const cs of listed) {
    const cards = [...html(`case-studies/${cs.slug}`).matchAll(/<a class="cs-related-card" href="\/case-studies\/([^"/]+)\/"/g)].map(m => m[1])
    assert.deepEqual(cards.slice(0, cs.related.length), cs.related.slice(0, 3), cs.slug)
  }
})

test("every published case study gets a link from a built page other than the index", { skip: !built && "no build in public/" }, () => {
  const xml = readFileSync(join(PUBLIC, "sitemap-0.xml"), "utf8")
  const pages = [...xml.matchAll(/<loc>https:\/\/arelion\.dev([^<]*)<\/loc>/g)]
    .map(m => m[1])
    .filter(p => p !== "/case-studies/")
    .map(p => ({ path: p, page: html(p) }))
  for (const cs of CASE_STUDIES) {
    const path = `/case-studies/${cs.slug}/`
    const from = pages.filter(p => p.path !== path && p.page.includes(`href="${path}"`))
    assert.ok(from.length > 0, `${cs.slug}: no page links it but the case studies index`)
  }
})

// The structured data used the default cover on every study and had no
// dateModified, while guides have one (technical audit, 2026-10-13).
test("case-study structured data shows the page's share image and the sitemap's date", { skip: !built && "no build in public/" }, () => {
  for (const cs of CASE_STUDIES) {
    const page = html(`case-studies/${cs.slug}`)
    const post = jsonLd(page).find(n => n["@type"] === "BlogPosting")
    assert.equal(post.image, metaContent(page, "property", "og:image"), cs.slug)
    assert.ok(post.datePublished && post.dateModified, `${cs.slug}: no datePublished or dateModified`)
    assert.equal(post.dateModified.slice(0, 10), cs.updated || cs.date, `${cs.slug}: dateModified is not the sitemap's lastmod`)
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
    assert.deepEqual(cs.offers, ["Lab", "Security"], slug)
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
    // The study's own part of the page, without its contact links: the menu, the
    // offer box and the bottom box each have a link labelled WhatsApp.
    const page = html(`case-studies/${slug}`)
    const start = page.indexOf('<article class="cs-detail"')
    const end = page.indexOf("</article>", start)
    assert.ok(start > 0 && end > start, `${slug}: study text not found in the page`)
    const own = page.slice(start, end).replace(/<a class="nav-pill nav-pill-whatsapp"[^>]*>WhatsApp<\/a>/g, "")
    assert.doesNotMatch(plain(own), PRIVATE_DETAILS, `${slug}: page text`)
    // The page data also carries the site's WhatsApp number, so only the article bodies are read.
    const bodies = JSON.parse(readFileSync(join(PUBLIC, `page-data/case-studies/${slug}/page-data.json`), "utf8")).result.data
    assert.ok(bodies.techEn, `${slug}: no article in the page data`)
    for (const key of ["techEn", "techFr", "businessEn", "businessFr"]) {
      if (bodies[key]) assert.doesNotMatch(bodies[key].html, PRIVATE_DETAILS, `${slug}: ${key}`)
    }
  }
})

// ---- Offer box in a study's article, and the two links of its bottom box ----
// Asked on 2026-10-11: the security studies ended on one generic "Book a call".
// Each now shows an offer inside its article, where the reader has just seen the
// problem, and says in its bottom box what to send me. Every case study gets the
// WhatsApp link next to the booking link, as the guides have.

// A study with an `offer` says where its box goes with this comment (src/components/article-body.js).
const OFFER_MARKER = "<!-- offer -->"
// The tag carries cs-hidden too when the box sits in the version the toggle hides.
const OFFER_BOX = '<aside class="cs-offer'
const GENERIC_LINE = "Got this problem? I'll look at yours, in writing."
const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"
// Text as React writes it into HTML.
const escaped = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;")
// The end of a WhatsApp link that names the study, as it stands in the HTML.
const prefilled = title => escaped(`?text=${encodeURIComponent(`Hi Antonin, I read "${title}" on arelion.dev`)}`)
// The English markdown bodies of a study: its article, and its business version if it has one.
const bodies = cs =>
  [cs.article, cs.articleBusiness].filter(Boolean).map(a => {
    const dir = join(ROOT, "content", a)
    return readFileSync(join(dir, readdirSync(dir).find(f => /^index\.md$/i.test(f))), "utf8")
  })
const contactLinks = box =>
  [...box.matchAll(/<a class="([^"]*)" href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map(([, cls, href, label]) => ({ cls, href, label }))
// Each offer sits after the section under the first heading and right before the second.
const OFFER_PLACES = {
  "ai-attack-surface": ["Four more high findings", "How I verified the high findings"],
  "claude-code-security-review-test": ["What it did not report in any run", "How much the three runs differed"],
  "prompt-injection-email-test": [
    "With no defense, three models called the mail tool on 9 to 16 of the 50 attacks",
    "Marking the email as data stopped all 50 attacks on these five models",
  ],
  "ai-models-vulnerability-test": ["What round 2 shows, and its limits", "Cost of round 2"],
}

// The template drops the box of a study that has one without the other.
test("a case study has an offer and its place in the text together, or neither", () => {
  for (const cs of CASE_STUDIES) {
    const places = bodies(cs).map(body => body.split(OFFER_MARKER).length - 1)
    if (!cs.offer) {
      assert.ok(places.every(n => n === 0), `${cs.slug}: an offer marker without an offer`)
      continue
    }
    assert.ok(cs.offer.title.en && cs.offer.text.en, `${cs.slug}: an offer needs a title and a text`)
    assert.ok(cs.ctaLine && cs.ctaLine.en, `${cs.slug}: a study with an offer says in its bottom box what to send`)
    assert.equal(places[0], 1, `${cs.slug}: ${places[0]} offer marker(s) in its article`)
    assert.ok(places.every(n => n <= 1), `${cs.slug}: two offer markers in one body`)
  }
  assert.deepEqual(CASE_STUDIES.filter(cs => cs.offer).map(cs => cs.slug).sort(), Object.keys(OFFER_PLACES).sort())
})

test("each security study shows its offer box once, between its two sections, with WhatsApp and the booking link", { skip: !built && "no build in public/" }, () => {
  for (const [slug, [before, after]] of Object.entries(OFFER_PLACES)) {
    const cs = CASE_STUDIES.find(c => c.slug === slug)
    const page = html(`case-studies/${slug}`)
    assert.equal(page.split(OFFER_BOX).length - 1, 1, `${slug}: offer boxes on the page`)
    const at = page.indexOf(OFFER_BOX)
    const above = page.indexOf(`<h2>${escaped(before)}</h2>`)
    const below = page.indexOf(`<h2>${escaped(after)}</h2>`)
    assert.ok(above > 0 && below > 0, `${slug}: a heading around the offer changed`)
    assert.ok(above < at && at < below, `${slug}: the offer box is not between the two sections`)
    // No other heading sits between the section above and the box.
    assert.doesNotMatch(page.slice(above + 4, at), /<h2/, slug)
    const box = page.slice(at, page.indexOf("</aside>", at))
    assert.ok(box.includes(`<p class="cs-offer-title">${escaped(cs.offer.title.en)}</p><p>${escaped(cs.offer.text.en)}</p>`), box)
    const links = contactLinks(box)
    assert.deepEqual(links.map(l => [l.cls, l.label]), [["nav-pill nav-pill-whatsapp", "WhatsApp"], ["nav-pill nav-pill-primary", "Book a call"]])
    assert.ok(links[0].href.startsWith("https://wa.me/") && links[0].href.endsWith(prefilled(cs.title.en)), links[0].href)
    assert.equal(links[1].href, CALENDAR_URL)
  }
})

// Asked on 2026-10-19: each offer box links to the matching offer page of
// securityaudit.ae, ARELION's security site, for scope and price. The sleeper
// agents study and prompt-injection-defense have no offer box, so no link.
const APP_AUDIT = ["https://securityaudit.ae/ai-built-app-audit/", "AI-built app security audit: scope and price"]
const AGENT_AUDIT = ["https://securityaudit.ae/ai-agent-security-audit/", "AI agent security audit: scope and price"]
const OFFER_SITE_LINKS = {
  "ai-attack-surface": APP_AUDIT,
  "claude-code-security-review-test": APP_AUDIT,
  "ai-models-vulnerability-test": APP_AUDIT,
  "prompt-injection-email-test": AGENT_AUDIT,
}

test("each security study's offer links to its offer page on securityaudit.ae", () => {
  assert.deepEqual(CASE_STUDIES.filter(cs => cs.offer && cs.offer.link).map(cs => cs.slug).sort(), Object.keys(OFFER_SITE_LINKS).sort())
  for (const [slug, [url, label]] of Object.entries(OFFER_SITE_LINKS)) {
    const { link } = CASE_STUDIES.find(c => c.slug === slug).offer
    assert.deepEqual([link.url, link.label.en], [url, label], slug)
    assert.doesNotMatch(link.label.en, /[\u2013\u2014]/, `${slug}: dash`)
  }
})

test("the built offer box of each security study shows its securityaudit.ae link above the buttons, in a new tab", { skip: !built && "no build in public/" }, () => {
  for (const [slug, [url, label]] of Object.entries(OFFER_SITE_LINKS)) {
    const page = html(`case-studies/${slug}`)
    const at = page.indexOf(OFFER_BOX)
    const box = page.slice(at, page.indexOf("</aside>", at))
    const links = [...box.matchAll(/<a ([^>]*)>([^<]*)/g)].filter(([, attrs]) => attrs.includes("securityaudit.ae"))
    assert.equal(links.length, 1, `${slug}: ${links.length} securityaudit.ae link(s) in the offer box`)
    const [[tag, attrs, text]] = links
    assert.match(attrs, new RegExp(`href="${url}"`), slug)
    assert.match(attrs, /target="_blank"/, slug)
    assert.match(attrs, /rel="noopener"/, slug)
    assert.equal(text.trim(), escaped(label), slug)
    assert.ok(box.indexOf(tag) < box.indexOf('class="cs-offer-links"'), `${slug}: the link is not above the buttons`)
  }
})

test("only a case study with an offer shows an offer box", { skip: !built && "no build in public/" }, () => {
  for (const cs of CASE_STUDIES) assert.equal(html(`case-studies/${cs.slug}`).split(OFFER_BOX).length - 1, cs.offer ? 1 : 0, cs.slug)
})

test("the bottom box of a case study shows its own line or the generic one, with WhatsApp and the booking link", { skip: !built && "no build in public/" }, () => {
  const lines = new Set()
  for (const cs of CASE_STUDIES) {
    const page = html(`case-studies/${cs.slug}`)
    const at = page.indexOf('<div class="cs-cta">')
    assert.ok(at > 0, `${cs.slug}: no bottom box`)
    const box = page.slice(at, page.indexOf("</article>", at))
    const line = box.match(/^<div class="cs-cta"><p>([^<]*)<\/p>/)?.[1]
    assert.equal(line, escaped((cs.ctaLine && cs.ctaLine.en) || GENERIC_LINE), cs.slug)
    lines.add(line)
    const links = contactLinks(box)
    assert.deepEqual(links.map(l => [l.cls, l.label]), [["nav-pill nav-pill-whatsapp", "WhatsApp"], ["nav-pill nav-pill-primary", "Book a call"]], cs.slug)
    assert.ok(links[0].href.startsWith("https://wa.me/") && links[0].href.endsWith(prefilled(cs.title.en)), `${cs.slug}: ${links[0].href}`)
    assert.equal(links[1].href, CALENDAR_URL, cs.slug)
  }
  // Both cases are on the site: the four security studies have their own line, the others share one.
  assert.equal(lines.size, Object.keys(OFFER_PLACES).length + 1)
})
