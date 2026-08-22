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
              href="https://calendar.app.google/APH548vGrkmUiyqUA"
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
        <nav className="footer-nav">
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
        &copy; {new Date().getFullYear()} ARELION FZCO
      </footer>
    </div>
  )
}

export default Layout
