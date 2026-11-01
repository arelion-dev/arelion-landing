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
// The redirect pages of src/data/moved-pages.js: plain HTML written after the
// build, not Gatsby pages.
const MOVED = require("../src/data/moved-pages.js")
const movedFiles = new Set(MOVED.map(m => join(PUBLIC, m.from, "index.html")))
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
  const pages = walk(PUBLIC).filter(f => f.endsWith(".html") && !f.includes("/_gatsby/") && !movedFiles.has(f))
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
// card names the three I do. The security audit study moved to securityaudit.ae
// on 2026-10-31, and on 2026-11-01 its link went to the new company audits card.
const AUDIT_STUDY = "https://securityaudit.ae/case-studies/ai-attack-surface/"
// The catalog is an ES module in a CommonJS package: load it from its source text.
const loadCatalog = async () =>
  (await import(`data:text/javascript,${encodeURIComponent(readFileSync(join(ROOT, "src/i18n/catalog.js"), "utf8"))}`)).default
// The role cards of the built home, each from its opening tag; the line under
// them is not part of the last card.
const homeRoleCards = () => {
  const home = html("")
  const start = home.indexOf('class="roles-section"')
  const end = home.indexOf('<p class="roles-note"', start)
  return home.slice(start, end > start ? end : home.indexOf("</section>", start)).split('<div class="role-card"').slice(1)
}


test("the Fractional CTO card on the home names its audits, and the company audits card links to the security audit on securityaudit.ae, in English and French", async () => {
  const catalog = await loadCatalog()
  const sentence = {
    en: "I also audit what is already in place: the team, the security and the contracts.",
    fr: "J'audite aussi l'existant : l'équipe, la sécurité et les contrats.",
  }
  for (const lang of ["en", "fr"]) {
    const { leadership, audit } = catalog[lang].roles
    assert.ok(leadership.desc.includes(sentence[lang]), `${lang}: ${leadership.desc}`)
    // One link to the study on the home, in the audits card.
    assert.equal(leadership.links.find(l => l.url === AUDIT_STUDY), undefined, `${lang}: the Fractional CTO card still links the audit study`)
    const link = audit.links.find(l => l.url === AUDIT_STUDY)
    assert.ok(link, `${lang}: no link to the audit study`)
    assert.match(link.label, /securityaudit\.ae$/, `${lang}: the label does not say the study is on securityaudit.ae`)
  }
})

test("the built home shows the audit sentence in its Fractional CTO card, and the audit link in the company audits card, in a new tab", { skip }, () => {
  const [cto, , audit] = homeRoleCards()
  assert.ok(cto.includes("Fractional CTO"), "the first card is no longer Fractional CTO")
  assert.ok(cto.includes("I also audit what is already in place: the team, the security and the contracts."), cto)
  const studyLink = /<a [^>]*href="https:\/\/securityaudit\.ae\/case-studies\/ai-attack-surface\/"[^>]*>/
  assert.doesNotMatch(cto, studyLink, "the Fractional CTO card still links the audit study")
  const link = audit.match(studyLink)
  assert.ok(link, "no link to the audit study on securityaudit.ae")
  assert.match(link[0], /target="_blank"/)
  assert.match(link[0], /rel="noopener"/)
})

// Asked on 2026-10-18: the security offer, exactly as sold: pentests of web apps
// and APIs, AI red teaming (attacks on AI agents and chatbots), security audits
// of apps built with AI coding tools. No certification is claimed, and nothing
// suggests network pentests or full red team exercises, in English or in French.
const OVERCLAIM_WORDS = /certifi|\bCREST\b|\bOSCP\b|network penetration|red team exercise|tests? d'intrusion réseau|exercices? de red team/i
// Case-sensitive, so a class name such as "role-card-desc" does not match.
const OVERCLAIM_ACRONYMS = /\bDESC\b|\bISO\b/
const overclaim = text => (text.match(OVERCLAIM_WORDS) || text.match(OVERCLAIM_ACRONYMS) || [null])[0]

// securityaudit.ae, ARELION's security site, went live on 2026-10-19. On
// 2026-10-31 the security work left arelion.dev for it: the home's security
// card became one line under the other cards, which links to it.
const SECURITY_SITE = "https://securityaudit.ae/"
const SECURITY_NOTE = {
  en: "Security audits, pentests and AI red teaming are on securityaudit.ae, ARELION's security site.",
  fr: "Les audits de sécurité, les pentests et le red teaming IA sont sur securityaudit.ae, le site sécurité d'ARELION.",
}

