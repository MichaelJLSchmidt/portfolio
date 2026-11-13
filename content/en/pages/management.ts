/*
 * Management (/management, saffron). Server-only page text. The card itself
 * (title "Management", type, facts) lives in content/hand.ts.
 */
import type { Management } from '../../schema'

export const management: Management = {
  slug: 'management',
  identity: 'saffron',
  title: 'How I lead',
  lead: "I lead a team of five — four designers and a researcher, 4.0 FTE — inside an IT services company for public administration. My job is to make good work possible: clear priorities, honest feedback, protected time to think, and work we're proud to ship.",
  principles: {
    label: 'Principles',
    title: 'Five principles, with evidence',
    image: 'management-principles',
    items: [
      {
        title: 'Clarity is kindness',
        evidence:
          "Everyone on the team has a one-page role charter and quarterly goals they wrote themselves. In our last team survey, five out of five said they know what's expected of them.",
      },
      {
        title: 'Evidence before opinion',
        evidence:
          'Every project starts with a research question. Across the team we ran 38 usability tests in 2025 — at least one a month.',
      },
      {
        title: 'Design in the open',
        evidence:
          'Our weekly critique is open to anyone in the company. On average, four guests from product teams join.',
      },
      {
        title: 'Protect deep work',
        evidence: 'Two meeting-free half-days a week, held since 2022. Status updates are written, not spoken.',
      },
      {
        title: 'Grow people, not dependency',
        evidence: 'Two team members now lead client workshops on their own, and one was promoted to senior in 2025.',
      },
    ],
  },
  team: {
    label: 'Team',
    title: "Who's on the team",
    members: [
      { initials: 'ML', role: 'Lead', fte: '100%', focus: 'People, priorities and practice; still about 20% hands-on' },
      { initials: 'AK', role: 'Senior UX designer', fte: '100%', focus: 'Embedded in the tax domain' },
      { initials: 'RB', role: 'UX researcher', fte: '80%', focus: 'Research operations and studies across domains' },
      { initials: 'SO', role: 'UX designer & front-end', fte: '100%', focus: 'Allmend core team' },
      { initials: 'LM', role: 'UX designer', fte: '80%', focus: 'Registries and public services' },
      { initials: 'NG', role: 'Design apprentice', fte: '40%', focus: 'In-company days, rotating across projects' },
    ],
    note: '4.0 FTE excluding the lead. Team members are shown as initials only.',
  },
  rituals: {
    label: 'Rituals',
    title: 'How a week runs',
    items: [
      { name: 'Monday check-in', cadence: 'Weekly, 20 min', purpose: 'Priorities and blockers, standing' },
      { name: '1:1s', cadence: 'Weekly, 30 min', purpose: 'Their agenda, not mine' },
      { name: 'Wednesday critique', cadence: 'Weekly, 60 min', purpose: 'Open to the whole company' },
      { name: 'Research share', cadence: 'Fortnightly, 30 min', purpose: 'One finding, one clip, one question' },
      {
        name: 'Retro and planning',
        cadence: 'Quarterly, half a day',
        purpose: 'Once a year off-site in the Bernese Oberland',
      },
      { name: 'Growth conversation', cadence: 'Twice a year', purpose: 'Against the career framework' },
    ],
  },
  hiring: {
    label: 'Hiring',
    title: 'How we hire',
    steps: [
      { title: 'Intro call', duration: '30 min', purpose: 'Mutual fit and questions' },
      {
        title: 'Portfolio conversation',
        duration: '60 min',
        purpose: 'The candidate picks one project and we go deep',
      },
      {
        title: 'Paired exercise',
        duration: '90 min',
        purpose: 'A real, anonymised problem, solved together — no take-home work',
      },
      { title: 'Team lunch', duration: '60 min', purpose: "Meet the people you'd work with" },
      { title: 'Decision', duration: 'Within five working days', purpose: 'Written feedback for every finalist' },
    ],
    note: 'Structured scorecards, always two interviewers, the same questions for every candidate.',
  },
  growth: {
    label: 'Growth',
    title: 'How people grow',
    body: 'A career framework with four levels across three dimensions. Each person has CHF 2,000 and five days a year for learning, and chooses how to use them. Two promotions since 2023.',
    levels: ['Designer', 'Experienced designer', 'Senior designer', 'Lead'],
    dimensions: ['Craft', 'Collaboration', 'Impact'],
  },
  workshops: {
    label: 'Workshops',
    title: 'Workshops I run',
    image: 'management-workshops',
    drawButton: 'Draw a method',
    formats: [
      {
        name: 'Kick-off canvas',
        glyph: 'one-two-four-all',
        duration: 'Half a day',
        who: 'Product owner, team, a client representative',
        outcome: 'Shared goals, risks and a research question',
      },
      {
        name: 'Service blueprint jam',
        glyph: 'fishbowl',
        duration: 'Full day',
        who: 'Up to 30 people from several organisations',
        outcome: 'One picture of the whole service and its pain points',
      },
      {
        name: 'Design studio',
        glyph: 'crazy-eights',
        duration: '2 hours',
        who: '6–10 people',
        outcome: 'Three sketched directions and a decision on what to prototype',
      },
      {
        name: 'Retro with a twist',
        glyph: 'dot-voting',
        duration: '60 min',
        who: 'The team',
        outcome: 'Two experiments for the next sprint',
      },
    ],
  },
  metrics: {
    label: 'Numbers',
    title: 'Numbers I watch',
    items: [
      { value: '4.5 / 5', label: '"I can do my best work here" (quarterly team survey)' },
      { value: '71%', label: 'of new projects with UX from kick-off' },
      { value: '38', label: 'usability tests in 2025' },
      { value: '94%', label: 'of planned 1:1s held' },
      { value: '92%', label: 'of learning days used' },
    ],
  },
}
