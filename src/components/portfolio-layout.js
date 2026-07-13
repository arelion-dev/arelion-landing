import React from "react"
import { Link } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image"
import useDomainTitle from "../hooks/use-domain-title"
import trackEvent from "../hooks/use-track-event"
import WhatsAppIcon from "./whatsapp-icon"

const AVATAR_IMG_STYLE = { borderRadius: "50%" }

const TESTIMONIALS_URL =
  "https://www.linkedin.com/in/antoninribeaud/details/recommendations/?detailScreenTabIndex=0"

const WHATSAPP_URL =
  "https://wa.me/971556792204?text=Hi%20Antonin%2C%20I%20found%20you%20via%20arelion.dev"

const PortfolioLayout = ({ avatar, children }) => {
  const displayTitle = useDomainTitle()

  return (
    <div className="portfolio-wrapper">
      <header className="portfolio-header">
        <div className="portfolio-header-left">
          {avatar && (
            <GatsbyImage
              image={avatar}
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
          <Link className="nav-pill" to="/case-studies">
            case studies
          </Link>
          <a
            className="nav-pill"
            href={TESTIMONIALS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("click", "nav", "testimonials")}
          >
            testimonials
          </a>
          <a
            className="nav-pill nav-pill-whatsapp"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("click", "cta", "whatsapp_nav")}
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
          <a
            className="nav-pill nav-pill-primary"
            href="https://calendar.app.google/APH548vGrkmUiyqUA"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("click", "cta", "book_a_call")}
          >
            book a call
          </a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}

export default PortfolioLayout
