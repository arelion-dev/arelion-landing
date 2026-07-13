import React from "react"
import { Link } from "gatsby"

import { useI18n } from "../i18n"

const pillarClass = pillar => `cs-p-${pillar.toLowerCase()}`

const CaseStudyCard = ({ cs, compact, titleAs: TitleTag = "h3" }) => {
  const { t, lang } = useI18n()

  return (
    <Link to={`/case-studies/${cs.slug}`} className="cs-card">
      <span className={`cs-pill-tag ${pillarClass(cs.pillar)}`}>{cs.pillar}</span>
      <div className="cs-metric">{cs.metric[lang]}</div>
      <TitleTag className="cs-card-title">{cs.title[lang]}</TitleTag>
      <p className="cs-card-hook">{cs.hook[lang]}</p>
      {!compact && cs.tags && (
        <div className="cs-tags">
          {cs.tags.map(tag => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}
      <span className="cs-read">{t("cs.cardRead")} &rarr;</span>
    </Link>
  )
}

export default CaseStudyCard
