import { pad2 } from '@/lib/content'
import { cx } from '@/lib/cx'

type Props = {
  /** 1-based section number, shown as "01". */
  number: number
  /** Short label, e.g. "Context". */
  label: string
  className?: string
}

/*
 * The section's index label ("01 — Context") in the label token. From 1024 px
 * it sits in the index column (columns 1–3) and stays pinned below the header
 * while its section reads (CSS sticky; the Section helper makes it span the
 * section's head and body rows). Below 1024 px it is an inline label above the
 * section's h2. Contract: docs/contracts.md#sectionindex.
 */
export function SectionIndex({ number, label, className }: Props) {
  return (
    <p className={cx('section-index t-label', className)} data-section-index={number}>
      <span className="section-index-number">{pad2(number)}</span>
      <span className="section-index-label">{label}</span>
    </p>
  )
}
