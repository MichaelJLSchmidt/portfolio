/*
 * Pure geometry and text helpers for the illustrations (no React). Coordinates are in the user
 * units of a layout's viewBox ("space"); labels are measured in CSS px (Martian Mono 11 px).
 */

export type Pt = readonly [number, number]

/** A layout's coordinate space: the viewBox of its geometry plates. */
export type Space = { w: number; h: number; vb: string; ratio: string }

export function space(w: number, h: number): Space {
  return { w, h, vb: `0 0 ${w} ${h}`, ratio: `${w} / ${h}` }
}

/** Rounds to two decimals so the markup stays short. */
export const r2 = (n: number) => Math.round(n * 100) / 100

/** A coordinate as a percentage of a space (for px-space pins and labels). */
export const pct = (v: number, of: number) => `${Math.round((v / of) * 1e5) / 1e3}%`

/* ---------- Text metrics (Martian Mono, 11 px; see illustrations.css) ---------- */

/** Advance of one character in px: categories (uppercase, +0.08em) and plain labels (+0.02em). */
export const CH = { cat: 8.58, text: 7.92 } as const
/** Cap height and line step of an 11 px label, in px. */
export const CAP = 8
export const LINE = 16

/** Width in px of a label line. */
export const textWidth = (s: string, cat = false) => s.length * (cat ? CH.cat : CH.text)

/** Greedy word wrap by character count (the font is monospaced). Long words stay whole. */
export function wrap(text: string, max: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word
    else if (line.length + 1 + word.length <= max) line += ` ${word}`
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

/* ---------- Paths ---------- */

export const M = ([x, y]: Pt) => `M${r2(x)} ${r2(y)}`
export const L = ([x, y]: Pt) => `L${r2(x)} ${r2(y)}`
export const C = (a: Pt, b: Pt, c: Pt) => `C${r2(a[0])} ${r2(a[1])} ${r2(b[0])} ${r2(b[1])} ${r2(c[0])} ${r2(c[1])}`

/** Straight polyline through points. */
export const poly = (pts: Pt[]) => pts.map((p, i) => (i ? L(p) : M(p))).join('')

/** Point on a circle; angle in degrees, 0 = 3 o'clock, clockwise (SVG y down). */
export function polar(cx: number, cy: number, r: number, deg: number): Pt {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

/** Circular arc from angle a0 to a1 (degrees, clockwise when a1 > a0). */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = polar(cx, cy, r, a0)
  const p1 = polar(cx, cy, r, a1)
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  const sweep = a1 > a0 ? 1 : 0
  return `${M(p0)}A${r2(r)} ${r2(r)} 0 ${large} ${sweep} ${r2(p1[0])} ${r2(p1[1])}`
}

/** Smooth curve through points (uniform Catmull-Rom as cubic Béziers). */
export function smooth(pts: Pt[], tension = 1): string {
  if (pts.length < 3) return poly(pts)
  let d = M(pts[0])
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const k = tension / 6
    d += C(
      [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k],
      [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k],
      p2,
    )
  }
  return d
}

/**
 * Monotone cubic through points sorted along one axis (Fritsch–Carlson): no overshoot, so the
 * curve's extremes are the data's extremes. `axis` 0 = points ordered by x, 1 = by y.
 */
export function monotone(pts: Pt[], axis: 0 | 1 = 0): string {
  const n = pts.length
  if (n < 3) return poly(pts)
  const u = (p: Pt) => p[axis]
  const v = (p: Pt) => p[1 - axis]
  const h: number[] = []
  const s: number[] = []
  for (let i = 0; i < n - 1; i++) {
    h.push(u(pts[i + 1]) - u(pts[i]))
    s.push((v(pts[i + 1]) - v(pts[i])) / h[i])
  }
  const m: number[] = [s[0]]
  for (let i = 1; i < n - 1; i++) m.push(s[i - 1] * s[i] <= 0 ? 0 : (s[i - 1] + s[i]) / 2)
  m.push(s[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (s[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / s[i]
    const b = m[i + 1] / s[i]
    const t = a * a + b * b
    if (t > 9) {
      const k = 3 / Math.sqrt(t)
      m[i] = k * a * s[i]
      m[i + 1] = k * b * s[i]
    }
  }
  const pt = (uu: number, vv: number): Pt => (axis === 0 ? [uu, vv] : [vv, uu])
  let d = M(pts[0])
  for (let i = 0; i < n - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const dx = h[i] / 3
    d += C(pt(u(a) + dx, v(a) + m[i] * dx), pt(u(b) - dx, v(b) - m[i + 1] * dx), b)
  }
  return d
}

/** Rounded rectangle as a path (draws clockwise from the top-left corner's end). */
export function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  const k = 0.5523 * r
  return [
    M([x + r, y]),
    L([x + w - r, y]),
    C([x + w - r + k, y], [x + w, y + r - k], [x + w, y + r]),
    L([x + w, y + h - r]),
    C([x + w, y + h - r + k], [x + w - r + k, y + h], [x + w - r, y + h]),
    L([x + r, y + h]),
    C([x + r - k, y + h], [x, y + h - r + k], [x, y + h - r]),
    L([x, y + r]),
    C([x, y + r - k], [x + r - k, y], [x + r, y]),
    'Z',
  ].join('')
}

/** Open chevron arrowhead at `tip`, pointing along `deg`, arms of `size`. */
export function chevron(tip: Pt, deg: number, size = 7, spread = 36): string {
  const a = polar(tip[0], tip[1], size, deg + 180 - spread)
  const b = polar(tip[0], tip[1], size, deg + 180 + spread)
  return `${M(a)}${L(tip)}${L(b)}`
}

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Evenly spaced positions from a to b (n ≥ 1). */
export function spread(a: number, b: number, n: number): number[] {
  if (n <= 1) return [(a + b) / 2]
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))
}

/**
 * How to place a label just outside a point on a circle at `deg`: text anchor, vertical
 * alignment and a px nudge outward, so labels sit clear of the ring on every side.
 */
export function radialAlign(deg: number, nudge = 6) {
  const a = (deg * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'
  const valign = sin > 0.3 ? 'top' : sin < -0.3 ? 'bottom' : 'middle'
  return { anchor, valign, dx: cos * nudge, dy: sin * nudge } as const
}
