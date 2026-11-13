/*
 * Watches the view transitions React starts (it calls
 * document.startViewTransition for every navigation inside a transition), so
 * focus and announcements can wait for the morph to finish, and the
 * background field can redraw once it has (VT_DONE on window).
 */
export const VT_DONE = 'table:vt-done'

let current: ViewTransition | null = null

if (typeof document !== 'undefined' && 'startViewTransition' in document) {
  const original = document.startViewTransition.bind(document)
  document.startViewTransition = ((arg?: never) => {
    const transition = original(arg)
    current = transition
    transition.finished.finally(() => {
      if (current === transition) current = null
      dispatchEvent(new Event(VT_DONE))
    })
    return transition
  }) as typeof document.startViewTransition
}

/** True while a view transition runs (from its start until it has finished). */
export const transitionRunning = () => current !== null

/**
 * Runs `fn` once the running view transition's animations start (its `ready`: the moment V every
 * play offset is measured from), or at once without one.
 */
export function afterReady(fn: () => void) {
  const transition = current
  if (transition) transition.ready.then(fn, fn)
  else fn()
}

/** Runs `fn` after the running view transition (if any) has finished, on the next frame. */
export function afterTransition(fn: () => void) {
  const transition = current
  if (transition) transition.finished.finally(() => requestAnimationFrame(fn))
  else requestAnimationFrame(fn)
}
