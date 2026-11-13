import { gapFor, msFor, spanFor } from './choreography'
import { drawCards, fadeCards, fanCards } from './deal'
import { completeAll, schedule } from './jobs'
import { type Kind, type KindOptions, fade, isHeroImage, title } from './kinds'
import { CHROME_IN, INTRO_DONE, INTRO_KEY } from './preferences'
import { at as AT, dur, stagger } from './tokens'
import { readTier } from './use-tier'

/*
 * Home, first visit in the session (<FirstLoadSequence>). Every offset and
 * duration is at.firstLoad in tokens.ts; the parts carry data-reveal-step.
 * Full tier, ms:
 *      0–600   1. the name: its words turn up and settle (opsz / wght)
 *    250–600   2. the label above the name ("label")
 *    450–950   3. the role line, then the intro ("copy"), lines 60 apart (closer
 *              when there are more lines than fit the window)
 *   850–1150   4. the divider draws left to right like a link underline ("divider")
 *  1000–1250   5. "What I bring to the table", its items 80 apart, the hint ("items", "hint")
 *  1250–2000   6. the hand: the four cards dealt one after the other (330 ms, 140 apart)
 *  then the chrome ([data-chrome]: the header)
 * Reduced: everything at once, 160 ms opacity. Any key, click, wheel or scroll completes it.
 *
 * Revisit (same session) or a client navigation back to home: every part
 * crossfades, the title at 0 and the rest 60 ms later, 240 ms each (all
 * visible by 300 ms).
 */
/** b follows a in the document (Node is read at call time: this module is also evaluated on the server). */
const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

export type FirstLoadBlock = {
  el: HTMLElement
  kind: Kind
  order: number | null
  delay: number
  /** data-reveal-step: the part of the sequence the block belongs to. */
  step: string | null
}

/**
 * The short crossfade for revisits and client navigations to home: one job
 * for every part (so the mobile job cap never queues a part past the 300 ms),
 * all started in this frame, the rest held by an animation delay. The eager
 * hero image and reduced-motion digits stay as they are.
 */
export function revisit(seq: HTMLElement, h1: HTMLElement | null, blocks: FirstLoadBlock[]) {
  const later = gapFor(readTier(), stagger.lines)
  schedule(seq, 0, (ctx) => {
    if (h1) {
      h1.setAttribute('data-revealed', '')
      fade(ctx, h1, 's')
    }
    for (const { el, kind } of blocks) {
      el.setAttribute('data-revealed', '')
      const still =
        (kind === 'image' && isHeroImage(el.querySelector('img'))) || (kind === 'digits' && ctx.tier === 'reduced')
      if (!still) fade(ctx, el, 's', later)
    }
  })
}

/** Starts one block's reveal in `delay` ms through the engine (its special cases: hero image, notes, ...). */
export type StartAt = (el: HTMLElement, delay: number, opts?: KindOptions) => void

/** Rendered lines of a text block (before it is split). */
function lineCount(el: HTMLElement) {
  const lh = parseFloat(getComputedStyle(el).lineHeight)
  return lh > 0 ? Math.max(1, Math.round(el.getBoundingClientRect().height / lh)) : 1
}

/** The first-visit sequence (with no [data-first-load] on the page: the hand and the chrome only). Returns the skip. */
export function firstVisit(h1: HTMLElement | null, blocks: FirstLoadBlock[], startAt: StartAt) {
  const root = document.documentElement
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    // Storage blocked: the intro may play again on the next home visit.
  }
  const tier = readTier()
  // Offsets and durations for this tier (reduced: offsets 0, durations 160 ms).
  const t = (s: number) => gapFor(tier, s)
  const d = (s: number) => spanFor(tier, s)
  const F = AT.firstLoad
  const part = (name: string) => blocks.filter((b) => b.step === name)

  // 1. The name.
  if (h1) schedule(h1, t(F.title.at), (ctx) => title(ctx, h1, { dur: d(F.title.dur) }))
  // 2. The label above it.
  for (const b of part('label')) startAt(b.el, t(F.label.at), { dur: d(F.label.dur) })
  // 3. The role line, then the intro: the intro's lines follow the role's, all in by copy.end. The
  // lines are stagger.lines apart and take the rest of the window (at least dur.s each); with more
  // lines than fit (phones), the stagger narrows so the last line still lands by copy.end.
  const copy = part('copy').map((b) => ({ b, n: lineCount(b.el) }))
  const lines = copy.reduce((sum, c) => sum + c.n, 0)
  const room = F.copy.end - F.copy.at
  const gap = Math.min(stagger.lines, (room - dur.s) / Math.max(1, lines - 1))
  const each = room - (lines - 1) * gap
  let copyAt: number = F.copy.at
  for (const { b, n } of copy) {
    startAt(b.el, t(copyAt), { span: d(each + (n - 1) * gap), stagger: t(gap) })
    copyAt += n * gap
  }
  // 4. The divider.
  for (const b of part('divider')) startAt(b.el, t(F.divider.at), { dur: d(F.divider.dur), underline: true })
  // 5. Top to bottom: the label, each item of the list, then the hint with the last item.
  let k = 0
  let last: number = F.items.at
  for (const b of part('items')) {
    const at = F.items.at + k * F.items.stagger
    const n = b.kind === 'list' ? [...b.el.children].filter((c) => c.getClientRects().length > 0).length : 1
    startAt(b.el, t(at), { dur: d(F.items.dur), stagger: t(F.items.stagger) })
    last = at + Math.max(0, n - 1) * F.items.stagger
    k += Math.max(1, n)
  }
  for (const b of part('hint')) startAt(b.el, t(last), { dur: d(F.items.dur) })
  // Anything else in the sequence: with step 5, in document order.
  const rest = blocks.filter((b) => !b.step).sort((a, b) => (follows(a.el, b.el) ? -1 : 1))
  rest.forEach((b, i) => startAt(b.el, t(F.items.at + i * stagger.items) + b.delay))

  // 6. The hand, then the chrome.
  const cards = fanCards()
  if (tier === 'full') drawCards(cards, F.cards.at, { dur: F.cards.dur, stagger: F.cards.stagger })
  else fadeCards(cards, d(F.cards.dur), t(F.cards.stagger), t(F.cards.at))
  const chromeAt = F.cards.at + Math.max(0, cards.length - 1) * F.cards.stagger + F.cards.dur
  const chrome = [...document.querySelectorAll<HTMLElement>('[data-chrome]')]
  chrome.forEach((el, i) =>
    schedule(el, t(chromeAt + i * stagger.items), (ctx) => {
      if (i === 0) dispatchEvent(new Event(CHROME_IN))
      return fade(ctx, el, 's')
    }),
  )
  const total = t(chromeAt + chrome.length * stagger.items) + msFor(tier, 's')

  let finished = false
  const events = ['keydown', 'pointerdown', 'wheel', 'touchmove', 'scroll'] as const
  const finish = () => {
    if (finished) return
    finished = true
    window.clearTimeout(timer)
    for (const type of events) removeEventListener(type, skip, true)
    delete root.dataset.intro
    dispatchEvent(new Event(INTRO_DONE))
  }
  const skip = () => {
    completeAll()
    for (const card of document.querySelectorAll<HTMLElement>('.hand-card')) {
      for (const a of card.getAnimations()) a.finish()
    }
    finish()
  }
  const timer = window.setTimeout(finish, total + msFor(tier, 'm'))
  for (const type of events) addEventListener(type, skip, { capture: true, passive: true })
  document.querySelector<HTMLButtonElement>('[data-intro-skip]')?.addEventListener('click', skip, { once: true })
  return skip
}
