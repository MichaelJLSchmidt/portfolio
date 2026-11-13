/*
 * Logo lab: the data model. One Concept holds everything about a mark: its
 * geometry (as a small SVG node tree per variant) and its animation (as
 * tracks). The same tree renders the inline React SVG (mark.tsx) and the
 * standalone SVG / PNG downloads (svg-string.ts), so they cannot drift apart.
 *
 * Placeholders inside attribute values, resolved by each renderer:
 *   @neutral    neutral paint   React: currentColor                 file: baked hex
 *   @accent     accent paint    React: var(--accent, currentColor)  file: baked hex
 *   @id:<name>  unique id       React: per-instance prefix          file: fixed prefix
 */

export type AttrValue = string | number
export type Attrs = Record<string, AttrValue | undefined>
export type SvgNode = { tag: string; attrs?: Attrs; children?: SvgNode[] }

export const NEUTRAL = '@neutral'
export const ACCENT = '@accent'
export const idOf = (name: string) => `@id:${name}`
export const urlOf = (name: string) => `url(#@id:${name})`

/** Lockup metrics in viewBox units: cap line, baseline, the stem (stroke) the wordmark should match. */
export type Metrics = { cap: number; base: number; stem: number }

/** A viewBox. */
export type Box = { x: number; y: number; w: number; h: number }

export type Variant = {
  label: string
  /** Own viewBox for marks that are not square (concept 8); default 0 0 48 48. */
  box?: Box
  /** Static helpers: clip paths, masks. */
  defs?: SvgNode[]
  /** The mark, back to front. Animated parts carry data-part. */
  body: SvgNode[]
  metrics: Metrics
  /**
   * Optical centring: whole units the mark moves from its mathematical centre
   * (masters only; favicons stay on the 3-unit pixel grid).
   */
  nudge?: [dx: number, dy: number]
}

/** The lab's three curves (none of the site tokens fits), plus linear for loops. */
export type Ease = 'enter' | 'move' | 'exit' | 'linear'

/** WAAPI keyframes on one part. Colour values may use @neutral / @accent (resolved at play time). */
export type CssTrack = {
  kind?: 'css'
  part: string
  at: number
  dur: number
  ease?: Ease
  frames: Keyframe[]
  /** transform-origin in user units ("30px 24px", view-box) or box percentages with box: 'fill-box'. */
  origin?: string
  box?: 'view-box' | 'fill-box'
}

/** An attribute interpolated number by number between strings of the same structure (path morphs). */
export type MorphTrack = {
  kind: 'morph'
  part: string
  at: number
  dur: number
  ease?: Ease
  attr: 'd'
  values: string[]
}

export type Track = CssTrack | MorphTrack
export type Seq = Track[]

/** full: as designed; calm: its own (fewer moving parts), the engine scales it × 0.6; null = static. */
export type Moment = { label: string; full: Seq; calm: Seq | null }

export type ConceptMotion = {
  reveal: Moment
  /** Alternative reveal (concept 1: thin to bold). */
  alt?: Moment
  /** The concept's own extra moment. */
  extra: Moment
  /** Played forwards on hover / focus, backwards on leave. */
  hover: Moment
  /** One 1600 ms cycle; first and last frame are the static mark, so it can stop at any cycle end. */
  loading: Moment
  /** Ends hidden; the engine brings the static mark back afterwards. */
  exit: Moment
}

export type VariantKey = 'master' | 'favicon' | 'letterless' | 'light' | 'drawn' | 'matched'

export type Concept = {
  /** URL and storage id: ?c=<id>. Stable across rounds. */
  id: string
  /** Shown in the lab and in names: "3B". */
  label: string
  /** localStorage key of the scorecard; a new key resets the scores when the geometry changes. */
  scoreKey: string
  slug: string
  name: string
  /** The one idea, in a sentence. */
  idea: string
  /** data-part names, back to front. */
  parts: string[]
  /** Parts painted with the accent. */
  accent: string[]
  variants: { master: Variant; favicon: Variant } & Partial<Record<VariantKey, Variant>>
  motion: ConceptMotion
  /** Design notes shown in the detail view: corrections and deviations from the brief. */
  notes: string[]
}

export const conceptLabel = (c: Pick<Concept, 'label' | 'name'>) => `Logo concept ${c.label}, ${c.name}`
/** monogram-01-shared-stem, monogram-03b-two-cards-dynamic-f */
export const fileStem = (c: Pick<Concept, 'label' | 'slug'>) => {
  const n = c.label.toLowerCase()
  return `monogram-${/^\d(\D|$)/.test(n) ? `0${n}` : n}-${c.slug}`
}
