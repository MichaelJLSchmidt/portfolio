'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { logoGradientNames, logoGradients } from '@/design/palette'
import { cardIdForPath } from '@/lib/hand-data'
import { pagePath } from '@/lib/i18n'
import { onTierChange, readTier } from '@/motion/use-tier'

/*
 * EXPERIMENT: the title gradient foil. Self-contained: this file is the whole effect (its logic and
 * its CSS), mounted once in src/app/[locale]/layout.tsx (<TitleFoil enabled />, the on/off switch for
 * every title that uses it). To turn it off: enabled={false}. To remove it: delete this file, that
 * line and its import, and the "Title gradient foil" entry in the lab's inventory
 * (src/lab/inventory/sections/motion.tsx). Nothing else refers to it.
 *
 * What it does: on home and on a card's page, hovering the page's title (#page-heading, with a
 * small margin around it) lays a foil over its letterforms: the page's active gradient (the header's:
 * the page load's on home, the card's on its page) along a diagonal with a soft light midpoint, and
 * one soft specular glint. The pointer tilts it like a card held in the hand: across, the foil's
 * angle and position and the glint move over the whole title; down, the angle changes a little;
 * the title itself turns by up to TILT degrees. All of it on one spring, so it lags a little behind
 * the pointer; leaving, it glides back and fades. Only once the title's reveal has finished, only
 * with hover and a fine pointer, never under reduced motion; touch and reduced motion keep the
 * titles as they are (nothing is attached at all).
 *
 * How: the title gets [data-title-foil] (position: relative, an identity transform, and a ::before
 * ring as the hit area) and, after its reveal, an overlay of COLS x ROWS still foils: each a copy of
 * its words (the same classes, so the same glyphs in the same places) with the foil, set for one
 * point of the tilt, clipped to the text. The pointer never repaints them: one rAF loop, running
 * while the foil is active or settling, blends the (at most four) foils around the spring's point
 * by their opacity, fades the overlay by its opacity and turns the title by its transform, all of
 * it compositor work on layers the foils get for the hover. The overlay reads the header's gradient
 * on its own (the same html[data-header-gradient] and logo gradients the header reads, palette.ts),
 * with the header's timing, so it changes in step with the logo; the header's variables stay on
 * the header. The title's box is read on hover start and on resize.
 */

/** The spring the foil and the tilt follow (gentle: it trails the pointer a little). */
const SPRING = { stiffness: 120, damping: 19, mass: 1 }
/** The foil's fade in and out (critically damped). */
const FADE = { stiffness: 170, damping: 26, mass: 1 }
/** The title's turn at the edges (deg), across and down, and its perspective (px). */
const TILT = { y: 3.5, x: 2.2, perspective: 1100 }
/** The foil's diagonal (deg) and how far the pointer turns it across and down. */
const ANGLE = { base: 115, across: 16, down: 6 }
/** The hit area around the title (px). */
const MARGIN = 14
/** The still foils the tilt blends: across (x -1..1) and down (y -1, 1). */
const COLS = 5
const ROWS = 2
/** The glint: where it sits across (50% +- this per unit x) and its half width (%). */
const GLINT = { across: 38, width: 20 }
/** One still foil, for the tilt point (x, y). */
const foilAt = (x: number, y: number) =>
  `--tf-angle:${ANGLE.base + x * ANGLE.across + y * ANGLE.down}deg;--tf-glint:${50 + x * GLINT.across}%;` +
  `--tf-px:${50 - x * 30}%;--tf-py:${50 - y * 14}%`

