// The pages that sell, linked from the footer of every page (2026-11-01). The
// home cards had these links; the footer passes the home's link weight to them
// and adds a link from every other page. Plain CommonJS, like offers.js.
const FOOTER_SERVICES = [
  { to: "/ai-automation-uae/", label: "AI automation in the UAE" },
  { to: "/arabic-ocr/", label: "Arabic OCR" },
  { to: "/legal-ai-uae/", label: "Legal AI for law firms" },
  { to: "/software-development-abu-dhabi/", label: "App development in Abu Dhabi" },
]

module.exports = { FOOTER_SERVICES }
