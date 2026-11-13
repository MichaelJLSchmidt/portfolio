import { type Pt, clipBand, g, num, pathOf, rect, rotate, strokeOutline, valleyFor } from '../geometry'
import {
  ACCENT,
  type CssTrack,
  type Concept,
  NEUTRAL,
  type Seq,
  type SvgNode,
  type Variant,
  idOf,
  urlOf,
} from '../model'

/*
 * 3 · Two Cards. Two rounded cards in the card ratio (20 × 28, radius 2.5),
 * fanned: the back one turned −6° about its bottom centre, the front one 12
 * units to the right (the brief's 9 covers more than half), turned +5°, over
 * the back card's right part. An M is
 * cut out of the back card, an F out of the front card; the F's stem lies
 * where the M's right stem would be, so the shared stem is implied.
 *
 * Monochrome first: the front card is knocked out of the back card with a
 * 1.5-unit gap (a mask), so the overlap reads in one colour and in a file.
 * The knock-out shape is its own part ("gap") inside that mask and moves with
 * the front card, so the gap never shows before the front card does.
 */
const W = 20
const H = 28
const R = 2.5
/** The brief says 9; at 9 the front card hides 55 % of the back card and the M reads as an N. */
const SPREAD = 12
const BACK_DEG = -6
const FRONT_DEG = 5

/** Place the fan so the bounding box of both turned cards is centred on (24, 24). */
function placement() {
  const corners = (x: number, deg: number): Pt[] => {
    const o: Pt = [x + W / 2, H]
    return (
      [
        [x, 0],
        [x + W, 0],
        [x + W, H],
        [x, H],
      ] as Pt[]
    ).map((p) => rotate(p, o, deg))
  }
  const pts = [...corners(0, BACK_DEG), ...corners(SPREAD, FRONT_DEG)]
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return { bx: 24 - (Math.min(...xs) + Math.max(...xs)) / 2, by: 24 - (Math.min(...ys) + Math.max(...ys)) / 2 }
}
const { bx, by } = placement()
const fx = bx + SPREAD
const backPivot: Pt = [bx + W / 2, by + H]
const frontPivot: Pt = [fx + W / 2, by + H]
const rot = (deg: number, [x, y]: Pt) => `rotate(${deg} ${num(x)} ${num(y)})`

/**
 * M cut: 3.5 monoline, cap 14 (card y 7–21), valley tip at 60 % (+0.5). Its
 * right stem (card x 15.5–19) lies under the F's stem. Card-local → absolute.
 */
function mCut(): string {
  const sw = 3.5
  const top = by + 7
  const base = by + 21
  const l = bx + 4.75
  const r = bx + 17.25
  const apexL: Pt = [l, top + sw / 2]
  const apexR: Pt = [r, top + sw / 2]
  const v = valleyFor(apexL, apexR, (l + r) / 2, top + 0.6 * 14 + 0.5, 3.25 / 2)
  const pts: Pt[] = [[l, base], apexL, v, apexR, [r, base]]
  return pathOf(clipBand(strokeOutline(pts, [1.75, 1.625, 1.625, 1.75]), top, base), true)
}

const box = (x1: number, y0: number, x2: number, y2: number) =>
  pathOf(
    [
      [x1, y0],
      [x2, y0],
      [x2, y2],
      [x1, y2],
    ],
    true,
  )

/** F cut: stem at card x 3.5–7 (over the M's right stem), arms to x 16 and 13.5. */
function fCut(): string {
  const top = by + 7
  const base = by + 21
  const x0 = fx + 3.5
  return box(x0, top, x0 + 3.5, base) + box(x0, top, fx + 16, top + 3.5) + box(x0, by + 12.75, fx + 13.5, by + 16.25)
}

/** Concept 8's arm-end cut: 57 across for 85 down (56° from horizontal), top corner outermost. */
export const ARM_CUT = 57 / 85

/**
 * 3B's F: the same stem; arm ends cut at concept 8's slant; the middle arm
 * clearly shorter and set a little higher (optical centre), so the F stays
 * light next to the M. Card-local x / y as for fCut.
 */
function fCutDynamic(): string {
  const sw = 3.5
  const top = by + 7
  const base = by + 21
  const x0 = fx + 3.5
  const arm = (y0: number, end: number) =>
    pathOf(
      [
        [x0, y0],
        [fx + end, y0],
        [fx + end - sw * ARM_CUT, y0 + sw],
        [x0, y0 + sw],
      ],
      true,
    )
  return box(x0, top, x0 + sw, base) + arm(top, DYN.top) + arm(by + DYN.midY, DYN.mid)
}
/** 3B's arm ends (card x of the top-right corners) and the middle arm's top (card y). */
const DYN = { top: 17, mid: 13, midY: 12.5 }

