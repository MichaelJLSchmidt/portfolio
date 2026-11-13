'use client'

import { type CSSProperties, type ReactNode, useRef } from 'react'
import { useChrome } from '@/lib/chrome'
import type { WorkshopFormat } from '@/lib/content'
import { pad2 } from '@/lib/format'
import { cx } from '@/lib/cx'
import { useDealPosition } from './use-deal-position'

type Props = {
  formats: WorkshopFormat[]
  /** One drawing per format (its WorkshopGlyph), rendered by the server page so no illustration code ships here. */
  glyphs?: ReactNode[]
  className?: string
}

/*
 * Management's workshop formats as a row of cards with DealRow's look: a
 * static row on desktop and a scroll-snap row with its "n / N" label below
 * 1024 px. No pinned scene: Management already pins its team structure, and
 * the deal scene (useDealScene) belongs to the case-study decisions only.
 * Each card: number and glyph, name, then duration, who and outcome under
 * site.labels.workshop.
 */
export function WorkshopRow({ formats, glyphs, className }: Props) {
  const list = useRef<HTMLOListElement>(null)
  const position = useRef<HTMLParagraphElement>(null)
  useDealPosition(list, position)
  const labels = useChrome().site.labels.workshop
  return (
    <div
      className={cx('deal-row deal-row-workshops', className)}
      style={{ '--deal-count': formats.length } as CSSProperties}
    >
      <ol ref={list} className="deal-row-list">
        {formats.map((f, i) => (
          <li key={i} className="deal-card" data-deal-card={i + 1}>
            <div className="deal-card-index t-label">
              <span className="deal-card-number">{pad2(i + 1)}</span>
              {glyphs?.[i] && <span className="deal-card-glyph">{glyphs[i]}</span>}
            </div>
            <h3 className="deal-card-title t-h3">{f.name}</h3>
            <dl className="deal-card-fields">
              <div className="deal-card-field">
                <dt className="t-label">{labels.duration}</dt>
                <dd>{f.duration}</dd>
              </div>
              <div className="deal-card-field">
                <dt className="t-label">{labels.who}</dt>
                <dd>{f.who}</dd>
              </div>
              <div className="deal-card-field">
                <dt className="t-label">{labels.outcome}</dt>
                <dd>{f.outcome}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
      <p ref={position} className="deal-row-position t-label" aria-hidden="true" data-deal-position="">
        1 / {formats.length}
      </p>
    </div>
  )
}
