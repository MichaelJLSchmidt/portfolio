'use client'

import { useEffect, useRef } from 'react'
import styles from './reading-hairline.module.css'

/*
 * A 1 px reading-progress hairline along the bottom edge of the header, also
 * the reading-progress indicator on phones. Mounted in header.tsx. Owned by
 * the Motion session; contract: docs/contracts.md#reading-hairline.
 *
 * --reading-progress (0 to 1) on [data-reading-hairline] follows the page
 * scroll: a CSS scroll-driven animation (animation-timeline: scroll(root),
 * behind @supports), or Motion's scroll() where that is unsupported. The bar
 * is scaleX(var(--reading-progress)); in reduced motion it is clipped to the
 * same length instead, so nothing transforms. It stays in every tier: it is
 * an indicator that follows the visitor's own scrolling, not an effect.
 */
const cssDriven = () => typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()')

export function ReadingHairline() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || cssDriven()) return
    // Only browsers without scroll-driven animations load Motion's scroll().
    let stop: (() => void) | null = null
    let gone = false
    let last = -1
    import('motion').then(({ scroll }) => {
      if (gone) return
      stop = scroll((progress: number) => {
        const p = Math.round(progress * 1000) / 1000
        if (p === last) return
        last = p
        el.style.setProperty('--reading-progress', String(p))
      })
    })
    return () => {
      gone = true
      stop?.()
    }
  }, [])

  return (
    <div ref={ref} className={styles.hairline} aria-hidden="true" data-reading-hairline="">
      <span className={styles.bar} />
    </div>
  )
}
