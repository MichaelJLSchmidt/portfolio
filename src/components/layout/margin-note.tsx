import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Reveal } from '../reveals'

type Props = {
  children: ReactNode
  /** Accessible name when the note needs one. */
  label?: string
  className?: string
}

/*
 * A short note beside the text. From 1680 px (--breakpoint-margin-notes, D2)
 * it sits in column 12 + the right outer track, level with the paragraph it
 * annotates; below that it is an inline aside under the paragraph with a 1 px
 * left rule. Revealed late ("note"). Use it as a direct child of a
 * .spread-grid section, right after the body it belongs to.
 * Contract: docs/contracts.md#marginnote.
 */
export function MarginNote({ children, label, className }: Props) {
  return (
    <Reveal
      as="aside"
      kind="note"
      className={cx('margin-note col-margin', className)}
      aria-label={label}
      data-margin-note=""
    >
      <p className="margin-note-text">{children}</p>
    </Reveal>
  )
}
