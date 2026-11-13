import { type DrawGroup, Drawing, Label, Pin, Text } from './frame'
import { L, M, type Space, arc, polar, radialAlign, space } from './geometry'
import type { IllustrationProps } from './types'

export type Ritual = {
  label: string
  /** Weekday indexes (0 = first day of `days`). */
  days: readonly number[]
  /** Position within the day, 0..1 (morning to evening). */
  at?: number
}

export type WeekRingProps = IllustrationProps & {
  days?: readonly string[]
  /** Weekly rituals: a tick and a label outside the ring. */
  rituals?: readonly Ritual[]
  /** The daily ritual, marked inside the ring and named in the middle; empty string hides it. */
  daily?: string
  /** Second line under the daily ritual. */
  dailyNote?: string
}

const S = space(560, 560)
const CX = 280
const CY = 280
const OUT = 168
const IN = 112
const GAP = 1.6 // degrees between day segments, each side

function sector(a0: number, a1: number) {
  return `${arc(CX, CY, OUT, a0, a1)}${L(polar(CX, CY, IN, a1))}${arc(CX, CY, IN, a1, a0).replace(/^M[^A]+/, '')}Z`
}

function draw(s: Space, days: readonly string[], rituals: readonly Ritual[], daily: string, note: string): DrawGroup[] {
  const n = days.length
  const span = 360 / n
  const angle = (day: number, at: number) => -90 + (day + at) * span
  const mid = (IN + OUT) / 2
  return [
    {
      plate: (
        <>
          {days.map((_, d) => (
            <path key={d} d={sector(angle(d, 0) + GAP, angle(d, 1) - GAP)} pathLength="1" data-draw="" />
          ))}
        </>
      ),
      pins: days.map((day, d) => (
        <Label key={d} s={s} at={polar(CX, CY, mid, angle(d, 0.5))} anchor="middle" valign="middle" text={day} cat />
      )),
    },
    ...(daily
      ? [
          {
            plate: (
              <>
                {days.map((_, d) => {
                  const a = angle(d, 0.12)
                  return (
                    <path
                      key={d}
                      d={M(polar(CX, CY, IN - 6, a)) + L(polar(CX, CY, IN - 18, a))}
                      pathLength="1"
                      data-draw=""
                    />
                  )
                })}
              </>
            ),
            pins: (
              <Pin s={s} at={[CX, CY]}>
                <Text text={daily} anchor="middle" dy={-2} valign="bottom" cat />
                {note && <Text text={note} anchor="middle" dy={8} valign="top" tone="muted" cat />}
              </Pin>
            ),
          } satisfies DrawGroup,
        ]
      : []),
    ...rituals.map((ritual): DrawGroup => ({
      plate: (
        <>
          {ritual.days.map((d) => {
            const a = angle(d, ritual.at ?? 0.5)
            const tip = polar(CX, CY, OUT + 26, a)
            const [x, y] = tip
            return (
              <g key={d}>
                <path d={M(polar(CX, CY, OUT + 6, a)) + L(tip)} pathLength="1" data-draw="" />
                <circle cx={x} cy={y} r={3} pathLength="1" data-draw="" />
              </g>
            )
          })}
        </>
      ),
      pins: ritual.days.map((d) => {
        const a = angle(d, ritual.at ?? 0.5)
        return (
          <Label
            key={d}
            s={s}
            at={polar(CX, CY, OUT + 29, a)}
            {...radialAlign(a, 8)}
            text={ritual.label}
            cat
            tone="muted"
          />
        )
      }),
    })),
  ]
}

/**
 * Management: a week as a ring of weekdays (clockwise from the top). Weekly rituals are ticks
 * outside the ring with short labels; the daily ritual is a tick inside every day and is named in
 * the middle. 560×560, one layout (works from 280 px). Groups: 1 the days, 2 the daily ritual,
 * then one per weekly ritual.
 */
export function WeekRing({
  days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  rituals = [
    { label: 'Planning', days: [0], at: 0.3 },
    { label: '1:1s', days: [1, 3], at: 0.5 },
    { label: 'Critique', days: [2], at: 0.5 },
    { label: 'Demo', days: [4], at: 0.7 },
  ],
  daily = 'Stand-up',
  dailyNote = 'Daily',
  title = 'A week of rituals',
  description,
  ...props
}: WeekRingProps) {
  const weekly = rituals.map((r) => `${r.label} (${r.days.map((d) => days[d]).join(', ')})`).join(', ')
  const desc =
    description ??
    `A week from ${days[0]} to ${days.at(-1)} drawn as a ring.${daily ? ` ${daily} happens every day;` : ''} weekly rituals: ${weekly}.`
  return (
    <Drawing
      slug="week-ring"
      title={title}
      desc={desc}
      {...props}
      h={[S, (s) => draw(s, days, rituals, daily, dailyNote)]}
    />
  )
}
