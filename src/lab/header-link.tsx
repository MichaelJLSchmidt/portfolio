import Link from 'next/link'
import type { CSSProperties } from 'react'
import { NAV } from '@/motion/transitions'

/*
 * The header's temporary Lab item (src/components/header.tsx), next to About. It takes About's
 * class from the header (the tray's 44 px text link, styles/link.css's marker, line and triangle,
 * the current-page line, the phone padding), so it looks and behaves like About; a dashed capsule
 * around it marks it as an internal tool. English on both locales.
 *
 * NEXT_PUBLIC_LAB is "1" only while the site is not public (next.config.ts). In a public build
 * the export is the constant null: the header renders nothing and the minifier drops this
 * component, its words and its styles. Its styles are inline for that reason: a rule in a shared
 * stylesheet would still ship, and so would a shared module (the path is spelled here and in
 * ./pages.ts, which checks that the two agree).
 */
type Props = {
  /** About's class (header.module.css). */
  className: string
  /** The header's locale link builder ("/lab" -> "/de/lab"). */
  href: (path: string) => string
  /** aria-current for a page path, as About gets it. */
  current: (path: string) => 'page' | undefined
}

export const LabLink =
  process.env.NEXT_PUBLIC_LAB === '1'
    ? function LabLink({ className, href, current }: Props) {
        const path = '/lab'
        const capsule: CSSProperties = {
          outline: '1px dashed color-mix(in srgb, var(--text) 38%, transparent)',
          outlineOffset: '-7px',
          borderRadius: '999px',
        }
        return (
          <li style={capsule} data-lab-link="">
            <Link
              href={href(path)}
              className={className}
              transitionTypes={[NAV]}
              // Not prefetched: a gated visitor's pages load nothing of the lab until it is opened.
              prefetch={false}
              aria-current={current(path)}
              title="Internal tools (not in public builds)"
              lang="en"
            >
              <span className="link link-standalone">Lab</span>
              <span className="sr-only"> (internal tools)</span>
            </Link>
          </li>
        )
      }
    : null
