// Site-wide checks from the technical and Search Console audits of 2026-10-07:
// home links, sitemap, llms.txt, RSS, the 404 page, internal links, script
// weight and fonts. The output checks need `npm run build` first; without
// public/ they are skipped.
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
const PUBLIC = join(ROOT, "public")
const built = existsSync(join(PUBLIC, "index.html"))
const skip = !built && "no build in public/"
const html = p => readFileSync(join(PUBLIC, p, "index.html"), "utf8")
const walk = dir =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))
// Frontmatter dates arrive as strings or as Date objects, depending on the quotes.
const day = d => (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10)

const LANDING_PAGES = ["/legal-ai-uae/", "/ai-automation-uae/", "/software-development-abu-dhabi/", "/arabic-ocr/"]
const guides = readdirSync(join(ROOT, "content/guides"))
  .filter(f => f.endsWith(".md"))
  .map(f => matter(readFileSync(join(ROOT, "content/guides", f), "utf8")).data)
  .map(data => ({ data, path: `/${String(data.path).replace(/^\/+|\/+$/g, "")}/` }))

// The home gets the backlinks and passes the most link weight: it must reach the
// pages that sell and the guides.
test("the home links the four landing pages, the guides index and several guides", { skip }, () => {
  const home = html("")
  for (const p of LANDING_PAGES) assert.ok(home.includes(`href="${p}"`), `the home does not link ${p}`)
  assert.ok(home.includes(`href="/guides/"`), "the home does not link the guides index")
  const linked = guides.filter(g => g.path.startsWith("/guides/") && home.includes(`href="${g.path}"`))
  assert.ok(linked.length >= 3, `the home links ${linked.length} guides`)
})

test("guides and case studies carry their own date in the sitemap; pages with no date of their own carry none", { skip }, () => {
  const xml = readFileSync(join(PUBLIC, "sitemap-0.xml"), "utf8")
  const urls = [...xml.matchAll(/<url><loc>https:\/\/arelion\.dev([^<]*)<\/loc>(?:<lastmod>([^<]*)<\/lastmod>)?/g)].map(m => ({
    path: m[1],
    lastmod: m[2] && m[2].slice(0, 10),
  }))
  const guideDays = new Map(guides.map(g => [g.path, day(g.data.updated || g.data.date)]))
  const studyDays = new Map(CASE_STUDIES.map(cs => [`/case-studies/${cs.slug}/`, cs.updated || cs.date]))
  for (const p of [...guideDays.keys(), ...studyDays.keys(), "/"]) assert.ok(urls.some(u => u.path === p), `${p} missing from the sitemap`)
  for (const { path, lastmod } of urls) {
    if (guideDays.has(path)) assert.equal(lastmod, guideDays.get(path), path)
    else if (studyDays.has(path)) assert.equal(lastmod, studyDays.get(path), path)
    else assert.equal(lastmod, undefined, `${path}: a page with no date of its own must not claim a lastmod`)
  }
})

test("llms.txt names the four landing pages under Services", () => {
  const llms = readFileSync(join(ROOT, "static/llms.txt"), "utf8")
  const services = llms.split("\n## Services\n")[1].split("\n## ")[0]
  for (const p of LANDING_PAGES) assert.ok(services.includes(`(https://arelion.dev${p})`), `${p} missing from Services`)
})

// Regression: two items pointed at /blog/ pages that return 404, and the feed
// was called "Gatsby RSS Feed".
test("every RSS item links to a built page, and the feed carries the site name", { skip }, () => {
  const rss = readFileSync(join(PUBLIC, "rss.xml"), "utf8")
  assert.match(rss, /<channel><title><!\[CDATA\[arelion\.dev\]\]><\/title>/)
  const links = [...rss.matchAll(/<item>.*?<link>https:\/\/arelion\.dev([^<]*)<\/link>/gs)].map(m => m[1])
  assert.ok(links.length > 0, "no item in the feed")
  for (const p of links) assert.ok(existsSync(join(PUBLIC, p, "index.html")), `${p} is in the feed but has no page`)
})

// /404/ and /404.html answer 200: without noindex they can be indexed as soft 404s.
test("only the 404 page asks search engines not to index it", { skip }, () => {
  const pages = walk(PUBLIC).filter(f => f.endsWith(".html"))
  const notFound = pages.filter(f => /\/404(\.html|\/index\.html)$/.test(f))
  assert.equal(notFound.length, 2)
  for (const f of notFound) {
    const page = readFileSync(f, "utf8")
    assert.match(page, /<meta name="robots" content="noindex"/, f)
    assert.doesNotMatch(page, /rel="canonical"/, f)
  }
  for (const f of pages.filter(f => !notFound.includes(f))) assert.doesNotMatch(readFileSync(f, "utf8"), /name="robots"/, f)
})

