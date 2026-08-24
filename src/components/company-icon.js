import React from "react"

import COMPANY_ICONS from "../data/company-icons"

// A company's favicon when we have one, otherwise a monogram of its initial.
// Keeps every company visually tagged without shipping a wrong or broken icon.
const CompanyIcon = ({ name, className = "" }) => {
  const src = COMPANY_ICONS[name]
  if (src) {
    return (
      <img className={`co-icon ${className}`} src={src} alt="" width="18" height="18" />
    )
  }
  const initial =
    (name || "").replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "?"
  return (
    <span className={`co-icon co-icon--mono ${className}`} aria-hidden="true">
      {initial}
    </span>
  )
}

export default CompanyIcon
