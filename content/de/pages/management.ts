/*
 * Management (/de/management, saffron). Server-only page text. The card itself
 * (title "Führung", type, facts) lives in content/de/hand.ts.
 */
import type { Management } from '../../schema'

export const management: Management = {
  slug: 'management',
  identity: 'saffron',
  title: 'Wie ich führe',
  lead: 'Ich leite ein Team von fünf Personen, vier im Design und eine im Research, zusammen 4,0 FTE. Wir arbeiten in einem IT-Dienstleister für die öffentliche Verwaltung. Meine Aufgabe ist es, gute Arbeit möglich zu machen: klare Prioritäten, ehrliches Feedback, geschützte Zeit zum Denken und Ergebnisse, auf die wir stolz sind.',
  principles: {
    label: 'Prinzipien',
    title: 'Fünf Prinzipien, mit Belegen',
    image: 'management-principles',
    items: [
      {
        title: 'Klarheit ist Freundlichkeit',
        evidence:
          'Alle im Team haben eine einseitige Rollenbeschreibung und Quartalsziele, die sie selbst geschrieben haben. In der letzten Teamumfrage sagten fünf von fünf, dass sie wissen, was von ihnen erwartet wird.',
      },
      {
        title: 'Belege vor Meinungen',
        evidence:
          'Jedes Projekt beginnt mit einer Forschungsfrage. 2025 haben wir im Team 38 Usability-Tests durchgeführt, mindestens einen pro Monat.',
      },
      {
        title: 'Offen gestalten',
        evidence:
          'Unsere wöchentliche Critique steht allen im Unternehmen offen. Im Schnitt kommen vier Gäste aus den Produktteams dazu.',
      },
      {
        title: 'Konzentrierte Arbeit schützen',
        evidence:
          'Zwei sitzungsfreie Halbtage pro Woche, seit 2022. Statusupdates gibt es schriftlich, nicht mündlich.',
      },
      {
        title: 'Menschen fördern, nicht Abhängigkeit',
        evidence:
          'Zwei Teammitglieder leiten heute selbstständig Workshops mit Kunden, und eine Person wurde 2025 zur Senior befördert.',
      },
    ],
  },
  team: {
    label: 'Team',
    title: 'Wer im Team ist',
    members: [
      {
        initials: 'ML',
        role: 'Lead',
        fte: '100%',
        focus: 'Menschen, Prioritäten und Praxis, weiterhin rund 20% eigene Projektarbeit',
      },
      { initials: 'AK', role: 'Senior UX Designer', fte: '100%', focus: 'Fest im Bereich Steuern' },
      {
        initials: 'RB',
        role: 'UX Researcher',
        fte: '80%',
        focus: 'Research Operations und Studien über alle Bereiche',
      },
      { initials: 'SO', role: 'UX Designer & Frontend', fte: '100%', focus: 'Kernteam von Allmend' },
      { initials: 'LM', role: 'UX Designer', fte: '80%', focus: 'Register und Behördendienste' },
      { initials: 'NG', role: 'Lernende im Design', fte: '40%', focus: 'Tage im Betrieb, wechselnd über die Projekte' },
    ],
    note: '4,0 FTE ohne die Leitung. Teammitglieder erscheinen nur mit Initialen.',
  },
  rituals: {
    label: 'Rituale',
    title: 'Wie eine Woche läuft',
    items: [
      { name: 'Check-in am Montag', cadence: 'Wöchentlich, 20 Min.', purpose: 'Prioritäten und Blocker, im Stehen' },
      { name: '1:1s', cadence: 'Wöchentlich, 30 Min.', purpose: 'Ihre Agenda, nicht meine' },
      { name: 'Critique am Mittwoch', cadence: 'Wöchentlich, 60 Min.', purpose: 'Offen für das ganze Unternehmen' },
      { name: 'Research-Share', cadence: 'Alle zwei Wochen, 30 Min.', purpose: 'Ein Befund, ein Clip, eine Frage' },
      {
        name: 'Retro und Planung',
        cadence: 'Quartalsweise, ein halber Tag',
        purpose: 'Einmal im Jahr auswärts im Berner Oberland',
      },
      { name: 'Entwicklungsgespräch', cadence: 'Zweimal im Jahr', purpose: 'Entlang des Karrieremodells' },
    ],
  },
  hiring: {
    label: 'Rekrutierung',
    title: 'Wie wir einstellen',
    steps: [
      { title: 'Erstes Gespräch', duration: '30 Min.', purpose: 'Gegenseitiger Fit und offene Fragen' },
      {
        title: 'Gespräch zum Portfolio',
        duration: '60 Min.',
        purpose: 'Die Person wählt ein Projekt, und wir gehen in die Tiefe',
      },
      {
        title: 'Gemeinsame Übung',
        duration: '90 Min.',
        purpose: 'Ein echtes, anonymisiertes Problem, gemeinsam gelöst. Keine Hausaufgaben',
      },
      {
        title: 'Mittag mit dem Team',
        duration: '60 Min.',
        purpose: 'Lerne die Leute kennen, mit denen du arbeiten würdest',
      },
      {
        title: 'Entscheid',
        duration: 'Innert 5 Arbeitstagen',
        purpose: 'Schriftliches Feedback für alle in der Endrunde',
      },
    ],
    note: 'Strukturierte Bewertungsbögen, immer zwei Personen im Gespräch, dieselben Fragen für alle.',
  },
  growth: {
    label: 'Entwicklung',
    title: 'Wie Menschen wachsen',
    body: 'Ein Karrieremodell mit vier Stufen in drei Dimensionen. Alle haben pro Jahr CHF 2000 und fünf Tage für Weiterbildung und entscheiden selbst, wofür. Zwei Beförderungen seit 2023.',
    levels: ['Designer', 'Erfahrener Designer', 'Senior Designer', 'Lead'],
    dimensions: ['Handwerk', 'Zusammenarbeit', 'Wirkung'],
  },
  workshops: {
    label: 'Workshops',
    title: 'Workshops, die ich leite',
    image: 'management-workshops',
    drawButton: 'Methode ziehen',
    formats: [
      {
        name: 'Kick-off-Canvas',
        glyph: 'one-two-four-all',
        duration: 'Ein halber Tag',
        who: 'Product Owner, Team, eine Vertretung der Kundschaft',
        outcome: 'Gemeinsame Ziele, Risiken und eine Forschungsfrage',
      },
      {
        name: 'Service-Blueprint-Jam',
        glyph: 'fishbowl',
        duration: 'Ein ganzer Tag',
        who: 'Bis zu 30 Personen aus mehreren Organisationen',
        outcome: 'Ein Bild des ganzen Service und seiner Schwachstellen',
      },
      {
        name: 'Design Studio',
        glyph: 'crazy-eights',
        duration: '2 Stunden',
        who: '6–10 Personen',
        outcome: 'Drei skizzierte Richtungen und ein Entscheid, was wir prototypen',
      },
      {
        name: 'Retro mit Twist',
        glyph: 'dot-voting',
        duration: '60 Min.',
        who: 'Das Team',
        outcome: 'Zwei Experimente für den nächsten Sprint',
      },
    ],
  },
  metrics: {
    label: 'Zahlen',
    title: 'Zahlen, die ich beobachte',
    items: [
      { value: '4,5 / 5', label: '«Hier kann ich meine beste Arbeit machen» (Teamumfrage pro Quartal)' },
      { value: '71%', label: 'der neuen Projekte mit UX ab dem Kick-off' },
      { value: '38', label: 'Usability-Tests im Jahr 2025' },
      { value: '94%', label: 'der geplanten 1:1s fanden statt' },
      { value: '92%', label: 'der Tage für Weiterbildung genutzt' },
    ],
  },
}
