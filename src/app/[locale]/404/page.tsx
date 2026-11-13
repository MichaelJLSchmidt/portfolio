import type { Metadata } from 'next'
import Link from 'next/link'
import { DiscardedCard } from '@/components/illustrations'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { Reveal } from '@/components/reveals'
import { contentFor, getContent } from '@/lib/content'
import { asLocale, setRequestLocale } from '@/lib/request-locale'
import { RETURN } from '@/motion/transitions'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: contentFor(asLocale((await params).locale)).notFound.title }
}

/**
 * 404, once per locale (/de/404/, /en/404/): a card lies tilted on the discard
 * pile (DiscardedCard, drawn on first), "This card isn't in the deck." and the
 * way back to the table. GitHub Pages serves dist/404.html for any unknown
 * address: a small page (scripts/i18n-pages.mjs) that picks the language like
 * the root does and shows this page in it, at the unknown address.
 */
export default async function NotFound({ params }: Props) {
  setRequestLocale((await params).locale)
  const { notFound, illustrations, href } = await getContent()
  return (
    <PageTransition>
      <div className="lost spread-grid" data-identity="ink">
        <div className="lost-discard" aria-hidden="true">
          <span className="lost-zone" />
          <span className="lost-pile" />
          <Reveal kind="draw" order={0} className="lost-card">
            <DiscardedCard titleId="discarded-card-title" {...illustrations.DiscardedCard} />
          </Reveal>
        </div>
        <PageTitle className="lost-title t-display">{notFound.title}</PageTitle>
        <Reveal as="p" kind="lines" order={1} className="lost-body t-lead">
          {notFound.body}
        </Reveal>
        <p className="lost-back">
          <Link href={href('/')} className="button" transitionTypes={[RETURN]}>
            {notFound.back}
          </Link>
        </p>
      </div>
    </PageTransition>
  )
}
