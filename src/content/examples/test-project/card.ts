import type { SummitCardData } from "@/content/cards";
import { fillDeep } from "@/lib/fill";
import { data } from "./data";

/** The Summit card as written: numbers are {{tokens}} into data.ts (check:figures reads this). */
export const rawCard: SummitCardData = {
  slug: "test-project",
  name: "Test Project",
  rarity: "R",
  cost: "{{card.cost}}",
  costLabel: "Summit cost {{card.cost}} of {{card.costScale}}",
  rarityNote: "led the team and the UX strategy",
  coordinates: "Hochmatt (fictional)",
  type: "Service — Public sector · Lead (fictional)",
  set: { code: "LAB", name: "Lab", symbol: "lab" },
  collector: { number: "099", language: "EN" },
  keywords: [
    {
      term: "Facilitate",
      reminder: "{{workshops.count}} workshops, {{workshops.participants}} people, {{workshops.units}} units aligned on one north-star metric.",
    },
    {
      term: "Systematise",
      reminder: "{{decisions.components}} components from the Gratweg design system.",
    },
    { term: "Ship", reminder: "discovery to staged rollout in {{project.months}} months, WCAG 2.1 AA audited." },
  ],
  flavor: "“The form was asking the wrong person.” — field note, week {{discovery.fieldNoteWeek}}",
  stats: {
    teamLed: "{{team.designersLed}} + {{team.productDev}}",
    time: "{{project.months}} MO",
    scope: "{{workshops.units}} units · {{reach.perYear|en}}/yr",
    impact: { before: "{{outcomes.complete.before}}%", after: "{{outcomes.complete.after}}%" },
  },
  indexLine: { kind: "Service", summary: "A subsidy form people finish", time: "{{project.months}} months" },
  artwork: { kind: "crop", terrainId: "moench" },
  artworkAlt: "Contour map of the Mönch from swisstopo data, with a dotted trail from Eigergletscher by the Jungfraujoch and the Mönchsjoch hut up the southeast ridge to the summit.",
  summary:
    "A fictional model case study: a bilingual subsidy service where {{outcomes.complete.after}}% of applications are now complete on first submission. It demonstrates the case-study format.",
  example: true,
};

export const card: SummitCardData = fillDeep(rawCard, data);
