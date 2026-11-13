'use client'

import { useEffect, useRef } from 'react'
import { headerHeight } from '@/design/layout'

/** Where reading happens: from under the header to 40% of the viewport height. */
const BAND_END = 0.4

/*
 * Marks the Minimap tick of the section being read with
 * aria-current="location". An IntersectionObserver watches each tick's
 * [data-section] target inside a band below the header; the last section (in
 * page order) that reaches into the band is current. Above the first section
 * (the hero) no tick is current. Renders an empty, hidden span inside the nav.
 */
export function MinimapObserver() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const nav = ref.current?.closest<HTMLElement>('[data-minimap]')
    if (!nav) return
    const ticks = [...nav.querySelectorAll<HTMLAnchorElement>('[data-minimap-tick]')]
    const targets = ticks
      .map((tick) => document.getElementById(tick.dataset.minimapTick ?? ''))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return

    const inBand = new Set<Element>()
    let current: string | null = null
    const set = (id: string | null) => {
      if (id === current) return
      current = id
      for (const tick of ticks) {
        if (tick.dataset.minimapTick === id) tick.setAttribute('aria-current', 'location')
        else tick.removeAttribute('aria-current')
      }
    }
    const update = () => {
      let id: string | null = null
      for (const t of targets) if (inBand.has(t)) id = t.id
      if (id) return set(id)
      // Between sections keep the last one; above the first section, none.
      if (targets[0].getBoundingClientRect().top > innerHeight * BAND_END) set(null)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target)
          else inBand.delete(e.target)
        }
        update()
      },
      { rootMargin: `-${headerHeight}px 0px -${(1 - BAND_END) * 100}% 0px` },
    )
    for (const t of targets) io.observe(t)
    return () => io.disconnect()
  }, [])

  return <span ref={ref} hidden />
}
