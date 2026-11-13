/*
 * Type scale. Typed mirror of the custom properties in src/styles/type.css
 * (change both together). Sizes are fluid: `min` px at a 390 px viewport,
 * `max` px at 1440 px, linear in between (clamp()).
 * Contract: docs/contracts.md#type-tokens.
 */

export const fluidRange = { from: 390, to: 1440 } as const

export type TypeFamily = 'display' | 'text' | 'mono'

export type TypeStyle = {
  family: TypeFamily
  weight: number
  /** Bricolage optical size (display family only). */
  opsz?: number
  size: { min: number; max: number }
  /** px when fixed, unitless when relative to the size. */
  leading: number | { px: number }
  /** em */
  tracking?: number
  uppercase?: boolean
  /** Max line length (ch). */
  measure?: number
}

export const type = {
  label: {
    family: 'mono',
    weight: 500,
    size: { min: 11, max: 12 },
    leading: { px: 16 },
    tracking: 0.08,
    uppercase: true,
  },
  body: { family: 'text', weight: 400, size: { min: 17, max: 19 }, leading: { px: 28 }, measure: 62 },
  lead: { family: 'text', weight: 400, size: { min: 21, max: 28 }, leading: { px: 32 } },
  h3: { family: 'display', weight: 600, opsz: 24, size: { min: 22, max: 32 }, leading: 1.15, tracking: -0.01 },
  h2: { family: 'display', weight: 600, opsz: 72, size: { min: 36, max: 72 }, leading: 1.04, tracking: -0.02 },
  display: {
    family: 'display',
    weight: 700,
    opsz: 96,
    size: { min: 56, max: 168 },
    leading: 0.92,
    tracking: -0.03,
  },
  /** Outlined variant: class .t-numeral-outline (transparent fill, 1 px stroke in currentColor). */
  numeral: {
    family: 'display',
    weight: 300,
    opsz: 96,
    size: { min: 88, max: 240 },
    leading: 0.8,
    tracking: -0.04,
  },
} as const satisfies Record<string, TypeStyle>

export type TypeName = keyof typeof type

/** The clamp() expression type.css uses for a size (rem-based so it follows the browser font size). */
export function fluid(min: number, max: number) {
  const slope = (max - min) / (fluidRange.to - fluidRange.from)
  const intercept = min - slope * fluidRange.from
  const rem = (px: number) => `${+(px / 16).toFixed(4)}rem`
  return `clamp(${rem(min)}, ${rem(intercept)} + ${+(slope * 100).toFixed(4)}vw, ${rem(max)})`
}

/** Class names in type.css. */
export const typeClasses = {
  label: 't-label',
  body: 't-body',
  lead: 't-lead',
  h3: 't-h3',
  h2: 't-h2',
  display: 't-display',
  numeral: 't-numeral',
  numeralOutline: 't-numeral-outline',
} as const
