import React from "react"
import { useStaticQuery, graphql } from "gatsby"

const SEO = ({ description, title, pathname, children }) => {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            siteUrl
            social {
              twitter
            }
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = site.siteMetadata?.title
  const siteUrl = site.siteMetadata?.siteUrl || ``
  const twitterUrl = site.siteMetadata?.social?.twitter || ``
  const twitterHandle = twitterUrl.split("/").pop()
  const ogImage = `${siteUrl}/og-cover.png`
  // Canonical: siteUrl + the page path, with a single trailing slash.
  const canonical = pathname
    ? `${siteUrl}${pathname.endsWith("/") ? pathname : `${pathname}/`}`
    : siteUrl

  return (
    <>
      <title>{defaultTitle ? `${title} | ${defaultTitle}` : title}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:width" content="2400" />
      <meta property="og:image:height" content="1260" />
      <meta property="og:image:alt" content="arelion.dev, boutique tech studio" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:creator"
        content={twitterHandle ? `@${twitterHandle}` : ``}
      />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      {children}
    </>
  )
}

export default SEO
