import React from "react"

import PortfolioLayout from "../components/portfolio-layout"
import SEO from "../components/seo"
import { useI18n } from "../i18n"
import TESTI_PHOTOS from "../data/testimonial-photos"
import trackEvent from "../hooks/use-track-event"
import Highlighted from "../components/highlighted"

const TESTIMONIALS_URL =
  "https://www.linkedin.com/in/antoninribeaud/details/recommendations/?detailScreenTabIndex=0"

// Full page order: these lead, Paula closes, the rest keep the catalog order.
const FIRST_NAMES = ["Christopher Ware", "Alex Gutwillig"]
const LAST_NAMES = ["Paula Alves"]

const TestimonialsPage = () => {
  const { t } = useI18n()

  const all = t("testi.items")
  const pick = names => names.map(n => all.find(i => i.name === n)).filter(Boolean)
  const middle = all.filter(
    i => !FIRST_NAMES.includes(i.name) && !LAST_NAMES.includes(i.name),
  )
  const items = [...pick(FIRST_NAMES), ...middle, ...pick(LAST_NAMES)]

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
              <blockquote className="testi-quote">
                <Highlighted text={item.full} />
              </blockquote>
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
                  <span className="testi-role">
                    {item.role.split(" · ").map((line, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <br />}
                        {line}
                      </React.Fragment>
                    ))}
                  </span>
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
