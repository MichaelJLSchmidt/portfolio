import { useSyncExternalStore } from 'react'

/*
 * The pending signal of a play: set when play.ts calls navigate (the card is
 * at rest on the table), cleared in a layout effect once usePathname() has
 * changed (hand/play-status.tsx), so it covers exactly the wait for the next
 * page. (Not useLinkStatus: it skips the pending state for prefetched links,
 * and the play navigates with router.push anyway.)
 *
 * Readers: the status line under the resting card (hand/play-status.tsx) and
 * the background field's waiting breath (background/field-engine.ts), both
 * from cardPlay.loading: nothing within `cue`, the breath after it, the
 * "Loading…" label after `label`, "Still loading…" after `longWait`.
 */
export type Pending = {
  /** The card whose page is loading. */
  id: string
  href: string
  /** performance.now() when navigate was called. */
  at: number
  /** Where the card rests, in viewport fractions (x right, y down): the breath centres on it. */
  point: [number, number]
  /** The browser went offline while waiting (the navigation cannot be called off). */
  offline: boolean
}

let pending: Pending | null = null
const listeners = new Set<() => void>()
const emit = () => {
  for (const fn of listeners) fn()
}

export const getPending = () => pending

export function setPending(next: Omit<Pending, 'offline'>) {
  pending = { ...next, offline: false }
  emit()
}

export function markPendingOffline() {
  if (!pending || pending.offline) return
  pending = { ...pending, offline: true }
  emit()
}

export function clearPending() {
  if (!pending) return
  pending = null
  emit()
}

export function onPending(fn: () => void) {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

/** The pending play, for React (server render: none). */
export function usePlayPending() {
  return useSyncExternalStore(onPending, getPending, () => null)
}

/** A plain message near the hand after a play was called off (offline), for `seconds`. */
export type Notice = { kind: 'offline'; until: number } | null
let notice: Notice = null
let noticeTimer = 0
const noticeListeners = new Set<() => void>()

export function showNotice(kind: 'offline', seconds: number) {
  clearTimeout(noticeTimer)
  notice = { kind, until: performance.now() + seconds * 1000 }
  for (const fn of noticeListeners) fn()
  noticeTimer = window.setTimeout(() => {
    notice = null
    for (const fn of noticeListeners) fn()
  }, seconds * 1000)
}

const onNotice = (fn: () => void) => {
  noticeListeners.add(fn)
  return () => void noticeListeners.delete(fn)
}

export function useNotice() {
  return useSyncExternalStore(
    onNotice,
    () => notice,
    () => null,
  )
}
