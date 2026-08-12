import React, { useState, useMemo } from "react"
import { Link } from "gatsby"

import { useI18n } from "../i18n"
import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import CASE_STUDIES from "../data/case-studies"

// Only show tabs for pillars that actually have visible case studies
// (e.g. "LLM" stays hidden in prod until one of its studies is published).
const PILLARS = ["Build", "Automate", "Transform", "Audit", "LLM", "Lab"].filter(p =>
  CASE_STUDIES.some(c => c.pillar === p),
)
const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"

// Dev-only publish-state overlay. Never rendered in a production build, so it is
// local-only by construction: it lets me see which studies are live for everyone
// vs draft (visible only on this local dev server).
const IS_DEV = process.env.NODE_ENV === "development"

const CaseStudiesPage = () => {
  const { t } = useI18n()
  // FR temporarily disabled for case studies: card content stays English.
  const lang = "en"
  const [active, setActive] = useState(null)

  const shown = useMemo(
    () =>
      (active ? CASE_STUDIES.filter(c => c.pillar === active) : CASE_STUDIES)
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [active],
  )

  return (
    <PortfolioLayout>
      <section className="cs-hero">
        <div className="cs-hero-in">
          <p className="cs-hero-kicker">{t("cs.kicker")}</p>
          <h1>{t("cs.h1")}</h1>
          <p className="cs-hero-dek">{t("cs.dek")}</p>
          <p className="cs-hero-intro">
            AI engineering case studies from real client work: RAG and document
            intelligence over millions of pages, autonomous research agents, LLM
            evaluation, OCR benchmarking, multi-tier caching at scale, local AI
            stacks, and AI security. Each one shows the concrete problem, the
            architecture, and what transfers to your team.
          </p>
        </div>
      </section>

      <div className="cs-index-wrap">
        <div className="cs-tabs">
          <button
            type="button"
            className={active === null ? "on" : ""}
            onClick={() => setActive(null)}
          >
            {t("cs.tabsAll")}
          </button>
          {PILLARS.map(p => (
            <button
              key={p}
              type="button"
              className={active === p ? "on" : ""}
              onClick={() => setActive(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {IS_DEV && (
          <p className="cs-devbar">
            Local view.{" "}
            <span className="cs-flag cs-flag-pub">
              {CASE_STUDIES.filter(c => c.published).length} published
            </span>{" "}
            <span className="cs-flag cs-flag-draft">
              {CASE_STUDIES.filter(c => !c.published).length} local only
            </span>{" "}
            The draft ones are hidden in the production build.
          </p>
        )}

        <div className="cs-index-grid">
          {shown.map(cs => (
            <Link
              key={cs.slug}
              to={`/case-studies/${cs.slug}`}
              className={`cs-row${IS_DEV && !cs.published ? " cs-row-draft" : ""}`}
            >
              {IS_DEV && (
                <span
                  className={`cs-flag ${cs.published ? "cs-flag-pub" : "cs-flag-draft"}`}
                >
                  {cs.published ? "PUBLISHED" : "DRAFT · local only"}
                </span>
              )}
              <p className={`cs-row-kicker cs-p-${cs.pillar.toLowerCase()}`}>
                {cs.pillar}
              </p>
              <h2 className="cs-row-title">{cs.title[lang]}</h2>
              <p className="cs-row-stat">{cs.metric[lang]}</p>
              <p className="cs-row-dek">{cs.hook[lang]}</p>
              <span className="cs-row-read">
                {t("cs.read")} <span className="cs-arrow">&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <section className="cs-close">
        <div className="cs-close-in">
          <h2>{t("cs.closeH2")}</h2>
          <a
            className="nav-pill nav-pill-primary"
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("cs.bookACall")}
          </a>
        </div>
      </section>
    </PortfolioLayout>
  )
}

export default CaseStudiesPage

const SITE_URL = "https://arelion.dev"

export const Head = ({ location }) => {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Case studies",
    itemListElement: CASE_STUDIES.slice()
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .map((cs, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/case-studies/${cs.slug}/`,
      name: cs.title.en,
    })),
  }
  return (
    <SEO
      title="Case studies"
      description="AI engineering case studies: RAG, document intelligence, LLM evaluation, OCR benchmarking, caching at scale, and AI security. Real client work, and what transfers to your team."
      pathname={location.pathname}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </SEO>
  )
}
