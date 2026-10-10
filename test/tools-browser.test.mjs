// The two decision tools in a real browser, on the built site: fill the forms
// with the mouse and the keyboard, read the answers, and check what reaches
// analytics (window.dataLayer) and that nothing the visitor types leaves the
// page. Needs `npm run build` first, and Playwright, which this site does not
// install: point NODE_PATH at a node_modules that has it, for example
//   NODE_PATH=/path/to/a/project/node_modules npm test
// Without either, these checks are skipped. The last one checks the
// contact box at the bottom of every guide.
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { createRequire } from "node:module"
import { extname, join, normalize } from "node:path"

const require = createRequire(import.meta.url)
const matter = require("gray-matter")
const ocr = require("../src/tools/ocr-picker.js")
const automate = require("../src/tools/automate-first.js")

const ROOT = new URL("..", import.meta.url).pathname
const PUBLIC = join(ROOT, "public")
const built = existsSync(join(PUBLIC, "index.html"))

const loadPlaywright = () => {
  try {
    return require("playwright")
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") return null
    throw e
  }
}
const playwright = built ? loadPlaywright() : null
const skip = !built ? "no build in public/" : !playwright && "Playwright not found: set NODE_PATH to a node_modules that has it"

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
}

// public/ served the way GitHub Pages serves it: a folder URL returns its index.html.
const serve = () =>
  createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname)
    const file = normalize(join(PUBLIC, path.endsWith("/") ? join(path, "index.html") : path))
    if (!file.startsWith(PUBLIC) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" })
    createReadStream(file).pipe(res)
  })

let server
let browser
let origin

before(async () => {
  if (skip) return
  server = serve()
  await new Promise(resolve => server.listen(0, resolve))
  // gatsby-browser.js sends every host but arelion.dev and localhost to the live site.
  origin = `http://localhost:${server.address().port}`
  browser = await playwright.chromium.launch()
})

after(async () => {
  await browser?.close()
  server?.close()
})

const CALENDAR = "https://calendar.app.google/"
const WHATSAPP = "https://wa.me/"

// One new visitor. Google Analytics, Tag Manager and every other outside request
// are blocked; the booking and WhatsApp links get an empty 204 answer, so the
// test stays on the guide. `requested` lists every URL the browser asked for.
const visit = async path => {
  const context = await browser.newContext({ serviceWorkers: "block" })
  const requested = []
  context.on("request", r => requested.push(r.url()))
  await context.route("**/*", route => {
    const url = route.request().url()
    if (new URL(url).hostname === "localhost") return route.continue()
    if (url.startsWith(CALENDAR) || url.startsWith(WHATSAPP)) return route.fulfill({ status: 204 })
    return route.abort()
  })
  const page = await context.newPage()
  await page.goto(origin + path)
  // The submit button turns on once React runs the page.
  await page.locator("form button[type=submit]:enabled").waitFor()
  return { context, page, requested }
}

// gtag() pushes its arguments to window.dataLayer; Google's own script is blocked.
const events = async (page, name) =>
  (await page.evaluate(() => window.dataLayer.map(args => Array.from(args))))
    .filter(([kind, event]) => kind === "event" && event === name)
    .map(([, , params]) => params)

// Click a contact link of the tool and wait for the browser to ask for its URL.
const follow = async (context, link, prefix) => {
  await Promise.all([context.waitForEvent("request", r => r.url().startsWith(prefix)), link.click()])
}

const whatsappFor = file => {
  const { title } = matter(readFileSync(join(ROOT, "content/guides", file), "utf8")).data
  return `${WHATSAPP}971556792204?text=${encodeURIComponent(`Hi Antonin, I read "${title}" on arelion.dev`)}`
}

