import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"

const NotFoundPage = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title

  return (
    <Layout location={location} title={siteTitle}>
      <h1>404: Page not found</h1>
      <p>
        This page does not exist. Here is where to look next on arelion.dev:
      </p>
      <ul>
        <li>
          <Link to="/">Home</Link> — services, past clients and contact
        </li>
        <li>
          <Link to="/case-studies">Case studies</Link> — selected work
        </li>
        <li>
          <a href="/blog">Blog</a> — essays and technical write-ups
        </li>
        <li>
          <Link to="/about">About</Link>, <Link to="/contact">Contact</Link> and{" "}
          <Link to="/privacy">Privacy</Link>
        </li>
        <li>
          <a href="/sitemap-index.xml">Sitemap</a> — full list of pages
        </li>
        <li>
          <a href="/llms.txt">llms.txt</a> — machine-readable site summary for
          agents
        </li>
      </ul>
    </Layout>
  )
}

export default NotFoundPage

export const Head = ({ location }) => <SEO title="404: Not Found" pathname={location.pathname} />

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
