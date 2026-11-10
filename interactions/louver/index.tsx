import { useEffect, useId, useRef, useState, type PointerEvent } from 'react'
import './louver.css'

export const meta = {
  name: 'Louver',
  gesture: 'press the slats and slide along them · the ones under your finger turn open',
  how: 'about 9 slats open around your finger, each turning up to 90° · they close in 200 ms, outward from where you let go, 14 ms apart',
  component: 'password field',
  wave: 2,
  date: '2026-11-10',
}

// How far the opening reaches on each side of the finger, in characters.
const REACH = 5
const STAGGER = 14
// The cells are sized in the CSS so that this many characters always fit.
const MAX_LENGTH = 18

type Press = { pointer: number; x: number; moved: boolean; centers: number[]; cell: number; left: number }

export default function Louver() {
  const [value, setValue] = useState('kayak-Tangerine')
  const [caret, setCaret] = useState<number | null>(null)
  const [shown, setShown] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const field = useRef<HTMLDivElement>(null)
  const cells = useRef<HTMLSpanElement>(null)
  const slats = useRef<(HTMLSpanElement | null)[]>([])
  const press = useRef<Press | null>(null)
  const inputId = useId()

  // Openness (0 shut, 1 edge-on) is written straight to each slat: it changes on every move.
  const setSlat = (i: number, open: number, delay = 0) => {
    const el = slats.current[i]
    if (!el) return
    el.style.setProperty('--o', open.toFixed(3))
    el.style.transitionDelay = `${delay}ms`
  }

  const openAround = (clientX: number) => {
    const p = press.current
    if (!p) return
    p.centers.forEach((c, i) => {
      const d = Math.abs(clientX - c) / p.cell
      setSlat(i, d >= REACH ? 0 : Math.cos((Math.PI / 2) * (d / REACH)) ** 2)
    })
  }

  // Follow the real caret of the hidden input, wherever it moves from.
  useEffect(() => {
    const el = input.current!
    const sync = () => setCaret(document.activeElement === el ? el.selectionEnd ?? el.value.length : null)
    const later = () => requestAnimationFrame(sync)
    const events = ['focus', 'blur', 'input', 'keydown', 'keyup', 'select'] as const
    events.forEach((name) => el.addEventListener(name, later))
    document.addEventListener('selectionchange', sync)
    return () => {
      events.forEach((name) => el.removeEventListener(name, later))
      document.removeEventListener('selectionchange', sync)
    }
  }, [])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || press.current) return
    if ((e.target as Element).closest('.louver__eye')) return
    // Keep the hidden input's focus; the field itself never takes it.
    e.preventDefault()
    const row = cells.current!.getBoundingClientRect()
    const first = slats.current[0]?.parentElement
    const cell = first ? first.getBoundingClientRect().width : 15
    const centers = slats.current.slice(0, value.length).map((el) => {
      const r = el!.parentElement!.getBoundingClientRect()
      return r.left + r.width / 2
    })
    press.current = { pointer: e.pointerId, x: e.clientX, moved: false, centers, cell, left: row.left }
    field.current!.dataset.animate = 'false'
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // A synthetic pointer has nothing to capture. The slide still works over the field.
    }
    if (!shown) openAround(e.clientX)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current
    if (!p || p.pointer !== e.pointerId) return
    if (Math.abs(e.clientX - p.x) > 3) p.moved = true
    if (!shown) openAround(e.clientX)
  }

  const release = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current
    if (!p || p.pointer !== e.pointerId) return
    press.current = null
    if (!shown) {
      // The slats shut outward from where the finger left, quickly.
      field.current!.dataset.animate = 'true'
      const at = Math.round((e.clientX - p.left) / p.cell - 0.5)
      p.centers.forEach((_, i) => setSlat(i, 0, Math.abs(i - at) * STAGGER))
    }
    // A tap without a slide puts the caret where it landed, like a normal field.
    if (!p.moved && e.type === 'pointerup') {
      const el = input.current!
      const index = Math.max(0, Math.min(value.length, Math.round((e.clientX - p.left) / p.cell)))
      el.focus()
      el.setSelectionRange(index, index)
    }
  }

  const toggle = (animate: boolean) => {
    const next = !shown
    field.current!.dataset.animate = String(animate)
    // From a click, the slats turn one after another from the left; from the keyboard, all at once.
    slats.current.slice(0, value.length).forEach((_, i) => setSlat(i, next ? 1 : 0, animate ? i * STAGGER : 0))
    setShown(next)
  }

  const chars = [...value]

  return (
    <div className="louver">
      <label className="louver__label" htmlFor={inputId}>
        Password
      </label>
      <div
        ref={field}
        className="louver__field"
        data-animate="false"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <input
          ref={input}
          id={inputId}
          className="louver__input"
          type={shown ? 'text' : 'password'}
          value={value}
          maxLength={MAX_LENGTH}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
        />
        <span className="louver__cells" ref={cells} aria-hidden="true">
          {chars.map((ch, i) => (
            <span className="louver__cell" key={i}>
              <span className="louver__char">{ch}</span>
              <span
                className="louver__slat"
                ref={(el) => {
                  slats.current[i] = el
                }}
                style={{ ['--o' as string]: shown ? 1 : 0 }}
              />
            </span>
          ))}
          {caret !== null && <span className="louver__caret" style={{ ['--i' as string]: caret }} />}
        </span>
        <button
          type="button"
          className="louver__eye"
          aria-pressed={shown}
          aria-label="Show password"
          onClick={(e) => toggle(e.detail > 0)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
