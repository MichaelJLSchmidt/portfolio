import type { ReactNode } from "react";
import styles from "./TrailheadSpread.module.css";

/**
 * The trailhead spread: a case study's first screen. Left, the title block (the H1 the card's
 * name morphs into, passed in as `title`, its type line) and "The problem" in two or three
 * sentences; right, "The result" as the climb it was: the impact line over the altitude gained
 * from the trailhead to the summit (both named with their real heights), then role, team and time
 * in mono. A flagged example says so above it all. Phones stack the two within about 1.3
 * screens. Nothing here moves but the title's own arrival.
 */
export function TrailheadSpread({
  example,
  artwork,
  title,
  typeLine,
  problem,
  impactLine,
  climb,
  facts,
  meta,
  labels,
}: {
  /** "EXAMPLE — FICTIONAL CASE STUDY", on flagged examples only. */
  example?: string;
  artwork: ReactNode;
  title: ReactNode;
  typeLine: string;
  problem: string;
  impactLine: string;
  climb: {
    from: { label: string; altitude: string };
    to: { label: string; altitude: string };
    gain: string;
  };
  facts: readonly { label: string; value: string }[];
  /** A line under the problem: reading time and the way to the summary. */
  meta?: ReactNode;
  labels: { problem: string; result: string; gain: string };
}) {
  return (
    <header className={styles.spread} data-route="trailhead">
      {example && (
        <p className={`${styles.example} hud-label map-halo`} data-vt-exit data-quiet-zone>
          {example}
        </p>
      )}
      <div className={styles.art}>{artwork}</div>
      <div className={styles.left} data-quiet-zone>
        {title}
        <p className={`${styles.type} map-halo`} data-vt-exit>
          {typeLine}
        </p>
        <div className={styles.problem} data-vt-exit>
          <h2 className={`${styles.label} hud-label`}>{labels.problem}</h2>
          <p className="body-copy">{problem}</p>
        </div>
        {meta}
      </div>
      <section className={`${styles.right} legend`} aria-labelledby="result-heading" data-vt-exit>
        <h2 id="result-heading" className={`${styles.label} hud-label`}>
          {labels.result}
        </h2>
        <p className={styles.impact}>{impactLine}</p>
        <div className={styles.climb}>
          <svg className={styles.climbLine} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 38L18 33 34 30 50 22 66 17 82 9 100 2" />
          </svg>
          <p className={`${styles.gain} hud-label`}>
            <span className={styles.gainValue}>{climb.gain}</span> {labels.gain}
          </p>
          <p className={`${styles.from} hud-label`}>
            {climb.from.label} · {climb.from.altitude}
          </p>
          <p className={`${styles.to} hud-label`}>
            {climb.to.label} · {climb.to.altitude}
          </p>
        </div>
        <dl className={`${styles.facts} hud-label`}>
          {facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </header>
  );
}
