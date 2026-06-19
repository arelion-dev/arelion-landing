import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import PostTags from "../components/post-tags"
import SEO from "../components/seo"

const BlogPostTemplate = ({ data, pageContext, location }) => {
  const post = data.markdownRemark
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const { previous, next } = pageContext

  return (
    <Layout location={location} title={siteTitle}>
      <article
        className="blog-post"
        itemScope
        itemType="http://schema.org/Article"
      >
        <header>
          <h1 itemProp="headline">{post.frontmatter.title}</h1>
          <div className="post-meta">
            <p>{post.frontmatter.date}</p>
            <PostTags tags={post.frontmatter.tags} />
          </div>
        </header>
        <section
          dangerouslySetInnerHTML={{ __html: post.html }}
          itemProp="articleBody"
        />
        <hr />
        <footer>
          <Bio />
        </footer>
      </article>
      <nav className="blog-post-nav">
        <ul
          style={{
            display: `flex`,
            flexWrap: `wrap`,
            justifyContent: `space-between`,
            listStyle: `none`,
            padding: 0,
          }}
        >
          <li>
            {previous && !previous.frontmatter.private && (
              <Link to={previous.fields.slug} rel="prev">
                ← {previous.frontmatter.title}
              </Link>
            )}
          </li>
          <li>
            {next && !next.frontmatter.private && (
              <Link to={next.fields.slug} rel="next">
                {next.frontmatter.title} →
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </Layout>
  )
}

export default BlogPostTemplate

export const Head = ({ data }) => {
  const post = data.markdownRemark
  const siteUrl = data.site.siteMetadata.siteUrl
  const description = post.frontmatter.description || post.excerpt
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.frontmatter.title,
    description,
    datePublished: post.frontmatter.isoDate,
    url: `${siteUrl}${post.fields.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}${post.fields.slug}`,
    },
    author: {
      "@type": "Organization",
      name: "Arelion",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Arelion",
      url: siteUrl,
    },
    ...(post.frontmatter.tags && post.frontmatter.tags.length > 0
      ? { keywords: post.frontmatter.tags }
      : {}),
  }
  return (
    <SEO title={post.frontmatter.title} description={description}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </SEO>
  )
}

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        siteUrl
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      fields { slug }
      frontmatter {
        title
        private
        date(formatString: "MMMM DD, YYYY")
        isoDate: date
        description
        tags
      }
    }
  }
`
