import { type DrawGroup, Drawing, Label } from './frame'
import { C, L, M, type Pt, type Space, chevron, roundRect, smooth, space, spread } from './geometry'
import type { IllustrationProps } from './types'

export type IntakeBeforeAfterProps = IllustrationProps & {
  /** The offers the front door routes into, top to bottom. */
  offers?: readonly string[]
  /** How many request sources to draw on each side. */
  sources?: number
  labels?: { before?: string; after?: string; team?: string; frontDoor?: string }
}

const H = space(960, 480)
const V = space(360, 760)

type Rect = { x: number; y: number; w: number; h: number }
type Copy = {
  offers: readonly string[]
  sources: number
  before: string
  after: string
  team: string
  frontDoor: string
}

/** Normalized point (u, v in 0..1) inside a panel. */
const at = (r: Rect, u: number, v: number): Pt => [r.x + u * r.w, r.y + v * r.h]

/** Request sources: small open nodes down the left edge of a panel. */
function sourcePoints(r: Rect, n: number): Pt[] {
  return spread(0.04, 0.96, n).map((v) => at(r, 0.02, v))
}

/*
 * Tangled requests (before): each line runs from a source to the team card through waypoints
 * (normalized to the panel), crossing the others; one loops back on itself.
 */
const tangle: { from: number; via: [number, number][]; to: number }[] = [
  {
    from: 0,
    via: [
      [0.22, 0.32],
      [0.42, 0.1],
      [0.6, 0.62],
    ],
    to: 0.62,
  },
  {
    from: 1,
    via: [
      [0.2, 0.06],
      [0.44, 0.5],
      [0.6, 0.24],
    ],
    to: 0.4,
  },
  {
    from: 2,
    via: [
      [0.24, 0.7],
      [0.4, 0.86],
      [0.56, 0.36],
    ],
    to: 0.36,
  },
  {
    from: 3,
    via: [
      [0.2, 0.42],
      [0.36, 0.24],
      [0.5, 0.56],
      [0.56, 0.48],
      [0.5, 0.42],
      [0.46, 0.5],
      [0.6, 0.6],
    ],
    to: 0.52,
  },
  {
    from: 4,
    via: [
      [0.24, 0.96],
      [0.46, 0.64],
      [0.62, 0.86],
    ],
    to: 0.66,
  },
  {
    from: 5,
    via: [
      [0.3, 0.78],
      [0.44, 0.98],
      [0.64, 0.72],
    ],
    to: 0.57,
  },
  {
    from: 2,
    via: [
      [0.16, 0.28],
      [0.32, 0.6],
      [0.5, 0.2],
    ],
    to: 0.46,
  },
  {
    from: 4,
    via: [
      [0.18, 0.56],
      [0.34, 0.16],
      [0.54, 0.08],
    ],
    to: 0.34,
  },
]

function panels(s: Space, key: 'h' | 'v') {
  return key === 'h'
    ? {
        before: { x: 40, y: 104, w: 400, h: 336 },
        after: { x: 520, y: 104, w: 400, h: 336 },
        titles: [
          [40, 52],
          [520, 52],
        ] as Pt[],
        divider: `M480 40V440`,
        card: 84,
        box: 44,
      }
    : {
        before: { x: 24, y: 76, w: 312, h: 280 },
        after: { x: 24, y: 464, w: 312, h: 268 },
        titles: [
          [24, 36],
          [24, 424],
        ] as Pt[],
        divider: `M24 ${s.h / 2 + 8}H336`,
        card: 66,
        box: 40,
      }
}

