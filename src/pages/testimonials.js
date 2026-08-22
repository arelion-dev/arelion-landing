import React from "react"

import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import { useI18n } from "../i18n"
import TESTI_PHOTOS from "../data/testimonial-photos"
import trackEvent from "../hooks/use-track-event"

const TESTIMONIALS_URL =
  "https://www.linkedin.com/in/antoninribeaud/details/recommendations/?detailScreenTabIndex=0"

// Pinned to the top of the page; everyone else keeps the catalog order.
const PINNED_FIRST = "Alex Gutwillig"

const TestimonialsPage = () => {
  const { t } = useI18n()

  const all = t("testi.items")
  const items = [
    ...all.filter(item => item.name === PINNED_FIRST),
    ...all.filter(item => item.name !== PINNED_FIRST),
  ]

  return (
    <PortfolioLayout>
      <section className="testi-page">
        <h1 className="testi-page-title">{t("testi.title")}</h1>
        <div className="testi-full-grid">
          {items.map(item => (
            <figure key={item.name} className="testi-card">
              <a
                className="testi-link"
                href={TESTIMONIALS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent("click", "social", "testimonial_linkedin_page")
                }
              >
                {t("testi.readOn")} &#8599;
              </a>
              <blockquote className="testi-quote">{item.full}</blockquote>
              <figcaption className="testi-who">
                <img
                  className="testi-avatar"
                  src={TESTI_PHOTOS[item.name]}
                  alt={item.name}
                  width="44"
                  height="44"
                  loading="lazy"
                />
                <div className="testi-id">
                  <span className="testi-name">{item.name}</span>
                  <span className="testi-role">{item.role}</span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </PortfolioLayout>
  )
}

export default TestimonialsPage

export const Head = ({ location }) => (
  <SEO
    title="Testimonials"
    description="What clients say about working with Antonin Ribeaud (Arelion): full LinkedIn recommendations from CEOs, product leaders and managing directors."
    pathname={location.pathname}
  />
)
