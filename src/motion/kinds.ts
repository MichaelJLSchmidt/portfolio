import { bezier, drawFor, gapFor, msFor, spanFor } from './choreography'
import type { JobContext } from './jobs'
import { lineIndexes, loadSplit, splitLines, splitLoaded } from './split'
import {
  type DurationStep,
  angle,
  cardPlay,
  deal as DEAL,
  distance,
  duration,
  ease,
  hand,
  opsz,
  reveal,
  spring,
  springCss,
  stagger,
  weight,
} from './tokens'

/*
 * The reveal kinds (docs/contracts.md#reveal). Each one runs inside a job
 * (jobs.ts): the element is already [data-revealed] (its CSS start state, a
 * plain opacity 0, is gone), so every animation fills backwards to hold its
 * start pose through any per-child delay. End states are the elements' own
 * styles; the job cancels the animations when they finish.
 *
 * Reduced motion: every kind is one opacity crossfade (160 ms), no transform.
 */
export type Kind = 'lines' | 'block' | 'list' | 'image' | 'digits' | 'rule' | 'draw' | 'note' | 'pair' | 'deal'

/**
 * Timing a sequence may set for one block (ms, already scaled for the tier by the caller; the
 * home intro and the detail hero use them). Unset values fall back to each kind's own.
 */
export type KindOptions = {
  /** block, rule, pair, title: the whole reveal's duration. */
  dur?: number
  /** lines: the whole block's span; each line takes span - (lines - 1) x stagger (at least dur.s). */
  span?: number
  /** list: between items (and each item's duration is `dur`); lines: between lines. */
  stagger?: number
  /** rule: draw like a link underline (outSoft) instead of the default inOut. */
  underline?: boolean
  /** block: the rise in px (default distance.block). */
  rise?: number
}

const E = { outExpo: bezier(ease.outExpo), outQuint: bezier(ease.outQuint), inOut: bezier(ease.inOut) }
const travel = `${reveal.mask * 100}%`

/**
 * Waits for the real fonts (line breaks are measured with them) and for the
 * splitText chunk, keeping `el` hidden meanwhile: it is already [data-revealed],
 * so without this its final text would paint once and then rise again.
 */
async function splitReady(el: HTMLElement) {
  const fonts = document.fonts
  const ready = splitLoaded()
  if (ready && (!fonts || fonts.status === 'loaded')) return ready
  const previous = el.style.opacity
  el.style.opacity = '0'
  const [plus] = await Promise.all([loadSplit(), fonts?.ready])
  el.style.opacity = previous
  return plus
}

/** Opacity only: the reduced tier's crossfade, the note, the chrome and the short (revisit) reveals. */
export function fade(ctx: JobContext, el: Element, step: DurationStep = 's', delay = 0) {
  ctx.animate(
    el,
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: msFor(ctx.tier, step), delay, easing: E.outQuint, fill: 'backwards' },
    'opacity',
  )
}

/** block: rises 12 px with opacity, 420 ms outQuint. */
export function block(ctx: JobContext, el: Element, delay = 0, opts: KindOptions = {}) {
  if (ctx.tier === 'reduced') return fade(ctx, el)
  ctx.animate(
    el,
    [
      { opacity: 0, translate: `0 ${opts.rise ?? distance.block}px` },
      { opacity: 1, translate: '0 0' },
    ],
    { duration: opts.dur ?? msFor(ctx.tier, 'm'), delay, easing: E.outQuint, fill: 'backwards' },
    'transform, opacity',
  )
}

