import React from "react"
import { Link } from "gatsby"

import { useI18n } from "../i18n"
import CASE_STUDIES from "../data/case-studies"

const pillarClass = pillar => `cs-p-${pillar.toLowerCase()}`

const FeaturedCaseStudies = () => {
  const { t, lang } = useI18n()
  // Doubled for a seamless marquee loop (track translates by -50%).
  const items = [...CASE_STUDIES, ...CASE_STUDIES]

  return (
    <section className="cs-carousel-section">
      <div className="cs-carousel-head">
        <div className="cs-carousel-head-text">
          <h2>{t("cs.homeTitle")}</h2>
          <p>{t("cs.homeSub")}</p>
        </div>
        <Link to="/case-studies" className="nav-pill cs-carousel-seeall">
          {t("cs.seeAll")} &rarr;
        </Link>
      </div>

      <div className="cs-carousel">
        <div className="cs-carousel-track">
          {items.map((cs, i) => {
            const clone = i >= CASE_STUDIES.length
            return (
              <Link
                key={`${cs.slug}-${i}`}
                to={`/case-studies/${cs.slug}`}
                className="cs-cara-card"
                tabIndex={clone ? -1 : undefined}
                aria-hidden={clone ? "true" : undefined}
              >
                <span className={`cs-pill-tag ${pillarClass(cs.pillar)}`}>
                  {cs.pillar}
                </span>
                <div className="cs-cara-metric">{cs.metric[lang]}</div>
                <h3 className="cs-cara-title">{cs.title[lang]}</h3>
                <span className="cs-cara-read">
                  {t("cs.cardRead")} &rarr;
                </span>
              </Link>
            )
          })}
        </div>
      </div>

    </section>
  )
}

export default FeaturedCaseStudies
