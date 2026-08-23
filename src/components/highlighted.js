import React from "react"

// Renders text, wrapping ==marked== spans in a yellow highlight <mark>.
// Used for testimonial quotes so the strongest phrases stand out.
const Highlighted = ({ text }) => (
  <>
    {String(text)
      .split("==")
      .map((segment, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="testi-mark">
            {segment}
          </mark>
        ) : (
          <React.Fragment key={i}>{segment}</React.Fragment>
        ),
      )}
  </>
)

export default Highlighted
