import type { ImageSide } from '@/components/layout'
import { cx } from '@/lib/cx'

type Props = {
  /** What will go here, shown in the empty frame. */
  label: string
  side: ImageSide
  className?: string
}

/*
 * A marked placeholder for an image that does not exist yet (the thesis's prototype
 * screenshots): the offset image's frame and placement (OffsetImage, layout.css) with a fixed
 * aspect ratio (3:2 from 1024, 4:3 below), a faint outline and the label in the middle. Replace it
 * with an OffsetImage once the screenshot is in scripts/images/manifest.mjs.
 */
export function ImageSlot({ label, side, className }: Props) {
  return (
    <figure className={cx('offset-image spread-grid col-full image-slot', className)} data-side={side}>
      <div className="offset-image-area">
        <div className="offset-image-frame image-slot-frame">
          <span className="image-slot-label t-label">{label}</span>
        </div>
      </div>
    </figure>
  )
}
