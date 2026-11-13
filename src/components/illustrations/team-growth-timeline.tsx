import { type DrawGroup, Drawing, Label, Pin, Text } from './frame'
import { space, spread, textWidth, type Space } from './geometry'
import type { IllustrationProps } from './types'

export type TeamGrowthPoint = { year: string | number; headcount: number }
export type TeamGrowthTimelineProps = IllustrationProps & {
  /** Headcount per year, in order. A year whose headcount rose gets a hire node. */
  data?: readonly TeamGrowthPoint[]
  /** Key labels. */
  labels?: { team?: string; joined?: string }
}

const defaults: TeamGrowthPoint[] = [
  { year: 2021, headcount: 2 },
  { year: 2022, headcount: 3 },
  { year: 2023, headcount: 3 },
  { year: 2024, headcount: 4 },
  { year: 2025, headcount: 5 },
]

const H = space(960, 360)
const V = space(360, 480)
const R = 9 // person dot
const NODE = 7 // hire node on the axis

type Data = { data: readonly TeamGrowthPoint[]; hires: number[]; labels: { team: string; joined: string } }

/** The key: an open dot for the team, a tinted dot for people who joined that year. */
function Key({ s, at, labels }: { s: Space; at: readonly [number, number]; labels: Data['labels'] }) {
  const second = 16 + textWidth(labels.team, true) + 20
  return (
    <Pin s={s} at={at}>
      <circle cx={4.5} cy={0} r={4.5} pathLength="1" data-draw="" />
      <Text text={labels.team} dx={16} valign="middle" tone="muted" cat />
      <circle cx={second + 4.5} cy={0} r={4.5} data-draw-fill="" />
      <circle cx={second + 4.5} cy={0} r={4.5} pathLength="1" data-draw="" />
      <circle cx={second + 4.5} cy={0} r={1.5} pathLength="1" data-draw="" />
      <Text text={labels.joined} dx={second + 16} valign="middle" tone="muted" cat />
    </Pin>
  )
}

/** One person: an open dot; tinted with a centre point when they joined that year. */
function Person({ x, y, joined }: { x: number; y: number; joined: boolean }) {
  return (
    <>
      {joined && <circle cx={x} cy={y} r={R} data-draw-fill="" />}
      <circle cx={x} cy={y} r={R} pathLength="1" data-draw="" />
      {joined && <circle cx={x} cy={y} r={R / 3} pathLength="1" data-draw="" />}
    </>
  )
}

/** On the axis: a tinted node where someone joined, a short tick otherwise. */
function AxisMark({ x, y, hire, vertical }: { x: number; y: number; hire: boolean; vertical?: boolean }) {
  if (hire)
    return (
      <>
        <circle cx={x} cy={y} r={NODE} data-draw-fill="" />
        <circle cx={x} cy={y} r={NODE} pathLength="1" data-draw="" />
        <circle cx={x} cy={y} r={NODE / 3} pathLength="1" data-draw="" />
      </>
    )
  return vertical ? (
    <line x1={x - 6} y1={y} x2={x + 6} y2={y} pathLength="1" data-draw="" />
  ) : (
    <line x1={x} y1={y - 6} x2={x} y2={y + 6} pathLength="1" data-draw="" />
  )
}

/** Horizontal: years along a baseline, a column of people above each year. */
function horizontal(s: Space, { data, hires, labels }: Data): DrawGroup[] {
  const axis = 288
  const xs = spread(144, 816, data.length)
  const most = Math.max(...data.map((d) => d.headcount))
  const pitch = Math.min(30, (axis - 40 - 96) / Math.max(1, most - 1))
  return [
    {
      plate: <line x1={72} y1={axis} x2={888} y2={axis} className="il-faint" pathLength="1" data-draw="" />,
      pins: <Key s={s} at={[72, 44]} labels={labels} />,
    },
    ...data.map((d, i) => {
      const x = xs[i]
      const ys = Array.from({ length: d.headcount }, (_, k) => axis - 40 - k * pitch)
      const top = ys.at(-1) ?? axis
      return {
        plate: (
          <>
            <AxisMark x={x} y={axis} hire={hires[i] > 0} />
            {ys.map((y, k) => (
              <Person key={k} x={x} y={y} joined={k >= d.headcount - hires[i]} />
            ))}
          </>
        ),
        pins: (
          <>
            <Label
              s={s}
              at={[x, axis + NODE]}
              dy={10}
              valign="top"
              anchor="middle"
              tone="muted"
              text={String(d.year)}
            />
            <Label s={s} at={[x, top - R - 4]} dy={-6} anchor="middle" tone="accent" text={String(d.headcount)} />
          </>
        ),
      }
    }),
  ]
}

/** Vertical: years down a line, a row of people to the right of each year. */
function vertical(s: Space, { data, hires, labels }: Data): DrawGroup[] {
  const axis = 96
  const ys = spread(112, 432, data.length)
  const most = Math.max(...data.map((d) => d.headcount))
  const pitch = Math.min(28, (300 - 132) / Math.max(1, most - 1))
  return [
    {
      plate: <line x1={axis} y1={80} x2={axis} y2={464} className="il-faint" pathLength="1" data-draw="" />,
      pins: <Key s={s} at={[24, 36]} labels={labels} />,
    },
    ...data.map((d, i) => {
      const y = ys[i]
      const xs = Array.from({ length: d.headcount }, (_, k) => 132 + k * pitch)
      const last = xs.at(-1) ?? axis
      return {
        plate: (
          <>
            <AxisMark x={axis} y={y} hire={hires[i] > 0} vertical />
            {xs.map((x, k) => (
              <Person key={k} x={x} y={y} joined={k >= d.headcount - hires[i]} />
            ))}
          </>
        ),
        pins: (
          <>
            <Label s={s} at={[24, y]} valign="middle" tone="muted" text={String(d.year)} />
            <Label s={s} at={[last + R + 4, y]} dx={6} valign="middle" tone="accent" text={String(d.headcount)} />
          </>
        ),
      }
    }),
  ]
}

/**
 * Team of Teams: headcount per year on a timeline. Each year shows a column of people (open
 * dots); people who joined that year are tinted and the year gets a hire node on the axis.
 * Horizontal 960×360; vertical 360×480 below 640 px (`variant`). Groups: 1 axis + key, then one
 * per year, left to right.
 */
export function TeamGrowthTimeline({
  data = defaults,
  labels,
  title = 'Team growth',
  description,
  ...props
}: TeamGrowthTimelineProps) {
  const hires = data.map((d, i) => (i ? Math.max(0, d.headcount - data[i - 1].headcount) : 0))
  const first = data[0]
  const last = data.at(-1) ?? first
  const hireYears = data.filter((_, i) => hires[i] > 0).map((d) => d.year)
  const desc =
    description ??
    `Team grew from ${first.headcount} to ${last.headcount} people between ${first.year} and ${last.year}, with one hire node per year in which someone joined (${hireYears.join(', ')}).`
  const d: Data = { data, hires, labels: { team: labels?.team ?? 'Team', joined: labels?.joined ?? 'Joined' } }
  return (
    <Drawing
      slug="team-growth-timeline"
      title={title}
      desc={desc}
      {...props}
      h={[H, (s) => horizontal(s, d)]}
      v={[V, (s) => vertical(s, d)]}
    />
  )
}
