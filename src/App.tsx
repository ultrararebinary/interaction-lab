import { useEffect, useState } from 'react'
import { Lab } from './Lab'
import { Taste } from './Taste'

// Routes live after the # (…/interaction-lab/#/taste), so GitHub Pages always serves
// index.html and a direct reload of any page works.
function useHashPath() {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [path, setPath] = useState(read)

  useEffect(() => {
    const onChange = () => {
      setPath(read())
      window.scrollTo(0, 0)
      document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return path
}

export function App() {
  const path = useHashPath()

  useEffect(() => {
    document.title = path === '/taste' ? 'Taste · interaction lab' : 'interaction lab'
  }, [path])

  if (path === '/taste') return <Taste />
  return <Lab />
}
