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
