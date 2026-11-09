import { useSyncExternalStore } from 'react'
import type { Interaction } from '../interactions'
import { getSnapshot, subscribe } from './store'
import './review.css'

/** Dev server only: says where reviews go and how much of the latest wave is reviewed. */
export default function ReviewBar({ interactions }: { interactions: Interaction[] }) {
  const { reviews, status } = useSyncExternalStore(subscribe, getSnapshot)
  const latest = Math.max(...interactions.map((i) => i.wave), 0)
  const wave = interactions.filter((i) => i.wave === latest)
  const done = wave.filter((i) => reviews[i.slug]).length

  return (
    <section className="review-bar" aria-label="Local review">
      <p>
        <strong>Local review.</strong> Your reviews are saved in <code>.lab/feedback.json</code> on
        this Mac. The published site has no panel.
      </p>
      <p className="review-bar__count" aria-live="polite">
        {status === 'error'
          ? 'Could not reach the review endpoint. Is this the dev server?'
          : status === 'loading'
            ? 'Loading reviews…'
            : `Wave ${latest}: ${done} of ${wave.length} reviewed`}
      </p>
    </section>
  )
}
