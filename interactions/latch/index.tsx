import { useId, useRef, useState, type PointerEvent } from 'react'
import './latch.css'

export const meta = {
  name: 'Latch',
  gesture: 'drag the knob · it snaps past halfway',
  how: 'sticks 6 px before the middle, then jumps · a flick decides · settles in 220 ms, no overshoot',
  component: 'switch',
  wave: 0,
  date: '2026-11-09',
}

// Track 96 px, knob 44 px, 4 px inset on each side: the knob travels 44 px.
const TRAVEL = 44
const MID = TRAVEL / 2
const HOLD = 6
// How far ahead of the release a flick is projected, in ms.
const PROJECT = 120

// Near the middle the knob holds back, then jumps across. That jump is the latch.
function detent(x: number) {
  if (x < MID && x > MID - HOLD) return MID - HOLD
  if (x >= MID && x < MID + HOLD) return MID + HOLD
  return x
}

// Past either end the knob still moves, less and less.
function rubber(x: number) {
  if (x < 0) return -10 * (1 - 1 / (1 - x / 30))
  if (x > TRAVEL) return TRAVEL + 10 * (1 - 1 / (1 + (x - TRAVEL) / 30))
  return x
}

type Drag = {
  pointer: number
  startX: number
  from: number
  x: number
  moved: boolean
  samples: { t: number; x: number }[]
}

export default function Latch() {
  const [on, setOn] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const drag = useRef<Drag | null>(null)
  const labelId = useId()

  // The knob position lives in CSS variables written here, not in React state: it changes on
  // every pointer move, and the transition must start from wherever the knob is.
  const paint = (x: number, animate: boolean) => {
    const el = ref.current
    if (!el) return
    el.dataset.animate = String(animate)
    el.style.setProperty('--x', `${x}px`)
    el.style.setProperty('--p', String(Math.min(1, Math.max(0, x / TRAVEL))))
  }

  const settle = (next: boolean, animate: boolean) => {
    paint(next ? TRAVEL : 0, animate)
    setOn(next)
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    drag.current = {
      pointer: e.pointerId,
      startX: e.clientX,
      from: on ? TRAVEL : 0,
      x: on ? TRAVEL : 0,
      moved: false,
      samples: [{ t: e.timeStamp, x: e.clientX }],
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // A synthetic pointer has nothing to capture. The drag still works inside the switch.
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    const dx = e.clientX - d.startX
    if (!d.moved && Math.abs(dx) < 3) return
    d.moved = true
    d.x = d.from + dx
    d.samples.push({ t: e.timeStamp, x: e.clientX })
    while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > 100) d.samples.shift()
    paint(detent(rubber(d.x)), false)
  }

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    drag.current = null
    if (!d.moved) {
      settle(!on, true)
      return
    }
    const first = d.samples[0]
    const last = d.samples[d.samples.length - 1]
    const velocity = last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0
    settle(d.x + velocity * PROJECT > MID, true)
  }

  // A vertical swipe on a phone scrolls the page and cancels the drag: back to where it was.
  const onPointerCancel = () => {
    if (!drag.current) return
    drag.current = null
    settle(on, true)
  }

  return (
    <div className="latch-demo">
      <span className="latch-demo__label" id={labelId}>
        Haptics
      </span>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        className="latch"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={(e) => {
          // Pointers are handled above. A click with detail 0 comes from Space or Enter:
          // the keyboard flips the switch at once, without the slide.
          if (e.detail === 0) settle(!on, false)
        }}
      >
        <span className="latch__fill" aria-hidden="true" />
        <span className="latch__knob" aria-hidden="true" />
      </button>
    </div>
  )
}
