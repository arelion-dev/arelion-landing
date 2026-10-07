// Case studies are sorted by what I sell (offers) and client work is kept
// apart from my own projects (lab). The output checks need `npm run build` first.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const require = createRequire(import.meta.url)
// Without NODE_ENV=development this is the published list, as in production.
const CASE_STUDIES = require("../src/data/case-studies.js")
const { OFFERS, offersOf } = require("../src/data/offers.js")

const ROOT = new URL("..", import.meta.url).pathname
const PUBLIC = join(ROOT, "public")
const built = existsSync(join(PUBLIC, "index.html"))
const html = p => readFileSync(join(PUBLIC, p, "index.html"), "utf8")
const OFFER_NAMES = new Set(OFFERS.map(o => o.name))

test("every published case study is filed under known offers", () => {
  for (const cs of CASE_STUDIES) {
    assert.ok(Array.isArray(cs.offers) && cs.offers.length > 0, `${cs.slug}: no offers`)
    for (const o of cs.offers) assert.ok(OFFER_NAMES.has(o), `${cs.slug}: unknown offer ${o}`)
  }
})

test("client work leads with a short business result, my own projects do not", () => {
  for (const cs of CASE_STUDIES) {
    if (cs.lab) {
      assert.equal(cs.outcome, undefined, `${cs.slug}: lab projects keep their title`)
      continue
    }
    const line = cs.outcome && cs.outcome.en
    assert.ok(line, `${cs.slug}: client work needs an outcome`)
    assert.ok(line.length <= 90, `${cs.slug}: outcome is ${line.length} characters`)
    assert.doesNotMatch(line, /[–—]/, `${cs.slug}: dash in outcome`)
  }
})

test("the index shows client work first and the lab apart", { skip: !built && "no build in public/" }, () => {
  const page = html("case-studies")
  const client = page.indexOf(">Client work</h2>")
  const lab = page.indexOf(">Lab</h2>")
  assert.ok(client > 0 && lab > client, "Client work heading, then Lab heading")
  for (const cs of CASE_STUDIES) {
    const at = page.indexOf(`href="/case-studies/${cs.slug}/"`)
    assert.ok(at > 0, `${cs.slug} missing from the index`)
    assert.ok(cs.lab ? at > lab : at < lab, `${cs.slug} is in the wrong section`)
  }
})

test("the home carousel shows client work only", { skip: !built && "no build in public/" }, () => {
  const home = html("")
  const start = home.indexOf('class="cs-carousel-section"')
  assert.ok(start > 0, "no case studies carousel on the home page")
  const carousel = home.slice(start, home.indexOf("</section>", start))
  const linked = [...carousel.matchAll(/href="\/case-studies\/([^"/]+)\/"/g)].map(m => m[1])
  assert.ok(linked.length > 0, "the carousel links no case study")
  for (const slug of linked) {
    const cs = CASE_STUDIES.find(c => c.slug === slug)
    assert.ok(cs && !cs.lab, `${slug} on the home carousel is not client work`)
    assert.ok(offersOf(cs).length > 0)
  }
})

// Pages that talk about the law end with a visible not-legal-advice note (asked on 2026-10-07).
test("case studies sold as Legal AI carry the not-legal-advice note, others do not", { skip: !built && "no build in public/" }, () => {
  assert.ok(CASE_STUDIES.some(cs => offersOf(cs).includes("Legal AI")), "no Legal AI case study")
  for (const cs of CASE_STUDIES) {
    const has = /class="cs-disclaimer"[^>]*><strong>Not legal advice\.<\/strong>/.test(html(`case-studies/${cs.slug}`))
    assert.equal(has, offersOf(cs).includes("Legal AI"), cs.slug)
  }
})
