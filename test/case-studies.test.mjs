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
const { OFFERS, offersOf } = require("../src/data/offers.js")
const MOVED = require("../src/data/moved-pages.js")

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

// The six security studies moved to securityaudit.ae on 2026-10-31, with the
// Security offer that filed them (src/data/moved-pages.js lists their old paths).
test("no case study and no offer is left for security: the six studies are on securityaudit.ae", () => {
  assert.ok(!OFFER_NAMES.has("Security"), "the Security offer is still listed")
  assert.equal(MOVED.length, 6)
  for (const { from, to } of MOVED) {
    assert.ok(!CASE_STUDIES.some(cs => `/case-studies/${cs.slug}/` === from), `${from} is still a case study`)
    assert.equal(to, `https://securityaudit.ae${from}`, from)
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
})

test("only a case study with an offer shows an offer box", { skip: !built && "no build in public/" }, () => {
  for (const cs of CASE_STUDIES) assert.equal(html(`case-studies/${cs.slug}`).split(OFFER_BOX).length - 1, cs.offer ? 1 : 0, cs.slug)
})

test("the bottom box of a case study shows its own line or the generic one, with WhatsApp and the booking link", { skip: !built && "no build in public/" }, () => {
  for (const cs of CASE_STUDIES) {
    const page = html(`case-studies/${cs.slug}`)
    const at = page.indexOf('<div class="cs-cta">')
    assert.ok(at > 0, `${cs.slug}: no bottom box`)
    const box = page.slice(at, page.indexOf("</article>", at))
    const line = box.match(/^<div class="cs-cta"><p>([^<]*)<\/p>/)?.[1]
    assert.equal(line, escaped((cs.ctaLine && cs.ctaLine.en) || GENERIC_LINE), cs.slug)
    const links = contactLinks(box)
    assert.deepEqual(links.map(l => [l.cls, l.label]), [["nav-pill nav-pill-whatsapp", "WhatsApp"], ["nav-pill nav-pill-primary", "Book a call"]], cs.slug)
    assert.ok(links[0].href.startsWith("https://wa.me/") && links[0].href.endsWith(prefilled(cs.title.en)), `${cs.slug}: ${links[0].href}`)
    assert.equal(links[1].href, CALENDAR_URL, cs.slug)
  }
})
