import { Badges, badgesHeight } from './badges'
import { type DrawGroup, Drawing, Pin, Text } from './frame'
import { M, type Space, poly, space } from './geometry'
import type { IllustrationProps } from './types'

export type DesignSystemLayersProps = IllustrationProps & {
  /** Layers from the foundation up (five). The last one carries the badges. */
  layers?: readonly string[]
  /** Badges on the top layer (the stacks the product apps run on). */
  badges?: readonly string[]
}

const H = space(640, 560)
const V = space(360, 540)

type Geo = { cx: number; a: number; b: number; t: number; top: number; step: number }

/** An axonometric plate: the top face (closed) and its front edges. */
function plate({ cx, a, b, t }: Geo, cy: number) {
  const face = `${poly([
    [cx - a, cy],
    [cx, cy - b],
    [cx + a, cy],
    [cx, cy + b],
  ])}Z`
  const sides =
    poly([
      [cx - a, cy],
      [cx - a, cy + t],
      [cx, cy + b + t],
      [cx + a, cy + t],
      [cx + a, cy],
    ]) + `${M([cx, cy + b])}V${cy + b + t}`
  return { face, sides }
}

function draw(s: Space, key: 'h' | 'v', layers: readonly string[], badges: readonly string[]): DrawGroup[] {
  const g: Geo =
    key === 'h'
      ? { cx: 200, a: 150, b: 36, t: 10, top: 92, step: 98 }
      : { cx: 180, a: 128, b: 30, t: 8, top: 164, step: 80 }
  const n = layers.length
  const cys = layers.map((_, i) => g.top + (n - 1 - i) * g.step) // bottom layer first
  const labelX = g.cx + g.a + 36
  return [
    ...layers.map((name, i): DrawGroup => {
      const cy = cys[i]
      const { face, sides } = plate(g, cy)
      const below = i > 0 ? cys[i - 1] : null
      const index = String(i + 1).padStart(2, '0')
      return {
        plate: (
          <>
            {below !== null && (
              <path
                d={`${M([g.cx - g.a, below])}V${cy + g.t + 4}${M([g.cx + g.a, below])}V${cy + g.t + 4}`}
                className="il-faint"
                pathLength="1"
                data-draw=""
              />
            )}
            <path d={face} data-draw-fill="" />
            <path d={face} pathLength="1" data-draw="" />
            <path d={sides} pathLength="1" data-draw="" />
            {key === 'h' && (
              <path d={`${M([g.cx + g.a + 8, cy])}H${labelX - 8}`} className="il-faint" pathLength="1" data-draw="" />
            )}
          </>
        ),
        pins:
          key === 'h' ? (
            <Pin s={s} at={[labelX, cy]}>
              <Text text={index} valign="middle" tone="muted" />
              <Text text={name} dx={28} valign="middle" cat />
            </Pin>
          ) : (
            <Pin s={s} at={[g.cx, cy]}>
              <Text text={`${index} ${name}`} valign="middle" anchor="middle" cat />
            </Pin>
          ),
      }
    }),
    {
      pins:
        key === 'h' ? (
          <Pin s={s} at={[labelX, cys[n - 1]]}>
            <g transform="translate(28 16)">
              <Badges labels={badges} max={210} />
            </g>
          </Pin>
        ) : (
          <Pin s={s} at={[g.cx, cys[n - 1] - g.b]}>
            <g transform={`translate(0 ${-14 - badgesHeight(badges, 260)})`}>
              <Badges labels={badges} max={260} align="middle" />
            </g>
          </Pin>
        ),
    },
  ]
}

/**
 * Shared Foundations / case 2: the design system as five stacked layers, from tokens up to the
 * product apps, drawn as an exploded axonometric stack; badges name the stacks the product apps
 * run on. Horizontal 640×560 (labels beside the stack); vertical 360×540 below 640 px (labels on
 * the plates, badges above). Groups: one per layer, bottom to top, then the badges.
 */
export function DesignSystemLayers({
  layers = ['Tokens', 'Primitives', 'Components', 'Patterns', 'Product apps'],
  badges = ['Angular', 'React', 'Vue', 'Server templates'],
  title = 'Design system layers',
  description,
  ...props
}: DesignSystemLayersProps) {
  const desc =
    description ??
    `${layers.length} layers stacked from the foundation up: ${layers.join(', ')}. The top layer serves ${badges.length} kinds of product app: ${badges.join(', ')}.`
  return (
    <Drawing
      slug="design-system-layers"
      title={title}
      desc={desc}
      {...props}
      h={[H, (s, k) => draw(s, k, layers, badges)]}
      v={[V, (s, k) => draw(s, k, layers, badges)]}
    />
  )
}
