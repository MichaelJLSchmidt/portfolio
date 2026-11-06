/**
 * Quiet zones ask the contour field to fade its lines behind text, the way contour lines break
 * under the labels of a printed map: elements marked `data-quiet-zone` and running text
 * (`.body-copy`). One strength for all of them (the config's `quiet`: 25 %, a 48 px feather). The
 * field reads their viewport rectangles, kept current with a ResizeObserver, scroll and resize
 * events, a MutationObserver for zones that arrive or leave with a route change, and every frame
 * while a CSS animation or transition moves one (a reveal rising in).
 */
import type { QuietRect } from "./core";

export const QUIET_ZONE_SELECTOR = "[data-quiet-zone], .body-copy";

export function watchQuietZones(onChange: (rects: readonly QuietRect[]) => void): () => void {
  let elements: Element[] = [];
  const rects: QuietRect[] = [];
  let last = "";

  const measure = () => {
    rects.length = 0;
    const margin = 200;
    for (const el of elements) {
      const r = el.getBoundingClientRect();
      // Zero-sized: hidden.
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom < -margin || r.top > window.innerHeight + margin) continue;
      rects.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
    // More zones than the shader holds: the ones on screen first.
    const onScreen = (r: QuietRect) => (r.bottom > 0 && r.top < window.innerHeight ? 0 : 1);
    rects.sort((a, b) => onScreen(a) - onScreen(b));
    const key = window.innerHeight + "|" + rects.map((r) => `${r.left},${r.top},${r.right},${r.bottom}`).join(";");
    if (key === last) return;
    last = key;
    onChange(rects);
  };

  const resize = new ResizeObserver(measure);
  resize.observe(document.documentElement);

  const collect = () => {
    const next = [...document.querySelectorAll(QUIET_ZONE_SELECTOR)];
    if (next.length === elements.length && next.every((el, i) => el === elements[i])) return;
    elements.forEach((el) => resize.unobserve(el));
    elements = next;
    elements.forEach((el) => resize.observe(el));
    measure();
  };

  let queued = false;
  const mutations = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      collect();
    });
  });
  mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-quiet-zone", "class"] });
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure);

  // Transforms move a zone without resizing or scrolling anything: follow the zones each frame
  // while an animation or transition runs on one of them (or an ancestor), and once more when it
  // ends.
  const FOLLOW_MS = 1000;
  let followUntil = 0;
  let raf = 0;
  const follow = () => {
    measure();
    raf = performance.now() > followUntil ? 0 : requestAnimationFrame(follow);
  };
  const movesZone = (e: Event) => e.target instanceof Element && elements.some((el) => e.target === el || (e.target as Element).contains(el));
  const onStart = (e: Event) => {
    if (!movesZone(e)) return;
    followUntil = performance.now() + FOLLOW_MS;
    if (!raf) raf = requestAnimationFrame(follow);
  };
  const onEnd = (e: Event) => {
    if (movesZone(e)) measure();
  };
  const starts = ["animationstart", "transitionrun"] as const;
  const ends = ["animationend", "animationcancel", "transitionend", "transitioncancel"] as const;
  starts.forEach((type) => document.addEventListener(type, onStart, true));
  ends.forEach((type) => document.addEventListener(type, onEnd, true));
  collect();

  return () => {
    starts.forEach((type) => document.removeEventListener(type, onStart, true));
    ends.forEach((type) => document.removeEventListener(type, onEnd, true));
    if (raf) cancelAnimationFrame(raf);
    mutations.disconnect();
    resize.disconnect();
    window.removeEventListener("scroll", measure);
    window.removeEventListener("resize", measure);
  };
}
