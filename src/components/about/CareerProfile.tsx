import type { CSSProperties } from "react";
import type { about } from "@/content/about";
import { aboutClimb } from "@/content/geo";
import styles from "./CareerProfile.module.css";

/**
 * The career so far as one line: the real trail from Ittigen up to the Bantiger (src/content/geo.ts,
 * the terrain sampled along the hiking trail), with a tick for each role and its year. It draws once,
 * over --dur-draw (in-out), as it comes into view; Off shows it drawn. No altitudes, no scroll
 * scrubbing. Across the page from 768 px; on phones it runs down the left margin. The roles are a
 * list in the DOM; the drawing is decorative.
 */
type Copy = typeof about.career;

const { points, lengthM, stops } = aboutClimb;
const elevations = points.map(([, e]) => e);
const E0 = Math.min(...elevations) - 20;
const E1 = Math.max(...elevations) + 20;

/** Across: viewBox 1000 × 240. Down (phones): viewBox 60 × 1000, distance runs down. */
const ax = (d: number) => (d / lengthM) * 1000;
const ay = (e: number) => 240 - ((e - E0) / (E1 - E0)) * 232;
const dx = (e: number) => 4 + ((e - E0) / (E1 - E0)) * 52;
const dy = (d: number) => (d / lengthM) * 1000;
const line = (map: (d: number, e: number) => [number, number]) =>
  points.map(([d, e]) => map(d, e).map((v) => v.toFixed(1)).join(",")).join(" ");
const across = line((d, e) => [ax(d), ay(e)]);
const down = line((d, e) => [dx(e), dy(d)]);

export function CareerProfile({ copy, className }: { copy: Copy; className?: string }) {
  const places = stops.map((s) => s.label).join(" → ");
  return (
    <section className={className ? `${styles.career} ${className}` : styles.career} aria-labelledby="career-heading">
      <h2 id="career-heading" className="t-h2" data-quiet-zone>
        {copy.heading}
      </h2>
      <p className={`${styles.intro} body-copy`}>{copy.intro}</p>
      <figure className={styles.figure} data-reveal="draw">
        <svg className={styles.across} viewBox="0 0 1000 240" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <polyline className={styles.line} points={across} />
        </svg>
        <svg className={styles.down} viewBox="0 0 60 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <polyline className={styles.line} points={down} />
        </svg>
        <ol className={styles.camps} aria-label={copy.caption}>
          {copy.camps.map((c, i) => {
            const last = i === copy.camps.length - 1;
            return (
              <li key={c.title} className={styles.camp} style={{ "--at": c.at } as CSSProperties} data-last={last || undefined}>
                <span className={`${styles.year} mono`}>{c.year}</span>
                <span className={styles.role}>{c.title}</span>
              </li>
            );
          })}
        </ol>
        <figcaption className={`${styles.caption} mono`}>{copy.trail(places, (lengthM / 1000).toFixed(1))}</figcaption>
      </figure>
    </section>
  );
}
