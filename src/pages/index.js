import React from "react"
import { Link, graphql } from "gatsby"

import { useI18n } from "../i18n"
import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import SelectedWork from "../components/selected-work"
import FeaturedCaseStudies from "../components/featured-case-studies"
import WhatsAppIcon from "../components/whatsapp-icon"
import trackEvent from "../hooks/use-track-event"
import TESTI_PHOTOS from "../data/testimonial-photos"
import Highlighted from "../components/highlighted"
import MobileRail from "../components/mobile-rail"

const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"

const TESTIMONIALS_URL =
  "https://www.linkedin.com/in/antoninribeaud/details/recommendations/?detailScreenTabIndex=0"

// Homepage testimonials. Desktop shows three (Chris highlighted in the middle);
// mobile shows every recommendation in a swipe carousel, Chris first.
const DESKTOP_TESTIMONIAL_NAMES = [
  "Alex Gutwillig",
  "Christopher Ware",
  "Ciprian Noaghiu",
]
const FEATURED_TESTIMONIAL = "Christopher Ware"

// Material tonal containers (blue / green / orange / purple)
const STICKY_NOTE_STYLES = [
  { pos: "top-left", style: { backgroundColor: "#d8e6ff" } },
  { pos: "top-right", style: { backgroundColor: "#d3f2da" } },
  { pos: "bottom-left", style: { backgroundColor: "#ffe3cc" } },
  { pos: "bottom-right", style: { backgroundColor: "#e9e0ff" } },
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

// Material tonal containers, aligned with the hero stat cards
const ROLE_STYLES = [
  { backgroundColor: "#ffe3cc" },
  { backgroundColor: "#d3f2da" },
  { backgroundColor: "#d8e6ff" },
]

const renderDesc = desc =>
  (Array.isArray(desc) ? desc : [desc]).map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </React.Fragment>
  ))

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
    social?.whatsapp && (
      <a
        key="wa"
        href={social.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("click", "social", "whatsapp")}
      >
        WhatsApp
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
  const avatar = data.avatar?.childImageSharp?.gatsbyImageData
  const { t } = useI18n()

  const byName = name => t("testi.items").find(item => item.name === name)
  const desktopTestimonials = DESKTOP_TESTIMONIAL_NAMES.map(byName).filter(Boolean)
  // Mobile carousel: the whole set, the highlighted recommendation first.
  const mobileTestimonials = t("testi.items")
    .slice()
    .sort((a, b) => (b.name === FEATURED_TESTIMONIAL) - (a.name === FEATURED_TESTIMONIAL))

  const renderTestimonial = (item, featured = false) => (
    <figure
      key={item.name}
      className={featured ? "testi-card testi-card--featured" : "testi-card"}
    >
      <a
        className="testi-link"
        href={TESTIMONIALS_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("click", "social", "testimonial_linkedin")}
      >
        {t("testi.readOn")} &#8599;
      </a>
      <blockquote className="testi-quote">
        <Highlighted text={item.quote} />
      </blockquote>
      <figcaption className="testi-who">
        <img
          className="testi-avatar"
          src={TESTI_PHOTOS[item.name]}
          alt={item.name}
          width="44"
          height="44"
          loading="lazy"
        />
        <div className="testi-id">
          <span className="testi-name">{item.name}</span>
          <span className="testi-role">
            {item.role.split(" · ").map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </React.Fragment>
            ))}
          </span>
        </div>
      </figcaption>
    </figure>
  )

  const stickyNotes = t("hero.sticky")
  const roles = [
    {
      title: t("roles.leadership.title"),
      badge: t("roles.leadership.badge"),
      desc: t("roles.leadership.desc"),
    },
    { title: t("roles.ai.title"), desc: t("roles.ai.desc") },
    { title: t("roles.arch.title"), desc: t("roles.arch.desc") },
  ]

  return (
    <PortfolioLayout avatar={avatar}>
      <section className="portfolio-hero-wrapper">
        {stickyNotes.map((text, i) => (
          <div
            key={text}
            className={`sticky-note sticky-note--${STICKY_NOTE_STYLES[i].pos}`}
            style={STICKY_NOTE_STYLES[i].style}
          >
            {/* " · " marks a line break on the desktop stat cards */}
            <span>
              {text.split(" · ").map((part, j) => (
                <React.Fragment key={j}>
                  {j > 0 && <br />}
                  {part}
                </React.Fragment>
              ))}
            </span>
          </div>
        ))}
        <div className="portfolio-hero">
          <p className="portfolio-author-name">Arelion</p>
          <p className="portfolio-person">Antonin Ribeaud</p>
          <p className="portfolio-subtitle">{t("hero.subtitle")}</p>
          <h1 className="portfolio-headline">
            {/* *word* segments from the catalog render in the accent color */}
            {t("hero.headline")
              .split("*")
              .map((part, i) =>
                i % 2 ? (
                  <span key={i} className="portfolio-headline-accent">
                    {part}
                  </span>
                ) : (
                  <React.Fragment key={i}>{part}</React.Fragment>
                ),
              )}
            <span className="portfolio-headline-accent">.</span>
          </h1>
          <SocialLinks social={social} />
          <a
            className="nav-pill nav-pill-primary hero-cta-mobile"
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("click", "cta", "book_a_call_hero")}
          >
            {t("nav.bookACall")}
          </a>
        </div>
      </section>

      <div className="sticky-notes-mobile">
        {stickyNotes.map((text, i) => (
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
        <p className="companies-label">{t("hero.companiesLabel")}</p>
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
            <p className="role-card-desc">{renderDesc(role.desc)}</p>
          </div>
        ))}
      </section>

      <section className="testi-section">
        <div className="testi-head">
          <h2 className="testi-title">{t("testi.title")}</h2>
          <Link
            to="/testimonials"
            className="nav-pill nav-pill-primary testi-head-seeall"
          >
            {t("testi.seeAll")} &rarr;
          </Link>
        </div>
        <div className="testi-desktop">
          {desktopTestimonials.map(item =>
            renderTestimonial(item, item.name === FEATURED_TESTIMONIAL),
          )}
        </div>
        <div className="testi-mobile">
          <MobileRail className="testi-rail" label={t("testi.title")}>
            {mobileTestimonials.map(item => renderTestimonial(item))}
          </MobileRail>
        </div>
        <div className="testi-more">
          <Link to="/testimonials" className="nav-pill nav-pill-primary">
            {t("testi.readMore")} &rarr;
          </Link>
        </div>
      </section>

      <FeaturedCaseStudies />

      <SelectedWork />

      <section className="cta-bottom">
        <h2 className="cta-bottom-title">{t("cs.closeH2")}</h2>
        <a
          onClick={() => trackEvent("click", "cta", "lets_talk_bottom")}
          className="nav-pill nav-pill-primary cta-bottom-button"
          href={CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("nav.bookACall")}
        </a>
        {social?.whatsapp && (
          <a
            onClick={() => trackEvent("click", "cta", "whatsapp_bottom")}
            className="nav-pill nav-pill-whatsapp cta-bottom-button"
            href={social.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
        )}
      </section>
    </PortfolioLayout>
  )
}

