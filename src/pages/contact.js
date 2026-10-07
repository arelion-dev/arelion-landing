import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { trackLead, LEAD_METHOD } from "../hooks/use-track-event"

const CALENDAR_URL = "https://calendar.app.google/APH548vGrkmUiyqUA"
const WHATSAPP_URL =
  "https://wa.me/971556792204?text=Hi%20Antonin%2C%20I%20found%20you%20via%20arelion.dev"

const ContactPage = ({ location }) => (
  <Layout location={location}>
    <h1>Contact Arelion</h1>
    <p>
      Arelion is operated by Antonin Ribeaud (ARELION FZCO), based in Dubai
      and working with companies in Dubai, Abu Dhabi and across the United Arab
      Emirates, and remotely for clients worldwide. The fastest way to
      start is a short brief: the goal, the current stack, and the timeline. All
      channels below reach Antonin directly.
    </p>
    <h2>Direct channels</h2>
    <ul>
      <li>
        <strong>Email:</strong>{" "}
        <a href="mailto:anton@arelion.dev">anton@arelion.dev</a>
      </li>
      <li>
        <strong>WhatsApp:</strong>{" "}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLead(LEAD_METHOD.whatsapp, "contact_page")}
        >
          +971 55 679 2204
        </a>
      </li>
      <li>
        <strong>Book a call:</strong>{" "}
        <a
          href={CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLead(LEAD_METHOD.booking, "contact_page")}
        >
          calendar.app.google
        </a>
      </li>
      <li>
        <strong>LinkedIn:</strong>{" "}
        <a
          href="https://www.linkedin.com/in/antoninribeaud/"
          target="_blank"
          rel="noopener noreferrer"
        >
          in/antoninribeaud
        </a>
      </li>
      <li>
        <strong>GitHub:</strong>{" "}
        <a
          href="https://github.com/antonhansel"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/antonhansel
        </a>
      </li>
    </ul>
    <h2>Company</h2>
    <p>
      ARELION FZCO, IFZA, Dubai Silicon Oasis, Dubai, United Arab Emirates.
      Trade license 78400, constituted on 26 January 2026. For scope, pricing or
      availability, send a message on any channel above and Antonin will reply
      in writing. See the <a href="/about/">about page</a> for background and the{" "}
      <a href="/case-studies/">case studies</a> for examples of past work.
    </p>
  </Layout>
)

export default ContactPage

export const Head = ({ location }) => (
  <SEO
    title="Contact"
    description="Contact Arelion (Antonin Ribeaud, ARELION FZCO), for companies in Dubai, Abu Dhabi and the UAE. Email, WhatsApp, LinkedIn, or book a call to scope AI work."
    pathname={location.pathname}
  />
)
