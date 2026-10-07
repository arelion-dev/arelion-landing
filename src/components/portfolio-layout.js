import React from "react"
import { Link, useStaticQuery, graphql } from "gatsby"
import { useLocation } from "@reach/router"
import { GatsbyImage } from "gatsby-plugin-image"
import useDomainTitle from "../hooks/use-domain-title"
import trackEvent, { trackLead, LEAD_METHOD } from "../hooks/use-track-event"
import WhatsAppIcon from "./whatsapp-icon"
import LanguageSwitcher from "./language-switcher"
import { useI18n } from "../i18n"

const AVATAR_IMG_STYLE = { borderRadius: "50%" }

const WHATSAPP_URL =
  "https://wa.me/971556792204?text=Hi%20Antonin%2C%20I%20found%20you%20via%20arelion.dev"

const PortfolioLayout = ({ avatar, children }) => {
  const displayTitle = useDomainTitle()
  const { t } = useI18n()
  const { pathname } = useLocation()
  // No self-link on the case studies or guides index itself
  const onCaseStudies = pathname.replace(/\/$/, "") === "/case-studies"
  const onGuides = pathname.replace(/\/$/, "") === "/guides"
  const data = useStaticQuery(graphql`
    query {
      file(absolutePath: { regex: "/profile-pic.jpeg/" }) {
        childImageSharp {
          gatsbyImageData(width: 40, height: 40, quality: 95, layout: FIXED)
        }
      }
      guides: allMarkdownRemark(filter: { fields: { kind: { eq: "guide" } } }) {
        totalCount
      }
      # One page per published case study (gatsby-node). Counted at build time so
      # the layout does not ship the whole case-study data file to every page.
      caseStudies: allSitePage(filter: { path: { glob: "/case-studies/*/" } }) {
        totalCount
      }
    }
  `)
  const avatarImage = avatar || data?.file?.childImageSharp?.gatsbyImageData
  const hasGuides = data?.guides?.totalCount > 0
  const hasCaseStudies = data?.caseStudies?.totalCount > 0

  return (
    <div className="portfolio-wrapper">
      <header className="portfolio-header">
        <div className="portfolio-header-left">
          {avatarImage && (
            <GatsbyImage
              image={avatarImage}
              alt="Antonin Ribeaud"
              className="portfolio-avatar"
              imgStyle={AVATAR_IMG_STYLE}
            />
          )}
          <Link to="/" className="portfolio-name">
            {displayTitle}
          </Link>
          {/* Shown only on mobile (next to the avatar); desktop uses the one in the nav. */}
          <LanguageSwitcher />
        </div>
        <nav className="portfolio-header-nav">
          <LanguageSwitcher />
          {!onCaseStudies && hasCaseStudies && (
            <Link className="nav-pill nav-cs" to="/case-studies">
              {t("nav.caseStudies")}
            </Link>
          )}
          {/* Same class as case studies: hidden in the mobile header, the footer link covers it. */}
          {!onGuides && hasGuides && (
            <Link className="nav-pill nav-cs" to="/guides/">
              {t("nav.guides")}
            </Link>
          )}
          <a
            className="nav-pill nav-pill-whatsapp"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("click", "cta", "whatsapp_nav")
              trackLead(LEAD_METHOD.whatsapp, "nav")
            }}
          >
            <WhatsAppIcon />
            {t("nav.whatsapp")}
          </a>
          <a
            className="nav-pill nav-pill-primary"
            href="https://calendar.app.google/APH548vGrkmUiyqUA"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("click", "cta", "book_a_call")
              trackLead(LEAD_METHOD.booking, "nav")
            }}
          >
            {t("nav.bookACall")}
          </a>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="portfolio-footer">
        <nav className="portfolio-footer-nav">
          {hasGuides && <Link to="/guides/">Guides</Link>}
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
        <span className="portfolio-footer-legal">
          &copy; {new Date().getFullYear()} ARELION FZCO
        </span>
      </footer>
    </div>
  )
}

export default PortfolioLayout
