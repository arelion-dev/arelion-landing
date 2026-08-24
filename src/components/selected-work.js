import React, { useCallback, useEffect, useRef, useState } from "react"

import { useI18n } from "../i18n"
import REALISATIONS from "../data/realisations"
import CompanyIcon from "./company-icon"

const DESKTOP_PER_PAGE = 4
const MOBILE_QUERY = "(max-width: 760px)"
const AUTOPLAY_MS = 20000
const FADE_MS = 220

const tagSlug = t =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const isTodo = s => typeof s === "string" && s.startsWith("TODO")

// Client work.
// Desktop: a 2x2 page of four cards that cross-fades between pages, with arrow
// and dot navigation and 20s autoplay. No scrollbar.
// Mobile: a native horizontal swipe rail (CSS scroll-snap), one card at a time
// with the next card peeking so it reads as scrollable. No arrows or dots.
const SelectedWork = () => {
  const { t, lang } = useI18n()
  const [isMobile, setIsMobile] = useState(false)
  const [page, setPage] = useState(0)
  const [fading, setFading] = useState(false)
  const swap = useRef()

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  const perPage = isMobile ? 1 : DESKTOP_PER_PAGE
  const pageCount = Math.ceil(REALISATIONS.length / perPage)

  // Keep the current page valid when the layout switches card count.
  useEffect(() => {
    setPage(p => Math.min(p, pageCount - 1))
  }, [pageCount])

  const change = useCallback(
    dir => {
      if (pageCount <= 1) return
      setFading(true)
      clearTimeout(swap.current)
      swap.current = setTimeout(() => {
        setPage(p => (p + dir + pageCount) % pageCount)
        setFading(false)
      }, FADE_MS)
    },
    [pageCount],
  )

  // Auto-advance (desktop only; the mobile rail is user-driven). Re-armed on
  // every page change, so a manual move resets the 20s clock.
  useEffect(() => {
    if (isMobile || pageCount <= 1) return undefined
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined
    }
    const id = setInterval(() => change(1), AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [change, pageCount, page, isMobile])

  useEffect(() => () => clearTimeout(swap.current), [])

  const renderCard = r => (
    <article key={r.id} className="real-card">
      <div className="real-head-row">
        <div>
          <h3 className="real-client">
            <CompanyIcon name={r.client} />
            {r.client}
          </h3>
          <div className="real-role">{r.role[lang]}</div>
        </div>
        <div className="real-tags">
          {r.tags.map(tag => (
            <span key={tag} className={`real-tag real-tag--${tagSlug(tag)}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <ul className="real-out">
        {r.outcomes.map((o, i) => (
          <li key={i} className={isTodo(o[lang]) ? "todo" : ""}>
            {o[lang]}
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
  )

  const start = page * perPage
  const pageItems = REALISATIONS.slice(start, start + perPage)

  return (
    <section className="realisations">
      <div className="real-head">
        <div>
          <h2 className="real-title">{t("sw.title")}</h2>
          <p className="real-lede">{t("sw.lede")}</p>
        </div>
        {!isMobile && pageCount > 1 && (
          <div className="real-nav" aria-label="Client work navigation">
            <button
              type="button"
              className="real-arrow"
              aria-label="Previous"
              onClick={() => change(-1)}
            >
              &#8592;
            </button>
            <button
              type="button"
              className="real-arrow"
              aria-label="Next"
              onClick={() => change(1)}
            >
              &#8594;
            </button>
          </div>
        )}
      </div>

      {isMobile ? (
        <div className="real-rail">{REALISATIONS.map(renderCard)}</div>
      ) : (
        <div className={`real-grid ${fading ? "is-fading" : ""}`}>
          {pageItems.map(renderCard)}
        </div>
      )}

      {!isMobile && pageCount > 1 && (
        <div className="real-dots">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`real-dot ${i === page ? "is-on" : ""}`}
              aria-label={`Page ${i + 1} of ${pageCount}`}
              aria-current={i === page}
              onClick={() => setPage(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default SelectedWork
