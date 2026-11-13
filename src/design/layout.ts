/*
 * Layout tokens ("Spread" grid). Typed mirror of src/styles/layout.css: CSS is
 * what the browser uses, this file is for JavaScript that needs the same numbers
 * (hero geometry, media queries, scenes). Change both together.
 * Contract: docs/contracts.md#layout-tokens.
 */

/**
 * Min-width breakpoints in px (CSS: --breakpoint-sm/-md/-lg/-margin-notes).
 * Below `sm` is the 4-column phone grid. `marginNotes`: from here MarginNote
 * sits in column 12 + the outer track; below it renders inline.
 */
export const breakpoints = { sm: 640, md: 1024, lg: 1440, marginNotes: 1680 } as const

export type Breakpoint = 'base' | keyof typeof breakpoints

/** Media queries for matchMedia(), matching the CSS breakpoints. */
export const media = {
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  marginNotes: `(min-width: ${breakpoints.marginNotes}px)`,
} as const

/**
 * The grid per breakpoint. `margin` is the distance from the viewport edge to
 * the first column (px, or a CSS length where it is fluid); `gutter` is the gap
 * between columns.
 */
export const grid = {
  base: { columns: 4, margin: 'clamp(20px, 5.3vw, 28px)', gutter: 12 },
  sm: { columns: 8, margin: 32, gutter: 16 },
  md: { columns: 12, margin: 48, gutter: 24, index: [1, 3], content: [4, 11] },
  lg: {
    columns: 12,
    margin: 48,
    gutter: 24,
    /** Content columns grow to 96 px; the outer tracks take the rest (margin notes from 1680). */
    columnMax: 96,
    index: [1, 3],
    content: [4, 11],
    template:
      '[full-start] minmax(48px,1fr) [content-start] repeat(12, minmax(0,96px)) [content-end] minmax(48px,1fr) [full-end]',
  },
} as const

/** Baseline unit (px). Vertical rhythm is a multiple of it. */
export const baseline = 4

/** Section spacing (px): --space-s / --space-m / --space-l. Desktop from `md`. */
export const sectionSpace = {
  mobile: { s: 64, m: 96, l: 144 },
  desktop: { s: 96, m: 160, l: 240 },
} as const

/** Fixed header height (px): --header-h. */
export const headerHeight = 64

/**
 * Space kept free under the content for the hand (px): --hand-reserve.
 * Desktop: 176, or 120 while the hand is collapsed (:root[data-hand="collapsed"]).
 * Mobile (below `md`): the 48 px rail + env(safe-area-inset-bottom) + 16 px.
 */
export const handReserve = { desktop: 176, collapsed: 120, rail: 48, railExtra: 16 } as const

/** Utility classes in layout.css; pages use these instead of re-declaring the grid. */
export const gridClasses = {
  grid: 'spread-grid',
  full: 'col-full',
  wide: 'col-wide',
  index: 'col-index',
  content: 'col-content',
  margin: 'col-margin',
} as const