/** lines: split into lines inside clip masks, each rising from 110%, 640 ms outExpo, 60 ms apart. */
export async function lines(ctx: JobContext, el: HTMLElement, opts: KindOptions = {}) {
  if (ctx.tier === 'reduced') return fade(ctx, el)
  const gap = opts.stagger ?? gapFor(ctx.tier, stagger.lines)
  // A span (the home intro) fits every line into it; otherwise each line takes dur.l.
  const each = (n: number) =>
    opts.span ? Math.max(msFor(ctx.tier, 's'), opts.span - (n - 1) * gap) : msFor(ctx.tier, 'l')
  // Build-time split words (WeightText, e.g. section titles): each word has its own mask.
  const words = [...el.querySelectorAll<HTMLElement>('.wt-word > span')]
  if (words.length) {
    const line = lineIndexes(words.map((w) => w.parentElement!))
    const duration = each(Math.max(...line) + 1)
    words.forEach((w, i) =>
      ctx.animate(
        w,
        [{ translate: `0 ${travel}` }, { translate: '0 0' }],
        { duration, delay: line[i] * gap, easing: E.outExpo, fill: 'backwards' },
        'transform',
      ),
    )
    return
  }
  const plus = await splitReady(el)
  if (ctx.done) return
  const split = splitLines(el, plus)
  if (!split) return block(ctx, el, 0, { dur: opts.span })
  ctx.undo(split.revert)
  const duration = each(split.lines.length)
  split.lines.forEach((line, i) =>
    ctx.animate(
      line,
      [{ translate: `0 ${travel}` }, { translate: '0 0' }],
      { duration, delay: i * gap, easing: E.outExpo, fill: 'backwards' },
      'transform',
    ),
  )
}

/** list: direct children dealt from x −12 px with opacity, 50 ms apart. */
export function list(ctx: JobContext, el: Element, opts: KindOptions = {}) {
  if (ctx.tier === 'reduced') return fade(ctx, el)
  const items = [...el.children].filter((c) => c.getClientRects().length > 0)
  const gap = opts.stagger ?? gapFor(ctx.tier, stagger.items)
  items.forEach((item, i) =>
    ctx.animate(
      item,
      [
        { opacity: 0, translate: `${-distance.list}px 0` },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: opts.dur ?? msFor(ctx.tier, 'm'), delay: i * gap, easing: E.outQuint, fill: 'backwards' },
      'transform, opacity',
    ),
  )
}

const rootVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** The eager, high-priority image (the view-transition hero): never revealed by motion. */
export const isHeroImage = (img: HTMLImageElement | null) =>
  Boolean(img && (img.getAttribute('fetchpriority') === 'high' || img.getAttribute('loading') === 'eager'))

/** image: the media box opens from inset(10% round 12px) to inset(0 round 4px) while the image settles 1.12 → 1. */
export function image(ctx: JobContext, el: HTMLElement) {
  const img = el.querySelector('img')
  if (!img) return block(ctx, el)
  // The box: the Reveal itself when it holds only the picture, else the picture (or the img).
  let box: HTMLElement = img
  const only = el.childElementCount === 1 && el.firstElementChild!.contains(img)
  if (only || el === img.parentElement) box = el
  else {
    const picture = img.closest('picture')
    if (picture && el.contains(picture) && getComputedStyle(picture).display !== 'inline') box = picture
  }
  const rest = `inset(0% 0% 0% 0% round ${rootVar('--radius-sm') || '0px'})`
  ctx.undo(() => (box.style.clipPath = rest))
  if (ctx.tier === 'reduced') return fade(ctx, el)
  const inset = `${reveal.image.inset * 100}%`
  const options = { duration: msFor(ctx.tier, 'xl'), easing: E.outExpo, fill: 'backwards' as const }
  ctx.animate(
    box,
    [
      { clipPath: `inset(${inset} ${inset} ${inset} ${inset} round ${rootVar('--radius-lg') || '0px'})` },
      { clipPath: rest },
    ],
    options,
    'clip-path',
  )
  ctx.animate(img, [{ scale: String(reveal.image.scale) }, { scale: '1' }], options, 'transform')
}

/**
 * digits: each [data-digit] rolls up a short strip (blank, then the digits
 * before it) into place. One value takes 700 ms from its first strip's start
 * to its last strip's end, strips 40 ms apart; values 50 ms apart. The value
 * for screen readers stays in the DOM (the Scoreboard's sr-only copy); the
 * strips live inside the aria-hidden digits.
 */
