import React, { useState, useEffect } from "react"
import { Link, graphql } from "gatsby"

import { useI18n } from "../i18n"
import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import CASE_STUDIES from "../data/case-studies"

const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"

// Tech/Business audience toggle: default to business (the broadest audience),
// remembered site-wide like the language choice.
const AUDIENCE_KEY = "arelion-cs-audience"
const DEFAULT_AUDIENCE = "business"

const find = slug => CASE_STUDIES.find(c => c.slug === slug)

// Body paragraphs support two light markdown features: **bold** spans and
// chunks made only of "- " lines, rendered as a bullet list.
const renderInline = text =>
  text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))

const renderChunk = (chunk, i) => {
  const lines = chunk.split("\n")
  if (lines.length > 1 && lines.every(l => l.startsWith("- "))) {
    return (
      <ul key={i}>
        {lines.map((l, j) => (
          <li key={j}>{renderInline(l.slice(2))}</li>
        ))}
      </ul>
    )
  }
  return <p key={i}>{renderInline(chunk)}</p>
}

const CaseStudyTemplate = ({ pageContext, data }) => {
  const { t, lang } = useI18n()
  const cs = find(pageContext.slug)

  // Lightbox for article images (with their caption) and code blocks.
  const [lightbox, setLightbox] = useState(null)

  // Audience toggle. SSR-safe: start at the default, hydrate from storage.
  const [audience, setAudienceState] = useState(DEFAULT_AUDIENCE)
  useEffect(() => {
    const saved =
      typeof window !== "undefined" && window.localStorage.getItem(AUDIENCE_KEY)
    if (saved === "tech" || saved === "business") setAudienceState(saved)
  }, [])
  const setAudience = next => {
    setAudienceState(next)
    if (typeof window !== "undefined")
      window.localStorage.setItem(AUDIENCE_KEY, next)
  }

  useEffect(() => {
    if (!lightbox) return undefined
    const onKey = e => e.key === "Escape" && setLightbox(null)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox])

  const onArticleClick = e => {
    const imgLink = e.target.closest("a.gatsby-resp-image-link")
    if (imgLink) {
      e.preventDefault()
      const img = imgLink.querySelector("img")
      const para = imgLink.closest("p")
      const em = para && para.querySelector("em")
      setLightbox({
        type: "img",
        src: imgLink.href,
        caption: (em && em.textContent) || (img && img.alt) || "",
      })
      return
    }
    const pre = e.target.closest("pre")
    if (pre) setLightbox({ type: "code", html: pre.outerHTML })
  }
  // FR article bodies are temporarily disabled: always serve English, even in
  // FR mode. The .fr.MD files stay on disk. Re-enable by restoring:
  //   const pick = (fr, en) => (lang === "fr" ? fr || en : en)
  const pick = (fr, en) => en
  const techArticle = data && pick(data.techFr, data.techEn)
  const businessArticle = data && pick(data.businessFr, data.businessEn)
  const hasBoth = Boolean(techArticle && businessArticle)
  // Show the picked audience when both exist; otherwise whichever one is there.
  const shownArticle = hasBoth
    ? audience === "tech"
      ? techArticle
      : businessArticle
    : techArticle || businessArticle
  const articleHtml = shownArticle && shownArticle.html
  const articleDate = shownArticle && shownArticle.frontmatter.date
  if (!cs) return null

  const formattedDate = articleDate
    ? new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(articleDate))
    : null

  return (
    <PortfolioLayout>
      <article className="cs-detail">
        <div className="cs-crumb">
          <Link to="/case-studies">{t("cs.crumb")}</Link>
          <span> / {cs.pillar}</span>
        </div>

        <div className="cs-tags cs-detail-tags">
          {cs.tags.map(tag => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <h1 className="cs-detail-title">{cs.title[lang]}</h1>
        <div className="cs-detail-metric">{cs.metric[lang]}</div>
        {formattedDate && <p className="cs-detail-date">{formattedDate}</p>}

        {cs.tldr && (
          <div className="cs-tldr">
            <span className="cs-tldr-label">TL;DR</span>
            <p>{cs.tldr[lang]}</p>
          </div>
        )}

        {hasBoth && (
          <div className="cs-audience-wrap">
            <div className="cs-audience-row">
              <span className="cs-audience-label">
                {t("csDetail.audienceLabel")}
              </span>
              <div
                className="cs-audience"
                role="group"
                aria-label={t("csDetail.audienceLabel")}
              >
                <button
                  type="button"
                  className={audience === "business" ? "on" : ""}
                  aria-pressed={audience === "business"}
                  onClick={() => setAudience("business")}
                >
                  <svg className="cs-audience-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {t("csDetail.audienceBusiness")}
                </button>
                <button
                  type="button"
                  className={audience === "tech" ? "on" : ""}
                  aria-pressed={audience === "tech"}
                  onClick={() => setAudience("tech")}
                >
                  <svg className="cs-audience-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 18l-6-6 6-6" />
                    <path d="M16 6l6 6-6 6" />
                  </svg>
                  {t("csDetail.audienceTech")}
                </button>
              </div>
            </div>
            <p className="cs-audience-hint">
              {audience === "business"
                ? t("csDetail.audienceHintBusiness")
                : t("csDetail.audienceHintTech")}
            </p>
          </div>
        )}

        {cs.demo && (
          <div className="cs-demo">
            <div className="cs-demo-bar">chat-with-your-docs</div>
            <div className="cs-demo-io">
              <p className="cs-io-label">{t("csDetail.demoQuestion")}</p>
              <p className="cs-io-q">{cs.demo.q[lang]}</p>
              <p className="cs-io-label">{t("csDetail.demoAnswer")}</p>
              <p className="cs-io-a">{cs.demo.a[lang]}</p>
              {cs.demo.sources && (
                <>
                  <p className="cs-io-label">{t("csDetail.demoSources")}</p>
                  {cs.demo.sources.map(s => (
                    <span key={s} className="cs-src">
                      {s}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {hasBoth ? (
          // Both bodies are in the HTML so crawlers see each; the inactive one
          // is hidden with CSS. The toggle flips which is visible.
          <>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
            <section
              className={`cs-section cs-article${audience === "business" ? "" : " cs-hidden"}`}
              onClick={onArticleClick}
              dangerouslySetInnerHTML={{ __html: businessArticle.html }}
            />
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
            <section
              className={`cs-section cs-article${audience === "tech" ? "" : " cs-hidden"}`}
              onClick={onArticleClick}
              dangerouslySetInnerHTML={{ __html: techArticle.html }}
            />
          </>
        ) : articleHtml ? (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
          <section
            className="cs-section cs-article"
            onClick={onArticleClick}
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />
        ) : (
          cs.body.map(sec => (
            <section key={sec.h[lang]} className="cs-section">
              <h2>{sec.h[lang]}</h2>
              {sec.p[lang].split("\n\n").map(renderChunk)}
            </section>
          ))
        )}

        {lightbox && (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
          <div className="cs-lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
            {lightbox.type === "img" ? (
              <>
                <img src={lightbox.src} alt={lightbox.caption} />
                {lightbox.caption && (
                  <p className="cs-lightbox-caption">{lightbox.caption}</p>
                )}
              </>
            ) : (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
              <div
                className="cs-article cs-lightbox-code"
                onClick={e => e.stopPropagation()}
                dangerouslySetInnerHTML={{ __html: lightbox.html }}
              />
            )}
          </div>
        )}

        <div className="cs-cta">
          <p>{t("csDetail.ctaLine")}</p>
          <a
            className="nav-pill nav-pill-primary"
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("csDetail.bookACall")}
          </a>
        </div>
      </article>
    </PortfolioLayout>
  )
}

export default CaseStudyTemplate

// Case studies can carry up to two markdown bodies: a technical deep-dive
// (cs.article) and a business/decision-maker version (cs.articleBusiness).
// A study may have one, both, or neither; missing slugs resolve to null.
export const pageQuery = graphql`
  query CaseStudyArticle($articleSlug: String, $articleBusinessSlug: String) {
    site {
      siteMetadata {
        siteUrl
      }
    }
    techEn: markdownRemark(
      fields: { slug: { eq: $articleSlug }, lang: { eq: "en" } }
    ) {
      html
      frontmatter {
        date
      }
    }
    techFr: markdownRemark(
      fields: { slug: { eq: $articleSlug }, lang: { eq: "fr" } }
    ) {
      html
      frontmatter {
        date
      }
    }
    businessEn: markdownRemark(
      fields: { slug: { eq: $articleBusinessSlug }, lang: { eq: "en" } }
    ) {
      html
      frontmatter {
        date
      }
    }
    businessFr: markdownRemark(
      fields: { slug: { eq: $articleBusinessSlug }, lang: { eq: "fr" } }
    ) {
      html
      frontmatter {
        date
      }
    }
  }
`

export const Head = ({ pageContext, data, location }) => {
  const cs = find(pageContext.slug)
  const siteUrl = (data && data.site && data.site.siteMetadata.siteUrl) || ""
  const path = location ? location.pathname : `/case-studies/${pageContext.slug}/`
  const url = `${siteUrl}${path.endsWith("/") ? path : `${path}/`}`
  const datePublished =
    (data && ((data.techEn && data.techEn.frontmatter.date) ||
      (data.businessEn && data.businessEn.frontmatter.date))) || undefined

  const blogPosting = cs && {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: cs.title.en,
    description: cs.hook.en,
    image: `${siteUrl}/og-cover.png`,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Person", name: "Antonin Ribeaud", url: siteUrl },
    publisher: { "@type": "Organization", name: "Arelion", url: siteUrl },
    ...(datePublished ? { datePublished } : {}),
    ...(cs.tags && cs.tags.length ? { keywords: cs.tags } : {}),
  }
  const breadcrumb = cs && {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Case studies", item: `${siteUrl}/case-studies/` },
      { "@type": "ListItem", position: 2, name: cs.title.en, item: url },
    ],
  }

  return (
    <SEO
      title={cs ? cs.title.en : "Case study"}
      description={cs ? cs.hook.en : ""}
      pathname={path}
    >
      {cs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([blogPosting, breadcrumb]) }}
        />
      )}
    </SEO>
  )
}
