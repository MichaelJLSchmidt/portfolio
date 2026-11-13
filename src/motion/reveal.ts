import { inView } from 'motion'
import { watchNumeralStrokes } from './numeral-stroke'
import { whenInView } from './reveal-trigger'
import { discard } from '@/eggs/discard'
import { gapFor, spanFor } from './choreography'
import { type FirstLoadBlock, firstVisit, revisit } from './first-load'
import { completeAll, revealNow, revealed, schedule } from './jobs'
import { type Kind, type KindOptions, isHeroImage, runKind } from './kinds'
import { loadSplit } from './split'
import { table } from './table-store'
import { playTokens } from './play'
import { reveal as R, stagger } from './tokens'
import { readTier } from './use-tier'
import { afterReady } from './view-transition'

export { dealOffset, drawCards, fanCards } from './deal'

/*
 * The reveal system (docs/contracts.md#reveal). Every <Reveal> renders
 * data-reveal="<kind>" (+ data-reveal-order / data-reveal-delay); CSS
 * (src/styles/reveal.css) only hides armed, unrevealed blocks with opacity 0.
 * This module decides when each block reveals and starts its kind
 * (kinds.ts) as a job (jobs.ts).
 *
 *   home       <FirstLoadSequence>: the first-visit sequence, or a 300 ms
 *              crossfade on revisits and client navigations (first-load.ts)
 *   order      blocks with data-reveal-order in the first viewport play in
 *              sequence: base + 80 ms × (order + 1) + delay, where base is 0,
 *              or the moment the card morph has mostly landed after a play
 *   detail     the detail hero's data-reveal-step blocks in the first viewport
 *              follow its title by at.detail: summary, label and counter, then
 *              the meta pairs left to right (each a `pair`: rule, label, value)
 *   on scroll  everything else reveals once 35% is in view above the bottom
 *              18% of the viewport (tall blocks: less, so they always trigger;
 *              at the page's end every waiting block: reveal-trigger.ts);
 *              blocks entering in the same frame start 50 ms apart in
 *              document order
 *   reduced    every block is final at once: nothing hidden, nothing animated
 *   neighbours a block revealing with the same kind as the block before it
 *              starts at least 80 ms after it (spaced()), so no two
 *              neighbours share a timing
 *   notes      a margin note waits until its related paragraph has finished
 *   titles     the page h1 (PageTitle: kind "lines", order 0) reveals on direct
 *              loads and client navigations; after a play or switch it is
 *              final at once, because the card → hero morph delivers it
 *   breakers   full-bleed blocks with data-breaker lift the field while in view
 *   discard    on 404 the .lost-card (a draw reveal) falls into the zone
 *   language   a language switch keeps the page: what is on screen is final at
 *              once (the cross-fade shows it), the rest reveals on scroll
 *
 * The Minimap's aria-current belongs to Layout (MinimapObserver), not here.
 */
/** How the route was reached (decides the page order). Element kinds are RevealKind in reveals.tsx. */
export type NavigationKind = 'first' | 'repeat' | 'load' | 'nav' | 'play' | 'switch' | 'return' | 'locale'

const kinds = new Set<string>(['lines', 'block', 'list', 'image', 'digits', 'rule', 'draw', 'note', 'pair', 'deal'])

/** The kind a block reveals with (data-reveal), or null when it is not one of the ten. */
export function kindOf(el: HTMLElement): Kind | null {
  const k = el.dataset.reveal
  return k && kinds.has(k) ? (k as Kind) : null
}

function orderOf(el: HTMLElement): number | null {
  const own = el.dataset.revealOrder
  return own !== undefined && own !== '' ? Number(own) || 0 : null
}

/** data-reveal-delay (ms), scaled like every other offset. */
const delayOf = (el: HTMLElement) => gapFor(readTier(), (Number(el.dataset.revealDelay) || 0) / 1000)

const inFirstViewport = (el: Element) => {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < innerHeight && (r.width > 0 || r.height > 0)
}

/** b follows a in the document (Node is read at call time: this module is also evaluated on the server). */
const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
const byDocument = (a: Element, b: Element) => (follows(a, b) ? -1 : 1)

/** The paragraph a margin note belongs to: the last block or lines reveal before it in its section. */
function relatedOf(note: HTMLElement): HTMLElement | null {
  const scope = note.closest('[data-section], section, article') ?? note.parentElement
  if (!scope) return null
  const before = [...scope.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
    (el) => el !== note && !el.contains(note) && follows(el, note) && kindOf(el) !== 'note',
  )
  const text = before.filter((el) => ['block', 'lines'].includes(kindOf(el) ?? ''))
  return text.at(-1) ?? before.at(-1) ?? null
}

type Route = {
  stops: (() => void)[]
  held: Set<HTMLElement>
  batch: HTMLElement[]
  frame: number
  live: boolean
  /** The route's reveal blocks in document order (for the adjacency rule). */
  all: HTMLElement[]
  index: Map<HTMLElement, number>
  /** Planned start (performance.now(), ms) of each block's reveal. */
  planned: Map<HTMLElement, number>
}