export function digits(ctx: JobContext, el: HTMLElement) {
  if (ctx.tier === 'reduced') return
  const values = [...el.querySelectorAll<HTMLElement>('[data-digits]')]
  const groups = values.length ? values : [el]
  const offset = gapFor(ctx.tier, stagger.digits)
  const between = gapFor(ctx.tier, stagger.items)
  groups.forEach((value, j) => {
    const cells = [...value.querySelectorAll<HTMLElement>('[data-digit]')]
    const total = spanFor(ctx.tier, duration.digits)
    const per = Math.max(total - (cells.length - 1) * offset, msFor(ctx.tier, 'm'))
    cells.forEach((cell, k) => {
      const ch = cell.textContent ?? ''
      const h = cell.getBoundingClientRect().height
      if (!ch.trim() || !h) return
      const n = Number(ch)
      const seq =
        Number.isInteger(n) && ch.length === 1
          ? Array.from({ length: reveal.digitRoll - 1 }, (_, i) => String((n - (reveal.digitRoll - 2) + i + 10) % 10))
          : [ch]
      const saved = [...cell.childNodes]
      const style = { position: cell.style.position, overflow: cell.style.overflow, display: cell.style.display }
      const ghost = document.createElement('span')
      ghost.textContent = ch
      ghost.style.visibility = 'hidden'
      const strip = document.createElement('span')
      strip.setAttribute('aria-hidden', 'true')
      strip.style.cssText = 'position:absolute;inset:0 0 auto 0;display:flex;flex-direction:column'
      for (const c of [' ', ...seq]) {
        const s = document.createElement('span')
        s.textContent = c
        s.style.cssText = `display:block;height:${h}px;text-align:center`
        strip.append(s)
      }
      cell.style.position = 'relative'
      cell.style.overflow = 'clip'
      if (getComputedStyle(cell).display === 'inline') cell.style.display = 'inline-block'
      cell.replaceChildren(ghost, strip)
      ctx.undo(() => {
        cell.replaceChildren(...saved)
        Object.assign(cell.style, style)
      })
      ctx.animate(
        strip,
        [{ translate: '0 0' }, { translate: `0 ${-seq.length * h}px` }],
        { duration: per, delay: j * between + k * offset, easing: E.outExpo, fill: 'backwards' },
        'transform',
      )
    })
  })
}

/**
 * rule: a hairline draws from the left, scaleX 0 → 1, 640 ms inOut; with `underline` it draws
 * like a link underline (outSoft, the given duration). A block marked `data-reveal-marker` holds
 * a text link instead (the email on About): its text stays, and its marker block draws in from
 * the left the same way (the inherited --ue, 0 → 1; globals.css .link, reveal.css).
 */
export function rule(ctx: JobContext, el: HTMLElement, delay = 0, opts: KindOptions = {}) {
  if (el.hasAttribute('data-reveal-marker')) {
    if (ctx.tier === 'reduced') return
    ctx.animate(
      el,
      [{ '--ue': 0 }, { '--ue': 1 }],
      {
        duration: opts.dur ?? msFor(ctx.tier, 'l'),
        delay,
        easing: opts.underline ? E.outQuint : E.inOut,
        fill: 'backwards',
      },
      '',
    )
    return
  }
  if (ctx.tier === 'reduced') return fade(ctx, el, 's', delay)
  const origin = el.style.transformOrigin
  el.style.transformOrigin = '0 50%'
  ctx.undo(() => (el.style.transformOrigin = origin))
  ctx.animate(
    el,
    [{ scale: '0 1' }, { scale: '1 1' }],
    {
      duration: opts.dur ?? msFor(ctx.tier, 'l'),
      delay,
      easing: opts.underline ? E.outQuint : E.inOut,
      fill: 'backwards',
    },
    'transform',
  )
}

