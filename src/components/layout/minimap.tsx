import { getContent, pad2 } from '@/lib/content'
import { cx } from '@/lib/cx'
import { MinimapObserver } from './minimap-observer'

export type MinimapSection = { id: string; label: string }

type Props = {
  /** Sections in page order; each id is the id of a [data-section] element. */
  sections: MinimapSection[]
  /** Accessible name (default: site.labels.sections). */
  label?: string
  className?: string
}

/*
 * Section ticks fixed at the right edge from 1024 px; nothing below (the
 * reading hairline is the mobile progress indicator). One focusable link per
 * section; its label ("01 Context") shows beside the tick on hover and focus.
 * The tick of the section in view gets aria-current="location"
 * (MinimapObserver, IntersectionObserver). Contract: docs/contracts.md#minimap.
 */
export async function Minimap({ sections, label, className }: Props) {
  const { site } = await getContent()
  return (
    <nav className={cx('minimap', className)} aria-label={label ?? site.labels.sections} data-minimap="">
      <ol>
        {sections.map((s, i) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="minimap-tick" data-minimap-tick={s.id}>
              <span className="minimap-label t-label">
                <span className="minimap-number">{pad2(i + 1)}</span> {s.label}
              </span>
            </a>
          </li>
        ))}
      </ol>
      <MinimapObserver />
    </nav>
  )
}
