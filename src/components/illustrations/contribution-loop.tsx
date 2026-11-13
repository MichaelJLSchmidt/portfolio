import { type DrawGroup, Drawing, Label } from './frame'
import { type Space, arc, chevron, polar, radialAlign, roundRect, space } from './geometry'
import type { IllustrationProps } from './types'

export type ContributionLoopProps = IllustrationProps & {
  /** The stages of the loop, clockwise from the top. */
  steps?: readonly string[]
}

const S = space(560, 560)
const CX = 280
const CY = 280
const RING = 128
const NODE = 10

function draw(s: Space, steps: readonly string[]): DrawGroup[] {
  const n = steps.length
  const angle = (i: number) => -90 + (i * 360) / n
  const gap = ((NODE + 9) / RING) * (180 / Math.PI)
  const card = { w: 56, h: 78 }
  return [
    {
      plate: (
        <>
          <path d={roundRect(CX - card.w / 2, CY - card.h / 2, card.w, card.h, 6)} data-draw-fill="" />
          <path d={roundRect(CX - card.w / 2, CY - card.h / 2, card.w, card.h, 6)} pathLength="1" data-draw="" />
          <path
            d={roundRect(CX - card.w / 2 + 7, CY - card.h / 2 + 7, card.w - 14, card.h - 14, 3)}
            className="il-faint"
            pathLength="1"
            data-draw=""
          />
        </>
      ),
    },
    ...steps.map((name, i): DrawGroup => {
      const a = angle(i)
      const [x, y] = polar(CX, CY, RING, a)
      const end = angle(i + 1) - gap
      const place = radialAlign(a, 8)
      return {
        plate: (
          <>
            <circle cx={x} cy={y} r={NODE} data-draw-fill="" />
            <circle cx={x} cy={y} r={NODE} pathLength="1" data-draw="" />
            <path d={arc(CX, CY, RING, a + gap, end)} pathLength="1" data-draw="" />
            <path d={chevron(polar(CX, CY, RING, end), end + 90 - 4, 8)} pathLength="1" data-draw="" />
          </>
        ),
        pins: (
          <Label
            s={s}
            at={polar(CX, CY, RING + NODE + 6, a)}
            {...place}
            text={[String(i + 1).padStart(2, '0'), name]}
            tones={['muted']}
            cat
          />
        ),
      }
    }),
  ]
}

/**
 * Shared Foundations / case 2: the contribution loop. Stages sit on a ring, clockwise from the
 * top, joined by arcs with arrowheads; a card in the middle stands for the contribution that
 * travels round. 560×560, one layout (works from 280 px). Groups: 1 the card, then one per stage
 * (node, arc to the next stage, label).
 */
export function ContributionLoop({
  steps = ['Propose', 'Pair', 'Review', 'Release', 'Adopt'],
  title = 'Contribution loop',
  description,
  ...props
}: ContributionLoopProps) {
  const desc =
    description ??
    `A loop of ${steps.length} stages a contribution goes through, in order: ${steps.join(', ')}, then back to ${steps[0]}. Arrows show the direction.`
  return <Drawing slug="contribution-loop" title={title} desc={desc} {...props} h={[S, (s) => draw(s, steps)]} />
}
