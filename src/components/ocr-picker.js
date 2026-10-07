import React, { useEffect, useState } from "react"
import { Link } from "gatsby"

import ToolCta from "./tool-cta"
import { trackToolResult } from "../hooks/use-track-event"
import { ANCHOR, TOOL_ID, LEAD_LOCATION, COPY, QUESTIONS, pickOcr } from "../tools/ocr-picker"

// Two radio groups and the guide's answer to them (src/tools/ocr-picker.js),
// shown on the Arabic OCR guide under its lead.
const OcrPicker = ({ whatsappHref }) => {
  const [result, setResult] = useState(null)
  // Before React runs, the browser would send the form itself and put the
  // answers in the page URL, so the button stays disabled until then.
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  const onSubmit = e => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const answer = pickOcr({ pages: data.get("pages"), where: data.get("where") })
    setResult(answer)
    trackToolResult(TOOL_ID, answer.key)
  }

  return (
    <section id={ANCHOR} className="sim-panel tool-panel" aria-labelledby={`${ANCHOR}-title`}>
      <h2 id={`${ANCHOR}-title`} className="tool-title">
        {COPY.title}
      </h2>
      <p className="tool-intro">{COPY.intro}</p>
      {/* A changed answer no longer matches the result on screen: clear it. */}
      <form onSubmit={onSubmit} onChange={() => setResult(null)}>
        {QUESTIONS.map(q => (
          <fieldset key={q.name} className="tool-question">
            <legend>{q.legend}</legend>
            <div className="tool-options">
              {q.options.map(o => (
                <label key={o.value} className="tool-option">
                  <input type="radio" name={q.name} value={o.value} required />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="submit" className="nav-pill nav-pill-primary tool-submit" disabled={!ready}>
          {COPY.submit}
        </button>
      </form>
      <div className="tool-result" aria-live="polite">
        {result && (
          <>
            {result.pdf && (
              <div className="tool-block">
                <p className="cs-io-label">{result.pdf.label}</p>
                <p>{result.pdf.text.join(" ")}</p>
                <p>
                  {COPY.details} <Link to={result.pdf.link.to}>{result.pdf.link.label}</Link>.
                </p>
              </div>
            )}
            <div className="tool-block">
              <p className="cs-io-label">{result.pick.label}</p>
              <p className="tool-pick">{result.pick.title}</p>
              <p>{result.pick.text.join(" ")}</p>
            </div>
            <div className="tool-block tool-note">
              <p>
                <strong>{result.avoid.lead}</strong> {result.avoid.text}
              </p>
              <p>{result.check}</p>
            </div>
          </>
        )}
      </div>
      {result && <ToolCta question={COPY.cta} location={LEAD_LOCATION} whatsappHref={whatsappHref} />}
    </section>
  )
}

export default OcrPicker