const BIG = { x: -24, y: -24, width: 96, height: 96 }
const mask = (id: string, ...children: SvgNode[]): SvgNode => ({
  tag: 'mask',
  attrs: { id, maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse', ...BIG },
  children: [rect({ ...BIG, fill: 'white' }), ...children],
})

function build(label: string, letters: boolean, gap: number, frontPaint: string, f: () => string = fCut): Variant {
  const card = (x: number, paint: string, maskId?: string) =>
    rect({ x, y: by, width: W, height: H, rx: R, fill: paint, mask: maskId ? urlOf(maskId) : undefined })
  const defs: SvgNode[] = [
    mask(
      idOf('gap'),
      g(
        { transform: rot(FRONT_DEG, frontPivot) },
        rect({
          'data-part': 'gap',
          x: fx,
          y: by,
          width: W,
          height: H,
          rx: R,
          fill: 'black',
          stroke: 'black',
          'stroke-width': gap * 2,
        }),
      ),
    ),
  ]
  if (letters) {
    defs.push(
      mask(idOf('back-letters'), { tag: 'path', attrs: { 'data-part': 'cut-m', d: mCut(), fill: 'black' } }),
      mask(idOf('front-letters'), { tag: 'path', attrs: { 'data-part': 'cut-f', d: f(), fill: 'black' } }),
    )
  }
  return {
    label,
    defs,
    body: [
      g(
        { mask: urlOf('gap') },
        g(
          { transform: rot(BACK_DEG, backPivot) },
          g({ 'data-part': 'card-back' }, card(bx, NEUTRAL, letters ? 'back-letters' : undefined)),
        ),
      ),
      g(
        { transform: rot(FRONT_DEG, frontPivot) },
        g({ 'data-part': 'card-front' }, card(fx, frontPaint, letters ? 'front-letters' : undefined)),
      ),
    ],
    metrics: { cap: by + 7, base: by + 21, stem: 3.5 },
  }
}

/* ---------- Motion ---------- */

const pivot = { origin: '50% 100%', box: 'fill-box' as const }
const centre = { origin: '50% 50%', box: 'fill-box' as const }
/** The front card's tracks also drive its knock-out in the back card. */
const front = (t: Omit<CssTrack, 'part'>): Seq => [
  { ...t, part: 'card-front' },
  { ...t, part: 'gap' },
]

const deal = (deg: number, dx: number): Keyframe[] => [
  { opacity: 0, transform: `translate(${dx}px, 10px) rotate(${deg}deg)`, offset: 0 },
  { opacity: 1, offset: 0.45 },
  { opacity: 1, transform: 'translate(0px, 0px) rotate(0deg)', offset: 1 },
]
const fade: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }]
const fan = (deg: number): Keyframe[] => [{ transform: 'rotate(0deg)' }, { transform: `rotate(${deg}deg)` }]
const breathe = (deg: number): Keyframe[] => [
  { transform: 'rotate(0deg)' },
  { transform: `rotate(${deg}deg)` },
  { transform: 'rotate(0deg)' },
]
const turn: Keyframe[] = [
  { transform: 'scale(1, 1)', easing: 'cubic-bezier(0.3, 0, 0.8, 0.15)' },
  { transform: 'scale(0, 1)', offset: 0.5, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)' },
  { transform: 'scale(1, 1)' },
]
/** Letters show from the moment the card is edge-on. */
const showAtTurn: Keyframe[] = [
  { opacity: 0, offset: 0 },
  { opacity: 0, offset: 0.5 },
  { opacity: 1, offset: 0.5 },
  { opacity: 1, offset: 1 },
]
const out: Keyframe[] = [
  { opacity: 1, transform: 'translate(0px, 0px)' },
  { opacity: 0, transform: 'translate(0px, 3px)' },
]

type Own = Pick<Concept, 'id' | 'label' | 'scoreKey' | 'slug' | 'name' | 'idea' | 'notes'>

/** Concept 3 and its variations: everything but the F cut is shared. */
const makeTwoCards = (own: Own, f: () => string): Concept => ({
  ...own,
  parts: ['card-back', 'card-front', 'gap', 'cut-m', 'cut-f'],
  accent: ['card-front'],
  variants: {
    master: build('Master', true, 1.5, ACCENT, f),
    favicon: build('Favicon (letterless fan)', false, 3, NEUTRAL, f),
    letterless: build('Letterless fan', false, 1.5, ACCENT, f),
  },
  motion,
})

