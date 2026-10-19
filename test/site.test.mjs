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
const { offersOf } = require("../src/data/offers.js")

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

// Profiles audit of 2026-10-13: llms.txt linked a "Personal blog" on
// antonin.cool, which redirects to this site's home, said nothing about Arelion
// AB, and its Contact section had no contact page, WhatsApp, company page or
// Hugging Face.
test("llms.txt tells Arelion apart from Arelion AB, links no antonin.cool, and lists every contact channel", () => {
  const llms = readFileSync(join(ROOT, "static/llms.txt"), "utf8")
  assert.doesNotMatch(llms, /antonin\.cool/)
  assert.ok(llms.slice(0, llms.indexOf("\n## ")).includes("Not affiliated with Arelion AB, the Swedish telecom carrier."), "no Arelion AB line before the first section")
  const contact = llms.split("\n## Contact\n")[1]
  assert.ok(contact, "no Contact section")
  // Same WhatsApp link as the site's buttons: same number, same prefilled text.
  const { whatsapp } = require("../gatsby-config.js").siteMetadata.social
  for (const url of [
    "https://arelion.dev/contact/",
    whatsapp,
    "https://www.linkedin.com/company/arelion-fzco/",
    "https://huggingface.co/Antonhansel",
  ]) assert.ok(contact.split("\n").some(l => l.endsWith(`: ${url}`)), `Contact does not list ${url}`)
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

// Technical audit of 2026-10-13: no page named the site for share previews, and
// every page carried an empty twitter:creator (the site has no X account).
test("every page names the site arelion.dev in og:site_name and carries no empty twitter:creator", { skip }, () => {
  const pages = walk(PUBLIC).filter(f => f.endsWith(".html") && !f.includes("/_gatsby/"))
  assert.ok(pages.length > 10, `only ${pages.length} pages found`)
  for (const f of pages) {
    const page = readFileSync(f, "utf8")
    assert.deepEqual([...page.matchAll(/<meta property="og:site_name" content="([^"]*)"/g)].map(m => m[1]), ["arelion.dev"], f)
    assert.doesNotMatch(page, /<meta name="twitter:creator" content=""/, f)
  }
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

// Profiles audit of 2026-10-13: the home graph had no WebSite node and no logo,
// the consultancy listed the person's profiles (one of them antonin.cool, which
// redirects to this site), nothing told it apart from Arelion AB, the telecom
// carrier, and /about had no structured data.
const SITE_ID = "https://arelion.dev/#website"
const ORG_ID = "https://arelion.dev/#organization"
const PERSON_ID = "https://arelion.dev/#antonin"
test("the home graph names the site, the consultancy and the person, each with its own profiles", { skip }, () => {
  const nodes = ldNodes(html(""))
  const byId = id => nodes.find(n => n["@id"] === id) || assert.fail(`no node ${id} on the home`)
  const site = byId(SITE_ID)
  assert.equal(site["@type"], "WebSite")
  assert.equal(site.name, "arelion.dev")
  assert.ok(site.alternateName.includes("ARELION"), "the site does not list ARELION as an alternate name")
  assert.equal(site.url, "https://arelion.dev/")
  assert.equal(site.publisher["@id"], ORG_ID)

  const org = byId(ORG_ID)
  assert.ok(org.logo.startsWith("https://arelion.dev/") && existsSync(join(PUBLIC, org.logo.slice("https://arelion.dev/".length))), `logo ${org.logo} is not a built file`)
  assert.ok(org.alternateName.includes("ARELION FZCO"), "the consultancy does not list its legal name as an alternate name")
  assert.equal(org.foundingDate, "2026-01-26")
  assert.ok(html("about").includes("constituted on 26 January 2026"), "/about no longer gives the date the founding date comes from")
  assert.match(org.disambiguatingDescription, /Not affiliated with Arelion AB/)
  assert.ok(org.sameAs.includes("https://www.linkedin.com/company/arelion-fzco/"), "the consultancy does not list its LinkedIn page")

  const person = byId(PERSON_ID)
  assert.equal(person.jobTitle, "AI consultant and engineer")
  assert.deepEqual(org.sameAs.filter(u => person.sameAs.includes(u)), [], "the consultancy and the person share a profile")
  for (const u of [...org.sameAs, ...person.sameAs]) assert.doesNotMatch(u, /arelion\.dev|antonin\.cool/, `${u} points back to this site`)
})

test("/about declares an AboutPage about the organization of the home", { skip }, () => {
  const about = ldNodes(html("about")).find(n => n["@type"] === "AboutPage")
  assert.ok(about, "no AboutPage on /about")
  assert.equal(about.url, "https://arelion.dev/about/")
  assert.equal(about.mainEntity["@id"], ORG_ID)
  assert.ok(ldNodes(html("")).some(n => n["@id"] === ORG_ID), "the home no longer declares the organization")
})

// Asked on 2026-10-11: the home said nothing about audits. The Fractional CTO
// card now names the three I do and links to the security audit study.
test("the Fractional CTO card on the home names its audits and links to the security audit, in English and French", async () => {
  // The catalog is an ES module in a CommonJS package: load it from its source text.
  const { default: catalog } = await import(
    `data:text/javascript,${encodeURIComponent(readFileSync(join(ROOT, "src/i18n/catalog.js"), "utf8"))}`
  )
  const AUDIT = "/case-studies/ai-attack-surface/"
  assert.ok(CASE_STUDIES.some(c => `/case-studies/${c.slug}/` === AUDIT), "the audit study is no longer published")
  const sentence = {
    en: "I also audit what is already in place: the team, the security and the contracts.",
    fr: "J'audite aussi l'existant : l'équipe, la sécurité et les contrats.",
  }
  for (const lang of ["en", "fr"]) {
    const card = catalog[lang].roles.leadership
    assert.ok(card.desc.includes(sentence[lang]), `${lang}: ${card.desc}`)
    assert.ok(card.links.some(l => l.to === AUDIT), `${lang}: no link to the audit study`)
  }
})

test("the built home shows the audit sentence and the audit link in its Fractional CTO card", { skip }, () => {
  const home = html("")
  const start = home.indexOf('<div class="role-card"')
  assert.ok(start > 0, "no role card on the home")
  const card = home.slice(start, home.indexOf('<div class="role-card"', start + 1))
  assert.ok(card.includes("Fractional CTO"), "the first card is no longer Fractional CTO")
  assert.ok(card.includes("I also audit what is already in place: the team, the security and the contracts."), card)
  assert.match(card, /<a [^>]*href="\/case-studies\/ai-attack-surface\/"/)
})

// Asked on 2026-10-18: a home card and llms.txt lines for the security offer,
// exactly as sold: pentests of web apps and APIs, AI red teaming (attacks on AI
// agents and chatbots), security audits of apps built with AI coding tools. No
// certification is claimed, and nothing suggests network pentests or full red
// team exercises, in English or in French.
const OVERCLAIM_WORDS = /certifi|\bCREST\b|\bOSCP\b|network penetration|red team exercise|tests? d'intrusion réseau|exercices? de red team/i
// Case-sensitive, so a class name such as "role-card-desc" does not match.
const OVERCLAIM_ACRONYMS = /\bDESC\b|\bISO\b/
const overclaim = text => (text.match(OVERCLAIM_WORDS) || text.match(OVERCLAIM_ACRONYMS) || [null])[0]
const securityStudy = path => CASE_STUDIES.find(cs => `/case-studies/${cs.slug}/` === path && offersOf(cs).includes("Security"))
const loadCatalog = async () =>
  (await import(`data:text/javascript,${encodeURIComponent(readFileSync(join(ROOT, "src/i18n/catalog.js"), "utf8"))}`)).default

test("the home has a security card in English and French: risk first, the three services, one proof, links to security studies", async () => {
  const catalog = await loadCatalog()
  const expected = {
    en: {
      title: "Security audits, pentests and AI red teaming",
      risk: /leaking client data/,
      services: [/penetration tests of web apps and APIs/, /AI red teaming/, /security audits of apps built with AI coding tools/],
      proof: /49 issues, nine of them high severity/,
    },
    fr: {
      title: "Audits de sécurité, pentests et red teaming IA",
      risk: /faire fuiter des données clients/,
      services: [/pentests d'applications web et d'API/, /red teaming IA/, /audits de sécurité des applications codées avec des outils d'IA/],
      proof: /49 problèmes, dont neuf de sévérité haute/,
    },
  }
  const audit = CASE_STUDIES.find(cs => cs.slug === "ai-attack-surface")
  assert.match(audit.metric.en, /^49 findings, nine of them high severity/, "the audit study no longer gives the figure the card quotes")
  for (const lang of ["en", "fr"]) {
    const card = catalog[lang].roles.security
    const want = expected[lang]
    assert.ok(card, `${lang}: no security card`)
    assert.equal(card.title, want.title)
    assert.equal(card.badge, undefined, `${lang}: the security card has a badge`)
    // The risk comes before the services, the services before the proof.
    const at = re => card.desc.search(re)
    assert.ok(at(want.risk) >= 0 && at(want.risk) < card.desc.indexOf(". "), `${lang}: the first sentence does not give the risk`)
    for (const re of want.services) assert.ok(at(re) > at(want.risk), `${lang}: ${re} missing or before the risk`)
    assert.ok(at(want.proof) > Math.max(...want.services.map(at)), `${lang}: the proof is missing or not last`)
    assert.ok(card.links.length >= 2, `${lang}: ${card.links.length} link(s)`)
    for (const l of card.links) assert.ok(securityStudy(l.to), `${lang}: ${l.to} is not a published security study`)
    assert.ok(card.links.some(l => l.to === "/case-studies/ai-attack-surface/"), `${lang}: no link to the study the proof comes from`)
    const text = [card.title, card.desc, ...card.links.map(l => l.label)].join(" ")
    assert.equal(overclaim(text), null, lang)
    assert.doesNotMatch(text, /[\u2013\u2014]/, `${lang}: dash`)
    assert.doesNotMatch(text, /securityaudit\.ae/, `${lang}: links the site that is not live yet`)
  }
})

test("the built home shows the security card with its links", { skip }, () => {
  const home = html("")
  const start = home.indexOf('class="roles-section"')
  const section = home.slice(start, home.indexOf("</section>", start))
  const cards = section.split('<div class="role-card"').slice(1)
  assert.equal(cards.length, 4, `${cards.length} role cards`)
  const card = cards.find(c => c.includes("Security audits, pentests and AI red teaming"))
  assert.ok(card, "no security card on the home")
  // Each card has its own background colour.
  assert.equal(new Set(cards.map(c => c.match(/style="background-color:([^"]+)"/)?.[1])).size, 4)
  assert.match(card, /<a [^>]*href="\/case-studies\/ai-attack-surface\/"/)
  assert.match(card, /<a [^>]*href="\/case-studies\/prompt-injection-email-test\/"/)
  assert.equal(overclaim(card.replace(/<[^>]+>/g, " ")), null)
})

test("llms.txt lists the security offer under Services and When to use, with two security studies", () => {
  const llms = readFileSync(join(ROOT, "static/llms.txt"), "utf8")
  const section = name => llms.split(`\n## ${name}\n`)[1].split("\n## ")[0]
  const service = section("Services").split("\n").find(l => l.startsWith("- Security audits, pentests and AI red teaming: "))
  assert.ok(service, "no security line under Services")
  const when = section("When to use Arelion").split("\n").filter(l => /penetration tests of web apps and APIs/.test(l))
  assert.equal(when.length, 1, "no security line under When to use Arelion")
  for (const line of [service, when[0]]) {
    for (const re of [/penetration tests of web apps and APIs/, /AI red teaming|attacks on AI agents and chatbots/, /security audits of apps built with AI coding tools/]) assert.match(line, re)
    assert.equal(overclaim(line), null, line)
    assert.doesNotMatch(line, /securityaudit\.ae|[\u2013\u2014]/)
  }
  const linked = [...service.matchAll(/\[([^\]]+)\]\(https:\/\/arelion\.dev(\/case-studies\/[^)]+)\)/g)]
  assert.ok(linked.length >= 2, `${linked.length} case studies linked`)
  for (const [, title, path] of linked) {
    const cs = securityStudy(path)
    assert.ok(cs, `${path} is not a published security study`)
    assert.equal(title, cs.title.en, path)
  }
})

test("the home graph lists the three security services in knowsAbout", { skip }, () => {
  const nodes = ldNodes(html(""))
  for (const id of [ORG_ID, PERSON_ID]) {
    const node = nodes.find(n => n["@id"] === id)
    for (const s of ["Web Application and API Penetration Testing", "AI Red Teaming", "Security Audits of AI-Generated Code"]) {
      assert.ok(node.knowsAbout.includes(s), `${id} does not list ${s}`)
    }
    assert.equal(overclaim(node.knowsAbout.join(" ")), null, id)
  }
})

// IndexNow (2026-10-11): the SEO tracker tells Bing which pages are new or
// changed, signed with a key. Bing checks that the site owns the key by reading
// the file named after it at the root. The tracker's config, kept in another
// repo, holds the same key and refuses to submit when this file is not served.
const indexNowKeys = () => readdirSync(join(ROOT, "static")).filter(f => /^[0-9a-f]{32}\.txt$/.test(f))

test("one IndexNow key file sits in static/ and holds its own name", () => {
  const files = indexNowKeys()
  assert.equal(files.length, 1, `IndexNow key files in static/: ${files.join(", ") || "none"}`)
  assert.equal(readFileSync(join(ROOT, "static", files[0]), "utf8").trim(), files[0].replace(/\.txt$/, ""))
})

test("the built site serves the IndexNow key file at its root", { skip }, () => {
  const [file] = indexNowKeys()
  assert.ok(file, "no IndexNow key file in static/")
  assert.equal(readFileSync(join(PUBLIC, file), "utf8").trim(), file.replace(/\.txt$/, ""))
})

