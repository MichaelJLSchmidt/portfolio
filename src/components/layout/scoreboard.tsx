import type { Metric } from '@/lib/content'
import { Reveal } from '../reveals'
import { cx } from '@/lib/cx'

type Props = {
  /** Up to five metrics. */
  metrics: Metric[]
  label?: string
  className?: string
}

/*
 * Metrics in a row: five across from 1024 px, two below. Values in Martian
 * Mono (tabular digits), each character in its own [data-digit] span for the
 * "digits" reveal, grouped by word (.scoreboard-word) so a long value such as
 * "3 weeks → 4 days" wraps between words on a phone and never widens the
 * page; screen readers get the plain value once.
 * Contract: docs/contracts.md#scoreboard.
 */
export function Scoreboard({ metrics, label, className }: Props) {
  if (metrics.length === 0) return null
  return (
    <Reveal
      as="dl"
      kind="digits"
      className={cx('scoreboard', className)}
      aria-label={label}
      data-count={metrics.length}
    >
      {metrics.map((m) => (
        <div key={m.label} className="scoreboard-item">
          <dt className="scoreboard-label t-label">{m.label}</dt>
          <dd className="scoreboard-value">
            <span className="sr-only">
              {m.value}
              {m.unit ? ` ${m.unit}` : ''}
            </span>
            <span className="scoreboard-digits" aria-hidden="true" data-digits="">
              {m.value
                .split(' ')
                .filter(Boolean)
                .map((word, w) => (
                  <span key={w} className="scoreboard-word">
                    {[...word].map((ch, i) => (
                      <span key={i} data-digit="">
                        {ch}
                      </span>
                    ))}
                  </span>
                ))}
              {m.unit && <span className="scoreboard-unit">{m.unit}</span>}
            </span>
          </dd>
        </div>
      ))}
    </Reveal>
  )
}
