import type { CSSProperties } from "react";
import { SectionHead } from "@/components/home/SectionHead";
import type { about } from "@/content/about";
import { aboutClimb, altitudeLabel } from "@/content/geo";
import { formatInteger } from "@/lib/format";
import styles from "./CareerProfile.module.css";

/**
 * The career so far as the real trail from Ittigen up to the Bantiger (src/content/geo.ts: the
 * terrain sampled along the hiking trail from swisstopo elevation data). The roles stand on it as
 * spot heights; above the summit a dashed line climbs the transmitter mast to about 1'129 m, with
 * the outlook beside it. Across the page from the sm breakpoint (640 px); on phones the trail runs
 * down the left margin (the climb turned a quarter clockwise: up is to the right, so the mast reaches
 * out across the screen).
 *
 * The roles, their heights, the outlook and the trail's places are text in the DOM; the drawing
 * is decorative. Full motion draws the walked line with the scroll where scroll timelines exist
 * (elsewhere once on entry, like calm); still shows it drawn. The line is revealed by a clip from
 * its start (the trail only ever moves on along the drawing's axis), not by dashes: its stroke
 * keeps its width at any scale (non-scaling), which dashes measured on the path would not follow.
 */
type Copy = typeof about.career;

/** The drawing's elevation range (m): room under the trail's foot for the places, up to just
 * above the mast's tip. */
const E0 = 450;
const E1 = 1160;
const { points, lengthM, stops, tower } = aboutClimb;

/** Across: viewBox 1000 × 400; the trail takes the left 78%, the mast and outlook the rest. */
const ACROSS = { w: 1000, h: 400, x0: 6, x1: 780 };
const ax = (d: number) => ACROSS.x0 + (d / lengthM) * (ACROSS.x1 - ACROSS.x0);
const ay = (e: number) => ACROSS.h - ((e - E0) / (E1 - E0)) * (ACROSS.h - 8);
/** Down (phones): viewBox 100 × 1000 in the left margin; distance runs down, height to the right. */
const dx = (e: number) => 6 + ((e - E0) / (E1 - E0)) * 88;
const dy = (d: number) => (d / lengthM) * 1000;

const path = (map: (d: number, e: number) => [number, number]) =>
  points.map(([d, e], i) => `${i ? "L" : "M"}${map(d, e).map((v) => v.toFixed(1)).join(" ")}`).join("");
const acrossLine = path((d, e) => [ax(d), ay(e)]);
const acrossGround = `${acrossLine}L${ax(lengthM).toFixed(1)} ${ACROSS.h}L${ax(0).toFixed(1)} ${ACROSS.h}Z`;
const downLine = path((d, e) => [dx(e), dy(d)]);
/** Hairlines every 100 m, like contour lines. */
const SCALE_M = 700;
const contours = Array.from({ length: Math.floor(E1 / 100) - Math.ceil(E0 / 100) + 1 }, (_, i) => (Math.ceil(E0 / 100) + i) * 100);

/** Elevation (m) at a distance along the trail, between the sampled points. */
function elevationAt(d: number) {
  const i = points.findIndex(([pd]) => pd >= d);
  if (i <= 0) return points[Math.max(i, 0)][1];
  const [d0, e0] = points[i - 1];
  const [d1, e1] = points[i];
  return e0 + ((d - d0) / Math.max(d1 - d0, 1e-6)) * (e1 - e0);
}

/** A camp's spot height: the official height at the trail's ends, the terrain's in between. */
const heightAt = (at: number) => (at <= 0 ? stops[0].altitudeM : at >= 1 ? stops[stops.length - 1].altitudeM : Math.round(elevationAt(at * lengthM)));

const pct = (v: number, of: number) => +((v / of) * 100).toFixed(3);
const summit = stops[stops.length - 1];
const tip = tower.tip.altitudeM;

