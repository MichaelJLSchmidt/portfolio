import { type Pt, pathOf } from '../geometry'
import {
  ACCENT,
  type Box,
  type Concept,
  type ConceptMotion,
  NEUTRAL,
  type Seq,
  type SvgNode,
  type Variant,
  idOf,
  urlOf,
} from '../model'
import { wave } from '../motion-kit'

/*
 * 8 · Diagonal Cut. Drawn by hand in a vector tool (viewBox 0 0 779 405,
 * three filled paths): the M runs on into the F's top arm; the F's stem
 * (which is also the M's right stem) and its middle arm are cut off the M by
 * a channel parallel to the M's right diagonal; the arm ends are cut at a
 * slant. The F piece (stem + middle arm) is the accent.
 *
 * Coordinates stay in the drawing's units (y down, cap line y 1, baseline
 * y 405); each variant's viewBox scales them. The M part is the miter-joined
 * outline of a five-point centreline (left stem, apex, valley, right apex,
 * top arm), so one generator rebuilds the drawing from its outer edges and
 * stroke weights: the cleaned master, the matched-angle variant, the thin
 * master for the weight morph (same point structure) and the favicon.
 */

/* ---------- The drawing, as drawn ---------- */

const DRAWN = {
  a: 'M0 0L240 162L436 1H779L722 86H479L241 286L90 171L91 405H0V0Z',
  b: 'M436 209.66V405H345V286.133L436 209.66Z',
  c: 'M503.44 153H677.05L620.04 238H436V209.66L503.44 153Z',
}

/* ---------- Generator ---------- */

type Line = { p: Pt; d: Pt }
const unit = ([x, y]: Pt): Pt => {
  const l = Math.hypot(x, y)
  return [x / l, y / l]
}
const along = (l: Line, n: Pt, dist: number): Line => ({ p: [l.p[0] + n[0] * dist, l.p[1] + n[1] * dist], d: l.d })
export function cross(a: Line, b: Line): Pt {
  const den = a.d[0] * b.d[1] - a.d[1] * b.d[0]
  const t = ((b.p[0] - a.p[0]) * b.d[1] - (b.p[1] - a.p[1]) * b.d[0]) / den
  return [a.p[0] + a.d[0] * t, a.p[1] + a.d[1] * t]
}
const vertical = (x: number): Line => ({ p: [x, 0], d: [0, 1] })
export const horizontal = (y: number): Line => ({ p: [0, y], d: [1, 0] })

export type Spec = {
  /** Cap line (top edge) and baseline. */
  y0: number
  H: number
  /** Stem, horizontal, diagonal and channel widths. */
  s: number
  h: number
  d: number
  c: number
  /** Slope (dy/dx) of the left diagonal's upper edge, which starts at the apex corner (0, y0). */
  m: number
  /** Where the right diagonal's upper edge meets the cap line; also the F stem's right edge. */
  T: number
  /** The right diagonal's direction, up and to the right (unit). */
  u: Pt
  /** x of the arms' top-right corners. */
  topEnd: number
  midEnd: number
  /** Arm-end slant: dx per unit of dy, going down (negative: the top corner is outermost). */
  cut: number
  /** Top of the middle arm; default y0 + h + c (the gap between the arms equals the channel). */
  midTop?: number
}

/** The drawing's right diagonal (241,286)→(479,86) and arm-end slant 57 / 85. */
const U = unit([238, -200])
const CUT = -57 / 85
export const CUT_MATCHED = -238 / 200

/** Outer anchors and widths of the drawing (cleaned): see `cleanSlope`. */
export function geo(p: Spec) {
  const lu: Line = { p: [0, p.y0], d: unit([1, p.m]) }
  const nl: Pt = [-lu.d[1], lu.d[0]]
  const ll = along(lu, nl, p.d)
  const ru: Line = { p: [p.T, p.y0], d: p.u }
  const nr: Pt = [-p.u[1], p.u[0]]
  const lr = along(ru, nr, p.d)
  const lf = along(ru, nr, p.d + p.c)
  const N = cross(lu, ru)
  const V = cross(ll, lr)
  const S1 = cross(ll, vertical(p.s))
  const J = cross(lr, horizontal(p.y0 + p.h))
  const m: Pt[] = [
    [0, p.y0],
    N,
    [p.T, p.y0],
    [p.topEnd, p.y0],
    [p.topEnd + p.cut * p.h, p.y0 + p.h],
    J,
    V,
    S1,
    [p.s, p.H],
    [0, p.H],
  ]
  const yM = p.midTop ?? p.y0 + p.h + p.c
  const fx0 = p.T - p.s
  const f: Pt[] = [
    [fx0, p.H],
    cross(lf, vertical(fx0)),
    cross(lf, horizontal(yM)),
    [p.midEnd, yM],
    [p.midEnd + p.cut * p.h, yM + p.h],
    [p.T, yM + p.h],
    [p.T, p.H],
  ]
  // The M's centreline (for the reveal mask): stem, apex, valley, right apex, arm end.
  const lc = along(lu, nl, p.d / 2)
  const rc = along(ru, nr, p.d / 2)
  const spine: Pt[] = [
    [p.s / 2, p.H],
    cross(lc, vertical(p.s / 2)),
    cross(lc, rc),
    cross(rc, horizontal(p.y0 + p.h / 2)),
    [p.topEnd + (p.cut * p.h) / 2, p.y0 + p.h / 2],
  ]
  return { m, f, spine, V, N, S1, J, lf, yM }
}

