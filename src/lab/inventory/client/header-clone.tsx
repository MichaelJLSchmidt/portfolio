'use client'

import { useEffect, useRef } from 'react'

/*
 * A part of the live header, cloned at runtime into the inventory: the markup the header
 * component rendered, with its own classes, so the header's links can be shown at rest, on hover
 * and on focus side by side (ForcedStates) without writing them again. The clone is inert and
 * hidden from assistive technology; ids are dropped (SVG references still find the originals).
 *   part   "tray" (About, Lab, the language switcher) or "slot" (the home slot)
 *   target which link in it takes the state: "about", "lab", "locale", "slot"
 *   force  "hover" | "focus" | "current" (aria-current="page") | undefined (at rest)
 *   back   the slot in its Back mode (detail pages)
 */
type Props = {
  part: 'tray' | 'slot'
  target: 'about' | 'lab' | 'locale' | 'slot'
  force?: 'hover' | 'focus' | 'current'
  back?: boolean
}

const find = {
  tray: () => document.querySelector('header[data-chrome] [data-locale-switcher]')?.parentElement ?? null,
  slot: () => document.querySelector('header[data-chrome] a[data-slot-mode]'),
}
const targets = {
  about: 'nav:not([data-locale-switcher]) li:not([data-lab-link]) a',
  lab: '[data-lab-link] a',
  locale: '[data-locale-switcher] a:not([aria-current])',
  slot: ':scope',
}

export function HeaderClone({ part, target, force, back }: Props) {
  const box = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const source = find[part]()
    const host = box.current
    if (!source || !host) return
    const clone = source.cloneNode(true) as HTMLElement
    for (const el of [clone, ...clone.querySelectorAll('[id]')]) el.removeAttribute('id')
    clone.style.viewTransitionName = ''
    for (const el of clone.querySelectorAll<HTMLElement>('[style*="view-transition-name"]'))
      el.style.viewTransitionName = ''
    if (back) clone.dataset.slotMode = 'back'
    const link = target === 'slot' ? clone : clone.querySelector<HTMLElement>(targets[target])
    if (link) {
      if (force === 'current') link.setAttribute('aria-current', 'page')
      else if (force) link.dataset.force = force
      if (force !== 'current' && link.getAttribute('aria-current') === 'page') link.removeAttribute('aria-current')
    }
    clone.setAttribute('inert', '')
    clone.setAttribute('aria-hidden', 'true')
    // Custom properties the header sets on itself (its chips' hairline and fill) come along.
    const from = getComputedStyle(source.closest('header') ?? source)
    const here = getComputedStyle(host)
    for (const prop of Array.from(from)) {
      if (!prop.startsWith('--')) continue
      const value = from.getPropertyValue(prop)
      if (value !== here.getPropertyValue(prop)) host.style.setProperty(prop, value)
    }
    host.replaceChildren(clone)
  }, [part, target, force, back])
  return <span ref={box} className="inv-clone" data-part={part} />
}
