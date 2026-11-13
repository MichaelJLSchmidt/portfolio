import type { ThesisDrawing } from '@/lib/content'
import { type DrawGroup, Drawing, Label } from '../frame'
import { poly, roundRect, space, spread, type Space, wrap } from '../geometry'
import type { IllustrationProps } from '../types'
import { CardShape } from './parts'

type Key = 'causes' | 'symptoms' | 'signal' | 'dialogue' | 'hr' | 'intervention' | 'gap' | 'only'
export type BurnoutProcessProps = IllustrationProps & { copy: ThesisDrawing<Key> }

const H = space(960, 330)
const V = space(360, 760)
const stages = ['causes', 'symptoms', 'signal', 'dialogue', 'hr', 'intervention'] as const
const SIGNAL = 2
const R = 9

/** A stage on the line: a dot, or the data signal as a tinted card. */
function Stage({ x, y, signal }: { x: number; y: number; signal: boolean }) {
  return signal ? <CardShape x={x} y={y} w={30} tint /> : <circle cx={x} cy={y} r={R} pathLength={1} data-draw="" />
}

/** The data gap: a faint tinted band along the line before the signal. */
function Gap({ d }: { d: string }) {
  return <path d={d} stroke="none" fill="currentColor" data-draw-fill="" />
}

function horizontal(s: Space, l: Record<Key, string>): DrawGroup[] {
  const y = 176
  const xs = spread(96, 864, stages.length)
  return [
    {
      plate: (
        <>
          <path
            d={poly([
              [56, y],
              [904, y],
            ])}
            className="il-faint"
            pathLength={1}
            data-draw=""
          />
          <Gap d={roundRect(xs[0] - 24, y - 14, xs[SIGNAL] - 24 - (xs[0] - 24), 28, 14)} />
        </>
      ),
      pins: (
        <Label
          s={s}
          at={[(xs[0] + xs[SIGNAL] - 24) / 2, y + 26]}
          anchor="middle"
          valign="top"
          tone="muted"
          cat
          text={l.gap}
        />
      ),
    },
    ...stages.map((key, i) => ({
      plate: <Stage x={xs[i]} y={y} signal={i === SIGNAL} />,
      pins: (
        <>
          <Label s={s} at={[xs[i], y - 28]} anchor="middle" valign="bottom" wrap={12} text={l[key]} />
          {i === SIGNAL && (
            <Label s={s} at={[xs[i], y + 30]} anchor="middle" valign="top" tone="accent" wrap={14} text={l.only} />
          )}
        </>
      ),
    })),
  ]
}

function vertical(s: Space, l: Record<Key, string>): DrawGroup[] {
  const x = 64
  const ys = spread(72, 688, stages.length)
  return [
    {
      plate: (
        <>
          <path
            d={poly([
              [x, 32],
              [x, 728],
            ])}
            className="il-faint"
            pathLength={1}
            data-draw=""
          />
          <Gap d={roundRect(x - 14, ys[0] - 24, 28, ys[SIGNAL] - 32 - (ys[0] - 24), 14)} />
        </>
      ),
      pins: <Label s={s} at={[x + 28, (ys[0] + ys[1]) / 2]} valign="middle" tone="muted" cat text={l.gap} />,
    },
    ...stages.map((key, i) => {
      const lines = wrap(l[key], 24)
      const text = i === SIGNAL ? [...lines, ...wrap(l.only, 24)] : lines
      const tones = text.map((_, k) => (k >= lines.length ? 'accent' : undefined)) as ('accent' | undefined)[]
      return {
        plate: <Stage x={x} y={ys[i]} signal={i === SIGNAL} />,
        pins: <Label s={s} at={[x + 28, ys[i]]} valign="middle" text={text} tones={tones} />,
      }
    }),
  ]
}

/**
 * (b) The burnout process as an HR expert mapped it: causes, first symptoms, more single-day sick
 * leave (the only data signal), the manager seeks dialogue, then HR, then an intervention. Before
 * the signal there is no data: a tinted gap along the line.
 */
export function BurnoutProcess({ copy, className, titleId, variant }: BurnoutProcessProps) {
  return (
    <Drawing
      slug="burnout-process"
      title={copy.title}
      desc={copy.description}
      className={className}
      titleId={titleId}
      variant={variant}
      h={[H, (s) => horizontal(s, copy.labels)]}
      v={[V, (s) => vertical(s, copy.labels)]}
    />
  )
}
