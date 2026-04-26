import React from "react"
import { Link } from "gatsby"
import useDomainTitle from "../hooks/use-domain-title"
import trackEvent from "../hooks/use-track-event"

const TESTIMONIALS_URL =
  "https://www.linkedin.com/in/antoninribeaud/details/recommendations/?detailScreenTabIndex=0"

const PortfolioLayout = ({ children }) => {
  const displayTitle = useDomainTitle()

  return (
    <div className="portfolio-wrapper">
      <header className="portfolio-header">
        <div className="portfolio-header-left">
          <Link to="/" className="portfolio-name">
            {displayTitle}
          </Link>
        </div>
        <nav className="portfolio-header-nav">
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
            className="nav-pill nav-pill-primary"
            href="https://calendar.app.google/rGenB9JqgBh8xSyh8"
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
