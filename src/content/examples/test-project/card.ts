import type { CardData } from "@/content/cards";
import { fillDeep } from "@/lib/fill";
import { data } from "./data";

/** The card as written: numbers are {{tokens}} into data.ts (check:figures reads this). */
export const rawCard: CardData = {
  slug: "test-project",
  name: "Test Project",
  year: "{{years.end}}",
  sector: "Public sector",
  role: "Lead (fictional)",
  teamSize: "{{team.designersLed}} + {{team.productDev}}",
  reach: "{{workshops.units}} units · {{reach.perYear|en}} applications a year",
  impact: { before: "{{outcomes.complete.before}}%", after: "{{outcomes.complete.after}}%" },
  terrainId: "moench",
  artworkAlt: "Contour plate of the Mönch from swisstopo terrain data.",
  example: true,
};

export const card: CardData = fillDeep(rawCard, data);
