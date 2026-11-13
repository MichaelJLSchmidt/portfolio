'use client'

import { useState } from 'react'
import { announce } from '@/components/live-region'
import { fill } from '@/lib/format'

type Props = {
  /** Section heading (about.onTheTable.title). */
  title: string
  /** Five mini cards: face down showing the label, flipping to the value. */
  items: { label: string; value: string }[]
  /** Announcement template, "{label}: {value}" (site.eggs.tableFlipped). */
  flipped: string
  /** id of the heading (aria-labelledby). */
  titleId?: string
}

/** About, "What's on the table": face-down mini cards; a tap turns one to its value. Copy comes in as props. */
export function OnTheTable({ title, items, flipped, titleId = 'on-table-title' }: Props) {
  const [open, setOpen] = useState<boolean[]>(() => items.map(() => false))
  return (
    <section className="on-table" aria-labelledby={titleId}>
      <h2 id={titleId} className="meta">
        {title}
      </h2>
      <ul className="on-table-list">
        {items.map((card, i) => (
          <li key={i}>
            <button
              type="button"
              className="on-table-card"
              aria-pressed={open[i]}
              data-open={open[i] ? '' : undefined}
              onClick={() => {
                setOpen((o) => o.map((v, k) => (k === i ? !v : v)))
                if (!open[i]) announce(fill(flipped, { label: card.label, value: card.value }))
              }}
            >
              <span className="on-table-back">{card.label}</span>
              <span className="on-table-front">
                <span className="on-table-name">{card.label}</span>
                <span className="on-table-line">{card.value}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
