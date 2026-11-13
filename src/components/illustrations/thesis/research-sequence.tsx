import type { ThesisDrawing } from '@/lib/content'
import { type DrawGroup, Drawing, Label } from '../frame'
import { C, M, type Pt, space, spread, type Space } from '../geometry'
import type { IllustrationProps } from '../types'
import { Arrow, CardShape } from './parts'

type Labels = ThesisDrawing<'survey' | 'interviews' | 'prototype' | 'test1' | 'test2' | 'explains'>['labels']
export type ResearchSequenceProps = IllustrationProps & { copy: ThesisDrawing<keyof Labels> }

const H = space(960, 300)
const V = space(360, 680)
const steps = ['survey', 'interviews', 'prototype', 'test1', 'test2'] as const
const W = 40 // card width

/** A faint curve from step b back to step a: each step explains the one before. */
function back(a: Pt, b: Pt, bulge: Pt) {
  return `${M(b)}${C([b[0] + bulge[0], b[1] + bulge[1]], [a[0] + bulge[0], a[1] + bulge[1]], a)}`
}

function horizontal(s: Space, labels: Labels): DrawGroup[] {
  const y = 112
  const xs = spread(112, 848, steps.length)
  const h = (W * 7) / 5
  const groups: DrawGroup[] = steps.map((key, i) => ({
    plate: (
      <>
        {i > 0 && <Arrow a={[xs[i - 1] + W / 2 + 14, y]} b={[xs[i] - W / 2 - 14, y]} />}
        <CardShape x={xs[i]} y={y} w={W} tint={i === 2} />
      </>
    ),
    pins: (
      <>
        <Label s={s} at={[xs[i], y]} anchor="middle" valign="middle" tone="muted" text={String(i + 1)} />
        <Label s={s} at={[xs[i], y + h / 2]} dy={12} anchor="middle" valign="top" text={labels[key]} />
      </>
    ),
  }))
  const bottom = y + h / 2 + 44
  groups.push({
    plate: (
      <>
        {xs.slice(1).map((x, i) => (
          <path
            key={i}
            d={back([xs[i], bottom], [x, bottom], [0, 40])}
            className="il-faint"
            pathLength={1}
            data-draw=""
          />
        ))}
      </>
    ),
    pins: <Label s={s} at={[480, bottom + 52]} anchor="middle" valign="top" tone="muted" text={labels.explains} />,
  })
  return groups
}

function vertical(s: Space, labels: Labels): DrawGroup[] {
  const x = 88
  const ys = spread(64, 552, steps.length)
  const h = (W * 7) / 5
  const groups: DrawGroup[] = steps.map((key, i) => ({
    plate: (
      <>
        {i > 0 && <Arrow a={[x, ys[i - 1] + h / 2 + 12]} b={[x, ys[i] - h / 2 - 12]} />}
        <CardShape x={x} y={ys[i]} w={W} tint={i === 2} />
      </>
    ),
    pins: (
      <>
        <Label s={s} at={[x, ys[i]]} anchor="middle" valign="middle" tone="muted" text={String(i + 1)} />
        <Label s={s} at={[x + W / 2, ys[i]]} dx={16} valign="middle" text={labels[key]} />
      </>
    ),
  }))
  const left = x - W / 2 - 12
  groups.push({
    plate: (
      <>
        {ys.slice(1).map((y, i) => (
          <path key={i} d={back([left, ys[i]], [left, y], [-36, 0])} className="il-faint" pathLength={1} data-draw="" />
        ))}
      </>
    ),
    pins: <Label s={s} at={[24, 640]} valign="middle" tone="muted" wrap={36} text={labels.explains} />,
  })
  return groups
}

/** (a) The thesis's explanatory sequential design: survey, interviews, prototype, test 1, test 2. */
export function ResearchSequence({ copy, className, titleId, variant }: ResearchSequenceProps) {
  return (
    <Drawing
      slug="research-sequence"
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