const css = () => {
  const target = (cs: readonly string[]) => cs.map((c, i) => `--tf-${'abc'[i]}-to:${c}`).join(';')
  const colours = ['a', 'b', 'c']
    .map(
      (k) =>
        `--tf-${k} calc(var(--dur-header-colour) * var(--tf-k)) var(--ease-in-out) calc((var(--sweep-f) + var(--sweep-stops)) * var(--tf-k))`,
    )
    .join(',')
  const g = `var(--tf-glint)`
  return [
    // Registered and not inherited: a change restyles the foils alone, never the words inside them.
    ...['a', 'b', 'c'].map((k) => `@property --tf-${k}{syntax:'<color>';inherits:false;initial-value:transparent}`),
    // position: the overlay's box. transform: an identity, so the tilt only ever changes a transform's
    // value (a transform appearing or going would lay the title out again).
    `[data-title-foil]{position:relative;transform:translate(0,0)}`,
    // The hit area: a ring MARGIN wide around the title (its own box left out, so the text behaves as before).
    `[data-title-foil]::before{content:'';position:absolute;inset:-${MARGIN}px;clip-path:polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${MARGIN}px ${MARGIN}px,${MARGIN}px calc(100% - ${MARGIN}px),calc(100% - ${MARGIN}px) calc(100% - ${MARGIN}px),calc(100% - ${MARGIN}px) ${MARGIN}px,${MARGIN}px ${MARGIN}px)}`,
    // The overlay, and in it the still foils: each a transparent copy of the words, its foil clipped to them.
    `.title-foil{position:absolute;inset:0;pointer-events:none;user-select:none;opacity:0;--tf-k:1}`,
    // Each still foil: a plain box that only fades (so its per-frame opacity restyles nothing else),
    // and in it the transparent copy of the words with the foil clipped to them.
    `.title-foil>span{position:absolute;inset:0;opacity:0}`,
    `.title-foil>span>span{position:absolute;inset:0;color:transparent;-webkit-text-fill-color:transparent;` +
      `--tf-a:var(--tf-a-to);--tf-b:var(--tf-b-to);--tf-c:var(--tf-c-to);transition:${colours};` +
      `background:linear-gradient(calc(var(--tf-angle) + 8deg),transparent calc(${g} - ${GLINT.width}%),rgb(255 255 255 / 0.4) ${g},transparent calc(${g} + ${GLINT.width}%)),` +
      `linear-gradient(var(--tf-angle),var(--tf-a) 6%,color-mix(in oklab,var(--tf-b),#fff 36%) 50%,var(--tf-c) 94%);` +
      `background-size:100% 100%,170% 170%;background-position:0 0,var(--tf-px) var(--tf-py);` +
      `-webkit-background-clip:text;background-clip:text}`,
    `:root[data-header-sweep="out"] .title-foil{--tf-k:var(--sweep-back)}`,
    // The page's active gradient, as the header reads it (palette.ts headerGradientCss), on the overlay only.
    `.title-foil{${target(['var(--logo-a)', 'var(--logo-b)', 'var(--logo-c)'])}}`,
    ...logoGradientNames.map((n) => `:root[data-header-gradient="${n}"] .title-foil{${target(logoGradients[n])}}`),
  ].join('')
}

type Spring = { k: number; c: number; m: number }
const spring = (s: { stiffness: number; damping: number; mass: number }): Spring => ({
  k: s.stiffness,
  c: s.damping,
  m: s.mass,
})
const SP = spring(SPRING)
const FD = spring(FADE)

/** Its reveal is over: revealed, and no finite animation left in it (the words' turn and weight). */
async function revealed(el: HTMLElement, signal: AbortSignal): Promise<boolean> {
  const root = document.documentElement
  if (el.hasAttribute('data-reveal') && !el.hasAttribute('data-revealed') && root.dataset.reveal !== undefined) {
    await new Promise<void>((resolve) => {
      const done = () => {
        observer.disconnect()
        resolve()
      }
      const observer = new MutationObserver(() => {
        if (el.hasAttribute('data-revealed') || root.dataset.reveal === undefined) done()
      })
      observer.observe(el, { attributes: true, attributeFilter: ['data-revealed'] })
      observer.observe(root, { attributes: true, attributeFilter: ['data-reveal'] })
      signal.addEventListener('abort', done)
    })
  }
  for (let i = 0; i < 4 && !signal.aborted; i++) {
    const running = el
      .getAnimations({ subtree: true })
      .filter((a) => Number.isFinite(Number(a.effect?.getComputedTiming().endTime)) && a.playState !== 'finished')
    if (!running.length) break
    await Promise.all(running.map((a) => a.finished.catch(() => undefined)))
  }
  return !signal.aborted
}

/**
 * Puts the foil on `title` (a WeightText title: .wt words) and returns its removal, which restores
 * the title exactly. Exported for the lab's inventory demo.
 */
