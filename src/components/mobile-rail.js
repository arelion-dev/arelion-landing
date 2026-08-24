import React, { useCallback, useEffect, useRef, useState } from "react"

// Horizontal swipe carousel used on phones only. On wider screens the wrapper
// keeps its own class (a grid) and the dots are hidden, so desktop is unchanged.
// No autoplay: the rail moves only on a swipe or a dot tap. It loops: a copy of
// the set sits on each side, and once the scroll settles the rail jumps back by
// one set, so the reader can keep swiping in either direction forever.
const MOBILE_QUERY = "(max-width: 640px)"
// Scroll-snap settles fast; wait a beat before the rail corrects itself.
const SETTLE_MS = 150

// Index of the card nearest the middle of the rail.
const nearestIndex = rail => {
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
  return best
}

// Distance between a card and its copy one set away.
const setWidth = (rail, count) => {
  const first = rail.children[0]
  const copy = rail.children[count]
  return first && copy ? copy.offsetLeft - first.offsetLeft : 0
}

const MobileRail = ({ className = "", label, children }) => {
  const railRef = useRef(null)
  const touchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)
  const [active, setActive] = useState(0)

  const items = React.Children.toArray(children)
  const count = items.length
  const loop = isMobile && count > 1

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // Start on the middle set, so there is a card to swipe to on both sides.
  useEffect(() => {
    const rail = railRef.current
    if (!rail || !loop) return
    rail.scrollLeft = setWidth(rail, count)
  }, [loop, count])

  // Follow the card at the centre: it drives the dots and the loop correction.
  useEffect(() => {
    const rail = railRef.current
    if (!isMobile || !rail) return
    let frame = 0
    let settle = 0

    // Both copies show the same cards as the middle set, so this jump is
    // invisible: the reader keeps the card they stopped on.
    const rewind = () => {
      if (!loop || touchingRef.current) return
      const width = setWidth(rail, count)
      if (!width) return
      const i = nearestIndex(rail)
      if (i < count) rail.scrollLeft += width
      else if (i >= count * 2) rail.scrollLeft -= width
    }

    const schedule = () => {
      clearTimeout(settle)
      settle = setTimeout(rewind, SETTLE_MS)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setActive(nearestIndex(rail) % count))
      schedule()
    }
    const onTouchStart = () => {
      touchingRef.current = true
    }
    const onTouchEnd = () => {
      touchingRef.current = false
      schedule()
    }

    rail.addEventListener("scroll", onScroll, { passive: true })
    rail.addEventListener("touchstart", onTouchStart, { passive: true })
    rail.addEventListener("touchend", onTouchEnd, { passive: true })
    setActive(nearestIndex(rail) % count)
    return () => {
      rail.removeEventListener("scroll", onScroll)
      rail.removeEventListener("touchstart", onTouchStart)
      rail.removeEventListener("touchend", onTouchEnd)
      cancelAnimationFrame(frame)
      clearTimeout(settle)
    }
  }, [isMobile, loop, count])

  const goTo = useCallback(
    index => {
      const rail = railRef.current
      if (!rail) return
      // Looping: aim at the copy of that card closest to where we are.
      const current = nearestIndex(rail)
      const target = loop
        ? [index, index + count, index + count * 2].reduce((a, b) =>
            Math.abs(b - current) < Math.abs(a - current) ? b : a,
          )
        : index
      const card = rail.children[target]
      if (!card) return
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
      rail.scrollTo({
        left: card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2,
        behavior: reduced ? "auto" : "smooth",
      })
    },
    [loop, count],
  )

  // Copies are read-only decoration: hidden from screen readers and from the
  // tab order, but still tappable, since one of them is always in view.
  const copySet = tag =>
    items.map((item, i) =>
      React.cloneElement(item, {
        key: `${tag}-${i}`,
        "aria-hidden": true,
        tabIndex: -1,
      }),
    )
  const cards = loop ? [...copySet("pre"), ...items, ...copySet("post")] : items

  return (
    <>
      <div
        ref={railRef}
        className={`${className} m-rail`}
        role={isMobile ? "group" : undefined}
        aria-roledescription={isMobile ? "carousel" : undefined}
        aria-label={isMobile ? label : undefined}
      >
        {cards}
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
