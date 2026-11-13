import type { Metadata } from 'next'

/*
 * The lab (src/lab/README.md): internal tool pages, under both locales but in English only. A
 * route group, so the pages keep their addresses (/lab/, /lab/inventory/, /logo-lab/). Every file
 * in it ends in .lab.tsx, a page extension only while the site is not public (next.config.ts):
 * a public build has none of these routes. Whatever SITE_ACCESS says, a lab page is never indexed.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return children
}
