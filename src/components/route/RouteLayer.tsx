"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { currentMode, useMotionMode } from "@/lib/motion-mode";
import { buildRoute, freeBand, lengthAt, routeKeyframes, stepAt, type RouteStop } from "@/lib/route-geometry";
import styles from "./RouteLayer.module.css";

/**
 * The red route: one path down the page through its waypoints, the reader's way up the mountain.
 * Rendered as the first child of a page's <main>; the waypoints are the elements in it marked
 * `data-route`:
 *
 * - `data-route` (the default anchor, "gutter"): the route passes the element's top in the left
 *   gutter (the 16 px margin on phones);
 * - `data-route-anchor="center"`: it enters the element at its top centre and leaves at its foot
 *   (a drawing the route passes behind: masked there);
 * - `data-route-anchor="ridge"`: it joins the element's foot at its right end and leaves for the
 *   gutter along it (the home page's ridge of cards, masked across it);
 * - `data-route-blaze`: from this waypoint on the route is climbed on foot, painted white-red-white
 *   like the trail blazes above the last station (case studies).
 *
 * Phones put every waypoint in the margin, the route a 2 px trail with a switchback before each.
 * The geometry (src/lib/route-geometry.ts) is measured again whenever the page's layout changes
 * (a ResizeObserver on <main> and the document, fonts loading, a resize).
 *
 * The walked part follows the reading line (30% down the screen, like the case study's reading
 * spy, so the waypoint trail beside a case study is a magnified view of the same progress):
 * - full: a dashed base, the walked line solid over it, and a "you are here" marker riding its end
 *   (offset-path), driven by a ScrollTimeline whose keyframes put each waypoint where it crosses
 *   the reading line; without scroll timelines, the same keyframes are painted from the scroll on
 *   Motion's frame loop, at most once a frame;
 * - calm: the walked line and the marker advance a waypoint at a time (a short ease);
 * - still: the whole route drawn solid, no marker, nothing moves.
 * Decorative (aria-hidden): the waypoints are the page's own sections.
 */
type Drawn = {
  d: string;
  length: number;
  blazeFrom: number | null;
  width: number;
  height: number;
  frames: { offset: number; length: number }[];
  /** Where the route passes behind a waypoint (masked), in the layer's px. */
  hidden: { x: number; y: number; w: number; h: number }[];
};

/** The sm breakpoint: below it the route keeps to the margin. */
const PHONE = 640;
/** What the route must not cross: text and the panels and figures that hold it. */
const TEXT = "p, h1, h2, h3, h4, li, dl, table, figure, blockquote, a, button, .legend";
type Timeline = AnimationTimeline;
type ScrollTimelineCtor = new (options: { source: Element; axis?: "block" | "inline" }) => Timeline;

