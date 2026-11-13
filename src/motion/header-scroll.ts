import { header as HEADER } from './tokens'
import { VT_DONE, transitionRunning } from './view-transition'

/*
 * The header on scrolling pages (N1): it leaves after a deliberate scroll down
 * and returns after a deliberate scroll up. One passive scroll listener,
 * throttled to one check per frame, writes html[data-header="hidden"]; CSS
 * moves the header (translate only: 200 ms ease-in out, 240 ms outQuint back;
 * reduced: a crossfade, no slide) and the mobile hand rail with it.
 *
 *   shown    near the top (the scroll position within the header's height), on
 *            pages that do not scroll, while focus is inside the header, and
 *            after every route change
 *   hidden   after more than header.threshold px down in one direction, past
 *            the header's height
 *   shown    after more than header.threshold px up
 *
 * Overscroll bounce (positions outside the scroll range) and scroll changes
 * while a view transition runs are ignored; after one the current position is
 * the new starting point.
 */
const root = () => document.documentElement

function setHidden(hidden: boolean) {
  if (hidden) root().dataset.header = 'hidden'
  else if (root().dataset.header) delete root().dataset.header
}

/** Shows the header now (route changes, focus). */
export const showHeader = () => setHidden(false)

/** Starts the controller for `header`; returns the cleanup. */
export function watchHeader(header: HTMLElement) {
  let last = scrollY
  /** Where the current run in one direction started. */
  let from = scrollY
  let direction = 0
  let frame = 0

  const restart = () => {
    last = from = scrollY
    direction = 0
  }

  const check = () => {
    frame = 0
    const y = scrollY
    const max = root().scrollHeight - innerHeight
    if (transitionRunning()) return restart()
    // Overscroll bounce: outside the scroll range nothing counts.
    if (y < 0 || y > max) return
    if (max <= 0 || y <= header.offsetHeight) {
      restart()
      return showHeader()
    }
    const step = Math.sign(y - last)
    if (!step) return
    if (step !== direction) {
      direction = step
      from = last
    }
    last = y
    if (Math.abs(y - from) <= HEADER.threshold) return
    if (direction < 0) return showHeader()
    if (header.contains(document.activeElement)) return
    setHidden(true)
  }
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(check)
  }
  const onFocus = () => showHeader()
  const onTransitionDone = () => restart()
  const onResize = () => {
    if (root().scrollHeight <= innerHeight) showHeader()
  }

  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onResize, { passive: true })
  addEventListener(VT_DONE, onTransitionDone)
  header.addEventListener('focusin', onFocus)
  return () => {
    cancelAnimationFrame(frame)
    removeEventListener('scroll', onScroll)
    removeEventListener('resize', onResize)
    removeEventListener(VT_DONE, onTransitionDone)
    header.removeEventListener('focusin', onFocus)
  }
}
