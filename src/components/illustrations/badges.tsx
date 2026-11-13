import { Text } from './frame'
import { CH, roundRect } from './geometry'

const HEIGHT = 20
const PAD = 10
const GAP = 6

/** Width in px of one badge (uppercase label in a pill). */
export const badgeWidth = (label: string) => Math.round(label.length * CH.cat - 0.88 + PAD * 2)

/** Splits badges into rows no wider than `max` px. */
function rows(labels: readonly string[], max: number): string[][] {
  const out: string[][] = []
  let row: string[] = []
  let width = 0
  for (const label of labels) {
    const w = badgeWidth(label)
    if (row.length && width + GAP + w > max) {
      out.push(row)
      row = []
      width = 0
    }
    width += (row.length ? GAP : 0) + w
    row.push(label)
  }
  if (row.length) out.push(row)
  return out
}

/** Height in px of a badge block. */
export const badgesHeight = (labels: readonly string[], max: number) => {
  const n = rows(labels, max).length
  return n * HEIGHT + (n - 1) * GAP
}

/**
 * Badges in px space (inside a Pin): pills with an uppercase label, wrapped into rows of at most
 * `max` px. `align` start: rows start at x 0; middle: rows centre on x 0. Top edge at y 0.
 */
export function Badges({
  labels,
  max,
  align = 'start',
}: {
  labels: readonly string[]
  max: number
  align?: 'start' | 'middle'
}) {
  return (
    <>
      {rows(labels, max).map((row, r) => {
        const widths = row.map(badgeWidth)
        const total = widths.reduce((a, b) => a + b, 0) + GAP * (row.length - 1)
        let x = align === 'middle' ? -total / 2 : 0
        const y = r * (HEIGHT + GAP)
        return row.map((label, i) => {
          const w = widths[i]
          const left = x
          x += w + GAP
          return (
            <g key={`${r}-${i}`}>
              <path d={roundRect(left, y, w, HEIGHT, HEIGHT / 2)} data-draw-fill="" />
              <path d={roundRect(left, y, w, HEIGHT, HEIGHT / 2)} pathLength="1" data-draw="" />
              <Text text={label} dx={left + w / 2} dy={y + HEIGHT / 2} anchor="middle" valign="middle" cat />
            </g>
          )
        })
      })}
    </>
  )
}
