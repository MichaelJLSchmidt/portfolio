/*
 * Illustration contract (docs/contracts.md#illustrations). Every illustration
 * is a static inline SVG with a <title>, a <desc> and drawing groups:
 *   - strokes use currentColor (the page's --accent), never a hard-coded colour
 *   - every stroke element that draws on has pathLength="1" and data-draw
 *   - strokes are grouped in <g data-draw-group="1"> ... <g data-draw-group="n">, in reading order
 *   - tint fills (8% of the accent) carry data-draw-fill, labels data-draw-label
 * The Motion session animates [data-draw] by group; the SVG itself never animates.
 * Drawing conventions and responsive layouts: README.md in this folder.
 */

/**
 * Which layout a drawing with a vertical variant renders. `auto` (default) renders both and lets
 * CSS pick: vertical below 640 px viewport width, horizontal from 640 px. `horizontal` and
 * `vertical` render only that layout (for placements whose width is known, e.g. a narrow column).
 */
export type IllustrationVariant = 'auto' | 'horizontal' | 'vertical'

export type IllustrationProps = {
  className?: string
  /** id for the <title> (aria-labelledby). Default: unique per instance (useId). */
  titleId?: string
  /** Replaces the default <title> text (short name of the drawing). */
  title?: string
  /** Replaces the default <desc> text (what the drawing shows, one or two sentences). */
  description?: string
  /** Layout choice for drawings with a vertical variant; ignored by the others. */
  variant?: IllustrationVariant
}

/** Project types, one glyph each (ProjectTypeGlyph; not placed since More projects became a plain list on About). */
export const projectTypes = ['form', 'map', 'dashboard', 'portal', 'calendar', 'checklist'] as const
export type ProjectType = (typeof projectTypes)[number]

export type ProjectTypeGlyphProps = IllustrationProps & { type: ProjectType }

/** Workshop methods with a glyph (WorkshopGlyph / WorkshopGlyphs). */
export const workshopMethods = ['crazy-eights', 'one-two-four-all', 'dot-voting', 'fishbowl'] as const
export type WorkshopMethod = (typeof workshopMethods)[number]

/** Every illustration in the registry (component names). */
export const illustrationNames = [
  'TeamGrowthTimeline',
  'IntakeBeforeAfter',
  'DesignSystemLayers',
  'ContributionLoop',
  'AdoptionBars',
  'ServiceBlueprint',
  'JourneyEmotionCurve',
  'TeamConstellation',
  'WeekRing',
  'CareerMatrix',
  'WorkshopGlyphs',
  'ProjectTypeGlyph',
  'DiscardedCard',
] as const
export type IllustrationName = (typeof illustrationNames)[number]

/** Illustrations content can reference by name (all but the per-row project glyph). */
export type ContentIllustration = Exclude<IllustrationName, 'ProjectTypeGlyph'>
