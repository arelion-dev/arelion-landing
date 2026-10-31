// What I sell, in the order the case studies index shows it. Plain CommonJS,
// like case-studies.js, so gatsby-node and components can both use it.
// A study lists its offers in `offers` (main one first). `lab: true` marks my
// own projects, shown apart from client work. `css` reuses one of the
// existing kicker colours (cs-p-*).

const OFFERS = [
  { name: "AI automation", css: "automate" },
  { name: "Company brain", css: "build" },
  { name: "Document AI", css: "audit" },
  { name: "Legal AI", css: "transform" },
  { name: "AI agents", css: "llm" },
  { name: "Private LLMs", css: "llm" },
  { name: "Fractional CTO", css: "transform" },
  { name: "Lab", css: "lab" },
]

// Offers of a study, main one first. A study without `offers` falls back to its pillar.
const offersOf = cs => (Array.isArray(cs.offers) && cs.offers.length ? cs.offers : [cs.pillar])

// Kicker colour class of a study, from its main offer.
const offerClass = cs => {
  const main = OFFERS.find(o => o.name === offersOf(cs)[0])
  return `cs-p-${main ? main.css : String(cs.pillar).toLowerCase()}`
}

// Card headline: the business result for client work, the title otherwise.
const headlineOf = (cs, lang = "en") => (cs.outcome && cs.outcome[lang]) || cs.title[lang]

module.exports = { OFFERS, offersOf, offerClass, headlineOf }
