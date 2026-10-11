import React from "react"

import { trackLead, LEAD_METHOD } from "../hooks/use-track-event"

export const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"

// WhatsApp link that names the page, so a lead says which page brought it.
export const whatsappFor = (base, title) =>
  `${String(base).split("?")[0]}?text=${encodeURIComponent(`Hi Antonin, I read "${title}" on arelion.dev`)}`

// The two contact links of a guide or a case study, tracked with their place on the page.
const ContactLinks = ({ whatsappHref, location, bookLabel = "Book a call" }) => (
  <>
    {whatsappHref && (
      <a
        className="nav-pill nav-pill-whatsapp"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackLead(LEAD_METHOD.whatsapp, location)}
      >
        WhatsApp
      </a>
    )}
    <a
      className="nav-pill nav-pill-primary"
      href={CALENDAR_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackLead(LEAD_METHOD.booking, location)}
    >
      {bookLabel}
    </a>
  </>
)

export default ContactLinks
