/* Case 02: Allmend design system (shared-foundations, tide). Server-only page text. */
import type { CaseStudy } from '../../schema'

export const sharedFoundations: CaseStudy = {
  slug: 'shared-foundations',
  number: '02',
  identity: 'tide',
  label: 'Platform',
  title: 'Allmend design system',
  statement: 'A design system nobody was told to use.',
  heroImage: 'shared-foundations-hero',
  summary:
    'Twelve product teams, four front-end stacks and no mandate. Allmend — Swiss German for common land — is the shared design system we grew by making the right thing the easy thing. Today nine of twelve teams build with it, and 41% of its components came from outside the core team.',
  meta: {
    client: 'Internal platform for 12 product teams building cantonal and federal applications',
    timeframe: '2022 – today',
    role: 'Product owner and lead designer; contributor to the component library',
    team: '2 designers from my team (1.2 FTE), 2 front-end developers on loan (1.0 FTE), 23 contributors from product teams',
    type: 'Design system · Platform · Influence without authority',
  },
  metrics: [
    { value: '9 of 12', label: 'product teams building with Allmend' },
    { value: '46% → 91%', label: 'audited screens passing WCAG 2.1 AA' },
    { value: '−38%', label: 'UI-related defects in adopting teams' },
    { value: '3 weeks → 4 days', label: 'from idea to clickable prototype' },
    { value: '41%', label: 'of components contributed by product teams' },
  ],
  sections: {
    context: {
      label: 'Context',
      title: 'Eleven date pickers',
      image: 'shared-foundations-process',
      caption: 'Monthly component review with contributors',
      body: [
        'Every product team had its own button. When we screenshotted 19 applications we found 11 date pickers, 6 table patterns and three shades of "official" red. Clients had started asking why applications from the same supplier looked and behaved differently, and accessibility requirements for public bodies were making the inconsistency expensive.',
      ],
      note: '19 applications, 11 date pickers, 4 front-end stacks: Angular, React, Vue and server-rendered templates.',
    },
    problem: {
      label: 'Problem',
      title: 'No authority, no mandate, four front-end stacks.',
      body: [
        "I had no authority over product teams' roadmaps, and leadership would not mandate a system that did not exist yet. Allmend had to win on usefulness alone — and work across four stacks.",
      ],
    },
    role: {
      label: 'My role',
      title: "What I owned, and what I didn't",
      body: ['I owned the system as product owner and lead designer, and wrote some of its components myself.'],
      owned: [
        'Vision and roadmap',
        'Design of foundations and components',
        'Contribution model',
        'Adoption reporting',
        'Some front-end components',
      ],
      notOwned: ["Product teams' priorities", 'Framework choices', 'Release trains of client applications'],
    },
    approach: {
      label: 'Approach',
      title: 'Making the right thing the easy thing',
      illustration: 'DesignSystemLayers',
      body: [],
      steps: [
        {
          title: 'Audit and pick the fight worth having',
          body: 'We started with forms, because every team builds them and every client is audited on them.',
        },
        {
          title: 'Tokens first, components second',
          body: 'Design decisions live in one token source, exported to CSS custom properties, so every stack consumes the same values.',
        },
        {
          title: 'Web components for the core, wrappers for the rest',
          body: 'A small framework-agnostic core, plus thin wrappers that product teams own.',
        },
        {
          title: 'Open contribution with a clear bar',
          body: 'Weekly office hours, pairing, and a public definition of done that includes accessibility checks.',
        },
      ],
    },
    decisions: {
      label: 'Key decisions',
      title: 'Four decisions and their trade-offs',
      body: [],
      items: [
        {
          decision: 'Forms first, not buttons',
          chose: 'I chose to start with the hardest, most audited pattern family.',
          tradeOff: 'The first release took five months and looked thin.',
          why: 'It solved a real pain for every team and earned us accessibility credibility with clients.',
        },
        {
          decision: 'A framework-agnostic core',
          chose: 'I chose web components and tokens over a React-only library.',
          tradeOff: 'Weaker ergonomics and harder theming of internals.',
          why: 'Two of the largest teams run Angular and one runs server templates; a React-only system would have split the company.',
        },
        {
          decision: 'Office hours over gatekeeping',
          chose: 'I chose weekly office hours and pairing instead of a review board.',
          tradeOff: 'More core-team time spent on support and a slower roadmap.',
          why: 'Contributors who paired with us came back — the contribution share grew from 8% to 41%.',
        },
        {
          decision: 'Measure adoption honestly',
          chose: "I chose to publish an adoption dashboard per team, including who doesn't use Allmend and why.",
          tradeOff: 'Uncomfortable conversations; one team lead felt exposed.',
          why: 'The "why not" column became our roadmap.',
        },
      ],
    },
    artefacts: {
      label: 'Artefacts',
      title: 'What we made along the way',
      body: [],
      items: [
        {
          title: 'Contribution loop',
          caption: 'Propose, pair, review, release, adopt — the loop every contribution follows.',
          illustration: 'ContributionLoop',
        },
        {
          title: 'The audit wall',
          caption: '19 applications screenshotted side by side: 11 date pickers, 6 table patterns, three reds.',
        },
        {
          title: 'Definition of done',
          caption:
            'One public page: tokens used, keyboard and screen-reader checks passed, docs and examples in the same pull request.',
        },
      ],
    },
    outcomes: {
      label: 'Outcomes',
      title: 'What changed',
      illustration: 'AdoptionBars',
      body: [
        'Nine of twelve active product teams now build with Allmend. In those teams, UI-related defects fell by 38% within a year of adoption, and the share of audited screens passing WCAG 2.1 AA rose from 46% to 91%. Designers go from idea to clickable prototype in four days instead of three weeks, because the prototype uses the same components as production.',
      ],
    },
    differently: {
      label: "What I'd do differently",
      title: "What I'd do differently",
      body: [
        'I underestimated documentation. We treated docs as something to write after the component, and for a year teams copied code from each other instead of reading guidance. Next time, docs and examples ship in the same pull request as the component, and a technical writer joins in month one, not year two. I would also say no earlier to client-specific theming: we spent two months on a theme used by one application.',
      ],
    },
    next: { label: 'Next', title: 'Next case', card: 'front-door' },
  },
}
