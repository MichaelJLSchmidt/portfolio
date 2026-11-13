/*
 * The words inside the illustrations (English): each drawing's <title>,
 * <desc> and labels. Server-only; pages spread an entry into its component.
 */
import type { IllustrationCopy } from '../schema'

export const illustrations: IllustrationCopy = {
  TeamGrowthTimeline: {
    title: 'Team growth',
    description:
      'Team grew from 2 to 5 people between 2021 and 2025, with one hire node per year in which someone joined (2022, 2024, 2025).',
    labels: { team: 'Team', joined: 'Joined' },
  },
  IntakeBeforeAfter: {
    title: 'Intake before and after',
    description:
      'Before: requests from 6 sources reach the team as tangled, crossing lines. After: every request goes through one front door, which routes it into 3 offers: Check-up, Sprint, Embedded.',
    offers: ['Check-up', 'Sprint', 'Embedded'],
    labels: { before: 'Before', after: 'After', team: 'Team', frontDoor: 'Front door' },
  },
  DesignSystemLayers: {
    title: 'Design system layers',
    description:
      '5 layers stacked from the foundation up: Tokens, Primitives, Components, Patterns, Product apps. The top layer serves 4 kinds of product app: Angular, React, Vue, Server templates.',
    layers: ['Tokens', 'Primitives', 'Components', 'Patterns', 'Product apps'],
    badges: ['Angular', 'React', 'Vue', 'Server templates'],
  },
  ContributionLoop: {
    title: 'Contribution loop',
    description:
      'A loop of 5 stages a contribution goes through, in order: Propose, Pair, Review, Release, Adopt, then back to Propose. Arrows show the direction.',
    steps: ['Propose', 'Pair', 'Review', 'Release', 'Adopt'],
  },
  AdoptionBars: {
    title: 'Platform adoption by team',
    description: '9 of 12 teams have adopted the platform; 3 have not yet. One bar per team.',
    labels: { adopted: 'Adopted', notYet: 'Not yet' },
  },
  ServiceBlueprint: {
    title: 'Service blueprint, before and after',
    description:
      "Swim lanes for Resident, Online service, Municipality, Residents' registry, Tax administration. Before: the resident has 5 separate touchpoints across the offices. After: one entry through the online service, routed to Municipality, Residents' registry, Tax administration.",
    lanes: ['Resident', 'Online service', 'Municipality', "Residents' registry", 'Tax administration'],
    labels: { before: 'Before', after: 'After' },
  },
  JourneyEmotionCurve: {
    title: 'Journey emotion curve',
    description:
      'How a resident feels across 8 steps, from Decide to move to Settled. The curve dips to its lowest point at "Tell tax office" and recovers after it.',
    steps: [
      'Decide to move',
      'Find a flat',
      'Give notice',
      'Move',
      'Register',
      'Tell tax office',
      'Update records',
      'Settled',
    ],
  },
  TeamConstellation: {
    title: 'Team constellation',
    description: '12 people in 3 squads (4, 3, 5 people), each person linked to one lead in the middle.',
    squads: [
      { label: 'Squad A', size: 4 },
      { label: 'Squad B', size: 3 },
      { label: 'Squad C', size: 5 },
    ],
    lead: 'Lead',
  },
  WeekRing: {
    title: 'A week of rituals',
    description:
      'A week from Mon to Fri drawn as a ring. Weekly rituals: Check-in (Mon), 1:1s (Tue, Thu), Critique (Wed).',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    rituals: ['Check-in', '1:1s', 'Critique'],
  },
  CareerMatrix: {
    title: 'Career framework',
    description:
      'A grid of 4 levels (Designer, Experienced designer, Senior designer, Lead) by 3 tracks (Craft, Collaboration, Impact). One highlighted path runs through it: Designer in Craft, then Experienced designer in Craft, then Senior designer in Collaboration, then Lead in Impact.',
  },
  WorkshopGlyphs: {
    title: 'Workshop methods',
    description:
      '4 workshop methods as simple glyphs: Crazy Eights, a sheet folded into eight panels, one idea per panel; 1-2-4-All, one person, then pairs, then fours, then the whole room in a circle; Dot Voting, three options with votes stacked above them as dots; Fishbowl, an inner circle of four seats inside a ring of listeners.',
  },
  WorkshopGlyph: {
    'crazy-eights': {
      title: 'Crazy Eights',
      description: 'Workshop method Crazy Eights: a sheet folded into eight panels, one idea per panel.',
    },
    'one-two-four-all': {
      title: '1-2-4-All',
      description: 'Workshop method 1-2-4-All: one person, then pairs, then fours, then the whole room in a circle.',
    },
    'dot-voting': {
      title: 'Dot Voting',
      description: 'Workshop method Dot Voting: three options with votes stacked above them as dots.',
    },
    fishbowl: {
      title: 'Fishbowl',
      description: 'Workshop method Fishbowl: an inner circle of four seats inside a ring of listeners.',
    },
  },
  DiscardedCard: {
    title: 'A discarded card',
    description: 'A single playing card lying face down, its back showing a framed diamond.',
  },
}
