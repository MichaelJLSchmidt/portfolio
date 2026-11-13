import { type DrawGroup, Drawing, Label } from './frame'
import { type Pt, type Space, monotone, space, spread } from './geometry'
import type { IllustrationProps } from './types'

export type JourneyEmotionCurveProps = IllustrationProps & {
  /** Steps of the journey, in order. */
  steps?: readonly string[]
  /** How each step feels, from -2 (worst) to +2 (best); one per step. */
  scores?: readonly number[]
}

const H = space(960, 360)
const V = space(360, 640)
const NODE = 5
const LOW = 8

type Data = { steps: readonly string[]; scores: readonly number[]; low: number }

function horizontal(s: Space, d: Data): DrawGroup[] {
  const xs = spread(104, 896, d.steps.length)
  const zero = 148
  const unit = 44
  const axis = 272
  const pts: Pt[] = d.scores.map((v, i) => [xs[i], zero - v * unit])
  const low = pts[d.low]
  return [
    {
      plate: (
        <>
          <path d={`M72 ${zero}H928`} className="il-faint" pathLength="1" data-draw="" />
          <path d={`M72 ${axis}H928`} className="il-faint" pathLength="1" data-draw="" />
          {xs.map((x, i) => (
            <path key={i} d={`M${x} ${axis - 5}V${axis + 5}`} pathLength="1" data-draw="" />
          ))}
        </>
      ),
      pins: (
        <>
          <Label s={s} at={[48, zero - 2 * unit]} anchor="middle" valign="middle" tone="muted" text="+" />
          <Label s={s} at={[48, zero]} anchor="middle" valign="middle" tone="muted" text="0" />
          <Label s={s} at={[48, zero + 2 * unit]} anchor="middle" valign="middle" tone="muted" text="−" />
          {d.steps.map((step, i) => (
            <Label
              key={i}
              s={s}
              at={[xs[i], axis]}
              dy={12}
              anchor="middle"
              valign="top"
              tone={i === d.low ? 'text' : 'muted'}
              wrap={8}
              text={step}
            />
          ))}
        </>
      ),
    },
    { plate: <path d={monotone(pts)} pathLength="1" data-draw="" /> },
    {
      plate: (
        <>
          {pts.map(([x, y], i) =>
            i === d.low ? null : <circle key={i} cx={x} cy={y} r={NODE} pathLength="1" data-draw="" />,
          )}
        </>
      ),
    },
    {
      plate: (
        <>
          <path d={`M${low[0]} ${low[1] + LOW + 8}V${axis - 9}`} className="il-faint" pathLength="1" data-draw="" />
          <circle cx={low[0]} cy={low[1]} r={LOW} data-draw-fill="" />
          <circle cx={low[0]} cy={low[1]} r={LOW} pathLength="1" data-draw="" />
          <circle cx={low[0]} cy={low[1]} r={LOW + 6} className="il-faint" pathLength="1" data-draw="" />
        </>
      ),
    },
  ]
}

function vertical(s: Space, d: Data): DrawGroup[] {
  const ys = spread(76, 604, d.steps.length)
  const zero = 256
  const unit = 38
  const axis = 168
  const pts: Pt[] = d.scores.map((v, i) => [zero + v * unit, ys[i]])
  const low = pts[d.low]
  return [
    {
      plate: (
        <>
          <path d={`M${zero} 48V620`} className="il-faint" pathLength="1" data-draw="" />
          <path d={`M${axis} 48V620`} className="il-faint" pathLength="1" data-draw="" />
          {ys.map((y, i) => (
            <path key={i} d={`M${axis - 5} ${y}H${axis + 5}`} pathLength="1" data-draw="" />
          ))}
        </>
      ),
      pins: (
        <>
          <Label s={s} at={[zero - 2 * unit, 32]} anchor="middle" valign="middle" tone="muted" text="−" />
          <Label s={s} at={[zero, 32]} anchor="middle" valign="middle" tone="muted" text="0" />
          <Label s={s} at={[zero + 2 * unit, 32]} anchor="middle" valign="middle" tone="muted" text="+" />
          {d.steps.map((step, i) => (
            <Label
              key={i}
              s={s}
              at={[16, ys[i]]}
              valign="middle"
              tone={i === d.low ? 'text' : 'muted'}
              wrap={14}
              text={step}
            />
          ))}
        </>
      ),
    },
    { plate: <path d={monotone(pts, 1)} pathLength="1" data-draw="" /> },
    {
      plate: (
        <>
          {pts.map(([x, y], i) =>
            i === d.low ? null : <circle key={i} cx={x} cy={y} r={NODE} pathLength="1" data-draw="" />,
          )}
        </>
      ),
    },
    {
      plate: (
        <>
          <path d={`M${low[0] - LOW - 8} ${low[1]}H${axis + 9}`} className="il-faint" pathLength="1" data-draw="" />
          <circle cx={low[0]} cy={low[1]} r={LOW} data-draw-fill="" />
          <circle cx={low[0]} cy={low[1]} r={LOW} pathLength="1" data-draw="" />
          <circle cx={low[0]} cy={low[1]} r={LOW + 6} className="il-faint" pathLength="1" data-draw="" />
        </>
      ),
    },
  ]
}

/**
 * Front Door / case 3: how a resident feels at each step of the journey, as a curve over the
 * steps (above the zero line is good, below is bad), with its clear low point ringed. Horizontal
 * 960×360; vertical 360×640 below 640 px (steps down, feeling across). Groups: 1 axes and step
 * labels, 2 the curve, 3 the step nodes, 4 the low point.
 */
export function JourneyEmotionCurve({
  steps = [
    'Decide to move',
    'Find a flat',
    'Give notice',
    'Move',
    'Register',
    'Tell tax office',
    'Update records',
    'Settled',
  ],
  scores = [0.7, 0.2, -0.3, 0.6, -0.2, -1.8, 0.1, 1],
  title = 'Journey emotion curve',
  description,
  ...props
}: JourneyEmotionCurveProps) {
  const values = steps.map((_, i) => Math.max(-2, Math.min(2, scores[i] ?? 0)))
  const low = values.indexOf(Math.min(...values))
  const d: Data = { steps, scores: values, low }
  const desc =
    description ??
    `How a resident feels across ${steps.length} steps, from ${steps[0]} to ${steps.at(-1)}. The curve dips to its lowest point at "${steps[low]}" and recovers after it.`
  return (
    <Drawing
      slug="journey-emotion-curve"
      title={title}
      desc={desc}
      {...props}
      h={[H, (s) => horizontal(s, d)]}
      v={[V, (s) => vertical(s, d)]}
    />
  )
}