/**
 * pair: one meta pair (rule, label, value; MetaPairs, About's projects). The rule draws from the
 * left over `meta.rule`, then the label rises at `meta.label.at` and the value at `meta.value.at`
 * (cardPlay.play.hero.meta: 240 ms, then +60 and +120 ms, 200 ms each). Reduced: one crossfade.
 */
export function pair(ctx: JobContext, el: HTMLElement) {
  if (ctx.tier === 'reduced') return fade(ctx, el)
  const M = cardPlay.play.hero.meta
  const ruleEl = el.querySelector<HTMLElement>('[data-pair-rule]')
  const parts = [...el.querySelectorAll<HTMLElement>('[data-pair-part]')]
  if (ruleEl) rule(ctx, ruleEl, 0, { dur: M.rule * 1000, underline: true })
  parts.forEach((p, i) => {
    const step = i === 0 ? M.label : M.value
    ctx.animate(
      p,
      [
        { opacity: 0, translate: `0 ${distance.reveal}px` },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: step.dur * 1000, delay: step.at * 1000, easing: E.outQuint, fill: 'backwards' },
      'transform, opacity',
    )
  })
}

/** Tint fills (8% of the accent) and labels: they fade with their group instead of drawing. */
const TINTS = '[data-draw-fill]'
const LABELS = '[data-draw-label]'

/** The draw groups of an SVG (data-draw-group, ascending), with their strokes, tint fills and labels. */
export function drawGroups(root: Element) {
  const groupOf = (n: Element) => n.closest('[data-draw-group]')
  const keyOf = (n: Element) => Number(groupOf(n)?.getAttribute('data-draw-group')) || 0
  const strokes = [...root.querySelectorAll<SVGElement>('[data-draw]')]
  const tints = [...root.querySelectorAll<SVGElement>(TINTS)]
  const labels = [...root.querySelectorAll<SVGElement>(LABELS)]
  const keys = [...new Set([...strokes, ...tints, ...labels].map(keyOf))].sort((a, b) => a - b)
  return keys.map((key) => ({
    key,
    strokes: strokes.filter((s) => keyOf(s) === key),
    tints: tints.filter((s) => keyOf(s) === key),
    labels: labels.filter((s) => keyOf(s) === key),
  }))
}

/**
 * draw: every [data-draw] stroke (pathLength="1") draws from dashoffset 1 to
 * 0 over 1200 ms, group by group 120 ms apart. A group's labels
 * ([data-draw-label]) fade in as the group starts, its tint fills
 * ([data-draw-fill]) once its strokes are drawn. Strokes without pathLength
 * fade instead.
 */
export function draw(ctx: JobContext, el: HTMLElement) {
  const groups = drawGroups(el)
  if (!groups.length) return block(ctx, el)
  if (ctx.tier === 'reduced') return fade(ctx, el)
  fade(ctx, el)
  const d = drawFor(ctx.tier)
  // Chapter numerals draw contour by contour, closer together than an illustration's groups.
  const gap = gapFor(ctx.tier, el.hasAttribute('data-numeral') ? stagger.contours : stagger.svgGroups)
  groups.forEach(({ strokes, tints, labels }, gi) => {
    for (const l of labels)
      ctx.animate(
        l,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: msFor(ctx.tier, 'm'), delay: gi * gap, easing: E.outQuint, fill: 'backwards' },
        'opacity',
      )
    for (const s of strokes) {
      if (!s.hasAttribute('pathLength')) {
        ctx.animate(s, [{ opacity: 0 }, { opacity: 1 }], { duration: d, delay: gi * gap, fill: 'backwards' }, 'opacity')
        continue
      }
      const dash = s.style.strokeDasharray
      s.style.strokeDasharray = '1'
      ctx.undo(() => (s.style.strokeDasharray = dash))
      ctx.animate(
        s,
        [{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }],
        { duration: d, delay: gi * gap, easing: E.inOut, fill: 'backwards' },
        'stroke-dashoffset',
      )
    }
    for (const t of tints)
      ctx.animate(
        t,
        // Up to the tint's own opacity (an 8% tint may be set with opacity rather than fill-opacity).
        [{ opacity: 0 }, { opacity: getComputedStyle(t).opacity }],
        { duration: msFor(ctx.tier, 'm'), delay: gi * gap + d, easing: E.outQuint, fill: 'backwards' },
        'opacity',
      )
  })
}

