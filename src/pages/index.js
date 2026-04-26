import React, { useState, useEffect } from "react"
import { graphql } from "gatsby"

import PortfolioLayout from "../components/portfolio-layout"
import Realisations from "../components/realisations"
import SEO from "../components/seo"
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

const STICKY_NOTES = {
  en: [
    "100M+ pages processed",
    "Top 5 App Store, 1M+ downloads",
    "Built & sold multiple SaaS",
    "20+ clients · 12\u00A0years",
  ],
  fr: [
    "100M+ pages traitées",
    "Top 5 App Store, 1M+ DL",
    "Plusieurs SaaS créés et revendus",
    "20+ clients · 12\u00A0ans",
  ],
}

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
  "jolicloud",
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

const ROLES = {
  en: [
    {
      title: "Technical Product Leadership",
      badge: "Scrum Product Owner Certified",
      desc: "We prioritize the roadmap, scope requirements, write specs and coordinate stakeholders. Two startups cofounded and run end-to-end (Foundingbird, Kaunto) — we know what shipping looks like.",
    },
    {
      title: "AI for Business",
      desc: "We help SMBs and enterprises adopt AI: RAG, semantic search, LLM integrations, workflow automation — finding the right tool without overengineering. Built and sold privately.ai (Document AI SaaS).",
    },
    {
      title: "Solutions Architecture",
      desc: (
        <>
          Built the ingestion pipeline for 100M+ pages at L'Oréal (OCR,
          vectorization, semantic search). Designed relevanC's analytics
          platform processing 400M+ events/month.
          <br />
          Full-stack (React, React Native, TypeScript, Python, FastAPI) on GCP
          with Terraform.
        </>
      ),
    },
  ],
  fr: [
    {
      title: "Pilotage Produit Technique",
      badge: "Certifié Scrum Product Owner",
      desc: "Nous priorisons la roadmap, cadrons les besoins, rédigeons les specs et coordonnons les parties prenantes. Deux startups cofondées et pilotées de bout en bout (Foundingbird, Kaunto) — nous savons ce que livrer veut dire.",
    },
    {
      title: "IA pour l'Entreprise",
      desc: "Nous accompagnons PME, TPE et grands groupes dans l'adoption IA : RAG, recherche sémantique, intégrations LLM, automatisation — trouver le bon outil sans surdimensionner. Conçu et vendu privately.ai (SaaS Document AI).",
    },
    {
      title: "Architecture Solutions",
      desc: (
        <>
          Pipeline d'ingestion de 100M+ pages chez L'Oréal (OCR, vectorisation,
          recherche sémantique). Plateforme analytics de relevanC (400M+
          événements/mois).
          <br />
          Full-stack (React, React Native, TypeScript, Python, FastAPI) sur GCP
          avec Terraform.
        </>
      ),
    },
  ],
}

const CONTENT = {
  en: {
    name: "Arelion",
    experience: "Boutique tech studio · Led by Antonin Ribeaud",
    subtitle: (
      <>
        Software Engineering · AI &amp; Solutions Architecture
        <br />
        Paris <img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1eb-1f1f7.svg" alt="🇫🇷" className="emoji-flag" /> &amp; Dubai <img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1e6-1f1ea.svg" alt="🇦🇪" className="emoji-flag" />
      </>
    ),
    headline: (
      <>
        AI systems, cloud platforms, and SaaS{" "}
        <span className="portfolio-headline-accent">
          from design to production
        </span>
        .
      </>
    ),
    worked: "Companies we've worked with",
    realisations: "Selected work",
    blog: "Read the blog",
    ctaBottom: "Let's talk",
    nav: {
      blog: "blog",
      bookCall: "book a call",
      testimonials: "testimonials",
    },
  },
  fr: {
    name: "Arelion",
    experience: "Studio tech boutique · Dirigé par Antonin Ribeaud",
    subtitle: (
      <>
        Développement · IA &amp; Architecture Solutions
        <br />
        Paris <img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1eb-1f1f7.svg" alt="🇫🇷" className="emoji-flag" /> &amp; Dubaï <img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1e6-1f1ea.svg" alt="🇦🇪" className="emoji-flag" />
      </>
    ),
    headline: (
      <>
        Systèmes IA, plateformes cloud et SaaS{" "}
        <span className="portfolio-headline-accent">
          de la conception à la production
        </span>
        .
      </>
    ),
    worked: "Entreprises avec lesquelles nous avons travaillé",
    realisations: "Réalisations",
    blog: "Lire le blog",
    ctaBottom: "Discutons",
    nav: {
      blog: "blog",
      bookCall: "réserver un appel",
      testimonials: "recommandations",
    },
  },
}

