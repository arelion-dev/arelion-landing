// Checks on the guides (content/guides) and on the built site (public/).
// The output checks need `npm run build` first; without public/ they are skipped.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const matter = require("gray-matter")
// Without NODE_ENV=development this is the published list, as in production.
const CASE_STUDIES = require("../src/data/case-studies.js")

const ROOT = new URL("..", import.meta.url).pathname
const GUIDES_DIR = join(ROOT, "content/guides")
const PUBLIC = join(ROOT, "public")

const guides = readdirSync(GUIDES_DIR)
  .filter(f => f.endsWith(".md"))
  .map(file => {
    const raw = readFileSync(join(GUIDES_DIR, file), "utf8")
    const { data } = matter(raw)
    return { file, raw, data, path: `/${String(data.path).replace(/^\/+|\/+$/g, "")}/` }
  })

// Same list as the writing rules for arelion.dev content.
const FILLER = ["crucial", "robust", "leverage", "delve", "seamless", "cutting-edge", "game-changer", "unlock", "empower", "landscape", "load-bearing"]
// The case studies are anonymized; a guide that names the client undoes it.
const CLIENTS = /L['’]Or[ée]al|Free Malaysia Today|\bFMT\b/i

test("every guide has a title, a description and a path within limits", () => {
  for (const g of guides) {
    assert.ok(g.data.title, `${g.file}: no title`)
    assert.ok(g.data.title.length <= 60, `${g.file}: title is ${g.data.title.length} characters`)
    assert.ok(g.data.description, `${g.file}: no description`)
    assert.ok(g.data.description.length <= 160, `${g.file}: description is ${g.data.description.length} characters`)
    assert.ok(g.data.path, `${g.file}: no path`)
  }
})

test("guide paths are unique", () => {
  const paths = guides.map(g => g.path)
  assert.equal(new Set(paths).size, paths.length, paths.join(", "))
})

test("related case studies exist and are published", () => {
  const slugs = new Set(CASE_STUDIES.map(c => c.slug))
  for (const g of guides) {
    assert.ok((g.data.related || []).length > 0, `${g.file}: no related case study`)
    for (const slug of g.data.related) assert.ok(slugs.has(slug), `${g.file}: unknown or draft case study ${slug}`)
  }
})

test("guides contain no em dash, no en dash and no filler word", () => {
  for (const g of guides) {
    assert.doesNotMatch(g.raw, /[–—]/, `${g.file}: dash`)
    for (const w of FILLER) assert.doesNotMatch(g.raw, new RegExp(`\\b${w}`, "i"), `${g.file}: "${w}"`)
  }
})

test("llms.txt lists every guide under its current title", () => {
  const llms = readFileSync(join(ROOT, "static/llms.txt"), "utf8")
  for (const g of guides) {
    assert.ok(llms.includes(`https://arelion.dev${g.path}`), `${g.path} missing from static/llms.txt`)
    assert.ok(llms.includes(`[${g.data.title}](https://arelion.dev${g.path})`), `${g.path}: the llms.txt title is not "${g.data.title}"`)
  }
})

// The search this guide targets is "arabic pdf to word" (Search Console audit, 2026-10-07).
test("the Arabic PDF guide says Arabic PDF to Word in its title and description", () => {
  const g = guides.find(g => g.path === "/guides/arabic-pdf-to-text/")
  assert.match(g.data.title, /^Arabic PDF to Word\b/)
  assert.match(g.data.description, /Arabic PDF to Word\b/)
})

test("guides do not name a client", () => {
  for (const g of guides) assert.doesNotMatch(g.raw, CLIENTS, g.file)
})

// A draft holds "[RESULT: ...]" placeholders until the test behind it has run (2026-10-10).
test("no guide still holds a result placeholder", () => {
  for (const g of guides) assert.doesNotMatch(g.raw, /\[RESULT/, g.file)
})

// In the chatbot guide's Arabizi test only the question was in Latin letters; the four
// options stayed in Arabic script. The Arabizi section must say so next to its figures.
test("the Arabic chatbot guide says the options stay in Arabic script in the Arabizi test", () => {
  const g = guides.find(g => g.path === "/guides/arabic-chatbot/")
  assert.ok(g, "no guide at /guides/arabic-chatbot/")
  const arabizi = g.raw.split(/^## /m).find(s => s.startsWith("Arabizi"))
  assert.ok(arabizi, "no Arabizi section")
  assert.match(arabizi, /options stayed in Arabic script/)
})

// Google cuts titles past about 60 characters. Four guides on page one had no click on
// 124 impressions (SEO report, 2026-10-21): their titles now carry the result and fit whole.
test("every guide title fits in what Google shows (60 characters)", () => {
  for (const g of guides) assert.ok(g.data.title.length <= 60, `${g.file}: title is ${g.data.title.length} characters`)
})

// "arabic chatbot" (3,600 searches a month in the UAE) comes from buyers: the guide
// answers them before the test details (SEO report, 2026-10-21).
test("the Arabic chatbot guide answers a UAE business in its first H2", () => {
  const g = guides.find(g => g.path === "/guides/arabic-chatbot/")
  const [first] = [...g.raw.matchAll(/^## (.*)$/gm)].map(m => m[1])
  assert.match(first, /Arabic chatbot/)
  assert.match(first, /UAE business/)
})

// The searches are "app development abu dhabi" and "mobile app development abu dhabi",
// 390 a month each (Keyword Planner UAE, 2026-10-21).
test("the Abu Dhabi page says app development in Abu Dhabi and has a section per kind of project", () => {
  const g = guides.find(g => g.path === "/software-development-abu-dhabi/")
  assert.match(g.data.title, /^App development in Abu Dhabi\b/)
  const h2 = [...g.raw.matchAll(/^## (.*)$/gm)].map(m => m[1])
  for (const kind of [/^Mobile app development in Abu Dhabi$/, /software/i, /^AI\b/]) assert.ok(h2.some(h => kind.test(h)), `no H2 matching ${kind}`)
})

const built = existsSync(join(PUBLIC, "index.html"))
const html = p => readFileSync(join(PUBLIC, p, "index.html"), "utf8")
// Gatsby adds attributes such as data-gatsby-head to the tag, so match any attribute list.
const jsonLd = page =>
  [...page.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].flatMap(m => [].concat(JSON.parse(m[1])))
// Frontmatter dates arrive as strings or as Date objects, depending on the quotes.
const day = d => (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10)

test("the guides index links to every guide", { skip: !built && "no build in public/" }, () => {
  const index = html("guides")
  for (const g of guides) assert.ok(index.includes(`href="${g.path}"`), `${g.path} missing from /guides/`)
})

test("every guide page leads back to the guides index", { skip: !built && "no build in public/" }, () => {
  for (const g of guides) assert.ok(html(g.path).includes(`cs-crumb"><a href="/guides/">Guides</a>`), g.path)
})

test("internal links in guides point to built pages", { skip: !built && "no build in public/" }, () => {
  for (const g of guides) {
    for (const [, href] of g.raw.matchAll(/\]\((\/[^)#\s]*)/g)) {
      const page = href.replace(/^\/+|\/+$/g, "")
      assert.ok(existsSync(join(PUBLIC, page, "index.html")), `${g.file}: ${href}`)
    }
  }
})

// Links set on words the text already had (Search Console and technical audits,
// 2026-10-13): the page that sells the legal assistant got no link from the law
// guides, and the OCR benchmark linked the PDF guide as "more on PDFs" and did
// not link the guide on photos at all.
const TEXT_LINKS = [
  ["difc-data-protection-ai.md", "legal assistant", "/legal-ai-uae/"],
  ["arabic-ocr.md", "return many Arabic ligatures reversed", "/guides/arabic-pdf-to-text/"],
  ["arabic-ocr.md", "6 photos of one page and 4 photos of an open book", "/guides/image-to-arabic-text/"],
]
test("guides link the pages their text talks about, on the words that name them", { skip: !built && "no build in public/" }, () => {
  for (const [file, words, to] of TEXT_LINKS) {
    const g = guides.find(g => g.file === file)
    assert.ok(g, `no guide ${file}`)
    assert.ok(html(g.path).includes(`<a href="${to}">${words}</a>`), `${g.path} does not link "${words}" to ${to}`)
  }
})

test("every case study a guide cites links back to it", { skip: !built && "no build in public/" }, () => {
  for (const g of guides) {
    for (const slug of g.data.related) assert.ok(html(`case-studies/${slug}`).includes(`href="${g.path}"`), `${slug} does not link to ${g.path}`)
  }
})

test("the header links to case studies and guides", { skip: !built && "no build in public/" }, () => {
  const home = html("")
  assert.ok(home.includes(`href="/case-studies/">case studies</a>`))
  assert.ok(home.includes(`href="/guides/">guides</a>`))
})

test("no built page still says Technical Blog", { skip: !built && "no build in public/" }, () => {
  const walk = dir =>
    readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".html") ? [join(dir, e.name)] : [],
    )
  const hits = walk(PUBLIC).filter(f => /Technical Blog|Blog technique/i.test(readFileSync(f, "utf8")))
  assert.deepEqual(hits, [])
})

// "Boutique tech studio" was dropped on 2026-10-06: no built page or llms.txt may still use it.
test("no built page or llms.txt still says boutique tech studio", { skip: !built && "no build in public/" }, () => {
  const walk = dir =>
    readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(join(dir, e.name)) : /\.(html|txt)$/.test(e.name) ? [join(dir, e.name)] : [],
    )
  const hits = walk(PUBLIC).filter(f => /boutique (tech|technology) studio/i.test(readFileSync(f, "utf8")))
  assert.deepEqual(hits, [])
})

// Several guides read UAE laws: every guide page ends with a visible not-legal-advice
// note, a box with a bold label (asked on 2026-10-07, then asked to make it stand out).
// A guide that does not talk about the law (the OCR benchmarks) may turn it off.
const NOTE = country =>
  new RegExp(`class="cs-disclaimer"[^>]*><strong>Not legal advice\\.</strong> General information only\\. [^<]*ask a lawyer qualified in ${country}\\.<`)
const LEGAL_TOPIC = /\b(lawyer|legal basis|legal advice|PDPL|DIFC|ADGM|data protection|compliance|regulator)/i

test("every guide page carries the not-legal-advice disclaimer unless it turns it off", { skip: !built && "no build in public/" }, () => {
  for (const g of guides) {
    if (g.data.legalDisclaimer === false) assert.doesNotMatch(html(g.path), /class="cs-disclaimer"/, g.path)
    else assert.match(html(g.path), NOTE(g.data.legalJurisdiction || "the UAE"), g.path)
  }
})

test("only guides that do not talk about the law turn the disclaimer off", () => {
  for (const g of guides.filter(g => g.data.legalDisclaimer === false)) {
    assert.doesNotMatch(g.raw, LEGAL_TOPIC, `${g.file} talks about the law and must keep the disclaimer`)
  }
})

// The default share image (static/og-cover.png) shows this line: change both together.
test("the default share image is described with the current positioning", { skip: !built && "no build in public/" }, () => {
  const alt = html("").match(/<meta property="og:image:alt" content="([^"]*)"/)?.[1]
  assert.equal(alt, "arelion.dev, AI consultant in Dubai")
})

// Guides are judged on who wrote them and when (technical audit, 2026-10-07): each
// page names its author and its last update, and its Article data says the same,
// with the author and publisher ids the home page declares.
test("every guide page shows its author and last update, matching its structured data", { skip: !built && "no build in public/" }, () => {
  for (const g of guides) {
    const page = html(g.path)
    const modified = day(g.data.updated || g.data.date)
    assert.match(page, /<p class="cs-detail-date">By <a href="\/about\/">Antonin Ribeaud<\/a>/, g.path)
    // A guide never revised says when it was published, not that it was updated.
    const label = g.data.updated ? "Updated" : "Published"
    assert.ok(page.includes(` · ${label} <time dateTime="${modified}">`), `${g.path}: no "${label}" ${modified}`)
    const article = jsonLd(page).find(n => n["@type"] === "Article")
    assert.equal(article.datePublished, day(g.data.date), g.path)
    assert.equal(article.dateModified, modified, g.path)
    assert.equal(article.author["@id"], "https://arelion.dev/#antonin", g.path)
    assert.equal(article.publisher["@id"], "https://arelion.dev/#organization", g.path)
  }
  const home = jsonLd(html("")).flatMap(d => d["@graph"] || [d]).map(n => n["@id"])
  assert.ok(home.includes("https://arelion.dev/#antonin") && home.includes("https://arelion.dev/#organization"), "the home no longer declares the ids the guides point to")
})

// The Saudi PDPL guide first went out of the box with "a lawyer qualified in the UAE" (2026-10-10).
test("the Saudi PDPL guide sends readers to a lawyer qualified in Saudi Arabia", { skip: !built && "no build in public/" }, () => {
  const page = html("/guides/saudi-pdpl-ai/")
  assert.match(page, NOTE("Saudi Arabia"))
  assert.doesNotMatch(page, /ask a lawyer qualified in the UAE/)
})

// Google retired Gemini 3.5 Flash on 2026-10-08, the day after the benchmark run.
// The measured scores stay; no page may still advise it, and the benchmark
// says how much of Gemini's lead comes from the watermarked book page.
test("the OCR pages no longer advise Gemini 3.5 Flash and explain the watermark page", () => {
  const read = p => readFileSync(join(ROOT, p), "utf8")
  const ocrGuide = read("content/guides/arabic-ocr.md")
  assert.match(ocrGuide, /Google retired Gemini 3\.5 Flash on 8 October 2026/)
  assert.match(ocrGuide, /That page carries a watermark that the transcription leaves out/)
  const pdfGuide = read("content/guides/arabic-pdf-to-text.md")
  assert.doesNotMatch(pdfGuide, /Gemini 3\.5 Flash if the pages may go to Google/)
  assert.match(pdfGuide, /Gemini 3\.8 Flash if the pages may go to Google/)
  assert.doesNotMatch(read("src/tools/ocr-picker.js"), /for about 1\.8 cents/)
})

// ---- The offer box in a guide's text, and the line of its bottom box ----
// Asked on 2026-10-11 for the DIFC guide: an offer inside the text, where a reader
// has just seen the problem, and a bottom box that says what to send me.

// A guide with an `offer` says where its box goes with this comment (src/templates/guide.js).
const OFFER_MARKER = "<!-- offer -->"
const OFFER_BOX = '<aside class="cs-offer">'
// The bottom box of a guide that has no `ctaLine`.
const GENERIC_LINE = "Got this problem? I'll look at yours, in writing."
const DIFC = "/guides/difc-data-protection-ai/"
const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"
// Text as React writes it into HTML.
const escaped = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;")
// The end of a WhatsApp link that names the guide.
const prefilled = title => `?text=${encodeURIComponent(`Hi Antonin, I read "${title}" on arelion.dev`)}`

// The template drops the box of a guide that has one without the other.
test("a guide has an offer and its place in the text together, or neither", () => {
  for (const g of guides) {
    const places = g.raw.split(OFFER_MARKER).length - 1
    assert.equal(places, g.data.offer ? 1 : 0, `${g.file}: ${places} offer marker(s)`)
    if (g.data.offer) assert.ok(g.data.offer.title && g.data.offer.text, `${g.file}: an offer needs a title and a text`)
  }
})

test("the DIFC guide shows its offer box once, after the ChatGPT section and before what to build", { skip: !built && "no build in public/" }, () => {
  const g = guides.find(g => g.path === DIFC)
  const page = html(DIFC)
  assert.equal(page.split(OFFER_BOX).length - 1, 1)
  const at = page.indexOf(OFFER_BOX)
  const chatgpt = page.indexOf("<h2>If your firm uses ChatGPT or a similar tool</h2>")
  const build = page.indexOf("<h2>What an engineer has to build</h2>")
  assert.ok(chatgpt > 0 && build > 0, "a heading around the offer changed")
  assert.ok(chatgpt < at && at < build, "the offer box is not between the two sections")
  // No other heading sits between the ChatGPT section and the box.
  assert.doesNotMatch(page.slice(chatgpt + 4, at), /<h2/)
  const box = page.slice(at, page.indexOf("</aside>", at))
  assert.ok(box.includes(`<p class="cs-offer-title">${escaped(g.data.offer.title)}</p><p>${escaped(g.data.offer.text)}</p>`), box)
  // Its two contact links: WhatsApp naming the guide, then the booking page.
  const links = [...box.matchAll(/<a class="([^"]*)" href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map(([, cls, href, label]) => ({ cls, href, label }))
  assert.deepEqual(links.map(l => [l.cls, l.label]), [["nav-pill nav-pill-whatsapp", "WhatsApp"], ["nav-pill nav-pill-primary", "Book a call"]])
  assert.ok(links[0].href.startsWith("https://wa.me/") && links[0].href.endsWith(prefilled(g.data.title)), links[0].href)
  assert.equal(links[1].href, CALENDAR_URL)
})

test("only a guide with an offer shows an offer box, and no built page shows the marker", { skip: !built && "no build in public/" }, () => {
  for (const g of guides) assert.equal(html(g.path).split(OFFER_BOX).length - 1, g.data.offer ? 1 : 0, g.path)
  assert.ok(!guides.find(g => g.path === "/guides/uae-pdpl-ai/").data.offer && !html("/guides/uae-pdpl-ai/").includes('class="cs-offer'))
  const walk = dir =>
    readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".html") ? [join(dir, e.name)] : [],
    )
  const hits = walk(PUBLIC).filter(f => readFileSync(f, "utf8").includes(OFFER_MARKER))
  assert.deepEqual(hits, [])
})

test("the box at the bottom of a guide shows the guide's own line, or the generic one", { skip: !built && "no build in public/" }, () => {
  const line = path => html(path).match(/<div class="cs-cta"><p>([^<]*)<\/p>/)?.[1]
  for (const g of guides) assert.equal(line(g.path), escaped(g.data.ctaLine || GENERIC_LINE), g.path)
  // Both cases are on the site: the DIFC guide has its own line, the UAE PDPL guide has none.
  assert.ok(guides.find(g => g.path === DIFC).data.ctaLine, "the DIFC guide lost its own line")
  assert.equal(line("/guides/uae-pdpl-ai/"), escaped(GENERIC_LINE))
})
