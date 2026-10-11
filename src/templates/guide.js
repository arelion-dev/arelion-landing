import React from "react"
import { Link, graphql } from "gatsby"

import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import LegalDisclaimer from "../components/legal-disclaimer"
import OcrPicker from "../components/ocr-picker"
import AutomateFirst from "../components/automate-first"
import Reg10Check from "../components/reg10-check"
import ArticleBody from "../components/article-body"
import ContactLinks, { whatsappFor } from "../components/contact-links"
import CASE_STUDIES from "../data/case-studies"
import { offersOf, offerClass, headlineOf } from "../data/offers"
import { ANCHOR as OCR_PICKER } from "../tools/ocr-picker"
import { ANCHOR as AUTOMATE_FIRST } from "../tools/automate-first"
import { ANCHOR as REG10_CHECK } from "../tools/reg10-check"

// Guides answer a buyer's question and point to the case studies that prove
// the answer. One markdown file in content/guides = one page, English only.

// Decision tools a guide can show under its lead, picked by its `tool` frontmatter field.
const TOOLS = { [OCR_PICKER]: OcrPicker, [AUTOMATE_FIRST]: AutomateFirst, [REG10_CHECK]: Reg10Check }

// "2026-10-07" -> "October 7, 2026". In UTC, so the build and every browser print the same day.
const formatDate = day =>
  new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(
    new Date(day),
  )

const GuideTemplate = ({ data }) => {
  const { html, frontmatter } = data.markdownRemark
  const { title, description, kicker, faq, related, legalDisclaimer, legalJurisdiction, offer, ctaLine } = frontmatter
  // `updated` is optional: a guide never revised shows its publication date.
  const modified = frontmatter.updated || frontmatter.date
  const proofs = (related || []).map(slug => CASE_STUDIES.find(c => c.slug === slug)).filter(Boolean)
  const whatsapp = data.site.siteMetadata.social?.whatsapp
  const Tool = frontmatter.tool && TOOLS[frontmatter.tool]
  // A misspelt tool name fails the build instead of shipping a guide without its tool.
  if (frontmatter.tool && !Tool) throw new Error(`${title}: unknown tool "${frontmatter.tool}"`)
  const whatsappHref = whatsapp && whatsappFor(whatsapp, title)

  return (
    <PortfolioLayout>
      <article className="cs-detail">
        <div className="cs-crumb">
          <Link to="/guides/">Guides</Link>
          <span> / {kicker || "Guide"}</span>
        </div>

        <h1 className="cs-detail-title">{title}</h1>
        {description && <div className="cs-detail-metric">{description}</div>}
        <p className="cs-detail-date">
          By <Link to="/about/">Antonin Ribeaud</Link>
          {modified && (
            <>
              {` · ${frontmatter.updated ? "Updated" : "Published"} `}
              <time dateTime={modified}>{formatDate(modified)}</time>
            </>
          )}
        </p>

        {Tool && <Tool whatsappHref={whatsappHref} />}

        <ArticleBody html={html} offer={offer} whatsappHref={whatsappHref} location="guide_offer" />

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
        {legalDisclaimer !== false && <LegalDisclaimer jurisdiction={legalJurisdiction || undefined} />}

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
          {/* A guide's own line (ctaLine) says what to send me; the others share this one. */}
          <p>{ctaLine || "Got this problem? I'll look at yours, in writing."}</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <ContactLinks whatsappHref={whatsappHref} location="guide" />
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
  const modified = frontmatter.updated || frontmatter.date
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `${siteUrl}/og-cover.png`,
    // Same @id as the Person and the organization on the home page, so every guide resolves to them.
    author: { "@type": "Person", "@id": "https://arelion.dev/#antonin", name: "Antonin Ribeaud", url: siteUrl },
    publisher: { "@type": "Organization", "@id": "https://arelion.dev/#organization", name: "Arelion", url: siteUrl },
    ...(frontmatter.date ? { datePublished: frontmatter.date } : {}),
    ...(modified ? { dateModified: modified } : {}),
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
        legalJurisdiction
        tool
        offer {
          title
          text
        }
        ctaLine
        date(formatString: "YYYY-MM-DD")
        updated(formatString: "YYYY-MM-DD")
        faq {
          q
          a
        }
      }
    }
  }
`
