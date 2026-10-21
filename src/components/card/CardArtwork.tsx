import type { ReactNode } from "react";
import meta from "@terrain/terrain.json";
import type { Artwork } from "@/content/cards";
import { asset } from "@/lib/asset";
import { projectToViewBox } from "@/lib/geo";
import styles from "./SummitCard.module.css";

type CardTerrain = {
  svg: string;
  viewBox: number[];
  bboxLv95: number[] | null;
  trail: number[][] | null;
  pins: { x: number; y: number; elevationM: number }[] | null;
};

const terrainFor = (id: string) => (meta.cards as Record<string, CardTerrain>)[id];

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
  children,
}: {
  artwork: Artwork;
  alt: string;
  className?: string;
  /** Optional overlay (e.g. the "Open expedition log" chip). */
  children?: ReactNode;
}) {
  const terrain = terrainFor(artwork.terrainId);
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
    <div className={className ? `${styles.artwork} ${className}` : styles.artwork} role="img" aria-label={alt}>
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
      {children}
    </div>
  );
}
