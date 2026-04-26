import React from "react"
import { Link } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image"
import useDomainTitle from "../hooks/use-domain-title"
import trackEvent from "../hooks/use-track-event"

const AVATAR_IMG_STYLE = { borderRadius: "50%" }
const TESTIMONIALS_URL = "https://www.linkedin.com/in/antoninribeaud/details/recommendations/?detailScreenTabIndex=0"
const BLOG_URL = "https://antonin.cool/blog"

const PortfolioLayout = ({ avatar, author, navExtra, navLabels, children }) => {
  const displayTitle = useDomainTitle()
  const labels = navLabels || { blog: "blog", bookCall: "book a call", testimonials: "testimonials" }

  return (
    <div className="portfolio-wrapper">
      <header className="portfolio-header">
        <div className="portfolio-header-left">
          <span className="portfolio-lang-desktop">{navExtra}</span>
          {avatar && (
            <GatsbyImage
              image={avatar}
              alt={author?.name || ""}
              className="portfolio-avatar"
              imgStyle={AVATAR_IMG_STYLE}
            />
          )}
          <Link to="/" className="portfolio-name">
            {displayTitle}
          </Link>
          <span className="portfolio-lang-mobile">{navExtra}</span>
        </div>
        <nav className="portfolio-header-nav">
          <a
            className="nav-pill"
            href={BLOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("click", "nav", "blog")}
          >
            {labels.blog}
          </a>
          <a
            className="nav-pill"
            href={TESTIMONIALS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("click", "nav", "testimonials")}
          >
            {labels.testimonials}
          </a>
          <a
            className="nav-pill nav-pill-primary"
            href="https://calendar.app.google/rGenB9JqgBh8xSyh8"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("click", "cta", "book_a_call")}
          >
            {labels.bookCall}
          </a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}

export default PortfolioLayout