/** note: opacity only, 240 ms (the caller starts it after its related paragraph has finished). */
export function note(ctx: JobContext, el: Element) {
  fade(ctx, el, 's')
}

/**
 * The home title (h1 in <FirstLoadSequence>, first visit): words turn up out
 * of their masks (rise from 110% and rotateX from the word angle, 640 ms
 * outExpo, 70 ms apart) while opsz and wght settle from a lighter, smaller
 * optical size to the final values (900 ms outQuint). Only opsz and wght
 * move, never width; word boxes keep their final size throughout, so
 * nothing reflows. Other page titles reveal as "lines".
 */
export async function title(ctx: JobContext, el: HTMLElement, opts: KindOptions = {}) {
  if (ctx.tier === 'reduced') return fade(ctx, el, 's')
  let words = [...el.querySelectorAll<HTMLElement>('.wt-word > span')]
  if (words.length) {
    // The live word must not widen its reserved cell while its axes move.
    for (const w of words) {
      const contain = w.style.contain
      w.style.contain = 'inline-size'
      ctx.undo(() => (w.style.contain = contain))
    }
  } else {
    const plus = await splitReady(el)
    if (ctx.done) return
    const split = el.childElementCount === 0 ? splitLines(el, plus) : null
    if (!split) return block(ctx, el)
    ctx.undo(split.revert)
    words = [...el.querySelectorAll<HTMLElement>('.rv-word')]
    for (const w of words) {
      w.style.width = `${w.getBoundingClientRect().width}px`
      w.style.transformOrigin = '50% 100%'
    }
  }
  const gap = gapFor(ctx.tier, stagger.words)
  // A total duration (the home intro) fits every word into it: turn and settle end together.
  const fit = opts.dur ? Math.max(msFor(ctx.tier, 's'), opts.dur - (words.length - 1) * gap) : 0
  const turn = fit || msFor(ctx.tier, 'l')
  const settle = fit || msFor(ctx.tier, 'xl')
  const p = `perspective(${hand.perspective}px)`
  words.forEach((w, i) => {
    const cs = getComputedStyle(w)
    const finalOpsz = Number(/"opsz"\s+([\d.]+)/.exec(cs.fontVariationSettings)?.[1]) || opsz.end
    const finalWght = Number(cs.fontWeight) || weight.h1
    const delay = i * gap
    ctx.animate(
      w,
      [
        { opacity: 0, transform: `${p} translateY(${travel}) rotateX(${angle.word}deg)` },
        { opacity: 1, transform: `${p} translateY(0) rotateX(0deg)` },
      ],
      { duration: turn, delay, easing: E.outExpo, fill: 'backwards' },
      'transform, opacity',
    )
    ctx.animate(
      w,
      [
        { fontVariationSettings: `"opsz" ${opsz.start}, "wght" ${weight.h1Start}` },
        { fontVariationSettings: `"opsz" ${finalOpsz}, "wght" ${finalWght}` },
      ],
      { duration: settle, delay, easing: E.outQuint, fill: 'backwards' },
    )
  })
}

/**
 * deal: About's face-up cards (the timeline, "How I work"): the block's [data-deal-item] cards.
 * Its layout picks the mode (the CSS custom property --deal-mode, so it follows the breakpoints):
 *   deck   the timeline: each card is dealt from a deck at the block's start, in order, on the
 *          land spring (deal.deck): a short flight, a slight turn, opacity
 *   fan    each card rises into a slight fan, then the row settles straight together (deal.fan)
 *   list   the cards in turn, like `list`; anything else: the block rises (`block`)
 * Reduced: one crossfade, nothing is dealt.
 */
