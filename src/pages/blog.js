import React, { useState, useMemo } from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import PostTags from "../components/post-tags"
import SEO from "../components/seo"

const BlogPage = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes
  const [selectedTag, setSelectedTag] = useState("")

  const allTags = useMemo(() => {
    const tags = new Set()
    posts.forEach(post => {
      if (post.frontmatter.tags) {
        post.frontmatter.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }, [posts])

  const filteredPosts = useMemo(
    () =>
      selectedTag
        ? posts.filter(
            post =>
              post.frontmatter.tags &&
              post.frontmatter.tags.includes(selectedTag)
          )
        : posts,
    [posts, selectedTag]
  )

  if (posts.length === 0) {
    return (
      <Layout>
        <Bio />
        <p>No blog posts found.</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <Bio />
      <div className="filter-bar">
        <select
          className="tag-filter"
          value={selectedTag}
          onChange={e => setSelectedTag(e.target.value)}
        >
          <option value="">All posts</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>
      {filteredPosts.map(post => {
        const title = post.frontmatter.title || post.fields.slug
        return (
          <article
            key={post.fields.slug}
            className="post-list-item"
            itemScope
            itemType="http://schema.org/Article"
          >
            <header>
              <h2>
                <Link to={post.fields.slug} itemProp="url">
                  <span itemProp="headline">{title}</span>
                </Link>
              </h2>
              <div className="post-meta">
                <small>{post.frontmatter.date}</small>
                <PostTags tags={post.frontmatter.tags} />
              </div>
            </header>
            <section>
              <p
                dangerouslySetInnerHTML={{
                  __html: post.frontmatter.description || post.excerpt,
                }}
                itemProp="description"
              />
            </section>
          </article>
        )
      })}
    </Layout>
  )
}

export default BlogPage

export const Head = () => <SEO title="Blog" />

export const pageQuery = graphql`
  query {
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { private: { ne: true } } }
    ) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          description
          tags
        }
      }
    }
  }
`