/**
 * The cleaned master's left-diagonal slope: its upper edge from the apex
 * corner (0, 1) and its lower edge through the drawn valley point (241, 286),
 * parallel, `d` apart.
 */
function cleanSlope(d: number, y0: number, V: Pt) {
  let lo = 0.3
  let hi = 1.5
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2
    const dist = (V[1] - y0 - m * V[0]) / Math.hypot(1, m)
    if (dist > d) lo = m
    else hi = m
  }
  return (lo + hi) / 2
}

/** The right diagonal's width where it meets the top arm in the drawing (its top end): 92.74. */
const D = (() => {
  const n: Pt = [-U[1], U[0]]
  const dot = (q: Pt) => n[0] * q[0] + n[1] * q[1]
  return dot([241, 286]) - dot([436, 1])
})()

export const MASTER: Spec = {
  y0: 1,
  H: 405,
  s: 91,
  h: 85,
  d: D,
  c: 67,
  m: cleanSlope(D, 1, [241, 286]),
  T: 436,
  u: U,
  topEnd: 779,
  midEnd: 677.05,
  cut: CUT,
}
const master = geo(MASTER)

/**
 * Thin master for the weight morph: the same outer edges, strokes thinned
 * from the inside. The channel's outer wall (the F piece's edge) stays where
 * it is, and the thin middle arm sits low enough to stay joined to the stem
 * (same point structure as the master, no self-intersection).
 */
const THIN_D = 30
export const THIN: Spec = {
  ...MASTER,
  s: 30,
  h: 28,
  d: THIN_D,
  c: MASTER.d + MASTER.c - THIN_D,
  midTop: 184,
}
const thin = geo(THIN)

/* ---------- Favicon ---------- */

/**
 * Favicon, 16 px. As drawn the mark is 8 px tall in the square and the
 * channel closes. Here the cap height is 10 px (rows 3–13, 40.4 units per
 * px): stems 3 px, diagonals 2.75 px, horizontals 2.5 px, a 2 px channel,
 * a 4 px top arm and a 3.5 px middle arm set a little lower (top at 4.5 px
 * below the cap line) so it starts close to the stem. Same angles and arm
 * cut as the master; the left stem sits on whole pixels.
 */
export const FAV_PX = 404 / 10
export const FAV: Spec = {
  ...MASTER,
  s: 3 * FAV_PX,
  h: 2.5 * FAV_PX,
  d: 2.75 * FAV_PX,
  c: 2 * FAV_PX,
  topEnd: MASTER.T + 4 * FAV_PX,
  midEnd: MASTER.T + 3.5 * FAV_PX,
  midTop: 1 + 4.5 * FAV_PX,
}
const fav = geo(FAV)
export const FAV_BOX: Box = { x: -FAV_PX, y: 1 - 3 * FAV_PX, w: 16 * FAV_PX, h: 16 * FAV_PX }

/* ---------- Variants ---------- */

const MARGIN = 81
export const boxFor = (w: number, y0 = 1, H = 405): Box => ({
  x: -MARGIN,
  y: y0 - MARGIN,
  w: w + 2 * MARGIN,
  h: H - y0 + 2 * MARGIN,
})

export const path = (part: string, d: string, paint: string): SvgNode => ({
  tag: 'path',
  attrs: { 'data-part': part, d, fill: paint },
})

/**
 * The M part sits under a mask holding one wide stroke along its centreline:
 * static, the stroke covers the whole M; for the reveal it draws along the
 * line (dash), so the filled outline appears left to right and stays exact.
 */
