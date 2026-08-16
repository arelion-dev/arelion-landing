import React, { useMemo, useState } from "react"

// Interactive companion for the SynthID watermark article. Three panels:
// "forks" (one prompt, many paths), "duel" (dice vs. key) and "capacity"
// (watermark capacity by task). Content ported from the "Same Words,
// Different Dice" artifact; demos are illustrative, not model internals.

/* ---------- data: generation trees ----------
   A sample's `seq` is a list of segments.
   - locked segment: "text"  or  { t: "text", why: "reason" }
   - fork:           { c: [ { t: "chosen text", seq: [...] }, ... ] }
     An option's `seq` is its own continuation — picking a different
     option can change everything that follows. Segments after the
     fork (in the parent seq) are shared by all options. */
const ORDER = ["prose", "facts", "summary", "code", "editing", "extraction", "quoting"]
const SAMPLES = {
  prose: {
    label: "Creative prose",
    prompt: "Write the opening line of a moody short story. Begin with the words “The weather”.",
    note: "Hit Generate again and watch the first amber choice: when it lands differently, everything after it is re-decided — the whole sentence changes shape, not just single words.",
    code: false,
    seq: [
      { t: "The weather", why: "the prompt dictates these exact words — no choice here for randomness, watermarked or not, to ride on" },
      { c: [
        { t: "turned cold and overcast,", seq: [
          { c: [{ t: "and a soft fog" }, { t: "and a pale mist" }, { t: "and a slow fog" }] },
          { c: [
            { t: "rolled in over the harbor,", seq: [
              { c: [
                { t: "muting the streetlamps one by one." },
                { t: "the ferries calling blindly to each other." },
              ] },
            ] },
            { t: "came in off the bay,", seq: [
              { c: [
                { t: "and the town went quiet under it." },
                { t: "swallowing the far shore whole." },
              ] },
            ] },
          ] },
        ] },
        { t: "broke without warning,", seq: [
          { c: [
            { t: "and rain hammered the tin roofs", seq: [
              { c: [{ t: "until midnight." }, { t: "long after the lights went out." }] },
            ] },
            { t: "scattering umbrellas down the avenue", seq: [
              { c: [{ t: "like startled birds." }, { t: "and no one stopped to pick them up." }] },
            ] },
          ] },
        ] },
        { t: "held its breath all morning,", seq: [
          { c: [
            { t: "the clouds stacked like slate" },
            { t: "the clouds low and bruised" },
            { t: "the light gone flat and dead" },
          ] },
          { c: [
            { t: "above the empty pier." },
            { t: "above a town that had already given up." },
          ] },
        ] },
      ], out: ["began to sour,", "was inclement,"] },
    ],
  },
  facts: {
    label: "Factual recall",
    prompt: "What is Isaac Newton’s most important book?",
    note: "Every path through this answer states the same facts — the title, the year, the three laws. Chance only steers the sentence around them.",
    code: false,
    seq: [
      { t: "Isaac Newton’s", why: "the question names him; answers open by restating the subject" },
      { c: [{ t: "most famous" }, { t: "best-known" }] },
      { t: "work is the Principia,", why: "the title is a fact — no room to vary it" },
      { c: [
        { t: "first published", seq: [
          { t: "in 1687. In it, he", why: "the year is a fact; the phrasing follows from the pick just made" },
          { c: [{ t: "set out" }, { t: "laid out" }, { t: "introduced" }] },
          { t: "his three laws of motion.", why: "the fact fixes it" },
        ] },
        { t: "published", seq: [
          { t: "in 1687 — the book where he", why: "the year is a fact; the phrasing follows from the pick just made" },
          { c: [{ t: "set out" }, { t: "laid out" }, { t: "introduced" }] },
          { t: "his three laws of motion.", why: "the fact fixes it" },
        ] },
      ] },
    ],
  },
  summary: {
    label: "Summarization",
    prompt: "Summarize: “The meeting ran long. After a lot of back and forth about the roadmap, the team agreed to move the launch from March to May, and to hire two more engineers to cover the extra scope.”",
    note: "These facts are not the model’s — they are yours, lifted from your text. Compare Factual recall, where the pinning comes from the world instead. Either way, chance only reaches the words in between.",
    code: false,
    seq: [
      { c: [
        { t: "After a long meeting," },
        { t: "By the end of a long meeting," },
        { t: "The meeting ran long, but" },
      ] },
      { t: "the team", why: "your text fixes it" },
      { c: [{ t: "agreed" }, { t: "decided" }] },
      "to",
      { c: [{ t: "push" }, { t: "move" }] },
      { t: "the launch from March to May and hire two more engineers.", why: "every content word here — the launch, both months, the headcount, even the verb “hire” — is copied straight from your text" },
    ],
  },
  code: {
    label: "Code",
    prompt: "Write a Python function cart_total(prices) that totals a shopping cart, rounded to the nearest cent, with a one-line comment above the calculation.",
    note: "The last line isn’t a free choice, but it depends on one — pick a different variable name and the return line must follow. And notice where the two free spots are: the comment and the name. The arithmetic itself has no room to vary, which is why exact code carries so little watermark.",
    code: true,
    seq: [
      { t: "def cart_total(prices):\n    # ", why: "the prompt gives the signature verbatim; def, the colon and the indent are Python syntax" },
      { c: [{ t: "add up the item prices" }, { t: "sum the prices in the cart" }] },
      "\n    ",
      { c: [
        { t: "total", seq: [
          { t: " = sum(prices)\n    return round(", why: "the prompt pinned the rounding; the arithmetic has no room to vary" },
          { t: "total", why: "must repeat the name chosen above — anything else is a NameError" },
          { t: ", 2)", why: "cents — the prompt fixed it" },
        ] },
        { t: "total_price", seq: [
          { t: " = sum(prices)\n    return round(", why: "the prompt pinned the rounding; the arithmetic has no room to vary" },
          { t: "total_price", why: "must repeat the name chosen above — anything else is a NameError" },
          { t: ", 2)", why: "cents — the prompt fixed it" },
        ] },
      ] },
    ],
  },
  editing: {
    label: "Proofreading",
    prompt: "Fix the grammar. Reply with the corrected sentence only: “Me and him was going to the library after class to study for the biology exam on Friday.”",
    note: "One path only: 15 of the 18 words are yours verbatim, and each of the three fixes has exactly one right form. Not because it is short — because it is pinned. (A real reply might add a line like “Here’s the corrected sentence:” — that framing is the model’s own and can carry a little watermark. The returned sentence cannot.)",
    code: false,
    seq: [
      { t: "He and I were going to the library after class to study for the biology exam on Friday.", why: "your words, unchanged, apart from three corrections that each have exactly one right form" },
    ],
  },
  extraction: {
    label: "Extraction",
    prompt: "Extract the people’s names and the dates, exactly as they appear, as “Names: …; Dates: …”: “Maya flew to Paris on May 20, 1988, and met Daniel at the airport.”",
    note: "One path only: your own words, in the layout you asked for — zero forks, nothing for a watermark to hold onto. (Any framing line a real reply added around it would be the model’s own — that’s where a sliver of watermark could live.)",
    code: false,
    seq: [
      { t: "Names: Maya, Daniel; Dates: May 20, 1988.", why: "the names, the dates, and the layout are all fixed by your request — nothing left to choose" },
    ],
  },
  quoting: {
    label: "Quotation",
    prompt: "What’s the famous opening line of A Tale of Two Cities?",
    note: "The framing can vary, but every path converges on the same quotation — Dickens’s words (and even his comma) can’t change, so the watermark lives only in the few words around them.",
    code: false,
    seq: [
      { t: "A Tale of Two Cities", why: "the user named the book; the title is theirs, not a choice the model makes" },
      { c: [{ t: "famously begins:" }, { t: "opens with these words:" }, { t: "starts like this:" }] },
      { t: "“It was the best of times, it was the worst of times…”", why: "quotation — the words are Dickens’s, not the model’s; even the comma is copied, not chosen" },
    ],
  },
}