const motion: Concept['motion'] = {
  reveal: {
    label: 'Deal',
    full: [
      { part: 'card-back', at: 0, dur: 400, ease: 'enter', frames: deal(-10, -4), ...pivot },
      ...front({ at: 120, dur: 400, ease: 'enter', frames: deal(10, 4), ...pivot }),
    ],
    calm: [
      { part: 'card-back', at: 0, dur: 400, ease: 'enter', frames: fade },
      ...front({ at: 120, dur: 400, ease: 'enter', frames: fade }),
    ],
  },
  extra: {
    label: 'Reveal letters',
    full: [
      { part: 'card-back', at: 0, dur: 600, ease: 'linear', frames: turn, ...centre },
      { part: 'cut-m', at: 0, dur: 600, ease: 'linear', frames: showAtTurn },
      ...front({ at: 120, dur: 600, ease: 'linear', frames: turn, ...centre }),
      { part: 'cut-f', at: 120, dur: 600, ease: 'linear', frames: showAtTurn },
    ],
    calm: null,
  },
  hover: {
    label: 'Hover',
    full: [
      { part: 'card-back', at: 0, dur: 240, ease: 'move', frames: fan(-1), ...pivot },
      ...front({ at: 0, dur: 240, ease: 'move', frames: fan(1), ...pivot }),
    ],
    calm: [
      { part: 'card-back', at: 0, dur: 240, ease: 'move', frames: fan(-1), ...pivot },
      ...front({ at: 0, dur: 240, ease: 'move', frames: fan(1), ...pivot }),
    ],
  },
  loading: {
    label: 'Loading',
    full: [
      { part: 'card-back', at: 0, dur: 1600, ease: 'linear', frames: breathe(-1.5), ...pivot },
      ...front({ at: 0, dur: 1600, ease: 'linear', frames: breathe(1.5), ...pivot }),
    ],
    calm: front({
      at: 0,
      dur: 1600,
      ease: 'linear',
      frames: [{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }],
    }),
  },
  exit: {
    label: 'Exit',
    full: [
      { part: 'card-back', at: 0, dur: 300, ease: 'exit', frames: out },
      ...front({ at: 0, dur: 300, ease: 'exit', frames: out }),
    ],
    calm: [
      { part: 'card-back', at: 0, dur: 300, ease: 'exit', frames: [{ opacity: 1 }, { opacity: 0 }] },
      ...front({ at: 0, dur: 300, ease: 'exit', frames: [{ opacity: 1 }, { opacity: 0 }] }),
    ],
  },
}

const sharedNotes = [
  'Cards and letters are filled by nature (cut-outs are mask shapes, not strokes); the letters keep the 3.5 monoline as outlines.',
  'The front card is knocked out of the back card with a 1.5-unit gap (3 in the favicon), so the fan reads in one colour.',
  'Front card 12 units to the right instead of 9: at 9 it covers 55 % of the back card and the M reads as an N.',
  'The M’s right stem lies under the front card, behind the F’s stem, which stands in for it.',
  'Letterless fan = favicon and a neutral mark next to the current wordmark.',
]

export const twoCards = makeTwoCards(
  {
    id: '3',
    label: '3',
    scoreKey: 'score-3',
    slug: 'two-cards',
    name: 'Two Cards',
    idea: 'Two fanned cards: an M cut out of the back one, an F out of the front one, sharing the stem where they overlap.',
    notes: sharedNotes,
  },
  fCut,
)

export const twoCardsDynamic = makeTwoCards(
  {
    id: '3b',
    label: '3B',
    scoreKey: 'score-3b',
    slug: 'two-cards-dynamic-f',
    name: 'Two Cards, dynamic F',
    idea: 'Concept 3 with a faster F: arm ends cut at a slant, a short middle arm set a touch high.',
    notes: [
      'Identical to concept 3 (cards, fan, M cut, colours, motion, letterless favicon) except the F cut.',
      `Arm ends cut at concept 8’s angle (${57} across per ${85} down, 56° from horizontal), top corner outermost.`,
      `Top arm to card x ${DYN.top}, middle arm to ${DYN.mid} (visibly shorter), middle arm top at card y ${DYN.midY} instead of 12.75: the F balances the M’s open V and does not sag.`,
      ...sharedNotes.slice(0, 2),
    ],
  },
  fCutDynamic,
)
