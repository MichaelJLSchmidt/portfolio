import { useSyncExternalStore } from 'react'

/*
 * The card in flight: what stage 1 of a play is doing right now, outside React
 * so play.ts (a plain module) can start it and the hand can render the clone.
 *
 *   play() sets it      the hand renders the table card (a portal clone of the
 *                       face at the table size, hand/table-card.tsx) while the
 *                       route is still `route`
 *   the navigation      the route changes inside the view transition's update:
 *                       the clone is no longer rendered, so it unmounts in the
 *                       same commit as the new page mounts and React pairs
 *                       their view-transition names (card-, card-band-,
 *                       card-title-<id>)
 *   the hand's layout   clears it once the new route has committed
 *   effect
 *
 * While a flight is set, the played card's face in the hand carries no names
 * (they move to the clone), and on a switch the open page's hero stands down
 * (no names: its card re-enters its slot instead of morphing back).
 */
export type FlightSource = 'fan' | 'rail' | 'page'

export type Flight = {
  /** The card being played. */
  id: string
  href: string
  type: 'play' | 'switch'
  /** The route (no base path, no trailing slash) the flight started on; the clone renders only there. */
  route: string
  /** The element the card leaves (a hand card, a rail edge, the Next project card). */
  source: HTMLElement
  from: FlightSource
  /** The open card's page being left (a switch), or null. */
  leaving: string | null
  /** Increments per flight, so a component can tell two flights of the same card apart. */
  seq: number
}

let flight: Flight | null = null
let seq = 0
const listeners = new Set<() => void>()
const emit = () => {
  for (const fn of listeners) fn()
}

export const getFlight = () => flight

export function setFlight(next: Omit<Flight, 'seq'> | null) {
  flight = next ? { ...next, seq: ++seq } : null
  emit()
}

export function subscribeFlight(fn: () => void) {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

/** The flight, for React (server render: none). */
export function useFlight() {
  return useSyncExternalStore(subscribeFlight, getFlight, () => null)
}

/** A route as the flight compares it: no base path, no trailing slash. */
export const routeKey = (path: string) => path.replace(/\/$/, '') || '/'