export function CareerProfile({ copy }: { copy: Copy }) {
  const camps = copy.camps.map((c, i) => {
    const d = c.at * lengthM;
    const e = heightAt(c.at);
    return { ...c, last: i === copy.camps.length - 1, d, e, x: pct(ax(d), ACROSS.w), y: pct(ay(e), ACROSS.h), ex: pct(dx(e), 100) };
  });
  // Desktop: one column per camp, each starting under its spot height.
  const columns = camps.map((c, i) => `${((camps[i + 1]?.x ?? 100) - c.x).toFixed(3)}fr`).join(" ");
  const places = stops.map((s) => `${s.label} ${altitudeLabel(s.altitudeM)}`).join(" → ");

  return (
    <section className={styles.career} aria-labelledby="career-heading">
      <SectionHead id="career-heading" heading={copy.heading} />
      <p className={`${styles.intro} body-copy`}>{copy.intro}</p>
      <figure
        className={styles.figure}
        style={
          {
            "--summit-x": pct(ax(lengthM), ACROSS.w),
            "--summit-y": pct(ay(summit.altitudeM), ACROSS.h),
            "--tip-y": pct(ay(tip), ACROSS.h),
            "--summit-ex": pct(dx(summit.altitudeM), 100),
            "--first-x": camps[0].x,
          } as CSSProperties
        }
      >
        <div className={styles.chart}>
          <svg className={styles.across} viewBox={`0 0 ${ACROSS.w} ${ACROSS.h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false" data-reveal="trace">
            {contours.map((m) => (
              <path key={m} className={styles.contour} d={`M0 ${ay(m).toFixed(1)}H${ACROSS.w}`} />
            ))}
            <path className={styles.ground} d={acrossGround} />
            {camps.map((c) => (
              <path key={c.title} className={styles.leader} d={`M${ax(c.d).toFixed(1)} ${ay(c.e).toFixed(1)}V${ACROSS.h}`} />
            ))}
            <path className={styles.base} d={acrossLine} />
            <g className={styles.walk}>
              <path className={styles.walked} d={acrossLine} />
            </g>
          </svg>
          <svg className={styles.down} viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-reveal="trace">
            <path className={styles.base} d={downLine} />
            <g className={styles.walk}>
              <path className={styles.walked} d={downLine} />
            </g>
          </svg>
          <div className={styles.marks} aria-hidden="true" data-quiet-zone>
            {camps.map((c) => (
              <span key={c.title} className={styles.spot} data-summit={c.last ? "" : undefined} style={{ "--x": c.x, "--y": c.y, "--at": c.at, "--ex": c.ex } as CSSProperties} />
            ))}
            {/* The trail's places on the line (the caption lists them as text) and one contour's height. */}
            {stops.map((s, i) => (
              <span
                key={s.id}
                className={`${styles.place} hud-label map-halo`}
                data-edge={i === 0 ? "start" : s === summit ? "end" : undefined}
                style={{ "--x": pct(ax(s.atM), ACROSS.w), "--y": pct(ay(elevationAt(s.atM)), ACROSS.h) } as CSSProperties}
              >
                {s.label}
              </span>
            ))}
            <span className={`${styles.scale} hud-label map-halo`} style={{ "--y": pct(ay(SCALE_M), ACROSS.h) } as CSSProperties}>
              {altitudeLabel(SCALE_M)}
            </span>
          </div>
          {/* The mast above the summit: a dashed line up to its tip, the outlook beside it. */}
          <div className={styles.mast} data-quiet-zone>
            <p className={`${styles.mastLabel} hud-label map-halo`}>
              <span className={styles.tip}>{copy.tip(formatInteger(tip))}</span>
              <span lang="de">{copy.mast}</span>
            </p>
            <p className={styles.outlook}>{copy.outlook}</p>
          </div>
        </div>
        <ol className={styles.camps} aria-label={copy.caption} data-quiet-zone style={{ "--columns": columns } as CSSProperties}>
          {camps.map((c) => (
            <li key={c.title} className={styles.camp} data-summit={c.last ? "" : undefined} style={{ "--at": c.at, "--ex": c.ex } as CSSProperties}>
              {!c.last && <span className={`${styles.year} hud-label map-halo`}>{c.year}</span>}
              <strong className={styles.role}>{c.last ? copy.summit(c.title, c.year) : c.title}</strong>
              <span className={`${styles.height} hud-label map-halo`}>{altitudeLabel(c.e)}</span>
            </li>
          ))}
        </ol>
        <figcaption className={`${styles.caption} hud-label map-halo`} data-quiet-zone>{copy.trail(places, (lengthM / 1000).toFixed(1))}</figcaption>
      </figure>
    </section>
  );
}
