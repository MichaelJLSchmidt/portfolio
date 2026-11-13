import type { ReactNode } from 'react'
import type { ImageId } from '@/lib/content'
import { cx } from '@/lib/cx'
import { Picture } from '../picture'

export type ImageSide = 'left' | 'right'

type Props = {
  image: ImageId
  /**
   * The edge the image extends toward from 1024 px: "right" is anchored at the content column's
   * start and runs to the right edge, "left" is anchored at its end and runs to the left edge.
   * Consecutive images on a page alternate (imageSides()).
   */
  side: ImageSide
  /** Beside the image from 1680 px (in the free space), below it otherwise; shown only when set. */
  caption?: ReactNode
  className?: string
}

/*
 * An offset editorial image (art direction: it echoes the case hero's offset).
 * From 1024 px it is anchored to the content column on one side and extends
 * toward the viewport edge on the other, at most 1200 px wide and 72svh tall,
 * 3:2 with object-fit cover; the corners on the anchored side are rounded, the
 * far side only once the cap keeps it off the edge. Caption: beside it in the
 * free space from 1680 px, below it otherwise. Below 1024 px: edge to edge at
 * 4:3. The figure is its own .spread-grid spanning full-start / full-end.
 * data-breaker: the background field lifts 10% while it is in view.
 * Contract: docs/contracts.md#offsetimage.
 */
export function OffsetImage({ image, side, caption, className }: Props) {
  return (
    <figure className={cx('offset-image spread-grid col-full', className)} data-side={side} data-breaker="">
      <div className="offset-image-area">
        <div className="offset-image-frame">
          <Picture id={image} sizes="(min-width: 1024px) min(1200px, 80vw), 100vw" className="offset-image-media" />
        </div>
      </div>
      {caption && <figcaption className="offset-image-caption t-label">{caption}</figcaption>}
    </figure>
  )
}

/** Sides for a page's images in reading order: they alternate, starting on the left (the hero runs right). */
export function imageSides() {
  let n = 0
  return (): ImageSide => (n++ % 2 === 0 ? 'left' : 'right')
}