export function attachTitleFoil(title: HTMLElement): () => void {
  const abort = new AbortController()
  const { signal } = abort
  const inlineTransform = title.style.transform
  const inlineWillChange = title.style.willChange
  title.setAttribute('data-title-foil', '')
  let overlay: HTMLElement | null = null
  let foils: HTMLElement[] = []
  let ready = false
  let hovering = false
  let rect = title.getBoundingClientRect()
  let raf = 0
  let last = 0
  // Targets and springs: x, y across and down (-1..1), o the overlay's opacity.
  const to = { x: 0, y: 0, o: 0 }
  const at = { x: 0, y: 0, o: 0 }
  const v = { x: 0, y: 0, o: 0 }
  // Each foil's opacity as written (the stylesheet's 0 to begin with), and whether it is a layer.
  const shown: string[] = []
  const layered: boolean[] = []
  const weights = new Array<number>(COLS * ROWS).fill(0)

  /** Writes a foil's opacity if it changed; a foil that shows gets a layer, kept until rest. */
  const show = (i: number, a: number) => {
    const el = foils[i]!
    // Never quite 1, like the overlay (below).
    const value = a > 0 ? Math.min(a, 0.999).toFixed(3) : '0'
    if (shown[i] !== value) el.style.opacity = shown[i] = value
    if (a > 0 && !layered[i]) {
      el.style.willChange = 'opacity'
      layered[i] = true
    }
  }
  /**
   * One frame, all of it compositor work: the foils around the spring's point blended by opacity
   * (bilinear; stacked in document order, so each one's opacity is its weight over what the foils
   * above it leave), the overlay's fade, the title's tilt.
   */
  const write = () => {
    if (!overlay) return
    const { x, y, o } = at
    const u = ((x + 1) / 2) * (COLS - 1)
    const col = Math.max(0, Math.min(COLS - 2, Math.floor(u)))
    const s = Math.max(0, Math.min(1, u - col))
    const t = Math.max(0, Math.min(1, ((y + 1) / 2) * (ROWS - 1)))
    weights.fill(0)
    weights[col] = (1 - s) * (1 - t)
    weights[col + 1] = s * (1 - t)
    weights[COLS + col] = (1 - s) * t
    weights[COLS + col + 1] = s * t
    let above = 0
    for (let i = weights.length - 1; i >= 0; i--) {
      const w = weights[i]!
      show(i, w > 1e-4 ? Math.min(1, w / Math.max(1e-6, 1 - above)) : 0)
      above += w
    }
    // Never quite 1: at 1 the overlay would stop being a stacking context, and lose and regain its
    // layer (a layout) as the fade settles and leaves.
    overlay.style.opacity = Math.min(o, 0.999).toFixed(3)
    title.style.transform = `perspective(${TILT.perspective}px) rotateX(${(-y * TILT.x).toFixed(3)}deg) rotateY(${(x * TILT.y).toFixed(3)}deg)`
  }
  /** At rest: as before the hover (the identity transform, no layers, the overlay transparent). */
  const rest = () => {
    title.style.transform = inlineTransform
    title.style.willChange = inlineWillChange
    if (!overlay) return
    overlay.style.opacity = ''
    overlay.style.willChange = ''
    foils.forEach((el, i) => {
      el.style.willChange = ''
      layered[i] = false
    })
  }
  const step = (s: Spring, key: 'x' | 'y' | 'o', dt: number) => {
    const force = -s.k * (at[key] - to[key]) - s.c * v[key]
    v[key] += (force / s.m) * dt
    at[key] += v[key] * dt
  }
  const tick = (now: number) => {
    const dt = Math.min(0.034, last ? (now - last) / 1000 : 1 / 60)
    last = now
    // Two half steps keep the spring stable at low frame rates.
    for (let i = 0; i < 2; i++) {
      step(SP, 'x', dt / 2)
      step(SP, 'y', dt / 2)
      step(FD, 'o', dt / 2)
    }
    const settled = (['x', 'y', 'o'] as const).every((k) => Math.abs(at[k] - to[k]) < 0.002 && Math.abs(v[k]) < 0.01)
    if (settled) {
      at.x = to.x
      at.y = to.y
      at.o = to.o
    }
    write()
    if (settled && to.o === 0) {
      raf = 0
      last = 0
      rest()
      return
    }
    raf = settled ? 0 : requestAnimationFrame(tick)
    if (!raf) last = 0
  }
  const run = () => {
    if (!raf) raf = requestAnimationFrame(tick)
  }
  const activate = () => {
    if (!ready || !hovering) return
    title.style.willChange = 'transform'
    if (overlay) overlay.style.willChange = 'opacity'
    to.o = 1
    run()
  }

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    hovering = true
    rect = title.getBoundingClientRect()
    onMove(e)
    activate()
  }
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    // Already over the title when the foil was attached (no pointerenter came): this move enters.
    if (!hovering) return onEnter(e)
    const m = MARGIN
    to.x = Math.max(-1, Math.min(1, ((e.clientX - rect.left + m) / (rect.width + 2 * m)) * 2 - 1))
    to.y = Math.max(-1, Math.min(1, ((e.clientY - rect.top + m) / (rect.height + 2 * m)) * 2 - 1))
    if (ready && to.o) run()
  }
  const onLeave = () => {
    hovering = false
    to.x = 0
    to.y = 0
    to.o = 0
    if (ready) run()
  }
  const onResize = () => {
    if (hovering) rect = title.getBoundingClientRect()
  }
  title.addEventListener('pointerenter', onEnter, { signal })
  title.addEventListener('pointermove', onMove, { passive: true, signal })
  title.addEventListener('pointerleave', onLeave, { signal })
  addEventListener('resize', onResize, { passive: true, signal })

  // The overlay waits for the reveal: the still foils, each a copy of the words in their final state.
  void revealed(title, signal).then((ok) => {
    const words = title.querySelector('.wt')
    if (!ok || !words) return
    overlay = document.createElement('span')
    overlay.className = 'title-foil'
    overlay.setAttribute('aria-hidden', 'true')
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const foil = document.createElement('span')
        const paint = document.createElement('span')
        paint.style.cssText = foilAt((col / (COLS - 1)) * 2 - 1, ROWS > 1 ? (row / (ROWS - 1)) * 2 - 1 : 0)
        const copy = words.cloneNode(true) as HTMLElement
        for (const el of [copy, ...copy.querySelectorAll<HTMLElement>('[style]')]) el.style.removeProperty('contain')
        for (const el of copy.querySelectorAll('[id]')) el.removeAttribute('id')
        paint.append(copy)
        foil.append(paint)
        overlay.append(foil)
        foils.push(foil)
        shown.push('0')
        layered.push(false)
      }
    }
    title.append(overlay)
    ready = true
    activate()
  })

  return () => {
    abort.abort()
    cancelAnimationFrame(raf)
    raf = 0
    rest()
    overlay?.remove()
    foils = []
    title.removeAttribute('data-title-foil')
  }
}

