import type { CSSProperties, ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Reveal } from '../reveals'
import { NumeralBreaker } from './numeral-breaker'
import { SectionIndex } from './section-index'

type Props = {
  /** The section's id (anchor, Minimap target) and data-section value. */
  id: string
  /** 1-based number ("01" in the index). */
  number: number
  /** Index label, e.g. "Context". */
  label: string
  /** The h2. */
  title: string
  /** Keep the h2 for screen readers only (the section opens with a statement set at h2 size). */
  titleHidden?: boolean
  /** Open with an outlined NumeralBreaker. */
  breaker?: boolean
  /** A full-bleed breaker (the problem statement): the background field lifts while it is in view (data-breaker). */
  lift?: boolean
  /** Space above the section (--space-s / -m / -l); chosen per section so the rhythm varies. */
  space?: 's' | 'm' | 'l'
  /**
   * From 1024 px: how many grid rows the sticky index spans, counting the h2's
   * row (default 2: the h2 and the first block). Keep it below any row that
   * holds a .col-wide / .col-full block, which needs columns 1–3.
   */
  pin?: number
  /**
   * A pinned scene that rides with the chapter's head (05 Key decisions: the DealRow): rendered
   * after the h2 inside a track and a stage (`[data-stage-track]` > `[data-stage]`). Both are
   * `display: contents` until the scene pins them (src/motion/scenes/deal-scene.ts), so the
   * static chapter looks like any other; pinned, the head and the scene stay together on screen.
   * `children` follow the track.
   */
  stage?: ReactNode
  className?: string
  /** Direct grid items, each placed with a .col-* / .cols-* class. */
  children?: ReactNode
}

/*
 * One numbered section on the Spread grid. Every child is a direct grid item,
 * so a section can mix reading-column text, a margin note (column 12 + outer
 * track from 1680), two-column rows and full-bleed blocks:
 *
 *   [NumeralBreaker]                 content column to the right edge
 *   SectionIndex (sticky)  h2        columns 1–3 | 4–11
 *   [stage]                          a pinned scene with the head (05 Key decisions)
 *   ...                    children
 *
 * A composition of the contract components, not a contract of its own.
 */
export function Section({
  id,
  number,
  label,
  title,
  titleHidden,
  breaker,
  lift,
  space = 'm',
  pin = 2,
  stage,
  className,
  children,
}: Props) {
  const titleId = `${id}-title`
  const head = (
    <>
      {breaker && <NumeralBreaker value={number} />}
      <SectionIndex number={number} label={label} className="col-index" />
      {titleHidden ? (
        // For screen readers only: nothing to reveal.
        <h2 id={titleId} className="section-title t-h2 col-content sr-only">
          {title}
        </h2>
      ) : (
        <Reveal as="h2" kind="lines" id={titleId} className="section-title t-h2 col-content">
          {title}
        </Reveal>
      )}
    </>
  )
  return (
    <section
      id={id}
      className={cx('page-section spread-grid', `space-${space}`, titleHidden && 'title-hidden', className)}
      data-section={id}
      data-breaker={lift ? '' : undefined}
      aria-labelledby={titleId}
      style={{ '--index-rows': pin } as CSSProperties}
    >
      {stage ? (
        <div className="section-track" data-stage-track="">
          <div className="section-stage" data-stage="">
            {head}
            {stage}
          </div>
        </div>
      ) : (
        head
      )}
      {children}
    </section>
  )
}
