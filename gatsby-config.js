module.exports = {
  siteMetadata: {
    title: `arelion.dev`,
    author: {
      name: `Arelion`,
      summary: `Boutique tech studio. AI systems, cloud platforms and SaaS — from design to production.`,
    },
    description: `Arelion is a boutique tech studio. One senior engineer, a few clients at a time. AI, cloud platforms and SaaS — from design to production.`,
    siteUrl: `https://arelion.dev`,
    social: {
      linkedin: "https://www.linkedin.com/in/antoninribeaud/",
      github: "https://github.com/antonhansel",
      blog: "https://antonin.cool/blog",
      whatsapp:
        "https://wa.me/971556792204?text=Hi%20Antonin%2C%20I%20found%20you%20via%20arelion.dev",
    },
  },
  plugins: [
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        trackingIds: [
          "G-GPHHGFWZCJ", // Google Analytics 4
        ],
        gtagConfig: {
          anonymize_ip: true,
          respect_dnt: true,
        },
        pluginConfig: {
          head: true,
          respectDNT: true,
        },
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-embed-youtube",
            options: {
              width: 800,
              height: 400,
            },
          },
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 630,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              return allMarkdownRemark.edges
                .filter(edge => !edge.node.frontmatter.private)
                .map(edge => {
                return Object.assign({}, edge.node.frontmatter, {
                  description: edge.node.excerpt,
                  date: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  guid: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  custom_elements: [{ "content:encoded": edge.node.html }],
                })
              })
            },
            query: `
              {
                allMarkdownRemark(
                  sort: { frontmatter: { date: DESC } },
                ) {
                  edges {
                    node {
                      excerpt
                      html
                      fields { slug }
                      frontmatter {
                        title
                        date
                        private
                      }
                    }
                  }
                }
              }
            `,
            output: "/rss.xml",
            title: "Gatsby RSS Feed",
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                siteUrl
              }
            }
            allSitePage {
              nodes {
                path
              }
            }
            allMarkdownRemark {
              nodes {
                fields { slug }
                frontmatter { date private }
              }
            }
          }
        `,
        resolveSiteUrl: ({ site }) => site.siteMetadata.siteUrl,
        resolvePages: ({ allSitePage: { nodes: pages }, allMarkdownRemark: { nodes: posts } }) => {
          const bySlug = new Map(posts.map(p => [p.fields.slug, p]))
          return pages
            .filter(page => {
              const post = bySlug.get(page.path)
              return !post || !post.frontmatter.private
            })
            .map(page => {
              const post = bySlug.get(page.path)
              return {
                path: page.path,
                lastmod: post?.frontmatter?.date,
              }
            })
        },
        serialize: ({ path, lastmod }) => ({
          url: path,
          ...(lastmod ? { lastmod } : {}),
        }),
      },
    },
  ],
}
