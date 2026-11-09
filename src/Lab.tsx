import { lazy, Suspense } from 'react'
import { Card } from './Card'
import { interactions } from './interactions'
import { ThemeToggle } from './ThemeToggle'

export const REPO = 'https://github.com/ultrararebinary/interaction-lab'
export const X = 'https://x.com/yannworks'
const EXPERIMENTS = 'https://ultrararebinary.github.io/experiments/'
const EMIL = 'https://x.com/emilkowalski/status/2115789995860517254'

// The review panel exists only on the dev server. In a build, import.meta.env.DEV is false,
// so these imports are dropped and the panel's code never reaches the published files.
const ReviewPanel = import.meta.env.DEV ? lazy(() => import('./review/ReviewPanel')) : null
const ReviewBar = import.meta.env.DEV ? lazy(() => import('./review/ReviewBar')) : null

export function Lab() {
  return (
    <main className="page" tabIndex={-1}>
      <h1 className="page__title">interaction lab</h1>

      <div className="note">
        <p>
          Claude builds me six small interactions at a time, following a fixed set of{' '}
          <a href={`${REPO}/blob/main/RULES.md`} target="_blank" rel="noopener noreferrer">rules</a>. I
          try each one, keep the ones I like and drop the rest. Only the keepers end up here,
          newest first, each with a line on why I kept it.
        </p>
        <p>
          Most are ordinary interface parts, like a switch, a field or a menu, done in a way I
          hadn't seen before. They're rough on purpose. When one deserves more care, it moves to{' '}
          <a href={EXPERIMENTS} target="_blank" rel="noopener noreferrer">experiments</a>. The idea
          comes from{' '}
          <a href={EMIL} target="_blank" rel="noopener noreferrer">Emil Kowalski's interaction lab</a>.
        </p>
      </div>

      <nav className="links" aria-label="Links">
        <a className="text-control" href="#/taste">Taste</a>
        <span className="links__dot" aria-hidden="true">·</span>
        <a className="text-control" href={X} target="_blank" rel="noopener noreferrer">X</a>
        <span className="links__dot" aria-hidden="true">·</span>
        <a className="text-control" href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
        <span className="links__dot" aria-hidden="true">·</span>
        <ThemeToggle />
      </nav>

      {ReviewBar && (
        <Suspense fallback={null}>
          <ReviewBar interactions={interactions} />
        </Suspense>
      )}

      {interactions.length === 0 ? (
        <p className="empty">Nothing kept yet. The first waves are still being tried.</p>
      ) : (
        <ul className="grid">
          {interactions.map((interaction) => (
            <li key={interaction.slug}>
              <Card
                interaction={interaction}
                review={
                  ReviewPanel
                    ? (variant) => (
                        <Suspense fallback={null}>
                          <ReviewPanel interaction={interaction} variant={variant} />
                        </Suspense>
                      )
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
