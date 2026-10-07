// Contact intents (WhatsApp links, call bookings) go to GA4 as the recommended
// generate_lead event, next to the existing click events. Only the channel and
// the place on the site are sent, nothing about the visitor.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname
const SRC = join(ROOT, "src")
const files = (dir, ext) =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(join(dir, e.name), ext) : ext.test(e.name) ? [join(dir, e.name)] : [],
  )

// The hook is an ES module in a CommonJS package: load it from its source text.
const hook = await import(
  `data:text/javascript,${encodeURIComponent(readFileSync(join(SRC, "hooks/use-track-event.js"), "utf8"))}`
)

test("trackLead sends generate_lead with the method and the location, and nothing else", () => {
  const calls = []
  globalThis.window = { gtag: (...args) => calls.push(args) }
  try {
    hook.trackLead(hook.LEAD_METHOD.whatsapp, "guide")
    hook.trackLead(hook.LEAD_METHOD.booking, "nav")
  } finally {
    delete globalThis.window
  }
  assert.deepEqual(calls, [
    ["event", "generate_lead", { method: "whatsapp", location: "guide" }],
    ["event", "generate_lead", { method: "booking", location: "nav" }],
  ])
})

// Opening <a ...> tags in JSX. Braces are counted, so the "=>" of a click handler
// does not end the tag.
const anchorTags = source => {
  const tags = []
  for (let i = source.indexOf("<a"); i !== -1; i = source.indexOf("<a", i + 2)) {
    if (!/\s/.test(source[i + 2])) continue
    let depth = 0
    let j = i
    for (; j < source.length; j++) {
      if (source[j] === "{") depth++
      else if (source[j] === "}") depth--
      else if (source[j] === ">" && depth === 0) break
    }
    tags.push(source.slice(i, j + 1))
  }
  return tags
}
const methodOf = tag => {
  const href = (tag.match(/href=(\{[^\n]*\}|"[^"]*")/) || [])[1] || ""
  if (/wa\.me|whatsapp/i.test(href)) return "whatsapp"
  if (/calendar\.app\.google|CALENDAR_URL/.test(href)) return "booking"
  return null
}

test("every WhatsApp and booking link sends generate_lead with its method", () => {
  const links = files(SRC, /\.js$/)
    .flatMap(f => anchorTags(readFileSync(f, "utf8")).map(tag => ({ f, tag, method: methodOf(tag) })))
    .filter(l => l.method)
  assert.ok(links.length >= 10, `only ${links.length} contact links found: the scan is broken`)
  for (const { f, tag, method } of links) {
    assert.ok(tag.includes(`trackLead(LEAD_METHOD.${method},`), `${f.slice(ROOT.length)}: ${tag.replace(/\s+/g, " ").slice(0, 140)}`)
  }
})

// Markdown and JSON bodies render as raw HTML, where no click handler can run.
test("no WhatsApp or booking link sits in article content, out of reach of tracking", () => {
  const content = [
    ...files(join(ROOT, "content/guides"), /\.md$/i),
    ...files(join(ROOT, "content/blog"), /\.md$/i),
    ...files(join(SRC, "data/case-studies-rich"), /\.json$/),
  ]
  assert.ok(content.length > 0)
  for (const f of content) assert.doesNotMatch(readFileSync(f, "utf8"), /wa\.me\/|calendar\.app\.google/, f)
})
