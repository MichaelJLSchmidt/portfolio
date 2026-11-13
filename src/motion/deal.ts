import { bezier } from './choreography'
import { deal, dur, ease, stagger } from './tokens'

/*
 * Dealing hand cards from the dealer (off screen, bottom right): the
 * first-visit intro (at.firstLoad.cards: 330 ms each, 140 ms apart), New hand
 * (Mulligan) and the Coffee card (420 ms outExpo, 80 ms apart). Each card flies
 * face down and turns face up on the way.
 */

/** Hand cards currently laid out in the fan (not the ghost of an open card). */
export const fanCards = () =>
  [...document.querySelectorAll<HTMLElement>('.hand-fan .hand-card')].filter(
    (c) => c.getClientRects().length > 0 && !c.hasAttribute('aria-current'),
  )

/** Where cards are dealt from: off screen, bottom right (the dealer's side), relative to a card's slot. */
export function dealOffset(card: HTMLElement) {
  const slot = card.parentElement!.getBoundingClientRect()
  return [
    innerWidth + slot.width - (slot.left + slot.width / 2),
    innerHeight + slot.height * deal.below - (slot.top + slot.height / 2),
  ]
}

/**
 * Deals `cards` from off screen, starting `start` seconds from now (full tier; callers check):
 * each takes `timing.dur` s, `timing.stagger` s apart (default: dur.m, stagger.cards).
 */
export function drawCards(
  cards: HTMLElement[],
  start: number,
  timing: { dur: number; stagger: number } = { dur: dur.m, stagger: stagger.cards },
) {
  return cards.map((card, i) => {
    const cs = getComputedStyle(card)
    const rest = {
      translate: cs.translate === 'none' ? '0px 0px' : cs.translate,
      rotate: cs.rotate === 'none' ? '0deg' : cs.rotate,
    }
    const [dx, dy] = dealOffset(card)
    const p = `perspective(${deal.flipPerspective}px)`
    card.dataset.drawn = ''
    return card.animate(
      [
        { translate: `${dx}px ${dy}px`, rotate: `${deal.toss}deg`, transform: `${p} rotateY(180deg)`, opacity: 1 },
        { ...rest, transform: `${p} rotateY(0deg)`, opacity: 1 },
      ],
      {
        duration: timing.dur * 1000,
        delay: (start + i * timing.stagger) * 1000,
        easing: bezier(ease.draw),
        fill: 'backwards',
      },
    )
  })
}

/** Reduced: the hand fades in instead of flying (same order); all values in ms. */
export function fadeCards(cards: HTMLElement[], duration: number, gap: number, start = 0) {
  return cards.map((card, i) => {
    card.dataset.drawn = ''
    return card.animate([{ opacity: 0 }, { opacity: 1 }], { duration, delay: start + i * gap, fill: 'backwards' })
  })
}