/** Hover with a fine pointer, and full motion: the only conditions the foil runs under. */
const pointerQuery = '(hover: hover) and (pointer: fine)'
const eligible = () => readTier() === 'full' && matchMedia(pointerQuery).matches

/** The page's title gets the foil on home and on a card's page. */
const foilPage = (pathname: string) => {
  const path = pagePath(pathname)
  return path === '/' || cardIdForPath(path) !== null
}

/** The effect: its CSS, and the foil on the page's title while the page and the device allow it. */
export function TitleFoil({ enabled }: { enabled: boolean }) {
  const pathname = usePathname()
  useEffect(() => {
    if (!enabled || !foilPage(pathname)) return
    let detach: (() => void) | null = null
    const sync = () => {
      const title = document.getElementById('page-heading')
      const want = eligible() && title !== null
      if (want && !detach) detach = attachTitleFoil(title!)
      else if (!want && detach) {
        detach()
        detach = null
      }
    }
    sync()
    const query = matchMedia(pointerQuery)
    query.addEventListener('change', sync)
    const offTier = onTierChange(sync)
    return () => {
      query.removeEventListener('change', sync)
      offTier()
      detach?.()
    }
  }, [enabled, pathname])
  if (!enabled) return null
  return <style data-title-foil-css="" dangerouslySetInnerHTML={{ __html: css() }} />
}

/** The lab's inventory demo: `children` (one element holding a WeightText title) with the foil, where the device allows it. */
export function TitleFoilDemo({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // The title itself (the wrapper's first element), which carries the type the copy inherits.
    const el = document.querySelector<HTMLElement>('[data-title-foil-demo] > *')
    if (!el || !eligible()) return
    return attachTitleFoil(el)
  }, [])
  return (
    <>
      <style data-title-foil-css="" dangerouslySetInnerHTML={{ __html: css() }} />
      <span data-title-foil-demo="" style={{ display: 'inline-block' }}>
        {children}
      </span>
    </>
  )
}
