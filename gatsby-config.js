module.exports = {
  siteMetadata: {
    title: `arelion.dev`,
    author: {
      name: `Arelion`,
      summary: `A boutique tech studio led by Antonin Ribeaud — senior engineer, ex-CTO. AI systems, cloud platforms and SaaS, from design to production.`,
    },
    description: `Arelion is a boutique tech studio. One senior engineer, a few clients at a time. AI, cloud platforms and SaaS — from design to production.`,
    siteUrl: `https://arelion.dev`,
    social: {
      linkedin: "https://www.linkedin.com/in/antoninribeaud/",
      github: "https://github.com/antonhansel",
      blog: "https://antonin.cool/blog",
    },
  },
  plugins: [
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        trackingIds: [],
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
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Arelion`,
        short_name: `Arelion`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#1a202c`,
        display: `minimal-ui`,
        icon: `static/favicon-512.png`,
      },
    },
  ],
}
