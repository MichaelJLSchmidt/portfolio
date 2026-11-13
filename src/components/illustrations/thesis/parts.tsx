import { chevron, type Pt, poly, roundRect } from '../geometry'

/*
 * Small shared pieces of the thesis drawings (the site's line style: strokes draw with
 * pathLength="1" / data-draw, tints are data-draw-fill, no dashes so the draw reveal stays clean).
 */

/** A card shape (the hand's ratio) centred on (x, y), `w` wide, optionally tinted. */
export function CardShape({ x, y, w, tint }: { x: number; y: number; w: number; tint?: boolean }) {
  const h = (w * 7) / 5
  const d = roundRect(x - w / 2, y - h / 2, w, h, w * 0.12)
  return (
    <>
      {tint && <path d={d} stroke="none" fill="currentColor" data-draw-fill="" />}
      <path d={d} pathLength={1} data-draw="" />
    </>
  )
}

/** A straight arrow from `a` to `b` with an open head at `b`. */
export function Arrow({ a, b, faint }: { a: Pt; b: Pt; faint?: boolean }) {
  const deg = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
  const cls = faint ? 'il-faint' : undefined
  return (
    <>
      <path d={poly([a, b])} className={cls} pathLength={1} data-draw="" />
      <path d={chevron(b, deg, 8)} className={cls} pathLength={1} data-draw="" />
    </>
  )
}

/** A person: an open dot. */
export function Person({ x, y, r = 10, tint }: { x: number; y: number; r?: number; tint?: boolean }) {
  return (
    <>
      {tint && <circle cx={x} cy={y} r={r} stroke="none" fill="currentColor" data-draw-fill="" />}
      <circle cx={x} cy={y} r={r} pathLength={1} data-draw="" />
    </>
  )
}
