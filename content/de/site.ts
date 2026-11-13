/*
 * Site chrome copy (German): header, footer, the "?" sheet, egg
 * announcements and shared labels. A slim module: the layout passes it to the
 * client (src/lib/chrome.tsx) on German pages only, so it holds short labels
 * only and imports no page text (D7). Contract: docs/contracts.md#content-schema.
 * German copy: Swiss Standard German ("ss", never "ß"), informal "du", no
 * em-dashes or semicolons.
 */
import type { Site } from '../schema'

export const site: Site = {
  name: 'Moritz Lauber',
  description: 'UX Team Lead und Senior UX Designer in Bern.',
  wordmark: 'MJLS',
  skipLink: 'Zum Inhalt springen',
  introSkip: 'Intro überspringen',
  header: {
    homeLabel: 'MJLS, Startseite',
    back: 'Zurück',
    about: 'Über mich',
    nav: 'Website',
    language: 'Sprache',
  },
  footer: { note: 'Moritz Lauber · Bern, Schweiz · Zuletzt aktualisiert im November 2026' },
  shortcuts: {
    title: 'Tastenkürzel',
    close: 'Schliessen',
    items: [
      { keys: '← →', label: 'Durch die Karten wechseln' },
      { keys: 'Enter', label: 'Die Karte im Fokus öffnen' },
      { keys: 'Leertaste halten', label: 'Die Karte im Fokus genauer ansehen' },
      { keys: 'Esc', label: 'Zurück zum Anfang' },
      { keys: 'T', label: 'Die Karte im Fokus quer drehen' },
      { keys: 'M', label: 'Eine neue Hand austeilen (Startseite)' },
      { keys: 'draw', label: 'Auf der Startseite eintippen' },
      { keys: '?', label: 'Diese Liste' },
    ],
  },
  eggs: {
    dealt: 'Neue Hand ausgeteilt.',
    turned: 'Quer gedreht: {line}',
    rare: 'Eine seltene Karte.',
    coffeeDealt: 'Noch eine Karte: {title}',
    tableFlipped: '{label}: {value}',
  },
  labels: {
    facts: 'Fakten',
    next: 'Nächstes Projekt',
    viewing: 'Offen',
    sections: 'Kapitel',
    meta: { client: 'Auftraggeber', timeframe: 'Zeitraum', role: 'Rolle', team: 'Team', type: 'Art' },
    decision: { decision: 'Entscheid', chose: 'Meine Wahl', tradeOff: 'Der Preis', why: 'Warum es sich lohnte' },
    owned: 'Was ich verantwortet habe',
    notOwned: 'Was nicht',
    workshop: { duration: 'Dauer', who: 'Wer', outcome: 'Ergebnis' },
  },
}
