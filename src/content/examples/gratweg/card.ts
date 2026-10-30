import type { SummitCardData } from "@/content/cards";
import { fillDeep } from "@/lib/fill";
import { data } from "./data";

/** The Summit card as written: numbers are {{tokens}} into data.ts (check:figures reads this). */
export const rawCard: SummitCardData = {
  slug: "gratweg",
  name: "Gratweg",
  rarity: "M",
  cost: "{{card.cost}}",
  costLabel: "Summit cost {{card.cost}} of {{card.costScale}}",
  rarityNote: "started and led a platform across teams",
  coordinates: "Hochmatt (fictional)",
  type: "Platform — Design system · Lead (fictional)",
  set: { code: "LAB", name: "Lab", symbol: "lab" },
  collector: { number: "098", language: "EN" },
  keywords: [
    { term: "Convince", reminder: "a business case built from {{businessCase.teams|word}} teams’ own rebuild hours." },
    { term: "Govern", reminder: "a core team, {{team.contributors}} contributors and one RFC page per change." },
    { term: "Adopt", reminder: "“touch it, migrate it”, never a big-bang migration." },
  ],
  flavor:
    "“Every app had its own blue. People thought they were dealing with {{landscape.products|word}} different authorities.” — usability test note, {{years.testNote}}",
  stats: {
    teamLed: "{{team.core}} + {{team.contributors}}",
    time: "{{project.years}} YRS",
    scope: "{{landscape.products}} products",
    impact: { before: "{{outcomes.products.before}}", after: "{{outcomes.products.after}}", note: "on system" },
  },
  indexLine: {
    kind: "Platform",
    summary: "One design system for {{landscape.products}} products",
    time: "{{project.years}} years",
  },
  artwork: { kind: "seeded", terrainId: "lab-098" },
  artworkAlt: "Contour map of a fictional ridge generated for this example, with a dotted trail along it to the summit.",
  summary:
    "A fictional model case study: one design system for {{landscape.products}} public-sector products, funded by a business case and adopted without a big-bang migration.",
  example: true,
};

export const card: SummitCardData = fillDeep(rawCard, data);
