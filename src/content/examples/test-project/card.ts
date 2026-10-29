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
  coordinates: "Hochmatt (fictional) · {{years.start}}–{{years.end}}",
  type: "Service design — Public sector · Lead (fictional)",
  set: { code: "LAB", name: "Lab", symbol: "lab" },
  collector: { number: "099", language: "EN" },
  keywords: [
    {
      term: "Facilitate",
      reminder: "{{workshops.count}} workshops, {{workshops.participants}} people, {{workshops.units}} units aligned on one north-star metric.",
    },
    {
      term: "Systematise",
      reminder: "{{decisions.components}} Angular Material components with cantonal tokens, reused by {{decisions.reuseServices}} services.",
    },
    { term: "Ship", reminder: "discovery to staged rollout in {{project.months}} months, WCAG 2.1 AA audited." },
  ],
  flavor: "“The form was asking the wrong person.” — field note, week {{discovery.fieldNoteWeek}}",
  stats: {
    teamLed: "{{team.ux}} + {{team.productDev}}",
    time: "{{project.months}} mo",
    scope: "{{reach.perYear|en}}/yr",
    impact: { before: "{{outcomes.complete.before}}%", after: "{{outcomes.complete.after}}%" },
  },
  indexLine: { kind: "Service", summary: "A subsidy form people finish", time: "{{project.months}} months" },
  artwork: { kind: "seeded", terrainId: "lab-099" },
  artworkAlt: "Contour map of a fictional massif generated for this example, with a dotted trail to the summit.",
  summary:
    "A fictional model case study: a bilingual subsidy service where {{outcomes.complete.after}}% of applications are now complete on first submission. It demonstrates the case-study format.",
  example: true,
};

export const card: SummitCardData = fillDeep(rawCard, data);
