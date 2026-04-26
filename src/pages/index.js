import React from "react"
import { graphql } from "gatsby"

import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import SelectedWork from "../components/selected-work"
import trackEvent from "../hooks/use-track-event"

const STICKY_NOTE_STYLES = [
  {
    pos: "top-left",
    style: { backgroundColor: "#fff3cd", transform: "rotate(5deg)" },
  },
  {
    pos: "top-right",
    style: { backgroundColor: "#c8e6c9", transform: "rotate(-4deg)" },
  },
  {
    pos: "bottom-left",
    style: { backgroundColor: "#ffccbc", transform: "rotate(3deg)" },
  },
  {
    pos: "bottom-right",
    style: { backgroundColor: "#fff9c4", transform: "rotate(-5deg)" },
  },
]

const STICKY_NOTES = [
  "100M+ pages processed",
  "Top 5 App Store, 1M+ downloads",
  "Built & sold multiple SaaS",
  "20+ clients · 12 years",
]

const COMPANIES = [
  "L'Oréal",
  "Deezer",
  "Free Malaysia Today",
  "relevanC",
  "Epsor",
  "Altaïr Labs",
  "Foundingbird",
  "PokeSpot",
  "AmbientIT",
  "Kaunto",
  "Matters",
  "Jolicloud",
  "Flashbreak",
  "Fullsend",
  "Vertical Ascent",
  "privately.ai",
  "EasyDCA",
]
const COMPANIES_DOUBLED = [...COMPANIES, ...COMPANIES]

const ROLE_STYLES = [
  { backgroundColor: "#fce4ec" },
  { backgroundColor: "#e0f2f1" },
  { backgroundColor: "#e3f2fd" },
]

const ROLES = [
  {
    title: "Technical Product Leadership",
    badge: "Scrum Product Owner Certified",
    desc: "We prioritize the roadmap, scope requirements, write specs and coordinate stakeholders. Two startups cofounded and run end-to-end (Foundingbird, Kaunto) — we know what shipping looks like.",
  },
  {
    title: "AI for Business",
    desc: "We help SMBs and enterprises adopt AI: RAG, semantic search, LLM integrations, workflow automation — finding the right tool without overengineering. Designed and sold a Document AI SaaS in 2025.",
  },
  {
    title: "Solutions Architecture",
    desc: (
      <>
        Built the ingestion pipeline for 100M+ pages at L'Oréal (OCR,
        vectorization, semantic search). Designed relevanC's analytics platform
        processing 400M+ events/month.
        <br />
        Full-stack (React, React Native, TypeScript, Python, FastAPI) on GCP
        with Terraform.
      </>
    ),
  },
]

const SocialLinks = ({ social }) => {
  const links = [
    social?.github && (
      <a key="gh" href={social.github} onClick={() => trackEvent("click", "social", "github")}>
        GitHub
      </a>
    ),
    social?.linkedin && (
      <a key="li" href={social.linkedin} onClick={() => trackEvent("click", "social", "linkedin")}>
        LinkedIn
      </a>
    ),
  ].filter(Boolean)

  return (
    <div className="portfolio-social-links">
      {links.flatMap((link, i) =>
        i > 0
          ? [
              <span key={`d${i}`} className="portfolio-diamond">
                &#9671;
              </span>,
              link,
            ]
          : [link],
      )}
    </div>
  )
}

const IndexPage = ({ data }) => {
  const social = data.site.siteMetadata?.social

  return (
    <PortfolioLayout>
      <section className="portfolio-hero-wrapper">
        {STICKY_NOTES.map((text, i) => (
          <div
            key={text}
            className={`sticky-note sticky-note--${STICKY_NOTE_STYLES[i].pos}`}
            style={STICKY_NOTE_STYLES[i].style}
          >
            {text}
          </div>
        ))}
        <div className="portfolio-hero">
          <h2 className="portfolio-author-name">Arelion</h2>
          <p className="portfolio-experience">Boutique tech studio</p>
          <p className="portfolio-subtitle">
            Software Engineering · AI &amp; Solutions Architecture
          </p>
          <h1 className="portfolio-headline">
            AI systems, cloud platforms, and SaaS{" "}
            <span className="portfolio-headline-accent">
              from design to production
            </span>
            .
          </h1>
          <SocialLinks social={social} />
        </div>
      </section>

      <div className="sticky-notes-mobile">
        {STICKY_NOTES.map((text, i) => (
          <div
            key={`m-${text}`}
            className="sticky-note-mobile"
            style={{
              backgroundColor: STICKY_NOTE_STYLES[i].style.backgroundColor,
            }}
          >
            {text}
          </div>
        ))}
      </div>

      <section className="companies-section">
        <p className="companies-label">Companies we've worked with</p>
        <div className="companies-scroll">
          <div className="companies-track">
            {COMPANIES_DOUBLED.map((name, i) => (
              <span key={`${name}-${i}`} className="company-name">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="roles-section">
        {ROLES.map((role, i) => (
          <div key={role.title} className="role-card" style={ROLE_STYLES[i]}>
            <h3 className="role-card-title">{role.title}</h3>
            {role.badge && (
              <span className="role-card-badge">{role.badge}</span>
            )}
            <p className="role-card-desc">{role.desc}</p>
          </div>
        ))}
      </section>

      <SelectedWork />

      <section className="cta-bottom">
        <a
          onClick={() => trackEvent("click", "cta", "lets_talk_bottom")}
          className="nav-pill nav-pill-primary cta-bottom-button"
          href="https://calendar.app.google/rGenB9JqgBh8xSyh8"
          target="_blank"
          rel="noopener noreferrer"
        >
          Let's talk
        </a>
      </section>
    </PortfolioLayout>
  )
}

export default IndexPage

export const Head = () => (
  <SEO
    title="Arelion | Boutique tech studio — AI, cloud, SaaS"
    description="Arelion is a boutique tech studio. One senior engineer, a few clients at a time. AI systems, cloud platforms and SaaS, from design to production."
  />
)

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        social {
          linkedin
          github
        }
      }
    }
  }
`
