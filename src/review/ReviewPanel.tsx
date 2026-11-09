import { useEffect, useId, useState, useSyncExternalStore, type FormEvent } from 'react'
import type { Interaction } from '../interactions'
import { getSnapshot, saveReview, subscribe, TAGS, type Tag } from './store'
import './review.css'

type Props = { interaction: Interaction; variant: string | null }

/** Dev server only: Keep or Drop, what weighed in the choice, and a free note. */
export default function ReviewPanel({ interaction, variant }: Props) {
  const { slug, name, wave } = interaction
  const { reviews, status } = useSyncExternalStore(subscribe, getSnapshot)
  const saved = reviews[slug]
  const id = useId()

  const [verdict, setVerdict] = useState<'keep' | 'drop' | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')

  // Fill the form once with the saved review, so a reload shows what was said.
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    if (filled || status !== 'ready') return
    if (saved) {
      setVerdict(saved.verdict)
      setTags(saved.tags)
      setNote(saved.note)
      setState('saved')
    }
    setFilled(true)
  }, [filled, status, saved])

  const dirty =
    !saved ||
    saved.verdict !== verdict ||
    saved.note !== note.trim() ||
    saved.tags.join() !== TAGS.filter((t) => tags.includes(t)).join()

  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setState('idle')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!verdict) return
    setState('saving')
    try {
      await saveReview(slug, {
        verdict,
        tags: TAGS.filter((t) => tags.includes(t)),
        note,
        variant,
        name,
        wave,
      })
      setState('saved')
    } catch (err) {
      setError((err as Error).message)
      setState('error')
    }
  }

  const toggleTag = edit((tag: Tag) =>
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag])),
  )

  return (
    <form className="review" onSubmit={submit} aria-label={`Review ${name}`}>
      <fieldset className="review__verdict">
        <legend className="visually-hidden">Keep or drop {name}</legend>
        {(['keep', 'drop'] as const).map((v) => (
          <label key={v} className="review__choice" data-choice={v}>
            <input
              type="radio"
              name={`${id}-verdict`}
              value={v}
              checked={verdict === v}
              onChange={() => edit(setVerdict)(v)}
            />
            {v === 'keep' ? 'Keep' : 'Drop'}
          </label>
        ))}
      </fieldset>

      <fieldset className="review__tags">
        <legend className="review__legend">What made the call</legend>
        {TAGS.map((tag) => (
          <label key={tag} className="review__tag">
            <input type="checkbox" checked={tags.includes(tag)} onChange={() => toggleTag(tag)} />
            {tag}
          </label>
        ))}
      </fieldset>

      <label className="review__note">
        <span className="visually-hidden">Note</span>
        <textarea
          rows={2}
          value={note}
          placeholder="Why? Anything you'd change?"
          onChange={(e) => edit(setNote)(e.target.value)}
        />
      </label>

      <div className="review__actions">
        <button className="review__save" type="submit" disabled={!verdict || state === 'saving' || (!dirty && state === 'saved')}>
          {state === 'saving' ? 'Saving…' : 'Save'}
        </button>
        <span className="review__status" role="status">
          {state === 'saved' && !dirty
            ? `Saved${variant ? ` (seen as ${variant})` : ''}`
            : state === 'error'
              ? `Not saved: ${error}`
              : saved && dirty
                ? 'Unsaved changes'
                : !verdict
                  ? 'Pick Keep or Drop'
                  : ''}
        </span>
      </div>
    </form>
  )
}
