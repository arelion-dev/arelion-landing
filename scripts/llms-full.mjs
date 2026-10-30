// llms-full.txt: the text of every page of the sitemap in one file, for the
// AI assistants that read a whole site at once (the llms.txt convention).
// It is read from the pages build.mjs has just written to dist/, so it says
// exactly what the pages say: the title, the URL, then the text of <main>,
// one block per line. Forms, scripts, styles and drawings are left out.
import fs from "node:fs"
import path from "node:path"

// The named entities the pages use, plus the usual ones; numeric ones are decoded too.
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rarr: "\u2192", larr: "\u2190", middot: "\u00b7", hellip: "\u2026", rsquo: "\u2019", lsquo: "\u2018", rdquo: "\u201d", ldquo: "\u201c", times: "\u00d7", copy: "\u00a9", euro: "\u20ac", deg: "\u00b0" }
export const decode = s =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e.toLowerCase()] ?? m),
  )

// The text a reader sees in a page's <main>, one block per line.
export function mainText(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)
  if (!main) throw new Error("llms-full: a page without <main>")
  return decode(
    main[1]
      .replace(/<(form|script|style|svg|template|noscript)\b[\s\S]*?<\/\1>/g, "")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<\/(p|h1|h2|h3|h4|h5|h6|li|dt|dd|summary|tr|th|td|figcaption|blockquote|pre|div|section|article|header|caption)>/g, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map(l => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
}

// out: the built site. name: the site's name for the heading. sitemap: the
// file that lists the pages (Gatsby writes sitemap-0.xml). Returns the text;
// the build writes it.
export function llmsFull({ out, name, updated, sitemap: sitemapFile = "sitemap.xml" }) {
  const sitemap = fs.readFileSync(path.join(out, sitemapFile), "utf8")
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  const pages = urls.map(u => {
    const rel = decodeURIComponent(new URL(u).pathname).replace(/^\/+/, "")
    const html = fs.readFileSync(path.join(out, rel, "index.html"), "utf8")
    const title = decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/)[1].trim())
    return `## ${title}\n\nURL: ${u}\n\n${mainText(html)}\n`
  })
  return `# ${name}: full text of every page\n\n${updated ? `Last updated: ${updated}\n\n` : ""}${pages.join("\n")}`
}
