import Link from "next/link";
import type { CSSProperties } from "react";
import { flood } from "@/content/flood";
import { site } from "@/content/site";
import data from "./wordmark.json";
import styles from "./Wordmark.module.css";

/**
 * The footer wordmark: the brand as outlines at the titles' rest cut, with its construction drawn
 * in (scripts/wordmark.mjs writes the geometry from the brand at build time): baseline, x-height
 * and cap-height overshooting 12 px either side, a tick at every advance boundary, a crosshair at
 * every counter. At rest an outline; on hover, focus or a tap the contour flood fills it with
 * glacier. A link to the start page, named by its DOM text (the brand); the drawing is hidden from
 * screen readers.
 */
const W = data.width;
const H = data.height;
const view = `0 0 ${W} ${H}`;
const arm = H * 0.035;
const tick = { from: H * 1.05, to: H * 1.14 };

export function Wordmark({ className }: { className?: string }) {
  const fill = (attr: "data-flood-layer" | "data-flood-fringe") => (
    <svg className={styles.fill} viewBox={view} aria-hidden="true" {...{ [attr]: "" }}>
      <path d={data.path} />
    </svg>
  );
  return (
    <Link
      href="/"
      className={className ? `${styles.wordmark} ${className}` : styles.wordmark}
      data-flood={flood.footerWordmark ? "" : undefined}
      style={{ "--ratio": `${W} / ${H}` } as CSSProperties}
    >
      <span className="visually-hidden">{site.nav.home}</span>
      <span className={styles.lines} aria-hidden="true">
        {[data.capHeight, data.xHeight, data.baseline].map((y) => (
          <span key={y} className={styles.line} style={{ top: `${((y / H) * 100).toFixed(3)}%` }} />
        ))}
      </span>
      <svg className={styles.drawing} viewBox={view} aria-hidden="true">
        <path className={styles.outline} d={data.path} />
        <path className={styles.ticks} d={data.advances.map((x) => `M${x} ${tick.from}V${tick.to}`).join("")} />
        <path className={styles.counters} d={data.counters.map((c) => `M${c.x - arm} ${c.y}h${2 * arm}M${c.x} ${c.y - arm}v${2 * arm}`).join("")} />
      </svg>
      {flood.footerWordmark && fill("data-flood-fringe")}
      {flood.footerWordmark && fill("data-flood-layer")}
    </Link>
  );
}
