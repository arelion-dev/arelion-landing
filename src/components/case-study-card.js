import React from "react"
import { Link } from "gatsby"

const pillarClass = pillar => `cs-p-${pillar.toLowerCase()}`

const CaseStudyCard = ({ cs, compact }) => (
  <Link to={`/case-studies/${cs.slug}`} className="cs-card">
    <span className={`cs-pill-tag ${pillarClass(cs.pillar)}`}>{cs.pillar}</span>
    <div className="cs-metric">{cs.metric}</div>
    <h3 className="cs-card-title">{cs.title}</h3>
    <p className="cs-card-hook">{cs.hook}</p>
    {!compact && cs.tags && (
      <div className="cs-tags">
        {cs.tags.map(t => (
          <span key={t}>{t}</span>
        ))}
      </div>
    )}
    <span className="cs-read">Lire &rarr;</span>
  </Link>
)

export default CaseStudyCard
