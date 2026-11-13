import type { Metadata } from 'next'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { DEEP_LINK_SCRIPT } from '@/lab/logo/deep-link'
import { LogoLab } from '@/lab/logo/ui/logo-lab'
import { setRequestLocale } from '@/lib/request-locale'
import '@/lab/logo/ui/lab.css'

/*
 * Logo lab: a temporary, unlinked page for comparing monogram concepts. Not in
 * the header, the hand, the footer or any page. Everything it uses lives in
 * src/lab/logo/ (and this folder), so deleting both folders removes it.
 */
export const metadata: Metadata = { title: 'Logo lab', robots: { index: false, follow: false } }

/*
 * A working tool, not content: under both locales (every route lives under one) but in English only,
 * marked lang="en" so the German route reads it right.
 */

export default async function LogoLabPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale)
  return (
    <PageTransition>
      <div className="lab" data-identity="ink" lang="en">
        <header className="lab-head">
          <p className="t-label lab-kicker">Temporary · not linked</p>
          <PageTitle className="lab-title t-h2">Logo lab</PageTitle>
          <p className="lab-intro t-body">
            Two directions for one monogram, M and F fused into a single glyph: the card fan (3, 3B) and the diagonal
            cut (8 to 8D). Compare them small and large, play their motion in every tier, score them and download them.
            Scores, notes and the lockup wordmark stay in this browser.
          </p>
        </header>
        {/* Before the overview is parsed: hide it on deep links until the detail view renders. */}
        <script dangerouslySetInnerHTML={{ __html: DEEP_LINK_SCRIPT }} />
        <LogoLab />
      </div>
    </PageTransition>
  )
}
