import type { CardData } from "./cards";

/**
 * The cards' fixed labels, and the helpers that read one card: kept apart from the cards' data
 * (cards.ts, which re-exports all of this) so a client component that needs only these doesn't
 * bundle every card.
 */
export const cardLabels = {
  /** The label row: "Case study 01". */
  label: (n: number) => `Case study ${String(n).padStart(2, "0")}`,
  /** The collector number: "01/03". */
  collector: (n: number, of: number) => `${String(n).padStart(2, "0")}/${String(of).padStart(2, "0")}`,
  /** The card link's accessible name. */
  open: (name: string, typeLine: string) => `${name}: ${typeLine}`,
  example: "Fictional example",
};

export const cardHref = (card: CardData) => card.href ?? `/work/${card.slug}/`;

/** The type line: sector · role · team size. */
export const typeLine = (card: CardData) => [card.sector, card.role, card.teamSize].filter(Boolean).join(" · ");
