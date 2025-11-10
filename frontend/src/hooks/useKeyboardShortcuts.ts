import { useEffect, useRef } from 'react'

type Handlers = {
  focusSearch: () => void
  gotoFeed: () => void
  gotoForums: () => void
  toggleHelp: () => void
}

export function useKeyboardShortcuts({ focusSearch, gotoFeed, gotoForums, toggleHelp }: Handlers) {
  const buffer = useRef('')
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === '/') {
        e.preventDefault()
        focusSearch()
        return
      }
      buffer.current = (buffer.current + e.key).slice(-2)
      if (buffer.current === 'gf') gotoFeed()
      if (buffer.current === 'go') gotoForums()
      if (e.key === '?') toggleHelp()
      ;(onKeyDown as any)._t && clearTimeout((onKeyDown as any)._t)
      ;(onKeyDown as any)._t = setTimeout(() => (buffer.current = ''), 600)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusSearch, gotoFeed, gotoForums, toggleHelp])
}