// Regression: /about, /contact and /privacy were linked without their trailing
// slash, so each link went through a 301.
test("internal links point to the final URL, trailing slash included", { skip }, () => {
  const bad = []
  for (const f of walk(PUBLIC).filter(f => f.endsWith(".html"))) {
    for (const [, href] of readFileSync(f, "utf8").matchAll(/href="(\/[^"#?]*)/g)) {
      if (!href.endsWith("/") && !/\.[a-z0-9]+$/i.test(href)) bad.push(`${f.slice(PUBLIC.length)}: ${href}`)
    }
  }
  const llms = readFileSync(join(ROOT, "static/llms.txt"), "utf8")
  for (const [, path] of llms.matchAll(/https:\/\/arelion\.dev(\/[^\s)]*)/g)) {
    if (!path.endsWith("/") && !/\.[a-z0-9]+$/i.test(path)) bad.push(`llms.txt: ${path}`)
  }
  assert.deepEqual(bad, [])
})

// The layout imported src/data/case-studies.js for one length check, which put
// every case study (about 250 KB of script) on pages that show none.
test("the layout does not ship the case-study data", { skip }, () => {
  assert.doesNotMatch(readFileSync(join(ROOT, "src/components/portfolio-layout.js"), "utf8"), /data\/case-studies/)
  const sample = CASE_STUDIES.map(cs => cs.title.en).find(t => /^[\w ,:()+.-]+$/.test(t))
  const stats = JSON.parse(readFileSync(join(PUBLIC, "webpack.stats.json"), "utf8"))
  const scripts = group => stats.namedChunkGroups[group].assets.map(a => a.name || a).filter(a => a.endsWith(".js"))
  // The case-study template does load the data: it proves the sample is findable.
  assert.ok(scripts("component---src-templates-case-study-js").some(a => readFileSync(join(PUBLIC, a), "utf8").includes(sample)))
  for (const group of ["component---src-pages-guides-js", "component---src-pages-testimonials-js"]) {
    for (const a of scripts(group)) assert.ok(!readFileSync(join(PUBLIC, a), "utf8").includes(sample), `${group} loads ${a}, which holds the case-study data`)
  }
})

// Google Fonts came in through a render-blocking @import (lab mobile LCP over 4 s).
test("fonts are self-hosted with font-display swap, and the main one is preloaded", { skip }, () => {
  const css = readFileSync(join(ROOT, "src/style.css"), "utf8")
  assert.doesNotMatch(css, /@import/)
  const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(m => m[1])
  for (const family of ["Inter", "JetBrains Mono"]) {
    const own = faces.filter(f => f.includes(`font-family: "${family}"`))
    assert.ok(own.length > 0, `no @font-face for ${family}`)
    for (const f of own) {
      assert.match(f, /font-display: swap/, family)
      const url = f.match(/url\("([^"]+)"\)/)[1]
      assert.ok(existsSync(join(ROOT, "static", url)), `${url} is not in static/`)
    }
  }
  for (const f of walk(PUBLIC).filter(f => f.endsWith(".html"))) assert.doesNotMatch(readFileSync(f, "utf8"), /fonts\.(googleapis|gstatic)\.com/, f)
  const preload = html("").match(/<link rel="preload" href="([^"]+)" as="font" type="font\/woff2" crossorigin="anonymous"\/>/)
  assert.ok(preload, "no font preload on the home")
  assert.ok(faces.some(f => f.includes(`font-family: "Inter"`) && f.includes(`url("${preload[1]}")`)), `${preload[1]} is not an Inter source`)
})

// Montserrat was imported on every page (18 @font-face rules) while no CSS rule used it.
test("every font package gatsby-browser imports is used by the CSS", () => {
  const browser = readFileSync(join(ROOT, "gatsby-browser.js"), "utf8")
  const css = readFileSync(join(ROOT, "src/style.css"), "utf8")
  const families = [...browser.matchAll(/import "(?:typeface-|@fontsource\/)([a-z-]+)"/g)].map(m => m[1].replace(/-/g, " "))
  assert.ok(families.length > 0, "no font package found: the check is broken")
  for (const f of families) assert.match(css, new RegExp(`"${f}"`, "i"), `${f} is imported but no CSS rule uses it`)
})

// The home graph and the case studies describe the same Person (same @id), so
// they list the same profiles; /about links the freelance ones (2026-10-10).
const FREELANCE_PROFILES = ["https://www.malt.fr/profile/antoninribeaud", "https://www.collective.work/profile/antonin-ribeaud"]
const ldNodes = page =>
  [...page.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(m => [JSON.parse(m[1])].flat())
    .flatMap(d => d["@graph"] || [d])
test("the home Person, every case-study author and /about point to the Malt and Collective profiles", { skip }, () => {
  const person = ldNodes(html("")).find(n => n["@id"] === "https://arelion.dev/#antonin")
  assert.ok(person, "no Person with the @id #antonin on the home")
  for (const p of FREELANCE_PROFILES) assert.ok(person.sameAs.includes(p), `the home Person does not list ${p}`)
  for (const cs of CASE_STUDIES) {
    const author = ldNodes(html(`case-studies/${cs.slug}`)).map(n => n.author).find(a => a && a["@id"] === person["@id"])
    assert.ok(author, `${cs.slug}: no author with the home Person @id`)
    assert.deepEqual(author.sameAs, person.sameAs, `${cs.slug}: the author lists other profiles than the home Person`)
  }
  const about = html("about")
  for (const p of FREELANCE_PROFILES) assert.ok(about.includes(`href="${p}"`), `/about does not link ${p}`)
})
