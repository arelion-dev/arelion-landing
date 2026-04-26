import React from "react"
import { Link } from "gatsby"
import useDomainTitle from "../hooks/use-domain-title"

const Layout = ({ children }) => {
  const displayTitle = useDomainTitle()

  return (
    <div className="global-wrapper">
      <header className="global-header">
        <div className="header-content">
          <Link className="header-link-home" to="/">
            {displayTitle}
          </Link>
          <nav className="blog-header-nav">
            <Link to="/" className="nav-pill">Home</Link>
            <a
              className="nav-pill nav-pill-primary"
              href="https://calendar.app.google/rGenB9JqgBh8xSyh8"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a call
            </a>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        &copy; {new Date().getFullYear()}, Built with
        {` `}
        <a href="https://www.gatsbyjs.com">Gatsby</a>
      </footer>
    </div>
  )
}

export default Layout
