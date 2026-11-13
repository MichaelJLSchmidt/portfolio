import type { ReactNode } from 'react'
import { type DrawGroup, Drawing, Group, IllustrationFrame, Label } from './frame'
import { L, M, type Pt, type Space, roundRect, space } from './geometry'
import { type IllustrationProps, type WorkshopMethod, workshopMethods } from './types'

/** Default names (the content module's workshop titles can replace them). */
const names: Record<WorkshopMethod, string> = {
  'crazy-eights': 'Crazy Eights',
  'one-two-four-all': '1-2-4-All',
  'dot-voting': 'Dot Voting',
  fishbowl: 'Fishbowl',
}

const what: Record<WorkshopMethod, string> = {
  'crazy-eights': 'a sheet folded into eight panels, one idea per panel',
  'one-two-four-all': 'one person, then pairs, then fours, then the whole room in a circle',
  'dot-voting': 'three options with votes stacked above them as dots',
  fishbowl: 'an inner circle of four seats inside a ring of listeners',
}

/**
 * One glyph drawn in a 64 × 64 box placed at (ox, oy) and scaled by k. Coordinates are
 * computed (not transformed), so strokes keep the drawing's stroke width.
 * Returns [outline, details]: the two drawing passes.
 */
function glyph(method: WorkshopMethod, ox: number, oy: number, k: number): [ReactNode, ReactNode] {
  const p = (x: number, y: number): Pt => [ox + x * k, oy + y * k]
  const dot = (x: number, y: number, r: number, key: string | number, tint = false) => {
    const [cx, cy] = p(x, y)
    return (
      <g key={key}>
        {tint && <circle cx={cx} cy={cy} r={r * k} data-draw-fill="" />}
        <circle cx={cx} cy={cy} r={r * k} pathLength="1" data-draw="" />
      </g>
    )
  }
  const rect = (x: number, y: number, w: number, h: number, r: number) =>
    roundRect(ox + x * k, oy + y * k, w * k, h * k, r * k)
  const line = (x1: number, y1: number, x2: number, y2: number, key: string | number) => (
    <path key={key} d={M(p(x1, y1)) + L(p(x2, y2))} pathLength="1" data-draw="" />
  )
  switch (method) {
    case 'crazy-eights':
      return [
        <>
          <path d={rect(45, 32, 13, 18, 0)} data-draw-fill="" />
          <path d={rect(6, 14, 52, 36, 3)} pathLength="1" data-draw="" />
        </>,
        <>
          {[19, 32, 45].map((x) => line(x, 14, x, 50, x))}
          {line(6, 32, 58, 32, 'h')}
        </>,
      ]
    case 'one-two-four-all':
      return [
        <circle key="all" cx={p(32, 32)[0]} cy={p(32, 32)[1]} r={27 * k} pathLength="1" data-draw="" />,
        <>
          {dot(32, 32, 3.5, 'one', true)}
          {dot(21, 32, 3, 'two-a')}
          {dot(43, 32, 3, 'two-b')}
          {[45, 135, 225, 315].map((a) => {
            const r = (a * Math.PI) / 180
            return dot(32 + 17 * Math.cos(r), 32 + 17 * Math.sin(r), 3, `four-${a}`)
          })}
        </>,
      ]
    case 'dot-voting':
      return [
        <>
          <path d={rect(7, 32, 14, 22, 2.5)} data-draw-fill="" />
          {[7, 25, 43].map((x) => (
            <path key={x} d={rect(x, 32, 14, 22, 2.5)} pathLength="1" data-draw="" />
          ))}
        </>,
        <>
          {[24, 15, 6].map((y, i) => dot(14, y + 1, 3, `a${i}`))}
          {dot(32, 25, 3, 'b0')}
          {[24, 15].map((y, i) => dot(50, y + 1, 3, `c${i}`))}
        </>,
      ]
    case 'fishbowl':
      return [
        <>
          <circle cx={p(32, 32)[0]} cy={p(32, 32)[1]} r={14 * k} data-draw-fill="" />
          <circle cx={p(32, 32)[0]} cy={p(32, 32)[1]} r={14 * k} className="il-faint" pathLength="1" data-draw="" />
        </>,
        <>
          {[45, 135, 225, 315].map((a) => {
            const r = (a * Math.PI) / 180
            return dot(32 + 7.5 * Math.cos(r), 32 + 7.5 * Math.sin(r), 2.8, `in-${a}`)
          })}
          {Array.from({ length: 8 }, (_, i) => {
            const r = ((i * 45 + 22.5) * Math.PI) / 180
            return dot(32 + 24 * Math.cos(r), 32 + 24 * Math.sin(r), 2.8, `out-${i}`)
          })}
        </>,
      ]
  }
}

