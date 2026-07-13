import React, { useState, useMemo } from "react"

import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import CaseStudyCard from "../components/case-study-card"
import CASE_STUDIES from "../data/case-studies"

const PILLARS = ["Build", "Automate", "Audit"]

const CaseStudiesPage = () => {
  const [active, setActive] = useState(null)

  const shown = useMemo(
    () => (active ? CASE_STUDIES.filter(c => c.pillar === active) : CASE_STUDIES),
    [active],
  )

  return (
    <PortfolioLayout>
      <section className="cs-index-head">
        <h1>Case studies</h1>
        <p className="cs-lede">
          Des problèmes réels, l'architecture derrière, et le résultat. Filtrables par type de mission.
        </p>
        <div className="cs-filters">
          <button
            type="button"
            className={`cs-chip ${active === null ? "on" : ""}`}
            onClick={() => setActive(null)}
          >
            Tous
          </button>
          {PILLARS.map(p => (
            <button
              key={p}
              type="button"
              className={`cs-chip ${active === p ? "on" : ""}`}
              onClick={() => setActive(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <section className="cs-grid">
        {shown.map(cs => (
          <CaseStudyCard key={cs.slug} cs={cs} />
        ))}
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
