"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import profile from "@terrain/profile.json";
import type { Milestone } from "@/content/about";
import { KineticText } from "@/components/type/KineticText";
import { useReducedMotion } from "@/lib/motion-preference";
import styles from "./AscentProfile.module.css";

/**
 * The career as the real climb from Interlaken to the Jungfrau. The chart (sticky) is the
 * terrain sampled along the leader card's trail; milestone plaques scroll beneath it, and
 * the climbed part of the line, a climber marker and an altitude readout follow the scroll
 * directly (painted in the scroll handler, no easing, so they never trail the finger).
 * The ordered list is the content; the chart is decorative. Without JS or with reduced
 * motion the whole line is drawn and every milestone is shown.
 */

const W = 1000;
const H = 320;
const PAD = { top: 24, right: 12, bottom: 30, left: 12 };
const points = profile.points as [number, number][];
const yMin = Math.floor(profile.elevation.min / 500) * 500 - 250;
const yMax = Math.ceil(profile.elevation.max / 500) * 500 + 250;

const xOf = (km: number) => PAD.left + (km / profile.lengthKm) * (W - PAD.left - PAD.right);
const yOf = (m: number) => PAD.top + (1 - (m - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

/** Elevation at a fraction (0..1) of the trail's length. */
function elevationAt(f: number) {
  const km = Math.min(Math.max(f, 0), 1) * profile.lengthKm;
  const i = points.findIndex((p) => p[0] >= km);
  if (i === -1) return points[points.length - 1][1];
  if (i === 0) return points[0][1];
  const [k0, e0] = points[i - 1];
  const [k1, e1] = points[i];
  return e0 + ((km - k0) / Math.max(k1 - k0, 1e-6)) * (e1 - e0);
}

const line = points.map(([km, m], i) => `${i ? "L" : "M"}${xOf(km).toFixed(1)} ${yOf(m).toFixed(1)}`).join("");
const area = `${line}L${xOf(profile.lengthKm).toFixed(1)} ${H - PAD.bottom}L${xOf(0).toFixed(1)} ${H - PAD.bottom}Z`;
const gridLines = Array.from({ length: Math.floor(yMax / 500) }, (_, i) => (i + 1) * 500).filter((m) => m > yMin && m < yMax);

const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(3)}%`;
const numberFormat = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 });

export type AscentLabels = {
  heading: string;
  intro: string;
  readout: { altitude: string; distance: string };
};

export function AscentProfile({
  labels,
  milestones,
  stops,
}: {
  labels: AscentLabels;
  milestones: Milestone[];
  /** Named waypoints on the profile (e.g. Interlaken, Jungfrau) with their official heights. */
  stops: { label: string; elevation?: string; at: number }[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const kmRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const list = stepsRef.current;
    // Reduced motion keeps the static state from the server: full line, every milestone.
    // (The hook reports reduced during hydration; the resolved attribute decides.)
    if (!root || !list || reduced || document.documentElement.getAttribute("data-motion") === "reduced") return;
    const steps = [...list.querySelectorAll<HTMLLIElement>(":scope > li")];
    const progress = () => {
      // Focus line: halfway down the space left below the pinned chart.
      const below = stickyRef.current?.getBoundingClientRect().bottom ?? 0;
      const top = Math.min(Math.max(below, 0), window.innerHeight * 0.6);
      const focus = top + (window.innerHeight - top) * 0.5;
      const centres = steps.map((s) => {
        const r = s.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      let p: number;
      if (centres[0] > focus) {
        // Approaching the first plaque: climb from Interlaken towards it.
        p = milestones[0].at * Math.min(Math.max(1 - (centres[0] - focus) / (window.innerHeight * 0.7), 0), 1);
      } else {
        let i = centres.findIndex((c, k) => k === centres.length - 1 || centres[k + 1] > focus);
        i = Math.max(i, 0);
        if (i >= centres.length - 1) p = milestones[milestones.length - 1].at;
        else {
          const t = (focus - centres[i]) / Math.max(centres[i + 1] - centres[i], 1);
          p = milestones[i].at + Math.min(Math.max(t, 0), 1) * (milestones[i + 1].at - milestones[i].at);
        }
      }
      return p;
    };

    const paint = (p: number) => {
      root.style.setProperty("--p", p.toFixed(4));
      root.style.setProperty("--cx", pct(xOf(p * profile.lengthKm), W));
      root.style.setProperty("--cy", pct(yOf(elevationAt(p)), H));
      if (altRef.current) altRef.current.textContent = `${numberFormat.format(elevationAt(p))} m`;
      if (kmRef.current) kmRef.current.textContent = (p * profile.lengthKm).toFixed(1);
      steps.forEach((s, i) => s.toggleAttribute("data-reached", milestones[i].at <= p + 0.004));
    };

    // Scroll events arrive once per frame before rendering: painting here is scroll-linked.
    const onScroll = () => paint(progress());

    root.setAttribute("data-live", "true");
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      // Back to the static state (e.g. Calm map switched on).
      root.removeAttribute("data-live");
      paint(1);
    };
  }, [milestones, reduced]);

  return (
    <section ref={rootRef} className={styles.ascent} aria-labelledby="ascent-heading" style={{ "--p": 1 } as CSSProperties}>
      <header className={styles.header} data-quiet-zone>
        <KineticText as="h2" id="ascent-heading" text={labels.heading} className={`${styles.heading} display`} play="inview" />
        <p className="body-copy">{labels.intro}</p>
      </header>

      <div className={styles.stage}>
        <div ref={stickyRef} className={styles.sticky}>
          <div className={styles.chart} aria-hidden="true">
            <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {gridLines.map((m) => (
                <line
                  key={m}
                  className={m % 1000 === 0 ? styles.gridIndex : styles.grid}
                  x1={0}
                  x2={W}
                  y1={yOf(m)}
                  y2={yOf(m)}
                />
              ))}
              <path className={styles.area} d={area} />
              <path className={styles.base} d={line} />
            </svg>
            {/* The climbed part: the same line in glacier, revealed up to --p. */}
            <svg className={`${styles.svg} ${styles.climbed}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              <path className={styles.trail} d={line} />
            </svg>
            {gridLines
              .filter((m) => m % 1000 === 0)
              .map((m) => (
                <span key={m} className={`${styles.gridLabel} hud-label`} style={{ top: pct(yOf(m), H) }}>
                  {numberFormat.format(m)} m
                </span>
              ))}
            {stops.map((s) => (
              <span
                key={s.label}
                className={`${styles.stop} hud-label`}
                data-end={s.at > 0.5 ? "true" : undefined}
                data-start={s.at <= 0.5 ? "true" : undefined}
                style={{ left: pct(xOf(s.at * profile.lengthKm), W), top: pct(yOf(elevationAt(s.at)), H) }}
              >
                {s.label}
                {s.elevation && <span className={styles.stopElevation}> {s.elevation}</span>}
              </span>
            ))}
            {milestones.map((m, i) => (
              <span
                key={i}
                className={styles.pin}
                style={{ left: pct(xOf(m.at * profile.lengthKm), W), top: pct(yOf(elevationAt(m.at)), H), "--at": m.at } as CSSProperties}
              >
                {i + 1}
              </span>
            ))}
            <span className={styles.climber} />
            <p className={`${styles.readout} hud-label`}>
              {labels.readout.altitude} <span ref={altRef}>{numberFormat.format(profile.elevation.max)} m</span> · {labels.readout.distance}{" "}
              <span ref={kmRef}>{profile.lengthKm.toFixed(1)}</span>
            </p>
          </div>
        </div>

        <ol ref={stepsRef} className={styles.steps}>
          {milestones.map((m, i) => (
            <li key={i} className={styles.step} data-reached="">
              <article className={styles.plaque}>
                <p className={`${styles.year} hud-label`}>
                  <span className={styles.index} aria-hidden="true">
                    {i + 1}
                  </span>
                  {m.year}
                </p>
                <h3 className={`${styles.title} display`}>{m.title}</h3>
                {m.org && <p className={`${styles.org} hud-label`}>{m.org}</p>}
                <p className="body-copy">{m.note}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
