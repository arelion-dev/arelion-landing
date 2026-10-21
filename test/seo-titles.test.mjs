// Every published page keeps a title Google shows whole (25 to 65 characters,
// the range the arelion-seo audit checks) and structured data. The checks need
// `npm run build` first.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const PUBLIC = join(new URL("..", import.meta.url).pathname, "public")
const built = existsSync(join(PUBLIC, "index.html"))

// The pages of the sitemap: every index.html except the 404 and Gatsby internals.
function pages(dir = PUBLIC) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return /^(page-data|static|404|dev-404-page|~partytown)$/.test(name) ? [] : pages(p)
    return name === "index.html" ? [p] : []
  })
}
const decode = s => s.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
const titleOf = html => decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || "")

test("every page title fits in Google's results", { skip: !built && "no build in public/" }, () => {
  const bad = pages()
    .map(f => ({ page: `/${relative(PUBLIC, f).replace(/index\.html$/, "")}`, title: titleOf(readFileSync(f, "utf8")) }))
    .filter(p => p.title.length < 25 || p.title.length > 65)
  assert.deepEqual(bad, [])
})

test("the brand suffix goes on only when the title stays within 60 characters", { skip: !built && "no build in public/" }, () => {
  const about = titleOf(readFileSync(join(PUBLIC, "about/index.html"), "utf8"))
  assert.equal(about, "About Arelion, AI consultancy in Dubai | arelion.dev")
  const ocr = titleOf(readFileSync(join(PUBLIC, "arabic-ocr/index.html"), "utf8"))
  assert.ok(!ocr.endsWith("| arelion.dev"), ocr)
})

test("every page carries structured data", { skip: !built && "no build in public/" }, () => {
  const missing = pages()
    .filter(f => !/application\/ld\+json/.test(readFileSync(f, "utf8")))
    .map(f => `/${relative(PUBLIC, f)}`)
  assert.deepEqual(missing, [])
})
