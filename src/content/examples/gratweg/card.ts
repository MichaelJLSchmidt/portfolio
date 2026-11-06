import type { CardData } from "@/content/cards";
import { fillDeep } from "@/lib/fill";
import { data } from "./data";

/** The card as written: numbers are {{tokens}} into data.ts (check:figures reads this). */
export const rawCard: CardData = {
  slug: "gratweg",
  name: "Gratweg",
  year: "{{years.end}}",
  sector: "Design system",
  role: "Lead (fictional)",
  teamSize: "{{team.core}} + {{team.contributors}}",
  reach: "{{landscape.products}} products",
  impact: { before: "{{outcomes.products.before}}", after: "{{outcomes.products.after}}" },
  terrainId: "jungfrau",
  artworkAlt: "Contour plate of the Jungfrau from swisstopo terrain data.",
  example: true,
};

export const card: CardData = fillDeep(rawCard, data);