function draw(s: Space, key: 'h' | 'v', c: Copy): DrawGroup[] {
  const p = panels(s, key)
  const b = p.before
  const a = p.after

  // Before: sources, tangled lines into one team card.
  const srcB = sourcePoints(b, c.sources)
  const cw = p.card
  const ch = cw * 1.38
  const team = at(b, 0.86, 0.5)
  const edge = team[0] - cw / 2
  const lines = tangle
    .filter((t) => t.from < c.sources)
    .map((t) => {
      const ty = team[1] + (t.to - 0.5) * ch
      const [sx, sy] = srcB[t.from]
      const pts: Pt[] = [[sx + 9, sy], ...t.via.map(([u, v]) => at(b, u, v)), [edge, ty]]
      return smooth(pts)
    })

  // After: sources converge on one front door, which routes into the offers.
  const srcA = sourcePoints(a, c.sources)
  const door = at(a, 0.42, 0.5)
  const dw = key === 'h' ? 26 : 22
  const dh = dw * 2.1
  const doorIn: Pt = [door[0] - dw / 2, door[1]]
  const doorOut: Pt = [door[0] + dw / 2, door[1]]
  // The fan runs straight for the last `run` units, so nothing crosses the label under the door.
  const run = key === 'h' ? 84 : 64
  const fan = srcA.map(([x, y], i) => {
    const end: Pt = [doorIn[0], door[1] + (i - (c.sources - 1) / 2) * (dh / (c.sources + 1))]
    const start: Pt = [x + 9, y]
    const bend: Pt = [end[0] - run, end[1]]
    const mid = (start[0] + bend[0]) / 2
    return M(start) + C([mid, y], [mid, end[1]], bend) + L(end)
  })
  // One trunk out of the door, then a branch per offer.
  const trunk: Pt = [doorOut[0] + run * 0.6, door[1]]
  const boxX = a.x + a.w * 0.62
  const boxW = a.x + a.w - boxX
  const ys = spread(a.y + a.h * 0.16, a.y + a.h * 0.84, c.offers.length)
  const branches = ys.map((y) => {
    const end: Pt = [boxX - 3, y]
    const mid = (trunk[0] + end[0]) / 2
    return { d: M(trunk) + C([mid, door[1]], [mid, y], end), tip: end }
  })

  return [
    {
      plate: (
        <>
          <path d={p.divider} className="il-faint" pathLength="1" data-draw="" />
          {srcB.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6} pathLength="1" data-draw="" />
          ))}
        </>
      ),
      pins: <Label s={s} at={p.titles[0]} text={c.before} cat tone="muted" valign="middle" />,
    },
    {
      plate: (
        <>
          {lines.map((d, i) => (
            <path key={i} d={d} pathLength="1" data-draw="" />
          ))}
          <path d={roundRect(team[0] - cw / 2, team[1] - ch / 2, cw, ch, 7)} data-draw-fill="" />
          <path d={roundRect(team[0] - cw / 2, team[1] - ch / 2, cw, ch, 7)} pathLength="1" data-draw="" />
        </>
      ),
      pins: <Label s={s} at={team} text={c.team} cat anchor="middle" valign="middle" />,
    },
    {
      plate: (
        <>
          {srcA.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6} pathLength="1" data-draw="" />
          ))}
          {fan.map((d, i) => (
            <path key={i} d={d} pathLength="1" data-draw="" />
          ))}
          <path d={roundRect(door[0] - dw / 2, door[1] - dh / 2, dw, dh, 3)} data-draw-fill="" />
          <path d={roundRect(door[0] - dw / 2, door[1] - dh / 2, dw, dh, 3)} pathLength="1" data-draw="" />
          <circle cx={door[0] + dw / 2 - 7} cy={door[1] + 2} r={2} pathLength="1" data-draw="" />
        </>
      ),
      pins: (
        <>
          <Label s={s} at={p.titles[1]} text={c.after} cat tone="muted" valign="middle" />
          <Label s={s} at={[door[0], door[1] + dh / 2]} dy={10} text={c.frontDoor} cat anchor="middle" valign="top" />
        </>
      ),
    },
    {
      plate: (
        <>
          <path d={M(doorOut) + L(trunk)} pathLength="1" data-draw="" />
          {branches.map(({ d, tip }, i) => (
            <g key={i}>
              <path d={d} pathLength="1" data-draw="" />
              <path d={chevron(tip, 0, 7)} pathLength="1" data-draw="" />
            </g>
          ))}
          {ys.map((y, i) => (
            <path key={i} d={roundRect(boxX, y - p.box / 2, boxW, p.box, 6)} pathLength="1" data-draw="" />
          ))}
        </>
      ),
      pins: ys.map((y, i) => (
        <Label key={i} s={s} at={[boxX + boxW / 2, y]} text={c.offers[i]} cat anchor="middle" valign="middle" />
      )),
    },
  ]
}

/**
 * Front Door / case 1: how requests reached the team. Before: requests from many sources tangle
 * into the team. After: every source goes through one front door that routes into three offers.
 * Horizontal 960×480 (side by side); vertical 360×760 below 640 px (before above after).
 * Groups: 1 before sources, 2 tangle + team, 3 after sources + front door, 4 offers.
 */
export function IntakeBeforeAfter({
  offers = ['Check-up', 'Sprint', 'Embedded'],
  sources = 6,
  labels,
  title = 'Intake before and after',
  description,
  ...props
}: IntakeBeforeAfterProps) {
  const c: Copy = {
    offers,
    sources: Math.max(2, Math.min(sources, 8)),
    before: labels?.before ?? 'Before',
    after: labels?.after ?? 'After',
    team: labels?.team ?? 'Team',
    frontDoor: labels?.frontDoor ?? 'Front door',
  }
  const desc =
    description ??
    `Before: requests from ${c.sources} sources reach the team as tangled, crossing lines. After: every request goes through one front door, which routes it into ${offers.length} offers: ${offers.join(', ')}.`
  return (
    <Drawing
      slug="intake-before-after"
      title={title}
      desc={desc}
      {...props}
      h={[H, (s, k) => draw(s, k, c)]}
      v={[V, (s, k) => draw(s, k, c)]}
    />
  )
}
