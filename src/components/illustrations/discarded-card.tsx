import { Group, IllustrationFrame, useIllustrationIds } from './frame'
import { roundRect, space } from './geometry'
import type { IllustrationProps } from './types'

const S = space(132, 184)
/** Inset of the outline from the box edge, so the 1.5 px stroke is never clipped. */
const EDGE = 2
const R = 10
/** The back's inner frame and its centre mark (a diamond), like a card back. */
const FRAME = 10
const MARK = { cx: 66, cy: 92, rx: 20, ry: 28 }

const outline = roundRect(EDGE, EDGE, S.w - EDGE * 2, S.h - EDGE * 2, R)
const frame = roundRect(FRAME, FRAME, S.w - FRAME * 2, S.h - FRAME * 2, R - 4)
const diamond = `M${MARK.cx} ${MARK.cy - MARK.ry}L${MARK.cx + MARK.rx} ${MARK.cy}L${MARK.cx} ${MARK.cy + MARK.ry}L${MARK.cx - MARK.rx} ${MARK.cy}Z`

/**
 * 404: one card, face down, drawn upright and filling its 132×184 box. The page
 * lays it on its discard pile and tilts it with --angle-discard (.lost-card),
 * so the drawing itself has no angle and no pile. Plain (no labels).
 * Groups: 1 the card's outline and tint, 2 the back (inner frame and centre mark).
 */
export function DiscardedCard({ className, titleId, title = 'A discarded card', description }: IllustrationProps) {
  const ids = useIllustrationIds('discarded-card', titleId)
  return (
    <IllustrationFrame
      slug="discarded-card"
      viewBox={S}
      title={title}
      desc={description ?? 'A single playing card lying face down, its back showing a framed diamond.'}
      className={className}
      ids={ids}
    >
      <Group n={1}>
        <path d={outline} data-draw-fill="" />
        <path d={outline} pathLength="1" data-draw="" />
      </Group>
      <Group n={2}>
        <path d={frame} className="il-faint" pathLength="1" data-draw="" />
        <path d={diamond} pathLength="1" data-draw="" />
      </Group>
    </IllustrationFrame>
  )
}
