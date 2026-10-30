import type { CSSProperties, ReactNode } from "react";
import styles from "./ElevationProfile.module.css";

export type ProfilePoint = { label: string; altitude: string; metres: number };

export type ProfileRow = {
  metric: string;
  before: string;
  after: string;
  /** The stage (1–6) where the change was won. */
  stage: number;
  /** An evidence badge after the value. */
  badge?: ReactNode;
};

/**
 * The results as an elevation profile: the ascent's profile through its six stages (the first is
 * the trailhead) to the summit (the line draws once as it comes into view), and below it the
 * results as a real table whose columns stand under the profile: each result's value before at
 * the trailhead, after at the summit, and a spot height at the stage where it was won. Phones read
 * it top to bottom: the stages as a vertical profile, each result as a row of its own. Numbers
 * never move.
 */
export function ElevationProfile({
  caption,
  stages,
  summit,
  rows,
  labels,
}: {
  caption: string;
  /** The six stages, the trailhead first. */
  stages: readonly ProfilePoint[];
  summit: ProfilePoint;
  rows: readonly ProfileRow[];
  labels: {
    metric: string;
    before: string;
    after: string;
    wonAt: string;
    stage: (n: number) => string;
  };
}) {
  const points = [...stages, summit];
  const min = Math.min(...points.map((p) => p.metres));
  const max = Math.max(...points.map((p) => p.metres));
  const W = 1000;
  const H = 160;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (m: number) => H - 8 - ((m - min) / (max - min || 1)) * (H - 24);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.metres).toFixed(1)}`).join("");
  return (
    <figure className={styles.profile} style={{ "--points": points.length } as CSSProperties}>
      <div className={styles.chart} aria-hidden="true">
        <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" data-reveal="line">
          <path className={styles.ground} d={`${line}L${W} ${H}L0 ${H}Z`} />
          <path className={styles.line} d={line} pathLength={1} />
        </svg>
        <ol className={styles.nodes}>
          {points.map((p, i) => (
            <li
              key={p.label}
              style={
                {
                  "--x": `${(x(i) / W) * 100}%`,
                  "--y": `${(y(p.metres) / H) * 100}%`,
                } as CSSProperties
              }
              data-end={i === 0 || i === points.length - 1 ? "" : undefined}
            >
              <span className={styles.dot} />
              <span className={`${styles.nodeLabel} hud-label`}>
                {i < points.length - 1 && <span>{labels.stage(i + 1)}</span>}
                <span>{p.label}</span>
                <span className={styles.altitude}>{p.altitude}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <table className={styles.table} role="table">
        <caption className={`${styles.caption} hud-label`}>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className="hud-label">
              {labels.metric}
            </th>
            <th scope="col" role="columnheader" className="hud-label">
              {labels.before}
            </th>
            <th scope="col" role="columnheader" className="hud-label">
              {labels.wonAt}
            </th>
            <th scope="col" role="columnheader" className="hud-label">
              {labels.after}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((r) => (
            <tr key={r.metric} role="row" style={{ "--stage": r.stage } as CSSProperties}>
              <th scope="row" role="rowheader" className={styles.metric}>
                {r.metric}
              </th>
              <td role="cell" className={styles.before}>
                {r.before}
              </td>
              <td role="cell" className={`${styles.won} hud-label`}>
                <span className={styles.wonMark} aria-hidden="true" />
                {`${labels.stage(r.stage)} · ${stages[r.stage - 1]?.label ?? ""}`}
              </td>
              <td role="cell" className={styles.after}>
                {r.after}
                {r.badge}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
