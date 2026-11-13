import { Reveal } from '@/components/reveals'
import { pad2 } from '@/lib/content'
import { cx } from '@/lib/cx'
import { ChapterNumeral } from './chapter-numeral'

type Props = {
  /** The number to show; numbers are padded to two digits ("02"). */
  value: number | string
  className?: string
}

/*
 * A large outlined numeral (numeral token, outline variant) that opens a
 * section: a ChapterNumeral, drawn contour by contour when the chapter
 * reveals (the `draw` kind; reduced motion: drawn from the start). Its bottom
 * margin is minus a third of its line box, so the next block (the section's
 * h2) overlaps its lower third and sits above it. From 1024 px it starts at the
 * content column (column 4), so the overlap is visible. Decorative: the
 * SectionIndex carries the number as text. Contract: docs/contracts.md#numeralbreaker.
 */
export function NumeralBreaker({ value, className }: Props) {
  const digits = typeof value === 'number' ? pad2(value) : value
  return (
    <Reveal kind="draw" className={cx('numeral-breaker', className)} aria-hidden="true" data-numeral={value}>
      <ChapterNumeral value={digits} />
    </Reveal>
  )
}
