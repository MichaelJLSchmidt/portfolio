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

/** "Summit summary" panel in the sheet colour: the facts a reader scans first. */
export function SummitSummary({
  id,
  heading,
  rows,
  note,
  className,
  style,
  exitOnReturn = false,
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
}) {
  return (
    <section
      className={className ? `${styles.summary} ${className}` : styles.summary}
      style={style}
      aria-labelledby={id}
      data-vt-exit={exitOnReturn ? "" : undefined}
      data-ink="sheet"
    >
      <SettleText as="h2" id={id} text={heading} mode="chars" role="mono" trigger="inview" className={`${styles.heading} hud-label`} />
      <dl className={`${styles.grid} surface-copy`}>
        {rows
          .filter((row) => row.content || hasValue(row.value))
          .map((row) => (
            <div key={row.label} className={row.wide ? styles.wide : undefined} data-long={row.stat && (row.value?.length ?? 0) > SHORT_STAT ? "" : undefined}>
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
