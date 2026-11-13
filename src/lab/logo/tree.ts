import { VB, g, num, rect } from './geometry'
import { type Box, type Concept, type SvgNode, type Variant, type VariantKey, conceptLabel } from './model'

/*
 * One tree per (concept, variant, container): the root <svg> with defs, the
 * optional container shape and the mark. mark.tsx renders it inline (React),
 * svg-string.ts writes it as a standalone file. Placeholders (@neutral,
 * @accent, @container, @id:) are resolved by each renderer.
 *
 * Most marks live in the square 0 0 48 48 box. A wide mark (concept 8) keeps
 * its own viewBox; inside a square or card container it is fitted by width
 * into the 48-unit box, centred vertically.
 */
export type Container = 'none' | 'square' | 'card'
export const CONTAINER = '@container'

export const SQUARE: Box = { x: 0, y: 0, w: VB, h: VB }
/** Card container: the hand's 132:184 card around the 48-unit mark box, with the site's card radius (10 / 176). */
const CARD_W = 60
const CARD_H = (CARD_W * 184) / 132
const CARD_R = (CARD_W * 10) / 176
/** Rounded square: the full 48-unit box, radius 10.5 (22 %). */
export const SQUARE_R = 10.5

export const boxOf = (v: Variant | undefined): Box => v?.box ?? SQUARE
export const variantOf = (concept: Concept, key: VariantKey) => concept.variants[key] ?? concept.variants.master

export function viewBoxFor(container: Container, variant?: Variant): Box {
  if (container === 'none') return boxOf(variant)
  if (container === 'square') return SQUARE
  return { x: (VB - CARD_W) / 2, y: (VB - CARD_H) / 2, w: CARD_W, h: CARD_H }
}

/** Height for a given width (px) of a mark as rendered. */
export function heightFor(width: number, container: Container, variant?: Variant) {
  const b = viewBoxFor(container, variant)
  return Math.round(((width * b.h) / b.w) * 100) / 100
}

/** A wide box fitted by width into the square, centred on y 24; null when it is the square already. */
function fit(box: Box): string | null {
  if (box.x === 0 && box.y === 0 && box.w === VB && box.h === VB) return null
  const s = VB / box.w
  return `translate(${num(-box.x * s)} ${num(VB / 2 - (box.y + box.h / 2) * s)}) scale(${num(s)})`
}

/** Numeric attributes rounded to 3 decimals (the files stay short and stable). */
function tidy(node: SvgNode): SvgNode {
  const attrs = node.attrs
    ? Object.fromEntries(
        Object.entries(node.attrs).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * 1000) / 1000 : v]),
      )
    : undefined
  return { ...node, attrs, children: node.children?.map(tidy) }
}

export function buildMark(concept: Concept, key: VariantKey, container: Container = 'none'): SvgNode {
  return tidy(buildRaw(concept, key, container))
}

function buildRaw(concept: Concept, key: VariantKey, container: Container): SvgNode {
  const variant = variantOf(concept, key)
  const box = viewBoxFor(container, variant)
  const children: SvgNode[] = []
  if (variant.defs?.length) children.push({ tag: 'defs', children: variant.defs })
  if (container === 'square') {
    children.push(
      rect({ 'data-container': 'square', x: 0, y: 0, width: VB, height: VB, rx: SQUARE_R, fill: CONTAINER }),
    )
  } else if (container === 'card') {
    children.push(
      rect({ 'data-container': 'card', x: box.x, y: box.y, width: box.w, height: box.h, rx: CARD_R, fill: CONTAINER }),
    )
  }
  // One transform on the mark group (copied by the glint): container fit, then the optical nudge.
  const [dx, dy] = variant.nudge ?? [0, 0]
  const fitted = container === 'none' ? null : fit(boxOf(variant))
  const transform = [fitted, dx || dy ? `translate(${dx} ${dy})` : null].filter(Boolean).join(' ')
  children.push(g({ 'data-mark': '', transform: transform || undefined }, ...variant.body))
  return {
    tag: 'svg',
    attrs: {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: [box.x, box.y, box.w, box.h].map((n) => Math.round(n * 1000) / 1000).join(' '),
      role: 'img',
      'aria-label': conceptLabel(concept),
      'data-concept': concept.id,
      'data-variant': key,
    },
    children,
  }
}

/** Lockup metrics after the optical nudge, with the box they are measured in. */
export function metricsOf(concept: Concept, key: VariantKey) {
  const v = variantOf(concept, key)
  const dy = v.nudge?.[1] ?? 0
  return { cap: v.metrics.cap + dy, base: v.metrics.base + dy, stem: v.metrics.stem, box: boxOf(v) }
}
