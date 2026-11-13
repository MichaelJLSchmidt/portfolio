'use client'

import { hover, press } from 'motion'
// WAAPI-only animate (transforms and opacity are all the logo needs): keeps the full engine off every page.
import { animate } from 'motion/mini'
import { type Ref, type RefObject, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { CHROME_IN, INTRO_DONE } from '@/motion/preferences'
import { ease, logo as L } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'

/*
 * The logo: two fanned cards in the hand's card ratio, an M cut out of the back
 * card and an F out of the front one; the front card covers the M's right stem,
 * so the two letters share it. The back card is the text colour, the front card
 * a gradient from the cards' colours: one of four per page load (palette.ts
 * logoGradients, picked by the pre-paint script, --logo-a / -b / -c), whose
 * colours flow along the card very slowly (header.module.css, `logo.flow`;
 * phase-locked to the page clock, so a remount, e.g. a language switch, does
 * not jump). Reduced motion: the gradient holds still.
 *
 * Geometry from the logo lab (concept 3, master), copied here so the lab can be
 * deleted without touching the site: user units of the lab's 48-unit box, the
 * viewBox cropped to the fan. The front card's outline, widened by 1.5 units, is
 * knocked out of the back card, so the overlap reads in one colour too.
 * Decorative: the link around it carries the name.
 *
 * Motion (the lab's concept 3 moments, tokens in src/motion/tokens.ts `logo`):
 * Motion animate() on the two card groups, transforms and opacity only; the
 * front card's knock-out in the back card moves with it. Each card has a "move"
 * group (deal, exit, turn) and a "fan" group inside it (hover), so the moments
 * never fight over one transform.
 *   deal    the home intro deals the cards once a session (CHROME_IN)
 *   hover   hover (Motion hover(): no emulated touch hovers) and focus-visible
 *           open the fan: the cards turn apart, part and lift (the front card
 *           a beat later and higher); leaving or blurring closes it
 *   turn    the letters egg (claimClick() on home, a long press by touch):
 *           the cards turn, the cut-outs showing once they are edge-on; they
 *           turn back after logo.turn.hold
 *   exit    logo -> Back: the cards close up and fade (Back appears after,
 *           header.module.css); Back -> logo: the cards are dealt again
 * Nothing moves at rest. Reduced motion: no movement, instant state changes;
 * the egg swaps the letters' opacity.
 */
const BACK = 'rotate(-6 18.235 37.923)'
const FRONT = 'rotate(5 30.235 37.923)'
const CARD = { y: 9.923, width: 20, height: 28, rx: 2.5 }
const M =
  'M14.735 30.923V22.181L19.235 25.823L23.735 22.181V30.923H27.235V16.923H25.064L19.235 21.642L13.406 16.923H11.235V30.923Z'
const F = 'M23.735 16.923H27.235V30.923H23.735ZM23.735 16.923H36.235V20.423H23.735ZM23.735 22.673H33.735V26.173H23.735Z'
const AREA = { x: -24, y: -24, width: 96, height: 96 }
const DEALT_KEY = 'table:logo-dealt'

export type LogoHandle = {
  /** A click on the home slot: true when the logo takes it (the letters egg on home). */
  claimClick(home: boolean): boolean
}

type Props = {
  className?: string
  /** The home slot's mode: the logo shows, or Back (the cards are away). */
  mode: 'mark' | 'back'
  /** The home slot link: hover, focus and the long press listen on it. */
  slot: RefObject<HTMLElement | null>
  ref?: Ref<LogoHandle>
}

type Parts = {
  backMove: SVGGElement
  backFan: SVGGElement
  frontMove: SVGGElement
  frontFan: SVGGElement
  gapMove: SVGGElement
  gapFan: SVGGElement
  cutM: SVGPathElement
  cutF: SVGPathElement
}

const bezier = (b: readonly number[]) => b as [number, number, number, number]
const pose = (p: { x: number; y: number; deg: number }) => `translate(${p.x}px, ${p.y}px) rotate(${p.deg}deg)`
const IDENTITY = 'translate(0px, 0px) rotate(0deg)'

type Controls = ReturnType<typeof animate>

export function Logo({ className, mode, slot, ref }: Props) {
  const id = useId().replace(/:/g, '')
  const mask = (name: string) => `${id}-${name}`
  const props = { maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse', ...AREA } as const
  const refs = {
    backMove: useRef<SVGGElement>(null),
    backFan: useRef<SVGGElement>(null),
    frontMove: useRef<SVGGElement>(null),
    frontFan: useRef<SVGGElement>(null),
    gapMove: useRef<SVGGElement>(null),
    gapFan: useRef<SVGGElement>(null),
    cutM: useRef<SVGPathElement>(null),
    cutF: useRef<SVGPathElement>(null),
  }
  const svg = useRef<SVGSVGElement>(null)
  const running = useRef<Controls[]>([])
  const turning = useRef(0)
  const lastLongPress = useRef(0)
  const modeRef = useRef(mode)

  const parts = (): Parts | null => {
    const p = Object.fromEntries(Object.entries(refs).map(([k, r]) => [k, r.current]))
    return Object.values(p).every(Boolean) ? (p as Parts) : null
  }
  /** Stops the move and letter animations (not the hover fan) and clears what they left. */
  const stopMoves = (p: Parts) => {
    for (const c of running.current.splice(0)) c.stop()
    window.clearTimeout(turning.current)
    turning.current = 0
    for (const el of [p.backMove, p.frontMove, p.gapMove, p.cutM, p.cutF]) {
      for (const a of el.getAnimations()) a.cancel()
      el.style.transform = ''
      el.style.opacity = ''
      el.style.transformOrigin = ''
    }
  }
  /** Once the moves now running have finished, the static logo again (nothing held by an animation). */
  const settle = (p: Parts) => {
    const now = running.current.slice()
    void Promise.all(now.map((c) => c.finished)).then(() => {
      if (now.every((c, i) => running.current[i] === c) && running.current.length === now.length) stopMoves(p)
    })
  }
  const track = (c: Controls) => {
    running.current.push(c)
    return c
  }

  /** The deal: back card, then the front card (with its knock-out) `front` s later. */
  const deal = (p: Parts, front: number) => {
    stopMoves(p)
    const D = L.deal
    const one = (els: Element[], from: string, delay: number) => {
      track(animate(els, { transform: [from, IDENTITY] }, { duration: D.dur, delay, ease: bezier(ease.enter) }))
      track(animate(els, { opacity: [0, 1] }, { duration: D.dur * D.opaque, delay, ease: 'linear' }))
    }
    one([p.backMove], pose(D.from.back), 0)
    one([p.frontMove, p.gapMove], pose(D.from.front), front)
    settle(p)
  }

  /** Logo -> Back: the cards close up toward each other, sink and fade; they stay hidden. */
  const exit = (p: Parts) => {
    stopMoves(p)
    const E = L.exit
    const opts = { duration: E.dur, ease: bezier(ease.exit) }
    track(
      animate(
        [p.backMove],
        { transform: [IDENTITY, `translate(0px, ${E.sink}px) rotate(6deg)`], opacity: [1, 0] },
        opts,
      ),
    )
    track(
      animate(
        [p.frontMove, p.gapMove],
        { transform: [IDENTITY, `translate(${-E.close}px, ${E.sink}px) rotate(-5deg)`], opacity: [1, 0] },
        opts,
      ),
    )
  }

  /** One turn of both cards; `reveal`: the cut-outs show only from the moment a card is edge-on. */
  const turnOnce = (p: Parts, reveal: boolean) => {
    const T = L.turn
    const half = [bezier(ease.exit), bezier(ease.enter)]
    const card = (els: SVGElement[], cut: SVGPathElement, delay: number) => {
      for (const el of els) el.style.transformOrigin = '50% 50%'
      track(
        animate(
          els,
          { transform: ['scale(1, 1)', 'scale(0, 1)', 'scale(1, 1)'] },
          { duration: T.dur, delay, ease: half },
        ),
      )
      if (reveal)
        track(
          animate(cut, { opacity: [0, 0, 1, 1] }, { duration: T.dur, delay, times: [0, 0.5, 0.5, 1], ease: 'linear' }),
        )
    }
    card([p.backMove], p.cutM, 0)
    card([p.frontMove, p.gapMove], p.cutF, T.front)
  }

  /** The letters egg: turn, hold, turn back. Reduced: the letters' opacity swaps, nothing moves. */
  const turn = () => {
    const p = parts()
    if (!p || modeRef.current !== 'mark' || turning.current) return
    stopMoves(p)
    if (readTier() === 'reduced') {
      p.cutM.style.opacity = '0'
      p.cutF.style.opacity = '0'
      turning.current = window.setTimeout(() => stopMoves(p), (L.turn.dur + L.turn.hold) * 1000)
      return
    }
    turnOnce(p, true)
    turning.current = window.setTimeout(
      () => {
        turnOnce(p, false)
        turning.current = window.setTimeout(() => stopMoves(p), (L.turn.dur + L.turn.front) * 1000)
      },
      (L.turn.dur + L.turn.front + L.turn.hold) * 1000,
    )
  }

  useImperativeHandle(ref, () => ({
    claimClick(home: boolean) {
      // The click a long press leaves behind never navigates.
      if (performance.now() - lastLongPress.current < 800) return true
      if (!home || modeRef.current !== 'mark') return false
      turn()
      return true
    },
  }))

  // Logo <-> Back (a route change; the first render shows the right state statically).
  const first = useRef(true)
  useLayoutEffect(() => {
    modeRef.current = mode
    if (first.current) {
      first.current = false
      return
    }
    const p = parts()
    if (!p) return
    if (readTier() === 'reduced') {
      stopMoves(p)
      return
    }
    if (mode === 'back') exit(p)
    else deal(p, L.deal.returnFront)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs and stable helpers
  }, [mode])

  // The gradient's flow (CSS animations on its stops) runs on the page clock, not from this mount:
  // a remounted logo (a language switch) carries on where the one it replaces was.
  useLayoutEffect(() => {
    for (const a of svg.current?.getAnimations({ subtree: true }) ?? []) if (a instanceof CSSAnimation) a.startTime = 0
  }, [])

  // The home intro deals the cards in, once a session (full tier); a skipped intro ends it at once.
  useEffect(() => {
    const root = document.documentElement
    const dealt = () => {
      try {
        return sessionStorage.getItem(DEALT_KEY) === '1'
      } catch {
        return false
      }
    }
    const onChrome = () => {
      const p = parts()
      if (!p || dealt() || readTier() !== 'full' || root.dataset.intro !== 'first') return
      try {
        sessionStorage.setItem(DEALT_KEY, '1')
      } catch {
        // Storage blocked: the deal may play again with the next intro.
      }
      deal(p, L.deal.front)
    }
    const onDone = () => {
      for (const c of running.current) c.complete()
    }
    addEventListener(CHROME_IN, onChrome)
    addEventListener(INTRO_DONE, onDone)
    return () => {
      removeEventListener(CHROME_IN, onChrome)
      removeEventListener(INTRO_DONE, onDone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs and stable helpers
  }, [])

  // Hover and focus-visible widen the fan; a touch long press plays the letters egg.
  useEffect(() => {
    const link = slot.current
    if (!link) return
    let hovered = false
    let focused = false
    let fan: Controls[] = []
    const setFan = (open: boolean) => {
      const p = parts()
      if (!p || readTier() === 'reduced') return
      for (const c of fan) c.stop()
      const H = L.hover
      const opts = { duration: H.dur, ease: bezier(ease.move) }
      // Same function list open and closed, so the browser interpolates each part on its own.
      const back = open ? pose({ x: -H.spread, y: -H.lift.back, deg: -H.deg }) : IDENTITY
      const front = open ? pose({ x: H.spread, y: -H.lift.front, deg: H.deg }) : IDENTITY
      const now = [
        animate([p.backFan], { transform: back }, opts),
        animate([p.frontFan, p.gapFan], { transform: front }, { ...opts, delay: open ? H.front : 0 }),
      ]
      fan = now
      // Closed again: nothing left on the fan groups.
      if (!open)
        void Promise.all(now.map((c) => c.finished)).then(() => {
          if (fan !== now) return
          for (const el of [p.backFan, p.frontFan, p.gapFan]) {
            for (const a of el.getAnimations()) a.cancel()
            el.style.transform = ''
          }
        })
    }
    const sync = () => setFan(modeRef.current === 'mark' && (hovered || focused))
    const offHover = hover(link, () => {
      hovered = true
      sync()
      return () => {
        hovered = false
        sync()
      }
    })
    const onFocus = () => {
      focused = link.matches(':focus-visible')
      sync()
    }
    const onBlur = () => {
      focused = false
      sync()
    }
    link.addEventListener('focus', onFocus)
    link.addEventListener('blur', onBlur)
    let touchDown = false
    const offPress = press(
      link,
      (_el, e) => {
        if (e.pointerType !== 'touch') return
        touchDown = true
        return {
          onActive: () => {
            lastLongPress.current = performance.now()
            turn()
          },
          onComplete: () => {
            touchDown = false
          },
        }
      },
      { hold: L.longPress },
    )
    // No context menu or link preview for the long press.
    const onMenu = (e: Event) => touchDown && e.preventDefault()
    link.addEventListener('contextmenu', onMenu)
    return () => {
      offHover()
      offPress()
      for (const c of fan) c.stop()
      link.removeEventListener('focus', onFocus)
      link.removeEventListener('blur', onBlur)
      link.removeEventListener('contextmenu', onMenu)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs and stable helpers
  }, [slot])

  useEffect(
    () => () => {
      const p = parts()
      if (p) stopMoves(p)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
    [],
  )

  return (
    <svg ref={svg} className={className} viewBox="5 8.5 38 31" aria-hidden="true" focusable="false">
      <defs>
        {/* The front card's paint: three colours that flow along it (header.module.css). */}
        <linearGradient id={mask('paint')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" data-logo-stop="0" />
          <stop offset="0.5" data-logo-stop="1" />
          <stop offset="1" data-logo-stop="2" />
        </linearGradient>
        <mask id={mask('gap')} {...props}>
          <rect {...AREA} fill="white" />
          <g transform={FRONT}>
            <g ref={refs.gapMove} data-logo-part="">
              <g ref={refs.gapFan} data-logo-part="">
                <rect x="20.235" {...CARD} fill="black" stroke="black" strokeWidth="3" />
              </g>
            </g>
          </g>
        </mask>
        <mask id={mask('m')} {...props}>
          <rect {...AREA} fill="white" />
          <path ref={refs.cutM} d={M} fill="black" />
        </mask>
        <mask id={mask('f')} {...props}>
          <rect {...AREA} fill="white" />
          <path ref={refs.cutF} d={F} fill="black" />
        </mask>
      </defs>
      <g mask={`url(#${mask('gap')})`}>
        <g transform={BACK}>
          <g ref={refs.backMove} data-logo-part="">
            <g ref={refs.backFan} data-logo-part="">
              <rect x="8.235" {...CARD} fill="currentColor" mask={`url(#${mask('m')})`} />
            </g>
          </g>
        </g>
      </g>
      <g transform={FRONT}>
        <g ref={refs.frontMove} data-logo-part="">
          <g ref={refs.frontFan} data-logo-part="">
            <rect x="20.235" {...CARD} fill={`url(#${mask('paint')})`} mask={`url(#${mask('f')})`} />
          </g>
        </g>
      </g>
    </svg>
  )
}