export function revealMask(spine: Pt[], box: Box, width: number): SvgNode {
  return {
    tag: 'mask',
    attrs: { id: idOf('m-mask'), maskUnits: 'userSpaceOnUse', x: box.x, y: box.y, width: box.w, height: box.h },
    children: [
      {
        tag: 'path',
        attrs: {
          'data-part': 'm-reveal',
          d: pathOf(spine),
          pathLength: 1,
          fill: 'none',
          stroke: 'white',
          'stroke-width': width,
          'stroke-linecap': 'square',
          'stroke-linejoin': 'round',
        },
      },
    ],
  }
}

function variant(
  label: string,
  g: ReturnType<typeof geo>,
  width: number,
  fPaint: string,
  maskWidth = 240,
  box = boxFor(width),
): Variant {
  return {
    label,
    box,
    defs: [revealMask(g.spine, box, maskWidth)],
    body: [
      { tag: 'g', attrs: { mask: urlOf('m-mask') }, children: [path('m-part', pathOf(g.m, true), NEUTRAL)] },
      path('f-piece', pathOf(g.f, true), fPaint),
    ],
    metrics: { cap: 1, base: 405, stem: 91 },
  }
}

const drawn: Variant = {
  label: 'As drawn',
  box: boxFor(779, 0),
  defs: [revealMask(master.spine, boxFor(779, 0), 240)],
  body: [
    { tag: 'g', attrs: { mask: urlOf('m-mask') }, children: [path('m-part', DRAWN.a, NEUTRAL)] },
    {
      tag: 'g',
      attrs: { 'data-part': 'f-piece', fill: ACCENT },
      children: [
        { tag: 'path', attrs: { d: DRAWN.b } },
        { tag: 'path', attrs: { d: DRAWN.c } },
      ],
    },
  ],
  metrics: { cap: 0, base: 405, stem: 91 },
}

const matched = geo({ ...MASTER, cut: CUT_MATCHED })

/* ---------- Motion ---------- */

/** One lab unit (1/48 of a square mark) in the drawing's units, for distances. */
export const LU = boxFor(779).w / 48
const slide = (k: number) => `translate(${(U[0] * k).toFixed(2)}px, ${(U[1] * k).toFixed(2)}px)`

/**
 * The family's motion (8 and its stemless versions): the M is drawn through its mask, the F piece
 * slides in along the channel; the thin-to-bold morph interpolates thin and full outlines of the
 * same point structure.
 */
export function diagonalMotion(p: { thinM: string; masterM: string; thinF: string; masterF: string }): ConceptMotion {
  return {
    reveal: {
      label: 'Draw, then slide in',
      full: [
        {
          part: 'm-reveal',
          at: 0,
          dur: 600,
          ease: 'enter',
          frames: [
            { strokeDasharray: '1 1', strokeDashoffset: 1 },
            { strokeDasharray: '1 1', strokeDashoffset: 0 },
          ],
        },
        {
          part: 'f-piece',
          at: 520,
          dur: 480,
          ease: 'enter',
          frames: [
            { transform: slide(-9 * LU), opacity: 0, fill: '@neutral', offset: 0 },
            { opacity: 1, offset: 0.35 },
            { transform: slide(0), opacity: 1, fill: '@accent', offset: 1 },
          ],
        },
      ],
      calm: [
        {
          kind: 'morph',
          part: 'm-part',
          at: 0,
          dur: 600,
          ease: 'move',
          attr: 'd',
          values: [p.thinM, p.masterM],
        },
        {
          kind: 'morph',
          part: 'f-piece',
          at: 0,
          dur: 600,
          ease: 'move',
          attr: 'd',
          values: [p.thinF, p.masterF],
        },
        { part: 'm-part', at: 0, dur: 300, ease: 'enter', frames: [{ opacity: 0 }, { opacity: 1 }] },
        { part: 'f-piece', at: 100, dur: 300, ease: 'enter', frames: [{ opacity: 0 }, { opacity: 1 }] },
      ],
    },
    alt: {
      label: 'Thin to bold',
      full: [
        {
          kind: 'morph',
          part: 'm-part',
          at: 0,
          dur: 700,
          ease: 'move',
          attr: 'd',
          values: [p.thinM, p.masterM],
        },
        {
          kind: 'morph',
          part: 'f-piece',
          at: 0,
          dur: 700,
          ease: 'move',
          attr: 'd',
          values: [p.thinF, p.masterF],
        },
      ],
      calm: [
        {
          kind: 'morph',
          part: 'm-part',
          at: 0,
          dur: 700,
          ease: 'move',
          attr: 'd',
          values: [p.thinM, p.masterM],
        },
        {
          kind: 'morph',
          part: 'f-piece',
          at: 0,
          dur: 700,
          ease: 'move',
          attr: 'd',
          values: [p.thinF, p.masterF],
        },
      ],
    },
    extra: {
      label: 'Slide out and back',
      full: [
        {
          part: 'f-piece',
          at: 0,
          dur: 1100,
          ease: 'move',
          frames: [
            { transform: slide(0), offset: 0 },
            { transform: slide(-7 * LU), offset: 0.4 },
            { transform: slide(-7 * LU), offset: 0.55 },
            { transform: slide(0), offset: 1 },
          ],
        },
      ],
      calm: null,
    },
    hover: {
      label: 'Hover',
      full: [
        {
          part: 'f-piece',
          at: 0,
          dur: 220,
          ease: 'move',
          frames: [{ transform: slide(0) }, { transform: slide(1.5 * LU) }],
        },
      ],
      calm: [
        {
          part: 'f-piece',
          at: 0,
          dur: 220,
          ease: 'move',
          frames: [{ transform: slide(0) }, { transform: slide(1.5 * LU) }],
        },
      ],
    },
    loading: {
      label: 'Loading',
      full: [
        {
          part: 'm-reveal',
          at: 0,
          dur: 1600,
          ease: 'linear',
          frames: [
            { strokeDasharray: '1 1', strokeDashoffset: 0 },
            { strokeDasharray: '1 1', strokeDashoffset: -2 },
          ],
        },
        ...wave(['f-piece']),
      ],
      calm: wave(['m-part', 'f-piece']),
    },
    exit: {
      label: 'Exit',
      full: ['m-part', 'f-piece'].map((part) => ({
        part,
        at: 0,
        dur: 300,
        ease: 'exit' as const,
        frames: [
          { opacity: 1, transform: 'translate(0px, 0px)' },
          { opacity: 0, transform: `translate(0px, ${(3 * LU).toFixed(2)}px)` },
        ],
      })) as Seq,
      calm: ['m-part', 'f-piece'].map((part) => ({
        part,
        at: 0,
        dur: 300,
        ease: 'exit' as const,
        frames: [{ opacity: 1 }, { opacity: 0 }],
      })),
    },
  }
}