test("the OCR picker answers from the guide, by mouse and by keyboard, and sends only its result key", { skip }, async () => {
  const { context, page, requested } = await visit("/arabic-ocr/")
  const tool = page.locator(`#${ocr.ANCHOR}`)
  const result = tool.locator(".tool-result")
  const pick = result.locator(".tool-pick")
  const submit = tool.getByRole("button", { name: ocr.COPY.submit })

  // Under the lead, above the article.
  const box = await tool.boundingBox()
  const lead = await page.locator(".cs-detail-date").boundingBox()
  const article = await page.locator(".cs-article").boundingBox()
  assert.ok(lead.y < box.y && box.y + box.height <= article.y, "the tool is not between the lead and the article")

  // Nothing answered: the browser holds the form back, no result, no event.
  await submit.click()
  assert.equal(await tool.locator("form").evaluate(f => f.checkValidity()), false)
  assert.equal(await result.textContent(), "")
  assert.deepEqual(await events(page, "tool"), [])

  // Born-digital PDFs that must stay on our Macs.
  await tool.getByLabel("Born-digital PDFs, with text you can select").check()
  await tool.getByLabel("They must stay on our Macs").check()
  await submit.click()
  await pick.waitFor()
  const pdfMac = await result.innerText()
  for (const shown of [
    "OCR THE RENDERED PAGE INSTEAD",
    "On these Arabic PDFs, OCR of the rendered page beat every text extractor I tested.",
    "still got 7.6% of the characters wrong on the Dubai law",
    "ON A MAC",
    "Apple's Live Text API",
    "5.0% wrong on real pages, 0.3 seconds a page, free, and the pages never leave the machine.",
    "Apple Vision does even better (0.3% on the law pages)",
    "What I would not use on Arabic with default settings: Tesseract, and the tools built on it; PaddleOCR 3 without shrinking the page; Docling with EasyOCR.",
    "Whichever you pick, run it on twenty of your own pages and read the output next to the page.",
  ]) {
    assert.ok(pdfMac.includes(shown), `missing: ${shown}`)
  }
  const pdfLink = result.getByRole("link", { name: "Arabic PDF to Word or text: why copy-paste fails" })
  assert.equal(await pdfLink.getAttribute("href"), "/guides/arabic-pdf-to-text/")
  assert.deepEqual(await events(page, "tool"), [{ event_category: "ocr_picker", event_label: "pdf_mac" }])

  // A changed answer clears the result until the next submit.
  await tool.getByLabel("Handwriting").check()
  await pick.waitFor({ state: "detached" })
  assert.equal(await result.textContent(), "")
  await submit.click()
  await pick.waitFor()
  assert.equal(await pick.innerText(), "Printed text only")
  assert.ok((await result.innerText()).includes("No handwriting, no ID cards, no invoices or stamped forms."))
  assert.ok(!(await result.innerText()).includes("OCR THE RENDERED PAGE INSTEAD"))

  // Keyboard only: arrow up to the scans, tab to the next question, arrow up to
  // the cloud, tab to the button, Enter.
  await tool.getByLabel("Handwriting").focus()
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("Tab")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("Tab")
  assert.equal(await submit.evaluate(b => b === document.activeElement), true, "Tab does not reach the button")
  await page.keyboard.press("Enter")
  await pick.waitFor()
  assert.equal(await pick.innerText(), "Gemini 3.8 Flash")
  const cloud = await result.innerText()
  assert.ok(cloud.includes("1.9% wrong on the 10 real pages, at a third of a cent a page."))
  assert.ok(cloud.includes("Gemini 3.5 Flash did slightly better (1.6%), but Google retired it on 8 October 2026."))

  // Own servers.
  await tool.getByLabel("They must stay on our own servers").check()
  await submit.click()
  await pick.waitFor()
  assert.equal(await pick.innerText(), "Surya")
  assert.ok((await result.innerText()).includes("free for research, personal use and startups under $5M in funding or revenue, paid above."))

  // One tool event per submit, carrying the result key only.
  assert.deepEqual(
    (await events(page, "tool")).map(e => e.event_label),
    ["pdf_mac", "handwriting", "printed_cloud", "printed_server"],
  )
  assert.ok((await events(page, "tool")).every(e => e.event_category === "ocr_picker"))

  // The call to action under the result: two leads located at the tool.
  assert.ok((await tool.locator(".tool-cta").innerText()).includes(ocr.COPY.cta))
  const whatsapp = tool.getByRole("link", { name: "WhatsApp" })
  assert.equal(await whatsapp.getAttribute("href"), whatsappFor("arabic-ocr.md"))
  await follow(context, tool.getByRole("link", { name: "Book a call" }), CALENDAR)
  await follow(context, whatsapp, WHATSAPP)
  assert.deepEqual(await events(page, "generate_lead"), [
    { method: "booking", location: "tool_ocr_picker" },
    { method: "whatsapp", location: "tool_ocr_picker" },
  ])
  // Still on the guide, and the answers never went into a URL.
  assert.equal(page.url(), `${origin}/arabic-ocr/`)
  assert.ok(!requested.some(u => /[?&](pages|where)=/.test(u)), "an answer went into a URL")
  await context.close()
})

