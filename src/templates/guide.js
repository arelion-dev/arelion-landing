import React from "react"
import { Link, graphql } from "gatsby"

import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import LegalDisclaimer from "../components/legal-disclaimer"
import CASE_STUDIES from "../data/case-studies"
import { offersOf, offerClass, headlineOf } from "../data/offers"

// Guides answer a buyer's question and point to the case studies that prove
// the answer. One markdown file in content/guides = one page, English only.

const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"

// WhatsApp link that names the page, so a lead says which guide brought it.
const whatsappFor = (base, title) =>
  `${String(base).split("?")[0]}?text=${encodeURIComponent(`Hi Antonin, I read "${title}" on arelion.dev`)}`

const GuideTemplate = ({ data }) => {
  const { html, frontmatter } = data.markdownRemark
  const { title, description, kicker, faq, related, legalDisclaimer } = frontmatter
  const proofs = (related || []).map(slug => CASE_STUDIES.find(c => c.slug === slug)).filter(Boolean)
  const whatsapp = data.site.siteMetadata.social?.whatsapp

  return (
    <PortfolioLayout>
      <article className="cs-detail">
        <div className="cs-crumb">
          <Link to="/guides/">Guides</Link>
          <span> / {kicker || "Guide"}</span>
        </div>

        <h1 className="cs-detail-title">{title}</h1>
        {description && <div className="cs-detail-metric">{description}</div>}

        <section className="cs-section cs-article" dangerouslySetInnerHTML={{ __html: html }} />

        {faq && faq.length > 0 && (
          <section className="cs-faq">
            <h2>Questions I get about this</h2>
            {faq.map(f => (
              <div key={f.q} className="cs-faq-item">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>
        )}

        {/* On by default; a guide that does not talk about the law sets legalDisclaimer: false. */}
        {legalDisclaimer !== false && <LegalDisclaimer />}

        {proofs.length > 0 && (
          <section className="cs-related">
            <h2>Proof: what I built</h2>
            <div className="cs-related-grid">
              {proofs.map(r => (
                <Link key={r.slug} to={`/case-studies/${r.slug}`} className="cs-related-card">
                  <span className={`cs-row-kicker ${offerClass(r)}`}>{offersOf(r)[0]}</span>
                  <span className="cs-related-title">{headlineOf(r)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="cs-cta">
          <p>Got this problem? I'll look at yours, in writing.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            {whatsapp && (
              <a className="nav-pill nav-pill-whatsapp" href={whatsappFor(whatsapp, title)} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            )}
            <a className="nav-pill nav-pill-primary" href={CALENDAR_URL} target="_blank" rel="noopener noreferrer">
              Book a call
            </a>
          </div>
        </div>
      </article>
    </PortfolioLayout>
  )
}

export default GuideTemplate

export const Head = ({ data }) => {
  const { frontmatter, fields } = data.markdownRemark
  const siteUrl = data.site.siteMetadata.siteUrl
  const url = `${siteUrl}${fields.slug}`
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `${siteUrl}/og-cover.png`,
    author: { "@type": "Person", "@id": "https://arelion.dev/#antonin", name: "Antonin Ribeaud", url: siteUrl },
    publisher: { "@type": "Organization", name: "Arelion", url: siteUrl },
    ...(frontmatter.date ? { datePublished: frontmatter.date } : {}),
  }
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Guides", item: `${siteUrl}/guides/` },
      { "@type": "ListItem", position: 2, name: frontmatter.title, item: url },
    ],
  }
  const faq =
    frontmatter.faq && frontmatter.faq.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: frontmatter.faq.map(f => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null
  return (
    <SEO title={frontmatter.title} description={frontmatter.description} pathname={fields.slug}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([article, breadcrumb, faq].filter(Boolean)) }}
      />
    </SEO>
  )
}

export const pageQuery = graphql`
  query Guide($id: String!) {
    site {
      siteMetadata {
        siteUrl
        social {
          whatsapp
        }
      }
    }
    markdownRemark(id: { eq: $id }) {
      html
      fields {
        slug
      }
      frontmatter {
        title
        description
        kicker
        related
        legalDisclaimer
        date(formatString: "YYYY-MM-DD")
        faq {
          q
          a
        }
      }
    }
  }
`
