import { type DrawGroup, Drawing, Label, Pin, Text } from './frame'
import { type Space, roundRect, space, textWidth } from './geometry'
import type { IllustrationProps } from './types'

export type AdoptionBarsProps = IllustrationProps & {
  /** Number of teams (bars). */
  teams?: number
  /** Teams on the platform (tinted bars, drawn first). */
  adopted?: number
  labels?: { adopted?: string; notYet?: string }
}

const H = space(960, 400)
const V = space(360, 380)

type Copy = { teams: number; adopted: number; yes: string; no: string }

/** Key in px: a tinted bar for adopted, an open one for not yet. */
function Key({ yes, no }: { yes: string; no: string }) {
  const second = 18 + textWidth(yes, true) + 22
  const swatch = (x: number, on: boolean) => (
    <>
      {on && <path d={roundRect(x, -7, 8, 14, 2)} data-draw-fill="" />}
      <path d={roundRect(x, -7, 8, 14, 2)} className={on ? undefined : 'il-faint'} pathLength="1" data-draw="" />
    </>
  )
  return (
    <>
      {swatch(0, true)}
      <Text text={yes} dx={18} valign="middle" cat tone="muted" />
      {swatch(second, false)}
      <Text text={no} dx={second + 18} valign="middle" cat tone="muted" />
    </>
  )
}

function draw(s: Space, key: 'h' | 'v', c: Copy): DrawGroup[] {
  // Wide: key left and figure right on one row. Narrow: figure, then key, on rows of their own.
  const m =
    key === 'h'
      ? {
          x0: 40,
          x1: 920,
          top: 104,
          base: 320,
          key: 44,
          figure: [920, 44] as const,
          anchor: 'end' as const,
          gap: 0.34,
          r: 6,
        }
      : {
          x0: 24,
          x1: 336,
          top: 112,
          base: 316,
          key: 76,
          figure: [24, 32] as const,
          anchor: 'start' as const,
          gap: 0.3,
          r: 4,
        }
  const slot = (m.x1 - m.x0) / c.teams
  const bw = slot * (1 - m.gap)
  const bars = Array.from({ length: c.teams }, (_, i) => ({
    i,
    x: m.x0 + i * slot + (slot - bw) / 2,
    on: i < c.adopted,
  }))
  const bar = (x: number) => roundRect(x, m.top, bw, m.base - 10 - m.top, m.r)
  const every = key === 'v' && c.teams > 8 ? 2 : 1
  return [
    {
      plate: <path d={`M${m.x0} ${m.base}H${m.x1}`} className="il-faint" pathLength="1" data-draw="" />,
      pins: (
        <>
          <Pin s={s} at={[m.x0, m.key]}>
            <Key yes={c.yes} no={c.no} />
          </Pin>
          <Label
            s={s}
            at={[...m.figure]}
            anchor={m.anchor}
            valign="middle"
            figure
            tone="accent"
            text={`${c.adopted} / ${c.teams}`}
          />
          {bars.map(({ i, x }) =>
            i % every === 0 ? (
              <Label
                key={i}
                s={s}
                at={[x + bw / 2, m.base]}
                dy={10}
                anchor="middle"
                valign="top"
                tone="muted"
                text={String(i + 1).padStart(2, '0')}
              />
            ) : null,
          )}
        </>
      ),
    },
    {
      plate: (
        <>
          {bars
            .filter((b) => b.on)
            .map(({ i, x }) => (
              <g key={i}>
                <path d={bar(x)} data-draw-fill="" />
                <path d={bar(x)} pathLength="1" data-draw="" />
              </g>
            ))}
        </>
      ),
    },
    {
      plate: (
        <>
          {bars
            .filter((b) => !b.on)
            .map(({ i, x }) => (
              <path key={i} d={bar(x)} className="il-faint" pathLength="1" data-draw="" />
            ))}
        </>
      ),
    },
  ]
}

/**
 * Shared Foundations / case 2: platform adoption by team. One bar per team: tinted bars have
 * adopted, faint open bars not yet; the key figure reads "9 / 12". Horizontal 960×400; vertical 360×380
 * below 640 px. Groups: 1 baseline, key, figure and team numbers, 2 adopted bars, 3 the rest.
 */
export function AdoptionBars({
  teams = 12,
  adopted = 9,
  labels,
  title = 'Platform adoption by team',
  description,
  ...props
}: AdoptionBarsProps) {
  const c: Copy = {
    teams,
    adopted: Math.min(adopted, teams),
    yes: labels?.adopted ?? 'Adopted',
    no: labels?.notYet ?? 'Not yet',
  }
  const desc =
    description ??
    `${c.adopted} of ${teams} teams have adopted the platform; ${teams - c.adopted} have not yet. One bar per team.`
  return (
    <Drawing
      slug="adoption-bars"
      title={title}
      desc={desc}
      {...props}
      h={[H, (s, k) => draw(s, k, c)]}
      v={[V, (s, k) => draw(s, k, c)]}
    />
  )
}
