import { type DrawGroup, Drawing, Label } from './frame'
import { L, M, type Space, chevron, space, spread } from './geometry'
import type { IllustrationProps } from './types'

export type ServiceBlueprintProps = IllustrationProps & {
  /** Swim lanes, top to bottom. The first is the resident; the rest are the back office. */
  lanes?: readonly string[]
  /** Before: the lane each separate touchpoint of the resident reaches, in order. */
  touchpoints?: readonly number[]
  labels?: { before?: string; after?: string }
}

const H = space(1200, 560)
const V = space(360, 780)

type Copy = { lanes: readonly string[]; touchpoints: readonly number[]; before: string; after: string }
type Band = { top: number; pitch: number; left: number; right: number }

const centre = (b: Band, lane: number) => b.top + (lane + 0.5) * b.pitch
const RES = 9 // resident node
const OFF = 6 // back-office node

/** Lane rules (faint) and lane labels for one band of lanes. */
function lanes(s: Space, b: Band, c: Copy, wrap: number): DrawGroup {
  return {
    plate: (
      <>
        {c.lanes.map((_, i) => (
          <path
            key={i}
            d={`M${b.left} ${b.top + i * b.pitch}H${b.right}`}
            className="il-faint"
            pathLength="1"
            data-draw=""
          />
        ))}
        <path
          d={`M${b.left} ${b.top + c.lanes.length * b.pitch}H${b.right}`}
          className="il-faint"
          pathLength="1"
          data-draw=""
        />
      </>
    ),
    pins: c.lanes.map((name, i) => (
      <Label
        key={i}
        s={s}
        at={[b.left, centre(b, i)]}
        valign="middle"
        text={name}
        cat
        wrap={wrap}
        tone={i ? 'muted' : 'text'}
      />
    )),
  }
}

/** Before: one resident node per touchpoint, each with its own line down to an office lane. */
function before(s: Space, b: Band, x0: number, x1: number, c: Copy): DrawGroup {
  const xs = spread(x0, x1, c.touchpoints.length)
  const y = centre(b, 0)
  return {
    plate: (
      <>
        {c.touchpoints.map((lane, i) => {
          const ty = centre(b, lane)
          return (
            <g key={i}>
              <circle cx={xs[i]} cy={y} r={RES} pathLength="1" data-draw="" />
              <path d={`M${xs[i]} ${y + RES + 3}V${ty - OFF - 3}`} pathLength="1" data-draw="" />
              <circle cx={xs[i]} cy={ty} r={OFF} data-draw-fill="" />
              <circle cx={xs[i]} cy={ty} r={OFF} pathLength="1" data-draw="" />
            </g>
          )
        })}
      </>
    ),
    pins: xs.map((x, i) => (
      <Label key={i} s={s} at={[x, y - RES]} dy={-6} anchor="middle" tone="muted" text={String(i + 1)} />
    )),
  }
}

/** After: one entry → the online service → routed down into every other office lane. */
function after(b: Band, x0: number, x1: number, c: Copy): { entry: DrawGroup; route: DrawGroup } {
  const y = centre(b, 0)
  const hub = centre(b, 1)
  const offices = c.lanes.slice(2).map((_, i) => i + 2)
  const drops = spread(x0 + (x1 - x0) * 0.4, x1, offices.length)
  const bend = Math.min(16, b.pitch / 4)
  return {
    entry: {
      plate: (
        <>
          <circle cx={x0} cy={y} r={RES + 7} className="il-faint" pathLength="1" data-draw="" />
          <circle cx={x0} cy={y} r={RES} data-draw-fill="" />
          <circle cx={x0} cy={y} r={RES} pathLength="1" data-draw="" />
          <path d={`M${x0} ${y + RES + 7 + 3}V${hub - OFF - 3}`} pathLength="1" data-draw="" />
          <circle cx={x0} cy={hub} r={OFF} data-draw-fill="" />
          <circle cx={x0} cy={hub} r={OFF} pathLength="1" data-draw="" />
        </>
      ),
    },
    route: {
      plate: (
        <>
          <path d={`M${x0 + OFF + 3} ${hub}H${drops.at(-1)! - bend}`} pathLength="1" data-draw="" />
          {offices.map((lane, i) => {
            const x = drops[i]
            const ty = centre(b, lane)
            return (
              <g key={lane}>
                <path
                  d={`${M([x - bend, hub])}Q${x} ${hub} ${x} ${hub + bend}${L([x, ty - OFF - 3])}`}
                  pathLength="1"
                  data-draw=""
                />
                <path d={chevron([x, ty - OFF - 3], 90, 6)} pathLength="1" data-draw="" />
                <circle cx={x} cy={ty} r={OFF} data-draw-fill="" />
                <circle cx={x} cy={ty} r={OFF} pathLength="1" data-draw="" />
              </g>
            )
          })}
        </>
      ),
    },
  }
}