/* ---------- tree walking ---------- */
const isFork = seg => typeof seg === "object" && Boolean(seg.c)
const segText = seg => (typeof seg === "string" ? seg : seg.t)
const segWhy = seg =>
  (typeof seg === "object" && seg.why) ||
  "given the words before it, this is the one right continuation"

const oddsFor = n => {
  if (n === 2) return [0.55, 0.45]
  if (n === 3) return [0.4, 0.33, 0.27]
  return [0.32, 0.26, 0.22, 0.2].slice(0, n)
}
const pickIndex = (r, n) => {
  const odds = oddsFor(n)
  let acc = 0
  for (let i = 0; i < n; i++) {
    acc += odds[i]
    if (r < acc) return i
  }
  return n - 1
}

// Walk the tree with a source of randomness. Returns ordered render pieces,
// the option picked at each fork, and the random numbers drawn.
function walk(seq, rand) {
  const pieces = []
  const picks = []
  const numbers = []
  const go = sq => {
    sq.forEach(seg => {
      if (isFork(seg)) {
        const r = rand(picks.length)
        numbers.push(r)
        const idx = pickIndex(r, seg.c.length)
        picks.push(idx)
        const opt = seg.c[idx]
        pieces.push({ kind: "fork", text: opt.t, fork: seg, pick: idx, ord: picks.length - 1 })
        if (opt.seq) go(opt.seq)
      } else {
        pieces.push({ kind: "locked", text: segText(seg), why: segWhy(seg) })
      }
    })
  }
  go(seq)
  return { pieces, picks, numbers }
}

