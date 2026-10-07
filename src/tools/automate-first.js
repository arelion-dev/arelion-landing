// "What to automate first": the three tests and the two things left for later
// from the AI automation guide (content/guides/ai-automation-uae.md, "What to
// automate first"), applied to the visitor's own tasks. Plain CommonJS with no
// React, so the tests can require it; src/components/automate-first.js renders it.
//
// The tool shows no figure of its own. The only numbers on screen are the hours
// the visitor typed, used to rank the tasks that pass. Every explanation uses
// the guide's words, and test/tools.test.mjs checks them against the markdown.

// Anchor on the page, and the `tool` value a guide's frontmatter uses to embed it.
const ANCHOR = "automate-first"
// Analytics: the tool in the `tool` event, the place in generate_lead.
const TOOL_ID = "automate_first"
const LEAD_LOCATION = "tool_automate_first"
const MAX_TASKS = 5

const ANSWER = { yes: "yes", no: "no" }

const COPY = {
  title: "What to automate first",
  intro:
    "Add the tasks you have in mind, up to five, and answer the questions for each. Nothing you type leaves your browser.",
  task: "Task",
  name: "Task name",
  namePlaceholder: "Monthly client report",
  hours: "Hours a month your team spends on it (optional)",
  yes: "Yes",
  no: "No",
  add: "Add a task",
  remove: "Remove",
  submit: "Show what to automate first",
  ranked: "Tasks to start with are ranked by the hours a month you entered.",
  cta: "Want me to look at your list?",
}

// The guide's three tests, then its two things left for later, as yes/no questions.
const QUESTIONS = [
  { key: "recurs", legend: "Does it come back every week or every month in the same shape?" },
  { key: "checkable", legend: "Can a person check the output in a few minutes?" },
  {
    key: "dataInTools",
    legend: "Does the data already sit in your tools (accounting, CRM, analytics, shared drives)?",
  },
  { key: "unreviewedDecision", legend: "Is it a decision with legal or financial weight that nobody reviews?" },
  { key: "writtenDown", legend: "Is the process written down?" },
]

const VERDICT = { startHere: "start_here", writeDown: "write_down", companyBrain: "company_brain", later: "later" }
const VERDICT_LABEL = {
  [VERDICT.startHere]: "Start here",
  [VERDICT.writeDown]: "Write it down first",
  [VERDICT.companyBrain]: "Start with a company brain",
  [VERDICT.later]: "Leave for later",
}

// Why a task got its verdict. `link` turns the words it names into a link.
const REASON = {
  passes: { text: "I start with the tasks that pass three tests." },
  notRecurring: { text: "It does not come back every week or every month in the same shape." },
  notCheckable: { text: "A person cannot check the output in a few minutes." },
  dataNotInTools: {
    text: "Its data is not in your tools. If the knowledge lives in people's heads, start with a company brain so the system has something to read.",
    link: { label: "company brain", to: "/guides/company-brain/" },
  },
  unreviewedDecision: { text: "It is a decision with legal or financial weight that nobody reviews." },
  notWrittenDown: {
    text: "Nobody has written the process down. When a process is unclear, the first weeks go into writing it down with the people who do it.",
  },
}

// An unreviewed decision, or a task that fails the first or second test, waits.
// Of the rest, an unwritten process comes first, then data that is not in tools.
const verdictOf = a => {
  if (a.unreviewedDecision || !a.recurs || !a.checkable) return VERDICT.later
  if (!a.writtenDown) return VERDICT.writeDown
  if (!a.dataInTools) return VERDICT.companyBrain
  return VERDICT.startHere
}

// Every answer that holds a task back, in the guide's order.
const reasonsOf = a => {
  const held = [
    !a.recurs && REASON.notRecurring,
    !a.checkable && REASON.notCheckable,
    !a.dataInTools && REASON.dataNotInTools,
    a.unreviewedDecision && REASON.unreviewedDecision,
    !a.writtenDown && REASON.notWrittenDown,
  ].filter(Boolean)
  return held.length ? held : [REASON.passes]
}

// The hours field is optional: empty or unusable means "not given".
const parseHours = raw => {
  if (raw === null || raw === undefined || String(raw).trim() === "") return null
  const hours = Number(raw)
  return Number.isFinite(hours) && hours >= 0 ? hours : null
}

const hoursLabel = hours => `${hours} ${hours === 1 ? "hour" : "hours"} a month`

// tasks: [{ id, name, hours (number or null), answers: { recurs, checkable,
// dataInTools, unreviewedDecision, writtenDown } (booleans) }].
// Returns the same tasks with their verdict and reasons: the ones to start
// with first, most hours a month on top (tasks without hours after those with
// hours; ties keep the visitor's order), then every other task in its order.
const rankTasks = tasks => {
  const judged = tasks.map(t => ({ ...t, verdict: verdictOf(t.answers), reasons: reasonsOf(t.answers) }))
  const first = judged
    .filter(t => t.verdict === VERDICT.startHere)
    .sort((a, b) => (b.hours ?? -1) - (a.hours ?? -1))
  return [...first, ...judged.filter(t => t.verdict !== VERDICT.startHere)]
}

// Analytics label of one submit: how many tasks got each verdict. Never a name.
const resultKey = ranked =>
  Object.values(VERDICT)
    .map(v => `${v}:${ranked.filter(t => t.verdict === v).length}`)
    .join(",")

module.exports = {
  ANCHOR,
  TOOL_ID,
  LEAD_LOCATION,
  MAX_TASKS,
  ANSWER,
  COPY,
  QUESTIONS,
  VERDICT,
  VERDICT_LABEL,
  REASON,
  parseHours,
  hoursLabel,
  rankTasks,
  resultKey,
}
