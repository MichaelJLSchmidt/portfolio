import type { CSSProperties } from "react";
import styles from "./SummitSummary.module.css";

export type SummaryRow = {
  label: string;
  value: string;
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
}: {
  id: string;
  heading: string;
  rows: SummaryRow[];
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={className ? `${styles.summary} ${className}` : styles.summary} style={style} aria-labelledby={id}>
      <h2 id={id} className={`${styles.heading} hud-label`}>
        {heading}
      </h2>
      <dl className={styles.grid}>
        {rows.map((row) => (
          <div key={row.label} className={row.wide ? styles.wide : undefined}>
            <dt>{row.label}</dt>
            <dd className={row.stat ? styles.stat : undefined}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
