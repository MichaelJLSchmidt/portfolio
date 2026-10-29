"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import profile from "@terrain/profile.json";
import type { Camp } from "@/content/about";
import { rarityShapes } from "@/components/card/rarity-shapes";
import { RollNumber } from "@/components/motion/RollNumber";
import { RuledHeading } from "@/components/motion/RuledHeading";
import { formatInteger } from "@/lib/format";
import { currentMode, useMotionMode } from "@/lib/motion-mode";
import { rarity as rarityTokens } from "@/styles/tokens";
import styles from "./AscentProfile.module.css";

/**
 * The career as the real climb from Interlaken to the Jungfrau. The chart (sticky) is the
 * terrain sampled along the Interlaken → Jungfrau trail; the camps' plaques scroll beneath it (on
 * phones the chart stands upright beside them, the climb running down the screen). The ordered
 * list is the content; the chart is decorative.
 *
 * - Full: the climbed part of the line draws with the scroll, and a climber marker rides its end.
 *   Where the browser has scroll-driven animations a view timeline on the plaques drives it
 *   (`--p`, CSS); elsewhere the scroll handler paints it (no easing, so it never trails the
 *   finger). Each camp's pin pings once as the climber reaches it, and the readout's altitude
 *   rolls to that camp's.
 * - Calm: the line draws once on a timer (--dur-cinematic) when the chart comes into view.
 * - Still and without JavaScript: the whole line is drawn and every camp is shown.
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

/**
 * The climber's height along the line as keyframes over the climb (0..100% of the trail): the
 * line is a polyline of these points, so linear steps between them keep the marker on it. The
 * same timeline (scroll or timer) drives them and `--p`.
 */
const climberKeyframes = `@keyframes ascent-climber{${points
  .map(([km, m]) => `${((km / profile.lengthKm) * 100).toFixed(2)}%{--cy:${pct(yOf(m), H)}}`)
  .join("")}}`;
const scrollTimeline = () => typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");

export type AscentLabels = {
  heading: string;
  intro: string;
  /** What the camps' rarity letters mean. */
  rarityNote: string;
  rarityLabel: string;
  readout: { altitude: string; distance: string };
};

const cssColor = (token: string) => `var(--color-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)})`;

