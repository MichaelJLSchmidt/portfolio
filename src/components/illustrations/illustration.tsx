import type { ComponentType } from 'react'
import type { IllustrationCopy } from '@content/schema'
import { AdoptionBars } from './adoption-bars'
import { CareerMatrix } from './career-matrix'
import { ContributionLoop } from './contribution-loop'
import { DesignSystemLayers } from './design-system-layers'
import { DiscardedCard } from './discarded-card'
import { IntakeBeforeAfter } from './intake-before-after'
import { JourneyEmotionCurve } from './journey-emotion-curve'
import { ServiceBlueprint } from './service-blueprint'
import { TeamConstellation } from './team-constellation'
import { TeamGrowthTimeline } from './team-growth-timeline'
import type { ContentIllustration, IllustrationProps } from './types'
import { WeekRing } from './week-ring'
import { WorkshopGlyphs } from './workshop-glyphs'

/** Illustrations content can name (everything except the per-row ProjectTypeGlyph). */
export const illustrations: Record<ContentIllustration, ComponentType<IllustrationProps>> = {
  TeamGrowthTimeline,
  IntakeBeforeAfter,
  DesignSystemLayers,
  ContributionLoop,
  AdoptionBars,
  ServiceBlueprint,
  JourneyEmotionCurve,
  TeamConstellation,
  WeekRing,
  CareerMatrix,
  WorkshopGlyphs,
  DiscardedCard,
}

/**
 * Renders an illustration by its registry name (for content that names one, e.g. a section's
 * illustration), with the words of the page's locale (`copy`: content/<locale>/illustrations.ts).
 */
export function Illustration({
  name,
  copy,
  ...props
}: IllustrationProps & { name: ContentIllustration; copy?: IllustrationCopy }) {
  const Component = illustrations[name]
  return <Component {...(copy ? wordsFor(name, copy) : undefined)} {...props} />
}

/**
 * A drawing's words as its props. One entry is not plain props: WeekRing's ritual labels belong to
 * Management's ring (its page places them on days). Placed by name, it keeps its title and days.
 */
function wordsFor(name: ContentIllustration, copy: IllustrationCopy): IllustrationProps {
  if (name === 'WeekRing') {
    const { title, description, days } = copy.WeekRing
    return { title, description, days } as IllustrationProps
  }
  return copy[name] as IllustrationProps
}
