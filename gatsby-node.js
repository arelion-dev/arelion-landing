const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

// With zero published case studies, the index page must not exist either
// (the home section and the nav link are already hidden by the components).
exports.onCreatePage = ({ page, actions }) => {
  const caseStudies = require(`./src/data/case-studies`)
  if (caseStudies.length === 0 && page.path.replace(/\/$/, "") === `/case-studies`) {
    actions.deletePage(page)
  }
}

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  // Case studies: data-driven pages generated from src/data/case-studies.js
  const caseStudies = require(`./src/data/case-studies`)
  const caseStudyTemplate = path.resolve(`./src/templates/case-study.js`)
  caseStudies.forEach(cs => {
    createPage({
      path: `/case-studies/${cs.slug}`,
      component: caseStudyTemplate,
      context: {
        slug: cs.slug,
        articleSlug: cs.article || null,
        articleBusinessSlug: cs.articleBusiness || null,
      },
    })
  })

  // No standalone /blog/<slug> pages. Each markdown body is embedded inside its
  // case-study page (src/templates/case-study.js) via the article slug, so the
  // raw /blog mirror was a duplicate. The markdown nodes still exist and keep
  // their `/blog/<dir>/` slug (set in onCreateNode) for that embed query.
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    // A post lives at content/blog/<dir>/index.MD (EN) or index.fr.MD (FR).
    // Both language files share one slug (the directory); `lang` tells them
    // apart so the case-study template can pick the reader's language and fall
    // back to English when no translation exists.
    const base = path.basename(node.fileAbsolutePath)
    const lang = /\.fr\.mdx?$/i.test(base) ? `fr` : `en`
    const dir = path.basename(path.dirname(node.fileAbsolutePath))

    createNodeField({ name: `slug`, node, value: `/blog/${dir}/` })
    createNodeField({ name: `lang`, node, value: lang })
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  // Explicitly define the siteMetadata {} object
  // This way those will always be defined even if removed from gatsby-config.js

  // Also explicitly define the Markdown frontmatter
  // This way the "MarkdownRemark" queries will return `null` even when no
  // blog posts are stored inside "content/blog" instead of returning an error
  createTypes(`
    type SiteSiteMetadata {
      author: Author
      siteUrl: String
      social: Social
    }

    type Author {
      name: String
      summary: String
    }

    type Social {
      twitter: String
      linkedin: String
      github: String
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      title: String
      description: String
      date: Date @dateformat
      tags: [String]
    }

    type Fields {
      slug: String
      lang: String
    }
  `)
}
