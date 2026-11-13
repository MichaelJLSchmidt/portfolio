import { animate } from 'motion'
import type { CssTrack, Ease, Moment, MorphTrack, Seq, Track } from './model'
import { along } from './path-morph'

/*
 * The lab's animation engine. CSS tracks run as Web Animations on the parts
 * (they hold their start pose with a backwards fill); path morphs run as
 * Motion value animations that rewrite the attribute. When a run finishes it
 * cancels its animations and restores every attribute and inline style it
 * touched, and since every sequence's last frame is the part's static state,
 * the mark is then exactly the static mark again.
 *
 * Tiers: full plays the sequence as designed; calm plays the moment's own
 * calm sequence (fewer moving parts) at × 0.6; reduced plays nothing (the
 * static frame) except colour changes.
 */
export type LabTier = 'full' | 'calm' | 'reduced'
export const CALM_SCALE = 0.6

/** The lab's curves (the site has no enter / move / exit tokens of this shape). */
export const EASE: Record<Ease, string> = {
  enter: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  move: 'cubic-bezier(0.2, 0, 0, 1)',
  exit: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  linear: 'linear',
}
const EASE_ARRAY: Record<Ease, [number, number, number, number] | 'linear'> = {
  enter: [0.05, 0.7, 0.1, 1],
  move: [0.2, 0, 0, 1],
  exit: [0.3, 0, 0.8, 0.15],
  linear: 'linear',
}

/** The sequence a moment plays in a tier, or null when the tier shows the static mark. */
export function seqFor(moment: Moment | undefined, tier: LabTier): Seq | null {
  if (!moment || tier === 'reduced') return null
  if (tier === 'full') return moment.full
  if (!moment.calm) return null
  return moment.calm.map(
    (t) => ({ ...t, at: t.at * CALM_SCALE, ...('dur' in t ? { dur: t.dur * CALM_SCALE } : {}) }) as Track,
  )
}

export type RunOptions = {
  speed?: number
  /** Build everything at its start pose but wait for play(). */
  paused?: boolean
  /** Keep the end state (hover): the run is released by reverse() or cancel(). */
  hold?: boolean
}

export type Run = {
  /** Released: true when it played to the end, false when cancelled. */
  finished: Promise<boolean>
  /** Every animation reached its end (also for held runs). */
  ended: Promise<void>
  play(): void
  cancel(): void
  /** Play back to the start pose, then release (hover out). */
  reverse(): void
  setSpeed(speed: number): void
}

type Controls = { speed: number; play(): void; pause(): void; cancel(): void; then(resolve: () => void): unknown }

const partOf = (svg: SVGSVGElement, part: string): Element | null =>
  svg.querySelector(`[data-part="${CSS.escape(part)}"]`)

/** A part's box in its own user space. Shapes inside masks are not rendered, so rects use their attributes. */
function localBox(el: Element) {
  if (el instanceof SVGRectElement) {
    const n = (a: string) => Number(el.getAttribute(a) ?? 0)
    return { x: n('x'), y: n('y'), width: n('width'), height: n('height') }
  }
  return (el as SVGGraphicsElement).getBBox()
}

/** "50% 100%" of the part's box → "x y" in user units. */
function originIn(el: Element, origin: string) {
  const b = localBox(el)
  const [ox, oy] = origin.split(/\s+/).map((v, i) => {
    const size = i === 0 ? b.width : b.height
    const start = i === 0 ? b.x : b.y
    return v.endsWith('%') ? start + (parseFloat(v) / 100) * size : start + parseFloat(v)
  })
  return `${ox}px ${oy}px`
}

/** The static colours the @neutral / @accent placeholders resolve to. */
function paints(svg: SVGSVGElement) {
  const neutral = getComputedStyle(svg).color
  const accentEl = svg.querySelector<SVGElement>('[stroke*="--accent"], [fill*="--accent"]')
  let accent = neutral
  if (accentEl) {
    const cs = getComputedStyle(accentEl)
    accent = accentEl.getAttribute('fill')?.includes('--accent') ? cs.fill : cs.stroke
  }
  return { neutral, accent }
}

function resolveFrames(frames: Keyframe[], p: { neutral: string; accent: string }): Keyframe[] {
  return frames.map((f) => {
    const out: Keyframe = {}
    for (const [k, v] of Object.entries(f)) {
      out[k] = typeof v === 'string' ? v.replace('@neutral', p.neutral).replace('@accent', p.accent) : v
    }
    return out
  })
}

