import { announce } from '@/components/live-region'
import { activeChrome } from '@/lib/chrome'
import { dealOffset, drawCards, fanCards } from '@/motion/reveal'
import { table } from '@/motion/table-store'
import { duration as D, deal, ease, stagger } from '@/motion/tokens'
import { buzz } from './haptics'
import { eggOn } from './registry'

/*
 * Eggs that live on the hand: Mulligan (deal the four cards again), Tap (turn
 * a card sideways to read the line on its long edge), Inspect (2x with a
 * one-line summary). See registry.ts for triggers and tier behaviour.
 */
const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`
let dealing = false

/** Mulligan: the four cards are gathered off screen and dealt again (start page only). */
export async function mulligan() {
  if (!eggOn('mulligan') || dealing || table.get().activeCard) return
  const cards = fanCards()
  if (!cards.length) return
  dealing = true
  const tier = table.get().tier
  untapAll()
  if (tier === 'full') {
    await Promise.all(
      cards.map((card, i) => {
        const [dx, dy] = dealOffset(card)
        return card
          .animate(
            [
              {},
              {
                translate: `${dx}px ${dy}px`,
                rotate: `${deal.toss}deg`,
                transform: `perspective(${deal.flipPerspective}px) rotateY(180deg)`,
              },
            ],
            { duration: D.gather * 1000, delay: i * stagger.gather * 1000, easing: bezier(ease.in), fill: 'forwards' },
          )
          .finished.catch(() => {})
      }),
    )
    for (const card of cards) for (const a of card.getAnimations()) a.cancel()
    drawCards(cards, 0)
  }
  announce(activeChrome().site.eggs.dealt)
  dealing = false
}

/** Tap: turn a card 90 degrees; its long edge carries a line. Untapped on the next navigation. */
export function tap(card: HTMLElement) {
  if (!eggOn('tap') || card.hasAttribute('aria-current')) return
  const id = card.dataset.play
  const tapped = card.hasAttribute('data-tapped')
  untapAll()
  if (tapped) return
  card.dataset.tapped = ''
  const line = card.querySelector('.card-tapline')?.textContent
  if (line) announce(activeChrome().site.eggs.turned.replace('{line}', line))
  if (id) table.hover(null)
}

export function untapAll() {
  for (const el of document.querySelectorAll<HTMLElement>('.hand-card[data-tapped]')) delete el.dataset.tapped
}

/** Inspect: 2x in place with the one-line summary while held. */
export function inspect(card: HTMLElement, on: boolean) {
  if (!eggOn('inspect')) return
  if (!on) {
    delete card.dataset.inspect
    return
  }
  if (card.hasAttribute('aria-current')) return
  card.dataset.inspect = ''
  const id = card.dataset.play
  const line = activeChrome().cardById(id)?.inspect
  if (line) announce(line)
}

/** Rare pull: one hand card gets a single holographic glint (full tier). */
export function rarePull(delay: number) {
  if (!eggOn('rarePull') || table.get().tier !== 'full') return
  window.setTimeout(() => {
    const cards = fanCards()
    const card = cards[Math.floor(Math.random() * cards.length)]
    if (!card) return
    card.dataset.rare = ''
    announce(activeChrome().site.eggs.rare)
    window.setTimeout(() => delete card.dataset.rare, D.glint * 1000 + 100)
  }, delay * 1000)
}

/**
 * Wires hold-Space and long-press (Inspect), T and double tap (Tap) on the
 * hand. Returns a cleanup. (Mulligan's touch trigger, a long press on the
 * empty table, is wired by attachTableLongPress.)
 */
export function attachHandEggs(nav: HTMLElement) {
  let spaceTimer = 0
  let spaceCard: HTMLElement | null = null
  let spaceInspecting = false

  const onKeyDown = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const card = el.closest<HTMLElement>('.hand-card')
    if (e.key === ' ' && el.dataset.roving) {
      e.preventDefault()
      if (e.repeat || spaceCard) return
      spaceCard = el
      spaceInspecting = false
      if (card) {
        spaceTimer = window.setTimeout(() => {
          spaceInspecting = true
          inspect(card, true)
        }, D.inspectHold * 1000)
      }
      return
    }
    if ((e.key === 't' || e.key === 'T') && card) {
      e.preventDefault()
      tap(card)
    }
  }
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key !== ' ' || !spaceCard) return
    e.preventDefault()
    clearTimeout(spaceTimer)
    const el = spaceCard
    spaceCard = null
    if (spaceInspecting) inspect(el, false)
    else el.click()
  }

  // Long press: Inspect on a card (400 ms). Double tap: Tap.
  let pressTimer = 0
  let pressed: HTMLElement | null = null
  let held = false
  let start: [number, number] = [0, 0]
  let lastTap = { card: null as HTMLElement | null, at: 0 }
  const onPointerDown = (e: PointerEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('.hand-card')
    if (!el || e.button !== 0) return
    held = false
    pressed = el
    start = [e.clientX, e.clientY]
    if (e.pointerType === 'mouse') return
    pressTimer = window.setTimeout(() => {
      held = true
      buzz(10)
      inspect(el, true)
    }, D.inspectHold * 1000)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (pressed && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 10) clearTimeout(pressTimer)
  }
  const onPointerUp = (e: PointerEvent) => {
    clearTimeout(pressTimer)
    if (pressed && held) inspect(pressed, false)
    if (pressed && !held && e.pointerType === 'touch') {
      const now = performance.now()
      if (lastTap.card === pressed && now - lastTap.at < 350) {
        nav.dispatchEvent(new CustomEvent('egg:double-tap', { detail: pressed }))
        lastTap = { card: null, at: 0 }
      } else lastTap = { card: pressed, at: now }
    }
    pressed = null
  }
  // A long press must not also play the card.
  const onClick = (e: MouseEvent) => {
    if (!held) return
    held = false
    e.preventDefault()
    e.stopPropagation()
  }
  const onContextMenu = (e: Event) => {
    if ((e.target as Element).closest('.hand-card')) e.preventDefault()
  }

  nav.addEventListener('keydown', onKeyDown)
  nav.addEventListener('keyup', onKeyUp)
  nav.addEventListener('pointerdown', onPointerDown)
  nav.addEventListener('pointermove', onPointerMove)
  nav.addEventListener('pointerup', onPointerUp)
  nav.addEventListener('pointercancel', onPointerUp)
  nav.addEventListener('click', onClick, true)
  nav.addEventListener('contextmenu', onContextMenu)
  return () => {
    clearTimeout(spaceTimer)
    clearTimeout(pressTimer)
    nav.removeEventListener('keydown', onKeyDown)
    nav.removeEventListener('keyup', onKeyUp)
    nav.removeEventListener('pointerdown', onPointerDown)
    nav.removeEventListener('pointermove', onPointerMove)
    nav.removeEventListener('pointerup', onPointerUp)
    nav.removeEventListener('pointercancel', onPointerUp)
    nav.removeEventListener('click', onClick, true)
    nav.removeEventListener('contextmenu', onContextMenu)
  }
}

/**
 * Mulligan by touch: a long press (800 ms, 10 ms haptic) on the empty table on
 * the start page, never on a card, a link, a control or text. `home` says
 * whether the start page is showing. Returns a cleanup.
 */
export function attachTableLongPress(home: () => boolean) {
  let timer = 0
  let start: [number, number] | null = null
  const cancel = () => {
    clearTimeout(timer)
    start = null
  }
  const onDown = (e: PointerEvent) => {
    cancel()
    if (e.pointerType !== 'touch' || !home() || !eggOn('mulligan')) return
    const target = e.target as Element
    if (target.closest(TEXT_OR_CONTROL) || hasOwnText(target)) return
    start = [e.clientX, e.clientY]
    timer = window.setTimeout(() => {
      start = null
      buzz(10)
      mulligan()
    }, D.longPress * 1000)
  }
  const onMove = (e: PointerEvent) => {
    if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 10) cancel()
  }
  addEventListener('pointerdown', onDown, { passive: true })
  addEventListener('pointermove', onMove, { passive: true })
  addEventListener('pointerup', cancel, { passive: true })
  addEventListener('pointercancel', cancel, { passive: true })
  addEventListener('scroll', cancel, { passive: true })
  return () => {
    cancel()
    removeEventListener('pointerdown', onDown)
    removeEventListener('pointermove', onMove)
    removeEventListener('pointerup', cancel)
    removeEventListener('pointercancel', cancel)
    removeEventListener('scroll', cancel)
  }
}

/** Cards, links, controls, dialogs and text blocks: a long press there is not on the empty table. */
const TEXT_OR_CONTROL =
  '.hand, a, button, input, select, textarea, label, dialog, [role="switch"], p, h1, h2, h3, li, dt, dd, figure, svg, img'

/** An element with text of its own (not only in its children). */
const hasOwnText = (el: Element) =>
  [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