export function AscentProfile({
  labels,
  camps: milestones,
  stops,
}: {
  labels: AscentLabels;
  camps: Camp[];
  /** Named waypoints on the profile (e.g. Interlaken, Jungfrau) with their official heights. */
  stops: { label: string; elevation?: string; at: number }[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const { mode } = useMotionMode();
  const still = mode === "still";
  // The last camp reached (the readout rolls to its altitude); at rest, the summit.
  const [camp, setCamp] = useState(milestones.length - 1);

  useEffect(() => {
    const root = rootRef.current;
    const list = stepsRef.current;
    // Still mode keeps the static state from the server: full line, every milestone.
    // (The hook reports still during hydration; the resolved attribute decides.)
    if (!root || !list || still || currentMode() === "still") return;
    const steps = [...list.querySelectorAll<HTMLLIElement>(":scope > li")];
    const pins = [...root.querySelectorAll<HTMLElement>("[data-pin]")];
    const climber = root.querySelector<HTMLElement>("[data-climber]");
    const pinged = new Set<number>();
    let reached = -1;

    // Where the reader is, by the plaques (the fallback without a scroll timeline).
    const focusProgress = () => {
      // Focus line: halfway down the space left below the pinned chart.
      const below = window.innerWidth < 640 ? 0 : (stickyRef.current?.getBoundingClientRect().bottom ?? 0);
      const top = Math.min(Math.max(below, 0), window.innerHeight * 0.6);
      const focus = top + (window.innerHeight - top) * 0.5;
      const centres = steps.map((s) => {
        const r = s.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      if (centres[0] > focus) {
        // Approaching the first plaque: climb from Interlaken towards it.
        return milestones[0].at * Math.min(Math.max(1 - (centres[0] - focus) / (window.innerHeight * 0.7), 0), 1);
      }
      let i = centres.findIndex((c, k) => k === centres.length - 1 || centres[k + 1] > focus);
      i = Math.max(i, 0);
      if (i >= centres.length - 1) return milestones[milestones.length - 1].at;
      const t = (focus - centres[i]) / Math.max(centres[i + 1] - centres[i], 1);
      return milestones[i].at + Math.min(Math.max(t, 0), 1) * (milestones[i + 1].at - milestones[i].at);
    };
    // Where the CSS animation (scroll timeline or timer) has the climb.
    const animated = () => {
      const p = parseFloat(getComputedStyle(root).getPropertyValue("--p"));
      return Number.isFinite(p) ? p : null;
    };

    // The camps passed so far: their plaques, their pins (one ping each, full motion) and the readout.
    const reach = (p: number) => {
      steps.forEach((s, i) => s.toggleAttribute("data-reached", milestones[i].at <= p + 0.004));
      let last = -1;
      milestones.forEach((m, i) => {
        if (m.at > p + 0.004) return;
        last = i;
        if (!pinged.has(i) && currentMode() === "full") {
          pinged.add(i);
          pins[i]?.setAttribute("data-ping", "");
        }
      });
      if (last !== reached) {
        reached = last;
        setCamp(Math.max(last, 0));
      }
    };

    const live = currentMode() === "calm" ? "timer" : scrollTimeline() ? "timeline" : "scroll";
    let raf = 0;
    let io: IntersectionObserver | null = null;
    if (live === "scroll") {
      // Scroll events arrive once per frame before rendering: painting here is scroll-linked.
      const paint = () => {
        const p = focusProgress();
        root.style.setProperty("--p", p.toFixed(4));
        root.style.setProperty("--cx", pct(xOf(p * profile.lengthKm), W));
        // --cy does not inherit (the climber's keyframes animate it): it goes on the climber.
        climber?.style.setProperty("--cy", pct(yOf(elevationAt(p)), H));
        reach(p);
      };
      root.setAttribute("data-live", "scroll");
      paint();
      window.addEventListener("scroll", paint, { passive: true });
      window.addEventListener("resize", paint);
      return () => {
        window.removeEventListener("scroll", paint);
        window.removeEventListener("resize", paint);
        root.removeAttribute("data-live");
        ["--p", "--cx"].forEach((v) => root.style.removeProperty(v));
        climber?.style.removeProperty("--cy");
        setCamp(milestones.length - 1);
      };
    }
    // The timeline or the timer moves --p in CSS; the camps follow it each frame while it moves.
    const follow = () => {
      const p = animated();
      if (p !== null) reach(p);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(follow);
    };
    if (live === "timeline") {
      root.setAttribute("data-live", "timeline");
      follow();
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      // Calm: waits at the start, then draws once when the chart is in view.
      root.setAttribute("data-live", "wait");
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io?.disconnect();
          root.setAttribute("data-live", "timer");
          const tick = () => {
            follow();
            const a = root.getAnimations().find((x) => /ascent-p/.test((x as CSSAnimation).animationName ?? ""));
            if (a && a.playState === "running") raf = requestAnimationFrame(tick);
            else reach(1);
          };
          raf = requestAnimationFrame(tick);
        },
        { threshold: 0.3 },
      );
      if (stickyRef.current) io.observe(stickyRef.current);
    }
    return () => {
      io?.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      root.removeAttribute("data-live");
      setCamp(milestones.length - 1);
    };
  }, [milestones, still]);

  const shown = milestones[camp];
  return (
    <section
      ref={rootRef}
      className={styles.ascent}
      aria-labelledby="ascent-heading"
      data-vt-exit
      style={{ "--x0": pct(PAD.left, W), "--xspan": pct(W - PAD.left - PAD.right, W) } as CSSProperties}
    >
      <style>{climberKeyframes}</style>
      <header className={styles.header} data-quiet-zone>
        <RuledHeading id="ascent-heading" text={labels.heading} className={`${styles.heading} display`} ruleClassName={styles.headRule} />
        <p className="body-copy">{labels.intro}</p>
        <p className={`${styles.rarityNote} hud-label map-halo keep-halo`}>{labels.rarityNote}</p>
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
                  {formatInteger(m)} m
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
                data-pin=""
                style={{ left: pct(xOf(m.at * profile.lengthKm), W), top: pct(yOf(elevationAt(m.at)), H), "--at": m.at } as CSSProperties}
              >
                {i + 1}
              </span>
            ))}
            <span className={styles.climber} style={{ animationName: "ascent-climber" }} data-climber="" />
            <p className={`${styles.readout} hud-label`}>
              {labels.readout.altitude} <RollNumber value={Math.round(elevationAt(shown.at))} /> m · {labels.readout.distance} {(shown.at * profile.lengthKm).toFixed(1)}
            </p>
          </div>
        </div>

        <ol ref={stepsRef} className={styles.steps}>
          {milestones.map((m, i) => {
            const token = rarityTokens[m.rarity];
            return (
              <li key={i} className={styles.step} data-reached="">
                <article className={styles.plaque}>
                  <p className={`${styles.year} hud-label`}>
                    <span className={styles.index} aria-hidden="true">
                      {i + 1}
                    </span>
                    {m.year}
                    <span className={styles.rarity} style={{ "--rarity": cssColor(token.color) } as CSSProperties}>
                      <svg viewBox="0 0 12 12" aria-hidden="true">
                        <path d={rarityShapes[token.shape]} />
                      </svg>
                      <span aria-hidden="true">{m.rarity}</span>
                      <span className="visually-hidden">{`${labels.rarityLabel} ${m.rarity}, ${token.label.toLowerCase()}`}</span>
                    </span>
                  </p>
                  <h3 className={`${styles.title} display`}>{m.title}</h3>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