export function run(svg: SVGSVGElement, seq: Seq, opts: RunOptions = {}): Run {
  let speed = opts.speed ?? 1
  const p = paints(svg)
  const waapi: Animation[] = []
  const morphs: { track: MorphTrack; el: Element; original: string | null; controls?: Controls }[] = []
  const styled = new Map<Element, string | null>()
  const seen = new Set<Element>()
  let done = false
  let resolveFinished!: (completed: boolean) => void
  const finished = new Promise<boolean>((r) => (resolveFinished = r))
  let resolveEnded!: () => void
  const ended = new Promise<void>((r) => (resolveEnded = r))

  const remember = (el: Element) => {
    if (!styled.has(el)) styled.set(el, el.getAttribute('style'))
  }
  const restore = () => {
    for (const a of waapi) a.cancel()
    for (const m of morphs) {
      m.controls?.cancel()
      if (m.original === null) m.el.removeAttribute(m.track.attr)
      else m.el.setAttribute(m.track.attr, m.original)
    }
    for (const [el, style] of styled) {
      if (style === null) el.removeAttribute('style')
      else el.setAttribute('style', style)
    }
  }
  const finish = (completed: boolean) => {
    if (done) return
    done = true
    restore()
    resolveEnded()
    resolveFinished(completed)
  }

  const ordered = [...seq].sort((a, b) => a.at - b.at)
  for (const track of ordered) {
    const el = partOf(svg, track.part)
    if (!el) continue
    if (track.kind === 'morph') {
      const original = el.getAttribute(track.attr)
      // A morph belongs to one geometry (the master): on another variant it would jump, so it is skipped.
      if (original !== track.values[0] && original !== track.values[track.values.length - 1]) continue
      if (!morphs.some((m) => m.el === el && m.track.attr === track.attr)) el.setAttribute(track.attr, track.values[0])
      morphs.push({ track, el, original: morphs.find((m) => m.el === el)?.original ?? original })
      continue
    }
    const t = track as CssTrack
    if (t.origin || t.box) {
      remember(el)
      const s = (el as SVGElement).style
      // Always view-box with the origin in user units: Firefox resolves fill-box
      // wrongly for mask content (concept 3's knock-out), so box percentages are
      // turned into coordinates here, from the part's own box.
      s.transformBox = 'view-box'
      if (t.origin) s.transformOrigin = t.box === 'fill-box' ? originIn(el, t.origin) : t.origin
    }
    const first = !seen.has(el)
    seen.add(el)
    const anim = el.animate(resolveFrames(t.frames, p), {
      duration: t.dur,
      delay: t.at,
      easing: EASE[t.ease ?? 'move'],
      fill: first ? 'both' : 'forwards',
    })
    anim.playbackRate = speed
    waapi.push(anim)
  }

  const startMorphs = () => {
    for (const m of morphs) {
      const f = along(m.track.values)
      const controls = animate(0, 1, {
        duration: m.track.dur / 1000,
        delay: m.track.at / 1000,
        ease: EASE_ARRAY[m.track.ease ?? 'move'],
        onUpdate: (v: number) => m.el.setAttribute(m.track.attr, f(v)),
      }) as unknown as Controls
      controls.speed = speed
      m.controls = controls
    }
  }

  if (opts.paused) for (const a of waapi) a.pause()
  else startMorphs()

  const all = () =>
    Promise.all([
      ...waapi.map((a) => a.finished),
      ...morphs.map((m) => new Promise<void>((r) => (m.controls ? m.controls.then(r) : r()))),
    ])
  const settle = () => {
    all().then(
      () => {
        resolveEnded()
        if (!opts.hold) finish(true)
      },
      () => finish(false),
    )
  }
  if (!opts.paused) settle()

  let reversing = false
  return {
    finished,
    ended,
    play() {
      if (done) return
      for (const a of waapi) a.play()
      startMorphs()
      settle()
    },
    cancel() {
      finish(false)
    },
    reverse() {
      if (done || reversing) return
      reversing = true
      for (const a of waapi) a.reverse()
      Promise.all(waapi.map((a) => a.finished)).then(
        () => finish(true),
        () => finish(false),
      )
    },
    setSpeed(next) {
      speed = next
      for (const a of waapi) a.playbackRate = a.playbackRate < 0 ? -next : next
      for (const m of morphs) if (m.controls) m.controls.speed = next
    },
  }
}

/* ---------- Shared moments ---------- */

const NS = 'http://www.w3.org/2000/svg'
let fxCount = 0

function viewBox(svg: SVGSVGElement) {
  const v = svg.viewBox.baseVal
  return { x: v.x, y: v.y, w: v.width, h: v.height }
}

/**
 * Foil glint: a light band, masked by a copy of the mark, passes once
 * (1400 ms). The overlay is created for the moment and removed afterwards, so
 * the mark itself is never touched.
 */
