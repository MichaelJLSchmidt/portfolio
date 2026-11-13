import { bezier, spanFor } from '@/motion/choreography'
import type { JobContext } from '@/motion/jobs'
import { fade } from '@/motion/kinds'
import { duration as D, angle, discard as DISCARD, ease } from '@/motion/tokens'

/*
 * 404 discard (egg, see registry.ts): the .lost-card (a draw reveal around
 * DiscardedCard) falls face down into the discard zone and comes to rest at
 * its own pose (the page tilts it with --angle-discard and nudges it off the
 * pile). Full: from above, rotation 0 → rest, 700 ms; reduced: a fade. Every
 * animation ends on the element's own style, so nothing jumps when the job
 * cancels it.
 */
export function discard(ctx: JobContext, card: HTMLElement) {
  if (ctx.tier === 'reduced') return fade(ctx, card)
  const duration = spanFor(ctx.tier, D.discard)
  const cs = getComputedStyle(card)
  const [x = '0px', y = '0px'] = cs.translate === 'none' ? [] : cs.translate.split(' ')
  const rest = { translate: `${x} ${y}`, rotate: cs.rotate === 'none' ? '0deg' : cs.rotate }
  const above = (px: number) => `${x} calc(${y} - ${px}px)`
  // A card with no resting angle of its own turns in from the discard angle.
  const from = cs.rotate === 'none' ? `${-angle.discard}deg` : '0deg'
  ctx.animate(
    card,
    [
      { opacity: 0, translate: above(DISCARD.drop), rotate: from },
      { opacity: 1, offset: DISCARD.fade },
      { opacity: 1, ...rest },
    ],
    { duration, easing: bezier(ease.draw), fill: 'backwards' },
    'transform, opacity',
  )
}
