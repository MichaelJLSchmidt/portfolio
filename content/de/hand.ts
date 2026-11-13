/*
 * The hand's German copy: rail labels and card faces of the four cards, and
 * the Coffee egg card. Order and identities come from content/deck.ts (no
 * text). A slim module: the layout passes it to the client (src/lib/chrome.tsx)
 * on German pages only, so it imports no page text (D7). Each card title
 * equals its page title (checked at build time).
 * Contract: docs/contracts.md#hand and #content-schema.
 */
import { type HandCardId, identity, order } from '../deck'
import type { CoffeeEgg, HandCardCopy, HandContent } from '../schema'

export const hand: HandContent = {
  order,
  identity,
  railLabel: {
    'team-of-teams': 'Team',
    'shared-foundations': 'Plattform',
    'front-door': 'Service',
    management: 'Führung',
  } satisfies Record<HandCardId, string>,
  cards: {
    'team-of-teams': {
      title: 'Das Team aufbauen',
      type: 'Teamaufbau',
      year: '2021–2025',
      inspect: 'Von zwei Designern zu einem Team von fünf, mit einer Anlaufstelle und einem Karrieremodell.',
      tapLine: 'Die erste neue Stelle: Research, nicht Design.',
      facts: [
        { label: 'Team', value: '2 → 5 Personen' },
        { label: 'Zeitraum', value: '2021–2025' },
      ],
    },
    'shared-foundations': {
      title: 'Design-System Allmend',
      type: 'Design-System',
      year: 'Seit 2022',
      inspect: 'Neun von zwölf Produktteams bauen damit, ohne dass es jemand angeordnet hat.',
      tapLine: 'Allmend ist Land, das allen gehört.',
      facts: [
        { label: 'Teams', value: '9 von 12' },
        { label: 'Beiträge', value: '41% der Komponenten' },
      ],
    },
    'front-door': {
      title: 'Ein Umzug, eine Meldung',
      type: 'Service public',
      year: '2023–2025',
      inspect: 'Ein Onlinedienst, der fünf Ämtern einen Umzug auf einmal meldet.',
      tapLine: 'Häufigste Frage: «Muss ich das auch dem Steueramt melden?»',
      facts: [
        { label: 'Abschlussquote', value: '54% → 83%' },
        { label: 'Gemeinden', value: '27 von 27' },
      ],
    },
    management: {
      title: 'Führung',
      type: 'Wie ich führe',
      year: 'Seit 2021',
      inspect: 'Fünf Personen, sechs Rituale und die Workshop-Methoden, zu denen ich greife.',
      tapLine: 'Das beste Retro-Format ist das, welches das Team wählt.',
      facts: [
        { label: 'Team', value: '5 Personen, 4,0 FTE' },
        { label: 'Rituale', value: '6' },
      ],
    },
  } satisfies Record<HandCardId, HandCardCopy>,
  labels: {
    nav: 'Projekte',
    viewing: 'Offen',
    loading: 'Wird geladen…',
    stillLoading: 'Wird noch geladen…',
    offline: 'Du bist offline. Versuch es nochmal, sobald du verbunden bist.',
  },
}

export const coffeeEgg: CoffeeEgg = {
  title: 'Kaffee?',
  body: 'Du hast «draw» getippt. Hier ist eine Karte, die zu einem Gespräch führt.',
  cta: 'Zum Kontakt',
}
