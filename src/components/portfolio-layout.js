import React from "react"
import { Link, useStaticQuery, graphql } from "gatsby"
import { useLocation } from "@reach/router"
import { GatsbyImage } from "gatsby-plugin-image"
import useDomainTitle from "../hooks/use-domain-title"
import trackEvent from "../hooks/use-track-event"
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
  // No self-link on the case studies index itself
  const onCaseStudies = pathname.replace(/\/$/, "") === "/case-studies"
  const data = useStaticQuery(graphql`
    query {
      file(absolutePath: { regex: "/profile-pic.jpeg/" }) {
        childImageSharp {
          gatsbyImageData(width: 40, height: 40, quality: 95, layout: FIXED)
        }
      }
    }
  `)
  const avatarImage = avatar || data?.file?.childImageSharp?.gatsbyImageData

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
        </div>
        <nav className="portfolio-header-nav">
          <LanguageSwitcher />
          {!onCaseStudies && (
            <Link className="nav-pill" to="/case-studies">
              {t("nav.caseStudies")}
            </Link>
          )}
          <a
            className="nav-pill nav-pill-whatsapp"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("click", "cta", "whatsapp_nav")}
          >
            <WhatsAppIcon />
            {t("nav.whatsapp")}
          </a>
          <a
            className="nav-pill nav-pill-primary"
            href="https://calendar.app.google/APH548vGrkmUiyqUA"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("click", "cta", "book_a_call")}
          >
            {t("nav.bookACall")}
          </a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}

export default PortfolioLayout
