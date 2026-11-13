import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DetailPage } from '@/components/detail-page'
import { Picture } from '@/components/picture'
import { caseStudySectionKeys, contentFor, getContent } from '@/lib/content'
import { heroSizes } from '@/lib/hero-images'
import { pageAlternates } from '@/lib/metadata'
import { asLocale, setRequestLocale } from '@/lib/request-locale'
import { CaseSections } from './case-sections'

export const dynamicParams = false

/** The same slugs in every locale (the build checks it). */
export function generateStaticParams({ params }: { params: { locale: string } }) {
  return contentFor(asLocale(params.locale)).caseStudies.map(({ slug }) => ({ slug }))
}

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: value, slug } = await params
  const locale = asLocale(value)
  const entry = contentFor(locale).getCaseStudy(slug)
  return entry
    ? {
        title: entry.study.title,
        description: entry.study.summary,
        alternates: pageAlternates(locale, `/work/${slug}`),
      }
    : {}
}

/**
 * A case study: the hero continues the played card, MetaPairs and the
 * Scoreboard, then 01 Context … 09 Next on the Spread grid, Minimap at the
 * right edge. One template for all three cases.
 */
export default async function CaseStudyPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const { getCaseStudy, cardById, site } = await getContent()
  const entry = getCaseStudy(slug)
  const card = cardById(slug)
  if (!entry || !card) notFound()
  const { study } = entry
  const labels = site.labels.meta
  const meta = (['client', 'timeframe', 'role', 'team', 'type'] as const).map((k) => ({
    label: labels[k],
    value: study.meta[k],
  }))
  const sections = caseStudySectionKeys.map((key) => ({ id: key, label: study.sections[key].label }))
  return (
    <DetailPage
      card={card}
      label={`${card.projectType} · ${card.year}`}
      summary={study.summary}
      media={<Picture id={study.heroImage} priority sizes={heroSizes} className="case-hero-picture hero-drift" />}
      meta={meta}
      metrics={study.metrics}
      sections={sections}
    >
      <CaseSections study={study} />
    </DetailPage>
  )
}
