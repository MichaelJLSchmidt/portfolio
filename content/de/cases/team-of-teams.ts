/* Case 01: Das Team aufbauen (team-of-teams, ember). Server-only page text. */
import type { CaseStudy } from '../../schema'

export const teamOfTeams: CaseStudy = {
  slug: 'team-of-teams',
  number: '01',
  identity: 'ember',
  label: 'Team',
  title: 'Das Team aufbauen',
  statement: 'Von zwei Designern zu einer UX-Praxis.',
  heroImage: 'team-of-teams-hero',
  summary:
    '2021 bedeutete UX bei Lindengrund zwei Designer, die an das Projekt ausgeliehen wurden, das am lautesten rief. Vier Jahre später ist es ein Team von fünf Personen mit einer klaren Anlaufstelle, gemeinsamen Ritualen und einem Karrieremodell. Und Produktteams holen uns schon zum Kick-off. So habe ich es aufgebaut, samt dem, was ich falsch gemacht habe.',
  meta: {
    client: 'Intern, für kantonale und eidgenössische Kunden',
    timeframe: '2021–2025',
    role: 'UX Team Lead: Führung, Rekrutierung und Verantwortung für die Praxis',
    team: 'Von 2 auf 5 Personen gewachsen (4,0 FTE), 14 Produktteams als interne Kunden',
    type: 'Führung · Aufbau einer Praxis',
  },
  metrics: [
    { value: '18% → 71%', label: 'der neuen Projekte mit UX ab dem Kick-off' },
    { value: '9 → 3', label: 'Wochen Wartezeit auf Design, im Schnitt' },
    { value: '0', label: 'ungewollte Abgänge in vier Jahren' },
    { value: '3,1 → 4,4', label: 'interne Zufriedenheit mit dem UX-Support (von 5)' },
    { value: '160+', label: 'Design Critiques seit 2022' },
  ],
  sections: {
    context: {
      label: 'Kontext',
      title: 'Zwei Designer, vierzehn Teams',
      image: 'team-of-teams-process',
      caption: 'Wöchentliche Critique, offen für alle im Unternehmen',
      body: [
        'Lindengrund entwickelt und betreibt Software für Kantone, Gemeinden und Bundesämter: Steuerportale, Register, Fallführungssysteme. 2021 arbeiteten dort rund 380 Personen in 14 Produktteams, dazu zwei UX Designer. Sie sassen in verschiedenen Abteilungen, hatten keine gemeinsamen Werkzeuge und wurden über die persönlichen Netzwerke von Projektleitenden gebucht. Design kam spät, meist erst nachdem sich ein Kunde beschwert hatte.',
      ],
      note: 'Zwei Designer für 14 Teams hiess: ein Designer auf sieben Teams. Die meisten Teams hatten noch nie mit Design gearbeitet.',
    },
    problem: {
      label: 'Problem',
      title: 'Jede Anfrage war ein Gefallen. Jedes «Nein» wirkte persönlich.',
      body: [
        'Man fragte mich: «Kannst du UX skalieren?» Das eigentliche Problem darunter: Niemand sah, welche UX-Arbeit es gab, was sie kostete oder was sie veränderte. Ohne das war jede Anfrage ein Gefallen, und jedes «Nein» wirkte persönlich.',
      ],
    },
    role: {
      label: 'Meine Rolle',
      title: 'Was ich verantwortet habe und was nicht',
      body: [
        'Ich führte das Team, war für die Rekrutierung zuständig und verantwortete die Praxis. Die Produktteams behielten ihre Roadmaps.',
      ],
      owned: [
        'Teamstrategie und Struktur',
        'Rekrutierung und Onboarding',
        'Anfragen und Kapazitätsplanung',
        'Karrieremodell',
        'Budgetanträge an die Geschäftsleitung',
      ],
      notOwned: ['Roadmaps der 14 Produktteams', 'Lohnbänder (von HR festgelegt)', 'Kundenverträge'],
    },
    approach: {
      label: 'Vorgehen',
      title: 'Vier Schritte in vier Jahren',
      illustration: 'IntakeBeforeAfter',
      body: [],
      steps: [
        {
          title: 'Die Arbeit sichtbar machen (Monate 1–3)',
          body: 'Ich habe 22 Product Owner und Projektleitende interviewt und jedes laufende und geplante Projekt an einer Wand abgebildet. Wir fanden 31 Projekte mit Änderungen, die Nutzende betrafen. UX war bei fünf davon dabei.',
        },
        {
          title: 'Eine Anlaufstelle schaffen (Monate 3–6)',
          body: 'Ein einseitiges Anfrageformular, alle zwei Wochen eine Triage mit zwei Abteilungsleitenden und drei Einsatzmodelle: Check-up (2 Tage), Sprint (2–4 Wochen) und Embedded (eine Person für 3+ Monate).',
        },
        {
          title: 'Das Team nach Hebelwirkung ausbauen (2022–2024)',
          body: 'Zuerst eine Stelle im UX Research, weil in der Verwaltung Belege die Budgetdebatten gewinnen. Dann eine Person im Design, die programmiert, um die Lücke zur Entwicklung zu schliessen. Dann eine weitere Stelle im UX Design und eine Lehrstelle im Design.',
        },
        {
          title: 'Entwicklung greifbar machen (2023–2025)',
          body: 'Ein Karrieremodell mit vier Stufen, gemeinsam mit dem Team geschrieben, mit den Lohnbändern des Unternehmens verknüpft und zweimal im Jahr überprüft.',
        },
      ],
    },
    decisions: {
      label: 'Entscheide',
      title: 'Vier Entscheide und ihr Preis',
      body: [],
      items: [
        {
          decision: 'Research vor mehr Design',
          chose: 'Ich habe entschieden, als erste neue Stelle eine Person im UX Research einzustellen.',
          tradeOff: 'Sechs Monate lang lieferten wir weniger Screens, und zwei Produktteams warteten länger.',
          why: 'Die Ergebnisse aus dem Research brachten Design auf die Traktandenliste der Steuerungsausschüsse. Die nächsten zwei Stellen wurden auf dieser Grundlage bewilligt.',
        },
        {
          decision: 'Feste Modelle statt Tickets',
          chose: 'Ich habe drei feste Einsatzmodelle mit klarem Umfang gewählt.',
          tradeOff: 'Wir sagten Nein zu kleinen «Mach es hübscher»-Anfragen, und manche waren verärgert.',
          why: 'Feste Modelle machten die Kapazitätsplanung möglich und aus Gefallen wurden Verpflichtungen.',
        },
        {
          decision: 'Breite statt Seniorität einstellen',
          chose:
            'Ich habe Leute gewählt, die moderieren und in Code prototypen können, statt reiner Spezialisten für Visuelles.',
          tradeOff:
            'Unser visueller Feinschliff hinkte ein Jahr hinterher. Für zwei Lancierungen holten wir freie Unterstützung im Visual Design dazu.',
          why: 'Wer einen Workshop mit einem kantonalen Amt leiten und einen funktionierenden Prototyp liefern kann, bewirkt mehr als ein perfektes Mock-up.',
        },
        {
          decision: 'Die Stufen mit dem Team schreiben',
          chose: 'Ich habe die Stufen in vier Workshops gemeinsam erarbeitet, statt eine Vorlage zu übernehmen.',
          tradeOff: 'Es dauerte vier Monate statt vier Wochen.',
          why: 'Alle vertrauten dem Modell, weil sie die Beschreibungen ihrer eigenen Arbeit selbst geschrieben hatten.',
        },
      ],
    },
    artefacts: {
      label: 'Artefakte',
      title: 'Was unterwegs entstanden ist',
      body: [],
      items: [
        {
          title: 'Teamwachstum, 2021–2025',
          caption: 'Neue Stellen nach Hebelwirkung: zuerst Research, dann eine Person im Design, die programmiert.',
          illustration: 'TeamGrowthTimeline',
        },
        {
          title: 'Anfrageformular auf einer Seite',
          caption: 'Eine Seite, alle zwei Wochen eine Triage und drei Einsatzmodelle: Check-up, Sprint, Embedded.',
        },
        {
          title: 'Karrieremodell',
          caption: 'Vier Stufen, drei Dimensionen, in vier Workshops mit dem Team geschrieben.',
          illustration: 'CareerMatrix',
        },
      ],
    },
    outcomes: {
      label: 'Ergebnisse',
      title: 'Was sich verändert hat',
      body: [
        'Ende 2025 war UX bei 71% der neuen Projekte ab dem Kick-off dabei, zuvor bei 18%. Die durchschnittliche Wartezeit auf Design sank von neun auf drei Wochen. Die interne Zufriedenheit mit dem UX-Support, jährlich bei den Product Ownern erhoben, stieg von 3,1 auf 4,4 von 5. Niemand, den wir halten wollten, hat das Team verlassen.',
      ],
    },
    differently: {
      label: 'Was ich anders machen würde',
      title: 'Was ich anders machen würde',
      body: [
        'Ich habe zu lange gewartet, bis ich die eigene Projektarbeit abgab. Fast das ganze Jahr 2022 war ich der Engpass des Teams: Ich führte, rekrutierte und gestaltete gleichzeitig ein Steuerportal. Heute würde ich mein letztes Projekt sechs Monate früher abgeben und zwei Tage pro Woche für das Team freihalten. Ausserdem würde ich die Finanzabteilung schon im ersten Jahr einbeziehen. Sobald unsere Zeit nach Einsatzmodellen erfasst wurde, wurden Budgetgespräche einfacher.',
      ],
    },
    next: { label: 'Weiter', title: 'Nächstes Projekt', card: 'shared-foundations' },
  },
}
