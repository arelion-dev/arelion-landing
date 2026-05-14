import React, { useMemo, useState } from "react"

import REALISATIONS from "../data/realisations"

const tagSlug = t =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const isTodo = s => typeof s === "string" && s.startsWith("TODO")

const SelectedWork = () => {
  const [activeTag, setActiveTag] = useState(null)

  const tags = useMemo(
    () => Array.from(new Set(REALISATIONS.flatMap(r => r.tags))).sort(),
    [],
  )

  const filteredRealisations = activeTag
    ? REALISATIONS.filter(r => r.tags.includes(activeTag))
    : REALISATIONS

  return (
    <section className="realisations">
      <div className="real-head">
        <div>
          <h2 className="real-title">Selected work, 2014 — present.</h2>
          <p className="real-lede">
            A partial record. Some clients are confidential; some work predates
            anything worth listing here.
          </p>
        </div>
        <div className="real-filters" aria-label="Filter selected work by tag">
          <button
            type="button"
            className={`real-filter ${activeTag === null ? "is-active" : ""}`}
            aria-pressed={activeTag === null}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              type="button"
              className={`real-filter real-filter--${tagSlug(tag)} ${
                activeTag === tag ? "is-active" : ""
              }`}
              aria-pressed={activeTag === tag}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="real-grid">
        {filteredRealisations.map(r => (
          <article key={r.id} className="real-card">
            <div className="real-head-row">
              <div>
                <h3 className="real-client">{r.client}</h3>
                <div className="real-role">{r.role}</div>
              </div>
              <div className="real-tags">
                {r.tags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`real-tag real-tag--${tagSlug(tag)} ${
                      activeTag === tag ? "is-active" : ""
                    }`}
                    aria-pressed={activeTag === tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <ul className="real-out">
              {r.outcomes.map(o => (
                <li key={o} className={isTodo(o) ? "todo" : ""}>
                  {o}
                </li>
              ))}
            </ul>
            <div className="real-stack">
              {r.stack.map(s => (
                <span key={s} className={isTodo(s) ? "todo" : ""}>
                  {s}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default SelectedWork
