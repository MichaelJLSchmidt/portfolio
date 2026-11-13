import { Fragment, type CSSProperties } from 'react'
import { opsz as opszTokens, weight } from '@/motion/tokens'

type Props = {
  text: string
  /** Weight the text settles at; every word box is reserved at this weight. */
  final: keyof typeof weight
  /** Optical size the text settles at (reserved too). */
  opsz?: number
  className?: string
}

/**
 * Build-time word splitting for headline animation (see .wt in type.css).
 * Screen readers get the plain string once; the word-by-word copy is
 * aria-hidden. Each word box is reserved at its final weight and optical size.
 */
export function WeightText({ text, final, opsz = opszTokens.end, className = '' }: Props) {
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <>
      <span className="sr-only">{text}</span>
      <span
        className={`wt ${className}`}
        aria-hidden="true"
        data-wt=""
        style={{ '--wght-final': weight[final], '--opsz-final': opsz } as CSSProperties}
      >
        {words.map((word, i) => (
          <Fragment key={i}>
            {i > 0 && ' '}
            <span className="wt-word" data-text={word} style={{ '--wt-i': i } as CSSProperties}>
              <span>{word}</span>
            </span>
          </Fragment>
        ))}
      </span>
    </>
  )
}
