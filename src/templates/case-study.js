import React from "react"
import { Link } from "gatsby"

import { useI18n } from "../i18n"
import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import CASE_STUDIES from "../data/case-studies"

const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"

const find = slug => CASE_STUDIES.find(c => c.slug === slug)

const CaseStudyTemplate = ({ pageContext }) => {
  const { t, lang } = useI18n()
  const cs = find(pageContext.slug)
  if (!cs) return null

  return (
    <PortfolioLayout>
      <article className="cs-detail">
        <div className="cs-crumb">
          <Link to="/case-studies">{t("cs.crumb")}</Link>
          <span> / {cs.pillar}</span>
        </div>

        <div className="cs-tags cs-detail-tags">
          {cs.tags.map(tag => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <h1 className="cs-detail-title">{cs.title[lang]}</h1>
        <div className="cs-detail-metric">{cs.metric[lang]}</div>
        <p className="cs-detail-hook">{cs.hook[lang]}</p>

        {cs.demo && (
          <div className="cs-demo">
            <div className="cs-demo-bar">chat-with-your-docs</div>
            <div className="cs-demo-io">
              <p className="cs-io-label">{t("csDetail.demoQuestion")}</p>
              <p className="cs-io-q">{cs.demo.q[lang]}</p>
              <p className="cs-io-label">{t("csDetail.demoAnswer")}</p>
              <p className="cs-io-a">{cs.demo.a[lang]}</p>
              {cs.demo.sources && (
                <>
                  <p className="cs-io-label">{t("csDetail.demoSources")}</p>
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
          <section key={sec.h[lang]} className="cs-section">
            <h2>{sec.h[lang]}</h2>
            <p>{sec.p[lang]}</p>
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
          <p>{t("csDetail.ctaLine")}</p>
          <a
            className="nav-pill nav-pill-primary"
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("csDetail.bookACall")}
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
      title={`${cs ? cs.title.en : "Case study"} — Arelion`}
      description={cs ? cs.hook.en : ""}
    />
  )
}
