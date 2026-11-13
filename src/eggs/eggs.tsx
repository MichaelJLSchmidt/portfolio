'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useChrome } from '@/lib/chrome'
import { fill } from '@/lib/format'
import { pagePath } from '@/lib/i18n'
import { at, dur } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'
import { attachTableLongPress } from './hand-eggs'
import { eggOn } from './registry'

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/*
 * Global egg wiring: "?" opens the shortcut sheet, M (or a long press on the
 * empty table, by touch) deals a new hand and typing "draw" deals "Coffee?"
 * (start page), and 1 page load in 40 gets a rare card. Each egg's code is
 * imported the first time it fires.
 */
export function Eggs() {
  const chrome = useChrome()
  const { site } = chrome
  const chromeRef = useRef(chrome)
  chromeRef.current = chrome
  const path = pagePath(usePathname())
  const pathRef = useRef(path)
  pathRef.current = path
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let buffer = ''
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return
      if (dialog.current?.open) return
      const home = pathRef.current === '/'
      if (e.key === '?' && eggOn('shortcuts')) {
        e.preventDefault()
        openShortcuts()
        return
      }
      if ((e.key === 'm' || e.key === 'M') && home && eggOn('mulligan')) {
        import('./hand-eggs').then((m) => m.mulligan())
        return
      }
      if (e.key.length === 1) {
        buffer = (buffer + e.key.toLowerCase()).slice(-4)
        if (buffer === 'draw' && home && eggOn('coffee')) {
          buffer = ''
          dispatchEvent(new Event('egg:coffee'))
          const { site, coffeeEgg } = chromeRef.current
          import('@/components/live-region').then((m) =>
            m.announce(fill(site.eggs.coffeeDealt, { title: coffeeEgg.title })),
          )
        }
      }
    }
    addEventListener('keydown', onKey)
    const offLongPress = attachTableLongPress(() => pathRef.current === '/')

    // Rare pull: 1 in 40 loads (or ?rare), once the hand has landed. A language switch remounts the
    // eggs but is no load.
    const load = !('localeSwitch' in document.documentElement.dataset)
    if (load && eggOn('rarePull') && (Math.random() < 1 / 40 || new URLSearchParams(location.search).has('rare'))) {
      const first = document.documentElement.dataset.intro === 'first'
      // Once the first-visit deal has landed (at.firstLoad.cards), plus a beat.
      const C = at.firstLoad.cards
      const delay = first ? C.at + 3 * C.stagger + C.dur + dur.s : 1
      import('./hand-eggs').then((m) => m.rarePull(delay))
    }
    return () => {
      removeEventListener('keydown', onKey)
      offLongPress()
    }
  }, [])

  function openShortcuts() {
    const { site } = chromeRef.current
    const d = dialog.current!
    const h = title.current!
    d.showModal()
    if (readTier() !== 'full') {
      h.textContent = site.shortcuts.title
      return
    }
    h.textContent = ''
    import('motion-plus')
      .then(({ typewriter }) => typewriter(h, site.shortcuts.title, { speed: 'fast' }))
      .catch(() => (h.textContent = site.shortcuts.title))
  }

  return (
    <dialog ref={dialog} className="shortcuts" aria-labelledby="shortcuts-title" closedby="any">
      <h2 id="shortcuts-title" ref={title} className="shortcuts-title">
        {site.shortcuts.title}
      </h2>
      <dl className="shortcuts-list">
        {site.shortcuts.items.map((row) => (
          <div key={row.keys}>
            <dt>
              <kbd>{row.keys}</kbd>
            </dt>
            <dd>{row.label}</dd>
          </div>
        ))}
      </dl>
      <form method="dialog">
        <button className="button" type="submit" autoFocus>
          {site.shortcuts.close}
        </button>
      </form>
    </dialog>
  )
}