const SocialLinks = ({ social, blogLabel }) => {
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
    social?.blog && (
      <a
        key="blog"
        href={social.blog}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("click", "social", "blog")}
      >
        {blogLabel}
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
  const author = data.site.siteMetadata?.author
  const social = data.site.siteMetadata?.social
  const avatar = data?.avatar?.childImageSharp?.gatsbyImageData
  const [lang, setLang] = useState("en")

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash === "fr" || hash === "en") {
      setLang(hash)
    } else {
      const browserLang = navigator.language || ""
      if (browserLang.startsWith("fr")) setLang("fr")
    }
  }, [])

  useEffect(() => {
    window.location.hash = lang
  }, [lang])

  const t = CONTENT[lang]
  const roles = ROLES[lang]

  return (
    <PortfolioLayout
      avatar={avatar}
      author={author}
      navLabels={t.nav}
      navExtra={
        <button
          className="lang-toggle"
          onClick={() => {
            const newLang = lang === "en" ? "fr" : "en"
            setLang(newLang)
            trackEvent("click", "language", newLang)
          }}
          aria-label="Switch language"
        >
          <img
            src={lang === "en"
              ? "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1eb-1f1f7.svg"
              : "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1ec-1f1e7.svg"
            }
            alt={lang === "en" ? "FR" : "EN"}
            className="emoji-flag"
          />
        </button>
      }
    >
      <section className="portfolio-hero-wrapper">
        {STICKY_NOTES[lang].map((text, i) => (
          <div
            key={text}
            className={`sticky-note sticky-note--${STICKY_NOTE_STYLES[i].pos}`}
            style={STICKY_NOTE_STYLES[i].style}
          >
            {text}
          </div>
        ))}
        <div className="portfolio-hero">
          <h2 className="portfolio-author-name">{t.name}</h2>
          <p className="portfolio-experience">{t.experience}</p>
          <p className="portfolio-subtitle">{t.subtitle}</p>
          <h1 className="portfolio-headline">{t.headline}</h1>
          <SocialLinks social={social} blogLabel={t.blog} />
        </div>
      </section>

      <div className="sticky-notes-mobile">
        {STICKY_NOTES[lang].map((text, i) => (
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
        <p className="companies-label">{t.worked}</p>
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
        {roles.map((role, i) => (
          <div key={role.title} className="role-card" style={ROLE_STYLES[i]}>
            <h3 className="role-card-title">{role.title}</h3>
            {role.badge && (
              <span className="role-card-badge">{role.badge}</span>
            )}
            <p className="role-card-desc">{role.desc}</p>
          </div>
        ))}
      </section>

      <Realisations lang={lang} heading={t.realisations} />

      <section className="cta-bottom">
        <a
          onClick={() => trackEvent("click", "cta", "lets_talk_bottom")}
          className="nav-pill nav-pill-primary cta-bottom-button"
          href="https://calendar.app.google/rGenB9JqgBh8xSyh8"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.ctaBottom}
        </a>
      </section>
    </PortfolioLayout>
  )
}

export default IndexPage

export const Head = () => (
  <SEO
    title="Arelion | Boutique tech studio — AI, cloud, SaaS"
    description="Arelion is a boutique tech studio. One senior engineer, a few clients at a time. AI systems, cloud platforms and SaaS, from design to production. Paris and Dubai."
  />
)

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        author {
          name
          summary
        }
        social {
          linkedin
          github
          blog
        }
      }
    }
    avatar: file(absolutePath: { regex: "/profile-pic.jpeg/" }) {
      childImageSharp {
        gatsbyImageData(width: 40, height: 40, quality: 95, layout: FIXED)
      }
    }
  }
`