export function dealCards(ctx: JobContext, el: HTMLElement): void | Promise<void> {
  if (ctx.tier === 'reduced') return fade(ctx, el)
  const cards = [...el.querySelectorAll<HTMLElement>('[data-deal-item]')].filter((c) => c.getClientRects().length > 0)
  const mode = getComputedStyle(el).getPropertyValue('--deal-mode').trim()
  if (!cards.length) return block(ctx, el)
  const outExpo = E.outExpo
  if (mode === 'deck') {
    // From a deck at the block's start (the year axis's first year), in document (chronological)
    // order, on the land spring; each card travels at most deal.deck.reach px.
    const T = DEAL.deck
    const { easing, duration: springDur } = springCss(spring.land)
    const box = el.getBoundingClientRect()
    const deckX = box.left
    const deckY = box.top
    cards.forEach((card, i) => {
      const to = card.getBoundingClientRect()
      let dx = deckX - to.left
      let dy = deckY - to.top
      const d = Math.hypot(dx, dy)
      if (d > T.reach) {
        dx *= T.reach / d
        dy *= T.reach / d
      }
      const origin = card.style.transformOrigin
      card.style.transformOrigin = '0 0'
      ctx.undo(() => (card.style.transformOrigin = origin))
      ctx.animate(
        card,
        [
          { opacity: 0, transform: `translate(${dx}px, ${dy}px) rotate(${T.tilt}deg)` },
          { opacity: 1, offset: T.appear },
          { opacity: 1, transform: 'none' },
        ],
        { duration: springDur * 1000, delay: i * T.stagger * 1000, easing, fill: 'backwards' },
        'transform, opacity',
      )
    })
    return
  }
  if (mode === 'fan') {
    const T = DEAL.fan
    const n = cards.length
    const landed = ((n - 1) * T.stagger + T.dur) * 1000
    const end = landed + T.settle * 1000
    cards.forEach((card, i) => {
      const fanAngle = angle.hand[Math.round((i * (angle.hand.length - 1)) / Math.max(1, n - 1))] * T.tilt
      const start = i * T.stagger * 1000
      const total = end - start
      // Landed, then held until the last card lands (rounded so the offsets never go backwards).
      const land = Math.min(1, Math.round(((T.dur * 1000) / total) * 1e4) / 1e4)
      const hold = Math.max(land, Math.min(1, Math.round(((landed - start) / total) * 1e4) / 1e4))
      const tilt = `rotate(${fanAngle}deg)`
      const origin = card.style.transformOrigin
      card.style.transformOrigin = '50% 100%'
      ctx.undo(() => (card.style.transformOrigin = origin))
      ctx.animate(
        card,
        [
          { opacity: 0, transform: `translateY(${T.rise}px) ${tilt}`, easing: outExpo },
          { opacity: 1, transform: `translateY(0px) ${tilt}`, offset: land, easing: 'linear' },
          { opacity: 1, transform: `translateY(0px) ${tilt}`, offset: hold, easing: E.inOut },
          { opacity: 1, transform: 'translateY(0px) rotate(0deg)' },
        ],
        { duration: total, delay: start, fill: 'backwards' },
        'transform, opacity',
      )
    })
    return
  }
  if (mode === 'list') return list(ctx, el)
  return block(ctx, el)
}

/** Runs a kind (the dispatcher the engine and the first-load sequence share). */
export function runKind(kind: Kind, ctx: JobContext, el: HTMLElement, opts: KindOptions = {}) {
  switch (kind) {
    case 'lines':
      return lines(ctx, el, opts)
    case 'block':
      return block(ctx, el, 0, opts)
    case 'list':
      return list(ctx, el, opts)
    case 'image':
      return image(ctx, el)
    case 'digits':
      return digits(ctx, el)
    case 'rule':
      return rule(ctx, el, 0, opts)
    case 'draw':
      return draw(ctx, el)
    case 'note':
      return note(ctx, el)
    case 'pair':
      return pair(ctx, el)
    case 'deal':
      return dealCards(ctx, el)
  }
}
