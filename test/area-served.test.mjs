// Abu Dhabi is a target market (asked on 2026-10-07): the home's structured data
// names it as a served city, and the contact page says it in plain text.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const PUBLIC = join(new URL("..", import.meta.url).pathname, "public")
const built = existsSync(join(PUBLIC, "index.html"))
const html = p => readFileSync(join(PUBLIC, p, "index.html"), "utf8")

const jsonLd = page =>
  // Gatsby adds attributes such as data-gatsby-head to the tag, so match any attribute list.
  [...html(page).matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]))

test("the home's structured data serves Dubai and Abu Dhabi as cities", { skip: !built && "no build in public/" }, () => {
  const org = jsonLd("").flatMap(d => d["@graph"] || [d]).find(n => n["@id"] === "https://arelion.dev/#organization")
  assert.ok(org, "no organization node on the home")
  const cities = (org.areaServed || []).filter(a => a["@type"] === "City").map(a => a.name)
  assert.deepEqual(cities.sort(), ["Abu Dhabi", "Dubai"])
})

test("the contact page names Abu Dhabi", { skip: !built && "no build in public/" }, () => {
  assert.match(html("contact"), /Dubai, Abu Dhabi and across the United Arab/)
})
