import type { CSSProperties, ReactNode } from "react";
import type { Artwork } from "@/content/cards";
import { asset } from "@/lib/asset";
import { cardTerrain } from "@/lib/card-terrain";
import { projectToViewBox } from "@/lib/geo";
import styles from "./SummitCard.module.css";

const pathFrom = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

/**
 * Card artwork window: the generated terrain SVG plus an overlay with a dotted glacier
 * trail, four waypoint pins and map labels, all positioned from content data.
 */
export function CardArtwork({
  artwork,
  alt,
  className,
  style,
  stamp,
  children,
}: {
  artwork: Artwork;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** A rubber stamp across the map, e.g. "Fictional example" (visual; say it in text nearby too). */
  stamp?: string;
  /** Optional overlay (e.g. the "Open case study" chip). */
  children?: ReactNode;
}) {
  const terrain = cardTerrain(artwork.terrainId);
  if (!terrain) return null;
  const vb = terrain.viewBox;
  const [, , w, h] = vb;

  let trail: [number, number][] = [];
  let pins: { x: number; y: number; label?: string; elevation?: string; summit: boolean }[] = [];
  let labels: { x: number; y: number; text: string; elevation?: string }[] = [];

  if (artwork.kind === "crop" && terrain.bboxLv95) {
    const project = (lon: number, lat: number) => projectToViewBox(lon, lat, terrain.bboxLv95!, vb);
    trail = artwork.trail.map((p) => project(p.lon, p.lat));
    pins = artwork.waypoints.map((p, i) => {
      const [x, y] = project(p.lon, p.lat);
      return { x, y, label: p.label, elevation: p.elevation, summit: i === artwork.waypoints.length - 1 };
    });
    labels = artwork.labels.map((l) => {
      const [x, y] = project(l.lon, l.lat);
      return { x, y, text: l.text, elevation: l.elevation };
    });
  } else if (terrain.trail && terrain.pins) {
    trail = terrain.trail.map(([x, y]) => [x * w, y * h]);
    pins = terrain.pins.map((p, i, all) => ({ x: p.x * w, y: p.y * h, summit: i === all.length - 1 }));
  }

  return (
    <div className={className ? `${styles.artwork} ${className}` : styles.artwork} style={style} role="img" aria-label={alt}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed */}
      <img className={styles.terrain} src={asset(terrain.svg)} alt="" width={w} height={h} decoding="async" />
      <svg className={styles.overlay} viewBox={vb.join(" ")} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {labels.map((l) => (
          <text key={l.text} className={styles.lakeLabel} x={l.x} y={l.y} textAnchor="middle">
            {l.text}
            {l.elevation && <tspan className={styles.labelElevation}> {l.elevation}</tspan>}
          </text>
        ))}
        <path className={styles.trail} d={pathFrom(trail)} />
        {pins.map((p, i) => (
          <g key={i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
            {p.summit ? (
              <path className={styles.pinSummit} d="M0 -6 L5.5 3.5 L-5.5 3.5 Z" />
            ) : (
              <circle className={styles.pin} r="3.6" />
            )}
            {p.label && (
              <text className={styles.pinLabel} x={p.x > w * 0.6 ? -8 : 8} y={-6} textAnchor={p.x > w * 0.6 ? "end" : "start"}>
                {p.label}
                {p.elevation && <tspan className={styles.labelElevation}> {p.elevation}</tspan>}
              </text>
            )}
          </g>
        ))}
      </svg>
      {stamp && (
        <span className={styles.stamp} aria-hidden="true">
          {stamp}
        </span>
      )}
      {children}
    </div>
  );
}
