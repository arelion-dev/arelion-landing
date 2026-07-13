import React from "react"
import { Link } from "gatsby"

import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import CASE_STUDIES from "../data/case-studies"

const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"

const find = slug => CASE_STUDIES.find(c => c.slug === slug)

const CaseStudyTemplate = ({ pageContext }) => {
  const cs = find(pageContext.slug)
  if (!cs) return null

  return (
    <PortfolioLayout>
      <article className="cs-detail">
        <div className="cs-crumb">
          <Link to="/case-studies">Case studies</Link>
          <span> / {cs.pillar}</span>
        </div>

        <div className="cs-tags cs-detail-tags">
          {cs.tags.map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <h1 className="cs-detail-title">{cs.title}</h1>
        <div className="cs-detail-metric">{cs.metric}</div>
        <p className="cs-detail-hook">{cs.hook}</p>

        {cs.demo && (
          <div className="cs-demo">
            <div className="cs-demo-bar">chat-with-your-docs</div>
            <div className="cs-demo-io">
              <p className="cs-io-label">Question</p>
              <p className="cs-io-q">{cs.demo.q}</p>
              <p className="cs-io-label">Réponse</p>
              <p className="cs-io-a">{cs.demo.a}</p>
              {cs.demo.sources && (
                <>
                  <p className="cs-io-label">Sources</p>
                  {cs.demo.sources.map(s => (
                    <span key={s} className="cs-src">
                      {s}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {cs.body.map(sec => (
          <section key={sec.h} className="cs-section">
            <h2>{sec.h}</h2>
            <p>{sec.p}</p>
          </section>
        ))}

        {cs.stack && (
          <div className="cs-stack">
            {cs.stack.map(s => (
              <span key={s}>{s}</span>
            ))}
          </div>
        )}

        <div className="cs-cta">
          <p>Vous avez ce problème ? On regarde le vôtre, en écrit.</p>
          <a
            className="nav-pill nav-pill-primary"
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a call
          </a>
        </div>
      </article>
    </PortfolioLayout>
  )
}

export default CaseStudyTemplate

export const Head = ({ pageContext }) => {
  const cs = find(pageContext.slug)
  return (
    <SEO
      title={`${cs ? cs.title : "Case study"} — Arelion`}
      description={cs ? cs.hook : ""}
    />
  )
}
