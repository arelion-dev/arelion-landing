import React from "react"
import { Link } from "gatsby"

import CASE_STUDIES from "../data/case-studies"
import CaseStudyCard from "./case-study-card"

const FeaturedCaseStudies = () => {
  const featured = CASE_STUDIES.filter(c => c.featured).slice(0, 3)

  return (
    <section className="cs-home-band">
      <div className="cs-home-head">
        <h2>Case studies</h2>
        <p>Comment je résous des problèmes concrets, et ce que je peux refaire chez vous.</p>
      </div>
      <div className="cs-feat-row">
        {featured.map(cs => (
          <CaseStudyCard key={cs.slug} cs={cs} compact />
        ))}
      </div>
      <Link to="/case-studies" className="cs-see-all">
        Voir tous les case studies &rarr;
      </Link>
    </section>
  )
}

export default FeaturedCaseStudies
