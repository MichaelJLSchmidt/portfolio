'use client'

import { type RefObject, useEffect } from 'react'

/*
 * DealRow's "1 / 4" label (D5: UI state, Layout's): an IntersectionObserver on
 * the row's [data-deal-card] items, rooted in the scroll row, writes the most
 * visible card's position into the label element. Written to the DOM
 * directly, so scrolling never re-renders React. Harmless on desktop, where
 * the row does not scroll and the label is hidden.
 */
export function useDealPosition(list: RefObject<HTMLElement | null>, label: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = list.current
    const out = label.current
    if (!root || !out) return
    const cards = [...root.querySelectorAll<HTMLElement>('[data-deal-card]')]
    if (cards.length === 0) return
    const ratios = new Map<Element, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(e.target, e.intersectionRatio)
        let best = 0
        let bestRatio = -1
        cards.forEach((card, i) => {
          const r = ratios.get(card) ?? 0
          if (r > bestRatio + 0.02) {
            best = i
            bestRatio = r
          }
        })
        out.textContent = `${best + 1} / ${cards.length}`
      },
      { root, threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    )
    for (const card of cards) io.observe(card)
    return () => io.disconnect()
  }, [list, label])
}
