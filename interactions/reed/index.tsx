import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import './reed.css'

export const meta = {
  name: 'Reed',
  gesture: 'drag a row by its grip · the rows it passes bend, then spring back',
  how: 'rows bend from their left end, up to 6°, more the faster you pass · bend spring stiffness 260, damping 9 · rows slide aside with stiffness 420, damping 34',
  component: 'sortable list',
  wave: 2,
  date: '2026-11-10',
}

const TASKS = [
  { id: 'venue', label: 'Book the venue' },
  { id: 'invites', label: 'Send the invites' },
  { id: 'cake', label: 'Order the cake' },
  { id: 'music', label: 'Pick the music' },
  { id: 'clean', label: 'Clean up after' },
]
const ROW = 40
const PITCH = 46
const SLIDE = { k: 420, c: 34 }
const BEND = { k: 260, c: 9, gain: 1.4, max: 6 }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

type Body = { y: number; vy: number; a: number; va: number }
type Drag = { id: string; pointer: number; top: number; offset: number; y: number; vy: number; lastY: number; lastT: number }

export default function Reed() {
  const [lifted, setLifted] = useState<string | null>(null)
  const [positions, setPositions] = useState(() => Object.fromEntries(TASKS.map((t, i) => [t.id, i])))
  const [announce, setAnnounce] = useState('')
  const order = useRef(TASKS.map((t) => t.id))
  const list = useRef<HTMLUListElement>(null)
  const rows = useRef(new Map<string, HTMLLIElement>())
  const bodies = useRef(new Map<string, Body>(TASKS.map((t, i) => [t.id, { y: i * PITCH, vy: 0, a: 0, va: 0 }])))
  const drag = useRef<Drag | null>(null)
  const loop = useRef({ raf: 0, last: 0 })
  const reduced = useRef(false)
  const hintId = useId()

  // Position and bend are written straight to each row: they change on every frame.
  const paint = (id: string) => {
    const b = bodies.current.get(id)!
    const el = rows.current.get(id)
    if (el) el.style.transform = `translate3d(0, ${b.y.toFixed(2)}px, 0) rotate(${b.a.toFixed(3)}deg)`
  }

  const frame = (t: number) => {
    const L = loop.current
    const dt = L.last ? Math.min(0.032, (t - L.last) / 1000) : 1 / 60
    L.last = t
    const d = drag.current
    // The hand's speed fades as soon as it stops moving.
    if (d) d.vy *= Math.pow(0.02, dt)
    let busy = !!d
    order.current.forEach((id, slot) => {
      const b = bodies.current.get(id)!
      if (d && d.id === id) {
        b.y = d.y
        b.a = 0
        b.va = 0
      } else {
        const target = slot * PITCH
        b.vy += (SLIDE.k * (target - b.y) - SLIDE.c * b.vy) * dt
        b.y += b.vy * dt
        // A row bends when the dragged one goes past it, by how fast it goes and how close it is.
        let push = 0
        if (d) {
          const gap = (b.y - d.y) / PITCH
          push = BEND.gain * d.vy * Math.exp(-gap * gap * 1.2)
        }
        b.va += (-BEND.k * b.a - BEND.c * b.va + push) * dt
        b.a = clamp(b.a + b.va * dt, -BEND.max, BEND.max)
        if (Math.abs(target - b.y) > 0.1 || Math.abs(b.vy) > 1 || Math.abs(b.a) > 0.01 || Math.abs(b.va) > 0.2) busy = true
      }
      paint(id)
    })
    if (busy) L.raf = requestAnimationFrame(frame)
    else {
      L.raf = 0
      L.last = 0
    }
  }

  // Reduced motion: rows jump to their slot, nothing bends. Only the dragged row moves, with the hand.
  const snap = () => {
    order.current.forEach((id, slot) => {
      const b = bodies.current.get(id)!
      const d = drag.current
      b.y = d && d.id === id ? d.y : slot * PITCH
      b.vy = b.a = b.va = 0
      paint(id)
    })
  }

  const update = () => {
    if (reduced.current) return snap()
    if (!loop.current.raf) {
      loop.current.last = 0
      loop.current.raf = requestAnimationFrame(frame)
    }
  }

  useLayoutEffect(() => {
    TASKS.forEach((t) => paint(t.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => (reduced.current = query.matches)
    sync()
    query.addEventListener('change', sync)
    const L = loop.current
    return () => {
      query.removeEventListener('change', sync)
      cancelAnimationFrame(L.raf)
      L.raf = 0
    }
  }, [])

  const reorder = (id: string, slot: number) => {
    const next = order.current.filter((x) => x !== id)
    next.splice(slot, 0, id)
    order.current = next
    setPositions(Object.fromEntries(next.map((x, i) => [x, i])))
  }

  const say = (id: string) => {
    const task = TASKS.find((t) => t.id === id)!
    setAnnounce(`${task.label}, position ${order.current.indexOf(id) + 1} of ${TASKS.length}`)
  }

  const onPointerDown = (e: PointerEvent<HTMLLIElement>, id: string) => {
    if (drag.current || e.button !== 0) return
    // On a touch screen only the grip drags, so the rest of the row still scrolls the page.
    if (e.pointerType !== 'mouse' && !(e.target as Element).closest('.reed__grip')) return
    const b = bodies.current.get(id)!
    const top = list.current!.getBoundingClientRect().top
    drag.current = { id, pointer: e.pointerId, top, offset: e.clientY - top - b.y, y: b.y, vy: 0, lastY: e.clientY, lastT: e.timeStamp }
    b.vy = 0
    setLifted(id)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // A synthetic pointer has nothing to capture. The drag still works over the list.
    }
    update()
  }

  const onPointerMove = (e: PointerEvent<HTMLLIElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    const dt = e.timeStamp - d.lastT
    if (dt > 0) d.vy = d.vy * 0.5 + (((e.clientY - d.lastY) / dt) * 1000) * 0.5
    d.lastY = e.clientY
    d.lastT = e.timeStamp
    const raw = e.clientY - d.top - d.offset
    const end = (TASKS.length - 1) * PITCH
    // Past the top or bottom the row still follows, less and less.
    d.y = raw < 0 ? -20 * (1 - 1 / (1 - raw / 80)) : raw > end ? end + 20 * (1 - 1 / (1 + (raw - end) / 80)) : raw
    const slot = clamp(Math.round(d.y / PITCH), 0, TASKS.length - 1)
    if (slot !== order.current.indexOf(d.id)) reorder(d.id, slot)
    update()
  }

  const release = (e: PointerEvent<HTMLLIElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    drag.current = null
    // The row leaves the hand at the hand's speed, then settles into its slot.
    bodies.current.get(d.id)!.vy = d.vy
    setLifted(null)
    say(d.id)
    update()
  }

  // The keyboard moves a row one slot at once, without sliding or bending.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const slot = order.current.indexOf(id)
    const to = e.key === 'ArrowUp' ? slot - 1 : e.key === 'ArrowDown' ? slot + 1 : null
    if (to === null) return
    e.preventDefault()
    if (to < 0 || to >= TASKS.length) return
    reorder(id, to)
    cancelAnimationFrame(loop.current.raf)
    loop.current.raf = 0
    snap()
    say(id)
  }

  return (
    <div className="reed">
      <ul className="reed__list" ref={list} aria-label="Party checklist" style={{ height: (TASKS.length - 1) * PITCH + ROW }}>
        {TASKS.map((task) => (
          <li
            key={task.id}
            ref={(el) => {
              if (el) rows.current.set(task.id, el)
              else rows.current.delete(task.id)
            }}
            className="reed__row"
            data-lifted={lifted === task.id}
            aria-posinset={positions[task.id] + 1}
            aria-setsize={TASKS.length}
            onPointerDown={(e) => onPointerDown(e, task.id)}
            onPointerMove={onPointerMove}
            onPointerUp={release}
            onPointerCancel={release}
          >
            <div className="reed__body">
              <button
                type="button"
                className="reed__grip"
                aria-label={`Move ${task.label}`}
                aria-describedby={hintId}
                onKeyDown={(e) => onKeyDown(e, task.id)}
              >
                <span aria-hidden="true" />
              </button>
              <span className="reed__label">{task.label}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="reed__sr" id={hintId}>
        Up and down arrows move it.
      </p>
      <p className="reed__sr" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