export function glint(svg: SVGSVGElement, speed = 1): Run {
  const mark = svg.querySelector('[data-mark]')
  const vb = viewBox(svg)
  const id = `glint-${++fxCount}`
  const el = (tag: string, attrs: Record<string, string | number>) => {
    const n = document.createElementNS(NS, tag)
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
    return n
  }
  const defs = el('defs', { 'data-fx': '' })
  const mask = el('mask', { id: `${id}-m`, maskUnits: 'userSpaceOnUse', x: vb.x, y: vb.y, width: vb.w, height: vb.h })
  if (mark) {
    const copy = mark.cloneNode(true) as Element
    copy.removeAttribute('data-mark')
    for (const n of [copy, ...copy.querySelectorAll('*')]) {
      n.removeAttribute('data-part')
      for (const a of ['stroke', 'fill'] as const) {
        const v = n.getAttribute(a)
        if (v && v !== 'none' && !v.startsWith('url(')) n.setAttribute(a, 'white')
      }
    }
    mask.append(copy)
  }
  // Band sizes are in 48ths of the viewBox width, so wide marks (concept 8) get the same glint.
  const k = vb.w / 48
  const grad = el('linearGradient', {
    id: `${id}-g`,
    gradientUnits: 'userSpaceOnUse',
    x1: -10 * k,
    y1: 0,
    x2: 10 * k,
    y2: 0,
  })
  const stops: [number, string, number][] = [
    [0, 'var(--accent, currentColor)', 0],
    [0.32, 'var(--accent, currentColor)', 0.45],
    [0.5, '#ffffff', 0.95],
    [0.68, 'var(--accent, currentColor)', 0.45],
    [1, 'var(--accent, currentColor)', 0],
  ]
  for (const [offset, color, opacity] of stops) {
    grad.append(el('stop', { offset, style: `stop-color:${color};stop-opacity:${opacity}` }))
  }
  defs.append(mask, grad)
  const layer = el('g', { mask: `url(#${id}-m)`, 'data-fx': 'glint', 'aria-hidden': 'true' })
  const band = el('rect', { x: -10 * k, y: vb.y - vb.h, width: 20 * k, height: vb.h * 3, fill: `url(#${id}-g)` })
  layer.append(band)
  svg.append(defs, layer)
  const anim = band.animate(
    [
      { transform: `translate(${vb.x - 14 * k}px, 0px) skewX(-18deg)` },
      { transform: `translate(${vb.x + vb.w + 14 * k}px, 0px) skewX(-18deg)` },
    ],
    { duration: 1400, easing: EASE.move, fill: 'both' },
  )
  anim.playbackRate = speed
  let resolveFinished!: (b: boolean) => void
  const finished = new Promise<boolean>((r) => (resolveFinished = r))
  const end = (completed: boolean) => {
    anim.cancel()
    defs.remove()
    layer.remove()
    resolveFinished(completed)
  }
  anim.finished.then(
    () => end(true),
    () => end(false),
  )
  return {
    finished,
    ended: finished.then(() => {}),
    play() {},
    cancel: () => end(false),
    reverse() {},
    setSpeed(s) {
      anim.playbackRate = s
    },
  }
}

/** Elements whose colour follows the identity (accent parts, the container). */
const followers = (svg: SVGSVGElement) =>
  [...svg.querySelectorAll<SVGElement>('[stroke*="--"], [fill*="--"]')].filter((el) => !el.closest('[data-fx]'))

export type ColourSnapshot = Map<SVGElement, { stroke: string; fill: string }>

/** Read the identity-dependent colours before the identity changes. */
export function snapshotColours(svg: SVGSVGElement): ColourSnapshot {
  const out: ColourSnapshot = new Map()
  for (const el of followers(svg)) {
    const cs = getComputedStyle(el)
    out.set(el, { stroke: cs.stroke, fill: cs.fill })
  }
  return out
}

/** Crossfade from the snapshot to the current (new) colours: 450 ms, calm × 0.6. */
export function recolour(svg: SVGSVGElement, before: ColourSnapshot, tier: LabTier, speed = 1) {
  const dur = tier === 'calm' ? 450 * CALM_SCALE : 450
  for (const [el, old] of before) {
    if (!el.isConnected) continue
    const cs = getComputedStyle(el)
    const frames: Keyframe[] = [{}, {}]
    if (old.stroke !== cs.stroke && cs.stroke !== 'none') {
      frames[0].stroke = old.stroke
      frames[1].stroke = cs.stroke
    }
    if (old.fill !== cs.fill && cs.fill !== 'none') {
      frames[0].fill = old.fill
      frames[1].fill = cs.fill
    }
    if (!Object.keys(frames[0]).length) continue
    const a = el.animate(frames, { duration: dur, easing: EASE.move })
    a.playbackRate = speed
    a.finished.then(() => a.cancel()).catch(() => {})
  }
}

/** Exit, then a beat on the empty ground, then the static mark fades back (200 ms). */
export async function exitAndReturn(svg: SVGSVGElement, seq: Seq, speed = 1) {
  const r = run(svg, seq, { speed, hold: true })
  await r.ended
  const mark = svg.querySelector('[data-mark]')
  // r holds the hidden end state; cover the mark before releasing it, then fade it in.
  const cover = mark?.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'forwards' })
  await new Promise((res) => setTimeout(res, 500 / speed))
  r.cancel()
  const back = mark?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE.enter })
  if (back) back.playbackRate = speed
  cover?.cancel()
  await back?.finished.catch(() => {})
  back?.cancel()
}
