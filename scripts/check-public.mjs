// Runs after every `vite build`, locally and on GitHub. It fails the build when the published files
// contain the review panel or an interaction that wasn't kept, and when a kept one is missing.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')

const files = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (/\.(js|css|html)$/.test(entry.name)) files.push(path)
  }
}
walk(DIST)
const bundle = files.map((f) => readFileSync(f, 'utf8')).join('\n')

const problems = []

// Strings that exist only in the review panel and its endpoint.
for (const marker of ['__lab/feedback', 'What made the call', 'Local review']) {
  if (bundle.includes(marker)) problems.push(`the review panel is in the build ("${marker}")`)
}

// Each interaction is recognised by its gesture line, which is unique to it.
const kept = new Set(JSON.parse(readFileSync(join(ROOT, 'kept.json'), 'utf8')).map((k) => k.slug))
const dir = join(ROOT, 'interactions')
const slugs = existsSync(dir)
  ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : []

for (const slug of slugs) {
  const source = readFileSync(join(dir, slug, 'index.tsx'), 'utf8')
  const gesture = source.match(/gesture:\s*(['"`])(.*?)\1/)?.[2]
  if (!gesture) {
    problems.push(`interactions/${slug}: no gesture line found in meta`)
    continue
  }
  const inBuild = bundle.includes(gesture)
  if (kept.has(slug) && !inBuild) problems.push(`${slug} is kept but missing from the build`)
  if (!kept.has(slug) && inBuild) problems.push(`${slug} was not kept but is in the build`)
}

if (problems.length) {
  console.error(`Public build check failed:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log(
  `Public build check: no review panel, ${kept.size} kept interaction(s) in, ` +
    `${slugs.length - kept.size} not kept left out.`,
)
