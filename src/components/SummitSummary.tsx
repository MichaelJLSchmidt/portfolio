import type { CSSProperties, ReactNode } from "react";
import { SettleText } from "@/components/motion/SettleText";
import { hasValue } from "@/lib/content";
import styles from "./SummitSummary.module.css";

export type SummaryRow = {
  label: string;
  /** Rows without a value (or content) are left out. */
  value?: string;
  /** Rich content instead of a plain value (e.g. outcomes with evidence badges). */
  content?: ReactNode;
  /** Spans the full width (sentences). */
  wide?: boolean;
  /** Rendered as a mono stat value (short values; longer ones stay text). */
  stat?: boolean;
};

const SHORT_STAT = 16;

/**
 * "Summit summary" panel in the sheet colour: the facts a reader scans first. A map sheet: it
 * unfolds from its top fold over --dur-medium (in the first viewport: as the page arrives by a
 * link, `arriveAt` after the commit; otherwise as it scrolls into view), its rows fading in one
 * after another; the values never move.
 */
export function SummitSummary({
  id,
  heading,
  rows,
  note,
  className,
  style,
  exitOnReturn = false,
  arriveAt,
}: {
  id: string;
  heading: string;
  rows: SummaryRow[];
  /** A closing line under the facts, e.g. "Fictional example data." */
  note?: string;
  className?: string;
  style?: CSSProperties;
  /** Leaves first when going back to the deck (return-transition.ts). */
  exitOnReturn?: boolean;
  /** Milliseconds after a route commits at which the sheet unfolds when it is on screen (`arrival`). */
  arriveAt?: number;
}) {
  return (
    <section
      className={className ? `${styles.summary} ${className}` : styles.summary}
      style={style}
      aria-labelledby={id}
      data-vt-exit={exitOnReturn ? "" : undefined}
      data-ink="sheet"
      data-reveal="sheet"
      data-fold="top"
      data-arrive-at={arriveAt}
    >
      <SettleText as="h2" id={id} text={heading} mode="chars" role="mono" trigger="inview" className={`${styles.heading} hud-label`} />
      <dl className={`${styles.grid} surface-copy`} data-sheet-rows="">
        {rows
          .filter((row) => row.content || hasValue(row.value))
          .map((row, i) => (
            <div
              key={row.label}
              className={row.wide ? styles.wide : undefined}
              data-long={row.stat && (row.value?.length ?? 0) > SHORT_STAT ? "" : undefined}
              style={{ "--i": i } as CSSProperties}
            >
              <dt>{row.label}</dt>
              <dd className={row.stat ? ((row.value?.length ?? 0) <= SHORT_STAT ? styles.stat : styles.statText) : undefined}>
                {row.content ?? row.value}
              </dd>
            </div>
          ))}
      </dl>
      {note && <p className={styles.note}>{note}</p>}
    </section>
  );
}
