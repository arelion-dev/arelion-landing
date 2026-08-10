#!/usr/bin/env node
// seo/audit.mjs — one-command SEO état des lieux for arelion.dev.
//
// Runs three passes and writes a Markdown report:
//   1. On-page audit (no auth): title/description length, H1, word count, OG
//      image, FAQ/related schema, and target-query coverage from seo/targets.json.
//   2. Google Search Console (needs a service account): real queries, positions,
//      clicks, and "striking distance" wins (position 5 to 20). Set GSC_SA_KEY
//      (path to the service-account JSON) and GSC_SITE (e.g. sc-domain:arelion.dev).
//   3. PageSpeed Insights / Core Web Vitals (needs an API key): set PSI_API_KEY.
//
// Every API pass is optional: with no creds it prints how to enable it and
// still produces the on-page report. Zero npm dependencies (uses node:crypto for
// the Google JWT), so `node seo/audit.mjs` just works.

import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import https from "node:https"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const require = createRequire(import.meta.url)

// Load all case studies (dev env => unfiltered), then keep the published ones.
process.env.NODE_ENV = "development"
const ALL = require(path.join(ROOT, "src/data/case-studies.js"))
const PUBLISHED = ALL.filter(c => c.published)
const TARGETS = JSON.parse(fs.readFileSync(path.join(__dirname, "targets.json"), "utf8"))
const SITE = TARGETS.site.replace(/\/$/, "")

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const readMd = slug => {
  const p = path.join(ROOT, "content/blog", slug, "index.MD")
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null
}
const frontmatter = md => {
  const m = md && md.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return {}
  const fm = {}
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "")
  }
  return fm
}
const bodyOf = md => (md ? md.replace(/^---\n[\s\S]*?\n---/, "") : "")
const words = s => (s.match(/\b\w+\b/g) || []).length

// ---------------------------------------------------------------------------
// 1. On-page audit
// ---------------------------------------------------------------------------
function onPageAudit() {
  const rows = []
  for (const cs of PUBLISHED) {
    const slug = cs.article ? cs.article.replace(/^\/blog\/|\/$/g, "") : cs.slug
    const md = readMd(slug)
    const fm = frontmatter(md)
    const body = bodyOf(md)
    const issues = []
    const titleLen = (cs.title.en || "").length
    // The live meta description for /case-studies/<slug>/ is cs.hook.en (the
    // Head passes it), NOT the markdown frontmatter. Measure the real field.
    const descLen = (cs.hook.en || "").length
    // Full SERP title is "<title> | arelion.dev" (~14 extra chars), so >52 in
    // title.en means the tail truncates. Front-loaded keywords make that OK;
    // flag only the genuinely long ones.
    if (titleLen > 70) issues.push(`title ${titleLen} chars (long even after the keyword)`)
    if (descLen === 0) issues.push("no meta description (hook)")
    else if (descLen > 160) issues.push(`meta description ${descLen} chars (>160, truncates)`)
    const wc = words(body)
    if (wc < 400) issues.push(`thin body (${wc} words)`)
    if (!fs.existsSync(path.join(ROOT, "static/og", `${cs.slug}.png`))) issues.push("no OG image")
    if (!cs.faq || !cs.faq.length) issues.push("no FAQ schema")
    const t = TARGETS.pageTargets[cs.slug]
    if (!t) issues.push("no target query defined")
    else {
      const faqText = (cs.faq || [])
        .map(f => `${f.q?.en || ""} ${f.a?.en || ""}`)
        .join(" ")
      const hay = `${cs.title.en} ${cs.hook.en} ${body.slice(0, 600)} ${faqText}`.toLowerCase()
      const prim = t.primary.toLowerCase()
      const kws = prim.split(" ").filter(w => w.length > 3)
      const hit = kws.filter(w => hay.includes(w)).length
      if (hit / Math.max(kws.length, 1) < 0.6)
        issues.push(`primary query "${t.primary}" weak in title/desc/intro`)
    }
    rows.push({ slug: cs.slug, pillar: cs.pillar, titleLen, descLen, wc, issues })
  }
  return rows
}

// ---------------------------------------------------------------------------
// 2. Google Search Console (service-account JWT, no deps)
// ---------------------------------------------------------------------------
function httpsJson(options, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let d = ""
      res.on("data", c => (d += c))
      res.on("end", () => {
        try { resolve({ status: res.statusCode, json: d ? JSON.parse(d) : null }) }
        catch { resolve({ status: res.statusCode, json: null, raw: d }) }
      })
    })
    req.on("error", reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function googleAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "RS256", typ: "JWT" }
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }
  const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url")
  const unsigned = `${b64(header)}.${b64(claim)}`
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url")
  const jwt = `${unsigned}.${sig}`
  const body = `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`
  const { json } = await httpsJson({
    method: "POST", hostname: "oauth2.googleapis.com", path: "/token",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) },
  }, body)
  if (!json || !json.access_token) throw new Error("token exchange failed")
  return json.access_token
}

