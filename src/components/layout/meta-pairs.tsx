import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Reveal } from '../reveals'

export type MetaPair = { label: string; value: ReactNode }

type Props = {
  /** Five pairs on case studies (client, timeframe, role, team, type). */
  items: MetaPair[]
  /** Accessible name of the list. */
  label?: string
  className?: string
}

/*
 * A ruled row of key / value pairs: five across from 1024 px, two columns
 * below. Keys in the label token. Each pair is a `pair` reveal (step "meta"):
 * in the detail hero's first viewport they join its sequence left to right
 * (rule, then label, then value); below the fold they reveal on scroll. The
 * rule is its own element (aria-hidden) so it can draw.
 * Contract: docs/contracts.md#metapairs.
 */
export function MetaPairs({ items, label, className }: Props) {
  return (
    <dl className={cx('meta-pairs', className)} aria-label={label} data-count={items.length}>
      {items.map((item) => (
        <Reveal key={item.label} kind="pair" step="meta" className="meta-pair">
          <dt className="meta-pair-label t-label">
            <span className="meta-pair-rule" aria-hidden="true" data-pair-rule="" />
            <span data-pair-part="">{item.label}</span>
          </dt>
          <dd className="meta-pair-value" data-pair-part="">
            {item.value}
          </dd>
        </Reveal>
      ))}
    </dl>
  )
}
