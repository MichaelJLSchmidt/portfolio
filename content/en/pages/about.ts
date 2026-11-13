/*
 * About (/about, glacier). Server-only page text: the chapters in order, the
 * "Projects" list and the closing "Contact" chapter (both were pages of their
 * own), the credits heading and the topography's label and attribution.
 * about-og (the Open Graph image) has no slot on the page.
 */
import type { About } from '../../schema'

export const about: About = {
  title: 'About',
  lead: 'I grew up between two lakes and still think in contour lines.',
  portrait: 'about-portrait',
  story: {
    label: 'Story',
    image: 'about-roots',
    caption: 'Interlaken, between Lake Thun and Lake Brienz',
    body: [
      "I was born in Interlaken in 1988, on the strip of flat land between Lake Thun and Lake Brienz. My first job was an apprenticeship as a Mediamatiker in Thun, building websites for hotels in the Oberland — which taught me that people don't read, they scan for the thing they came for.",
      "I spent five years as a front-end developer at a Bern agency before a Hyper Island programme in Stockholm changed how I think about teams. I came back more interested in how people decide together than in any single screen, and I've been designing workshops ever since.",
      'After three years as a UX designer at a Zurich agency, I joined Lindengrund in 2018 to work on public services. In 2021 I became UX Team Lead. I still design and prototype every week, because leading a design team from a distance never works for long.',
    ],
  },
  timeline: {
    label: 'Timeline',
    title: 'Timeline',
    lanes: { work: 'Work', education: 'Education' },
    both: 'Work and education',
    today: 'today',
    alongside: 'alongside',
    thesisLink: 'Thesis overview',
    items: [
      {
        lane: 'both',
        from: 2004,
        to: 2008,
        title: 'Apprenticeship as Mediamatiker',
        place: 'Thun',
        parts: {
          work: { title: 'Company part', place: 'Thun' },
          education: { title: 'Vocational school', place: 'Thun' },
        },
      },
      { lane: 'work', from: 2008, to: 2013, title: 'Front-end developer', place: 'Digital agency, Bern' },
      {
        lane: 'education',
        from: 2011,
        to: 2014,
        title: 'BSc Multimedia Production',
        place: 'Part-time',
        alongside: 'Alongside the front-end developer role.',
      },
      { lane: 'work', from: 2015, to: 2018, title: 'UX designer', place: 'Digital agency, Zurich' },
      { lane: 'work', from: 2018, to: 2021, title: 'Senior UX designer', place: 'Bern' },
      { lane: 'work', from: 2021, to: 'today', title: 'UX Team Lead and Senior UX Designer', place: 'Bern' },
      {
        lane: 'education',
        from: 2023,
        to: 2024,
        title: 'MA Digital Management',
        place: 'Hyper Island, part-time',
        alongside: 'Alongside the team lead role.',
        thesis: true,
      },
    ],
  },
  howIWork: {
    label: 'How I work',
    title: 'How I work',
    items: [
      {
        title: 'Start with the question, not the screen.',
        body: 'Every project gets a research question before it gets a wireframe.',
      },
      { title: 'Draw it together.', body: 'A shared picture on a wall beats ten aligned slide decks.' },
      {
        title: 'Prototype in the real material.',
        body: "Often that's code, because public services break at the edges.",
      },
      { title: "Say what you'd do differently.", body: 'Out loud, in the retro, before anyone asks.' },
    ],
  },
  tcg: {
    label: 'At the table',
    title: 'At the table',
    image: 'about-tcg',
    body: 'I play One Piece TCG at a local store on Friday evenings, Magic: The Gathering in a Commander group that has met monthly since 2016, and Yu-Gi-Oh! when my nephew wins the argument. Card games have taught me more about systems design than most books: every card is a component, every format a set of constraints, and the best decks are the ones where everything works together.',
    lessons: [
      {
        title: 'Sequencing matters.',
        body: 'The right card at the wrong time is the wrong card. Same with features.',
      },
      { title: 'Read the table.', body: "Watch what people do, not what they say they'll do." },
      {
        title: 'Build for the meta, not the dream.',
        body: 'Design for the real constraints, not the ideal user.',
      },
    ],
    stats: '14 sleeved decks · Top 8 at a regional One Piece event (2025) · 3 playmats, one too many',
  },
  roots: {
    label: 'Roots',
    title: 'Interlaken',
    image: 'about-lake',
    body: "Interlaken sits between two lakes, overlooked by the Eiger, Mönch and Jungfrau. The contour lines behind this page are its terrain. Growing up there, you learn early that a map is a model — useful precisely because it leaves things out. That's still how I think about design.",
  },
  onTheTable: {
    label: 'On the table',
    title: "What's on the table",
    items: [
      { label: 'Reading', value: 'Thinking in Systems, Donella Meadows' },
      { label: 'Building', value: 'A token pipeline for Allmend 3.0' },
      { label: 'Learning', value: 'Japanese, one card text at a time' },
      { label: 'Planning', value: 'Finally hiking the Hardergrat' },
      { label: 'Brewing', value: 'A V60 every morning, light roast' },
    ],
  },
  projects: {
    label: 'Projects',
    title: 'Projects',
    intro: '13 projects · 2014–2025',
    columns: { title: 'Project', year: 'Year', client: 'Client', role: 'What I did' },
    items: [
      {
        title: 'Accessibility audit programme',
        year: '2025',
        client: 'Federal office',
        role: 'Audit lead and facilitator',
      },
      {
        title: 'Case-management tool redesign',
        year: '2024',
        client: 'Municipal social services',
        role: 'UX lead, research and interaction design',
      },
      {
        title: 'Citizen portal information architecture',
        year: '2024',
        client: 'City administration',
        role: 'Information architecture, card sorting and tree tests',
      },
      {
        title: 'Appointment booking service',
        year: '2023',
        client: 'Cantonal road traffic office',
        role: 'Interaction design and prototyping',
      },
      {
        title: 'Design sprint facilitation',
        year: '2023',
        client: 'Intercantonal e-government association',
        role: 'Facilitator',
      },
      {
        title: 'Tax return assistant',
        year: '2022',
        client: 'Cantonal tax administration',
        role: 'Lead designer, research and prototypes in code',
      },
      {
        title: 'Internal design-ops tooling',
        year: '2022',
        client: 'Lindengrund Informatik',
        role: 'Product owner and front-end development',
      },
      {
        title: 'Grant application service',
        year: '2021',
        client: 'Cantonal agriculture office',
        role: 'Service design and form design',
      },
      {
        title: 'Statistics data portal',
        year: '2020',
        client: 'Federal statistics office',
        role: 'UX design and data visualisation',
      },
      {
        title: 'Intranet relaunch',
        year: '2019',
        client: 'Cantonal administration',
        role: 'UX design and content structure',
      },
      {
        title: 'Checkout redesign',
        year: '2017',
        client: 'Retail company (agency project)',
        role: 'UX design and usability testing',
      },
      {
        title: 'Tourism booking platform',
        year: '2016',
        client: 'Regional tourism organisation (agency project)',
        role: 'UX design and front-end development',
      },
      {
        title: 'Responsive news site',
        year: '2014',
        client: 'Regional publisher (agency project)',
        role: 'Front-end development',
      },
    ],
    end: "That's the whole deck.",
    thesis: "Master's thesis overview: LLMs for burnout prevention",
  },
  contact: {
    label: 'Contact',
    title: "Let's talk.",
    body: "If you're working on public services, design systems or design leadership and want to compare notes, I'd like to hear from you. I usually reply within a few days. If you're in Bern, coffee works too.",
    email: 'moritz@mjls.example',
    links: [
      // Placeholder profile: shown as text, deliberately without a link.
      { label: 'LinkedIn', value: 'linkedin.com/in/example' },
      { label: 'Location', value: 'Bern, Switzerland' },
    ],
    note: 'No newsletter, no tracking. Just email.',
  },
  creditsTitle: 'Photo credits',
  topo: {
    label: 'Interlaken, between Lake Thun and Lake Brienz',
    attribution: 'Terrain data © swisstopo',
    href: 'https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices',
  },
}
