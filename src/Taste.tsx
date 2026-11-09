import { marked } from 'marked'
import taste from '../content/taste.md?raw'
import { ThemeToggle } from './ThemeToggle'

// lab-taste rewrites content/taste.md after each series of waves. The first heading is the page
// title, so it is shown as the h1.
const [, title = 'Taste', body = ''] = taste.match(/^#\s+(.*)\n([\s\S]*)$/) ?? []
const html = marked
  .parse(body, { async: false })
  .replace(/<a href="(https?:)/g, '<a target="_blank" rel="noopener noreferrer" href="$1')

export function Taste() {
  return (
    <main className="page page--narrow" tabIndex={-1}>
      <div className="topbar">
        <a className="text-control" href="#/">← interaction lab</a>
        <ThemeToggle />
      </div>
      <h1 className="page__title">{title}</h1>
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  )
}