/**
 * Neighbours never share a timing: a block whose previous block (document
 * order) reveals with the same kind starts at least one deal step (80 ms)
 * after it, whenever both were triggered close together (same frame, the next
 * frame, or the same order). Notes keep their own rule (after their paragraph).
 */
function spaced(el: HTMLElement, kind: string, delay: number, r: Route) {
  const i = r.index.get(el)
  const prev = i ? r.all[i - 1] : undefined
  if (kind === 'note' || !prev || kindOf(prev) !== kind) return delay
  const prevAt = r.planned.get(prev)
  if (prevAt === undefined) return delay
  const now = performance.now()
  const earliest = prevAt + gapFor(readTier(), stagger.cards)
  return now + delay < earliest ? earliest - now : delay
}

let introSkip: (() => void) | null = null

/**
 * Starts the reveal of one block in `delay` ms (resolving its special cases). A sequence with its
 * own timing (the home intro, the detail hero) passes `opts` and is exact: no neighbour spacing.
 */
function start(el: HTMLElement, wanted: number, r: Route, opts?: KindOptions) {
  const kind = kindOf(el)
  if (!kind || el.hasAttribute('data-revealed')) return
  const tier = readTier()
  const delay = opts ? wanted : spaced(el, kind, wanted, r)
  r.planned.set(el, performance.now() + delay)
  if (kind === 'image' && isHeroImage(el.querySelector('img'))) return revealNow(el)
  if (kind === 'digits' && tier === 'reduced') return revealNow(el, '')
  if (kind === 'note') {
    const related = relatedOf(el)
    // A related paragraph that is not rendered (hidden at this width) never reveals: do not wait for it.
    if (related && related.getClientRects().length > 0) {
      r.held.add(el)
      revealed(related).then(() => {
        if (!r.live || !r.held.delete(el)) return
        r.planned.set(el, performance.now() + delay)
        schedule(el, delay, (ctx) => runKind('note', ctx, el))
      })
      return
    }
  }
  // The 404 egg: the .lost-card (a draw reveal around DiscardedCard) falls into the zone while its strokes draw.
  const falls = kind === 'draw' && el.classList.contains('lost-card')
  schedule(el, delay, (ctx) => {
    if (falls) discard(ctx, el)
    return runKind(kind, ctx, el, opts)
  })
}

function flush(r: Route) {
  r.frame = 0
  const items = r.batch.sort(byDocument)
  r.batch = []
  const gap = gapFor(readTier(), stagger.items)
  items.forEach((el, i) => start(el, i * gap + delayOf(el), r))
}

/**
 * Reveals a block a scene held back (data-reveal-hold) now, with its kind's animation (reduced:
 * final at once). Chapter 05's numeral draws once its stage pins (scenes/deal-scene.ts).
 */
export function releaseReveal(el: HTMLElement) {
  el.removeAttribute('data-reveal-hold')
  const kind = kindOf(el)
  if (!kind || el.hasAttribute('data-revealed')) return
  if (readTier() === 'reduced') return revealNow(el)
  schedule(el, 0, (ctx) => runKind(kind, ctx, el))
}

/** Ends running reveal animations at once (the intro skip). */
export function completeReveals() {
  completeAll()
  for (const card of document.querySelectorAll<HTMLElement>('.hand-card')) {
    for (const a of card.getAnimations()) a.finish()
  }
}

/**
 * Reveals the page in <main> for a navigation of `kind`. Runs in a layout
 * effect, so on play / switch the H1 is final before the view transition
 * captures the new page. Returns the cleanup for the next route.
 */
