/* Case 02: Design-System Allmend (shared-foundations, tide). Server-only page text. */
import type { CaseStudy } from '../../schema'

export const sharedFoundations: CaseStudy = {
  slug: 'shared-foundations',
  number: '02',
  identity: 'tide',
  label: 'Plattform',
  title: 'Design-System Allmend',
  statement: 'Ein Design-System, das niemand nutzen musste.',
  heroImage: 'shared-foundations-hero',
  summary:
    'Zwölf Produktteams, vier Frontend-Stacks und kein Auftrag von oben. Allmend, benannt nach dem Land, das allen gehört, ist das gemeinsame Design-System, das wir aufgebaut haben, indem wir das Richtige zum Einfachen machten. Heute bauen neun von zwölf Teams damit, und 41% der Komponenten kommen von ausserhalb des Kernteams.',
  meta: {
    client: 'Interne Plattform für 12 Produktteams, die kantonale und eidgenössische Anwendungen bauen',
    timeframe: 'Seit 2022',
    role: 'Product Owner und Lead Designer, Mitarbeit an den Komponenten',
    team: '2 Personen aus meinem Team (1,2 FTE), 2 ausgeliehene Personen aus der Frontend-Entwicklung (1,0 FTE), 23 Mitwirkende aus Produktteams',
    type: 'Design-System · Plattform · Einfluss ohne Weisungsbefugnis',
  },
  metrics: [
    { value: '9 von 12', label: 'Produktteams bauen mit Allmend' },
    { value: '46% → 91%', label: 'der geprüften Screens erfüllen WCAG 2.1 AA' },
    { value: '−38%', label: 'UI-Fehler in den Teams, die Allmend nutzen' },
    { value: '21 → 4', label: 'Tage von der Idee zum klickbaren Prototyp' },
    { value: '41%', label: 'der Komponenten aus Produktteams beigesteuert' },
  ],
  sections: {
    context: {
      label: 'Kontext',
      title: 'Elf Datepicker',
      image: 'shared-foundations-process',
      caption: 'Monatlicher Komponenten-Review mit Mitwirkenden',
      body: [
        'Jedes Produktteam hatte seinen eigenen Button. Als wir Screenshots von 19 Anwendungen machten, fanden wir 11 Datepicker, 6 Tabellenmuster und drei Töne von «offiziellem» Rot. Kunden fragten bereits, warum Anwendungen desselben Anbieters anders aussahen und sich anders verhielten. Und die Anforderungen an die Barrierefreiheit öffentlicher Stellen machten die Uneinheitlichkeit teuer.',
      ],
      note: '19 Anwendungen, 11 Datepicker, 4 Frontend-Stacks: Angular, React, Vue und serverseitig gerenderte Templates.',
    },
    problem: {
      label: 'Problem',
      title: 'Keine Weisungsbefugnis, kein Auftrag, vier Frontend-Stacks.',
      body: [
        'Ich hatte keinen Einfluss auf die Roadmaps der Produktteams, und die Geschäftsleitung wollte kein System vorschreiben, das es noch gar nicht gab. Allmend musste allein durch Nutzen überzeugen, und das über vier Stacks hinweg.',
      ],
    },
    role: {
      label: 'Meine Rolle',
      title: 'Was ich verantwortet habe und was nicht',
      body: ['Ich verantwortete das System als Product Owner und Lead Designer und schrieb einige Komponenten selbst.'],
      owned: [
        'Vision und Roadmap',
        'Gestaltung von Grundlagen und Komponenten',
        'Modell für Beiträge',
        'Reporting zur Nutzung',
        'Einige Frontend-Komponenten',
      ],
      notOwned: ['Prioritäten der Produktteams', 'Wahl der Frameworks', 'Release-Zyklen der Kundenanwendungen'],
    },
    approach: {
      label: 'Vorgehen',
      title: 'Das Richtige zum Einfachen machen',
      illustration: 'DesignSystemLayers',
      body: [],
      steps: [
        {
          title: 'Prüfen und den Kampf wählen, der sich lohnt',
          body: 'Wir begannen mit Formularen, weil jedes Team sie baut und jeder Kunde daraufhin geprüft wird.',
        },
        {
          title: 'Zuerst Tokens, dann Komponenten',
          body: 'Gestaltungsentscheide liegen in einer einzigen Token-Quelle, exportiert als CSS Custom Properties, damit jeder Stack dieselben Werte nutzt.',
        },
        {
          title: 'Web Components für den Kern, Wrapper für den Rest',
          body: 'Ein kleiner, frameworkunabhängiger Kern und dünne Wrapper, die den Produktteams gehören.',
        },
        {
          title: 'Offen für Beiträge, mit klarer Messlatte',
          body: 'Wöchentliche Sprechstunden, Pairing und eine öffentliche Definition of Done mit Prüfungen zur Barrierefreiheit.',
        },
      ],
    },
    decisions: {
      label: 'Entscheide',
      title: 'Vier Entscheide und ihr Preis',
      body: [],
      items: [
        {
          decision: 'Formulare zuerst, nicht Buttons',
          chose: 'Ich habe mit der schwierigsten und am häufigsten geprüften Familie von Mustern begonnen.',
          tradeOff: 'Das erste Release dauerte fünf Monate und wirkte dünn.',
          why: 'Es löste ein echtes Problem für jedes Team und gab uns bei den Kunden Glaubwürdigkeit in der Barrierefreiheit.',
        },
        {
          decision: 'Ein Kern für alle Frameworks',
          chose: 'Ich habe Web Components und Tokens statt einer reinen React-Bibliothek gewählt.',
          tradeOff: 'Weniger Komfort in der Entwicklung und schwierigeres Theming im Inneren.',
          why: 'Zwei der grössten Teams arbeiten mit Angular und eines mit Server-Templates. Ein reines React-System hätte das Unternehmen gespalten.',
        },
        {
          decision: 'Beraten statt prüfen',
          chose: 'Ich habe wöchentliche Sprechstunden und Pairing statt eines Review-Gremiums gewählt.',
          tradeOff: 'Mehr Zeit des Kernteams für Support und eine langsamere Roadmap.',
          why: 'Wer mit uns im Pairing gearbeitet hatte, kam wieder. Der Anteil der Beiträge stieg von 8% auf 41%.',
        },
        {
          decision: 'Die Nutzung ehrlich messen',
          chose:
            'Ich habe ein Dashboard zur Nutzung pro Team veröffentlicht, auch mit den Teams, die Allmend nicht nutzen, und warum.',
          tradeOff: 'Unbequeme Gespräche. Eine Teamleitung fühlte sich blossgestellt.',
          why: 'Die Spalte «Warum nicht» wurde zu unserer Roadmap.',
        },
      ],
    },
    artefacts: {
      label: 'Artefakte',
      title: 'Was unterwegs entstanden ist',
      body: [],
      items: [
        {
          title: 'Beitragskreislauf',
          caption: 'Vorschlagen, Pairing, Review, Release, Übernehmen: der Kreislauf, den jeder Beitrag durchläuft.',
          illustration: 'ContributionLoop',
        },
        {
          title: 'Die Audit-Wand',
          caption: '19 Anwendungen nebeneinander als Screenshots: 11 Datepicker, 6 Tabellenmuster, drei Rottöne.',
        },
        {
          title: 'Definition of Done',
          caption:
            'Eine öffentliche Seite: Tokens verwendet, Tests mit Tastatur und Screenreader bestanden, Doku und Beispiele im selben Pull Request.',
        },
      ],
    },
    outcomes: {
      label: 'Ergebnisse',
      title: 'Was sich verändert hat',
      illustration: 'AdoptionBars',
      body: [
        'Neun von zwölf aktiven Produktteams bauen heute mit Allmend. In diesen Teams sanken die UI-Fehler innert eines Jahres nach der Einführung um 38%, und der Anteil geprüfter Screens, die WCAG 2.1 AA erfüllen, stieg von 46% auf 91%. Von der Idee zum klickbaren Prototyp braucht es vier Tage statt drei Wochen, weil der Prototyp dieselben Komponenten nutzt wie die Produktion.',
      ],
    },
    differently: {
      label: 'Was ich anders machen würde',
      title: 'Was ich anders machen würde',
      body: [
        'Ich habe die Dokumentation unterschätzt. Wir behandelten sie als etwas, das man nach der Komponente schreibt, und ein Jahr lang kopierten Teams Code voneinander, statt die Anleitungen zu lesen. Nächstes Mal kommen Doku und Beispiele im selben Pull Request wie die Komponente, und die technische Redaktion ist ab dem ersten Monat dabei, nicht erst im zweiten Jahr. Ausserdem würde ich früher Nein zu kundenspezifischem Theming sagen. Wir haben zwei Monate in ein Theme gesteckt, das eine einzige Anwendung nutzt.',
      ],
    },
    next: { label: 'Weiter', title: 'Nächstes Projekt', card: 'front-door' },
  },
}
