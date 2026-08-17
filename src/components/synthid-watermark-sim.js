import React, { useState } from "react"

// One-panel companion for the SynthID watermark article, built on the
// article's own example: "Explain how a suspension bridge carries load."
// The three states sit one under the other, so the semantic equivalence is
// visible at a glance: a plain answer, the watermarked one, a paraphrase of
// it. Each row carries its own detector strip (one g-value tick per token,
// the mean, and the z-score the article's detect() computes).
//
// No model runs in the page. Reroll swaps in other wordings of the same
// answer, prepared from the two real outputs the article quotes.

const PROMPT = "Explain how a suspension bridge carries load."

// Slot template assembled from the two real outputs quoted in the article.
// All zeros reproduces the watermarked text verbatim (the key's picks);
// all ones reproduces the control text verbatim.
const TEMPLATE = [
  "A suspension bridge carries load through a",
  [
    "distinct chain of tension and compression forces that transfers",
    "specific sequence of mechanical forces that transfer",
  ],
  "the weight of the bridge and",
  ["its traffic", "traffic"],
  [
    "to tall anchorages on either side of the river or valley.",
    "from the deck up through cables, into towers, and finally into the ground via anchorages.",
  ],
]

// Prepared rewrites of the watermarked answer: different words, same meaning.
const PARAPHRASES = [
  "The deck hangs from vertical cables that hand its weight to the two main cables, and those pull against the anchorages set into the ground at both ends of the span.",
  "Weight on the deck travels up the hangers into the main cables, which drag on the towers and the anchorages until the ground takes the load.",
  "Cables slung over the towers carry the deck, and their pull is taken up by the anchorages buried at each end of the bridge.",
]

const buildText = pick =>
  TEMPLATE.map(slot => (Array.isArray(slot) ? slot[pick(slot.length)] : slot)).join(" ")

const MARKED_TEXT = buildText(() => 0)

// Detector model, scaled to the article's numbers: watermarked text runs a
// mean g near 0.57, which over 400 tokens gives z near 2.8 (the temperature
// 1.0 row of the article's sweep). Human or paraphrased text sits at 0.50.
// Ticks are a shuffled multiset so the mean is stable, not a noisy draw;
// floor on the unbiased side so plain text can never cross the cutoff.
const THRESHOLD = 0.56 // the article's calibrated cutoff (99th pct of human z)
const N_TOKENS = 400 // the length the article's z numbers are quoted at

const score = (text, biased) => {
  const n = text.split(/\s+/).filter(Boolean).length
  const ones = biased ? Math.round(n * 0.57) : Math.floor(n * 0.5)
  const ticks = Array.from({ length: n }, (_, i) => (i < ones ? 1 : 0))
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ticks[i], ticks[j]] = [ticks[j], ticks[i]]
  }
  const meanG = ones / n
  const z = (meanG - 0.5) / Math.sqrt(0.25 / N_TOKENS)
  return { text, ticks, meanG, z, detected: z > THRESHOLD }
}

const fmt = (x, d) => x.toFixed(d)

const Row = ({ label, run, gen, onReroll }) => (
  <div className="sim-row">
    <div className="sim-row-head">
      <span className="sim-row-label">{label}</span>
      {onReroll && (
        <button type="button" className="sim-btn" onClick={onReroll}>
          reroll
        </button>
      )}
    </div>
    <p className="sim-out" key={gen}>
      {run.text.split(" ").map((w, i) => (
        <React.Fragment key={i}>
          <span
            className={gen > 0 ? "sim-w pop" : "sim-w"}
            style={gen > 0 ? { animationDelay: `${Math.min(i, 18) * 0.02}s` } : undefined}
          >
            {w}
          </span>{" "}
        </React.Fragment>
      ))}
    </p>
    <div
      className="sim-strip"
      role="img"
      aria-label={`Per-token g-values, mean ${fmt(run.meanG, 2)}`}
    >
      {run.ticks.map((t, i) => (
        <span key={`${gen}-${i}`} className={t ? "sim-tick hi" : "sim-tick"} />
      ))}
    </div>
    <p className="sim-meter">
      mean g {fmt(run.meanG, 2)} · z {fmt(run.z, 1)}{" "}
      <span className={run.detected ? "sim-verdict hi" : "sim-verdict"}>
        {run.detected ? "detected" : "not detected"}
      </span>
    </p>
  </div>
)

const WatermarkSim = () => {
  // The plain row starts on the article's control text (all ones); the
  // watermarked row is fixed: same prompt, same key, same picks.
  const [plain, setPlain] = useState(() => ({ run: score(buildText(() => 1), false), gen: 0 }))
  const [marked] = useState(() => ({ run: score(MARKED_TEXT, true), gen: 0 }))
  const [para, setPara] = useState(() => ({ run: score(PARAPHRASES[0], false), gen: 0 }))

  return (
    <div className="sim-panel">
      <p className="sim-title">One prompt · three states</p>
      <div className="sim-prompt">
        <span className="sim-prompt-k">prompt</span>
        <span>{PROMPT}</span>
      </div>
      <Row
        label="no watermark · random picks among the equal words"
        run={plain.run}
        gen={plain.gen}
        onReroll={() =>
          setPlain(p => ({
            run: score(buildText(len => Math.floor(Math.random() * len)), false),
            gen: p.gen + 1,
          }))
        }
      />
      <Row
        label="watermarked · the key picks, so it always lands here"
        run={marked.run}
        gen={marked.gen}
      />
      <Row
        label="after one paraphrase of the watermarked answer"
        run={para.run}
        gen={para.gen}
        onReroll={() =>
          setPara(p => ({
            run: score(
              PARAPHRASES[(PARAPHRASES.indexOf(p.run.text) + 1) % PARAPHRASES.length],
              false,
            ),
            gen: p.gen + 1,
          }))
        }
      />
      <p className="sim-note">
        Same meaning three times; only the average separates them. Reroll swaps in other wordings
        the sampler could have picked. No model runs in this page. z is computed at {N_TOKENS}{" "}
        tokens, the article's length; the cutoff is the calibrated {THRESHOLD}.
      </p>
    </div>
  )
}

export default WatermarkSim
