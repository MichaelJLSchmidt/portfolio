'use client'

import { cubicBezier, scroll } from 'motion'
import { type RefObject, useLayoutEffect, useState } from 'react'
import { breakpoints, handReserve, headerHeight } from '@/design/layout'
import { releaseReveal } from '../reveal'
import { angle, deal as DEAL, distance, ease } from '../tokens'
import { onTierChange, readTier } from '../use-tier'

/*
 * The deal scene: Chapter 05's four decision cards dealt onto the table as the
 * visitor scrolls, with the chapter's head (its label, the outlined numeral
 * and the h2) pinned above them. Contract: docs/contracts.md#scenes.
 *
 *   const { active } = useDealScene(ref, { cards: 4 })
 *
 * Full tier, from 1024 px wide and deal.minPinnedHeight (760 px) tall, only.
 * The section's track ([data-stage-track], section.tsx) becomes deal.stage
 * (180svh) tall and its stage ([data-stage]) sticks under the header: a grid
 * with a fixed head row (deal.pinned.head) and a fixed canvas row in which the
 * cards are dealt, clear of the hand (layout.css). Motion's scroll() follows the track from the
 * moment the stage pins to the moment it leaves:
 *
 *   0.0–0.2  card 1 is dealt     cards wait face up as a deck in the last
 *   0.2–0.4  card 2              slot; each one travels to its slot on a
 *   0.4–0.6  card 3              shallow arc, readable all the way, and
 *   0.6–0.8  card 4              lands with a slight tilt
 *   0.8–1.0  settle              the row squares up
 *
 * The numeral draws once, when the stage pins (its reveal is held until then),
 * then stays still. The canvas row is sized once on mount and again only when
 * the width changes (a debounced ResizeObserver): the viewport under the
 * header less the head row, the padding and the hand's reserve, never from the head's own size or
 * the scroll (resizing it mid-scroll is what flickered before). Cards taller
 * than the canvas are scaled to fit it; a fit below deal.pinned.minScale (or a
 * viewport under 760 px) keeps the static row: the cards under the title,
 * nothing pinned. The cards carry will-change: transform while the stage is
 * pinned (set on mount or a width change, never toggled at the pin boundaries
 * while scrolling); the
 * background field is never resized by the scene. Reduced, narrow or short
 * screens, no JavaScript: nothing is touched (no CSS ever hides the cards).
 * Everything the scene writes is inline and removed again.
 */
export type DealSceneOptions = {
  /** Number of cards in the row (always 4 for decisions). */
  cards: number
}

export type DealSceneState = {
  /** True while the scene runs (the stage is pinned and the cards follow the scroll). */
  active: boolean
}

const idle: DealSceneState = { active: false }
const running: DealSceneState = { active: true }

// The scroll is the clock: each phase eases in and out, so mid-phase is mid-flight.
const easePhase = cubicBezier(...(ease.inOut as unknown as [number, number, number, number]))
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Where the deal can pin: wide and tall enough for the head and a readable row of cards. */
export const dealQuery = `(min-width: ${breakpoints.md}px) and (min-height: ${DEAL.minPinnedHeight}px)`

export function useDealScene(ref: RefObject<HTMLElement | null>, options: DealSceneOptions): DealSceneState {
  const [active, setActive] = useState(false)
  const count = options.cards

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const fits = matchMedia(dealQuery)
    let scene: ((release: boolean) => void) | null = null
    const update = () => {
      const want = fits.matches && readTier() === 'full'
      if (want && !scene) scene = mount(root, count, setActive)
      else if (!want && scene) {
        scene(true)
        scene = null
      }
    }
    update()
    fits.addEventListener('change', update)
    const offTier = onTierChange(update)
    return () => {
      fits.removeEventListener('change', update)
      offTier()
      scene?.(false)
    }
  }, [ref, count])

  return active ? running : idle
}

type Slot = { x: number; y: number }

