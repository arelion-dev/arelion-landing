import React, { useState, useMemo } from "react"
import { Link } from "gatsby"

import { useI18n } from "../i18n"
import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import CASE_STUDIES from "../data/case-studies"

// Only show tabs for pillars that actually have visible case studies
// (e.g. "Writing" stays hidden in prod until one of its studies is published).
const PILLARS = ["Build", "Automate", "Transform", "Audit", "Writing"].filter(p =>
  CASE_STUDIES.some(c => c.pillar === p),
)
const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"

const CaseStudiesPage = () => {
  const { t, lang } = useI18n()
  const [active, setActive] = useState(null)

  const shown = useMemo(
    () => (active ? CASE_STUDIES.filter(c => c.pillar === active) : CASE_STUDIES),
    [active],
  )

  return (
    <PortfolioLayout>
      <section className="cs-hero">
        <div className="cs-hero-in">
          <p className="cs-hero-kicker">{t("cs.kicker")}</p>
          <h1>{t("cs.h1")}</h1>
          <p className="cs-hero-dek">{t("cs.dek")}</p>
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

        <div className="cs-index-grid">
          {shown.map(cs => (
            <Link key={cs.slug} to={`/case-studies/${cs.slug}`} className="cs-row">
              <p className={`cs-row-kicker cs-p-${cs.pillar.toLowerCase()}`}>
                {cs.pillar}
              </p>
              <p className="cs-row-stat">{cs.metric[lang]}</p>
              <h2 className="cs-row-title">{cs.title[lang]}</h2>
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

export const Head = () => (
  <SEO
    title="Case studies — Arelion"
    description="Comment Arelion résout des problèmes concrets d'IA, d'architecture et de sécurité, et ce qui est réutilisable chez vous."
  />
)
