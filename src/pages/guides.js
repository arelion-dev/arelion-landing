import React from "react"
import { Link, graphql } from "gatsby"

import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"

// Index of content/guides. Guides are English only, like their pages.

const GuidesPage = ({ data }) => {
  const guides = data.allMarkdownRemark.nodes

  return (
    <PortfolioLayout>
      <section className="cs-hero">
        <div className="cs-hero-in">
          <p className="cs-hero-kicker">Guides</p>
          <h1>Answers to the questions I get before a project.</h1>
          <p className="cs-hero-dek">
            Each guide answers one question that companies in the UAE ask me
            about AI, and links to the case studies behind the answer.
          </p>
        </div>
      </section>

      <div className="cs-index-wrap">
        <div className="cs-index-grid">
          {guides.map(g => (
            <Link key={g.id} to={g.fields.slug} className="cs-row">
              <p className="cs-row-kicker cs-p-build">{g.frontmatter.kicker || "Guide"}</p>
              <h2 className="cs-row-title">{g.frontmatter.title}</h2>
              <p className="cs-row-dek" style={{ marginTop: "var(--spacing-3)" }}>
                {g.frontmatter.description}
              </p>
              <span className="cs-row-read">
                Read the guide <span className="cs-arrow">&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </PortfolioLayout>
  )
}

export default GuidesPage

export const Head = ({ data, location }) => {
  const siteUrl = data.site.siteMetadata.siteUrl
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guides",
    itemListElement: data.allMarkdownRemark.nodes.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}${g.fields.slug}`,
      name: g.frontmatter.title,
    })),
  }
  return (
    <SEO
      title="Guides"
      description="Plain answers to the questions companies in the UAE ask me before an AI project, with links to the case studies behind each answer."
      pathname={location.pathname}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </SEO>
  )
}

export const pageQuery = graphql`
  query Guides {
    site {
      siteMetadata {
        siteUrl
      }
    }
    allMarkdownRemark(
      filter: { fields: { kind: { eq: "guide" } } }
      sort: [{ frontmatter: { date: DESC } }, { frontmatter: { title: ASC } }]
    ) {
      nodes {
        id
        fields {
          slug
        }
        frontmatter {
          title
          description
          kicker
        }
      }
    }
  }
`
