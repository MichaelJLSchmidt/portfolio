import type { Attrs, SvgNode } from './model'

/*
 * Shared geometry for the marks. Master viewBox 0 0 48 48: the cap line is
 * the TOP EDGE at y 9 and the baseline the bottom edge at y 39, so the cap
 * height is 30 units and the mark is centred. Horizontal strokes on the cap
 * line therefore run 3 units below it (centreline y 12). One unit is 1/3 px
 * at 16 px, so values on multiples of 3 land on whole pixels.
 */
export const VB = 48
export const CAP = 9
export const BASE = 39
export const CAP_H = BASE - CAP

export type Pt = [number, number]

const r3 = (n: number) => {
  const v = Math.round(n * 1000) / 1000
  return Object.is(v, -0) ? 0 : v
}
export const num = (n: number) => String(r3(n))

/** "M x y L x y …" for a polyline (optionally closed). */
export function pathOf(pts: Pt[], close = false) {
  return 'M' + pts.map(([x, y]) => `${num(x)} ${num(y)}`).join('L') + (close ? 'Z' : '')
}

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]]
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]]
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k]
const unit = (a: Pt): Pt => {
  const l = Math.hypot(a[0], a[1])
  return [a[0] / l, a[1] / l]
}
const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0]

function intersect(p: Pt, d: Pt, q: Pt, e: Pt): Pt | null {
  const den = cross(d, e)
  if (Math.abs(den) < 1e-9) return null
  const t = cross(sub(q, p), e) / den
  return add(p, mul(d, t))
}

/**
 * The outline of a stroked polyline with butt ends and unlimited miter
 * joins, with a half width per segment (thinner diagonals). Used as the
 * clip of a stroked part: the stroke draws, the outline shapes it.
 */
export function strokeOutline(pts: Pt[], half: number | number[]): Pt[] {
  const h = (i: number) => (Array.isArray(half) ? half[i] : half)
  const dirs = pts.slice(1).map((p, i) => unit(sub(p, pts[i])))
  const nrm = dirs.map(([x, y]): Pt => [-y, x])
  const side = (s: 1 | -1) => {
    const out: Pt[] = [add(pts[0], mul(nrm[0], s * h(0)))]
    for (let j = 1; j < pts.length - 1; j++) {
      const a = add(pts[j], mul(nrm[j - 1], s * h(j - 1)))
      const b = add(pts[j], mul(nrm[j], s * h(j)))
      out.push(intersect(a, dirs[j - 1], b, dirs[j]) ?? mul(add(a, b), 0.5))
    }
    const last = pts.length - 1
    out.push(add(pts[last], mul(nrm[last - 1], s * h(last - 1))))
    return out
  }
  return [...side(1), ...side(-1).reverse()]
}

/** Sutherland–Hodgman against one horizontal line, keeping y >= top (keep 'below') or y <= bottom. */
function clipY(poly: Pt[], y: number, keep: 'below' | 'above'): Pt[] {
  const inside = (p: Pt) => (keep === 'below' ? p[1] >= y : p[1] <= y)
  const out: Pt[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const ia = inside(a)
    const ib = inside(b)
    if (ia) out.push(a)
    if (ia !== ib) {
      const t = (y - a[1]) / (b[1] - a[1])
      out.push([a[0] + (b[0] - a[0]) * t, y])
    }
  }
  return out
}

/** Trim a polygon to the band between a top and a bottom line (cap line, baseline). */
export const clipBand = (poly: Pt[], top: number, bottom: number) => clipY(clipY(poly, top, 'below'), bottom, 'above')

/** The lowest point of a stroked V (the visible valley tip). */
export function tipOf(left: Pt, vertex: Pt, right: Pt, half: number) {
  return Math.max(...strokeOutline([left, vertex, right], half).map((p) => p[1]))
}

/**
 * The valley vertex (centreline) whose visible tip lands on `tipY`: briefs
 * give the valley as a share of the cap height, which is where the eye reads
 * it, i.e. the outer point of the stroked V, not its centreline.
 */
export function valleyFor(left: Pt, right: Pt, x: number, tipY: number, half: number): Pt {
  let lo = Math.max(left[1], right[1]) + 0.5
  let hi = tipY
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    if (tipOf(left, [x, mid], right, half) > tipY) hi = mid
    else lo = mid
  }
  return [x, (lo + hi) / 2]
}

/** Rotate a point around a centre (degrees, clockwise on screen). */
export function rotate([x, y]: Pt, [cx, cy]: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]
}

/* ---------- Node helpers ---------- */

export const g = (attrs: Attrs, ...children: SvgNode[]): SvgNode => ({ tag: 'g', attrs, children })
export const path = (attrs: Attrs): SvgNode => ({ tag: 'path', attrs })
export const rect = (attrs: Attrs): SvgNode => ({ tag: 'rect', attrs })

/** A drawn part: a stroked path with pathLength 1, square ends, miter joins. */
export const stroke = (part: string, d: string, paint: string, width: number, extra: Attrs = {}): SvgNode =>
  path({
    'data-part': part,
    d,
    pathLength: 1,
    fill: 'none',
    stroke: paint,
    'stroke-width': width,
    'stroke-linecap': 'butt',
    'stroke-linejoin': 'miter',
    'stroke-miterlimit': 16,
    ...extra,
  })

export const clipPath = (id: string, ...children: SvgNode[]): SvgNode => ({
  tag: 'clipPath',
  attrs: { id, clipPathUnits: 'userSpaceOnUse' },
  children,
})
