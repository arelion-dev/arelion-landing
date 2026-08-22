import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"

const PrivacyPage = ({ location }) => (
  <Layout location={location}>
    <h1>Privacy policy</h1>
    <p>
      This site, arelion.dev, is published by ARELION FZCO (IFZA, Dubai Silicon
      Oasis, Dubai, United Arab Emirates). This policy explains what data the
      site collects and how it is used. It is written in plain language on
      purpose.
    </p>
    <h2>What the site collects</h2>
    <ul>
      <li>
        <strong>Analytics:</strong> the site uses Google Analytics 4 to count
        visits and understand which pages are read. IP addresses are anonymized
        and the site respects the browser Do Not Track setting. Analytics data is
        aggregated; it is not used to identify individual visitors.
      </li>
      <li>
        <strong>Language preference:</strong> when you switch language, the
        choice is stored in your browser local storage under the key
        &quot;arelion-lang&quot;. It never leaves your device and is only used to
        show the site in your preferred language.
      </li>
      <li>
        <strong>No forms:</strong> the site has no contact form and no account
        system. It does not ask you to submit personal data. Contact happens
        through external channels you choose (email, WhatsApp, LinkedIn or a
        calendar booking).
      </li>
    </ul>
    <h2>How data is used</h2>
    <p>
      Analytics data is used only to improve the site. Personal data is never
      sold, rented or shared for advertising. When you contact Arelion through an
      external channel, the content of that conversation is used only to answer
      you and to scope potential work.
    </p>
    <h2>Third parties</h2>
    <p>
      The site loads Google Analytics from Google. External links (calendar,
      WhatsApp, LinkedIn, GitHub) send you to services that have their own
      privacy policies. Please review those policies when you use them.
    </p>
    <h2>Your choices and contact</h2>
    <p>
      You can block analytics with a Do Not Track setting or a content blocker,
      and you can clear the language preference by clearing your browser storage.
      For any question about this policy or a request about your data, contact{" "}
      <a href="mailto:anton@arelion.dev">anton@arelion.dev</a>. See also the{" "}
      <a href="/contact">contact page</a>.
    </p>
  </Layout>
)

export default PrivacyPage

export const Head = ({ location }) => (
  <SEO
    title="Privacy policy"
    description="How arelion.dev handles data: anonymized Google Analytics, a local language preference, no forms, no data selling. Published by ARELION FZCO, Dubai."
    pathname={location.pathname}
  />
)
