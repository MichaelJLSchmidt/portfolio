/* Case 03: Moving house, once (front-door, grove). Server-only page text. */
import type { CaseStudy } from '../../schema'

export const frontDoor: CaseStudy = {
  slug: 'front-door',
  number: '03',
  identity: 'grove',
  label: 'Service',
  title: 'Moving house, once',
  statement: "Tell us once. We'll tell the other four.",
  heroImage: 'front-door-hero',
  summary:
    'Moving within the canton meant telling up to five offices the same thing, often on paper and in person. We designed one online service that tells all of them at once. Today 83% of people who start it finish it, and calls about moves have dropped by almost a third.',
  meta: {
    client: "A cantonal residents' registry, 27 municipalities and a cantonal tax administration",
    timeframe: '2023 – 2025',
    role: 'Lead service designer and UX lead of the delivery team',
    team: '3 people from my team, 6 developers, a product owner from the canton, one contact per municipality',
    type: 'Public service design · Cross-organisation delivery',
  },
  metrics: [
    { value: '54% → 83%', label: 'online completion rate' },
    { value: '−31%', label: 'phone enquiries about moves' },
    { value: '72%', label: 'of moves processed the same day (before: 6.5 days on average)' },
    { value: '27 of 27', label: 'municipalities live (pilot: 4)' },
    { value: '62 → 81', label: 'System Usability Scale score' },
  ],
  sections: {
    context: {
      label: 'Context',
      title: 'Five offices, one move',
      image: 'front-door-process',
      caption: 'Blueprint workshop with registry, municipalities and tax administration',
      body: [
        'Residents who moved had to deregister in their old municipality, register in the new one, and update their address for tax, vehicle registration and, for some, social benefits. An older online form existed, but it only reached the new municipality. More than half the people who started it gave up, and counter staff re-typed the data by hand.',
      ],
      note: '1,200 support tickets analysed; the most common question was "Do I also need to tell the tax office?"',
    },
    problem: {
      label: 'Problem',
      title: 'Nobody owned "moving house".',
      illustration: 'JourneyEmotionCurve',
      body: [
        'Nobody owned "moving house". The registry owned the data, each municipality owned its counter, the tax administration owned its records — each with its own legal basis, budget and IT supplier. The design problem was as much about agreement as about screens.',
      ],
    },
    role: {
      label: 'My role',
      title: "What I owned, and what I didn't",
      body: ['I led the service design and the UX work of the delivery team, across five organisations.'],
      owned: [
        'Research and service blueprint',
        'Workshop facilitation across organisations',
        'Interaction design and prototypes',
        'Rollout feedback loop',
      ],
      notOwned: ['Legal agreements', 'Back-end integrations', 'Municipal staffing decisions'],
    },
    approach: {
      label: 'Approach',
      title: 'Designing the agreement, not just the screens',
      illustration: 'ServiceBlueprint',
      body: [],
      steps: [
        {
          title: 'See it from the kitchen table',
          body: '18 contextual interviews with people who had just moved, three days shadowing at municipal counters, and an analysis of 1,200 support tickets.',
        },
        {
          title: 'Draw the whole service',
          body: 'A service blueprint across five organisations, built in two workshops with 26 participants, made the duplicate data entry visible to everyone in the room.',
        },
        {
          title: 'Prototype the agreement, not just the UI',
          body: 'We prototyped the data handover between registry and municipalities as a clickable flow, so lawyers and IT leads could review it together.',
        },
        {
          title: 'Pilot small, roll out in cohorts',
          body: 'Four municipalities first, then three cohorts over nine months, with a weekly feedback call.',
        },
      ],
    },
    decisions: {
      label: 'Key decisions',
      title: 'Four decisions and their trade-offs',
      body: [],
      items: [
        {
          decision: 'One question, asked once',
          chose: "I chose to ask for each piece of data once and route it, instead of mirroring each office's form.",
          tradeOff: 'It required a new data agreement between registry and tax administration and added four months.',
          why: 'Duplicate questions were the main reason people gave up.',
        },
        {
          decision: 'Keep the counter',
          chose: 'I chose a service that counter staff use on behalf of people who come in person.',
          tradeOff: 'Extra roles, permissions and testing.',
          why: "Municipalities trusted a tool their own staff used, and it serves people who can't or won't go online.",
        },
        {
          decision: 'Plain language on screen, legal detail on demand',
          chose: 'I chose plain-language questions with legal references in expandable notes.',
          tradeOff: 'A long negotiation and two review rounds with legal services.',
          why: 'In testing, completion rose from 61% to 84% with the plain-language version.',
        },
        {
          decision: 'Pilot with the sceptics',
          chose: 'I chose to include the two most critical municipalities in the pilot.',
          tradeOff: 'A slower pilot and harder conversations.',
          why: 'Once they were on board, the others followed without escalation.',
        },
      ],
    },
    artefacts: {
      label: 'Artefacts',
      title: 'What we made along the way',
      body: [],
      items: [
        {
          title: 'Plain-language questions',
          caption: 'Every question on screen in plain language, with the legal reference one tap away.',
        },
        {
          title: 'Data handover prototype',
          caption:
            'A clickable flow of the handover between registry and municipalities, reviewed by lawyers and IT leads together.',
        },
        {
          title: 'Rollout in cohorts',
          caption: 'Four pilot municipalities, then three cohorts over nine months, with a weekly feedback call.',
        },
      ],
    },
    outcomes: {
      label: 'Outcomes',
      title: 'What changed',
      body: [
        'All 27 municipalities are live. The online completion rate rose from 54% to 83%, phone enquiries about moves fell by 31%, and 72% of moves are now processed on the same day instead of after six and a half days on average. Counter staff no longer re-type data, and the SUS score rose from 62 to 81.',
      ],
    },
    differently: {
      label: "What I'd do differently",
      title: "What I'd do differently",
      body: [
        'We tested with too few people who move rarely and under stress — older residents, people separating, people under guardianship. They surfaced late, during rollout, and forced a redesign of the "who moves with you" step. Next time I would recruit for life situations, not demographics, from the first round. I would also open the feedback channel for counter staff on day one of the pilot, not in week six.',
      ],
    },
    next: { label: 'Next', title: 'Next case', card: 'team-of-teams' },
  },
}