/** Sets the scene up for the DealRow `root` inside its section's stage. Returns its teardown. */
function mount(root: HTMLElement, count: number, setActive: (on: boolean) => void) {
  const track = root.closest<HTMLElement>('[data-stage-track]')
  const section = track?.parentElement
  const cards = [...root.querySelectorAll<HTMLElement>('[data-deal-card]')]
    .sort((a, b) => Number(a.dataset.dealCard) - Number(b.dataset.dealCard))
    .slice(0, count)
  const list = cards[0]?.parentElement
  if (!track || !section || cards.length < 2 || !list || cards.some((c) => c.parentElement !== list)) return () => {}

  const P = DEAL.pinned
  const n = cards.length
  const phases = DEAL.phases
  const deal = phases.slice(0, n)
  const settleFrom = phases[n - 1]
  const settleTo = phases[n] ?? 1
  const tilt = cards.map((_, i) => angle.hand[i % angle.hand.length] * DEAL.landTilt)
  const deckTilt = cards.map((_, i) => angle.hand[(n - 1 - i) % angle.hand.length] * DEAL.landTilt)

  // The numeral draws when the stage pins, not when it scrolls into view.
  const numeral = track.querySelector<HTMLElement>('[data-numeral][data-reveal]')
  let held = Boolean(numeral && !numeral.hasAttribute('data-revealed'))
  if (held) numeral!.setAttribute('data-reveal-hold', '')
  const drawNumeral = () => {
    if (!held) return
    held = false
    releaseReveal(numeral!)
  }

  let pinned = false
  let slots: Slot[] = []
  let progress = 0
  let stopScroll: (() => void) | null = null

  const render = (p: number) => {
    progress = p
    if (p > 0) drawNumeral()
    const last = slots[n - 1]
    const settle = easePhase(clamp01((p - settleFrom) / (settleTo - settleFrom)))
    cards.forEach((card, i) => {
      const from = i === 0 ? 0 : deal[i - 1]
      const t = clamp01((p - from) / (deal[i] - from))
      const e = easePhase(t)
      // The deck: the last slot, each lower card peeking out a little.
      const deckX = last.x - slots[i].x + i * distance.reveal
      const deckY = last.y - slots[i].y + i * distance.reveal
      const arc = Math.sin(Math.PI * e) * distance.hoverLift
      const x = deckX * (1 - e)
      const y = deckY * (1 - e) - arc
      const r = t < 1 ? deckTilt[i] + (tilt[i] - deckTilt[i]) * e : tilt[i] * (1 - settle)
      card.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`
      card.style.rotate = `${r.toFixed(3)}deg`
      // Undealt cards lie face up on the deck, the next card on top: its text is readable from the
      // moment it starts moving.
      card.style.zIndex = String(t < 1 ? n * 2 - i : n - i)
    })
  }

  const clear = () => {
    for (const card of cards) {
      card.style.translate = ''
      card.style.rotate = ''
      card.style.zIndex = ''
    }
  }

  const pin = (canvas: number, scale: number) => {
    track.style.setProperty('--deal-canvas', `${canvas}px`)
    track.style.setProperty('--deal-scale', String(scale))
    if (!pinned) {
      pinned = true
      // One compositor layer per card while pinned: promoted here (mount or a width change), never
      // toggled while scrolling past the pin boundaries.
      for (const card of cards) card.style.willChange = 'transform'
      track.dataset.pinned = ''
      track.style.height = `${DEAL.stage}svh`
      root.dataset.sceneActive = ''
      // From the moment the stage pins under the header to the moment it leaves.
      stopScroll = scroll((p: number) => render(p), { target: track, offset: [`start ${headerHeight}px`, 'end end'] })
      setActive(true)
    }
    slots = cards.map((c) => ({ x: c.offsetLeft, y: c.offsetTop }))
    render(progress)
  }

  const unpin = () => {
    if (!pinned) return
    pinned = false
    stopScroll?.()
    stopScroll = null
    clear()
    for (const card of cards) card.style.willChange = ''
    delete track.dataset.pinned
    delete root.dataset.sceneActive
    track.style.height = ''
    track.style.removeProperty('--deal-canvas')
    track.style.removeProperty('--deal-scale')
    setActive(false)
  }

  // The canvas: the viewport under the header less the head row, the padding (tokens) and the
  // hand's reserve (its fan covers the bottom), the cards scaled to fit it. Measured here, on width
  // changes and once the fonts are in; never on a height-only change or a scroll.
  const size = () => {
    const canvas = innerHeight - headerHeight - handReserve.collapsed - P.head - 3 * P.pad
    const natural = list.offsetHeight
    const scale = natural > 0 ? Math.min(1, canvas / natural) : 1
    if (scale < P.minScale) {
      unpin()
      drawNumeral()
      return
    }
    pin(canvas, scale)
  }

  size()
  let width = section.getBoundingClientRect().width
  let timer = 0
  const ro = new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width
    if (Math.abs(w - width) < 1) return
    width = w
    clearTimeout(timer)
    timer = window.setTimeout(size, P.debounce * 1000)
  })
  ro.observe(section)
  let live = true
  void document.fonts?.ready.then(() => live && size())

  return (release: boolean) => {
    live = false
    ro.disconnect()
    clearTimeout(timer)
    unpin()
    // Torn down while the page stays (a resize below the breakpoint): the numeral shows as usual.
    if (release) drawNumeral()
    else numeral?.removeAttribute('data-reveal-hold')
  }
}
