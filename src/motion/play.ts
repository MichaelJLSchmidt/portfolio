import { animate } from 'motion/mini'
import { cardIdForPath } from '@/lib/hand-data'
import { pagePath } from '@/lib/i18n'
import { type FlightSource, type Flight, getFlight, routeKey, setFlight } from './flight'
import { beginLocaleSwitch } from './locale-switch'
import { table } from './table-store'
import { cardPlay, hand as H, spring, springCss } from './tokens'
import { LOCALE, NAV, PLAY, RETURN, SWITCH } from './transitions'
import { clearPending, getPending, markPendingOffline, setPending, showNotice } from './use-play-pending'

/*
 * Playing a card: "the card hits the table". Stage 1 runs here, on a clone;
 * stage 2 is the view transition React runs for the navigation
 * (view-transitions.css). Every value: cardPlay in tokens.ts.
 *
 *   play     press (scale 0.97, an 8 ms haptic) · desktop: lift 16 px · the
 *            flight to the table's centre (x and y on separate curves: the arc;
 *            the scale rises, then drops into contact at speed) · contact: the
 *            contact shadow snaps and spreads, a 12 ms haptic, the field rings
 *            and blooms from the landing point · hold · navigate (type "play",
 *            or "switch" from an open card's page). The view transition starts
 *            only once the card is at rest: it snapshots the old page as it
 *            starts, and a card in mid-air would freeze or jump.
 *   return   the hero's details fade while the full-screen frame materialises
 *            again (the old snapshot needs a frame), then navigate (type
 *            "return"): the frame shrinks into the card's slot
 *   offline  at contact, navigator.onLine false: no navigation (once started
 *            it cannot be called off, and a failed fetch makes the router load
 *            the page in full); the card flies back to its slot, the bloom
 *            recedes and a plain message shows near the hand
 *
 * The clone (hand/table-card.tsx) is a portal of the card face laid out at
 * the table size, FLIP-inverted to the slot it leaves, so it lands at the
 * identity transform and its snapshot is rasterised at full size. Its
 * view-transition names (card-, card-band-, card-title-<id>) move from the
 * hand card to it for the flight. Reduced motion: no clone, no flight; the
 * press haptic, the field's colour fade and the navigation at once.
 */
type Navigate = (href: string, types: string[], replace?: boolean) => void

let navigate: Navigate | null = null
let prefetch: ((href: string) => void) | null = null

export function registerNavigate(fn: Navigate | null, pre: ((href: string) => void) | null = null) {
  navigate = fn
  prefetch = pre
}

/** Prefetches a card's route (pointerenter, focus, pointerdown on anything that plays it). */
export function prefetchCard(href: string) {
  prefetch?.(href)
}

const gapSpring = springCss(spring.gap)

const wide = () => typeof matchMedia === 'function' && matchMedia(`(min-width: ${H.breakpoint}px)`).matches
/** The play's values for this viewport: desktop from 1024 px, phones and tablets below. */
export const playTokens = () => (wide() ? cardPlay.play : cardPlay.mobilePlay)

/** A short vibration where supported (iOS has none: nothing happens there). */
export function haptic(ms: number) {
  if ('vibrate' in navigator) navigator.vibrate(ms)
}

const base = () => process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const currentRoute = () => routeKey(location.pathname.slice(base().length) || '/')

const onScreen = (el: Element | null) => {
  const r = el?.getBoundingClientRect()
  return r && r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth ? r : null
}

