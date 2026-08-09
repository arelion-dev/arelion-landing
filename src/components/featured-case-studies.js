import React from "react"
import { Link } from "gatsby"

import { useI18n } from "../i18n"
import CASE_STUDIES from "../data/case-studies"

const pillarClass = pillar => `cs-p-${pillar.toLowerCase()}`

const FeaturedCaseStudies = () => {
  const { t, lang } = useI18n()
  // Nothing published yet: no empty band on the home page.
  if (CASE_STUDIES.length === 0) return null
  // Show the strongest few (featured), then link to the rest.
  const featured = CASE_STUDIES.filter(cs => cs.featured)
  const items = (featured.length ? featured : CASE_STUDIES).slice(0, 4)

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

      <div className="cs-featured-grid">
        {items.map(cs => (
          <Link
            key={cs.slug}
            to={`/case-studies/${cs.slug}`}
            className="cs-row"
          >
            <p className={`cs-row-kicker ${pillarClass(cs.pillar)}`}>
              {cs.pillar}
            </p>
            <h3 className="cs-row-title">{cs.title[lang]}</h3>
            <p className="cs-row-stat">{cs.metric[lang]}</p>
            <p className="cs-row-dek">{cs.hook[lang]}</p>
            <span className="cs-row-read">
              {t("cs.read")} <span className="cs-arrow">&rarr;</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="cs-featured-more">
        <Link to="/case-studies" className="nav-pill nav-pill-primary">
          {t("cs.seeAll")} &rarr;
        </Link>
      </div>
    </section>
  )
}

export default FeaturedCaseStudies
