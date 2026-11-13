/* Case 01: Building the team (team-of-teams, ember). Server-only page text. */
import type { CaseStudy } from '../../schema'

export const teamOfTeams: CaseStudy = {
  slug: 'team-of-teams',
  number: '01',
  identity: 'ember',
  label: 'Teams',
  title: 'Building the team',
  statement: 'From two designers to a UX practice.',
  heroImage: 'team-of-teams-hero',
  summary:
    'In 2021, UX at Lindengrund meant two designers lent out to whichever project shouted loudest. Four years later it is a team of five with a clear front door, shared rituals, a career framework — and product teams that ask for us at kick-off. This is how I built it, including what I got wrong.',
  meta: {
    client: 'Internal — serving cantonal and federal clients',
    timeframe: '2021 – 2025',
    role: 'UX Team Lead — line manager, hiring manager, practice owner',
    team: 'Grew from 2 to 5 people (4.0 FTE); 14 product teams as internal customers',
    type: 'People leadership · Practice building',
  },
  metrics: [
    { value: '18% → 71%', label: 'of new projects with UX involved from kick-off' },
    { value: '9 → 3 weeks', label: 'average wait for a designer' },
    { value: '0', label: 'regretted departures in four years' },
    { value: '3.1 → 4.4', label: 'internal satisfaction with UX support (out of 5)' },
    { value: '160+', label: 'design critiques run since 2022' },
  ],
  sections: {
    context: {
      label: 'Context',
      title: 'Two designers, fourteen teams',
      image: 'team-of-teams-process',
      caption: 'Weekly critique, open to anyone in the company',
      body: [
        "Lindengrund builds and runs software for cantons, municipalities and federal offices: tax portals, registries, case-management tools. In 2021 it had around 380 people, 14 product teams and two UX designers who sat in different departments, had no shared tools and were booked through project managers' personal networks. Design arrived late — usually after a client had complained.",
      ],
      note: 'Two designers for 14 teams meant one designer per seven teams. Most teams had never worked with one.',
    },
    problem: {
      label: 'Problem',
      title: 'Every request was a favour. Every "no" felt personal.',
      body: [
        'I was asked, "Can you make UX scale?" The real problem underneath: nobody could see what UX work existed, what it cost or what it changed. Without that, every request was a favour and every "no" felt personal.',
      ],
    },
    role: {
      label: 'My role',
      title: "What I owned, and what I didn't",
      body: ['I was line manager, hiring manager and owner of the practice. The product teams kept their roadmaps.'],
      owned: [
        'Team strategy and structure',
        'Hiring and onboarding',
        'Intake and capacity planning',
        'Career framework',
        'Budget proposals to the executive board',
      ],
      notOwned: ['Product roadmaps of the 14 teams', 'Salary bands (set by HR)', 'Client contracts'],
    },
    approach: {
      label: 'Approach',
      title: 'Four moves over four years',
      illustration: 'IntakeBeforeAfter',
      body: [],
      steps: [
        {
          title: 'Make the work visible (months 1–3)',
          body: 'I interviewed 22 product owners and project leads and mapped every running and planned project on one wall. We found 31 projects with user-facing changes, and UX was involved in five.',
        },
        {
          title: 'Build a front door (months 3–6)',
          body: 'A one-page intake form, a fortnightly triage with two department heads, and three engagement models: Check-up (2 days), Sprint (2–4 weeks) and Embedded (one designer for 3+ months).',
        },
        {
          title: 'Grow the team in order of leverage (2022–2024)',
          body: 'First a UX researcher, because in public administration evidence wins budget arguments. Then a designer who codes, to close the gap to development. Then a UX designer and a design apprentice.',
        },
        {
          title: 'Make growth explicit (2023–2025)',
          body: "A career framework with four levels, written with the team, linked to the company's salary bands and reviewed twice a year.",
        },
      ],
    },
    decisions: {
      label: 'Key decisions',
      title: 'Four decisions and their trade-offs',
      body: [],
      items: [
        {
          decision: 'Research before more designers',
          chose: 'I chose to make a UX researcher the first new hire.',
          tradeOff: 'For six months we delivered fewer screens, and two product teams waited longer.',
          why: 'Research findings put design on steering-committee agendas, and the next two positions were approved on that evidence.',
        },
        {
          decision: 'Engagement models, not a ticket queue',
          chose: 'I chose three fixed engagement models with clear scope.',
          tradeOff: 'We said no to small "make it prettier" requests, and some people were annoyed.',
          why: 'Fixed models made capacity planning possible and turned favours into commitments.',
        },
        {
          decision: 'Hire for range, not seniority',
          chose: 'I chose designers who can facilitate and prototype in code over pure visual specialists.',
          tradeOff: 'Our visual polish lagged for a year; we brought in a freelance visual designer for two launches.',
          why: 'A designer who can run a workshop with a cantonal office and ship a working prototype changes more than a perfect mock-up.',
        },
        {
          decision: 'Write the career framework with the team',
          chose: 'I chose to co-create the levels in four workshops instead of adopting a template.',
          tradeOff: 'It took four months instead of four weeks.',
          why: 'People trusted it because they wrote the descriptions of their own work.',
        },
      ],
    },
    artefacts: {
      label: 'Artefacts',
      title: 'What we made along the way',
      body: [],
      items: [
        {
          title: 'Team growth, 2021–2025',
          caption: 'Hires in order of leverage: research first, then a designer who codes.',
          illustration: 'TeamGrowthTimeline',
        },
        {
          title: 'Intake one-pager',
          caption: 'One page, a fortnightly triage and three engagement models: Check-up, Sprint, Embedded.',
        },
        {
          title: 'Career framework',
          caption: 'Four levels, three dimensions, written with the team in four workshops.',
          illustration: 'CareerMatrix',
        },
      ],
    },
    outcomes: {
      label: 'Outcomes',
      title: 'What changed',
      body: [
        'By the end of 2025, UX was involved from kick-off in 71% of new projects, up from 18%. The average wait for a designer fell from nine weeks to three. Internal satisfaction with UX support, measured in a yearly survey of product owners, rose from 3.1 to 4.4 out of 5. Nobody we wanted to keep has left the team.',
      ],
    },
    differently: {
      label: "What I'd do differently",
      title: "What I'd do differently",
      body: [
        "I waited too long to stop doing hands-on project work. For most of 2022 I was the team's bottleneck — leading, hiring and designing a tax portal at the same time. I would hand over my last project six months earlier and protect two days a week for the team. I would also bring finance in during year one: the moment our time was tracked against engagement models, budget conversations got easier.",
      ],
    },
    next: { label: 'Next', title: 'Next case', card: 'shared-foundations' },
  },
}
