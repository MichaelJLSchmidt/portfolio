'use client'

import { useRef } from 'react'
import { useChrome } from '@/lib/chrome'
import type { Decision, Decisions } from '@/lib/content'
import { pad2 } from '@/lib/format'
import { useDealScene } from '@/motion/scenes/deal-scene'
import { cx } from '@/lib/cx'
import { useDealPosition } from './use-deal-position'

type Props = {
  /** Exactly four decisions. */
  decisions: Decisions
  /** Field labels (default: site.labels.decision). */
  labels?: Record<keyof Decision, string>
  className?: string
}

/*
 * Four decision cards (decision / chose / trade-off / why). From 1024 px a
 * stage with the four cards in one row; the Motion session pins and deals it
 * through useDealScene(ref, { cards: 4 }) on [data-scene="deal"], and the
 * static row stays correct while the hook is a no-op. Below 1024 px a
 * full-bleed horizontal scroll-snap row with a "1 / 4" label that follows the
 * snapped card (useDealPosition, D5). Contract: docs/contracts.md#dealrow.
 */
export function DealRow({ decisions, labels: own, className }: Props) {
  const { site } = useChrome()
  const labels = own ?? site.labels.decision
  const ref = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const position = useRef<HTMLParagraphElement>(null)
  const { active } = useDealScene(ref, { cards: 4 })
  useDealPosition(list, position)
  return (
    <div ref={ref} className={cx('deal-row', className)} data-scene="deal" data-scene-active={active ? '' : undefined}>
      <ol ref={list} className="deal-row-list">
        {decisions.map((d, i) => (
          <li key={i} className="deal-card" data-deal-card={i + 1}>
            <p className="deal-card-index t-label">
              <span>{labels.decision}</span>
              <span className="deal-card-number">{pad2(i + 1)}</span>
            </p>
            <h3 className="deal-card-title t-h3">{d.decision}</h3>
            <dl className="deal-card-fields">
              <div>
                <dt className="t-label">{labels.chose}</dt>
                <dd>{d.chose}</dd>
              </div>
              <div>
                <dt className="t-label">{labels.tradeOff}</dt>
                <dd>{d.tradeOff}</dd>
              </div>
              <div>
                <dt className="t-label">{labels.why}</dt>
                <dd>{d.why}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
      <p ref={position} className="deal-row-position t-label" aria-hidden="true" data-deal-position="">
        1 / {decisions.length}
      </p>
    </div>
  )
}
