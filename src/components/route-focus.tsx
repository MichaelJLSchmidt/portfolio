'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { cardIdForPath } from '@/lib/hand-data'
import { pagePath } from '@/lib/i18n'
import { afterTransition } from '@/motion/view-transition'
import { announce } from './live-region'

const normalise = (path: string) => path.replace(/\/$/, '') || '/'

/*
 * After every client navigation, once the view transition has finished:
 *   back on the table from a card page: the card takes focus (it has just
 *   folded back into its slot)
 *   the same page in the other language: focus stays where it is (the
 *   switcher link the visitor chose)
 *   anywhere else: focus the page's <h1> (tabIndex -1, without scrolling: a
 *   play leaves the new page at its top)
 * and announce the page title in the polite live region.
 */
export function RouteFocus() {
  const path = normalise(usePathname())
  const previous = useRef<string | null>(null)

  useEffect(() => {
    const from = previous.current
    previous.current = path
    if (from === null || from === path) return
    const left = cardIdForPath(from)
    const languageOnly = pagePath(from) === pagePath(path)

    afterTransition(() => {
      const h1 = document.querySelector<HTMLElement>('main h1')
      const title = h1?.querySelector('.sr-only')?.textContent ?? h1?.textContent ?? document.title
      if (languageOnly) {
        announce(title)
        return
      }
      if (left && pagePath(path) === '/') {
        const card = document.querySelector<HTMLElement>(`.hand-card[data-play="${CSS.escape(left)}"]`)
        if (card && card.getClientRects().length) {
          card.focus({ preventScroll: true })
          announce(title)
          return
        }
      }
      h1?.focus({ preventScroll: true })
      announce(title)
    })
  }, [path])

  return null
}
