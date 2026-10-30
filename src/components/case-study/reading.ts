"use client";

import { useSyncExternalStore } from "react";

/**
 * Where the reader is in a case study: the current waypoint (the last one whose top has passed a
 * line 30% down the screen; at the very bottom, the last one; -1 above the first) and the reading
 * progress through the waypoints (0 to 1, continuous). One scroll-spy per page (`startReadingSpy`,
 * run by WaypointTrail), measured in the read phase of Motion's frame loop, at most once a frame.
 *
 * The waypoint is state (the trail and the altimeter bar render it); the progress
 * changes every frame, so it is written straight to CSS custom properties (`--reading`) on the
 * elements that registered for it, never through React.
 */
export type Reading = { slug: string | null; index: number; count: number };

const REST: Reading = { slug: null, index: -1, count: 0 };
let reading: Reading = REST;
const listeners = new Set<() => void>();
const meters = new Set<HTMLElement>();
let progress = 0;

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

function set(next: Reading) {
  if (next.slug === reading.slug && next.index === reading.index && next.count === reading.count) return;
  reading = next;
  listeners.forEach((l) => l());
}

/** The current waypoint of the case study on screen (index -1 before the first, or elsewhere). */
export function useReading(): Reading {
  return useSyncExternalStore(subscribe, () => reading, () => REST);
}

/** Keeps `--reading` (0..1) on `el` in step with the reading progress; returns the unregister. */
export function meterReading(el: HTMLElement): () => void {
  meters.add(el);
  el.style.setProperty("--reading", progress.toFixed(4));
  return () => {
    meters.delete(el);
  };
}

/** Starts the scroll-spy for a case study's waypoints (section ids); returns the stop. */
export function startReadingSpy(slug: string, ids: string[]): () => void {
  let loop: typeof import("@/lib/frameloop") | null = null;
  let queued = false;
  let disposed = false;
  const update = () => {
    queued = false;
    const sections = ids.map((id) => document.getElementById(id)).filter((s): s is HTMLElement => !!s && s.getClientRects().length > 0);
    if (!sections.length) return;
    const line = window.innerHeight * 0.3;
    let index = -1;
    let within = 0;
    sections.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.top <= line) {
        index = i;
        within = Math.min(1, (line - r.top) / Math.max(1, r.height));
      }
    });
    const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (bottom && index >= 0) {
      index = sections.length - 1;
      within = 1;
    }
    progress = index < 0 ? 0 : Math.min(1, (index + within) / sections.length);
    meters.forEach((m) => m.style.setProperty("--reading", progress.toFixed(4)));
    set({ slug, index, count: sections.length });
  };
  const schedule = () => {
    if (queued || !loop) return;
    queued = true;
    loop.frame.read(update);
  };
  import("@/lib/frameloop").then((m) => {
    if (disposed) return;
    loop = m;
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
  });
  return () => {
    disposed = true;
    if (loop) loop.cancelFrame(update);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("hashchange", schedule);
    if (reading.slug === slug) set(REST);
  };
}
