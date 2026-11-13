import { inView } from 'motion'
import { reveal as R } from './tokens'

/*
 * When a block reveals on scroll: the one place that decides it (the reveal engine and the deal
 * kind's cards use it). A block reveals once `reveal.amount` (35%) of it is inside the viewport
 * shortened by `reveal.margin` at the bottom (18%), so reveals start a little after a block has
 * come into view. A block taller than the viewport needs only min(0.35, 0.45 × innerHeight /
 * offsetHeight) of itself, so it always triggers. When the page is scrolled to within
 * `reveal.endSlack` px of its end (or cannot scroll), every block still waiting reveals.
 */

const pending = new Map<Element, () => void>()
let frame = 0
let listening = false

const atEnd = () => scrollY + innerHeight >= document.documentElement.scrollHeight - R.endSlack

function check() {
  frame = 0
  if (!pending.size || !atEnd()) return
  for (const fire of [...pending.values()]) fire()
}

const onScroll = () => {
  if (!frame) frame = requestAnimationFrame(check)
}

function listen(on: boolean) {
  if (on === listening) return
  listening = on
  const method = on ? addEventListener : removeEventListener
  method('scroll', onScroll, { passive: true } as AddEventListenerOptions)
  method('resize', onScroll, { passive: true } as AddEventListenerOptions)
  if (!on) {
    cancelAnimationFrame(frame)
    frame = 0
  }
}

/** The inView options for `el` (amount for tall blocks included). */
export function revealOptions(el: HTMLElement) {
  const amount = Math.min(R.amount, (R.tallAmount * innerHeight) / Math.max(1, el.offsetHeight))
  return { amount, margin: R.margin as `${number}px ${number}px ${number}% ${number}px` }
}

/** Calls `onEnter` once, when `el` comes into view by the reveal rule or the page reaches its end. */
export function whenInView(el: HTMLElement, onEnter: () => void): () => void {
  let done = false
  let stopView = () => {}
  const stop = () => {
    done = true
    stopView()
    if (pending.get(el) === fire) pending.delete(el)
    if (!pending.size) listen(false)
  }
  const fire = () => {
    if (done) return
    stop()
    onEnter()
  }
  stopView = inView(el, () => fire(), revealOptions(el))
  pending.set(el, fire)
  listen(true)
  // A page that cannot scroll, or one already at its end: check once on the next frame.
  onScroll()
  return stop
}
