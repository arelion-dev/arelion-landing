// Regression: draft case studies (published: false) used to ship in the public
// JavaScript bundle and in its source maps, so anyone could read them. A
// production build must hold none of their text and no source map.
import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname
const PUBLIC = join(ROOT, "public")
const built = existsSync(join(PUBLIC, "index.html"))

const load = env =>
  JSON.parse(
    execFileSync(process.execPath, ["-e", 'console.log(JSON.stringify(require("./src/data/case-studies.js").map(c => ({ slug: c.slug, title: c.title.en, published: c.published }))))'], {
      cwd: ROOT,
      env: { ...process.env, NODE_ENV: env },
    }).toString(),
  )
const drafts = load("development").filter(c => !c.published)
const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]))

test("drafts load in development and never in production", () => {
  assert.ok(drafts.length > 0, "no draft to check against")
  const prod = new Set(load("production").map(c => c.slug))
  for (const d of drafts) assert.ok(!prod.has(d.slug), `${d.slug} is exported in production`)
})

test("no built file holds a draft case study, and no source map is published", { skip: !built && "no build in public/" }, () => {
  const all = files(PUBLIC)
  assert.deepEqual(all.filter(f => f.endsWith(".map")), [])
  for (const f of all.filter(f => /\.(js|json|html|txt|xml)$/.test(f))) {
    const text = readFileSync(f, "utf8")
    for (const d of drafts) {
      assert.ok(!text.includes(d.title), `${f} holds the draft title "${d.title}"`)
      assert.ok(!text.includes(`"${d.slug}"`), `${f} holds the draft slug ${d.slug}`)
    }
  }
})
