import { type CSSProperties, Fragment, type ReactNode, useId } from 'react'
import { CAP, LINE, type Pt, type Space, pct, wrap } from './geometry'
import type { IllustrationVariant } from './types'

/*
 * The drawing kit shared by every illustration (conventions: README.md in this folder).
 *
 * Two kinds of drawings:
 *   - plain (no labels): <IllustrationFrame viewBox> — the root <svg> carries the viewBox;
 *   - labelled: <Drawing layouts> — the root <svg> has no viewBox and keeps its proportions with
 *     CSS aspect-ratio; geometry sits in nested <svg viewBox> plates (scaled with the drawing)
 *     and labels sit in CSS px (11 px stays 11 px at any size), pinned to points of the geometry.
 * Strokes keep 1.5 px on screen at any size (illustrations.css corrects the plates' stroke
 * width with a container query), so the Motion session can draw them with pathLength="1".
 */

type Ids = { title: string; desc: string; uid: string }

/** Unique ids for one illustration instance: <title>, <desc> and a prefix for masks. */
export function useIllustrationIds(slug: string, titleId?: string): Ids {
  const uid = `il-${useId().replace(/[^\w-]/g, '')}`
  const title = titleId ?? `illustration-${slug}-${uid.slice(3)}`
  return { title, desc: `${title}-desc`, uid }
}

type RootProps = {
  /** kebab-case name, written to data-illustration. */
  slug: string
  title: string
  desc: string
  className?: string
  ids: Ids
  children?: ReactNode
  viewBox?: Space
  layouts?: { h?: Space; v?: Space }
}

/** The root <svg>: role="img", <title> + <desc>, currentColor strokes, no fill. */
function Root({ slug, title, desc, className, ids, children, viewBox, layouts }: RootProps) {
  const keys = layouts ? (['h', 'v'] as const).filter((k) => layouts[k]) : []
  // A size container (illustrations.css) loses the viewBox's intrinsic ratio, so state it.
  const style = viewBox
    ? ({ '--il-vbw': viewBox.w, aspectRatio: viewBox.ratio } as CSSProperties)
    : ({ '--il-ratio-h': layouts?.h?.ratio, '--il-ratio-v': layouts?.v?.ratio } as CSSProperties)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox?.vb}
      className={className ? `illustration ${className}` : 'illustration'}
      role="img"
      aria-labelledby={`${ids.title} ${ids.desc}`}
      data-illustration={slug}
      data-layouts={keys.length ? keys.join(' ') : undefined}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title id={ids.title}>{title}</title>
      <desc id={ids.desc}>{desc}</desc>
      {children}
    </svg>
  )
}

type FrameProps = Omit<RootProps, 'layouts' | 'ids' | 'viewBox'> & { viewBox: Space; titleId?: string; ids?: Ids }

/**
 * Plain drawing (no labels): the root carries the viewBox; children are the drawing groups.
 * Wrap each group's strokes in <Group> so their width is corrected to 1.5 px on screen.
 */
export function IllustrationFrame({ titleId, ids, ...props }: FrameProps) {
  const own = useIllustrationIds(props.slug, titleId)
  return <Root {...props} ids={ids ?? own} />
}

/** A drawing group of a plain drawing: <g data-draw-group="n" class="il-plate">. */
export function Group({ n, children }: { n: number; children: ReactNode }) {
  return (
    <g data-draw-group={n} className="il-plate">
      {children}
    </g>
  )
}

/* ---------- Labelled drawings ---------- */

/** What one drawing group holds in one layout: scaled geometry and px-space pins/labels. */
export type DrawGroup = { plate?: ReactNode; pins?: ReactNode }
export type LayoutKey = 'h' | 'v'
type LayoutDraw = (s: Space, key: LayoutKey) => DrawGroup[]

type DrawingProps = {
  slug: string
  title: string
  desc: string
  className?: string
  titleId?: string
  variant?: IllustrationVariant
  /** The default (horizontal) layout: its space and its groups. */
  h: [Space, LayoutDraw]
  /** Optional vertical layout for narrow screens. */
  v?: [Space, LayoutDraw]
}

/**
 * Labelled drawing with one or two layouts. With both and variant `auto`, both render and CSS
 * shows the vertical one below 640 px (illustrations.css); `horizontal` / `vertical` render one.
 * Groups are zipped by index, so <g data-draw-group="n"> holds layout h and layout v of group n.
 */
