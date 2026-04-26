// Edit this file to fill in real outcomes. Items marked TODO are placeholder
// content — the structure is correct, only the strings need updating.
//
// Status options: "shipped" | "ongoing" | "sold" | "acquired"

const REALISATIONS = [
  // ───────── Real, ready to ship ─────────
  {
    id: "loreal",
    client: "L'Oréal",
    color: "#fce4ec",
    period: "2023 — 2024",
    status: "shipped",
    stack: ["Python", "FastAPI", "GCP", "Vertex AI", "pgvector", "Terraform"],
    en: {
      role: "Solutions Architect",
      outcomes: [
        "Built ingestion pipeline for 100M+ pages of brand documentation",
        "Cut OCR cost per page by ~80% with batched Vertex AI calls",
        "Semantic search across 30 brands, sub-second p95 latency",
      ],
    },
    fr: {
      role: "Architecte Solutions",
      outcomes: [
        "Pipeline d'ingestion de 100M+ pages de documentation",
        "Coût OCR par page réduit de ~80% via Vertex AI batché",
        "Recherche sémantique sur 30 marques, latence p95 < 1s",
      ],
    },
  },
  {
    id: "privately-ai",
    client: "privately.ai",
    color: "#e0f2f1",
    period: "2023 — 2024",
    status: "acquired",
    stack: ["Next.js", "Python", "OpenAI API", "Postgres", "Stripe"],
    en: {
      role: "Founder & CTO",
      outcomes: [
        "Built and sold a Document AI SaaS for legal & HR teams",
        "0 → first paying customers in 4 months",
        "Acquired in 2024",
      ],
    },
    fr: {
      role: "Fondateur & CTO",
      outcomes: [
        "Création et revente d'un SaaS Document AI pour le légal & RH",
        "0 → premiers clients payants en 4 mois",
        "Racheté en 2024",
      ],
    },
  },

  // ───────── Real-but-light, fill in details ─────────
  {
    id: "fmt",
    client: "Free Malaysia Today",
    color: "#e3f2fd",
    period: "2025 — present",
    status: "ongoing",
    stack: ["Next.js", "GraphQL", "Prisma", "GCP", "Cloud Run", "Terraform"],
    en: {
      role: "Fractional CTO",
      outcomes: [
        "TODO: full infra rebuild — legacy GCP → new GCP with zero downtime",
        "TODO: outcome with a number (cost / latency / traffic)",
        "TODO: outcome with scale or team impact",
      ],
    },
    fr: {
      role: "CTO Fractionné",
      outcomes: [
        "TODO: refonte complète de l'infra — legacy GCP → nouveau GCP sans coupure",
        "TODO: résultat chiffré (coût / latence / trafic)",
        "TODO: résultat sur l'échelle ou l'impact équipe",
      ],
    },
  },
  {
    id: "relevanc",
    client: "relevanC",
    color: "#fff3cd",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO", "TODO"],
    en: {
      role: "Solutions Architect",
      outcomes: [
        "Designed analytics platform processing 400M+ events/month",
        "TODO: outcome with a number",
        "TODO: outcome with before/after",
      ],
    },
    fr: {
      role: "Architecte Solutions",
      outcomes: [
        "Plateforme analytics traitant 400M+ événements/mois",
        "TODO: résultat chiffré",
        "TODO: résultat avant/après",
      ],
    },
  },
  {
    id: "foundingbird",
    client: "Foundingbird",
    color: "#ffccbc",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO"],
    en: {
      role: "Cofounder & CTO",
      outcomes: [
        "TODO: end-to-end product ownership",
        "TODO: outcome with a number",
        "TODO: outcome with scale",
      ],
    },
    fr: {
      role: "Cofondateur & CTO",
      outcomes: [
        "TODO: pilotage produit de bout en bout",
        "TODO: résultat chiffré",
        "TODO: résultat sur l'échelle",
      ],
    },
  },
  {
    id: "kaunto",
    client: "Kaunto",
    color: "#fff9c4",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO"],
    en: {
      role: "Cofounder & CTO",
      outcomes: [
        "TODO: end-to-end product ownership",
        "TODO: outcome with a number",
        "TODO: outcome with scale",
      ],
    },
    fr: {
      role: "Cofondateur & CTO",
      outcomes: [
        "TODO: pilotage produit de bout en bout",
        "TODO: résultat chiffré",
        "TODO: résultat sur l'échelle",
      ],
    },
  },

  // ───────── Pure placeholders ─────────
  {
    id: "deezer",
    client: "Deezer",
    color: "#f3e5f5",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO"],
    en: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
    fr: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
  },
  {
    id: "epsor",
    client: "Epsor",
    color: "#fce4ec",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO"],
    en: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
    fr: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
  },
  {
    id: "altair-labs",
    client: "Altaïr Labs",
    color: "#e0f2f1",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO"],
    en: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
    fr: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
  },
  {
    id: "pokespot",
    client: "PokeSpot",
    color: "#e3f2fd",
    period: "TODO",
    status: "shipped",
    stack: ["React Native", "TODO", "TODO"],
    en: {
      role: "TODO",
      outcomes: [
        "Top 5 App Store, 1M+ downloads",
        "TODO",
        "TODO",
      ],
    },
    fr: {
      role: "TODO",
      outcomes: [
        "Top 5 App Store, 1M+ téléchargements",
        "TODO",
        "TODO",
      ],
    },
  },
  {
    id: "matters",
    client: "Matters",
    color: "#fff3cd",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO"],
    en: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
    fr: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
  },
  {
    id: "fullsend",
    client: "Fullsend",
    color: "#ffccbc",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO"],
    en: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
    fr: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
  },
  {
    id: "easydca",
    client: "EasyDCA",
    color: "#fff9c4",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO"],
    en: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
    fr: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
  },
  {
    id: "vertical-ascent",
    client: "Vertical Ascent",
    color: "#f3e5f5",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO"],
    en: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
    fr: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
  },
  {
    id: "ambient-it",
    client: "AmbientIT",
    color: "#fce4ec",
    period: "TODO",
    status: "shipped",
    stack: ["TODO", "TODO", "TODO"],
    en: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
    fr: {
      role: "TODO",
      outcomes: ["TODO", "TODO", "TODO"],
    },
  },
]

export default REALISATIONS
