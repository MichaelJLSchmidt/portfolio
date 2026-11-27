import { type LogoGradient, logoGradientNames } from '@/design/palette'
import { identityOf } from '@/lib/hand-data'
import { type TableState, table } from './table-store'
import { duration as D, ease, headerSweep as S } from './tokens'
import { readTier } from './use-tier'

/*
 * The header follows the card (tokens.ts headerSweep): while a card is hovered or keyboard-focused,
 * the header's gradient (the logo's F card, the About and Lab markers on ink pages, the language
 * capsule's edge) turns to that card's logo gradient; while one is played or open, to the played
 * card's (on touch, where nothing hovers, the play is the moment); otherwise back to the page
 * load's gradient. The table store decides: the hovered card, else the field's card identity (a
 * play, a card page; a return home clears it at once), else none.
 *
 * html[data-header-gradient] names the gradient (palette.ts headerGradientCss(); the pre-paint
 * script sets it on a card page's first load), html[data-header-sweep] its direction ("in" toward a
 * card, "out" back, which runs headerSweep.back of the times). The colours ease in CSS (registered
 * properties, header.module.css), so every change retargets from where they are. The sheens
 * ([data-sheen] in the header: the M card, the F card, the capsule) each cross their element once
 * per change; one already crossing is left to finish, so a quick pass over the cards never
 * restarts or queues them. Reduced motion: no sheen, and the colours crossfade briefly (header.module.css).
 */
type SheenName = 'm' | 'f' | 'capsule'

const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`

/** The gradient the header should show for a table state (null: the page load's). */
export function headerGradientFor(s: TableState): LogoGradient | null {
  const id = s.hoverCard ? identityOf(s.hoverCard) : s.field.spread === 1 ? s.field.identity : null
  return id && (logoGradientNames as readonly string[]).includes(id) ? (id as LogoGradient) : null
}

/** When each sheen ends (ms, performance.now()): one still crossing its element is left to finish. */
const ends = new WeakMap<Element, number>()

/**
 * Runs the sheens across the header, M card first, the capsule last: each a band moved by WAAPI
 * transform and opacity (compositor only) inside its element's mask or clip (header.tsx).
 */
function sweep(header: HTMLElement, back: boolean) {
  const k = back ? S.back : 1
  const now = performance.now()
  for (const el of header.querySelectorAll<HTMLElement>('[data-sheen]')) {
    if ((ends.get(el) ?? 0) > now) continue
    const at = (S[el.dataset.sheen as SheenName] ?? 0) * k
    const dur = D.headerSheen * k
    ends.set(el, now + (at + dur) * 1000)
    // The band crosses from data-sheen-from to data-sheen-to (% of its own width).
    el.animate(
      [
        { transform: `translateX(${el.dataset.sheenFrom ?? '-100%'})`, opacity: 0 },
        { opacity: 1, offset: 0.15 },
        { opacity: 1, offset: 0.85 },
        { transform: `translateX(${el.dataset.sheenTo ?? '100%'})`, opacity: 0 },
      ],
      { duration: dur * 1000, delay: at * 1000, easing: bezier(ease.inOut) },
    )
  }
}

/** Keeps html[data-header-gradient] in step with the table and sweeps `header` on every change. */
export function watchHeaderGradient(header: HTMLElement): () => void {
  const root = document.documentElement
  const apply = (next: LogoGradient | null, animate: boolean) => {
    const current = (root.dataset.headerGradient as LogoGradient | undefined) ?? null
    if (next === current) return
    const back = next === null
    root.dataset.headerSweep = back ? 'out' : 'in'
    if (next) root.dataset.headerGradient = next
    else delete root.dataset.headerGradient
    if (animate && readTier() === 'full') sweep(header, back)
  }
  // A remounted header (a language switch) or a first load: take the table's state as it is.
  apply(headerGradientFor(table.get()), false)
  return table.subscribe((s, p) => {
    if (s.hoverCard === p.hoverCard && s.field.seq === p.field.seq) return
    apply(headerGradientFor(s), true)
  })
}
