import type { ThesisDrawing } from '@/lib/content'
import { type DrawGroup, Drawing, Label } from '../frame'
import { space, spread, type Space } from '../geometry'
import type { IllustrationProps } from '../types'
import { Arrow, Person } from './parts'

type Key = 'round1' | 'round2' | 'people1' | 'people2' | 'changed' | 'found1' | 'found2'
export type TestIterationsProps = IllustrationProps & { copy: ThesisDrawing<Key> }

const H = space(960, 300)
const V = space(360, 600)

/** One round: its people in a row, how many, and what it found. */
function Round({
  s,
  x0,
  x1,
  y,
  n,
  title,
  people,
  found,
  trusted,
}: {
  s: Space
  x0: number
  x1: number
  y: number
  n: number
  title: string
  people: string
  found: string
  trusted: boolean
}): DrawGroup {
  const xs = spread(x0, x1, n)
  return {
    plate: (
      <>
        {xs.map((x, i) => (
          <Person key={i} x={x} y={y} r={14} tint={trusted} />
        ))}
      </>
    ),
    pins: (
      <>
        <Label s={s} at={[x0 - 14, y - 44]} valign="middle" cat text={title} />
        <Label s={s} at={[x0 - 14, y + 32]} valign="top" tone="muted" text={people} />
        <Label s={s} at={[x0 - 14, y + 56]} valign="top" tone={trusted ? 'accent' : 'text'} text={found} />
      </>
    ),
  }
}

function horizontal(s: Space, l: Record<Key, string>): DrawGroup[] {
  const y = 140
  return [
    Round({ s, x0: 80, x1: 336, y, n: 5, title: l.round1, people: l.people1, found: l.found1, trusted: false }),
    {
      plate: <Arrow a={[392, y]} b={[560, y]} />,
      pins: <Label s={s} at={[476, y - 16]} anchor="middle" valign="bottom" wrap={18} text={l.changed} />,
    },
    Round({ s, x0: 640, x1: 856, y, n: 4, title: l.round2, people: l.people2, found: l.found2, trusted: true }),
  ]
}

function vertical(s: Space, l: Record<Key, string>): DrawGroup[] {
  return [
    Round({ s, x0: 48, x1: 304, y: 80, n: 5, title: l.round1, people: l.people1, found: l.found1, trusted: false }),
    {
      plate: <Arrow a={[64, 216]} b={[64, 352]} />,
      pins: <Label s={s} at={[92, 284]} valign="middle" wrap={24} text={l.changed} />,
    },
    Round({ s, x0: 48, x1: 256, y: 444, n: 4, title: l.round2, people: l.people2, found: l.found2, trusted: true }),
  ]
}

/** (e) The two test iterations: five people, then four new people; between them, clearer source labels. */
export function TestIterations({ copy, className, titleId, variant }: TestIterationsProps) {
  return (
    <Drawing
      slug="test-iterations"
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
