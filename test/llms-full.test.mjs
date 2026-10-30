// llms-full.txt (scripts/llms-full.mjs, written by gatsby-node onPostBuild):
// one section per URL of the sitemap, in its order, each exactly the page's
// title, URL and the text of its <main>; mainText drops forms, scripts and
// drawings and decodes entities (a page may still show "&amp;" as text: that
// text stays); llms.txt points to it. The checks on the build need
// `npm run build` first; without public/ they are skipped.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { mainText, decode } from "../scripts/llms-full.mjs"

const ROOT = new URL("..", import.meta.url).pathname
const PUBLIC = join(ROOT, "public")
const skip = !existsSync(join(PUBLIC, "llms-full.txt")) && "no build in public/"
const read = rel => readFileSync(join(PUBLIC, rel), "utf8")
const flat = s => s.replace(/\s+/g, " ").trim()

test("llms-full.txt has one section per sitemap URL, each exactly its page's title, URL and main text", { skip }, () => {
  const full = read("llms-full.txt")
  const locs = [...read("sitemap-0.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  assert.deepEqual([...full.matchAll(/^URL: (\S+)$/gm)].map(m => m[1]), locs)
  for (const u of locs) {
    const html = read(join(new URL(u).pathname, "index.html"))
    const title = decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/)[1].trim())
    assert.ok(full.includes(`## ${title}\n\nURL: ${u}\n\n${mainText(html)}\n`), `${u}: section`)
    const h1 = flat(decode(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, " ")))
    assert.ok(flat(mainText(html)).includes(h1), `${u}: h1`)
  }
})

test("llms.txt points to llms-full.txt", () => {
  assert.match(readFileSync(join(ROOT, "static/llms.txt"), "utf8"), /^- .*https:\/\/arelion\.dev\/llms-full\.txt$/m)
})

test("mainText keeps the text of <main> only, without forms, scripts or drawings", () => {
  const html = `<header>Top</header><main class="x"><h1>A &amp; B &rarr; C</h1><svg><text>chart</text></svg><p>One<br>Two</p><form><label>Name</label></form><script>alert(1)</script><ul><li>&#39;x&#39;</li></ul></main><footer>End</footer>`
  assert.equal(mainText(html), "A & B → C\nOne\nTwo\n'x'")
})
