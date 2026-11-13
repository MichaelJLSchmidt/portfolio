import { numerals } from '@/content/generated/numerals'
import { cx } from '@/lib/cx'

type Props = {
  /** The digits to draw ("05"). */
  value: string
  className?: string
}

/*
 * A chapter numeral as outlines (src/content/generated/numerals.ts, built by
 * scripts/build-numerals.mjs from Bricolage Grotesque at the numeral's weight
 * and optical size): one <path pathLength="1"> per contour, a 1 CSS px stroke
 * in currentColor, no fill. It takes the place of the text-stroke numeral at the
 * same size and position: 0.8em high (the numeral's line box) at the numeral
 * size, the digits on the text's baseline and advance, -0.04em apart.
 *
 * Drawn by the `draw` reveal (its root is a NumeralBreaker): each contour is its
 * own group (data-draw-group), the left digit's first, 60 ms apart
 * (stagger.contours), 1.2 s each. The stroke width in user units (one CSS px at
 * the rendered size, --numeral-stroke) is kept up to date by
 * src/motion/numeral-stroke.ts. Decorative: the section index carries the
 * number as text.
 */
export function ChapterNumeral({ value, className }: Props) {
  const glyphs = [...value].map((c) => numerals.digits[c as keyof typeof numerals.digits]).filter(Boolean)
  const step = (g: (typeof glyphs)[number]) => g.advance + numerals.tracking
  const width = glyphs.reduce((w, g) => w + step(g), 0)
  let x = 0
  let group = 0
  return (
    <svg
      className={cx('chapter-numeral', className)}
      viewBox={`0 0 ${width} ${numerals.lineHeight}`}
      aria-hidden="true"
      focusable="false"
      data-numeral-svg=""
    >
      {glyphs.map((g, i) => {
        const at = x
        x += step(g)
        return (
          <g key={i} transform={at ? `translate(${at} 0)` : undefined}>
            {g.contours.map((d, j) => (
              <g key={j} data-draw-group={++group}>
                <path d={d} pathLength={1} data-draw="" />
              </g>
            ))}
          </g>
        )
      })}
    </svg>
  )
}
