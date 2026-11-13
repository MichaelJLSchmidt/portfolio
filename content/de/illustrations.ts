/*
 * The words inside the illustrations (German): each drawing's <title>,
 * <desc> and labels. Server-only; pages spread an entry into its component.
 * Method and product names stay as they are (Crazy Eights, 1-2-4-All, Angular).
 */
import type { IllustrationCopy } from '../schema'

export const illustrations: IllustrationCopy = {
  TeamGrowthTimeline: {
    title: 'Teamwachstum',
    description:
      'Das Team wuchs zwischen 2021 und 2025 von 2 auf 5 Personen, mit einem Knoten für jedes Jahr, in dem jemand dazukam (2022, 2024, 2025).',
    labels: { team: 'Team', joined: 'Neu dabei' },
  },
  IntakeBeforeAfter: {
    title: 'Anfragen vorher und nachher',
    description:
      'Vorher: Anfragen aus 6 Quellen erreichen das Team als verhedderte, sich kreuzende Linien. Nachher: Jede Anfrage geht durch eine Anlaufstelle, die sie auf 3 Angebote verteilt: Check-up, Sprint, Embedded.',
    offers: ['Check-up', 'Sprint', 'Embedded'],
    labels: { before: 'Vorher', after: 'Nachher', team: 'Team', frontDoor: 'Anlaufstelle' },
  },
  DesignSystemLayers: {
    title: 'Schichten des Design-Systems',
    description:
      '5 Schichten, vom Fundament aufwärts gestapelt: Tokens, Primitives, Komponenten, Muster, Produkt-Apps. Die oberste Schicht bedient 4 Arten von Produkt-Apps: Angular, React, Vue, Server-Templates.',
    layers: ['Tokens', 'Primitives', 'Komponenten', 'Muster', 'Produkt-Apps'],
    badges: ['Angular', 'React', 'Vue', 'Server-Templates'],
  },
  ContributionLoop: {
    title: 'Beitragskreislauf',
    description:
      'Ein Kreislauf aus 5 Stationen, die ein Beitrag der Reihe nach durchläuft: Vorschlagen, Pairing, Review, Release, Übernehmen, dann zurück zu Vorschlagen. Pfeile zeigen die Richtung.',
    steps: ['Vorschlagen', 'Pairing', 'Review', 'Release', 'Übernehmen'],
  },
  AdoptionBars: {
    title: 'Nutzung der Plattform nach Team',
    description: '9 von 12 Teams nutzen die Plattform, 3 noch nicht. Ein Balken pro Team.',
    labels: { adopted: 'Übernommen', notYet: 'Noch nicht' },
  },
  ServiceBlueprint: {
    title: 'Service Blueprint, vorher und nachher',
    description:
      'Bahnen für Umziehende, Onlinedienst, Gemeinde, Einwohnerregister und Steuerverwaltung. Vorher: 5 getrennte Kontaktpunkte über die Ämter verteilt. Nachher: ein Einstieg über den Onlinedienst, weitergeleitet an Gemeinde, Einwohnerregister und Steuerverwaltung.',
    lanes: ['Umziehende', 'Onlinedienst', 'Gemeinde', 'Einwohnerregister', 'Steuerverwaltung'],
    labels: { before: 'Vorher', after: 'Nachher' },
  },
  JourneyEmotionCurve: {
    title: 'Gefühlskurve eines Umzugs',
    description:
      'Wie sich eine Person über 8 Schritte fühlt, von «Entscheiden» bis «Angekommen». Die Kurve sinkt bei «Steueramt melden» auf ihren tiefsten Punkt und erholt sich danach.',
    steps: [
      'Entscheiden',
      'Wohnung finden',
      'Kündigen',
      'Umziehen',
      'Anmelden',
      'Steueramt melden',
      'Daten ändern',
      'Angekommen',
    ],
  },
  TeamConstellation: {
    title: 'Team-Konstellation',
    description: '12 Personen in 3 Gruppen (4, 3, 5 Personen), jede Person mit einer Leitung in der Mitte verbunden.',
    squads: [
      { label: 'Gruppe A', size: 4 },
      { label: 'Gruppe B', size: 3 },
      { label: 'Gruppe C', size: 5 },
    ],
    lead: 'Leitung',
  },
  WeekRing: {
    title: 'Eine Woche voller Rituale',
    description:
      'Eine Woche von Mo bis Fr als Ring. Wöchentliche Rituale: Check-in (Mo), 1:1s (Di, Do), Critique (Mi).',
    days: ['Mo', 'Di', 'Mi', 'Do', 'Fr'],
    rituals: ['Check-in', '1:1s', 'Critique'],
  },
  CareerMatrix: {
    title: 'Karrieremodell',
    description:
      'Ein Raster aus 4 Stufen (Designer, Erfahrener Designer, Senior Designer, Lead) und 3 Dimensionen (Handwerk, Zusammenarbeit, Wirkung). Ein hervorgehobener Pfad führt hindurch: Designer im Handwerk, dann Erfahrener Designer im Handwerk, dann Senior Designer in der Zusammenarbeit, dann Lead in der Wirkung.',
  },
  WorkshopGlyphs: {
    title: 'Workshop-Methoden',
    description:
      '4 Workshop-Methoden als einfache Zeichen. Crazy Eights: ein Blatt in acht Felder gefaltet, eine Idee pro Feld. 1-2-4-All: eine Person, dann Paare, dann Vierergruppen, dann der ganze Raum im Kreis. Dot Voting: drei Optionen mit gestapelten Punkten darüber. Fishbowl: ein innerer Kreis aus vier Stühlen in einem Ring von Zuhörenden.',
  },
  WorkshopGlyph: {
    'crazy-eights': {
      title: 'Crazy Eights',
      description: 'Workshop-Methode Crazy Eights: ein Blatt in acht Felder gefaltet, eine Idee pro Feld.',
    },
    'one-two-four-all': {
      title: '1-2-4-All',
      description:
        'Workshop-Methode 1-2-4-All: eine Person, dann Paare, dann Vierergruppen, dann der ganze Raum im Kreis.',
    },
    'dot-voting': {
      title: 'Dot Voting',
      description: 'Workshop-Methode Dot Voting: drei Optionen mit gestapelten Punkten darüber.',
    },
    fishbowl: {
      title: 'Fishbowl',
      description: 'Workshop-Methode Fishbowl: ein innerer Kreis aus vier Stühlen in einem Ring von Zuhörenden.',
    },
  },
  DiscardedCard: {
    title: 'Eine abgeworfene Karte',
    description: 'Eine einzelne Spielkarte, verdeckt, auf der Rückseite eine gerahmte Raute.',
  },
}
