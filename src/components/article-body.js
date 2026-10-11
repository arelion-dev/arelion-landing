import React from "react"

import ContactLinks from "./contact-links"

// Where an article with an offer shows its offer box: this comment, on a line of its own in the markdown.
const OFFER_MARKER = "<!-- offer -->"

// remark writes a markdown table as a bare <table>. Inside this div, a table
// too wide for the screen scrolls sideways on its own, and the page does not
// (see .table-scroll in style.css).
const scrollTables = html =>
  html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, "</table></div>")

// The markdown body of a guide or a case study. With an `offer` ({ title, text })
// and the marker in the markdown, the body is cut at the marker and the offer
// box sits in the cut, with the two contact links (`location` names them in
// analytics). The marker itself never reaches the page: without an offer, or
// without the marker, the body stays in one piece.
const ArticleBody = ({ html, offer, whatsappHref, location, hidden, onClick }) => {
  const [before, ...rest] = scrollTables(html).split(OFFER_MARKER)
  const after = rest.join("")
  const showOffer = Boolean(offer) && rest.length > 0
  const hiddenClass = hidden ? " cs-hidden" : ""
  const part = __html => (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <section className={`cs-section cs-article${hiddenClass}`} onClick={onClick} dangerouslySetInnerHTML={{ __html }} />
  )
  return (
    <>
      {part(showOffer ? before : before + after)}
      {showOffer && (
        <>
          <aside className={`cs-offer${hiddenClass}`}>
            <p className="cs-offer-title">{offer.title}</p>
            <p>{offer.text}</p>
            <div className="cs-offer-links">
              <ContactLinks whatsappHref={whatsappHref} location={location} />
            </div>
          </aside>
          {part(after)}
        </>
      )}
    </>
  )
}

export default ArticleBody
