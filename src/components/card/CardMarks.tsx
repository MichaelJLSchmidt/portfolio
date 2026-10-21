import type { SetSymbol as SetSymbolKind } from "@/content/cards";
import { rarity as rarityTokens, type Rarity } from "@/styles/tokens";
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

const shapes: Record<string, string> = {
  circle: "M6 1a5 5 0 1 1 0 10A5 5 0 0 1 6 1Z",
  diamond: "M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z",
  triangle: "M6 0.8 L11.5 10.6 H0.5 Z",
  star: "M6 0 L7.4 4.6 L12 6 L7.4 7.4 L6 12 L4.6 7.4 L0 6 L4.6 4.6 Z",
};

/** Rarity is always shape + letter + colour, never colour alone. */
export function RarityPip({ rarity, label }: { rarity: Rarity; label: string }) {
  const token = rarityTokens[rarity];
  return (
    <span className={styles.pip} data-rarity={rarity}>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d={shapes[token.shape]} />
      </svg>
      <span aria-hidden="true">{rarity}</span>
      <span className="visually-hidden">{`${label} (${token.label})`}</span>
    </span>
  );
}

const symbols: Record<SetSymbolKind, string> = {
  peak: "M1 13 L6.5 4 L9 8 L11.5 2 L17 13 Z",
  grid: "M2 2h6v6H2Z M10 2h6v6h-6Z M2 10h6v6H2Z M10 10h6v6h-6Z",
};

export function SetSymbol({ symbol, label }: { symbol: SetSymbolKind; label: string }) {
  return (
    <svg className={styles.setSymbol} viewBox="0 0 18 18" role="img" aria-label={label}>
      <path d={symbols[symbol]} />
    </svg>
  );
}