async function gscQuery(token, site, startDate, endDate, dimensions) {
  const body = JSON.stringify({ startDate, endDate, dimensions, rowLimit: 250 })
  const { json } = await httpsJson({
    method: "POST",
    hostname: "searchconsole.googleapis.com",
    path: `/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
  }, body)
  return (json && json.rows) || []
}

function daysAgo(n) {
  const d = new Date(Date.now() - n * 864e5)
  return d.toISOString().slice(0, 10)
}

async function gscAudit() {
  const keyPath = process.env.GSC_SA_KEY
  const site = process.env.GSC_SITE
  if (!keyPath || !site) return { configured: false }
  const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"))
  const token = await googleAccessToken(sa)
  const [end, start] = [daysAgo(2), daysAgo(30)]
  const byQuery = await gscQuery(token, site, start, end, ["query"])
  const byPage = await gscQuery(token, site, start, end, ["page"])
  const striking = byQuery
    .filter(r => r.position >= 5 && r.position <= 20 && r.impressions >= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 25)
  return { configured: true, start, end, byQuery, byPage, striking }
}

// ---------------------------------------------------------------------------
// 3. PageSpeed Insights (Core Web Vitals)
// ---------------------------------------------------------------------------
async function psiAudit(urls) {
  const key = process.env.PSI_API_KEY
  if (!key) return { configured: false }
  const out = []
  for (const url of urls) {
    const p = `/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&key=${key}`
    const { json } = await httpsJson({ method: "GET", hostname: "www.googleapis.com", path: p })
    const perf = json?.lighthouseResult?.categories?.performance?.score
    const cwv = json?.loadingExperience?.metrics || {}
    out.push({
      url,
      perf: perf != null ? Math.round(perf * 100) : null,
      lcp: cwv.LARGEST_CONTENTFUL_PAINT_MS?.category,
      cls: cwv.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category,
      inp: cwv.INTERACTION_TO_NEXT_PAINT?.category,
    })
  }
  return { configured: true, out }
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------
function md(rows, gsc, psi) {
  const L = []
  const now = new Date().toISOString().slice(0, 16).replace("T", " ")
  L.push(`# arelion.dev SEO report (${now})`)
  L.push(`\nPublished case studies: ${PUBLISHED.length}. Site: ${SITE}\n`)

  L.push(`## 1. On-page audit`)
  const withIssues = rows.filter(r => r.issues.length)
  L.push(`${withIssues.length} of ${rows.length} pages have on-page issues.\n`)
  for (const r of rows) {
    if (!r.issues.length) continue
    L.push(`- **${r.slug}** (${r.pillar}): ${r.issues.join("; ")}`)
  }
  const clean = rows.filter(r => !r.issues.length).map(r => r.slug)
  if (clean.length) L.push(`\nClean: ${clean.join(", ")}`)

  L.push(`\n## 2. Search Console (last 28 days)`)
  if (!gsc.configured) {
    L.push(`Not configured. Set GSC_SA_KEY (service-account JSON path) and GSC_SITE (e.g. sc-domain:arelion.dev), then re-run. See seo/README.md.`)
  } else {
    L.push(`Window ${gsc.start} to ${gsc.end}. ${gsc.byQuery.length} queries, ${gsc.byPage.length} pages.\n`)
    L.push(`### Striking distance (position 5 to 20, quick wins)`)
    if (!gsc.striking.length) L.push(`None yet (site is young or not enough impressions).`)
    for (const r of gsc.striking)
      L.push(`- "${r.keys[0]}" — pos ${r.position.toFixed(1)}, ${r.impressions} impr, ${r.clicks} clicks, CTR ${(r.ctr * 100).toFixed(1)}%`)
    L.push(`\n### Top pages by clicks`)
    for (const r of gsc.byPage.sort((a, b) => b.clicks - a.clicks).slice(0, 10))
      L.push(`- ${r.keys[0]} — ${r.clicks} clicks, ${r.impressions} impr, pos ${r.position.toFixed(1)}`)
  }

  L.push(`\n## 3. Core Web Vitals`)
  if (!psi.configured) L.push(`Not configured. Set PSI_API_KEY, then re-run.`)
  else for (const p of psi.out)
    L.push(`- ${p.url} — perf ${p.perf}, LCP ${p.lcp}, CLS ${p.cls}, INP ${p.inp}`)

  return L.join("\n") + "\n"
}

// ---------------------------------------------------------------------------
async function main() {
  const rows = onPageAudit()
  let gsc = { configured: false }, psi = { configured: false }
  try { gsc = await gscAudit() } catch (e) { gsc = { configured: false, error: e.message } }
  try {
    const urls = [SITE + "/", SITE + "/case-studies/", ...PUBLISHED.slice(0, 3).map(c => `${SITE}/case-studies/${c.slug}/`)]
    psi = await psiAudit(urls)
  } catch (e) { psi = { configured: false, error: e.message } }

  const report = md(rows, gsc, psi)
  const outDir = path.join(__dirname, "reports")
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `report-${new Date().toISOString().slice(0, 10)}.md`)
  fs.writeFileSync(outFile, report)
  console.log(report)
  console.error(`\n[written] ${path.relative(ROOT, outFile)}`)
  if (gsc.error) console.error(`[gsc] skipped: ${gsc.error}`)
}

main()
