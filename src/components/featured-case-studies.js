import React from "react"
import { Link } from "gatsby"

import { useI18n } from "../i18n"
import CASE_STUDIES from "../data/case-studies"
import CaseStudyCard from "./case-study-card"

const FeaturedCaseStudies = () => {
  const { t } = useI18n()
  const featured = CASE_STUDIES.filter(c => c.featured).slice(0, 3)

  return (
    <section className="cs-home-band">
      <div className="cs-home-head">
        <h2>{t("cs.homeTitle")}</h2>
        <p>{t("cs.homeSub")}</p>
      </div>
      <div className="cs-feat-row">
        {featured.map(cs => (
          <CaseStudyCard key={cs.slug} cs={cs} compact />
        ))}
      </div>
      <Link to="/case-studies" className="cs-see-all">
        {t("cs.seeAll")} &rarr;
      </Link>
    </section>
  )
}

export default FeaturedCaseStudies