export function revealRoute(kind: NavigationKind) {
  const root = document.documentElement
  const main = document.getElementById('main')
  if (!main) return () => {}
  introSkip?.()
  introSkip = null
  root.dataset.reveal = 'live'
  const tier = readTier()
  const handled = new Set<HTMLElement>()
  const all = [...main.querySelectorAll<HTMLElement>('[data-reveal]')]
  // A scene holds a block back and reveals it at its own moment (Chapter 05's numeral: as it pins).
  for (const el of all) if (el.hasAttribute('data-reveal-hold')) handled.add(el)
  const r: Route = {
    stops: [],
    held: new Set(),
    batch: [],
    frame: 0,
    live: true,
    all,
    index: new Map(all.map((el, i) => [el, i])),
    planned: new Map(),
  }
  // Chapter numerals keep a one-pixel stroke at any size.
  r.stops.push(watchNumeralStrokes(main))
  // Fetch splitText now, so the first split (the role line at 900 ms) never waits for the network.
  if (tier !== 'reduced' && all.some((el) => kindOf(el) === 'lines')) void loadSplit()

  // A language switch: the same page with other words. What is revealed stays so, what is on
  // screen is final at once (the cross-fade shows it); blocks further down reveal on scroll.
  const language = kind === 'locale'
  if (language)
    for (const el of all) {
      if (!kindOf(el) || !(el.hasAttribute('data-revealed') || inFirstViewport(el))) continue
      handled.add(el)
      if (!el.hasAttribute('data-revealed')) revealNow(el)
    }

  // Home: the first-load sequence (the first visit also deals the hand and reveals the chrome).
  const seq = main.querySelector<HTMLElement>('[data-first-load]')
  if (!language && (seq || kind === 'first')) {
    const h1 = seq?.querySelector<HTMLElement>('h1') ?? null
    const blocks: FirstLoadBlock[] = []
    for (const el of all) {
      if (!seq?.contains(el) || el === h1 || h1?.contains(el)) continue
      const k = kindOf(el)
      handled.add(el)
      if (!k) continue
      blocks.push({ el, kind: k, order: orderOf(el), delay: delayOf(el), step: el.dataset.revealStep ?? null })
    }
    if (h1) handled.add(h1)
    if (kind === 'first') introSkip = firstVisit(h1, blocks, (el, delay, opts) => start(el, delay, r, opts ?? {}))
    else if (seq) revisit(seq, h1, blocks)
  }

  // The page title outside the home sequence: after a play or switch the card's title becomes the
  // h1 in the morph, so it is final at once; otherwise it reveals as "lines" in the ordered sequence.
  const morphed = kind === 'play' || kind === 'switch'
  if (morphed)
    for (const el of all) {
      if (handled.has(el) || el.tagName !== 'H1') continue
      handled.add(el)
      revealNow(el)
    }

  // Reduced: everything outside the home intro is final at once (nothing hidden, nothing animated).
  if (tier === 'reduced')
    for (const el of all) {
      if (handled.has(el) || !kindOf(el)) continue
      handled.add(el)
      revealNow(el)
    }

  // Detail pages (case studies, Management): the hero's own parts (not in the view transition)
  // reveal on the page from the transition's start (V, its `ready`), or from now without one (a
  // direct load, a plain navigation): the top label and counter, the summary, then the meta pairs
  // left to right (cardPlay.*.hero). Only blocks in the viewport now join (measured once, here);
  // the rest reveal on scroll like any other block. Ordered blocks after a play wait for the label.
  const H = playTokens().hero
  const hero: HTMLElement[] = []
  for (const el of all) {
    if (!el.dataset.revealStep || handled.has(el) || seq?.contains(el) || !kindOf(el) || !inFirstViewport(el)) continue
    handled.add(el)
    hero.push(el)
  }
  const ordered = all
    .filter((el) => !handled.has(el) && kindOf(el) && orderOf(el) !== null && inFirstViewport(el))
    .sort((a, b) => orderOf(a)! - orderOf(b)! || byDocument(a, b))
  for (const el of ordered) handled.add(el)
  const base = morphed && tier !== 'reduced' ? H.label * 1000 : 0
  afterReady(() => {
    if (!r.live) return
    let pairs = 0
    for (const el of hero) {
      const step = el.dataset.revealStep
      if (step === 'meta') start(el, (H.meta.at + pairs++ * H.meta.stagger) * 1000, r, {})
      else start(el, (step === 'summary' ? H.summary : H.label) * 1000, r, { dur: H.dur * 1000, rise: H.y })
    }
    // Ordered blocks in the first viewport: in sequence (neighbours of the same kind are spaced by start()).
    for (const el of ordered) start(el, base + gapFor(tier, (orderOf(el)! + 1) * stagger.cards) + delayOf(el), r)
  })

  // Everything else: by the shared rule (reveal-trigger.ts).
  for (const el of all) {
    if (handled.has(el) || !kindOf(el)) continue
    r.stops.push(
      whenInView(el, () => {
        r.batch.push(el)
        if (!r.frame) r.frame = requestAnimationFrame(() => flush(r))
      }),
    )
  }

  // Full-bleed breakers (Spread, the problem statement) lift the field's intensity while any of them
  // is in view: counted, because adjacent breakers overlap (one leaves while the next is in view).
  // A language switch kept the lift (the page did not move): drop it only if no breaker reports in.
  const lifting = new Set<HTMLElement>()
  if (language) {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => lifting.size === 0 && table.setBreaker(false))
    })
    r.stops.push(() => cancelAnimationFrame(frame))
  }
  for (const el of main.querySelectorAll<HTMLElement>('[data-breaker]')) {
    r.stops.push(
      inView(
        el,
        () => {
          lifting.add(el)
          table.setBreaker(true)
          return () => {
            lifting.delete(el)
            table.setBreaker(lifting.size > 0)
          }
        },
        { amount: R.breakerAmount },
      ),
    )
  }

  return () => {
    r.live = false
    for (const stop of r.stops) stop()
    // Leaving for the same page in the other language keeps the lift (see above).
    if (!('localeSwitch' in root.dataset)) table.setBreaker(false)
    cancelAnimationFrame(r.frame)
    for (const el of r.batch) revealNow(el)
    for (const el of r.held) revealNow(el)
    completeAll()
  }
}
