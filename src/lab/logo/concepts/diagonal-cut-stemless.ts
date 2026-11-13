import { type Pt, pathOf } from '../geometry'
import { ACCENT, type Box, type Concept, NEUTRAL, type Variant, urlOf } from '../model'
import {
  CUT_MATCHED,
  FAV,
  FAV_BOX,
  FAV_PX,
  MASTER,
  type Spec,
  THIN,
  boxFor,
  cross,
  diagonalMotion,
  geo,
  horizontal,
  path,
  revealMask,
} from './diagonal-cut'

/*
 * 8B, 8C, 8D · Diagonal Cut without a stem. Two later hand drawings of
 * concept 8 (viewBox 0 0 779 405) drop the F piece's stem: the M runs on into
 * the F's top arm as before, and the F's middle arm is the only other part.
 *
 *   8B  the middle arm floats: its left edge is vertical, under the top arm's
 *       inner corner (so the stem is implied by alignment); both arm ends are
 *       cut parallel to the M's right diagonal.
 *   8C  the middle arm is cut along the channel (parallel to the diagonal, the
 *       same 67-unit gap as in 8); square arm ends.
 *   8D  a proposal built on 8C: the middle arm runs to the top arm's end minus
 *       one channel width, so it reads as an arm rather than a wedge and holds
 *       at small sizes. One rule for every gap: between the arms, between the
 *       arm and the diagonal, and the arm's shortfall are all the channel.
 *
 * Built with concept 8's generator (cleaned M: parallel-sided diagonals, cap
 * line at y 1, vertical inner stem edge) plus one arm. Same parts as 8
 * (m-reveal, m-part, f-piece = the middle arm), so they share 8's motion.
 */

/* ---------- The drawings, as drawn ---------- */

const DRAWN_B = {
  m: 'M0 0L240 162L436 1H779L677.85 86H479L241 286L90 171L91 405H0V0Z',
  arm: 'M479 153H677.85L576.7 238H479V153Z',
}
const DRAWN_C = {
  m: 'M0 0L240 162L436 1H677.85V86H479L241 286L90 171L91 405H0V0Z',
  arm: 'M503.42 153H576.7V238H402.27L436 209.66L503.42 153Z',
}

/* ---------- Generator ---------- */

type ArmKind = 'floating' | 'channel'
type Arm = {
  kind: ArmKind
  /** x of the middle arm's top-right corner. */
  end: number
  /** Arm-end slant (dx per unit of dy, going down), as Spec.cut. */
  cut: number
}

/** The M (from 8's generator, its F piece unused) and the middle arm: four points, top-left first. */
function build(p: Spec, arm: Arm) {
  const g = geo(p)
  const yT = p.midTop ?? p.y0 + p.h + p.c
  const yB = yT + p.h
  const left = (y: number): Pt => (arm.kind === 'channel' ? cross(g.lf, horizontal(y)) : [g.J[0], y])
  const a: Pt[] = [left(yT), [arm.end, yT], [arm.end + arm.cut * p.h, yB], left(yB)]
  return { m: g.m, arm: a, spine: g.spine }
}

/** Where the square arm ends sit (8C); 8B's slanted ends reach one slant further at the top. */
const TOP_END = 677.85
/** One slant of the matched cut across a horizontal (85 units): 101.15. */
const SLANT = -CUT_MATCHED * MASTER.h

function variant(label: string, g: ReturnType<typeof build>, box: Box, fPaint: string, maskWidth = 240): Variant {
  return {
    label,
    box,
    defs: [revealMask(g.spine, box, maskWidth)],
    body: [
      { tag: 'g', attrs: { mask: urlOf('m-mask') }, children: [path('m-part', pathOf(g.m, true), NEUTRAL)] },
      path('f-piece', pathOf(g.arm, true), fPaint),
    ],
    metrics: { cap: 1, base: 405, stem: 91 },
  }
}

function drawn(d: { m: string; arm: string }, spine: Pt[], width: number): Variant {
  const box = boxFor(width, 0)
  return {
    label: 'As drawn',
    box,
    defs: [revealMask(spine, box, 240)],
    body: [
      { tag: 'g', attrs: { mask: urlOf('m-mask') }, children: [path('m-part', d.m, NEUTRAL)] },
      path('f-piece', d.arm, ACCENT),
    ],
    metrics: { cap: 0, base: 405, stem: 91 },
  }
}

/**
 * Favicon at 16 px on 8's favicon grid (cap 10 px, stems 3 px, diagonals
 * 2.75 px, horizontals 2.5 px, channel 2 px). The top arm reaches 4 px past
 * the diagonal's top corner, the middle arm `armPx` px; the middle arm sits a
 * little lower than in the master so the F's counter stays open.
 */
function favicon(armPx: number, cut: number, kind: ArmKind) {
  const spec: Spec = { ...FAV, topEnd: MASTER.T + 4 * FAV_PX, cut, midTop: 1 + 4.5 * FAV_PX }
  return build(spec, { kind, end: MASTER.T + armPx * FAV_PX, cut })
}
const favVariant = (g: ReturnType<typeof build>): Variant => ({
  ...variant('Favicon', g, FAV_BOX, NEUTRAL, 320),
  metrics: { cap: 1, base: 405, stem: FAV.s },
})

