import { type DrawGroup, Drawing, Label } from './frame'
import { C, M, type Pt, type Space, chevron, roundRect, space } from './geometry'
import type { IllustrationProps } from './types'

export type CareerMatrixProps = IllustrationProps & {
  /** Levels, first to last (columns on wide screens, rows on narrow ones). */
  levels?: readonly string[]
  /** Tracks or skill areas (rows on wide screens, columns on narrow ones). */
  tracks?: readonly string[]
  /** The highlighted path: [level, track] cells in order. */
  path?: readonly (readonly [number, number])[]
  /**
   * false: the grid without its own labels, levels across (horizontal layout), cells spread
   * evenly edge to edge, for a page that sets the axis labels as HTML in equal columns and rows
   * beside the drawing (Management).
   */
  axes?: boolean
}

const H = space(960, 600)
const V = space(360, 540)

type Cell = { x: number; y: number; w: number; h: number }
type Grid = { cell: (level: number, track: number) => Cell; heads: DrawGroup['pins'] }

/** Wide: levels across (left to right), tracks down; labels above and to the left, or none (edge to edge). */
function wide(s: Space, levels: readonly string[], tracks: readonly string[], axes = true): Grid {
  const x0 = axes ? 232 : 0
  const x1 = axes ? 932 : s.w
  const y0 = axes ? 96 : 0
  const y1 = axes ? 576 : s.h
  const cw = (x1 - x0) / levels.length
  const ch = (y1 - y0) / tracks.length
  return {
    cell: (l, t) => ({ x: x0 + l * cw + 8, y: y0 + t * ch + 8, w: cw - 16, h: ch - 16 }),
    heads: axes ? (
      <>
        {levels.map((name, l) => (
          <Label
            key={`l${l}`}
            s={s}
            at={[x0 + (l + 0.5) * cw, y0]}
            dy={-14}
            anchor="middle"
            valign="bottom"
            text={name}
            cat
            wrap={14}
          />
        ))}
        {tracks.map((name, t) => (
          <Label key={`t${t}`} s={s} at={[40, y0 + (t + 0.5) * ch]} valign="middle" text={name} cat wrap={14} />
        ))}
      </>
    ) : undefined,
  }
}

/** Narrow: tracks across (column heads), levels down, each level named above its row. */
function narrow(s: Space, levels: readonly string[], tracks: readonly string[]): Grid {
  const x0 = 24
  const x1 = 336
  const cw = (x1 - x0) / tracks.length
  const top = 72
  const pitch = (V.h - top - 16) / levels.length
  return {
    cell: (l, t) => ({ x: x0 + t * cw + 5, y: top + l * pitch + 28, w: cw - 10, h: pitch - 40 }),
    heads: (
      <>
        {tracks.map((name, t) => (
          <Label
            key={`t${t}`}
            s={s}
            at={[x0 + (t + 0.5) * cw, 40]}
            anchor="middle"
            valign="bottom"
            text={name}
            cat
            wrap={10}
          />
        ))}
        {levels.map((name, l) => (
          <Label key={`l${l}`} s={s} at={[x0 + 5, top + l * pitch + 20]} text={name} cat tone="muted" />
        ))}
      </>
    ),
  }
}

const centre = (c: Cell): Pt => [c.x + c.w / 2, c.y + c.h / 2]

