/*
 * About (/de/about, glacier). Server-only page text: the chapters in order,
 * the "Projekte" list and the closing "Kontakt" chapter, the credits heading
 * and the topography's label and attribution.
 * about-og (the Open Graph image) has no slot on the page.
 */
import type { About } from '../../schema'

export const about: About = {
  title: 'Über mich',
  lead: 'Ich bin zwischen zwei Seen aufgewachsen und denke noch heute in Höhenkurven.',
  portrait: 'about-portrait',
  story: {
    label: 'Geschichte',
    image: 'about-roots',
    caption: 'Interlaken, zwischen Thunersee und Brienzersee',
    body: [
      'Ich bin 1988 in Interlaken geboren, auf dem flachen Streifen Land zwischen Thunersee und Brienzersee. Meine erste Stelle war eine Lehre als Mediamatiker in Thun, wo ich Websites für Hotels im Oberland baute. Dort lernte ich, dass Menschen nicht lesen. Sie suchen nach dem, weswegen sie gekommen sind.',
      'Fünf Jahre war ich Frontend-Entwickler bei einer Berner Agentur, bis ein Programm von Hyper Island in Stockholm veränderte, wie ich über Teams denke. Danach interessierte mich mehr, wie Menschen gemeinsam entscheiden, als jeder einzelne Screen. Seither gestalte ich Workshops.',
      'Nach drei Jahren als UX Designer bei einer Zürcher Agentur kam ich 2018 zu Lindengrund, um an Behördendiensten zu arbeiten. 2021 wurde ich UX Team Lead. Ich gestalte und prototype weiterhin jede Woche, denn ein Designteam aus der Distanz zu führen, funktioniert nie lange.',
    ],
  },
  timeline: {
    label: 'Werdegang',
    title: 'Werdegang',
    lanes: { work: 'Arbeit', education: 'Ausbildung' },
    both: 'Arbeit und Ausbildung',
    today: 'heute',
    alongside: 'parallel',
    thesisLink: 'Zur Masterarbeit',
    items: [
      {
        lane: 'both',
        from: 2004,
        to: 2008,
        title: 'Lehre als Mediamatiker',
        place: 'Thun',
        parts: {
          work: { title: 'Lehrbetrieb', place: 'Thun' },
          education: { title: 'Berufsfachschule', place: 'Thun' },
        },
      },
      { lane: 'work', from: 2008, to: 2013, title: 'Frontend-Entwickler', place: 'Digitalagentur, Bern' },
      {
        lane: 'education',
        from: 2011,
        to: 2014,
        title: 'BSc Multimedia Production',
        place: 'Teilzeit',
        alongside: 'Parallel zur Stelle als Frontend-Entwickler.',
      },
      { lane: 'work', from: 2015, to: 2018, title: 'UX Designer', place: 'Digitalagentur, Zürich' },
      { lane: 'work', from: 2018, to: 2021, title: 'Senior UX Designer', place: 'Bern' },
      { lane: 'work', from: 2021, to: 'today', title: 'UX Team Lead und Senior UX Designer', place: 'Bern' },
      {
        lane: 'education',
        from: 2023,
        to: 2024,
        title: 'MA Digital Management',
        place: 'Hyper Island, Teilzeit',
        alongside: 'Parallel zur Rolle als Team Lead.',
        thesis: true,
      },
    ],
  },
  howIWork: {
    label: 'Arbeitsweise',
    title: 'Wie ich arbeite',
    items: [
      {
        title: 'Mit der Frage beginnen, nicht mit dem Screen.',
        body: 'Jedes Projekt bekommt eine Forschungsfrage, bevor es ein Wireframe bekommt.',
      },
      { title: 'Gemeinsam zeichnen.', body: 'Ein gemeinsames Bild an der Wand schlägt zehn abgestimmte Foliensätze.' },
      {
        title: 'Im echten Material prototypen.',
        body: 'Oft ist das Code, denn Behördendienste brechen an den Rändern.',
      },
      { title: 'Sagen, was man anders machen würde.', body: 'Laut, in der Retro, bevor jemand fragt.' },
    ],
  },
  tcg: {
    label: 'Am Spieltisch',
    title: 'Am Spieltisch',
    image: 'about-tcg',
    body: 'Freitagabends spiele ich One Piece TCG in einem Laden in der Nähe, Magic: The Gathering in einer Commander-Runde, die sich seit 2016 jeden Monat trifft, und Yu-Gi-Oh!, wenn mein Neffe die Diskussion gewinnt. Kartenspiele haben mich mehr über Systemdesign gelehrt als die meisten Bücher. Jede Karte ist eine Komponente, jedes Format eine Reihe von Einschränkungen, und die besten Decks sind die, in denen alles zusammenspielt.',
    lessons: [
      {
        title: 'Die Reihenfolge zählt.',
        body: 'Die richtige Karte zur falschen Zeit ist die falsche Karte. Bei Features ist es gleich.',
      },
      { title: 'Den Tisch lesen.', body: 'Achte darauf, was Leute tun, nicht darauf, was sie zu tun versprechen.' },
      {
        title: 'Für das Meta bauen, nicht für den Traum.',
        body: 'Gestalte für die echten Einschränkungen, nicht für ideale Nutzende.',
      },
    ],
    stats: '14 Decks in Hüllen · Top 8 an einem regionalen Turnier von One Piece (2025) · 3 Spielmatten, eine zu viel',
  },
  roots: {
    label: 'Wurzeln',
    title: 'Interlaken',
    image: 'about-lake',
    body: 'Interlaken liegt zwischen zwei Seen, darüber Eiger, Mönch und Jungfrau. Die Höhenkurven hinter dieser Seite sind sein Gelände. Wer dort aufwächst, lernt früh, dass eine Karte ein Modell ist. Nützlich gerade deshalb, weil sie Dinge weglässt. So denke ich bis heute über Design.',
  },
  onTheTable: {
    label: 'Auf dem Tisch',
    title: 'Was auf dem Tisch liegt',
    items: [
      { label: 'Lektüre', value: 'Thinking in Systems, Donella Meadows' },
      { label: 'Baustelle', value: 'Eine Token-Pipeline für Allmend 3.0' },
      { label: 'Lernen', value: 'Japanisch, Kartentext für Kartentext' },
      { label: 'Vorhaben', value: 'Endlich den Hardergrat wandern' },
      { label: 'Kaffee', value: 'Jeden Morgen ein V60, helle Röstung' },
    ],
  },
  projects: {
    label: 'Projekte',
    title: 'Projekte',
    intro: '13 Projekte · 2014–2025',
    columns: { title: 'Projekt', year: 'Jahr', client: 'Auftraggeber', role: 'Was ich gemacht habe' },
    items: [
      {
        title: 'Programm für Barrierefreiheits-Audits',
        year: '2025',
        client: 'Bundesamt',
        role: 'Leitung der Audits und Moderation',
      },
      {
        title: 'Redesign eines Fallführungssystems',
        year: '2024',
        client: 'Sozialdienst einer Stadt',
        role: 'UX-Leitung, Research und Interaction Design',
      },
      {
        title: 'Informationsarchitektur eines Bürgerportals',
        year: '2024',
        client: 'Stadtverwaltung',
        role: 'Informationsarchitektur, Card Sorting und Tree Tests',
      },
      {
        title: 'Onlinebuchung von Terminen',
        year: '2023',
        client: 'Kantonales Strassenverkehrsamt',
        role: 'Interaction Design und Prototyping',
      },
      {
        title: 'Moderation von Design Sprints',
        year: '2023',
        client: 'Interkantonaler E-Government-Verband',
        role: 'Moderation',
      },
      {
        title: 'Assistent für die Steuererklärung',
        year: '2022',
        client: 'Kantonale Steuerverwaltung',
        role: 'Lead Designer, Research und Prototypen in Code',
      },
      {
        title: 'Interne Werkzeuge für Design Ops',
        year: '2022',
        client: 'Lindengrund Informatik',
        role: 'Product Owner und Frontend-Entwicklung',
      },
      {
        title: 'Onlinegesuch für Beiträge',
        year: '2021',
        client: 'Kantonales Amt für Landwirtschaft',
        role: 'Service Design und Formulargestaltung',
      },
      {
        title: 'Datenportal für Statistik',
        year: '2020',
        client: 'Statistikamt des Bundes',
        role: 'UX-Design und Datenvisualisierung',
      },
      {
        title: 'Relaunch des Intranets',
        year: '2019',
        client: 'Kantonsverwaltung',
        role: 'UX-Design und Inhaltsstruktur',
      },
      {
        title: 'Redesign des Checkouts',
        year: '2017',
        client: 'Detailhandel (Agenturprojekt)',
        role: 'UX-Design und Usability-Tests',
      },
      {
        title: 'Buchungsplattform für Tourismus',
        year: '2016',
        client: 'Regionale Tourismusorganisation (Agenturprojekt)',
        role: 'UX-Design und Frontend-Entwicklung',
      },
      {
        title: 'Responsive Newssite',
        year: '2014',
        client: 'Regionaler Verlag (Agenturprojekt)',
        role: 'Frontend-Entwicklung',
      },
    ],
    end: 'Das ist das ganze Deck.',
    thesis: 'Übersicht der Masterarbeit: LLMs für Burnout-Prävention',
  },
  contact: {
    label: 'Kontakt',
    title: 'Lass uns reden.',
    body: 'Wenn du an Behördendiensten, Design-Systemen oder Designführung arbeitest und dich austauschen möchtest, freue ich mich auf deine Nachricht. Ich antworte meist innert weniger Tage. Wenn du in Bern bist, geht auch ein Kaffee.',
    email: 'moritz@mjls.example',
    links: [
      // Placeholder profile: shown as text, deliberately without a link.
      { label: 'LinkedIn', value: 'linkedin.com/in/example' },
      { label: 'Ort', value: 'Bern, Schweiz' },
    ],
    note: 'Kein Newsletter, kein Tracking. Nur E-Mail.',
  },
  creditsTitle: 'Bildnachweise',
  topo: {
    label: 'Interlaken, zwischen Thunersee und Brienzersee',
    attribution: 'Geländedaten © swisstopo',
    href: 'https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices',
  },
}
