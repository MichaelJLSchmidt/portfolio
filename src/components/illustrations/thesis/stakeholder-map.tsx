import type { ThesisDrawing } from '@/lib/content'
import { type DrawGroup, Drawing, Label } from '../frame'
import { poly, space, type Pt, type Space } from '../geometry'
import type { IllustrationProps } from '../types'
import { CardShape, Person } from './parts'

type Key = 'tool' | 'individuals' | 'managers' | 'hr' | 'leadership'
export type StakeholderMapProps = IllustrationProps & { copy: ThesisDrawing<Key> }

const S = space(560, 460)
const CENTRE: Pt = [280, 222]
const CARD = 64

/** Around the tool: who it serves (individuals, managers), who runs it (HR) and who backs it (leadership). */
const ring: { key: Exclude<Key, 'tool'>; at: Pt; side: 'left' | 'right' | 'top' | 'bottom' }[] = [
  { key: 'individuals', at: [88, 222], side: 'left' },
  { key: 'managers', at: [280, 56], side: 'top' },
  { key: 'hr', at: [472, 222], side: 'right' },
  { key: 'leadership', at: [280, 392], side: 'bottom' },
]

function draw(s: Space, l: Record<Key, string>): DrawGroup[] {
  const h = (CARD * 7) / 5
  return [
    {
      plate: <CardShape x={CENTRE[0]} y={CENTRE[1]} w={CARD} tint />,
      pins: <Label s={s} at={CENTRE} anchor="middle" valign="middle" tone="accent" cat text={l.tool} />,
    },
    ...ring.map(({ key, at, side }) => {
      const horizontal = side === 'left' || side === 'right'
      const sign = side === 'left' || side === 'top' ? -1 : 1
      const from: Pt = horizontal
        ? [CENTRE[0] + sign * (CARD / 2 + 10), at[1]]
        : [at[0], CENTRE[1] + sign * (h / 2 + 10)]
      const to: Pt = horizontal ? [at[0] - sign * 22, at[1]] : [at[0], at[1] - sign * 22]
      return {
        plate: (
          <>
            <path d={poly([from, to])} className="il-faint" pathLength={1} data-draw="" />
            <Person x={at[0]} y={at[1]} r={12} />
          </>
        ),
        pins: horizontal ? (
          <Label
            s={s}
            at={[at[0], at[1] - 22]}
            anchor={side === 'left' ? 'start' : 'end'}
            dx={side === 'left' ? -12 : 12}
            valign="bottom"
            text={l[key]}
          />
        ) : (
          <Label s={s} at={[at[0] + 22, at[1]]} valign="middle" text={l[key]} />
        ),
      }
    }),
  ]
}

/** (c) The stakeholder map: the tool at the centre, individuals, managers, HR and leadership around it. */
export function StakeholderMap({ copy, className, titleId }: StakeholderMapProps) {
  return (
    <Drawing
      slug="stakeholder-map"
      title={copy.title}
      desc={copy.description}
      className={className}
      titleId={titleId}
      h={[S, (s) => draw(s, copy.labels)]}
    />
  )
}
