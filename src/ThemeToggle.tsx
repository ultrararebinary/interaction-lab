import { useState } from 'react'
import { flushSync } from 'react-dom'

export function ThemeToggle() {
  // index.html sets the starting theme before the first paint.
  const [theme, setTheme] = useState(document.documentElement.dataset.theme ?? 'dark')
  const next = theme === 'dark' ? 'light' : 'dark'

  function toggle() {
    const apply = () => {
      document.documentElement.dataset.theme = next
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', next === 'light' ? '#fdfdfc' : '#111110')
      flushSync(() => setTheme(next))
    }
    // A crossfade, because the whole page changing brightness at once is a flash.
    if (document.startViewTransition) document.startViewTransition(apply)
    else apply()
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Private window or blocked storage: the choice just won't survive a reload.
    }
  }

  return (
    <button className="text-control" onClick={toggle}>
      {next === 'light' ? 'Light' : 'Dark'}
    </button>
  )
}
