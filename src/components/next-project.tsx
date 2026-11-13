import { cardNumber, getContent, pad2 } from '@/lib/content'
import { cx } from '@/lib/cx'
import { SWITCH } from '@/motion/transitions'
import { CardFace } from './hand/card-face'
import { PlayLink } from './play-link'
import { Reveal } from './reveals'

/**
 * "Next": the next card of the hand (or `next`), lying face up on the table,
 * with its title set large beside it. It plays that card (a switch: the same
 * lift and morph as the hand). Place it as a grid item (.col-content).
 */
export async function NextProject({
  current,
  next: nextId,
  className,
}: {
  current: string
  next?: string
  className?: string
}) {
  const { cardById, handCards, nextCard } = await getContent()
  const next = cardById(nextId) ?? nextCard(current)
  return (
    <Reveal kind="block" className={cx('next-project', className)}>
      <PlayLink id={next.id} href={next.href} className="next-card" transitionTypes={[SWITCH]}>
        <span className="next-card-face" aria-hidden="true">
          <CardFace card={next} named={false} />
        </span>
        <span className="next-card-text">
          <span className="next-card-meta t-label">
            <span className="next-card-index">{cardNumber(next.index)}</span> / {pad2(handCards.length)} ·{' '}
            {next.projectType}
          </span>
          <span className="next-card-title t-h2">{next.title}</span>
        </span>
      </PlayLink>
    </Reveal>
  )
}