const GLYPH = space(64, 64)

export type WorkshopGlyphProps = IllustrationProps & { method: WorkshopMethod }

/** One workshop-method glyph (64 × 64, no label). Groups: 1 outline, 2 details. */
export function WorkshopGlyph({ method, className, titleId, title, description }: WorkshopGlyphProps) {
  const [outline, details] = glyph(method, 0, 0, 1)
  return (
    <IllustrationFrame
      slug="workshop-glyph"
      viewBox={GLYPH}
      title={title ?? names[method]}
      desc={description ?? `Workshop method ${names[method]}: ${what[method]}.`}
      className={className}
      titleId={titleId}
    >
      <Group n={1}>{outline}</Group>
      <Group n={2}>{details}</Group>
    </IllustrationFrame>
  )
}

export type WorkshopGlyphsProps = IllustrationProps & {
  /** Which methods to show, in order (default: all four). */
  methods?: readonly WorkshopMethod[]
  /** Labels per method (default names; pass the content's titles to localise). */
  labels?: Partial<Record<WorkshopMethod, string>>
}

const H = space(960, 160)
const V = space(360, 320)

function draw(
  s: Space,
  key: 'h' | 'v',
  methods: readonly WorkshopMethod[],
  label: (m: WorkshopMethod) => string,
): DrawGroup[] {
  return methods.map((m, i): DrawGroup => {
    if (key === 'h') {
      // A row of cells: glyph centred, name underneath (holds one 13-character line from 448 px).
      const cx = (i + 0.5) * (960 / methods.length)
      const size = 76
      const [outline, details] = glyph(m, cx - size / 2, 12, size / 64)
      return {
        plate: (
          <>
            {outline}
            {details}
          </>
        ),
        pins: <Label s={s} at={[cx, 12 + size]} dy={12} anchor="middle" valign="top" wrap={13} text={label(m)} />,
      }
    }
    const cx = (i % 2) * 180 + 90
    const top = Math.floor(i / 2) * 160 + 16
    const [outline, details] = glyph(m, cx - 40, top, 80 / 64)
    return {
      plate: (
        <>
          {outline}
          {details}
        </>
      ),
      pins: <Label s={s} at={[cx, top + 80]} dy={12} anchor="middle" valign="top" wrap={14} text={label(m)} />,
    }
  })
}

/**
 * Management: the four workshop methods as glyphs in a row, each with its name underneath.
 * Horizontal 960×160 (from 448 px wide); vertical 360×320 (two by two) below 640 px. Groups: one per method. For one glyph on
 * its own (no label), use WorkshopGlyph with a `method`.
 */
export function WorkshopGlyphs({
  methods = workshopMethods,
  labels,
  title = 'Workshop methods',
  description,
  ...props
}: WorkshopGlyphsProps) {
  const label = (m: WorkshopMethod) => labels?.[m] ?? names[m]
  const desc =
    description ??
    `${methods.length} workshop methods as simple glyphs: ${methods.map((m) => `${label(m)}, ${what[m]}`).join('; ')}.`
  return (
    <Drawing
      slug="workshop-glyphs"
      title={title}
      desc={desc}
      {...props}
      h={[H, (s, k) => draw(s, k, methods, label)]}
      v={[V, (s, k) => draw(s, k, methods, label)]}
    />
  )
}
