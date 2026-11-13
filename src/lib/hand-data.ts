/*
 * The hand's data, client-safe: pure helpers that turn one locale's slim
 * chrome (site labels, the hand's copy, the Coffee card) into the four hand
 * cards with their links, and the language-independent lookups the client
 * modules need (which card a route belongs to, a card's identity). It imports
 * no content values except content/deck.ts (ids, order, identities; no text):
 * client components get the active locale's copy from the layout through
 * src/lib/chrome.tsx, so only that locale's chrome ships to the page and page
 * text (case-study sections, About, Management) stays on the server (D7).
 * Foundation-owned. Contract: docs/contracts.md#hand.
 */
import { type HandCardId, cardPath, identity, order } from '@content/deck'
import type { CoffeeEgg, Fact, HandContent, Site } from '@content/schema'
import type { Identity } from '@/design/palette'
import { type Locale, localeHref, pagePath } from './i18n'

/** One card of the hand (navigation). */
export type HandCard = {
  id: string
  /** The card's page without the locale: /work/<slug> or /management. */
  path: string
  /** The link to the card's page in the current locale: /de/work/<slug>. */
  href: string
  title: string
  projectType: string
  identity: Identity
  railLabel: string
  /** One line for Inspect. */
  inspect: string
  /** Printed along the long edge; readable when the card is turned sideways (Tap). */
  tapLine: string
  /** Shown on the card face: years, then role / team / timeframe / client. */
  year: string
  facts: Fact[]
  index: number
}

/** What the layout hands the client for the active locale: slim chrome only (D7). */
export type ChromeData = { locale: Locale; site: Site; hand: HandContent; coffeeEgg: CoffeeEgg }

/** The active locale's chrome with its cards and lookups. */
export type Chrome = ChromeData & {
  /** The four cards, in hand order. */
  handCards: HandCard[]
  handLabels: HandContent['labels']
  cardById: (id: string | null | undefined) => HandCard | null
  /** The hand card a path belongs to (/de/work/<slug>, /work/<slug>, /management), if any. */
  cardForPath: (pathname: string) => HandCard | null
  /** The card after `id` in hand order (wraps), for "Next project". */
  nextCard: (id: string) => HandCard
  /** A link to a page path (with an optional #hash) in this locale: "/about" -> "/de/about". */
  href: (path: string) => string
}

export function buildChrome(data: ChromeData): Chrome {
  const { locale, hand } = data
  const handCards: HandCard[] = hand.order.map((id, index) => {
    const card = hand.cards[id]
    if (!card) throw new Error(`content/${locale}/hand.ts lists "${id}" in order but has no card for it.`)
    return {
      id,
      path: cardPath(id),
      href: localeHref(locale, cardPath(id)),
      title: card.title,
      projectType: card.type,
      identity: hand.identity[id],
      railLabel: hand.railLabel[id],
      inspect: card.inspect,
      tapLine: card.tapLine,
      year: card.year,
      facts: card.facts,
      index,
    }
  })
  if (handCards.length !== 4) throw new Error(`The hand must have exactly four cards, found ${handCards.length}.`)
  const cardById = (id: string | null | undefined) => handCards.find((c) => c.id === id) ?? null
  return {
    ...data,
    handCards,
    handLabels: hand.labels,
    cardById,
    cardForPath: (pathname) => cardById(cardIdForPath(pathname)),
    nextCard: (id) => handCards[(handCards.findIndex((c) => c.id === id) + 1) % handCards.length],
    href: (path) => localeHref(locale, path),
  }
}

/** The card a route belongs to, in any locale ("/de/work/front-door/" -> "front-door"), or null. */
export function cardIdForPath(pathname: string): HandCardId | null {
  const path = pagePath(pathname)
  return order.find((id) => cardPath(id) === path) ?? null
}

/** A card's colour identity (the same in every locale). */
export const identityOf = (id: string | null | undefined): Identity | null =>
  id && id in identity ? identity[id as HandCardId] : null

/** The cards' ids in hand order. */
export const cardIds: readonly string[] = order
