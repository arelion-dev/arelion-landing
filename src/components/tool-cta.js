import React from "react"
import { trackLead, LEAD_METHOD } from "../hooks/use-track-event"

const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"

// Under a decision tool's result: the guide's two contact links, tracked with
// the tool as the place on the site.
const ToolCta = ({ question, location, whatsappHref }) => (
  <div className="tool-cta">
    <p>{question}</p>
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
      Book a call
    </a>
  </div>
)

export default ToolCta
