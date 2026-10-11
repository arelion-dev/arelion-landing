// The three decision tools in a real browser, on the built site: fill the forms
// with the mouse and the keyboard, read the answers, and check what reaches
// analytics (window.dataLayer) and that nothing the visitor types leaves the
// page. Needs `npm run build` first, and Playwright, which this site does not
// install: point NODE_PATH at a node_modules that has it, for example
//   NODE_PATH=/path/to/a/project/node_modules npm test
// Without either, these checks are skipped. The last three check the contact
// box at the bottom of every guide, the offer box inside the DIFC guide, and
// the tables of a guide on a phone.
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
const reg10 = require("../src/tools/reg10-check.js")

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
const visit = async (path, viewport) => {
  const context = await browser.newContext({ serviceWorkers: "block", ...(viewport && { viewport }) })
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

test("the Regulation 10 check answers from the guide, by mouse and by keyboard, and sends only its result key", { skip }, async () => {
  const { context, page, requested } = await visit("/guides/difc-data-protection-ai/")
  const tool = page.locator(`#${reg10.ANCHOR}`)
  const result = tool.locator(".tool-result")
  const blocks = result.locator(".tool-block")
  const submit = tool.getByRole("button", { name: reg10.COPY.submit })
  const choose = label => tool.getByLabel(label, { exact: true }).check()
  // The answer on screen, one text per block.
  const shown = () => blocks.evaluateAll(divs => divs.map(d => d.innerText))

  const DIFC = "Incorporated in the DIFC: the law applies to your processing wherever it takes place (Article 6(3))."
  const REACH =
    'Incorporated elsewhere, active in the DIFC: the law applies to processing in the DIFC as part of stable arrangements, including transfers out of the DIFC. How far "stable arrangements" goes is a question for your lawyer.'
  const OWN =
    "A system you built or had built: where the law applies, you are the Deployer, treated as a controller (Regulation 10.3.4). Whoever runs the System for you is the Operator, treated as a processor."
  const VENDOR =
    "ChatGPT or a similar tool: on my reading, where the law applies, you are the Deployer once client personal data goes in, and the duties stay with you. Check where the data goes: the adequacy list does not name the United States as a whole, and elsewhere you need an Article 27 safeguard or one of its narrow derogations. How the notice at first use works for a tool your clients never see is unclear to me."
  const NONE = "No personal data in the system: Regulation 10 defines a System as one that processes personal data."
  const EVERY =
    "Every System: the Article 9 principles, notice at first use, evidence and a register on request, the design concepts of 10.3.1, and the commercial-use limits of 10.3.2."
  const PERSON_DECIDES =
    "When a person decides: many AI projects can still meet Schedule 1's definition of high-risk processing, which includes new technologies that materially increase risk."
  const HIGH_RISK =
    "High-risk processing: only with a certified System, for human-defined or approved purposes, and with an Autonomous Systems Officer. Under Article 38, a person can also require a manual review of a decision based solely on automated processing that has legal or seriously impactful consequences."
  const NOTICE = "This page is not legal advice: I am an engineer, and a lawyer should check any decision you base on it."

  // Under the lead, above the article.
  const box = await tool.boundingBox()
  const lead = await page.locator(".cs-detail-date").boundingBox()
  const article = await page.locator(".cs-article").first().boundingBox()
  assert.ok(lead.y < box.y && box.y + box.height <= article.y, "the tool is not between the lead and the article")

  // Nothing answered: the browser holds the form back, no result, no event.
  await submit.click()
  assert.equal(await tool.locator("form").evaluate(f => f.checkValidity()), false)
  assert.equal(await result.textContent(), "")
  assert.deepEqual(await events(page, "tool"), [])

  // Two answers out of three are not enough either.
  await choose("Incorporated in the DIFC")
  await choose("Yes, into ChatGPT or a similar tool")
  await submit.click()
  assert.equal(await result.textContent(), "")

  // A DIFC firm that puts personal data into ChatGPT, and a person decides.
  await choose("It helps staff, and a person decides")
  await submit.click()
  await blocks.first().waitFor()
  assert.deepEqual(await shown(), [DIFC, VENDOR, EVERY, PERSON_DECIDES, NOTICE])
  assert.equal(await result.getByRole("link").count(), 0)
  assert.deepEqual(await events(page, "tool"), [{ event_category: "reg10_check", event_label: "difc_vendor_assist" }])

  // A changed answer clears the result until the next submit. A system that
  // decides alone gets the high-risk rules instead of the reminder.
  await choose("It evaluates people or decides alone, with legal or similar effects")
  await blocks.first().waitFor({ state: "detached" })
  assert.equal(await result.textContent(), "")
  await submit.click()
  await blocks.first().waitFor()
  assert.deepEqual(await shown(), [DIFC, VENDOR, EVERY, HIGH_RISK, NOTICE])

  // Keyboard only: arrow down to the firm incorporated elsewhere, tab to the
  // next question, arrow up to the system we built, tab past the last question
  // to the button, Enter.
  await tool.getByLabel("Incorporated in the DIFC", { exact: true }).focus()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Tab")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  assert.equal(await submit.evaluate(b => b === document.activeElement), true, "Tab does not reach the button")
  await page.keyboard.press("Enter")
  await blocks.first().waitFor()
  assert.deepEqual(await shown(), [REACH, OWN, EVERY, HIGH_RISK, NOTICE])

  // No personal data goes in: no System, so no duties to list.
  await choose("No personal data goes in")
  await submit.click()
  await blocks.first().waitFor()
  assert.deepEqual(await shown(), [REACH, NONE, NOTICE])

  // No activity in the DIFC: one line and the way to the federal law's guide.
  await choose("Onshore UAE, with no activity in the DIFC")
  await submit.click()
  await blocks.first().waitFor()
  assert.deepEqual(await shown(), [
    "No activity in the DIFC: onshore companies mostly follow the federal law. The DIFC law can still reach them through stable arrangements, as the Careem decision shows.\n\nDetails in UAE PDPL and AI.",
    NOTICE,
  ])
  assert.equal(await result.getByRole("link", { name: "UAE PDPL and AI" }).getAttribute("href"), "/guides/uae-pdpl-ai/")

  // One tool event per submit, carrying the tool and the result key, nothing else.
  assert.deepEqual(await events(page, "tool"), [
    { event_category: "reg10_check", event_label: "difc_vendor_assist" },
    { event_category: "reg10_check", event_label: "difc_vendor_decide" },
    { event_category: "reg10_check", event_label: "reach_own_decide" },
    { event_category: "reg10_check", event_label: "reach_none" },
    { event_category: "reg10_check", event_label: "onshore" },
  ])

  // The call to action under the result: two leads located at the tool.
  assert.ok((await tool.locator(".tool-cta").innerText()).includes(reg10.COPY.cta))
  const whatsapp = tool.getByRole("link", { name: "WhatsApp" })
  assert.equal(await whatsapp.getAttribute("href"), whatsappFor("difc-data-protection-ai.md"))
  await follow(context, tool.getByRole("link", { name: "Book a call" }), CALENDAR)
  await follow(context, whatsapp, WHATSAPP)
  assert.deepEqual(await events(page, "generate_lead"), [
    { method: "booking", location: "tool_reg10_check" },
    { method: "whatsapp", location: "tool_reg10_check" },
  ])
  // Still on the guide, and the answers never went into a URL.
  assert.equal(page.url(), `${origin}/guides/difc-data-protection-ai/`)
  assert.ok(!requested.some(u => /[?&](firm|ai|use)=/.test(u)), "an answer went into a URL")
  // Every request to another host is one of the two contact links, or was blocked
  // before it left: Google Analytics never got the page's answers.
  const outside = requested.filter(u => new URL(u).hostname !== "localhost")
  for (const u of outside) {
    assert.ok(!/reg10_check|difc_vendor|reach_own|reach_none|onshore/.test(u), `a result went out in a request: ${u}`)
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

// The offer box inside the DIFC guide's text (2026-10-11): a light card after the
// ChatGPT section, with the same two links as the bottom box and its own lead
// location. The header's margin-left: auto must not split its buttons either.
test("the offer box in the DIFC guide sits after the ChatGPT section, buttons side by side, and sends its own leads", { skip }, async () => {
  const { context, page } = await visit("/guides/difc-data-protection-ai/")
  const { offer, ctaLine } = matter(readFileSync(join(ROOT, "content/guides/difc-data-protection-ai.md"), "utf8")).data
  const box = page.locator(".cs-offer")
  assert.equal(await box.count(), 1)
  assert.equal(await box.innerText(), `${offer.title}\n\n${offer.text}\n\nWhatsApp\nBook a call`)

  // In the text: below the ChatGPT heading, above "What an engineer has to build".
  const frame = await box.boundingBox()
  const chatgpt = await page.getByRole("heading", { name: "If your firm uses ChatGPT or a similar tool" }).boundingBox()
  const build = await page.getByRole("heading", { name: "What an engineer has to build" }).boundingBox()
  assert.ok(chatgpt.y < frame.y && frame.y + frame.height <= build.y, "the offer box is not between the two sections")

  // A light card: dark text on a light background, unlike the dark band at the bottom.
  const lightness = locator =>
    locator.evaluate(el => {
      const [r, g, b] = getComputedStyle(el).backgroundColor.match(/\d+/g).map(Number)
      return (r + g + b) / 3
    })
  assert.ok((await lightness(box)) > 230, "the offer box is not light")
  assert.ok((await lightness(page.locator(".cs-cta"))) < 60, "the bottom box is no longer the dark band")

  // The two buttons on one row, next to each other, starting at the text's left edge.
  const whatsapp = await box.locator(".nav-pill-whatsapp").boundingBox()
  const book = await box.locator(".nav-pill-primary").boundingBox()
  const text = await box.locator("p").last().boundingBox()
  assert.ok(Math.abs(whatsapp.y - book.y) < 1, "the two buttons are not on one row")
  const gap = book.x - (whatsapp.x + whatsapp.width)
  assert.ok(gap >= 0 && gap <= 16, `${gap}px between WhatsApp and Book a call`)
  assert.ok(Math.abs(whatsapp.x - text.x) < 1, "the buttons do not start under the text")

  // The offer's links report guide_offer; the bottom box, with the guide's own line, reports guide.
  assert.equal(await box.getByRole("link", { name: "WhatsApp" }).getAttribute("href"), whatsappFor("difc-data-protection-ai.md"))
  await follow(context, box.getByRole("link", { name: "Book a call" }), CALENDAR)
  await follow(context, box.getByRole("link", { name: "WhatsApp" }), WHATSAPP)
  const bottom = page.locator(".cs-cta")
  assert.equal(await bottom.locator("p").innerText(), ctaLine)
  await follow(context, bottom.getByRole("link", { name: "Book a call" }), CALENDAR)
  assert.deepEqual(await events(page, "generate_lead"), [
    { method: "booking", location: "guide_offer" },
    { method: "whatsapp", location: "guide_offer" },
    { method: "booking", location: "guide" },
  ])
  assert.equal(page.url(), `${origin}/guides/difc-data-protection-ai/`)
  await context.close()
})

// Tables on a phone. Until 2026-10-11 every table kept fixed columns, so a
// six-column table had room for about three letters per line and its words
// came out in pieces ("De tec tor"). A wide table now keeps whole words and
// scrolls sideways in its own box.
test("on a phone, a guide's tables keep whole words in their headers and the page does not scroll sideways", { skip }, async () => {
  const { context, page } = await visit("/arabic-ocr/", { width: 390, height: 844 })
  const { tables, cut, sideways } = await page.evaluate(() => {
    const cut = []
    const cells = document.querySelectorAll(".cs-detail table th")
    for (const cell of cells) {
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        for (const word of node.data.matchAll(/[A-Za-z]{2,}/g)) {
          const range = document.createRange()
          range.setStart(node, word.index)
          range.setEnd(node, word.index + word[0].length)
          const lines = new Set(Array.from(range.getClientRects(), r => Math.round(r.top)))
          if (lines.size > 1) cut.push(word[0])
        }
      }
    }
    return {
      tables: document.querySelectorAll(".cs-detail table").length,
      cut,
      sideways: document.documentElement.scrollWidth - window.innerWidth,
    }
  })
  assert.ok(tables > 0, "the guide has no table to check")
  assert.deepEqual(cut, [], "header words cut in the middle")
  assert.ok(sideways <= 0, `the page is ${sideways}px wider than the screen`)
  await context.close()
})
