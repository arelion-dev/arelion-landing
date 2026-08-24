import React, { useCallback, useEffect, useRef, useState } from "react"

// Horizontal swipe carousel used on phones only. On wider screens the wrapper
// keeps its own class (a grid) and the dots are hidden, so desktop is unchanged.
// No autoplay: the rail is paused until the reader swipes or taps a dot.
const MOBILE_QUERY = "(max-width: 640px)"

const MobileRail = ({ className = "", label, children }) => {
  const railRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const [active, setActive] = useState(0)
  const count = React.Children.count(children)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // Track the card nearest the rail centre so the dots show the position.
  useEffect(() => {
    const rail = railRef.current
    if (!isMobile || !rail) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const centre = rail.scrollLeft + rail.clientWidth / 2
        let best = 0
        let bestGap = Infinity
        Array.from(rail.children).forEach((card, i) => {
          const gap = Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre)
          if (gap < bestGap) {
            bestGap = gap
            best = i
          }
        })
        setActive(best)
      })
    }
    rail.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => {
      rail.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [isMobile, count])

  const goTo = useCallback(index => {
    const rail = railRef.current
    const card = rail?.children[index]
    if (!card) return
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    rail.scrollTo({
      left: card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    })
  }, [])

  return (
    <>
      <div
        ref={railRef}
        className={`${className} m-rail`}
        role={isMobile ? "group" : undefined}
        aria-roledescription={isMobile ? "carousel" : undefined}
        aria-label={isMobile ? label : undefined}
      >
        {children}
      </div>
      <div className="m-rail-dots">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`m-rail-dot ${i === active ? "is-on" : ""}`}
            aria-label={`${label}: ${i + 1} / ${count}`}
            aria-current={i === active}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </>
  )
}

export default MobileRail
