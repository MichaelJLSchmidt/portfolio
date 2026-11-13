import { type DrawGroup, Drawing, Label } from './frame'
import { L, M, type Pt, type Space, polar, space } from './geometry'
import type { IllustrationProps } from './types'

export type Squad = { label?: string; size: number }
export type TeamConstellationProps = IllustrationProps & {
  /** Squads around the lead, clockwise from the top; `size` = people in the squad. */
  squads?: readonly Squad[]
  /** Label under the lead node. */
  lead?: string
}

const S = space(640, 640)
const LEAD: Pt = [320, 330]
const ORBIT = 196
const PERSON = 8
const LEAD_R = 12
const HALO = 22
const PITCH = 25

/** Loose, even cluster (sunflower spiral), turned so each squad looks slightly different. */
function members(center: Pt, size: number, turn: number): Pt[] {
  return Array.from({ length: size }, (_, j) =>
    polar(center[0], center[1], PITCH * Math.sqrt(j + 0.5), turn + j * 137.508),
  )
}

/** Point where a link from `from` toward `to` leaves a circle of radius r around `from`. */
function edge(from: Pt, to: Pt, r: number): Pt {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const d = Math.hypot(dx, dy) || 1
  return [from[0] + (dx / d) * r, from[1] + (dy / d) * r]
}

function draw(s: Space, squads: readonly Squad[], lead: string): DrawGroup[] {
  const n = squads.length
  return [
    {
      plate: (
        <>
          <circle cx={LEAD[0]} cy={LEAD[1]} r={HALO} className="il-faint" pathLength="1" data-draw="" />
          <circle cx={LEAD[0]} cy={LEAD[1]} r={LEAD_R} data-draw-fill="" />
          <circle cx={LEAD[0]} cy={LEAD[1]} r={LEAD_R} pathLength="1" data-draw="" />
        </>
      ),
      pins: <Label s={s} at={[LEAD[0], LEAD[1] + HALO]} dy={8} anchor="middle" valign="top" text={lead} cat />,
    },
    ...squads.map((squad, k): DrawGroup => {
      const a = -90 + (k * 360) / n
      const center = polar(LEAD[0], LEAD[1], ORBIT, a)
      const people = members(center, squad.size, a + 180 + k * 40)
      const hull = PITCH * Math.sqrt(Math.max(0, squad.size - 0.5)) + PERSON + 18
      const below = Math.sin((a * Math.PI) / 180) > -0.3
      return {
        plate: (
          <>
            <circle cx={center[0]} cy={center[1]} r={hull} className="il-faint" pathLength="1" data-draw="" />
            {people.map((p, j) => (
              <path
                key={`l${j}`}
                d={M(edge(p, LEAD, PERSON + 3)) + L(edge(LEAD, p, HALO + 4))}
                className="il-faint"
                pathLength="1"
                data-draw=""
              />
            ))}
            {people.map(([x, y], j) => (
              <circle key={`p${j}`} cx={x} cy={y} r={PERSON} pathLength="1" data-draw="" />
            ))}
          </>
        ),
        pins: squad.label ? (
          <Label
            s={s}
            at={[center[0], center[1] + (below ? hull : -hull)]}
            dy={below ? 8 : -8}
            anchor="middle"
            valign={below ? 'top' : 'bottom'}
            text={squad.label}
            cat
            tone="muted"
          />
        ) : undefined,
      }
    }),
  ]
}

/**
 * Team of Teams: people as open nodes in loose clusters (squads) around a lead node, each person
 * linked to the lead by a thin line. No faces, no names. 640×640, one layout (works from 280 px).
 * Groups: 1 the lead, then one per squad (outline, links, people, label).
 */
export function TeamConstellation({
  squads = [
    { label: 'Squad A', size: 4 },
    { label: 'Squad B', size: 3 },
    { label: 'Squad C', size: 5 },
  ],
  lead = 'Lead',
  title = 'Team constellation',
  description,
  ...props
}: TeamConstellationProps) {
  const people = squads.reduce((sum, q) => sum + q.size, 0)
  const desc =
    description ??
    `${people} people in ${squads.length} squads (${squads.map((q) => q.size).join(', ')} people), each person linked to one lead in the middle.`
  return (
    <Drawing slug="team-constellation" title={title} desc={desc} {...props} h={[S, (s) => draw(s, squads, lead)]} />
  )
}
