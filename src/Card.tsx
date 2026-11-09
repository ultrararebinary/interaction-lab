import { Component, useState, type ReactNode } from 'react'
import { formatDate, howFor, type Interaction } from './interactions'

type Props = {
  interaction: Interaction
  /** The review panel, given only by the dev server. */
  review?: (variant: string | null) => ReactNode
}

/**
 * The frame every interaction shares, so they compare at a glance: name and gesture on top,
 * the live stage, then the line that says how it works.
 */
export function Card({ interaction, review }: Props) {
  const { slug, name, gesture, wave, variants, kept, Component: Live } = interaction
  const [variant, setVariant] = useState(variants?.[0])

  return (
    <article className="card" aria-labelledby={`${slug}-name`} data-card={slug}>
      <header className="card__head">
        <h2 className="card__name" id={`${slug}-name`}>
          {name}
        </h2>
        <p className="card__gesture">{gesture}</p>
      </header>

      <div className="card__stage" data-stage={slug}>
        <Guard name={name}>
          <Live key={variant} variant={variant} />
        </Guard>
      </div>

      <div className="card__foot">
        <p className="card__how">
          <span className="visually-hidden">How it works: </span>
          {howFor(interaction, variant)}
        </p>
        {variants && (
          // Switching is instant: you flip between variants many times to compare them.
          <div className="card__variants" role="group" aria-label={`${name} variants`}>
            {variants.map((v) => (
              <button
                key={v}
                className="card__variant"
                aria-pressed={v === variant}
                onClick={() => setVariant(v)}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {kept ? (
        <p className="card__kept">
          <span className="card__kept-date">Kept {formatDate(kept.date)}</span>
          {kept.line}
        </p>
      ) : (
        review && <p className="card__wave">Wave {wave}</p>
      )}

      {review?.(variant ?? null)}
    </article>
  )
}

/** A broken interaction shows its error in its own card instead of taking the page down. */
class Guard extends Component<{ name: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <p className="card__broken">
          {this.props.name} broke: {this.state.error.message}
        </p>
      )
    }
    return this.props.children
  }
}