// Deterministic "first option everywhere" preview of a continuation.
function previewCont(opt, limit) {
  if (!opt.seq || !opt.seq.length) return ""
  const out = []
  const go = sq => {
    sq.forEach(seg => {
      if (isFork(seg)) {
        out.push(seg.c[0].t)
        if (seg.c[0].seq) go(seg.c[0].seq)
      } else out.push(segText(seg))
    })
  }
  go(opt.seq)
  let s = out.join(" ").replace(/\s+/g, " ").trim()
  if (s.length > limit) s = s.slice(0, limit).replace(/\s\S*$/, "") + " …"
  return s
}

function forkStats(seq) {
  const rec = sq => {
    let mn = 0
    let mx = 0
    sq.forEach(seg => {
      if (isFork(seg)) {
        let omn = Infinity
        let omx = -Infinity
        seg.c.forEach(o => {
          const r = o.seq ? rec(o.seq) : { mn: 0, mx: 0 }
          omn = Math.min(omn, r.mn)
          omx = Math.max(omx, r.mx)
        })
        mn += 1 + omn
        mx += 1 + omx
      }
    })
    return { mn, mx }
  }
  return rec(seq)
}

/* ---------- deterministic numbers for the key column ---------- */
function hashStr(s) {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const SECRET_KEY = "claude-watermark-key-7c2f"

/* ---------- shared bits ---------- */
const Tabs = ({ current, onPick }) => (
  <div className="sim-tabs" role="tablist">
    {ORDER.map(name => (
      <button
        key={name}
        type="button"
        role="tab"
        aria-selected={current === name}
        className="sim-tab"
        onClick={() => onPick(name)}
      >
        {SAMPLES[name].label}
      </button>
    ))}
  </div>
)

const Prompt = ({ text }) => (
  <div className="sim-prompt">
    <span className="sim-prompt-k">prompt</span>
    <span>{text}</span>
  </div>
)

// One walked piece (a fork's chosen text or a locked stretch) rendered as
// word tokens. Clicking anywhere in the piece selects the whole segment.
const Piece = ({ piece, interactive, selected, onSelect, animate, animOffset }) => {
  const parts = piece.text.match(/\n[ ]*|[ ]+|[^\s]+/g) || []
  let wordIdx = 0
  const cls =
    "sim-tok " +
    (piece.kind === "fork" ? "free" : "fixed") +
    (selected ? " sel" : "") +
    (interactive ? "" : " still")
  const inner = parts.map((part, i) => {
    if (/^\s/.test(part)) return part
    const delay = Math.min(animOffset + wordIdx, 18) * 0.035
    wordIdx += 1
    return (
      <span
        key={i}
        className={"sim-w" + (animate ? " pop" : "")}
        style={animate ? { animationDelay: `${delay}s` } : undefined}
      >
        {part}
      </span>
    )
  })
  if (!interactive) return <span className={cls}>{inner}</span>
  return (
    <span
      className={cls}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {inner}
    </span>
  )
}

// A full walked path. `splitAt` draws the fork marker before that piece;
// `animateFrom` animates pieces from that index on; `gen` keys the words so
// the animation re-runs on every new generation.
const TokenText = ({ sample, pieces, splitAt, animateFrom, gen, base, interactive, selectedIdx, onSelect }) => {
  let wordsBefore = 0
  return (
    <p className={(base || "sim-text") + (sample.code ? " sim-code" : "")}>
      {pieces.map((p, i) => {
        const animate = animateFrom !== undefined && animateFrom >= 0 && i >= animateFrom
        const node = (
          <React.Fragment key={`${gen}-${i}`}>
            {splitAt === i && (
              <span
                className="sim-split"
                title="the paths split here — everything after was re-decided"
              />
            )}
            <Piece
              piece={p}
              interactive={interactive}
              selected={selectedIdx === i}
              onSelect={interactive ? () => onSelect(i) : undefined}
              animate={animate}
              animOffset={wordsBefore}
            />
            {sample.code ? "" : " "}
          </React.Fragment>
        )
        if (animate) wordsBefore += (p.text.match(/[^\s]+/g) || []).length
        return node
      })}
    </p>
  )
}

const Inspector = ({ sample, piece }) => {
  if (!piece) return null
  if (piece.kind === "fork") {
    const odds = oddsFor(piece.fork.c.length)
    return (
      <div className="sim-inspect">
        <p className="sim-inspect-head">
          “{piece.text}” — <span className="hi">high-entropy</span>. The dice chose among these
          paths:
        </p>
        <div className="sim-opt-rows">
          {piece.fork.c.map((opt, i) => {
            const cont = previewCont(opt, 52)
            return (
              <div key={i} className={"sim-opt-row" + (i === piece.pick ? " flash" : "")}>
                <span className="sim-opt-pct">{Math.round(odds[i] * 100)}%</span>
                <span className={"sim-opt-text" + (sample.code ? " mono" : "")}>
                  {opt.t}
                  {cont && <span className="sim-opt-cont"> → then: {cont}</span>}
                </span>
              </div>
            )
          })}
          {piece.fork.out &&
            piece.fork.out.map(t => (
              <div key={t} className="sim-opt-row out">
                <span className="sim-opt-pct">0%</span>
                <span className="sim-opt-text">
                  <s>{t}</s>{" "}
                  <span className="sim-opt-cont">
                    never on the shortlist — watermarking cannot add it
                  </span>
                </span>
              </div>
            ))}
          {piece.fork.out && (
            <p className="sim-inspect-foot">
              Same shortlist, same odds, with or without the watermark — only the coin flip
              changes.
            </p>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="sim-inspect">
      <p className="sim-inspect-head">locked in — {piece.why}:</p>
      <div className="sim-opt-rows">
        <div className="sim-opt-row flash">
          <span className="sim-opt-pct">≈100%</span>
          <span className={"sim-opt-text" + (sample.code ? " mono" : "")}>{piece.text}</span>
        </div>
        <div className="sim-opt-row">
          <span className="sim-opt-pct">≈0%</span>
          <span className="sim-opt-text">anything else</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- panel 1: one prompt, many paths ---------- */
const firstForkIdx = pieces => {
  const i = pieces.findIndex(p => p.kind === "fork")
  return i >= 0 ? i : pieces.length ? 0 : -1
}

const ForksExplorer = () => {
  const [tab, setTab] = useState("prose")
  const [state, setState] = useState(() => {
    const result = walk(SAMPLES.prose.seq, () => Math.random())
    return { result, splitAt: -1, gen: 0, rolls: 0, log: "", selectedIdx: firstForkIdx(result.pieces) }
  })
  const sample = SAMPLES[tab]

  const generate = (name, fresh) => {
    const s = SAMPLES[name]
    const result = walk(s.seq, () => Math.random())
    setState(prev => {
      let splitOrd = -1
      if (!fresh && prev.result) {
        const n = Math.min(prev.result.picks.length, result.picks.length)
        for (let i = 0; i < n; i++) {
          if (prev.result.picks[i] !== result.picks[i]) {
            splitOrd = i
            break
          }
        }
      }
      const splitAt = splitOrd >= 0 ? result.pieces.findIndex(p => p.kind === "fork" && p.ord === splitOrd) : -1
      const rolls = fresh ? 0 : prev.rolls + 1
      let log = ""
      if (!fresh) {
        if (result.picks.length === 0) log = `roll ${rolls} · no forks — identical every time`
        else if (splitOrd < 0) log = `roll ${rolls} · same path as last time`
        else log = `roll ${rolls} · paths split at fork ${splitOrd + 1}`
      }
      return { result, splitAt, gen: prev.gen + 1, rolls, log, selectedIdx: firstForkIdx(result.pieces) }
    })
  }

  const stats = useMemo(() => forkStats(sample.seq), [sample])
  const forkCount = state.result.picks.length
  const densityWidth = stats.mx ? Math.round((forkCount / 5) * 100) : 0

  return (
    <div className="sim-panel">
      <p className="sim-title">Explorer · One prompt, many paths</p>
      <Tabs
        current={tab}
        onPick={name => {
          setTab(name)
          generate(name, true)
        }}
      />
      <Prompt text={sample.prompt} />
      <TokenText
        sample={sample}
        pieces={state.result.pieces}
        splitAt={state.splitAt >= 0 ? state.splitAt : undefined}
        animateFrom={state.splitAt}
        gen={state.gen}
        interactive
        selectedIdx={state.selectedIdx}
        onSelect={i => setState(prev => ({ ...prev, selectedIdx: i }))}
      />
      <div className="sim-btn-row">
        <button type="button" className="sim-btn primary" onClick={() => generate(tab, false)}>
          Generate again
        </button>
        <span className="sim-count">{state.log}</span>
      </div>
      <Inspector sample={sample} piece={state.result.pieces[state.selectedIdx]} />
      <div className="sim-density">
        <span>High-entropy choices on this path:</span>
        <div className="sim-density-track">
          <div className="sim-density-fill" style={{ width: `${densityWidth}%` }} />
        </div>
        <span className="sim-density-value">
          {forkCount} fork{forkCount === 1 ? "" : "s"}
        </span>
      </div>
      <p className="sim-note">{sample.note}</p>
      <p className="sim-note">
        Forks here show two or three options for legibility — at a genuinely open choice there are
        usually dozens, each with a slice of the odds, which is why free writing accumulates
        watermark faster than the fork count suggests.
      </p>
    </div>
  )
}

/* ---------- panel 2: dice vs. key ---------- */
const numbersLine = numbers =>
  numbers.length
    ? "numbers used: " +
      numbers.slice(0, 5).map(r => r.toFixed(2)).join(" · ") +
      (numbers.length > 5 ? " · …" : "")
    : "numbers used: none — no forks in this answer"

const DiceVsKey = () => {
  const [tab, setTab] = useState("prose")
  const [gens, setGens] = useState(0)
  const sample = SAMPLES[tab]

  const { dice, keyed } = useMemo(() => {
    return {
      dice: walk(sample.seq, () => Math.random()),
      keyed: walk(sample.seq, ord => mulberry32(hashStr(`${SECRET_KEY}|${tab}|${gens}|${ord}`))()),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, gens])

  const animate = gens > 0
  return (
    <div className="sim-panel">
      <p className="sim-title">Generator · Dice vs. key, same forks</p>
      <Tabs
        current={tab}
        onPick={name => {
          setTab(name)
          setGens(0)
        }}
      />
      <Prompt text={sample.prompt} />
      <div className="sim-duel">
        <div className="sim-gen-card">
          <p className="sim-gen-head">
            <span className="sim-swatch dice" />
            ordinary dice
          </p>
          <TokenText
            sample={sample}
            pieces={dice.pieces}
            gen={`d${tab}-${gens}`}
            base="sim-gen-out"
            animateFrom={animate ? 0 : undefined}
          />
          <p className="sim-seed">
            <span className="d">numbers from:</span> a fresh dice roll at every fork
            <br />
            {numbersLine(dice.numbers)}
          </p>
        </div>
        <div className="sim-gen-card">
          <p className="sim-gen-head">
            <span className="sim-swatch key" />
            watermark key
          </p>
          <TokenText
            sample={sample}
            pieces={keyed.pieces}
            gen={`k${tab}-${gens}`}
            base="sim-gen-out"
            animateFrom={animate ? 0 : undefined}
          />
          <p className="sim-seed">
            <span className="k">numbers from:</span> hash(secret key + words so far)
            <br />
            {numbersLine(keyed.numbers)}
          </p>
        </div>
      </div>
      <div className="sim-btn-row">
        <button type="button" className="sim-btn primary" onClick={() => setGens(g => g + 1)}>
          Generate both
        </button>
        <span className="sim-count">
          {gens > 0 ? `generation ${gens} — can you tell the columns apart?` : ""}
        </span>
      </div>
      <p className="sim-note">
        Both columns face exactly the same forks with the same odds — the key never adds an option
        or removes one. Try the Proofreading tab: with no forks, there are no numbers to draw, so
        the two columns are always identical.
      </p>
    </div>
  )
}

/* ---------- panel 3: capacity by example ---------- */
const verdictFor = mx => {
  if (mx >= 4) return "strong"
  if (mx >= 2) return "moderate"
  if (mx >= 1) return "weak"
  return "none"
}

const CAPACITY_ROWS = ORDER.slice()
  .map(name => ({ name, stats: forkStats(SAMPLES[name].seq) }))
  .sort((a, b) => b.stats.mx - a.stats.mx)

const Capacity = () => {
  const [row, setRow] = useState("prose")
  const sample = SAMPLES[row]
  const preview = useMemo(() => walk(sample.seq, () => 0), [sample])

  return (
    <div className="sim-panel">
      <p className="sim-title">Chart · Watermark capacity by example</p>
      <div className="sim-det">
        {CAPACITY_ROWS.map(({ name, stats }) => {
          const sub = stats.mn === stats.mx ? String(stats.mx) : `${stats.mn}–${stats.mx}`
          const width = Math.max(Math.round((1 - Math.exp(-stats.mx / 2.2)) * 100), 1)
          return (
            <button
              key={name}
              type="button"
              className="sim-det-row"
              aria-pressed={row === name}
              onClick={() => setRow(name)}
            >
              <span className="sim-det-name">
                {SAMPLES[name].label}
                <span className="sim-det-sub">
                  {sub} fork{stats.mx === 1 ? "" : "s"} for chance to steer
                </span>
              </span>
              <span className="sim-det-track">
                <span className="sim-det-fill" style={{ width: `${width}%` }} />
              </span>
              <span className="sim-det-pct">{verdictFor(stats.mx)}</span>
            </button>
          )
        })}
      </div>
      <p className="sim-note">
        The bars count the forks on a generated path. All seven are one-sentence answers, so this
        compares tasks at equal length — and detection accumulates: a long open-ended reply clears
        the bar easily, while a very short one may not, however freely it was written.
      </p>
      <div className="sim-det-preview">
        <Prompt text={sample.prompt} />
        <TokenText sample={sample} pieces={preview.pieces} gen={row} />
        <p className="sim-note">{sample.note}</p>
      </div>
      <p className="sim-note">
        Ratings are illustrative, not a real detector’s output. The pattern is what matters: open
        prose leaves chance many forks; exact answers, code, quotes, and reworkings of your own
        words leave few or none — and a check only ever returns a likelihood that the model was
        involved, never an identity.
      </p>
    </div>
  )
}

/* ---------- entry ---------- */
const PANELS = { forks: ForksExplorer, duel: DiceVsKey, capacity: Capacity }

const WatermarkSim = ({ panel }) => {
  const Panel = PANELS[panel]
  return Panel ? <Panel /> : null
}

export default WatermarkSim