export function RouteLayer({ line = 0.3 }: { line?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const walkedRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const [route, setRoute] = useState<Drawn | null>(null);
  const { mode } = useMotionMode();
  const maskId = `route-mask-${useId().replace(/:/g, "")}`;

  // Measure the waypoints whenever the page's layout changes.
  useEffect(() => {
    const layer = ref.current;
    const main = layer?.parentElement;
    if (!layer || !main) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const box = layer.getBoundingClientRect();
      // A page Next keeps alive while hidden: measured once it shows again.
      if (!box.width || !box.height) return;
      const phone = window.innerWidth < PHONE;
      const gx = (parseFloat(getComputedStyle(main).paddingLeft) || 16) / 2;
      const hidden: Drawn["hidden"] = [];
      const stops: RouteStop[] = [...main.querySelectorAll<HTMLElement>("[data-route]")]
        .filter((el) => el.getClientRects().length > 0)
        .map((el, i) => {
          const r = el.getBoundingClientRect();
          const [top, bottom, left, right] = [r.top - box.top, r.bottom - box.top, r.left - box.left, r.right - box.left];
          const id = el.dataset.route || `stop-${i}`;
          const blaze = el.hasAttribute("data-route-blaze");
          const anchor = phone ? "gutter" : (el.dataset.routeAnchor ?? "gutter");
          if (anchor === "center") {
            const x = (left + right) / 2;
            hidden.push({ x: left, y: top, w: right - left, h: bottom - top });
            return { id, enter: { x, y: top }, leave: { x, y: bottom }, blaze, zig: false };
          }
          if (anchor === "ridge") {
            hidden.push({ x: left, y: top, w: right - left, h: bottom - top + 2 });
            return { id, enter: { x: right, y: bottom }, leave: { x: gx, y: bottom }, blaze, zig: false };
          }
          const y = top + Math.min(16, r.height / 2);
          return { id, enter: { x: gx, y }, leave: { x: gx, y }, blaze };
        })
        .sort((a, b) => a.enter.y - b.enter.y);
      // Where the route changes sides it crosses in the lowest band free of text between the two.
      const text = [...main.querySelectorAll(TEXT)]
        .filter((el) => !el.closest("[data-route-layer]"))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top - box.top, bottom: r.bottom - box.top, left: r.left - box.left, right: r.right - box.left };
        })
        .filter((r) => r.bottom > r.top);
      stops.forEach((stop, i) => {
        const prev = stops[i - 1];
        if (!prev || Math.abs(prev.leave.x - stop.enter.x) < 0.5) return;
        stop.turnY = freeBand(text, { y0: prev.leave.y, y1: stop.enter.y, x0: prev.leave.x, x1: stop.enter.x, min: 32 }) ?? undefined;
      });
      const built = buildRoute(stops, { radius: 24, switchback: phone ? { height: 28, swing: 4 } : { height: 40, swing: 7 } });
      const range = document.documentElement.scrollHeight - window.innerHeight;
      const frames = routeKeyframes(built, { top: box.top + window.scrollY, line: window.innerHeight * line, range });
      setRoute((prev) =>
        prev && prev.d === built.d && prev.width === box.width && prev.height === box.height && JSON.stringify(prev.frames) === JSON.stringify(frames)
          ? prev
          : { d: built.d, length: built.length, blazeFrom: built.blazeFrom, width: box.width, height: box.height, frames, hidden },
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(main);
    resize.observe(document.documentElement);
    document.fonts?.ready.then(schedule);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      resize.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, [line]);

  // Drive the walked line and the marker by the mode (before paint: never drawn, then retracted).
  useLayoutEffect(() => {
    const walked = walkedRef.current;
    const marker = markerRef.current;
    if (!route || !walked || !marker) return;
    const m = currentMode();
    if (m === "still") return;
    const L = Math.max(route.length, 1);
    const dash = (len: number) => (L - len).toFixed(1);
    const at = (len: number) => `${((len / L) * 100).toFixed(3)}%`;
    const Scroll = (window as unknown as { ScrollTimeline?: ScrollTimelineCtor }).ScrollTimeline;
    if (m === "full" && Scroll) {
      const timeline = new Scroll({ source: document.documentElement, axis: "block" });
      const options = { timeline, fill: "both", easing: "linear" } as KeyframeAnimationOptions;
      const line = walked.animate(
        route.frames.map((f) => ({ offset: f.offset, strokeDashoffset: dash(f.length) })),
        options,
      );
      const dot = marker.animate(
        route.frames.map((f) => ({ offset: f.offset, offsetDistance: at(f.length) })),
        options,
      );
      return () => {
        line.cancel();
        dot.cancel();
      };
    }
    // No scroll timelines (full), or calm: painted from the scroll on Motion's frame loop.
    let loop: typeof import("@/lib/frameloop") | null = null;
    let queued = false;
    let disposed = false;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    const paint = () => {
      queued = false;
      const p = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 1;
      const len = m === "calm" ? stepAt(route.frames, p) : lengthAt(route.frames, p);
      walked.style.strokeDashoffset = dash(len);
      marker.style.offsetDistance = at(len);
    };
    const onScroll = () => {
      if (queued || !loop) return;
      queued = true;
      loop.frame.render(paint);
    };
    import("@/lib/frameloop").then((l) => {
      if (disposed) return;
      loop = l;
      paint();
      window.addEventListener("scroll", onScroll, { passive: true });
    });
    return () => {
      disposed = true;
      window.removeEventListener("scroll", onScroll);
      if (loop) loop.cancelFrame(paint);
      walked.style.removeProperty("stroke-dashoffset");
      marker.style.removeProperty("offset-distance");
    };
  }, [route, mode]);

  return (
    <div ref={ref} className={styles.layer} aria-hidden="true" data-route-layer="">
      {route && (
        <>
          <svg className={styles.svg} width={route.width} height={route.height} viewBox={`0 0 ${route.width} ${route.height}`} focusable="false">
            {route.hidden.length > 0 && (
              <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={route.width} height={route.height}>
                <rect width={route.width} height={route.height} fill="white" />
                {route.hidden.map((h, i) => (
                  <rect key={i} x={h.x} y={h.y} width={h.w} height={h.h} fill="black" />
                ))}
              </mask>
            )}
            <g mask={route.hidden.length ? `url(#${maskId})` : undefined} style={{ "--route-length": route.length } as CSSProperties}>
              {route.blazeFrom !== null && (
                <path className={styles.blaze} d={route.d} style={{ strokeDasharray: `0 ${route.blazeFrom.toFixed(1)} ${route.length.toFixed(1)}` }} />
              )}
              <path className={styles.base} d={route.d} />
              <path ref={walkedRef} className={styles.walked} d={route.d} style={{ strokeDasharray: `${route.length.toFixed(1)} ${route.length.toFixed(1)}` }} />
            </g>
          </svg>
          <span ref={markerRef} className={styles.marker} style={{ offsetPath: `path("${route.d}")` }} />
        </>
      )}
    </div>
  );
}
