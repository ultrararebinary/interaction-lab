import type { ComponentType } from 'react'
import modules from 'virtual:lab-interactions'
import keptList from '../kept.json'

/** What each interactions/<slug>/index.tsx exports as `meta`. */
export type Meta = {
  /** One original word. */
  name: string
  /** The gesture written on the card: a verb and its result, e.g. "drag the knob · it snaps past halfway". */
  gesture: string
  /** The key values of the effect. One line, or one per variant. */
  how: string | Record<string, string>
  /** The kind of interface component: button, switch, slider, field, list, menu, tooltip, text… */
  component: string
  wave: number
  /** YYYY-MM-DD, the day the wave was built. */
  date: string
  /** Only when the idea depends on a setting: two or three names, the first one shown by default. */
  variants?: string[]
}

export type Kept = { slug: string; date: string; line: string }

export type Interaction = Meta & {
  slug: string
  Component: ComponentType<{ variant?: string }>
  kept?: Kept
}

const kept = keptList as Kept[]

// In UTC, so the month doesn't change with the visitor's time zone.
export const formatDate = (date: string) =>
  new Date(`${date}T00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

function problemsIn(meta: Partial<Meta> | undefined): string[] {
  if (!meta) return ['no `meta` export']
  const problems: string[] = []
  for (const key of ['name', 'gesture', 'component', 'date'] as const) {
    if (typeof meta[key] !== 'string' || !meta[key]) problems.push(`meta.${key} is missing`)
  }
  if (typeof meta.wave !== 'number') problems.push('meta.wave is missing')
  if (meta.variants) {
    if (meta.variants.length < 2 || meta.variants.length > 3) problems.push('meta.variants needs 2 or 3 names')
    if (typeof meta.how === 'object' && meta.variants.some((v) => !(v in (meta.how as object)))) {
      problems.push('meta.how needs one line per variant')
    }
  }
  if (typeof meta.how !== 'string' && typeof meta.how !== 'object') problems.push('meta.how is missing')
  return problems
}

export const interactions: Interaction[] = Object.entries(modules)
  .flatMap(([slug, mod]) => {
    const problems = problemsIn(mod.meta as Partial<Meta> | undefined)
    if (!mod.default) problems.push('no default export')
    if (problems.length) {
      // Shows up in the console, which every wave checks for errors.
      console.error(`interactions/${slug}: ${problems.join('; ')}`)
      return []
    }
    return [
      {
        ...(mod.meta as Meta),
        slug,
        Component: mod.default!,
        kept: kept.find((k) => k.slug === slug),
      },
    ]
  })
  // Newest first: by the day it was kept on the public site, by wave in the lab.
  .sort(
    (a, b) =>
      (b.kept?.date ?? '').localeCompare(a.kept?.date ?? '') ||
      b.wave - a.wave ||
      a.name.localeCompare(b.name),
  )

export const howFor = (interaction: Meta, variant?: string) =>
  typeof interaction.how === 'string'
    ? interaction.how
    : interaction.how[variant ?? interaction.variants?.[0] ?? ''] ?? ''
