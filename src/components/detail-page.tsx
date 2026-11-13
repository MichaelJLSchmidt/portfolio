import type { ReactNode } from 'react'
import { type Metric, getContent } from '@/lib/content'
import type { HandCard } from '@/lib/hand-data'
import { CaseHero } from './case-hero'
import { type MetaPair, MetaPairs, Minimap, type MinimapSection, Scoreboard } from './layout'
import { PageTransition } from './page-transition'

type Props = {
  card: HandCard
  /** The h1 (default: the card's title). Management: "How I lead". */
  title?: string
  /** Mono label beside the hero counter. */
  label: string
  /** Case study summary, or Management's lead. */
  summary: string
  /** The hero frame's content: <Picture priority> or an illustration. */
  media: ReactNode
  mediaKind?: 'image' | 'illustration'
  /** Five pairs on case studies (client, timeframe, role, team, type); the card facts on Management. */
  meta?: MetaPair[]
  /** The Scoreboard under the pairs (case studies). */
  metrics?: Metric[]
  /** Sections for the Minimap (ids of the [data-section] blocks in children). */
  sections?: MinimapSection[]
  /** The numbered sections, each its own .spread-grid. */
  children: ReactNode
}

/*
 * Case study and Management.
 *   hero      the played card, continued (CaseHero, 72vh / 64vh)
 *   facts     MetaPairs, then the Scoreboard, across all twelve columns
 *   sections  numbered Spread-grid sections (children), ending with Next
 *   Minimap   fixed at the right edge from 1024 px
 */
export async function DetailPage({
  card,
  title,
  label,
  summary,
  media,
  mediaKind,
  meta,
  metrics,
  sections,
  children,
}: Props) {
  const { site } = await getContent()
  return (
    <PageTransition>
      <article className="detail-page" data-identity={card.identity} data-detail={card.id}>
        <CaseHero card={card} title={title} label={label} summary={summary} media={media} mediaKind={mediaKind} />
        {(meta || (metrics && metrics.length > 0)) && (
          <div className="detail-facts spread-grid">
            {meta && <MetaPairs items={meta} label={site.labels.facts} className="col-wide" />}
            {metrics && <Scoreboard metrics={metrics} className="col-wide" />}
          </div>
        )}
        {children}
        {sections && sections.length > 0 && <Minimap sections={sections} />}
      </article>
    </PageTransition>
  )
}
