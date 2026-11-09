import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import type { Plugin } from 'vite'

// The lab's own plugin. It does two things:
//
// 1. It writes the module `virtual:lab-interactions`, the list of interactions the site imports.
//    On the dev server that is every folder in interactions/. In a build it is only the slugs in
//    kept.json, so a card that wasn't kept never reaches the published files.
// 2. On the dev server only, it answers /__lab/feedback: GET returns every review, POST saves one
//    to .lab/feedback.json. `vite build` and `vite preview` never run this part.

const VIRTUAL = 'virtual:lab-interactions'
const RESOLVED = '\0' + VIRTUAL
const TAGS = ['idea', 'motion', 'look', 'feel'] as const
const ENDPOINT = '/__lab/feedback'

type Review = {
  verdict: 'keep' | 'drop'
  tags: (typeof TAGS)[number][]
  note: string
  variant: string | null
  name: string
  wave: number
  savedAt: string
}

type FeedbackFile = { version: 1; reviews: Record<string, Review> }

export function lab(): Plugin {
  let root = process.cwd()
  let isBuild = false

  const interactionsDir = () => join(root, 'interactions')
  const labDir = () => join(root, '.lab')
  const feedbackPath = () => join(labDir(), 'feedback.json')

  const listSlugs = () =>
    existsSync(interactionsDir())
      ? readdirSync(interactionsDir(), { withFileTypes: true })
          .filter((d) => d.isDirectory() && existsSync(join(interactionsDir(), d.name, 'index.tsx')))
          .map((d) => d.name)
          .sort()
      : []

  const readKept = (): { slug: string }[] =>
    JSON.parse(readFileSync(join(root, 'kept.json'), 'utf8'))

  const readFeedback = (): FeedbackFile => {
    if (!existsSync(feedbackPath())) return { version: 1, reviews: {} }
    return JSON.parse(readFileSync(feedbackPath(), 'utf8'))
  }

  // Written to a temporary file first, so a crash mid-write can't leave half a JSON file.
  const writeFeedback = (data: FeedbackFile) => {
    mkdirSync(labDir(), { recursive: true })
    const tmp = feedbackPath() + '.tmp'
    writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n')
    renameSync(tmp, feedbackPath())
  }

  return {
    name: 'interaction-lab',

    configResolved(config) {
      root = config.root
      isBuild = config.command === 'build'
    },

    resolveId(id) {
      if (id === VIRTUAL) return RESOLVED
    },

    load(id) {
      if (id !== RESOLVED) return
      const all = listSlugs()
      let slugs = all
      if (isBuild) {
        slugs = readKept().map((k) => k.slug)
        const missing = slugs.filter((s) => !all.includes(s))
        if (missing.length) {
          this.error(`kept.json lists ${missing.join(', ')}, but interactions/ has no such folder`)
        }
      }
      const imports = slugs.map(
        (slug, i) => `import * as m${i} from ${JSON.stringify(join(interactionsDir(), slug, 'index.tsx'))}`,
      )
      const entries = slugs.map((slug, i) => `${JSON.stringify(slug)}: m${i}`)
      return `${imports.join('\n')}\nexport default { ${entries.join(', ')} }\n`
    },

    configureServer(server) {
      // A new wave adds folders while the server runs: rebuild the list and reload the page.
      const refresh = (path: string) => {
        if (!path.startsWith(interactionsDir())) return
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.add(interactionsDir())
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
      server.watcher.on('unlinkDir', refresh)

      server.middlewares.use(ENDPOINT, (req: IncomingMessage, res: ServerResponse) => {
        const reply = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }

        if (req.method === 'GET') return reply(200, readFeedback())
        if (req.method !== 'POST') return reply(405, { error: 'GET or POST only' })

        let raw = ''
        req.on('data', (chunk) => (raw += chunk))
        req.on('end', () => {
          try {
            const body = JSON.parse(raw)
            const review = validate(body, listSlugs())
            const data = readFeedback()
            data.reviews[body.slug] = review
            writeFeedback(data)
            reply(200, { slug: body.slug, review })
          } catch (error) {
            reply(400, { error: (error as Error).message })
          }
        })
      })
    },
  }
}

function validate(body: Record<string, unknown>, slugs: string[]): Review {
  const { slug, verdict, tags, note, variant, name, wave } = body
  if (typeof slug !== 'string' || !slugs.includes(slug)) throw new Error('Unknown interaction')
  if (verdict !== 'keep' && verdict !== 'drop') throw new Error('Pick Keep or Drop')
  if (!Array.isArray(tags) || !tags.every((t) => (TAGS as readonly string[]).includes(t))) {
    throw new Error(`Tags must be among ${TAGS.join(', ')}`)
  }
  if (typeof note !== 'string' || note.length > 2000) throw new Error('The note must be text, 2000 characters at most')
  if (variant !== null && typeof variant !== 'string') throw new Error('Bad variant')
  if (typeof name !== 'string' || typeof wave !== 'number') throw new Error('Missing name or wave')
  return {
    verdict,
    tags: [...new Set(tags)] as Review['tags'],
    note: note.trim(),
    variant: variant as string | null,
    name,
    wave,
    savedAt: new Date().toISOString(),
  }
}
