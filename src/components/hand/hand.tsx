'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { contour, palette } from '@/design/palette'
import { attachHandEggs, tap, untapAll } from '@/eggs/hand-eggs'
import { useChrome } from '@/lib/chrome'
import { pagePath } from '@/lib/i18n'
import { routeKey, useFlight } from '@/motion/flight'
import {
  type HeroImage,
  cancelPlay,
  play,
  playTokens,
  prefetchCard,
  registerHeroImages,
  returnHome,
  settlePlay,
} from '@/motion/play'
import { drawCards } from '@/motion/reveal'
import { table } from '@/motion/table-store'
import { angle, cardPlay, duration, ease } from '@/motion/tokens'
import { NAV } from '@/motion/transitions'
import '@/motion/view-transition'
import { CardBack, CardFace } from './card-face'
import { TableCard } from './table-card'

/** Outer cards sit a little lower: the hand's arc (px at desktop size). */
const ARC = [10, 2, 2, 10]
const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`

/*
 * The hand: exactly four cards (three case studies and Management) as the
 * primary navigation, in two navs (one shows at a time):
 *   fan    desktop on every route, phones on home: the cards in a perspective
 *          fan at the bottom (72% visible on home, 45% elsewhere)
 *   rail   phones off home: a 48 px rail of four real links, each a quarter of
 *          the width and the rail's full height; one tap plays the card (the
 *          press shows on pointerdown and is called off by a scroll, the play
 *          runs on click); the open card's edge sits lower with an accent line
 *          and scrolls its page to the top
 * Playing a card (src/motion/play.ts) renders its clone on the table
 * (table-card.tsx) while the route is still this one; the face in the hand
 * hands its view-transition names over meanwhile. Hover and focus are pure
 * CSS; the background hears about them through the table store after an
 * 80 ms intent delay. Nothing here re-renders React except a route change and
 * a play. Card copy and links come from the active locale (useChrome); routes
 * are matched without their locale, so a language switch re-renders the words
 * and moves nothing. Styles in src/styles/hand.css. Contract: docs/contracts.md#hand.
 */
export function Hand({ heroes }: { heroes: Record<string, HeroImage> }) {
  const chrome = useChrome()
  const { handCards, handLabels, coffeeEgg, cardForPath } = chrome
  const pathname = usePathname()
  const route = routeKey(pathname)
  const path = pagePath(pathname)
  const home = path === '/'
  const active = cardForPath(path)?.id ?? null
  const homeHref = chrome.href('/')
  const homeRef = useRef(homeHref)
  homeRef.current = homeHref
  const hrefs = handCards.map((c) => c.href).join(' ')
  const cardHref = useRef((id: string) => handCards.find((c) => c.id === id)?.href ?? null)
  cardHref.current = (id: string) => handCards.find((c) => c.id === id)?.href ?? null
  const root = useRef<HTMLDivElement>(null)
  const flight = useFlight()
  const flying = flight && flight.route === route ? flight : null
  const flyingCard = flying ? (handCards.find((c) => c.id === flying.id) ?? null) : null
  // Roving tabindex: one tab stop for the whole fan, on the open card if any.
  const roving = useRef<string>(active ?? handCards[0].id)
  const lastActive = useRef(active)
  if (active && lastActive.current !== active) roving.current = active
  lastActive.current = active
  // Egg: typing "draw" on the start page deals a fifth card, "Coffee?".
  const [coffee, setCoffee] = useState(false)
  const coffeeRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => registerHeroImages(heroes), [heroes])

  // Escape calls a play off while the card flies, and otherwise returns from an open card's page.
  // (The router for play / return and the back / forward replay live in RouterBridge, in the root
  // layout: they outlive a language switch.) Prefetch: Next's <Link> prefetches on its own
  // ("auto"); the play also prefetches on intent (pointerenter, focus, pointerdown).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (cancelPlay()) return
      if (!table.get().activeCard || document.querySelector('dialog[open]')) return
      returnHome(homeRef.current)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [hrefs])

  // The hand shows 72% on home and 45% elsewhere: off home, pages keep the collapsed
  // reserve (:root[data-hand="collapsed"] -> --hand-reserve 120px in layout.css). The
  // pre-paint script sets the same attribute for the first paint (motion/preferences.ts).
  useLayoutEffect(() => {
    const root = document.documentElement
    if (home) delete root.dataset.hand
    else root.dataset.hand = 'collapsed'
  }, [home])

  // Inside the view transition's update, once the route has changed: the flight is over (its
  // clone unmounted in this commit), the siblings open around the ghost again, tapped cards untap.
  // A switch: the card whose page was left re-enters its slot (or its rail edge returns), late,
  // rising a little. A return: the card that came back sits on top of its neighbours (as it did
  // while it morphed in, above the hand) until the pointer next moves over the hand.
  const prevPath = useRef(path)
  useLayoutEffect(() => {
    const from = prevPath.current
    prevPath.current = path
    const intent = table.peekIntent()
    settlePlay(route)
    untapAll()
    const nav = root.current
    if (!nav || from === path) return
    for (const slot of nav.querySelectorAll<HTMLElement>('[data-returned]')) delete slot.dataset.returned
    const left = cardForPath(from)
    if (!left || table.get().tier !== 'full') return
    if (intent === 'switch') {
      const S = cardPlay.switch.reenter
      const wideView = playTokens() === cardPlay.play
      for (const el of nav.querySelectorAll<HTMLElement>(`[data-play="${CSS.escape(left.id)}"]`)) {
        if (!el.getClientRects().length) continue
        el.animate(
          [
            { opacity: 0, transform: `translateY(${S.y}px)` },
            { opacity: 1, transform: 'none' },
          ],
          {
            duration: S.dur * 1000,
            delay: (wideView ? S.at : S.atMobile) * 1000,
            easing: bezier(ease.outQuint),
            fill: 'backwards',
          },
        )
      }
    } else if (intent === 'return') {
      const slot = nav.querySelector<HTMLElement>(`.hand-slot[data-slot="${CSS.escape(left.id)}"]`)
      if (slot) slot.dataset.returned = ''
    }
  }, [path, route, cardForPath])

  // Eggs on the hand: inspect, tap (T, a double tap on a card, or a tap on it while it flies), new hand
  // (long press on the table).
  useEffect(() => {
    const nav = root.current!
    const off = attachHandEggs(nav)
    const onDoubleTap = (e: Event) => {
      const card = (e as CustomEvent<HTMLElement>).detail
      if (cancelPlay()) tap(card)
    }
    const onCoffee = () => setCoffee(true)
    nav.addEventListener('egg:double-tap', onDoubleTap)
    addEventListener('egg:coffee', onCoffee)
    return () => {
      off()
      nav.removeEventListener('egg:double-tap', onDoubleTap)
      removeEventListener('egg:coffee', onCoffee)
    }
  }, [])

  useEffect(() => {
    if (!home) setCoffee(false)
  }, [home])

  useEffect(() => {
    const card = coffeeRef.current
    if (!coffee || !card) return
    if (table.get().tier === 'full') drawCards([card], 0)
    else card.dataset.drawn = ''
  }, [coffee])

  // The scrim under the fan follows the page colour (on About: the contour field's ground).
  useEffect(() => {
    const nav = root.current!
    const paint = () => {
      const f = table.get().field
      nav.style.setProperty('--page-field', f.topo ? contour.ground : palette[f.identity].field)
    }
    paint()
    return table.subscribe((s, p) => {
      if (s.field.seq !== p.field.seq) paint()
    })
  }, [])

  // Slots, hover intent, prefetch on intent, keyboard, the rail's press.
  useEffect(() => {
    const nav = root.current!
    table.registerSlots((id) => {
      for (const el of nav.querySelectorAll<HTMLElement>(`[data-slot="${id}"], [data-slot-anchor="${id}"]`)) {
        const r = el.getBoundingClientRect()
        if (!r.width) continue
        const bottom = Math.min(r.bottom, innerHeight)
        return [(r.left + r.width / 2) / innerWidth, Math.min(1, (r.top + bottom) / 2 / innerHeight)]
      }
      return null
    })

    let timer = 0
    let current: string | null = null
    const intent = (id: string | null) => {
      if (id === current) return
      current = id
      clearTimeout(timer)
      if (id) timer = window.setTimeout(() => table.hover(id), duration.hoverIntent * 1000)
      else table.hover(null)
    }
    const linkOf = (el: EventTarget | null) =>
      el instanceof Element ? el.closest<HTMLAnchorElement>('a[data-play]') : null
    const cardOf = (el: EventTarget | null) => linkOf(el)?.dataset.play ?? null
    // Prefetch on intent: the card's route as the router knows it (no base path).
    const warm = (el: EventTarget | null) => {
      const id = cardOf(el)
      const href = id && id !== table.get().activeCard ? cardHref.current(id) : null
      if (href) prefetchCard(href)
    }

    const onOver = (e: PointerEvent) => {
      for (const slot of nav.querySelectorAll<HTMLElement>('[data-returned]')) delete slot.dataset.returned
      warm(e.target)
      if (e.pointerType === 'touch') return
      intent(cardOf(e.target))
    }
    const onLeave = () => intent(null)
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      warm(el)
      if (el.matches(':focus-visible') && el.closest('.hand-fan')) intent(cardOf(el))
    }
    const onFocusOut = (e: FocusEvent) => {
      if (!nav.contains(e.relatedTarget as Node)) intent(null)
    }

    // The rail: the press shows from pointerdown; a scroll (pointercancel) or more than `slop` px of
    // movement calls it off. The play itself runs on click, which the browser suppresses once it
    // has taken the gesture over for a scroll: that is the tap / scroll distinction.
    const slop = cardPlay.mobilePlay.rail.slop
    let pressed: { el: HTMLElement; x: number; y: number } | null = null
    const release = () => {
      if (pressed) delete pressed.el.dataset.pressed
      pressed = null
    }
    const onDown = (e: PointerEvent) => {
      warm(e.target)
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>('.rail-card') : null
      release()
      if (!el || e.button !== 0) return
      pressed = { el, x: e.clientX, y: e.clientY }
      el.dataset.pressed = ''
    }
    const onMove = (e: PointerEvent) => {
      if (pressed && Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y) > slop) release()
    }

    const items = () =>
      [...nav.querySelectorAll<HTMLElement>('[data-roving]')].filter((el) => el.getClientRects().length > 0)
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (!el.dataset.roving || e.altKey || e.ctrlKey || e.metaKey) return
      const list = items()
      const i = list.indexOf(el)
      const next =
        e.key === 'ArrowRight'
          ? list[Math.min(i + 1, list.length - 1)]
          : e.key === 'ArrowLeft'
            ? list[Math.max(i - 1, 0)]
            : e.key === 'Home'
              ? list[0]
              : e.key === 'End'
                ? list[list.length - 1]
                : null
      if (!next) return
      e.preventDefault()
      for (const item of nav.querySelectorAll<HTMLElement>('[data-roving]')) item.tabIndex = -1
      next.tabIndex = 0
      roving.current = next.dataset.roving!
      next.focus()
    }

    nav.addEventListener('pointerover', onOver)
    nav.addEventListener('pointerleave', onLeave)
    nav.addEventListener('pointerdown', onDown)
    nav.addEventListener('pointermove', onMove)
    nav.addEventListener('pointerup', release)
    nav.addEventListener('pointercancel', release)
    nav.addEventListener('focusin', onFocusIn)
    nav.addEventListener('focusout', onFocusOut)
    nav.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      table.hover(null)
      nav.removeEventListener('pointerover', onOver)
      nav.removeEventListener('pointerleave', onLeave)
      nav.removeEventListener('pointerdown', onDown)
      nav.removeEventListener('pointermove', onMove)
      nav.removeEventListener('pointerup', release)
      nav.removeEventListener('pointercancel', release)
      nav.removeEventListener('focusin', onFocusIn)
      nav.removeEventListener('focusout', onFocusOut)
      nav.removeEventListener('keydown', onKey)
    }
  }, [])

  /** The element a card leaves when it is played from here (Next's onNavigate passes no DOM event). */
  const source = (kind: string, id: string) =>
    root.current?.querySelector<HTMLElement>(`${kind}[data-play="${CSS.escape(id)}"]`) ?? null

  /** The open card: back to the top of its page (at once under reduced motion), no navigation. */
  const toTop = () => scrollTo({ top: 0, behavior: table.get().tier === 'full' ? 'smooth' : 'auto' })

  return (
    <div ref={root} className="hand" data-home={home ? '' : undefined}>
      <nav className="hand-rail" aria-label={handLabels.nav}>
        {handCards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="rail-card"
            data-identity={card.identity}
            data-play={card.id}
            data-slot-anchor={card.id}
            aria-current={card.id === active ? 'page' : undefined}
            onNavigate={(e) => {
              if (card.id === active) {
                e.preventDefault()
                toTop()
              } else if (play(card.id, card.href, source('.rail-card', card.id))) e.preventDefault()
            }}
          >
            <span className="rail-card-label">{card.railLabel}</span>
            <span className="sr-only">{card.title}</span>
          </Link>
        ))}
      </nav>
      <nav className="hand-fan" aria-label={handLabels.nav}>
        <div className="hand-row">
          <ul className="hand-list">
            {handCards.map((card, i) => (
              <li
                key={card.id}
                className="hand-slot"
                data-slot={card.id}
                style={{ '--r': `${angle.hand[i]}deg`, '--dy': `${ARC[i]}px` } as CSSProperties}
              >
                <Link
                  href={card.href}
                  className="hand-card"
                  data-identity={card.identity}
                  data-play={card.id}
                  data-roving={card.id}
                  tabIndex={roving.current === card.id ? 0 : -1}
                  aria-current={card.id === active ? 'page' : undefined}
                  onNavigate={(e) => {
                    if (card.id === active) {
                      e.preventDefault()
                      toTop()
                    } else if (play(card.id, card.href, source('.hand-card', card.id))) e.preventDefault()
                  }}
                >
                  {card.id === active ? (
                    <span className="hand-ghost">
                      <span aria-hidden="true">{handLabels.viewing}</span>
                      <span className="sr-only">{card.title}</span>
                    </span>
                  ) : (
                    <>
                      <CardFace card={card} standDown={flyingCard?.id === card.id} />
                      {/* Seen only while the card flips during the first-visit draw. */}
                      <CardBack />
                    </>
                  )}
                </Link>
              </li>
            ))}
            {coffee && home && (
              <li className="hand-slot" data-slot="coffee" style={{ '--r': '15deg', '--dy': '24px' } as CSSProperties}>
                <Link
                  ref={coffeeRef}
                  href={chrome.href('/about#contact')}
                  className="hand-card hand-coffee"
                  transitionTypes={[NAV]}
                >
                  <span className="card-face" data-identity="saffron">
                    <span className="card-band">
                      <span className="card-title">{coffeeEgg.title}</span>
                      <span className="card-type">{coffeeEgg.cta}</span>
                    </span>
                    <span className="card-summary">{coffeeEgg.body}</span>
                  </span>
                  <CardBack />
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>
      {flying && flyingCard && (
        <TableCard
          flight={flying}
          card={flyingCard}
          onTap={() => {
            const card = source('.hand-card', flyingCard.id)
            if (cancelPlay() && card) tap(card)
          }}
        />
      )}
    </div>
  )
}