/** The element a card leaves when played without one named: its hand card, or its rail edge. */
function sourceOf(id: string) {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-play="${CSS.escape(id)}"]`))
    if (el.matches('.hand-card, .rail-card') && onScreen(el)) return el
  return null
}

const sourceKind = (el: HTMLElement): FlightSource =>
  el.closest('.rail-card') ? 'rail' : el.closest('.hand-card') ? 'fan' : 'page'

// ---------------------------------------------------------------- hero images

/** The hero image of each card's page, exactly as the page renders it (from the layout, per locale). */
export type HeroImage = { sources: { type: string; srcSet: string }[]; src: string; srcSet: string; sizes: string }
let heroes: Record<string, HeroImage> = {}
const warmed = new Set<string>()

export function registerHeroImages(map: Record<string, HeroImage>) {
  heroes = map
}

/**
 * Starts loading and decoding a card's hero image on the press (fire and forget): a detached
 * <picture> with the page's own sources, srcset and sizes, so the browser picks the same file and
 * the page finds it cached. The page's <img> keeps no onLoad prop (React would then stop waiting
 * for it before the view transition); it listens through a ref (case-hero.tsx).
 */
function warmHero(id: string) {
  const hero = heroes[id]
  if (!hero || warmed.has(id)) return
  warmed.add(id)
  const picture = document.createElement('picture')
  for (const s of hero.sources) {
    const source = document.createElement('source')
    source.type = s.type
    source.srcset = s.srcSet
    source.sizes = hero.sizes
    picture.append(source)
  }
  const img = document.createElement('img')
  img.decoding = 'async'
  img.fetchPriority = 'high'
  img.sizes = hero.sizes
  img.srcset = hero.srcSet
  img.src = hero.src
  picture.append(img)
  img.decode().catch(() => warmed.delete(id))
}

// ---------------------------------------------------------------- play

/** The clone's motion while it flies (one at a time). */
let run: { timers: number[]; anims: { stop: () => void }[]; flight: Flight; landed: boolean } | null = null
/** A return waiting for its frame (Back pressed, not yet navigated). */
let returning = 0

/**
 * Plays card `id` (from the hand, the rail or a Next project card): `source` is the element
 * pressed (default: its hand card or rail edge, whichever shows). False when it could not take
 * over (the router is not ready): the link then navigates on its own.
 */
export function play(id: string, href: string, source?: HTMLElement | null): boolean {
  if (!navigate) return false
  // A second play while one is on its way (or a return is) is ignored.
  if (getFlight() || returning || getPending()) return true
  const state = table.get()
  if (state.activeCard === id) return true
  const type = state.activeCard ? SWITCH : PLAY
  const T = playTokens()
  const from = source && onScreen(source) ? source : sourceOf(id)
  haptic(T.haptic.press)
  warmHero(id)
  prefetch?.(href)

  if (!from || state.tier !== 'full') {
    // Reduced motion, or nothing on screen to lift: the colour fades and the page changes at once.
    const r = from?.getBoundingClientRect()
    const point: [number, number] = r
      ? [(r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight]
      : [0.5, 1]
    table.play(id, r ?? new DOMRect(innerWidth / 2, innerHeight, 0, 0), href)
    go(id, href, type, point)
    return true
  }

  setFlight({ id, href, type, route: currentRoute(), source: from, from: sourceKind(from), leaving: state.activeCard })
  return true
}

/** Navigate and mark the wait for the next page (use-play-pending.ts). */
function go(id: string, href: string, type: string, point: [number, number]) {
  setPending({ id, href, at: performance.now(), point })
  navigate?.(href, [type])
}

type Pose = { x: number; y: number; scale: number; rotate: number; tilt: number }

/**
 * Where the clone starts, relative to its own box at the landing point (identity): the source's
 * centre, size, rotation and the fan's tilt. A rail edge shows only a card's top: the clone starts
 * at the edge's width with its top on the edge's top, the rest below the screen.
 */
function startPose(f: Flight, box: DOMRect): Pose {
  const r = f.source.getBoundingClientRect()
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2
  if (f.from === 'rail') {
    const scale = r.width / box.width
    return { x: r.left + r.width / 2 - cx, y: r.top + (box.height * scale) / 2 - cy, scale, rotate: 0, tilt: 0 }
  }
  const cs = getComputedStyle(f.source)
  const own = cs.scale === 'none' ? 1 : Number.parseFloat(cs.scale) || 1
  const rotate = cs.rotate === 'none' ? 0 : Number.parseFloat(cs.rotate) || 0
  const width = f.source.offsetWidth || r.width
  return {
    x: r.left + r.width / 2 - cx,
    y: r.top + r.height / 2 - cy,
    scale: (width * own) / box.width,
    rotate,
    tilt: f.from === 'fan' ? H.tilt : 0,
  }
}

const tx = (v: number) => `translateX(${v.toFixed(2)}px)`
const ty = (v: number) => `translateY(${v.toFixed(2)}px)`
const pose = (rotate: number, tilt: number) =>
  `perspective(${H.perspective}px) rotateX(${tilt}deg) rotate(${rotate}deg)`
const sc = (v: number) => `scale(${v.toFixed(4)})`

/**
 * Stage 1 on the mounted clone (called by hand/table-card.tsx in a layout effect, before the
 * first paint). Returns the cleanup the clone runs when it unmounts: inside the view
 * transition's update when the new page commits, or when the play is called off.
 */
export function runFlight(root: HTMLElement, f: Flight): () => void {
  const T = playTokens()
  const layer = (name: string) => root.querySelector<HTMLElement>(`[data-layer="${name}"]`)!
  const [X, Y, P, S] = ['x', 'y', 'pose', 'scale'].map(layer)
  const [lifted, contact, spread] = ['lifted', 'contact', 'spread'].map(layer)
  const box = root.getBoundingClientRect()
  const p0 = startPose(f, box)
  const start = { ...p0, rotate: p0.rotate + T.flight.rotateFrom }

  const press = T.press.dur
  const lift = T.lift.dur
  const fly = press + lift
  const total = fly + T.flight.dur
  const at = (t: number) => t / total
  const riseEnd = fly + T.rise.dur
  const liftY = start.y + T.lift.y
  const liftScale = p0.scale * T.lift.scale
  const pressScale = p0.scale * T.press.scale

  // FLIP: the first frame shows the clone exactly where the card is, before anything paints.
  X.style.transform = tx(p0.x)
  Y.style.transform = ty(p0.y)
  P.style.transform = pose(p0.rotate, p0.tilt)
  S.style.transform = sc(p0.scale)
  const anims: { stop: () => void }[] = []
  const timers: number[] = []
  run = { timers, anims, flight: f, landed: false }

  const withLift = lift > 0
  let scaled: ReturnType<typeof animate> | null = null
  anims.push(
    animate(
      X,
      { transform: [tx(p0.x), tx(p0.x), tx(0)] },
      { duration: total, times: [0, at(fly), 1], ease: ['linear', T.flight.x] },
    ),
    animate(
      Y,
      { transform: withLift ? [ty(p0.y), ty(p0.y), ty(liftY), ty(0)] : [ty(p0.y), ty(p0.y), ty(0)] },
      {
        duration: total,
        times: withLift ? [0, at(press), at(fly), 1] : [0, at(press), 1],
        ease: withLift ? ['linear', T.lift.ease, T.flight.y] : ['linear', T.flight.y],
      },
    ),
    animate(
      P,
      { transform: [pose(p0.rotate, p0.tilt), pose(start.rotate, p0.tilt), pose(start.rotate, p0.tilt), pose(0, 0)] },
      { duration: total, times: [0, at(press), at(fly), 1], ease: [T.press.ease, 'linear', T.flight.rotate] },
    ),
    (scaled = animate(
      S,
      {
        transform: withLift
          ? [sc(p0.scale), sc(pressScale), sc(liftScale), sc(T.rise.scale), sc(T.drop.scale)]
          : [sc(p0.scale), sc(pressScale), sc(T.rise.scale), sc(T.drop.scale)],
      },
      {
        duration: total,
        times: withLift ? [0, at(press), at(fly), at(riseEnd), 1] : [0, at(press), at(riseEnd), 1],
        ease: withLift
          ? [T.press.ease, T.lift.ease, T.rise.ease, T.drop.ease]
          : [T.press.ease, T.rise.ease, T.drop.ease],
      },
    )),
    // Shadows follow the scale: lifted while off the table (in with the lift or rise, out in the
    // drop), the contact shadow in as it lands.
    animate(
      lifted,
      { opacity: [T.shadow.rest, T.shadow.rest, 1, 0] },
      { duration: total, times: [0, at(press), at(riseEnd), 1], ease: 'linear' },
    ),
    animate(contact, { opacity: [0, 0, 1] }, { duration: total, times: [0, at(riseEnd), 1], ease: 'linear' }),
  )
  // From the rail the face fades in over the press (the edge shows only a card's top).
  if (f.from === 'rail') anims.push(animate(root, { opacity: [0, 1] }, { duration: press, ease: 'linear' }))

  // The card leaves its slot: hidden on the next frame (visibility: the layout does not move), the
  // fan's siblings close the gap, the rail's other edges step back; on a switch the open hero dims.
  const raf = requestAnimationFrame(() => {
    f.source.style.visibility = 'hidden'
  })
  closeGap(f)
  if (f.leaving) document.documentElement.dataset.switching = ''

  // Contact when the scale (the last channel to settle) has run out; the timer is the fallback.
  const contactAt = () => land(root, f, [contact, spread], box)
  void scaled?.then(contactAt)
  timers.push(window.setTimeout(contactAt, total * 1000 + 100))

  return () => {
    cancelAnimationFrame(raf)
    for (const t of timers) clearTimeout(t)
    for (const a of anims) a.stop()
    f.source.style.visibility = ''
    if (run?.flight === f) run = null
  }
}

/** Contact: identity transform, the contact shadow spreads, the impact haptic and the field's ring. */
function land(root: HTMLElement, f: Flight, [contact, spread]: HTMLElement[], box: DOMRect) {
  if (!run || run.flight !== f || run.landed) return
  run.landed = true
  const T = playTokens()
  for (const a of run.anims) a.stop()
  run.anims = []
  for (const el of root.querySelectorAll<HTMLElement>('[data-layer]')) {
    el.style.transform = ''
    el.style.opacity = ''
  }
  root.style.opacity = ''
  root.dataset.landed = ''
  const s = T.shadow.spread
  run.anims.push(
    animate(contact, { opacity: [1, 0] }, { duration: s.dur, ease: s.ease }),
    animate(spread, { opacity: [0, 1] }, { duration: s.dur, ease: s.ease }),
  )
  haptic(T.haptic.impact)
  const point: [number, number] = [(box.left + box.width / 2) / innerWidth, (box.top + box.height / 2) / innerHeight]
  table.play(f.id, box, f.href, true)
  if (!navigator.onLine) {
    run.timers.push(window.setTimeout(() => flyBack(root, f), cardPlay.loading.offline.hold * 1000))
    return
  }
  run.timers.push(
    window.setTimeout(() => {
      if (run?.flight !== f) return
      go(f.id, f.href, f.type, point)
    }, T.hold * 1000),
  )
}

/** Offline: the card flies back to its slot, the bloom recedes, a plain message near the hand. */
function flyBack(root: HTMLElement, f: Flight) {
  if (!run || run.flight !== f) return
  const back = cardPlay.loading.offline.back
  const p0 = startPose(f, root.getBoundingClientRect())
  table.cancelPlay()
  const opts = { duration: back.dur, ease: back.ease }
  run.anims.push(
    animate(root.querySelector<HTMLElement>('[data-layer="x"]')!, { transform: [tx(0), tx(p0.x)] }, opts),
    animate(root.querySelector<HTMLElement>('[data-layer="y"]')!, { transform: [ty(0), ty(p0.y)] }, opts),
    animate(
      root.querySelector<HTMLElement>('[data-layer="pose"]')!,
      { transform: [pose(0, 0), pose(p0.rotate, p0.tilt)] },
      opts,
    ),
    animate(root.querySelector<HTMLElement>('[data-layer="scale"]')!, { transform: [sc(1), sc(p0.scale)] }, opts),
    animate(root.querySelector<HTMLElement>('[data-layer="spread"]')!, { opacity: [1, 0] }, opts),
  )
  run.timers.push(
    window.setTimeout(() => {
      endFlight()
      showNotice('offline', cardPlay.loading.offline.message)
    }, back.dur * 1000),
  )
}

/** The fan's siblings close the played card's gap (spring.gap); the rail's other edges step back. */
function closeGap(f: Flight) {
  if (f.from === 'rail') {
    const rail = f.source.closest<HTMLElement>('.hand-rail')
    if (rail) rail.dataset.playing = f.id
    return
  }
  if (f.from !== 'fan') return
  const slot = f.source.closest<HTMLElement>('.hand-slot')
  const row = slot?.closest<HTMLElement>('.hand-row')
  if (!slot || !row) return
  const half = (slot.offsetWidth - Number.parseFloat(getComputedStyle(row).getPropertyValue('--overlap'))) / 2
  row.dataset.closing = ''
  let before = true
  for (const other of row.querySelectorAll<HTMLElement>('.hand-slot')) {
    if (other === slot) {
      before = false
      continue
    }
    other.style.setProperty('--gap', `${before ? half : -half}px`)
  }
}

/** The siblings open around the slot again and the rail's edges return (after a commit or a cancel). */
function openGap() {
  for (const row of document.querySelectorAll<HTMLElement>('.hand-row[data-closing]')) {
    delete row.dataset.closing
    // The siblings open on the same spring (data-opening holds its timing until they have).
    row.dataset.opening = ''
    window.setTimeout(() => delete row.dataset.opening, gapSpring.duration * 1000)
    for (const other of row.querySelectorAll<HTMLElement>('.hand-slot')) other.style.removeProperty('--gap')
  }
  for (const rail of document.querySelectorAll<HTMLElement>('.hand-rail[data-playing]')) delete rail.dataset.playing
}

/** Ends a flight without a navigation (Escape, the double-tap egg, offline): everything back as it was. */
function endFlight() {
  const f = getFlight()
  if (!f) return false
  const landed = run?.flight === f && run.landed
  setFlight(null)
  openGap()
  delete document.documentElement.dataset.switching
  if (landed) table.cancelPlay()
  return true
}

/** Calls a play off while the card is on its way (Escape, the double-tap egg). False when nothing flew. */
export function cancelPlay() {
  if (getPending()) return false
  return endFlight()
}

/**
 * The route changed (the hand's layout effect, inside the view transition's update): the flight
 * is over (its clone unmounts in this commit), the siblings open around the ghost again, a
 * switch's dim and a return's frame end with the page they were on.
 */
export function settlePlay(route: string) {
  const f = getFlight()
  if (f && f.route !== route) setFlight(null)
  // The next page has committed: the wait is over (the pending signal, use-play-pending.ts).
  clearPending()
  openGap()
  const root = document.documentElement
  delete root.dataset.switching
  delete root.dataset.returning
  clearTimeout(returning)
  returning = 0
}

// ---------------------------------------------------------------- return

/**
 * Back to the table (Back, Escape; `href`: home in the current locale). Full tier, on a card's
 * page: the hero's details fade out while the full-screen frame materialises again
 * (html[data-returning], detail.css), then navigate with type "return", and the frame shrinks into
 * the card's slot. Reduced, or nothing open: navigate at once.
 */
export function returnHome(href: string) {
  if (!navigate) return false
  if (getFlight()) {
    cancelPlay()
    return true
  }
  if (returning || getPending()) return true
  const state = table.get()
  const send = () => {
    returning = 0
    table.returnHome(href)
    navigate?.(href, [RETURN])
  }
  if (state.tier !== 'full' || !state.activeCard) {
    send()
    return true
  }
  document.documentElement.dataset.returning = ''
  returning = window.setTimeout(send, cardPlay.return.navigate * 1000)
  return true
}

// ---------------------------------------------------------------- pending: offline while waiting

if (typeof window !== 'undefined')
  addEventListener('offline', () => {
    if (getPending()) markPendingOffline()
  })

// ---------------------------------------------------------------- browser back / forward

const normalise = (path: string) => path.replace(/\/$/, '') || '/'

/**
 * Browser back / forward: React does not run view transitions for popstate
 * updates, so the history step is taken over (before the router sees it) and
 * replayed as a navigation to the same URL inside a transition. It carries no
 * play / return / switch type (nothing flew, no frame re-materialised), so
 * every <ViewTransition> map falls back to its default: the shared-element
 * morph (vt-morph) between the hand card and the hero. The table still learns
 * what happened (the field blooms or contracts). The same page in the other
 * language cross-fades like the language switch. Other history entries are
 * left to the router.
 */
export function interceptHistory(current: () => string) {
  const onPop = (e: PopStateEvent) => {
    if (!navigate || !(e.state as { __NA?: boolean } | null)?.__NA) return
    const to = normalise(location.pathname.slice(base().length))
    const from = current()
    if (to === from) return
    e.stopImmediatePropagation()
    endFlight()
    settlePlay(from)
    const fromCard = cardIdForPath(from)
    const toCard = cardIdForPath(to)
    let types: string[] = []
    if (pagePath(to) === pagePath(from)) {
      // The same page in the other language: never a card transition.
      beginLocaleSwitch(null)
      types = [LOCALE]
    } else if (toCard) {
      const [x, y] = table.slotOf(toCard) ?? [0.5, 1]
      table.play(toCard, new DOMRect(x * innerWidth - 1, y * innerHeight - 1, 2, 2), to)
    } else if (fromCard) {
      if (pagePath(to) === '/') table.returnHome(to)
    } else types = [NAV]
    const href = to + location.search + location.hash
    // Outside the popstate event, so React treats it as an ordinary transition.
    window.setTimeout(() => navigate?.(href, types, true))
  }
  addEventListener('popstate', onPop, true)
  return () => removeEventListener('popstate', onPop, true)
}
