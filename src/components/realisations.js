import React from "react"
import REALISATIONS from "../data/realisations"

const STATUS_LABELS = {
  en: {
    shipped: "Shipped",
    ongoing: "Ongoing",
    sold: "Sold",
    acquired: "Acquired",
  },
  fr: {
    shipped: "Livré",
    ongoing: "En cours",
    sold: "Vendu",
    acquired: "Racheté",
  },
}

const Realisations = ({ lang, heading }) => {
  const statusLabels = STATUS_LABELS[lang]

  return (
    <section className="realisations-section">
      <h2 className="realisations-heading">{heading}</h2>
      <div className="realisations-grid">
        {REALISATIONS.map(item => {
          const localized = item[lang]
          return (
            <article
              key={item.id}
              className="realisation-card"
              style={{ backgroundColor: item.color }}
            >
              <header className="realisation-card-header">
                <h3 className="realisation-card-client">{item.client}</h3>
                <span className={`realisation-card-status realisation-card-status--${item.status}`}>
                  {statusLabels[item.status]}
                </span>
              </header>
              <p className="realisation-card-meta">
                {localized.role} · {item.period}
              </p>
              <ul className="realisation-card-outcomes">
                {localized.outcomes.map((outcome, i) => (
                  <li key={i}>{outcome}</li>
                ))}
              </ul>
              <div className="realisation-card-stack">
                {item.stack.map(tech => (
                  <span key={tech} className="realisation-card-tag">
                    {tech}
                  </span>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default Realisations