test("the home has no security card, and one line in English and French sends security work to securityaudit.ae", async () => {
  const catalog = await loadCatalog()
  for (const lang of ["en", "fr"]) {
    const { roles } = catalog[lang]
    assert.equal(roles.security, undefined, `${lang}: the security card is still in the catalog`)
    const note = roles.securityNote
    assert.equal(note.label, "securityaudit.ae", lang)
    assert.equal(`${note.before}${note.label}${note.after}`, SECURITY_NOTE[lang])
    assert.equal(overclaim(SECURITY_NOTE[lang]), null, lang)
    assert.doesNotMatch(SECURITY_NOTE[lang], /[–—]/, `${lang}: dash`)
  }
})

test("the built home shows three role cards, then the line to securityaudit.ae in a new tab", { skip }, () => {
  const home = html("")
  const start = home.indexOf('class="roles-section"')
  const section = home.slice(start, home.indexOf("</section>", start))
  const cards = homeRoleCards()
  assert.equal(cards.length, 3, `${cards.length} role cards`)
  // Each card has its own background colour.
  assert.equal(new Set(cards.map(c => c.match(/style="background-color:([^"]+)"/)?.[1])).size, 3)
  assert.doesNotMatch(section, /Security audits, pentests and AI red teaming<\/h2>/, "the security card is still on the home")
  const note = section.match(/<p class="roles-note">([\s\S]*?)<\/p>/)
  assert.ok(note, "no line to securityaudit.ae under the cards")
  assert.ok(section.indexOf('class="roles-note"') > section.lastIndexOf('class="role-card"'), "the line is not under the cards")
  assert.equal(note[1].replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").trim(), SECURITY_NOTE.en)
  const link = note[1].match(/<a [^>]*href="https:\/\/securityaudit\.ae\/"[^>]*>([^<]*)/)
  assert.ok(link, "the line does not link securityaudit.ae")
  assert.match(link[0], /target="_blank"/)
  assert.match(link[0], /rel="noopener"/)
  assert.equal(link[1].trim(), "securityaudit.ae")
})

// Asked on 2026-10-19: Google Analytics on securityaudit.ae must see arelion.dev
// as the referrer, so every link to it says rel="noopener" without
// "noreferrer", and still opens in a new tab like the site's other outside links.
// The redirect pages are left out: they send the browser on, with no click.
test("every link to securityaudit.ae opens a new tab and keeps arelion.dev as the referrer", { skip }, () => {
  const pages = new Set()
  for (const file of walk(PUBLIC).filter(f => f.endsWith(".html") && !movedFiles.has(f))) {
    const page = file.slice(PUBLIC.length)
    for (const [tag] of readFileSync(file, "utf8").matchAll(/<a [^>]*href="https:\/\/securityaudit\.ae\/[^"]*"[^>]*>/g)) {
      pages.add(page)
      assert.match(tag, /target="_blank"/, `${page}: ${tag}`)
      assert.match(tag, /rel="noopener"/, `${page}: ${tag}`)
      assert.doesNotMatch(tag, /noreferrer/, `${page}: ${tag}`)
    }
  }
  for (const page of ["/index.html", "/about/index.html", "/guides/adgm-data-protection-ai/index.html"]) {
    assert.ok(pages.has(page), `${page} no longer links to securityaudit.ae`)
  }
})

// Asked on 2026-10-31: the six security studies moved to securityaudit.ae.
// GitHub Pages cannot answer a 301, so each old path is a page with a canonical
// link and an instant meta refresh to the new address, which Google treats as
// a permanent redirect.
test("each old path of a security study is a redirect page to securityaudit.ae, with no analytics", { skip }, () => {
  assert.equal(MOVED.length, 6)
  for (const { from, to } of MOVED) {
    const file = join(PUBLIC, from, "index.html")
    assert.ok(existsSync(file), `${from}: no redirect page`)
    const page = readFileSync(file, "utf8")
    assert.ok(page.includes(`<link rel="canonical" href="${to}">`), `${from}: canonical`)
    assert.ok(page.includes(`<meta http-equiv="refresh" content="0; url=${to}">`), `${from}: refresh`)
    assert.ok(page.includes(`<a href="${to}">`), `${from}: no plain link to the new page`)
    assert.doesNotMatch(page, /<script|googletagmanager|noindex/i, from)
    // Not a Gatsby page: no page data at that path.
    assert.ok(!existsSync(join(PUBLIC, "page-data", from, "page-data.json")), `${from} is still a Gatsby page`)
  }
})

test("no page links to an old path of a security study, and none of them is in the sitemap", { skip }, () => {
  const xml = readFileSync(join(PUBLIC, "sitemap-0.xml"), "utf8")
  for (const { from } of MOVED) assert.ok(!xml.includes(`https://arelion.dev${from}<`), `${from} is in the sitemap`)
  for (const file of walk(PUBLIC).filter(f => f.endsWith(".html") && !movedFiles.has(f))) {
    const page = readFileSync(file, "utf8")
    for (const { from } of MOVED) {
      for (const href of [`href="${from}"`, `href="${from.slice(0, -1)}"`, `href="https://arelion.dev${from}"`]) {
        assert.ok(!page.includes(href), `${file.slice(PUBLIC.length)} links ${from}`)
      }
    }
  }
})

// Asked on 2026-10-19: the "AI automation and company brains" and "Document AI
// and data platforms" cards told a buyer the same thing, and the second listed
// a tech stack. One card now, with the links and the proofs of both; the stack
// stays in llms.txt. On 2026-11-01 the cards had too many links: this one keeps
// the three landing pages the home must link, and drops its two guides.
const AI_CARD_LINKS = ["/ai-automation-uae/", "/arabic-ocr/", "/legal-ai-uae/"]

test("the home has three role cards in English and French; the automation and document AI card has the links and proofs of the two it replaces", async () => {
  const catalog = await loadCatalog()
  const titles = { en: "Automation and document AI", fr: "Automatisation et IA documentaire" }
  const proofs = {
    en: [/At L'Oréal, I built the ingestion pipeline for 100M\+ pages/, /sold a document AI SaaS in 2025\./],
    fr: [/Chez L'Oréal, j'ai construit le pipeline d'ingestion de 100M\+ pages/, /revendu un SaaS de document AI en 2025\./],
  }
  for (const lang of ["en", "fr"]) {
    assert.deepEqual(Object.keys(catalog[lang].roles), ["leadership", "ai", "audit", "securityNote"], lang)
    const card = catalog[lang].roles.ai
    assert.equal(card.title, titles[lang])
    assert.equal(card.badge, undefined, lang)
    assert.deepEqual(card.links.map(l => l.to), AI_CARD_LINKS, lang)
    for (const re of proofs[lang]) assert.match(card.desc, re, lang)
    // The approval step stays: nothing goes out without a person.
    assert.match(card.desc, lang === "en" ? /A person approves what goes out\./ : /Une personne valide ce qui part\./)
    assert.doesNotMatch(card.desc, /React|TypeScript|FastAPI|Terraform|GCP/, `${lang}: the card lists a tech stack`)
    assert.doesNotMatch([card.title, card.desc, ...card.links.map(l => l.label)].join(" "), /[\u2013\u2014]/, `${lang}: dash`)
  }
  const llms = readFileSync(join(ROOT, "static/llms.txt"), "utf8")
  assert.ok(llms.includes("Stack: React, React Native, TypeScript, Python, FastAPI, GCP, Terraform."), "llms.txt no longer gives the stack")
})

test("the built home shows Fractional CTO, then automation and document AI with its three links and both proofs, then company audits", { skip }, () => {
  const cards = homeRoleCards()
  assert.deepEqual(
    cards.map(c => c.match(/<h2 class="role-card-title">([^<]*)<\/h2>/)?.[1]),
    ["Fractional CTO", "Automation and document AI", "Company audits: teams, tools, data, contracts and security"],
  )
  const card = cards[1]
  assert.deepEqual([...card.matchAll(/<a [^>]*href="([^"]+)"/g)].map(m => m[1]), AI_CARD_LINKS)
  for (const p of AI_CARD_LINKS) assert.ok(existsSync(join(PUBLIC, p, "index.html")), `${p} has no page`)
  for (const figure of ["100M+ pages", "2025"]) assert.ok(card.includes(figure), `the card no longer says ${figure}`)
})

// Asked on 2026-11-01: an audits card again, for a whole company or group (its
// people, tools, accounts, documents, data, access rights, contracts and
// security). Pentests and AI red teaming stay on securityaudit.ae. No client is named: the repo is public.
const AUDIT_CARD_LINKS = [AUDIT_STUDY, "/case-studies/fractional-cpto-programme/"]

test("the company audits card covers a whole company or group, not only its security, and ends on a ranked report, in English and French", async () => {
  const catalog = await loadCatalog()
  const expected = {
    en: {
      title: "Company audits: teams, tools, data, contracts and security",
      scope: [/company or group/, /who does what/, /tools and accounts/, /documents and data/, /vendor contracts/, /your security/],
      report: /I interview your team, then hand you a report that ranks what to fix and what to automate\./,
    },
    fr: {
      title: "Audits d'entreprise : équipes, outils, données, contrats et sécurité",
      scope: [/entreprise ou votre groupe/, /qui fait quoi/, /outils et vos comptes/, /documents et vos données/, /vos contrats/, /votre sécurité/],
      report: /Après des entretiens avec votre équipe, je vous remets un rapport qui classe ce qu'il faut corriger et automatiser\./,
    },
  }
  for (const lang of ["en", "fr"]) {
    const card = catalog[lang].roles.audit
    assert.equal(card.title, expected[lang].title)
    for (const re of expected[lang].scope) assert.match(card.desc, re, lang)
    assert.match(card.desc, expected[lang].report, lang)
    assert.deepEqual(card.links.map(l => l.url || l.to), AUDIT_CARD_LINKS, lang)
    const text = [card.title, card.desc, ...card.links.map(l => l.label)].join(" ")
    assert.equal(overclaim(text), null, lang)
    assert.doesNotMatch(text, /[\u2013\u2014]/, `${lang}: dash`)
  }
})

// Asked on 2026-11-01: the links under the cards were too many (nine) and the
// texts uneven. Each card keeps three links at most, and no text is more than
// a quarter longer than the shortest, in English and in French.
test("the home's role cards have three links at most and texts of close length, in English and French", async () => {
  const catalog = await loadCatalog()
  for (const lang of ["en", "fr"]) {
    const cards = ["leadership", "ai", "audit"].map(k => catalog[lang].roles[k])
    for (const card of cards) assert.ok(card.links.length <= 3, `${lang} ${card.title}: ${card.links.length} links`)
    const lengths = cards.map(c => c.desc.length)
    assert.ok(Math.max(...lengths) <= 1.25 * Math.min(...lengths), `${lang}: card texts of ${lengths.join(", ")} characters`)
  }
})

test("the built home's company audits card links the security audit in a new tab and the fractional CTO study on this site", { skip }, () => {
  const card = homeRoleCards()[2]
  assert.ok(card.includes("I interview your team, then hand you a report that ranks what to fix and what to automate."), card)
  assert.deepEqual([...card.matchAll(/<a [^>]*href="([^"]+)"/g)].map(m => m[1]), AUDIT_CARD_LINKS)
  assert.ok(existsSync(join(PUBLIC, "/case-studies/fractional-cpto-programme/", "index.html")), "the fractional CTO study has no page")
})

test("llms.txt lists company audits under Services and When to use", () => {
  const llms = readFileSync(join(ROOT, "static/llms.txt"), "utf8")
  const section = name => llms.split(`\n## ${name}\n`)[1].split("\n## ")[0]
  assert.match(section("When to use Arelion"), /^- Audit a company or a group before it changes tools or adds AI: .*a report that ranks what to fix and what to automate\.$/m)
  assert.match(section("Services"), /^- Company audits: teams, tools, data, contracts and security\. Interviews with the team/m)
})

test("llms.txt lists the security offer under Services and When to use, sends it to securityaudit.ae and links no arelion.dev security study", () => {
  const llms = readFileSync(join(ROOT, "static/llms.txt"), "utf8")
  const section = name => llms.split(`\n## ${name}\n`)[1].split("\n## ")[0]
  const service = section("Services").split("\n").find(l => l.startsWith("- Security audits, pentests and AI red teaming: "))
  assert.ok(service, "no security line under Services")
  const when = section("When to use Arelion").split("\n").filter(l => /penetration tests of web apps and APIs/.test(l))
  assert.equal(when.length, 1, "no security line under When to use Arelion")
  for (const line of [service, when[0]]) {
    for (const re of [/penetration tests of web apps and APIs/, /AI red teaming|attacks on AI agents and chatbots/, /security audits of apps built with AI coding tools/]) assert.match(line, re)
    assert.ok(line.includes(SECURITY_SITE), `${line}: no link to securityaudit.ae`)
    assert.equal(overclaim(line), null, line)
    assert.doesNotMatch(line, /[–—]/)
  }
  assert.ok(service.includes("https://securityaudit.ae/case-studies/"), "the Services line does not point to the security case studies")
  assert.ok(section("Case studies").includes("https://securityaudit.ae/case-studies/"), "the Case studies list does not point to securityaudit.ae")
  for (const { from } of MOVED) assert.ok(!llms.includes(`https://arelion.dev${from}`), `llms.txt still links ${from}`)
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

