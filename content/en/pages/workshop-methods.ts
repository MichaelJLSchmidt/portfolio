/*
 * The workshop draw on /management (egg): its button label is
 * management.workshops.drawButton. Server-only; the page passes it to the
 * client component as props (D7).
 */
import type { WorkshopMethods } from '../../schema'

export const workshopMethods: WorkshopMethods = {
  again: 'Draw another',
  drawn: 'Workshop method: {title}. {howTo}',
  methods: [
    {
      title: '1-2-4-All',
      howTo: 'Think alone for a minute, then in pairs, then in fours; share one idea with everyone.',
    },
    { title: 'Crazy 8s', howTo: 'Fold a sheet into eight panels and sketch eight ideas in eight minutes.' },
    { title: 'How Might We', howTo: 'Rewrite each problem note as "How might we…?" and cluster the questions.' },
    {
      title: 'Lightning Decision Jam',
      howTo: 'Problems, vote, reframe, solutions, vote, effort/impact, actions — in one hour.',
    },
    { title: 'Dot voting', howTo: 'Everyone gets three dots; vote silently, then discuss the outliers first.' },
    { title: 'Brainwriting 6-3-5', howTo: 'Six people write three ideas in five minutes, then pass the sheet on.' },
    { title: 'Rose, Thorn, Bud', howTo: 'Name what works, what hurts and what could grow.' },
    {
      title: 'Troika Consulting',
      howTo: 'One person shares a challenge and turns away while two others consult on it.',
    },
    { title: 'Pre-mortem', howTo: 'Imagine the project has failed, write down why, and fix the top three causes now.' },
    { title: 'Empathy map', howTo: 'Fill in says, thinks, does and feels — from research, not assumptions.' },
    { title: 'Fishbowl', howTo: 'An inner circle talks, an outer circle listens; anyone can swap in.' },
    {
      title: 'Impromptu Networking',
      howTo: 'Three short rounds with a new partner each time and one shared question.',
    },
  ],
}
