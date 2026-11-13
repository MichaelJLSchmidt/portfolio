import { type ReactNode, ViewTransition } from 'react'
import { cardNumber } from '@/lib/format'
import type { HandCard } from '@/lib/hand-data'
import { bandName, cardName, handBandShare, handFrameShare, handTitleShare, titleName } from '@/motion/transitions'

type Props = {
  card: HandCard
  /**
   * Carry the card's view-transition names: its frame (card-<slug>), band (card-band-<slug>) and
   * title (card-title-<slug>). false renders the plain face (the Next project copy, a server
   * component).
   */
  named?: boolean
  /**
   * The names stand down while this card is in flight: its clone on the table carries them
   * (names must be unique when the view transition snapshots the page). The wrappers stay, so
   * the face is not remounted.
   */
  standDown?: boolean
  /** Layers inside the named frame, under the face (the table card's shadows). */
  layers?: ReactNode
}

/*
 * A card's face, one design at every size (it scales with container-query
 * units): index and years, an ink-on-glow band with the title and project
 * type, a one-line summary and the facts. The field colour carries a soft glow
 * from the bottom left and a 1px accent edge at 30%. Original design: no
 * frames, symbols or icons from any card game.
 *
 * In the hand the face carries the view-transition names, so it is rendered
 * once per card: the open card's slot shows the ghost instead, and the "Next
 * project" copy is unnamed. While the card flies, its clone (table-card.tsx)
 * renders the same face with the names. On the detail page the frame becomes
 * the full-screen .play-frame, the band the hero image and the title the h1
 * (case-hero.tsx).
 */
export function CardFace({ card, named = true, standDown = false, layers }: Props) {
  const on = named && !standDown
  const title = <span className="card-title">{card.title}</span>
  const band = (
    <span className="card-band">
      {named ? (
        <ViewTransition name={on ? titleName(card.id) : undefined} share={handTitleShare} default="none">
          {title}
        </ViewTransition>
      ) : (
        title
      )}
      <span className="card-type">{card.projectType}</span>
    </span>
  )
  const face = (
    <span className="card-face" data-identity={card.identity}>
      <span className="card-top" aria-hidden="true">
        <span>{cardNumber(card.index)}</span>
        <span className="card-year">{card.year}</span>
      </span>
      {named ? (
        <ViewTransition name={on ? bandName(card.id) : undefined} share={handBandShare} default="none">
          {band}
        </ViewTransition>
      ) : (
        band
      )}
      <span className="card-summary" aria-hidden="true">
        {card.inspect}
      </span>
      <span className="card-facts" aria-hidden="true">
        {card.facts.map((f) => (
          <span key={f.label} className="card-fact">
            <span className="card-fact-label">{f.label}</span>
            <span>{f.value}</span>
          </span>
        ))}
      </span>
      {/* Tap egg: the line on the long edge, readable once the card is turned sideways (announced). */}
      <span className="card-tapline" aria-hidden="true">
        {card.tapLine}
      </span>
    </span>
  )
  if (!named) return face
  const frame = layers ? (
    <span className="card-body">
      {layers}
      {face}
    </span>
  ) : (
    face
  )
  return (
    <ViewTransition name={on ? cardName(card.id) : undefined} share={handFrameShare} default="none">
      {frame}
    </ViewTransition>
  )
}

/** The back of a card: fine diagonal lines in a thin inner frame, with a small two-card mark. */
export function CardBack() {
  return <span className="card-back" aria-hidden="true" />
}
