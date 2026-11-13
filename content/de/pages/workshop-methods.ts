/*
 * The workshop draw on /de/management (egg): its button label is
 * management.workshops.drawButton. Server-only; the page passes it to the
 * client component as props (D7). Method names stay as they are.
 */
import type { WorkshopMethods } from '../../schema'

export const workshopMethods: WorkshopMethods = {
  again: 'Noch eine ziehen',
  drawn: 'Workshop-Methode: {title}. {howTo}',
  methods: [
    {
      title: '1-2-4-All',
      howTo: 'Denk eine Minute allein nach, dann zu zweit, dann zu viert. Teilt eine Idee mit allen.',
    },
    { title: 'Crazy 8s', howTo: 'Falte ein Blatt in acht Felder und skizziere acht Ideen in acht Minuten.' },
    {
      title: 'How Might We',
      howTo: 'Formuliere jede Problemnotiz als «Wie könnten wir …?» um und gruppiere die Fragen.',
    },
    {
      title: 'Lightning Decision Jam',
      howTo:
        'Probleme, Abstimmung, Umformulieren, Lösungen, Abstimmung, Aufwand und Wirkung, Massnahmen. In einer Stunde.',
    },
    { title: 'Dot voting', howTo: 'Alle bekommen drei Punkte. Stimmt still ab und besprecht zuerst die Ausreisser.' },
    {
      title: 'Brainwriting 6-3-5',
      howTo: 'Sechs Personen schreiben in fünf Minuten je drei Ideen auf und geben das Blatt weiter.',
    },
    { title: 'Rose, Thorn, Bud', howTo: 'Benenne, was funktioniert, was schmerzt und was wachsen könnte.' },
    {
      title: 'Troika Consulting',
      howTo: 'Eine Person schildert eine Herausforderung und dreht sich weg, während zwei andere sie beraten.',
    },
    {
      title: 'Pre-mortem',
      howTo:
        'Stell dir vor, das Projekt ist gescheitert. Schreib auf, warum, und behebe die drei wichtigsten Ursachen jetzt.',
    },
    {
      title: 'Empathy map',
      howTo: 'Fülle aus, was jemand sagt, denkt, tut und fühlt. Aus der Forschung, nicht aus Annahmen.',
    },
    { title: 'Fishbowl', howTo: 'Ein innerer Kreis spricht, ein äusserer hört zu. Alle können jederzeit tauschen.' },
    {
      title: 'Impromptu Networking',
      howTo: 'Drei kurze Runden, jedes Mal mit einer neuen Person und einer gemeinsamen Frage.',
    },
  ],
}
