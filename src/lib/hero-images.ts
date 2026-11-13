import { pictureSet } from '@/components/picture'
import type { HeroImage } from '@/motion/play'
import { contentFor } from './content'
import type { Locale } from './i18n'

/*
 * Server: the case heroes' image sources, for the hand to warm on a press (src/motion/play.ts).
 * The case page renders its hero with the same `heroSizes`, so the warmed file is the one it asks
 * for. Management's hero is a drawing (nothing to warm).
 */
export const heroSizes = '(min-width: 1440px) 66vw, (min-width: 1024px) 62vw, 92vw'

export function heroImages(locale: Locale): Record<string, HeroImage> {
  return Object.fromEntries(contentFor(locale).caseStudies.map((s) => [s.slug, pictureSet(s.heroImage, heroSizes)]))
}
