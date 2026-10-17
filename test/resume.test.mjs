// The resume served at /resume.pdf states only the L'Oréal facts that are
// public: the 100M+ pages figure, also used on the site. Any other figure in
// that role, or a quoted tool name, needs L'Oréal's approval first. The check
// reads the PDF text with pdftotext (poppler) and is skipped where poppler is
// missing.
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { join } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname
const RESUME = join(ROOT, "static/resume.pdf")

let text = null
try {
  text = execFileSync("pdftotext", [RESUME, "-"], { encoding: "utf8" })
} catch (e) {
  // Only a missing pdftotext skips the test; an unreadable PDF fails it.
  if (e.code !== "ENOENT") throw e
}
const skip = text === null && "pdftotext (poppler) is not installed"

test("the L'Oréal role states no figure but the public 100M+ pages and quotes no tool name", { skip }, () => {
  const start = text.indexOf("L’Oréal, Paris")
  const end = text.indexOf("RelevanC, Paris")
  assert.ok(start >= 0 && end > start, "the L'Oréal role was not found before the relevanC role")
  const role = text.slice(start, end)
  assert.deepEqual(role.match(/\d+(?:[.,]\d+)?\s?(?:[kKM]\+?|%)/g), ["100M+"])
  assert.doesNotMatch(role, /[“"][^”"]+[”"]/, "the L'Oréal role quotes a product name")
})