export function Drawing({ slug, title, desc, className, titleId, variant = 'auto', h, v }: DrawingProps) {
  const ids = useIllustrationIds(slug, titleId)
  const show: LayoutKey[] = !v ? ['h'] : variant === 'horizontal' ? ['h'] : variant === 'vertical' ? ['v'] : ['h', 'v']
  const defs = show.map((key) => {
    const [s, draw] = key === 'h' ? h : v!
    return { key, s, groups: draw(s, key) }
  })
  const count = Math.max(...defs.map((d) => d.groups.length))
  const dual = defs.length > 1
  return (
    <Root
      slug={slug}
      title={title}
      desc={desc}
      className={className}
      ids={ids}
      layouts={{ h: show.includes('h') ? h[0] : undefined, v: show.includes('v') ? v?.[0] : undefined }}
    >
      {Array.from({ length: count }, (_, i) => (
        <g key={i} data-draw-group={i + 1}>
          {defs.map(({ key, s, groups }) => {
            const g = groups[i]
            if (!g) return null
            const body = (
              <>
                {g.plate && <Plate s={s}>{g.plate}</Plate>}
                {g.pins}
              </>
            )
            return dual ? (
              <g key={key} data-layout={key}>
                {body}
              </g>
            ) : (
              <Fragment key={key}>{body}</Fragment>
            )
          })}
        </g>
      ))}
    </Root>
  )
}

/** Geometry layer: a nested <svg> with the layout's viewBox, filling the root. */
export function Plate({ s, children }: { s: Space; children: ReactNode }) {
  return (
    <svg
      className="il-plate"
      viewBox={s.vb}
      width="100%"
      height="100%"
      overflow="visible"
      style={{ '--il-vbw': s.w } as CSSProperties}
    >
      {children}
    </svg>
  )
}

/** Pins px-space content to a point of a layout: inside a Pin, 1 unit = 1 CSS px. */
export function Pin({ s, at, children }: { s: Space; at: Pt; children: ReactNode }) {
  return (
    <svg x={pct(at[0], s.w)} y={pct(at[1], s.h)} overflow="visible">
      {children}
    </svg>
  )
}

export type LabelTone = 'text' | 'muted' | 'accent'

type TextProps = {
  /** Text, or lines. */
  text: string | readonly string[]
  /** Offset from the pin in px. */
  dx?: number
  dy?: number
  anchor?: 'start' | 'middle' | 'end'
  /** Where `dy` sits: on the first baseline, at the cap top, the block's middle, or the last baseline. */
  valign?: 'baseline' | 'top' | 'middle' | 'bottom'
  tone?: LabelTone
  /** Category label: uppercase, wider tracking, medium weight. */
  cat?: boolean
  /** Wrap to this many characters per line. */
  wrap?: number
  /** Key figure (20 px) instead of an 11 px label. */
  figure?: boolean
  /** Per-line tone, overriding `tone` (e.g. a muted index line above a name). */
  tones?: readonly (LabelTone | undefined)[]
}

/** A label in px space (use inside a Pin, or via <Label>). */
export function Text({
  text,
  dx = 0,
  dy = 0,
  anchor = 'start',
  valign = 'baseline',
  tone = 'text',
  cat,
  wrap: max,
  figure,
  tones,
}: TextProps) {
  const lines = typeof text === 'string' ? (max ? wrap(text, max) : [text]) : text
  const cap = figure ? 15 : CAP
  const step = figure ? 24 : LINE
  const n = lines.length
  const y0 =
    valign === 'top'
      ? dy + cap
      : valign === 'middle'
        ? dy + cap / 2 - ((n - 1) * step) / 2
        : valign === 'bottom'
          ? dy - (n - 1) * step
          : dy
  const cls = ['il-label', cat && 'il-cat', tone !== 'text' && `il-${tone}`, figure && 'il-figure']
    .filter(Boolean)
    .join(' ')
  return (
    <text
      x={dx}
      y={y0}
      textAnchor={anchor === 'start' ? undefined : anchor}
      className={cls}
      stroke="none"
      data-draw-label=""
    >
      {n === 1
        ? lines[0]
        : lines.map((line, i) => (
            <tspan
              key={i}
              x={dx}
              dy={i ? step : 0}
              className={tones?.[i] && tones[i] !== tone ? `il-${tones[i]}` : undefined}
            >
              {line}
            </tspan>
          ))}
    </text>
  )
}

/** A label pinned to a point of a layout. */
export function Label({ s, at, ...text }: TextProps & { s: Space; at: Pt }) {
  return (
    <Pin s={s} at={at}>
      <Text {...text} />
    </Pin>
  )
}
