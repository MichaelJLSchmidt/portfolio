import { contour } from '@/design/palette'

/*
 * About's contour background: the old password page's two SVGs (public/contour-bg/, unchanged)
 * and what the WebGL morph needs to draw exactly what they show, so the shader's last frame and
 * the SVG line up when one hands over to the other (field-engine.ts).
 *
 * The SVGs: viewBox 900 x 619, preserveAspectRatio xMidYMid slice (CSS cover, centred), a lake
 * fill (#8FC7E8 at 0.08), regular lines (#8A8C80 at 0.55, 1 px, non-scaling) and index lines
 * (0.9, 1.5 px), drawn in that order; the layer shows them at opacity 0.42 over the ground
 * #1B1C18, scaled 1.03 about its centre so the drift never shows an edge.
 */

/**
 * When the full SVG (100 m lines, an index line every 500 m) shows instead of the 200 m one (an
 * index line every 1000 m): the old page's media query. The one copy: the <picture> source in
 * background-field.tsx and the shader's interval (matchMedia) both read it; no CSS repeats it.
 */
export const contourQuery =
  '(min-aspect-ratio: 1536/1056) and (min-width: 1783px), (max-aspect-ratio: 1536/1056) and (min-height: 1142px)'

export const contourSvg = { poster: '/contour-bg/contours-200.svg', full: '/contour-bg/contours.svg' } as const

/** The SVGs' drawing, as the shader reproduces it. Widths in CSS px, alphas 0..1, intervals in m. */
export const contourStyle = {
  ground: contour.ground,
  line: contour.line,
  lake: contour.lake,
  lineAlpha: 0.55,
  indexAlpha: 0.9,
  lakeAlpha: 0.08,
  lineWidth: 1,
  indexWidth: 1.5,
  /** The whole SVG's opacity over the ground. */
  layerOpacity: 0.42,
  /** [interval, index interval]: the full SVG and the 200 m one. */
  levels: { full: [100, 500], poster: [200, 1000] },
  viewBox: [900, 619],
} as const

/** The interval pair for this viewport (the same query as the <picture> source). */
export function contourLevels(full: boolean): readonly [number, number] {
  return full ? contourStyle.levels.full : contourStyle.levels.poster
}
