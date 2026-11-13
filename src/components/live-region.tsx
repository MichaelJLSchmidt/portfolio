'use client'

import { useEffect, useRef } from 'react'

let write: ((message: string) => void) | null = null

/** Polite status message for screen readers (settings changes, card flips). */
export function announce(message: string) {
  write?.(message)
}

export function LiveRegion() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    write = (message) => {
      const el = ref.current
      if (!el) return
      el.textContent = ''
      // A fresh text node after a frame makes repeated messages announce again.
      requestAnimationFrame(() => {
        el.textContent = message
      })
    }
    return () => {
      write = null
    }
  }, [])
  return <div ref={ref} className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
}