export default IndexPage

const SAME_AS = [
  "https://www.linkedin.com/in/antoninribeaud/",
  "https://github.com/antonhansel",
  "https://antonin.cool",
]

// Two cross-linked entities in one graph: the studio (ProfessionalService) and
// the person who runs it. Both carry name + description + url + sameAs so an
// agent can resolve either identity fully, whichever it latches onto.
const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": "https://arelion.dev/#organization",
      name: "Arelion",
      legalName: "ARELION FZCO",
      url: "https://arelion.dev",
      description:
        "Boutique tech studio. One senior engineer, a few clients at a time. AI systems, cloud platforms and SaaS, from design to production.",
      founder: { "@id": "https://arelion.dev/#antonin" },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dubai",
        addressCountry: "AE",
      },
      areaServed: "Worldwide",
      knowsAbout: [
        "Artificial Intelligence",
        "Retrieval-Augmented Generation",
        "Solutions Architecture",
        "Cloud Platforms",
        "Google Cloud Platform",
        "Terraform",
        "React",
        "TypeScript",
        "Python",
        "FastAPI",
        "Technical Product Management",
      ],
      sameAs: SAME_AS,
    },
    {
      "@type": "Person",
      "@id": "https://arelion.dev/#antonin",
      name: "Antonin Ribeaud",
      url: "https://arelion.dev",
      jobTitle: "Founder and Principal Engineer",
      description:
        "Senior software engineer and founder of Arelion. Builds AI systems, cloud platforms and SaaS end to end: RAG and LLM integrations, ingestion pipelines at scale, and technical product leadership.",
      worksFor: { "@id": "https://arelion.dev/#organization" },
      knowsAbout: [
        "Artificial Intelligence",
        "Retrieval-Augmented Generation",
        "Solutions Architecture",
        "Cloud Platforms",
        "Technical Product Management",
      ],
      sameAs: SAME_AS,
    },
  ],
}

export const Head = ({ location }) => (
  <SEO
    title="Arelion | Boutique tech studio, AI, cloud, SaaS"
    description="Arelion is a boutique tech studio. One senior engineer, a few clients at a time. AI systems, cloud platforms and SaaS, from design to production."
    pathname={location.pathname}
  >
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
    />
  </SEO>
)

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        social {
          linkedin
          github
          whatsapp
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
