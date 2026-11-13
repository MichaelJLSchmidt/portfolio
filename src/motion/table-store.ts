import { cardPath } from '@content/deck'
import type { Identity } from '@/design/palette'
import { cardIdForPath, cardIds, identityOf } from '@/lib/hand-data'
import { pagePath } from '@/lib/i18n'
import type { MotionTier } from './tokens'

/*
 * The table: a tiny store outside React. Persistent components (background
 * field, hand) subscribe to it and update DOM / shader uniforms directly, so
 * hovering or playing a card never re-renders React.
 *
 *   activeCard  the card whose page is open (null elsewhere)
 *   hoverCard   the card under the pointer or focus (after the intent delay)
 *   lastPlayed  the last card played
 *   field       what the background should show, with how to get there
 *
 * Paths carry the locale (/de/about/); which card or page a route is, is read
 * without it, so a language switch (the same page in the other locale) moves
 * nothing on the table.
 */

export type FieldKind = 'instant' | 'bloom' | 'unbloom' | 'switch' | 'crossfade'

export type FieldTarget = {
  identity: Identity
  /** 1: the identity fills the page (bloomed); 0: ink field with pools. */
  spread: 0 | 1
  /** Bloom / unbloom centre in viewport fractions (x right, y down). */
  origin: [number, number]
  /** About's contour lines. */
  topo: 0 | 1
  kind: FieldKind
  /** A card met the table at `origin`: the field runs one soft ring in the identity's colour from there. */
  ring?: boolean
  /** Increments on every change, so subscribers can tell targets apart. */
  seq: number
}

export type TableState = {
  activeCard: string | null
  hoverCard: string | null
  lastPlayed: string | null
  tier: MotionTier
  breaker: boolean
  field: FieldTarget
}

type Listener = (state: TableState, prev: TableState) => void

let state: TableState = {
  activeCard: null,
  hoverCard: null,
  lastPlayed: null,
  tier: 'full',
  breaker: false,
  field: { identity: 'ink', spread: 0, origin: [0.5, 1], topo: 0, kind: 'instant', seq: 0 },
}
const listeners = new Set<Listener>()
let slotCenter: (id: string) => [number, number] | null = () => null
/** A play/return/switch already set the field for this path; route sync leaves it. */
let pendingPath: string | null = null
/** The intent behind the next navigation (play / switch / return / locale), read once by the reveal system. */
let intent: 'play' | 'switch' | 'return' | 'locale' | null = null
/** The last route the table followed: the full path and the page without its locale. */
let lastRoute: { full: string; page: string } | null = null

function set(patch: Partial<TableState>) {
  const prev = state
  state = { ...state, ...patch }
  for (const fn of listeners) fn(state, prev)
}

function field(target: Omit<FieldTarget, 'seq'>) {
  set({ field: { ...target, seq: state.field.seq + 1 } })
}

const center = (rect: DOMRect): [number, number] => [
  (rect.left + rect.width / 2) / innerWidth,
  (rect.top + rect.height / 2) / innerHeight,
]
const normalise = (path: string) => path.replace(/\/$/, '') || '/'

