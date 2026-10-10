import React from "react"

// Bottom-of-page note on every page that talks about the law (asked on
// 2026-10-07): all guides, and case studies sold as Legal AI. Styled as a
// small tinted box with a bold label so it reads as a notice, not a footnote.
// A guide about another country's law names that country (legalJurisdiction).
const LegalDisclaimer = ({ jurisdiction = "the UAE" }) => (
  <aside
    className="cs-disclaimer"
    role="note"
    style={{
      marginTop: "32px",
      padding: "14px 18px",
      borderRadius: "10px",
      background: "#fff8e6",
      border: "1px solid #f2d58a",
      borderLeft: "4px solid #d99a00",
      color: "var(--color-text)",
      fontSize: "0.95em",
      lineHeight: 1.5,
    }}
  >
    <strong>Not legal advice.</strong>
    {` General information only. The rules change often: before you act on this page, check the current texts and ask a lawyer qualified in ${jurisdiction}.`}
  </aside>
)

export default LegalDisclaimer
