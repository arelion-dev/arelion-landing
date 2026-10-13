// Page by page checks of the built site, from the technical audit of
// 2026-10-13: every URL of the sitemap has a page with one H1, a canonical and
// an og:url equal to that URL, no noindex, and structured data that parses.
// They need `npm run build` first; without public/ they are skipped.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname
const PUBLIC = join(ROOT, "public")
const built = existsSync(join(PUBLIC, "index.html"))
const skip = !built && "no build in public/"
const SITE = "https://arelion.dev"

const locs = () => {
  const xml = readFileSync(join(PUBLIC, "sitemap-0.xml"), "utf8")
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1])
}
const attr = (page, re) => [...page.matchAll(re)].map(m => m[1])

test("every sitemap URL has a built page with one H1, its own canonical and og:url, no noindex and valid JSON-LD", { skip }, () => {
  const urls = locs()
  assert.ok(urls.length > 10, `only ${urls.length} URLs in the sitemap`)
  for (const loc of urls) {
    assert.ok(loc.startsWith(`${SITE}/`), `${loc} is not on ${SITE}`)
    const file = join(PUBLIC, loc.slice(SITE.length), "index.html")
    assert.ok(existsSync(file), `${loc}: no built page`)
    const page = readFileSync(file, "utf8")
    assert.equal((page.match(/<h1[\s>]/g) || []).length, 1, `${loc}: H1 count`)
    assert.deepEqual(attr(page, /<link rel="canonical" href="([^"]*)"/g), [loc], `${loc}: canonical`)
    assert.deepEqual(attr(page, /<meta property="og:url" content="([^"]*)"/g), [loc], `${loc}: og:url`)
    assert.doesNotMatch(page, /<meta name="robots" content="[^"]*noindex/, `${loc}: noindex`)
    for (const json of attr(page, /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => JSON.parse(json), `${loc}: JSON-LD does not parse`)
    }
  }
})