export const table = {
  get: () => state,
  subscribe(fn: Listener) {
    listeners.add(fn)
    return () => void listeners.delete(fn)
  },
  setTier: (tier: MotionTier) => set({ tier }),
  setBreaker: (breaker: boolean) => state.breaker !== breaker && set({ breaker }),
  /** The hand tells the table where each card slot is (viewport fractions). */
  registerSlots(fn: (id: string) => [number, number] | null) {
    slotCenter = fn
  },
  slotOf: (id: string) => slotCenter(id),

  /** Returns and clears the intent of the navigation that just happened. */
  takeIntent() {
    const value = intent
    intent = null
    return value
  },
  /** The intent of the navigation under way, without clearing it (the new page reads it while it renders). */
  peekIntent: () => intent,

  hover(id: string | null) {
    if (state.hoverCard !== id) set({ hoverCard: id })
  },

  /**
   * Play: the field blooms from the card into its colour. `ring`: the card has just met the table
   * at `rect` (the play's impact), so the field also rings once from there.
   */
  play(id: string, rect: DOMRect, href: string, ring = false) {
    const identity = identityOf(id)
    if (!identity) return
    pendingPath = normalise(href)
    const switching = state.field.spread === 1
    intent = state.activeCard ? 'switch' : 'play'
    set({ hoverCard: null, lastPlayed: id })
    field({ identity, spread: 1, origin: center(rect), topo: 0, kind: switching ? 'switch' : 'bloom', ring })
  },

  /**
   * A play called off after its bloom started (offline at the impact, Escape): no navigation
   * follows, so the intent goes and the field returns to what the current route shows (the bloom
   * recedes into where it came from; on an open card's page, that card's colour comes back).
   */
  cancelPlay() {
    pendingPath = null
    intent = null
    const current = state.activeCard
    const identity = identityOf(current)
    if (current && identity) {
      field({ identity, spread: 1, origin: state.field.origin, topo: 0, kind: 'switch' })
      return
    }
    const page = lastRoute?.page ?? '/'
    const glacier = page === '/about' || page === '/about/thesis'
    field({
      identity: glacier ? 'glacier' : 'ink',
      spread: 0,
      origin: state.field.origin,
      topo: page === '/about' ? 1 : 0,
      kind: 'unbloom',
    })
  },

  /** Language switch: the same page in the other locale; the reveal system shows it final at once. */
  switchLocale() {
    intent = 'locale'
  },

  /** Return: the field contracts into the card's slot, then goes back to ink. `href`: home in the current locale. */
  returnHome(href: string) {
    pendingPath = normalise(href)
    intent = 'return'
    const from = state.activeCard
    const origin = (from && slotCenter(from)) || [0.5, 1]
    field({ identity: 'ink', spread: 0, origin, topo: 0, kind: 'unbloom' })
  },

  /**
   * Route change (any navigation, including browser back/forward and direct
   * loads): set activeCard and, unless an intent already did, the field.
   */
  route(pathname: string, initial: boolean) {
    const full = normalise(pathname)
    const path = pagePath(full)
    // The same page in the other language (the switcher, or back / forward across it): nothing moves.
    const languageOnly = !initial && lastRoute !== null && lastRoute.page === path && lastRoute.full !== full
    lastRoute = { full, page: path }
    if (languageOnly) {
      pendingPath = null
      return
    }
    const cardId = cardIdForPath(path)
    const identity = identityOf(cardId)
    const activeCard = cardId
    const prevActive = state.activeCard
    set({ activeCard, hoverCard: null, ...(cardId ? { lastPlayed: cardId } : {}) })
    if (pendingPath === full) {
      pendingPath = null
      return
    }
    pendingPath = null
    const kind = (k: FieldKind): FieldKind => (initial ? 'instant' : k)
    if (cardId && identity) {
      const origin = slotCenter(cardId) ?? [0.5, 1]
      field({
        identity,
        spread: 1,
        origin,
        topo: 0,
        kind: kind(state.field.spread === 1 ? 'switch' : 'bloom'),
      })
      return
    }
    if (path === '/about') {
      field({ identity: 'glacier', spread: 0, origin: state.field.origin, topo: 1, kind: kind('crossfade') })
      return
    }
    // The thesis overview (R8): the table field in the glacier tint, not the contour map.
    if (path === '/about/thesis') {
      field({ identity: 'glacier', spread: 0, origin: state.field.origin, topo: 0, kind: kind('crossfade') })
      return
    }
    // Home and 404: back to the ink field.
    if (state.field.spread === 1 && prevActive) {
      const origin = slotCenter(prevActive) ?? [0.5, 1]
      field({ identity: 'ink', spread: 0, origin, topo: 0, kind: kind('unbloom') })
    } else {
      field({ identity: 'ink', spread: 0, origin: [0.5, 1], topo: 0, kind: kind('crossfade') })
    }
  },
}

/**
 * Identity per page path (without the locale) for the pre-paint script (card pages, About and the
 * thesis overview), so direct loads paint their colour.
 */
export const pathFields = (): Record<string, Identity> => ({
  ...Object.fromEntries(cardIds.map((id) => [cardPath(id), identityOf(id)!])),
  '/about': 'glacier',
  '/about/thesis': 'glacier',
})

/** Paths that show About's contour map (the pre-paint script marks them with data-about-map). */
export const mapPaths = ['/about']