test("what to automate first ranks the visitor's tasks by the guide's tests, and no task name leaves the page", { skip }, async () => {
  const { context, page, requested } = await visit("/ai-automation-uae/")
  const tool = page.locator(`#${automate.ANCHOR}`)
  const result = tool.locator(".tool-result")
  const submit = tool.getByRole("button", { name: automate.COPY.submit })
  const add = tool.getByRole("button", { name: automate.COPY.add })
  const taskGroup = n => tool.getByRole("group", { name: `Task ${n}`, exact: true })

  // One task: its name, its hours (or none), and the five answers in the form's order.
  const fill = async (n, name, hours, answers) => {
    const task = taskGroup(n)
    await task.getByLabel(automate.COPY.name).fill(name)
    if (hours !== null) await task.getByLabel(automate.COPY.hours).fill(String(hours))
    for (const [i, q] of automate.QUESTIONS.entries()) {
      await task.getByRole("group", { name: q.legend }).getByLabel(answers[i], { exact: true }).check()
    }
  }
  const Y = "Yes"
  const N = "No"
  // Answers to: comes back in the same shape, checked in minutes, data in the
  // tools, unreviewed legal or financial decision, process written down.
  const PASS = [Y, Y, Y, N, Y]

  // An empty task stops the form: no result, no event.
  await submit.click()
  assert.equal(await result.textContent(), "")

  await fill(1, "Monthly client report", 20, PASS)
  await add.click()
  // The new task's name has the focus, ready to type.
  assert.equal(await taskGroup(2).getByLabel(automate.COPY.name).evaluate(i => i === document.activeElement), true)
  await fill(2, "Invoice follow-up", 40, PASS)
  await add.click()
  await fill(3, "Throwaway task", 99, PASS)
  await add.click()
  await fill(4, "Client onboarding", 10, [Y, Y, Y, N, N])
  await add.click()
  await fill(5, "Policy questions from staff", 5, [Y, Y, N, N, Y])
  // Five tasks is the most the tool takes.
  assert.equal(await add.count(), 0)

  // Remove the third task: the others move up and keep their answers, and the
  // add button comes back.
  await tool.getByRole("button", { name: "Remove task 3" }).click()
  assert.equal(await tool.getByRole("group", { name: /^Task \d$/ }).count(), 4)
  await add.click()
  await fill(5, "Supplier contract sign-off", null, [Y, Y, Y, Y, Y])

  // A negative number of hours is refused by the form itself.
  const hours = taskGroup(1).getByLabel(automate.COPY.hours)
  await hours.fill("-5")
  await submit.click()
  assert.equal(await tool.locator("form").evaluate(f => f.checkValidity()), false)
  assert.equal(await result.textContent(), "")
  await hours.fill("20")

  await submit.click()
  await result.locator("li").first().waitFor()
  const rows = await result.locator("li").evaluateAll(items =>
    items.map(li => ({
      verdict: li.querySelector(".cs-row-kicker").textContent,
      task: li.querySelector(".tool-pick").textContent,
      why: [...li.querySelectorAll("p:not(.tool-pick)")].map(p => p.textContent),
      links: [...li.querySelectorAll("a")].map(a => a.getAttribute("href")),
    })),
  )
  assert.deepEqual(rows, [
    {
      verdict: "Start here",
      task: "Invoice follow-up · 40 hours a month",
      why: ["I start with the tasks that pass three tests."],
      links: [],
    },
    {
      verdict: "Start here",
      task: "Monthly client report · 20 hours a month",
      why: ["I start with the tasks that pass three tests."],
      links: [],
    },
    {
      verdict: "Write it down first",
      task: "Client onboarding · 10 hours a month",
      why: [
        "Nobody has written the process down. When a process is unclear, the first weeks go into writing it down with the people who do it.",
      ],
      links: [],
    },
    {
      verdict: "Start with a company brain",
      task: "Policy questions from staff · 5 hours a month",
      why: [
        "Its data is not in your tools. If the knowledge lives in people's heads, start with a company brain so the system has something to read.",
      ],
      links: ["/guides/company-brain/"],
    },
    {
      verdict: "Leave for later",
      task: "Supplier contract sign-off",
      why: ["It is a decision with legal or financial weight that nobody reviews."],
      links: [],
    },
  ])
  const shown = await tool.innerText()
  assert.ok(shown.includes(automate.COPY.ranked))
  assert.doesNotMatch(shown, /30 people|now takes 11|Throwaway/)

  // One tool event, counting the verdicts.
  assert.deepEqual(await events(page, "tool"), [
    { event_category: "automate_first", event_label: "start_here:2,write_down:1,company_brain:1,later:1" },
  ])

  // The call to action under the result: two leads located at the tool.
  assert.ok((await tool.locator(".tool-cta").innerText()).includes(automate.COPY.cta))
  assert.equal(await tool.getByRole("link", { name: "WhatsApp" }).getAttribute("href"), whatsappFor("ai-automation-uae.md"))
  await follow(context, tool.getByRole("link", { name: "Book a call" }), CALENDAR)
  await follow(context, tool.getByRole("link", { name: "WhatsApp" }), WHATSAPP)
  assert.deepEqual(await events(page, "generate_lead"), [
    { method: "booking", location: "tool_automate_first" },
    { method: "whatsapp", location: "tool_automate_first" },
  ])

  // Nothing typed left the page: not in analytics, not in any request, not in the URL.
  assert.equal(page.url(), `${origin}/ai-automation-uae/`)
  const layer = JSON.stringify(await page.evaluate(() => window.dataLayer.map(args => Array.from(args))))
  for (const name of ["Monthly client report", "Invoice follow-up", "Throwaway task", "Client onboarding", "Policy questions from staff", "Supplier contract sign-off"]) {
    assert.ok(!layer.includes(name), `${name} reached the dataLayer`)
    for (const form of [name, encodeURIComponent(name), name.replace(/ /g, "+")]) {
      assert.ok(!requested.some(u => u.includes(form)), `${name} went out in a request`)
    }
  }
  await context.close()
})

// The contact box at the bottom of every guide. .nav-pill-primary pushes itself to
// the right end of the header (margin-left: auto); in this box, until 2026-10-10,
// it threw WhatsApp and "Book a call" to opposite edges of the dark band.
test("the contact box at the bottom of a guide keeps its two buttons side by side, centred", { skip }, async () => {
  const { context, page } = await visit("/arabic-ocr/")
  const box = await page.locator(".cs-cta").boundingBox()
  const whatsapp = await page.locator(".cs-cta .nav-pill-whatsapp").boundingBox()
  const book = await page.locator(".cs-cta .nav-pill-primary").boundingBox()
  assert.ok(Math.abs(whatsapp.y - book.y) < 1, "the two buttons are not on one row")
  const gap = book.x - (whatsapp.x + whatsapp.width)
  assert.ok(gap >= 0 && gap <= 16, `${gap}px between WhatsApp and Book a call`)
  const left = whatsapp.x - box.x
  const right = box.x + box.width - (book.x + book.width)
  assert.ok(Math.abs(left - right) <= 2, `buttons off centre: ${left}px on the left, ${right}px on the right`)
  await context.close()
})
