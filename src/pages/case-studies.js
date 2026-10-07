import React, { useState, useMemo } from "react"
import { Link } from "gatsby"

import { useI18n } from "../i18n"
import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import CASE_STUDIES from "../data/case-studies"
import { OFFERS, offersOf, offerClass, headlineOf } from "../data/offers"
import { trackLead, LEAD_METHOD } from "../hooks/use-track-event"

// One tab per offer that has a visible study. A study can sit under several
// offers (`offers`, main one first).
const TABS = OFFERS.map(o => o.name).filter(name => CASE_STUDIES.some(c => offersOf(c).includes(name)))
const offerRank = cs => {
  const i = OFFERS.findIndex(o => o.name === offersOf(cs)[0])
  return i < 0 ? OFFERS.length : i
}
const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"

// Dev-only publish-state overlay. Never rendered in a production build, so it is
// local-only by construction: it lets me see which studies are live for everyone
// vs draft (visible only on this local dev server).
const IS_DEV = process.env.NODE_ENV === "development"

const CaseStudiesPage = () => {
  const { t } = useI18n()
  // FR temporarily disabled for case studies: card content stays English.
  const lang = "en"
  const [active, setActive] = useState(null)

  const shown = useMemo(
    () =>
      (active ? CASE_STUDIES.filter(c => offersOf(c).includes(active)) : CASE_STUDIES)
        .slice()
        // In the order of the offers, then most recent first.
        .sort((a, b) => offerRank(a) - offerRank(b) || (b.date || "").localeCompare(a.date || "")),
    [active],
  )
  // Client work first, my own projects (lab) apart below.
  const groups = [
    { key: "client", title: t("cs.clientTitle"), items: shown.filter(c => !c.lab) },
    { key: "lab", title: t("cs.labTitle"), lede: t("cs.labLede"), items: shown.filter(c => c.lab) },
  ].filter(g => g.items.length > 0)

  return (
    <PortfolioLayout>
      <section className="cs-hero">
        <div className="cs-hero-in">
          <p className="cs-hero-kicker">{t("cs.kicker")}</p>
          <h1>{t("cs.h1")}</h1>
          <p className="cs-hero-dek">{t("cs.dek")}</p>
          <p className="cs-hero-intro">
            Client work, sorted by what it does for the business: repetitive
            work taken off a team, answers found in seconds instead of hours,
            large document collections searched with a source on every answer.
            Each case has a short business version and the full technical
            write-up. My own projects sit apart, under Lab.
          </p>
        </div>
      </section>

      <div className="cs-index-wrap">
        <div className="cs-tabs">
          <button
            type="button"
            className={active === null ? "on" : ""}
            onClick={() => setActive(null)}
          >
            {t("cs.tabsAll")}
          </button>
          {TABS.map(p => (
            <button
              key={p}
              type="button"
              className={active === p ? "on" : ""}
              onClick={() => setActive(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {IS_DEV && (
          <p className="cs-devbar">
            Local view.{" "}
            <span className="cs-flag cs-flag-pub">
              {CASE_STUDIES.filter(c => c.published).length} published
            </span>{" "}
            <span className="cs-flag cs-flag-draft">
              {CASE_STUDIES.filter(c => !c.published).length} local only
            </span>{" "}
            The draft ones are hidden in the production build.
          </p>
        )}

        {groups.map(g => (
          <section key={g.key} className="cs-index-group" style={{ marginTop: g.key === "lab" ? "56px" : "28px" }}>
            <h2 style={{ margin: "0 0 4px" }}>{g.title}</h2>
            {g.lede && <p style={{ margin: "0 0 16px", color: "var(--color-text-light)" }}>{g.lede}</p>}
            <div className="cs-index-grid">
              {g.items.map(cs => (
                <Link
                  key={cs.slug}
                  to={`/case-studies/${cs.slug}`}
                  className={`cs-row${IS_DEV && !cs.published ? " cs-row-draft" : ""}`}
                >
                  {IS_DEV && (
                    <span
                      className={`cs-flag ${cs.published ? "cs-flag-pub" : "cs-flag-draft"}`}
                    >
                      {cs.published ? "PUBLISHED" : "DRAFT · local only"}
                    </span>
                  )}
                  <p className={`cs-row-kicker ${offerClass(cs)}`}>
                    {offersOf(cs).join(" · ")}
                  </p>
                  <h3 className="cs-row-title">{headlineOf(cs, lang)}</h3>
                  {cs.outcome && (
                    <p style={{ margin: "0 0 8px", fontSize: "0.85em", color: "var(--color-text-light)" }}>
                      {cs.title[lang]}
                    </p>
                  )}
                  {/* Client cards already lead with the result; the metric line would repeat it. */}
                  {!cs.outcome && <p className="cs-row-stat">{cs.metric[lang]}</p>}
                  <p className="cs-row-dek">{cs.hook[lang]}</p>
                  <span className="cs-row-read">
                    {t("cs.read")} <span className="cs-arrow">&rarr;</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="cs-close">
        <div className="cs-close-in">
          <h2>{t("cs.closeH2")}</h2>
          <a
            className="nav-pill nav-pill-primary"
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackLead(LEAD_METHOD.booking, "case_studies_index")}
          >
            {t("cs.bookACall")}
          </a>
        </div>
      </section>
    </PortfolioLayout>
  )
}

export default CaseStudiesPage

const SITE_URL = "https://arelion.dev"

export const Head = ({ location }) => {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Case studies",
    itemListElement: CASE_STUDIES.slice()
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .map((cs, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/case-studies/${cs.slug}/`,
      name: cs.title.en,
    })),
  }
  return (
    <SEO
      title="Case studies"
      description="Client work by an AI consultant in Dubai: AI automation, company brains, document AI and legal AI. What changed for each business, and how I built it."
      pathname={location.pathname}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </SEO>
  )
}
