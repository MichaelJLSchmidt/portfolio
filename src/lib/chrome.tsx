'use client'

import { type ReactNode, createContext, use, useMemo } from 'react'
import { type Chrome, type ChromeData, buildChrome } from './hand-data'

/*
 * The active locale's chrome on the client. The [locale] layout passes its
 * slim data (site labels, the hand's copy, the Coffee card; never page text)
 * to <ChromeProvider>, so a page ships only its own locale's chrome (D7).
 *   React components   useChrome()
 *   other client code  activeChrome() (eggs, announcements: browser only)
 * Switching the language re-renders the provider with the other locale's data;
 * nothing remounts. Contract: docs/contracts.md#locales.
 */
const ChromeContext = createContext<Chrome | null>(null)

let active: Chrome | null = null

export function ChromeProvider({ data, children }: { data: ChromeData; children: ReactNode }) {
  const chrome = useMemo(() => buildChrome(data), [data])
  // Browser only: during the static build both locales render in one process.
  if (typeof window !== 'undefined') active = chrome
  return <ChromeContext value={chrome}>{children}</ChromeContext>
}

export function useChrome(): Chrome {
  const chrome = use(ChromeContext)
  if (!chrome) throw new Error('useChrome() needs <ChromeProvider> (src/app/[locale]/layout.tsx).')
  return chrome
}

/** The chrome of the page on screen, for code outside React (browser only). */
export function activeChrome(): Chrome {
  if (!active) throw new Error('activeChrome() runs before <ChromeProvider> has rendered.')
  return active
}
