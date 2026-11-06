import type { CardData } from "@/content/cards";
import { fillDeep } from "@/lib/fill";
import { data } from "./data";

/** The card as written: numbers are {{tokens}} into data.ts (check:figures reads this). */
export const rawCard: CardData = {
  slug: "seilschaft",
  name: "Seilschaft",
  year: "{{years.end}}",
  sector: "Practice building",
  role: "Lead (fictional)",
  teamSize: "{{team.start}} → {{team.end}}",
  reach: "{{org.productTeams}} product teams",
  impact: { before: "{{requests.before}}%", after: "{{requests.after}}%" },
  terrainId: "eiger",
  artworkAlt: "Contour plate of the Eiger from swisstopo terrain data.",
  example: true,
};

export const card: CardData = fillDeep(rawCard, data);
