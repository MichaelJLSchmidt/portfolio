import type { CSSProperties } from "react";
import type { SetSymbol as SetSymbolKind } from "@/content/cards";
import { rarity as rarityTokens, type Rarity } from "@/styles/tokens";
import { rarityShapes as shapes } from "./rarity-shapes";
import styles from "./SummitCard.module.css";

/**
 * The cost as scope pips: `of` small contour rings, the first `value` filled. They fill left to
 * right as the card arrives (the word stagger, 40 ms). Screen readers hear "Scope n of 5".
 */
export function ScopePips({ value, of, label }: { value: number; of: number; label: string }) {
  return (
    <span className={styles.pips} role="img" aria-label={label}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={styles.pipMark} data-on={i < value || undefined} style={{ "--p": i } as CSSProperties} aria-hidden="true" />
      ))}
    </span>
  );
}

/**
 * Rarity is always shape + letter + colour, never colour alone. As the card arrives the shape
 * strokes itself in over --dur-trace (400 ms), then fills.
 */
export function RarityPip({ rarity, label, note }: { rarity: Rarity; label: string; note?: string }) {
  const token = rarityTokens[rarity];
  return (
    <span className={styles.pip} data-rarity={rarity}>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d={shapes[token.shape]} pathLength={1} />
      </svg>
      <span aria-hidden="true">{rarity}</span>
      <span className="visually-hidden">{`${label} (${token.label})${note ? `: ${note}` : ""}`}</span>
    </span>
  );
}

const symbols: Record<SetSymbolKind, string> = {
  peak: "M1 13 L6.5 4 L9 8 L11.5 2 L17 13 Z",
  grid: "M2 2h6v6H2Z M10 2h6v6h-6Z M2 10h6v6H2Z M10 10h6v6h-6Z",
  // A flask: the Lab set holds the fictional examples.
  lab: "M6.5 1.5h5v1.6h-.9v4.1l4.6 7.4c.6 1-.1 2-1.2 2H4c-1.1 0-1.8-1-1.2-2l4.6-7.4V3.1h-.9Z",
};

export function SetSymbol({ symbol, label }: { symbol: SetSymbolKind; label: string }) {
  return (
    <svg className={styles.setSymbol} viewBox="0 0 18 18" role="img" aria-label={label}>
      <path d={symbols[symbol]} />
    </svg>
  );
}