function horizontal(s: Space, c: Copy): DrawGroup[] {
  const band: Band = { top: 72, pitch: 96, left: 24, right: 1176 }
  const a = after(band, 800, 1120, c)
  const divider = (
    <path d={`M740 32V${band.top + c.lanes.length * band.pitch}`} className="il-faint" pathLength="1" data-draw="" />
  )
  return [
    lanes(s, band, c, 14),
    {
      ...before(s, band, 330, 680, c),
      pins: (
        <>
          <Label s={s} at={[300, 40]} valign="middle" text={c.before} cat tone="muted" />
          {before(s, band, 330, 680, c).pins}
        </>
      ),
    },
    {
      plate: (
        <>
          {divider}
          {a.entry.plate}
        </>
      ),
      pins: <Label s={s} at={[770, 40]} valign="middle" text={c.after} cat tone="muted" />,
    },
    a.route,
  ]
}

function vertical(s: Space, c: Copy): DrawGroup[] {
  const pitch = 62
  const one: Band = { top: 56, pitch, left: 16, right: 344 }
  const two: Band = { top: 56 + c.lanes.length * pitch + 80, pitch, left: 16, right: 344 }
  const a = after(two, 180, 330, c)
  const l1 = lanes(s, one, c, 14)
  const l2 = lanes(s, two, c, 14)
  return [
    {
      plate: (
        <>
          {l1.plate}
          {l2.plate}
        </>
      ),
      pins: (
        <>
          {l1.pins}
          {l2.pins}
        </>
      ),
    },
    {
      ...before(s, one, 180, 330, c),
      pins: (
        <>
          <Label s={s} at={[16, 28]} valign="middle" text={c.before} cat tone="muted" />
          {before(s, one, 180, 330, c).pins}
        </>
      ),
    },
    { ...a.entry, pins: <Label s={s} at={[16, two.top - 28]} valign="middle" text={c.after} cat tone="muted" /> },
    a.route,
  ]
}

/**
 * Front Door / case 3: a service blueprint in swim lanes (resident, online service and the
 * offices behind it). Before: the resident makes separate trips, one line per touchpoint. After:
 * one entry into the online service, routed to every office lane. Horizontal 1200×560 (before |
 * after); vertical 360×780 below 640 px (before above after, lanes repeated). Groups: 1 lanes,
 * 2 before, 3 the entry, 4 the routing.
 */
export function ServiceBlueprint({
  lanes: laneNames = ['Resident', 'Online service', 'Municipality', "Residents' registry", 'Tax administration'],
  touchpoints = [2, 3, 2, 4, 1],
  labels,
  title = 'Service blueprint, before and after',
  description,
  ...props
}: ServiceBlueprintProps) {
  const c: Copy = { lanes: laneNames, touchpoints, before: labels?.before ?? 'Before', after: labels?.after ?? 'After' }
  const [resident, online, ...offices] = laneNames
  const desc =
    description ??
    `Swim lanes for ${laneNames.join(', ')}. Before: the ${resident.toLowerCase()} has ${touchpoints.length} separate touchpoints across the offices. After: one entry through the ${online.toLowerCase()}, routed to ${offices.join(', ')}.`
  return (
    <Drawing
      slug="service-blueprint"
      title={title}
      desc={desc}
      {...props}
      h={[H, (s) => horizontal(s, c)]}
      v={[V, (s) => vertical(s, c)]}
    />
  )
}
