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

test("llms.txt lists every guide", () => {
  const llms = readFileSync(join(ROOT, "static/llms.txt"), "utf8")
  for (const g of guides) assert.ok(llms.includes(`https://arelion.dev${g.path}`), `${g.path} missing from static/llms.txt`)
})

test("guides do not name a client", () => {
  for (const g of guides) assert.doesNotMatch(g.raw, CLIENTS, g.file)
})

const built = existsSync(join(PUBLIC, "index.html"))
const html = p => readFileSync(join(PUBLIC, p, "index.html"), "utf8")

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

// The default share image (static/og-cover.png) shows this line: change both together.
test("the default share image is described with the current positioning", { skip: !built && "no build in public/" }, () => {
  const alt = html("").match(/<meta property="og:image:alt" content="([^"]*)"/)?.[1]
  assert.equal(alt, "arelion.dev, AI consultant in Dubai")
})
