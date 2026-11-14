'use client'

import { useEffect, useState } from 'react'
import { announce } from '@/components/live-region'
import { useMotionTier } from '@/motion/use-tier'

/*
 * The lab pages' small client parts: copying a reference ID, the motion tier on screen, and
 * clearing a stored value.
 */

/**
 * Copy on click: every button with data-copy="<id>" on the page (one listener for all of them).
 * The button shows "Copied" for a moment; the live region says it too.
 */
export function CopyIds() {
  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      const button = (e.target as Element | null)?.closest<HTMLElement>('[data-copy]')
      if (!button) return
      const id = button.dataset.copy!
      try {
        await navigator.clipboard.writeText(id)
      } catch {
        // No clipboard (an insecure origin): select the text instead, for a manual copy.
        const range = document.createRange()
        range.selectNodeContents(button)
        getSelection()?.removeAllRanges()
        getSelection()?.addRange(range)
        return
      }
      button.dataset.copied = ''
      announce(`Copied ${id}`)
      setTimeout(() => delete button.dataset.copied, 1200)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return null
}

/** The motion tier this page runs in (html[data-motion]). */
export function TierBadge() {
  const tier = useMotionTier()
  return (
    <span className="tool-tier" data-tier={tier}>
      Motion tier: <strong>{tier}</strong>
      {tier === 'full' ? ' (the system allows motion)' : ' (the system asks for reduced motion)'}
    </span>
  )
}

/** A stored value: what it holds now, and a button that removes it. */
export function StoredValue({ storage, name }: { storage: 'sessionStorage' | 'localStorage'; name: string }) {
  const [value, setValue] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    try {
      setValue(window[storage].getItem(name))
    } catch {
      setValue(null)
    }
  }, [storage, name])
  const clear = () => {
    try {
      window[storage].removeItem(name)
    } catch {
      // Storage blocked: nothing to clear.
    }
    setValue(null)
    announce(`Cleared ${name}`)
  }
  return (
    <span className="tool-stored">
      <code>{value === undefined ? '…' : value === null ? 'not set' : JSON.stringify(value)}</code>
      <button type="button" className="tool-button" onClick={clear} disabled={value === null}>
        Clear
      </button>
    </span>
  )
}