export const diagonalCut: Concept = {
  id: '8',
  label: '8',
  scoreKey: 'score-8',
  slug: 'diagonal-cut',
  name: 'Diagonal Cut',
  idea: "The M runs into the F's top arm; the F's stem and middle arm are cut off the M by a channel along its diagonal.",
  parts: ['m-reveal', 'm-part', 'f-piece'],
  accent: ['f-piece'],
  variants: {
    master: variant('Master', master, 779, ACCENT),
    drawn,
    matched: variant('Matched angles', matched, 779, ACCENT),
    favicon: { ...variant('Favicon', fav, 0, NEUTRAL, 320, FAV_BOX), metrics: { cap: 1, base: 405, stem: FAV.s } },
  },
  motion: diagonalMotion({
    thinM: pathOf(thin.m, true),
    masterM: pathOf(master.m, true),
    thinF: pathOf(thin.f, true),
    masterF: pathOf(master.f, true),
  }),
  notes: [
    'As drawn: the three original paths, only scaled (F stem and middle arm grouped as one part for motion).',
    'Master: stem and middle arm merged into one F path (no seam on the shared edge); cap line at y 1 throughout (the apex corner was at 0); the left stem’s inner edge vertical at x 91.',
    `Diagonals made consistent: both parallel-sided, ${D.toFixed(1)} units, the right diagonal’s width where it meets the top arm, so its top corner (436, 1) and the F stem stay exactly as drawn. In the drawing they ran 92.7→95.6 (right) and 91.4→102.2 (left).`,
    `The left diagonal keeps its apex corner and its valley point (241, 286); its edges now share one slope (${MASTER.m.toFixed(3)}, between the drawn 0.675 and 0.762), which moves the notch by 7 units and the inner joint by 8. Stems 91, horizontals 85 (kept), channel 67.`,
    'Matched angles: arm ends cut parallel to the right diagonal (238 : 200), top corners kept.',
    'Favicon: cap 10 px, stems 3 px, diagonals 2.75 px, horizontals 2.5 px, channel 2 px, arms 4 and 3.5 px past the stem, middle arm a little lower: the channel stays open at 16 px. Same angles and arm cut.',
    'Wide viewBox: shown at the same width as the square marks; fitted by width in square contexts (containers, apple-touch); the lockup matches cap heights.',
  ],
}

/** The generator and its specs, for the QA tools (render and favicon prototypes). */
export const debug8 = { master, thin, matched, fav, MASTER, THIN, FAV, geo, D, boxFor }
