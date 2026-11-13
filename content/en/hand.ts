/*
 * The hand's English copy: rail labels and card faces of the four cards, and
 * the Coffee egg card. Order and identities come from content/deck.ts (no
 * text). A slim module: the layout passes it to the client (src/lib/chrome.tsx)
 * on English pages only, so it imports no page text (D7). Page modules may
 * import from here, never the other way round.
 * Contract: docs/contracts.md#hand and #content-schema.
 */
import { type HandCardId, identity, order } from '../deck'
import type { CoffeeEgg, HandCardCopy, HandContent } from '../schema'

export const hand: HandContent = {
  order,
  identity,
  railLabel: {
    'team-of-teams': 'Teams',
    'shared-foundations': 'Platform',
    'front-door': 'Service',
    management: 'Management',
  } satisfies Record<HandCardId, string>,
  cards: {
    'team-of-teams': {
      title: 'Building the team',
      type: 'People leadership',
      year: '2021–2025',
      inspect: 'From two designers to a team of five, with a front door and a career framework.',
      tapLine: 'First hire: a researcher, not a designer.',
      facts: [
        { label: 'Team', value: '2 → 5 people' },
        { label: 'Timeframe', value: '2021–2025' },
      ],
    },
    'shared-foundations': {
      title: 'Allmend design system',
      type: 'Design system',
      year: 'Since 2022',
      inspect: 'Nine of twelve product teams build with it, and nobody was told to.',
      tapLine: 'Allmend is Swiss German for common land.',
      facts: [
        { label: 'Teams', value: '9 of 12' },
        { label: 'Contributed', value: '41% of components' },
      ],
    },
    'front-door': {
      title: 'Moving house, once',
      type: 'Public service',
      year: '2023–2025',
      inspect: 'One online service that tells five offices about a move at once.',
      tapLine: 'Most asked question: "Do I also need to tell the tax office?"',
      facts: [
        { label: 'Completion', value: '54% → 83%' },
        { label: 'Municipalities', value: '27 of 27' },
      ],
    },
    management: {
      title: 'Management',
      type: 'How I lead',
      year: 'Since 2021',
      inspect: 'Five people, six rituals and the workshop methods I reach for.',
      tapLine: 'The best retro format is the one the team picks.',
      facts: [
        { label: 'Team', value: '5 people, 4.0 FTE' },
        { label: 'Rituals', value: '6' },
      ],
    },
  } satisfies Record<HandCardId, HandCardCopy>,
  labels: {
    nav: 'Work',
    viewing: 'Viewing',
    loading: 'Loading…',
    stillLoading: 'Still loading…',
    offline: "You're offline. Try again once you're connected.",
  },
}

export const coffeeEgg: CoffeeEgg = {
  title: 'Coffee?',
  body: 'You typed "draw". Here\'s a card that leads to a conversation.',
  cta: 'Go to contact',
}
