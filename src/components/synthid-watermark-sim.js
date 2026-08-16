import React, { useState } from "react"

// One-panel companion for the SynthID watermark article, built on the
// article's own example: "Explain how a suspension bridge carries load."
// Three actions: generate a plain answer, generate the watermarked one,
// paraphrase it. The detector strip replays the key: one tick per token
// (g = 0 or 1), the mean, and the z-score the article's detect() computes.

const PROMPT = "Explain how a suspension bridge carries load."

// Slot template assembled from the two real outputs quoted in the article.
// Option 0 of every slot is the one the secret key favors: picking all
// zeros reproduces the article's watermarked text verbatim, and one of the
// random combinations is the article's control text verbatim.
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
]

const buildText = pick =>
  TEMPLATE.map(slot => (Array.isArray(slot) ? slot[pick(slot.length)] : slot)).join(" ")

const countWords = text => text.split(/\s+/).filter(Boolean).length

// Detector model, scaled to the article's numbers: watermarked text runs a
// mean g near 0.57, which over 400 tokens gives z near 2.8 (the temperature
// 1.0 row of the article's sweep). Human or paraphrased text sits at 0.50.
// Ticks are a shuffled multiset so the mean is stable, not a noisy draw.
const makeTicks = (n, biased) => {
  // floor on the unbiased side: an odd word count must never round the mean
  // above 0.50, or plain text could cross the 0.56 cutoff
  const ones = biased ? Math.round(n * 0.57) : Math.floor(n * 0.5)
  const ticks = Array.from({ length: n }, (_, i) => (i < ones ? 1 : 0))
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ticks[i], ticks[j]] = [ticks[j], ticks[i]]
  }
  return ticks
}

const THRESHOLD = 0.56 // the article's calibrated cutoff (99th pct of human z)
const N_TOKENS = 400 // the length the article's z numbers are quoted at

const runFor = mode => {
  let text
  if (mode === "marked") {
    // the key is deterministic: same prompt, same picks
    text = buildText(() => 0)
  } else if (mode === "para") {
    text = PARAPHRASES[Math.floor(Math.random() * PARAPHRASES.length)]
  } else {
    text = buildText(len => Math.floor(Math.random() * len))
  }
  const ticks = makeTicks(countWords(text), mode === "marked")
  const meanG = ticks.reduce((a, b) => a + b, 0) / ticks.length
  const z = (meanG - 0.5) / Math.sqrt(0.25 / N_TOKENS)
  return { mode, text, ticks, meanG, z, detected: z > THRESHOLD }
}

const CAPTIONS = {
  plain:
    "Random picks among equally good words. The mean g stays at the human baseline of 0.50. Nothing to detect.",
  marked:
    "The key favored one of the equally good words at each choice. The text reads the same; the average gives it away.",
  para:
    "A paraphrase of the watermarked answer: different words, same meaning. The n-grams that carried the signal are gone.",
}

const fmt = (x, d) => x.toFixed(d)

const WatermarkSim = () => {
  const [run, setRun] = useState(() => runFor("plain"))
  const [gen, setGen] = useState(0)
  const fire = mode => {
    setRun(runFor(mode))
    setGen(g => g + 1)
  }

  return (
    <div className="sim-panel">
      <p className="sim-title">Try it · generate, detect, paraphrase</p>
      <div className="sim-prompt">
        <span className="sim-prompt-k">prompt</span>
        <span>{PROMPT}</span>
      </div>
      <div className="sim-btn-row">
        <button type="button" className="sim-btn" onClick={() => fire("plain")}>
          Generate
        </button>
        <button type="button" className="sim-btn primary" onClick={() => fire("marked")}>
          Generate watermarked
        </button>
        <button type="button" className="sim-btn" onClick={() => fire("para")}>
          Paraphrase it
        </button>
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
      <div className="sim-detect">
        <p className="sim-detect-label">detector · replay the key, score each token</p>
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
          mean g {fmt(run.meanG, 2)} · over {N_TOKENS} tokens: z {fmt(run.z, 1)} · cutoff{" "}
          {THRESHOLD}{" "}
          <span className={run.detected ? "sim-verdict hi" : "sim-verdict"}>
            {run.detected ? "detected" : "not detected"}
          </span>
        </p>
      </div>
      <p className="sim-note">{CAPTIONS[run.mode]}</p>
    </div>
  )
}

export default WatermarkSim