function draw(
  s: Space,
  key: 'h' | 'v',
  levels: readonly string[],
  tracks: readonly string[],
  path: readonly (readonly [number, number])[],
  axes = true,
): DrawGroup[] {
  const grid = key === 'h' ? wide(s, levels, tracks, axes) : narrow(s, levels, tracks)
  const on = new Set(path.map(([l, t]) => `${l}:${t}`))
  const cells = levels.flatMap((_, l) => tracks.map((__, t) => ({ l, t, c: grid.cell(l, t) })))
  const points = path.map(([l, t]) => centre(grid.cell(l, t)))
  // Path segments: S-curves between cell centres, tangent along the level direction.
  const along = key === 'h' ? 0 : 1
  const radius = (i: number) => (i ? 6 : 8)
  const segments = points.slice(1).map((end, i) => {
    // Trimmed to the nodes' edges (the curve leaves and enters along the level direction).
    const a: Pt = along === 0 ? [points[i][0] + radius(i), points[i][1]] : [points[i][0], points[i][1] + radius(i)]
    const b: Pt = along === 0 ? [end[0] - radius(i + 1), end[1]] : [end[0], end[1] - radius(i + 1)]
    const m = (a[along] + b[along]) / 2
    return along === 0 ? M(a) + C([m, a[1]], [m, b[1]], b) : M(a) + C([a[0], m], [b[0], m], b)
  })
  const last = points.at(-1)
  const tipGap = 16
  return [
    {
      plate: (
        <>
          {cells.map(({ l, t, c }) =>
            on.has(`${l}:${t}`) ? null : (
              <path
                key={`${l}${t}`}
                d={roundRect(c.x, c.y, c.w, c.h, 8)}
                className="il-faint"
                pathLength="1"
                data-draw=""
              />
            ),
          )}
        </>
      ),
      pins: grid.heads,
    },
    {
      plate: (
        <>
          {cells.map(({ l, t, c }) =>
            on.has(`${l}:${t}`) ? (
              <g key={`${l}${t}`}>
                <path d={roundRect(c.x, c.y, c.w, c.h, 8)} data-draw-fill="" />
                <path d={roundRect(c.x, c.y, c.w, c.h, 8)} pathLength="1" data-draw="" />
              </g>
            ) : null,
          )}
        </>
      ),
    },
    {
      plate: (
        <>
          {points.map(([x, y], i) => (
            <circle key={`n${i}`} cx={x} cy={y} r={radius(i)} pathLength="1" data-draw="" />
          ))}
          {segments.map((d, i) => (
            <path key={`s${i}`} d={d} pathLength="1" data-draw="" />
          ))}
          {last && (
            <>
              <path
                d={
                  along === 0
                    ? `${M([last[0] + 8, last[1]])}H${last[0] + tipGap + 24}`
                    : `${M([last[0], last[1] + 8])}V${last[1] + tipGap + 14}`
                }
                pathLength="1"
                data-draw=""
              />
              <path
                d={chevron(
                  along === 0 ? [last[0] + tipGap + 24, last[1]] : [last[0], last[1] + tipGap + 14],
                  along === 0 ? 0 : 90,
                  7,
                )}
                pathLength="1"
                data-draw=""
              />
            </>
          )}
        </>
      ),
    },
  ]
}

/**
 * Team of Teams: a career framework as a grid of levels × tracks with one highlighted path
 * through it (tinted cells joined by a line). Horizontal 960×600 (levels across); vertical
 * 360×540 below 640 px (levels down). Groups: 1 grid and labels, 2 path cells, 3 the path.
 */
export function CareerMatrix({
  levels = ['Associate', 'Designer', 'Senior', 'Lead'],
  tracks = ['Craft', 'Delivery', 'People'],
  path = [
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 2],
  ],
  axes = true,
  title = 'Career framework',
  description,
  ...props
}: CareerMatrixProps) {
  const steps = path.map(([l, t]) => `${levels[l]} in ${tracks[t]}`).join(', then ')
  const desc =
    description ??
    `A grid of ${levels.length} levels (${levels.join(', ')}) by ${tracks.length} tracks (${tracks.join(', ')}). One highlighted path runs through it: ${steps}.`
  return (
    <Drawing
      slug="career-matrix"
      title={title}
      desc={desc}
      {...props}
      variant={axes ? props.variant : 'horizontal'}
      h={[H, (s, k) => draw(s, k, levels, tracks, path, axes)]}
      v={[V, (s, k) => draw(s, k, levels, tracks, path)]}
    />
  )
}