/** One stemless concept: master, its thin twin (same points) for the weight morph, favicon, motion. */
function family(spec: { topEnd: number; topCut: number; arm: Arm; favArm: number; favCut: number }) {
  const s: Spec = { ...MASTER, topEnd: spec.topEnd, cut: spec.topCut }
  const master = build(s, spec.arm)
  const thin = build({ ...THIN, topEnd: spec.topEnd, cut: spec.topCut }, spec.arm)
  const box = boxFor(spec.topEnd)
  return {
    master,
    box,
    favicon: favVariant(favicon(spec.favArm, spec.favCut, spec.arm.kind)),
    motion: diagonalMotion({
      thinM: pathOf(thin.m, true),
      masterM: pathOf(master.m, true),
      thinF: pathOf(thin.arm, true),
      masterF: pathOf(master.arm, true),
    }),
  }
}

/* ---------- 8B · floating arm ---------- */

const b = family({
  topEnd: TOP_END + SLANT,
  topCut: CUT_MATCHED,
  arm: { kind: 'floating', end: TOP_END, cut: CUT_MATCHED },
  favArm: 3.5,
  favCut: 0,
})

export const diagonalFloating: Concept = {
  id: '8b',
  label: '8B',
  scoreKey: 'score-8b',
  slug: 'diagonal-cut-floating-arm',
  name: 'Diagonal Cut, floating arm',
  idea: "No F stem: the M runs into the top arm, the middle arm floats under the top arm's inner corner, both arm ends cut along the diagonal.",
  parts: ['m-reveal', 'm-part', 'f-piece'],
  accent: ['f-piece'],
  variants: {
    master: variant('Master', b.master, b.box, ACCENT),
    drawn: drawn(DRAWN_B, b.master.spine, TOP_END + SLANT),
    favicon: b.favicon,
  },
  motion: b.motion,
  notes: [
    'As drawn: the two original paths, only scaled.',
    'Master: the M cleaned as in 8 (cap line at y 1, vertical inner stem edge, parallel-sided diagonals); the arm exactly as drawn (left edge under the top arm’s inner corner, ends parallel to the diagonal).',
    'Favicon: 8’s favicon grid with square ends: slanted along the diagonal, each end needs 3 px of the 16 and the top arm would cut into the diagonal. The floating arm keeps its vertical left edge and sits a little lower.',
  ],
}

/* ---------- 8C · arm cut along the channel ---------- */

const c = family({
  topEnd: TOP_END,
  topCut: 0,
  arm: { kind: 'channel', end: TOP_END - SLANT, cut: 0 },
  favArm: 3,
  favCut: 0,
})

export const diagonalChannel: Concept = {
  id: '8c',
  label: '8C',
  scoreKey: 'score-8c',
  slug: 'diagonal-cut-channel-arm',
  name: 'Diagonal Cut, channel arm',
  idea: 'No F stem: the M runs into the top arm, the middle arm is cut off along the channel; square arm ends.',
  parts: ['m-reveal', 'm-part', 'f-piece'],
  accent: ['f-piece'],
  variants: {
    master: variant('Master', c.master, c.box, ACCENT),
    drawn: drawn(DRAWN_C, c.master.spine, TOP_END),
    favicon: c.favicon,
  },
  motion: c.motion,
  notes: [
    'As drawn: the two original paths, only scaled.',
    'Master: the M cleaned as in 8; the arm exactly as drawn (its left end on the channel, 67 units from the diagonal; it already was).',
    'Favicon: 8’s favicon grid, square ends, a 3 px middle arm set a little lower.',
  ],
}

/* ---------- 8D · proposal: the arm as long as the system allows ---------- */

const CHANNEL = MASTER.c
const d = family({
  topEnd: TOP_END,
  topCut: 0,
  arm: { kind: 'channel', end: TOP_END - CHANNEL, cut: 0 },
  favArm: 3.5,
  favCut: 0,
})
/** Slanted: as 8B, each end gains one slant at the top; the bottom corners stay where the square ends are. */
const dMatched = build(
  { ...MASTER, topEnd: TOP_END + SLANT, cut: CUT_MATCHED },
  { kind: 'channel', end: TOP_END - CHANNEL + SLANT, cut: CUT_MATCHED },
)

export const diagonalBalanced: Concept = {
  id: '8d',
  label: '8D',
  scoreKey: 'score-8d',
  slug: 'diagonal-cut-balanced',
  name: 'Diagonal Cut, balanced arm',
  idea: "8C with one rule for every gap: the channel. The middle arm stops one channel short of the top arm's end.",
  parts: ['m-reveal', 'm-part', 'f-piece'],
  accent: ['f-piece'],
  variants: {
    master: variant('Master', d.master, d.box, ACCENT),
    matched: variant('Slanted ends', dMatched, boxFor(TOP_END + SLANT), ACCENT),
    favicon: d.favicon,
  },
  motion: d.motion,
  notes: [
    'A proposal on 8C. Its middle arm ended 101 units short of the top arm (top edge 73 units, a wedge that turns into a dot at 16–32 px).',
    `Here it ends one channel width (${CHANNEL}) short: top edge about 107 units, so it reads as an arm, and every gap in the mark is the same 67 units (between the arms, arm to diagonal, arm end to top-arm end).`,
    'Slanted ends: both arm ends cut parallel to the diagonal, added outward as in 8B (bottom corners where the square ends are), so the whole mark uses one angle.',
    'Favicon: 8’s favicon grid, square ends, a 3.5 px middle arm set a little lower.',
  ],
}
