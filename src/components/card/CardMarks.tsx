import type { SetSymbol as SetSymbolKind } from "@/content/cards";
import { rarity as rarityTokens, type Rarity } from "@/styles/tokens";
import { rarityShapes as shapes } from "./rarity-shapes";
import styles from "./SummitCard.module.css";

/** Triangular "summit" cost badge with a snow cap. The visible number is decorative; the label is read. */
export function CostBadge({ value, label }: { value: string; label: string }) {
  return (
    <span className={styles.cost}>
      <svg viewBox="0 0 44 38" aria-hidden="true">
        <path className={styles.costMountain} d="M22 1.5 L42.5 36.5 H1.5 Z" />
        <path className={styles.costSnow} d="M22 1.5 L29.6 14.5 L26 12.6 L22 15.6 L18 12.6 L14.4 14.5 Z" />
        <text className={styles.costValue} x="22" y="30.5" textAnchor="middle">
          {value}
        </text>
      </svg>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

/** Rarity is always shape + letter + colour, never colour alone. */
export function RarityPip({ rarity, label, note }: { rarity: Rarity; label: string; note?: string }) {
  const token = rarityTokens[rarity];
  return (
    <span className={styles.pip} data-rarity={rarity}>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d={shapes[token.shape]} />
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
