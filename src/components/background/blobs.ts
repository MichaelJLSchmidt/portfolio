/*
 * The field's blob: its brightest soft pool (the mid colour with a touch of glow), drawn by the
 * shader (shader.ts, uBlob / uBlobR) and by the CSS twin (src/styles/field.css, .field-layer::after).
 * Six variants in one visual language: the same Gaussian softness and colours, axes between 0.34
 * and 0.52 of the viewport height, differing in place, shape and orientation. Variant 1 is the
 * blob as it always was (a round pool centre left), so the resting field is unchanged until a card
 * is hovered or focused; then the field moves to another variant at random, never the same one
 * twice in a row (field-engine.ts). A switch only moves the blob (its position, rotation and axes:
 * a transform) and, under reduced motion, fades it out and in (its opacity).
 *
 * Units: `x`, `y` the centre in viewport fractions (y down); `rx`, `ry` the Gaussian radii along
 * the blob's own axes in viewport heights (the shader's units); `deg` the rotation, clockwise.
 * The lab's design inventory lists each one by `id` (background.blob.<id>).
 */
export type BlobVariant = {
  id: string
  name: string
  x: number
  y: number
  rx: number
  ry: number
  deg: number
}

export const blobVariants = [
  { id: 'centre-left', name: '1 · Centre left, round (the original)', x: 0.34, y: 0.52, rx: 0.42, ry: 0.42, deg: 0 },
  { id: 'upper-wide', name: '2 · Upper centre, wide', x: 0.54, y: 0.32, rx: 0.5, ry: 0.34, deg: -10 },
  { id: 'lower-right-tilt', name: '3 · Lower right, tilted', x: 0.7, y: 0.66, rx: 0.46, ry: 0.36, deg: 28 },
  { id: 'left-tall', name: '4 · Left, tall', x: 0.2, y: 0.46, rx: 0.36, ry: 0.5, deg: 8 },
  { id: 'centre-diagonal', name: '5 · Centre, diagonal', x: 0.5, y: 0.5, rx: 0.52, ry: 0.35, deg: -34 },
  { id: 'upper-left-oval', name: '6 · Upper left, soft oval', x: 0.28, y: 0.3, rx: 0.44, ry: 0.38, deg: 18 },
] as const satisfies readonly BlobVariant[]

/** The original blob's radius: the CSS twin scales its pool by rx / ry against it. */
export const blobBaseRadius = blobVariants[0].rx

/** A random variant index other than `current`. */
export function nextBlob(current: number, random = Math.random): number {
  const pick = Math.floor(random() * (blobVariants.length - 1))
  return pick >= current ? pick + 1 : pick
}

/** `deg` moved by whole half-turns to lie within 90° of `from` (an ellipse looks the same turned 180°). */
export function nearestTurn(deg: number, from: number): number {
  return deg + 180 * Math.round((from - deg) / 180)
}
