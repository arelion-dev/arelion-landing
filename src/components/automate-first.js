import React, { useEffect, useState } from "react"
import { Link } from "gatsby"

import ToolCta from "./tool-cta"
import { trackToolResult } from "../hooks/use-track-event"
import {
  ANCHOR,
  TOOL_ID,
  LEAD_LOCATION,
  MAX_TASKS,
  ANSWER,
  COPY,
  QUESTIONS,
  VERDICT,
  VERDICT_LABEL,
  parseHours,
  hoursLabel,
  rankTasks,
  resultKey,
} from "../tools/automate-first"

// Verdict pills reuse the case-study kicker colours.
const VERDICT_CLASS = {
  [VERDICT.startHere]: "cs-p-transform",
  [VERDICT.writeDown]: "cs-p-llm",
  [VERDICT.companyBrain]: "cs-p-build",
  [VERDICT.later]: "cs-p-lab",
}

// A reason that names a guide shows that name as a link to it.
const reasonText = ({ text, link }) => {
  if (!link) return text
  const [before, after] = text.split(link.label)
  return (
    <>
      {before}
      <Link to={link.to}>{link.label}</Link>
      {after}
    </>
  )
}

// One to five tasks, five yes/no questions each, and the guide's verdict on
// each task (src/tools/automate-first.js), shown on the AI automation guide.
const AutomateFirst = ({ whatsappHref }) => {
  // Tasks are kept by id, not position, so removing one never hands its
  // answers to the next.
  const [ids, setIds] = useState([1])
  const [nextId, setNextId] = useState(2)
  const [ranked, setRanked] = useState(null)
  // Before React runs, the browser would send the form itself and put the
  // task names in the page URL, so the button stays disabled until then.
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  const addTask = () => {
    setIds(list => [...list, nextId])
    setNextId(n => n + 1)
    setRanked(null)
  }
  const removeTask = id => {
    setIds(list => list.filter(i => i !== id))
    setRanked(null)
  }

  const onSubmit = e => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const result = rankTasks(
      ids.map((id, i) => ({
        id,
        name: String(data.get(`name-${id}`)).trim() || `${COPY.task} ${i + 1}`,
        hours: parseHours(data.get(`hours-${id}`)),
        answers: Object.fromEntries(QUESTIONS.map(q => [q.key, data.get(`${q.key}-${id}`) === ANSWER.yes])),
      })),
    )
    setRanked(result)
    trackToolResult(TOOL_ID, resultKey(result))
  }

  const rankedByHours = ranked && ranked.some(t => t.verdict === VERDICT.startHere && t.hours !== null)

  return (
    <section id={ANCHOR} className="sim-panel tool-panel" aria-labelledby={`${ANCHOR}-title`}>
      <h2 id={`${ANCHOR}-title`} className="tool-title">
        {COPY.title}
      </h2>
      <p className="tool-intro">{COPY.intro}</p>
      {/* A changed answer no longer matches the result on screen: clear it. */}
      <form onSubmit={onSubmit} onChange={() => setRanked(null)}>
        {ids.map((id, i) => (
          <fieldset key={id} className="tool-task">
            <legend className="sim-row-label">
              {COPY.task} {i + 1}
            </legend>
            <label className="tool-field">
              {COPY.name}
              {/* Focus a task the visitor just added; never the first one on page load. */}
              <input type="text" name={`name-${id}`} required placeholder={COPY.namePlaceholder} autoFocus={id > 1} />
            </label>
            <label className="tool-field">
              {COPY.hours}
              <input type="number" name={`hours-${id}`} min="0" step="any" inputMode="decimal" />
            </label>
            {QUESTIONS.map(q => (
              <fieldset key={q.key} className="tool-question">
                <legend>{q.legend}</legend>
                <div className="tool-options">
                  <label className="tool-option">
                    <input type="radio" name={`${q.key}-${id}`} value={ANSWER.yes} required />
                    {COPY.yes}
                  </label>
                  <label className="tool-option">
                    <input type="radio" name={`${q.key}-${id}`} value={ANSWER.no} required />
                    {COPY.no}
                  </label>
                </div>
              </fieldset>
            ))}
            {ids.length > 1 && (
              <button
                type="button"
                className="sim-btn"
                onClick={() => removeTask(id)}
                aria-label={`${COPY.remove} ${COPY.task.toLowerCase()} ${i + 1}`}
              >
                {COPY.remove}
              </button>
            )}
          </fieldset>
        ))}
        <div className="tool-actions">
          {ids.length < MAX_TASKS && (
            <button type="button" className="sim-btn" onClick={addTask}>
              {COPY.add}
            </button>
          )}
          <button type="submit" className="nav-pill nav-pill-primary tool-submit" disabled={!ready}>
            {COPY.submit}
          </button>
        </div>
      </form>
      <div className="tool-result" aria-live="polite">
        {ranked && (
          <>
            <ol className="tool-ranking">
              {ranked.map(t => (
                <li key={t.id}>
                  <span className={`cs-row-kicker ${VERDICT_CLASS[t.verdict]}`}>{VERDICT_LABEL[t.verdict]}</span>
                  <p className="tool-pick">
                    {t.name}
                    {t.hours !== null && <span className="tool-hours"> · {hoursLabel(t.hours)}</span>}
                  </p>
                  {t.reasons.map(r => (
                    <p key={r.text}>{reasonText(r)}</p>
                  ))}
                </li>
              ))}
            </ol>
            {rankedByHours && <p className="tool-note">{COPY.ranked}</p>}
          </>
        )}
      </div>
      {ranked && <ToolCta question={COPY.cta} location={LEAD_LOCATION} whatsappHref={whatsappHref} />}
    </section>
  )
}

export default AutomateFirst
