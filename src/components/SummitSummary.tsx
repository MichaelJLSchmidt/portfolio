import type { CSSProperties } from "react";
import { withValues } from "@/lib/content";
import styles from "./SummitSummary.module.css";

export type SummaryRow = {
  label: string;
  /** Rows without a value are left out. */
  value?: string;
  /** Spans the full width (sentences). */
  wide?: boolean;
  /** Rendered as a mono stat value. */
  stat?: boolean;
};

/** "Summit summary" panel in the sheet colour: the facts a reader scans first. */
export function SummitSummary({
  id,
  heading,
  rows,
  className,
  style,
  exitOnReturn = false,
}: {
  id: string;
  heading: string;
  rows: SummaryRow[];
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
    >
      <h2 id={id} className={`${styles.heading} hud-label`}>
        {heading}
      </h2>
      <dl className={styles.grid}>
        {withValues(rows).map((row) => (
          <div key={row.label} className={row.wide ? styles.wide : undefined}>
            <dt>{row.label}</dt>
            <dd className={row.stat ? styles.stat : undefined}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
