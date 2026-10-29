import type { SummitCardData } from "@/content/cards";
import { fillDeep } from "@/lib/fill";
import { data } from "./data";

/** The Summit card as written: numbers are {{tokens}} into data.ts (check:figures reads this). */
export const rawCard: SummitCardData = {
  slug: "seilschaft",
  name: "Seilschaft",
  rarity: "R",
  cost: "{{card.cost}}",
  costLabel: "Summit cost {{card.cost}} of {{card.costScale}}",
  rarityNote: "built and led the practice",
  coordinates: "Hochmatt (fictional)",
  type: "People — Practice building · Lead (fictional)",
  set: { code: "LAB", name: "Lab", symbol: "lab" },
  collector: { number: "097", language: "EN" },
  keywords: [
    { term: "Hire", reminder: "{{team.hires}} hires in {{project.years}} years, work samples instead of take-home tasks." },
    { term: "Grow", reminder: "a {{ladder.levels|word}}-level career ladder, {{team.promotions}} internal promotions." },
    { term: "Protect", reminder: "one intake, {{intake.tiers|word}} tiers, no more {{desk.lateWeeks|word}}-week ambushes." },
  ],
  flavor: "“We stopped taking tickets and started taking seats.” — team retro, {{years.retro}}",
  stats: {
    teamLed: "{{team.start}} → {{team.end}}",
    time: "{{project.years}} YRS",
    scope: "{{org.productTeams}} product teams",
    impact: { before: "{{requests.before}}%", after: "{{requests.after}}%", note: "early" },
  },
  indexLine: { kind: "People", summary: "Built a UX practice from {{team.start}} to {{team.end}}", time: "{{project.years}} years" },
  artwork: { kind: "seeded", terrainId: "lab-097" },
  artworkAlt: "Contour map of a fictional massif generated for this example, with a dotted trail to the summit.",
  summary:
    "A fictional model case study: a {{team.start|word}}-person UX service desk became a {{team.end|word}}-person practice, and {{requests.after}}% of requests now reach UX before development starts.",
  example: true,
};

export const card: SummitCardData = fillDeep(rawCard, data);
