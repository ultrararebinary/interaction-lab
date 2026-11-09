// Dev server only. Talks to the /__lab/feedback endpoint in plugins/lab.ts.

export const TAGS = ['idea', 'motion', 'look', 'feel'] as const
export type Tag = (typeof TAGS)[number]

export type Review = {
  verdict: 'keep' | 'drop'
  tags: Tag[]
  note: string
  variant: string | null
  name: string
  wave: number
  savedAt: string
}

const ENDPOINT = '/__lab/feedback'

let reviews: Record<string, Review> = {}
let status = 'loading' as 'loading' | 'ready' | 'error'
const listeners = new Set<() => void>()
type Snapshot = { reviews: Record<string, Review>; status: typeof status }
let snapshot: Snapshot = { reviews, status }

function emit() {
  snapshot = { reviews, status }
  listeners.forEach((l) => l())
}

export const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSnapshot = () => snapshot

fetch(ENDPOINT)
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
  .then((data: { reviews?: Record<string, Review> }) => {
    reviews = data.reviews ?? {}
    status = 'ready'
    emit()
  })
  .catch(() => {
    status = 'error'
    emit()
  })

export async function saveReview(
  slug: string,
  input: Omit<Review, 'savedAt'>,
): Promise<Review> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, ...input }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
  reviews = { ...reviews, [slug]: data.review }
  emit()
  return data.review
}
