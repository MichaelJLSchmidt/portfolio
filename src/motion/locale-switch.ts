import { announce } from '@/components/live-region'
import { headerHeight } from '@/design/layout'
import { LOCALE_KEY, type Locale } from '@/lib/i18n'
import { completeReveals } from './reveal'
import { table } from './table-store'
import { afterTransition } from './view-transition'

/*
 * The language switch (the header's switcher, DE / EN): a client navigation to the
 * same page in the other locale, typed "locale". The root layout (the field,
 * <html>) stays; the [locale] layout remounts with the other words, and every
 * part of the page cross-fades once in place (view-transitions.css,
 * :root[data-locale-switch]). Never a card transition, never the home intro.
 *
 *   before   store the choice, finish running reveals (the old page is
 *            captured final), remember the reading position and whether the
 *            switcher had focus
 *   after    (LocaleSync, in a layout effect before the transition captures
 *            the new page) back to the same place: the section under the
 *            header and how far into it, since the other language runs longer
 *            or shorter; focus back on the switcher; the new title announced
 * Contract: docs/contracts.md#locales.
 */

/** Where the visitor is reading: a section and how far into it (0–1), or a plain offset above the first section. */
type Anchor = { section: string; ratio: number } | { section: null; y: number }

let pending: { anchor: Anchor; focus: boolean } | null = null

/** Remembers the visitor's choice for the root and 404 pages (localStorage; nothing when storage is blocked). */
export function rememberLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    // Storage blocked: the browser languages decide next time.
  }
}

function readAnchor(): Anchor {
  const line = headerHeight
  const sections = [...document.querySelectorAll<HTMLElement>('main [data-section]')]
  let anchor: Anchor = { section: null, y: scrollY }
  for (const el of sections) {
    const r = el.getBoundingClientRect()
    if (r.top > line) break
    if (r.height > 0) anchor = { section: el.dataset.section!, ratio: (line - r.top) / r.height }
  }
  return anchor
}

function restore(anchor: Anchor) {
  const el = anchor.section
    ? document.querySelector<HTMLElement>(`main [data-section="${CSS.escape(anchor.section)}"]`)
    : null
  let y = anchor.section === null ? anchor.y : scrollY
  if (el && anchor.section !== null) {
    const r = el.getBoundingClientRect()
    y = scrollY + r.top + anchor.ratio * r.height - headerHeight
  }
  const max = document.documentElement.scrollHeight - innerHeight
  scrollTo({ top: Math.max(0, Math.min(Math.round(y), max)), behavior: 'instant' })
}

/**
 * Starts a switch: called as the switcher link navigates (`to`: the chosen locale, stored), or
 * when back / forward crosses languages (`null`: nothing is stored).
 */
export function beginLocaleSwitch(to: Locale | null) {
  if (to) rememberLocale(to)
  completeReveals()
  const focus = Boolean(document.activeElement?.closest('[data-locale-switcher]'))
  pending = { anchor: readAnchor(), focus }
  document.documentElement.dataset.localeSwitch = ''
  table.switchLocale()
}

/**
 * The switch has rendered (`locale`: the new one): back to the reading position, the switcher's
 * focus kept, and once the transition is over the new title announced and the cross-fade state ended.
 */
export function settleLocaleSwitch(locale: Locale) {
  const switched = pending
  pending = null
  if (!switched) return
  restore(switched.anchor)
  if (switched.focus)
    document
      .querySelector<HTMLElement>(`[data-locale-switcher] [data-locale="${locale}"]`)
      ?.focus({ preventScroll: true })
  afterTransition(() => {
    delete document.documentElement.dataset.localeSwitch
    const h1 = document.querySelector<HTMLElement>('main h1')
    announce(h1?.querySelector('.sr-only')?.textContent ?? h1?.textContent ?? document.title)
  })
}
