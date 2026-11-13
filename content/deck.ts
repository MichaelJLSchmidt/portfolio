/*
 * The deck: what the four hand cards are, independent of language. Their ids
 * (the case-study slugs and "management", the same in every locale), their
 * order, colour identities and the path of each card's page. No text: every
 * locale's content/<locale>/hand.ts takes `order` and `identity` from here and
 * adds its own titles and labels. Client modules that only need to know which
 * card a route belongs to (the table store, play, the background field) read
 * this, never a locale's copy (D7). Contract: docs/contracts.md#hand.
 */
import type { Identity } from './schema'

/** The four cards, in hand order: the three case studies, then Management. */
export const order = ['team-of-teams', 'shared-foundations', 'front-door', 'management'] as const

export type HandCardId = (typeof order)[number]

export const identity = {
  'team-of-teams': 'ember',
  'shared-foundations': 'tide',
  'front-door': 'grove',
  management: 'saffron',
} satisfies Record<HandCardId, Identity>

/** A card's page, without the locale prefix: /work/<slug>, or /management. */
export const cardPath = (id: string) => (id === 'management' ? '/management' : `/work/${id}`)
