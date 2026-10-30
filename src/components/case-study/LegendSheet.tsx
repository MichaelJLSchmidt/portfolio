import type { CSSProperties, ReactNode } from "react";
import { hasValue } from "@/lib/content";
import styles from "./LegendSheet.module.css";

/** The map symbols beside the summary's rows (18 × 18, drawn in paper ink). */
export const legendSymbols = {
  /** The brief: a pennant on a pole. */
  brief: "M4 16V2M4 3h10l-3 3.5L14 10H4",
  /** The outcome: a summit with a cairn. */
  outcome: "M1 16 8 5l3 4 2-3 4 10ZM8 5V2",
  /** My role: a compass needle in its ring. */
  role: "M9 1.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM9 4l2 5-2 5-2-5Z",
  /** The team I led: three knots on one rope. */
  team: "M2 9h14M4 9a1.6 1.6 0 1 0 0 .01M9 9a1.6 1.6 0 1 0 0 .01M14 9a1.6 1.6 0 1 0 0 .01",
  /** What I put in place: a painted trail blaze. */
  putInPlace: "M5 2h8v14H5ZM5 6.7h8M5 11.3h8",
  /** The key decision: a signpost. */
  keyDecision: "M6 17V1M6 3h9l2 2-2 2H6M6 9H2L0 11l2 2h4",
} as const;

export type LegendRow = {
  symbol: keyof typeof legendSymbols;
  label: string;
  /** Rows without a value (or content) are left out. */
  value?: string;
  content?: ReactNode;
};

/**
 * The legend sheet: the case study's summary as a map's legend, on dusk paper (the only paper
 * surface on the site). Grid ticks at its corners, "Sheet n/3" and a scale bar in its margin,
 * then one row per fact: the map symbol, the mono label and the sentence (labels above the
 * sentences on phones). It unfolds from its top edge in --dur-legend-unfold as it arrives (the
 * text is there throughout); calm and still show it unfolded. Paper-safe inks only.
 */
export function LegendSheet({
  id,
  heading,
  sheet,
  scale,
  rows,
  note,
  arriveAt,
}: {
  id: string;
  heading: string;
  /** "Sheet 2/3": this case study's place among the three. */
  sheet: string;
  /** The scale bar's label, e.g. "1 : 25 000". */
  scale: string;
  rows: readonly LegendRow[];
  note?: string;
  arriveAt?: number;
}) {
  return (
    <section className={styles.sheet} aria-labelledby={id} data-vt-exit="" data-ink="sheet" data-reveal="sheet" data-fold="top" data-arrive-at={arriveAt}>
      <span className={styles.ticks} aria-hidden="true" />
      <div className={styles.head}>
        <h2 id={id} className={`${styles.heading} hud-label`}>
          {heading}
        </h2>
        <p className={`${styles.margin} hud-label`}>
          <span>{sheet}</span>
          <span className={styles.scale} aria-hidden="true">
            <span className={styles.scaleBar} />
            {scale}
          </span>
        </p>
      </div>
      <dl className={`${styles.rows} surface-copy`} data-sheet-rows="">
        {rows
          .filter((r) => r.content || hasValue(r.value))
          .map((r, i) => (
            <div key={r.label} style={{ "--i": i } as CSSProperties}>
              <dt>
                <svg className={styles.symbol} viewBox="0 0 18 18" aria-hidden="true">
                  <path d={legendSymbols[r.symbol]} />
                </svg>
                <span className="hud-label">{r.label}</span>
              </dt>
              <dd>{r.content ?? r.value}</dd>
            </div>
          ))}
      </dl>
      {note && <p className={`${styles.note} hud-label`}>{note}</p>}
    </section>
  );
}
