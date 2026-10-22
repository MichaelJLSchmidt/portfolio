/**
 * Quiet zones: elements marked `data-quiet-zone` (hero text, page headers, headings) ask the
 * contour field to fade its lines behind them. The field reads their viewport rectangles,
 * kept current with a ResizeObserver (size and layout changes), scroll and resize events,
 * and a MutationObserver for zones that arrive or leave with a route change.
 */
export type QuietRect = { left: number; top: number; right: number; bottom: number };

export const QUIET_ZONE_SELECTOR = "[data-quiet-zone]";

export function watchQuietZones(onChange: (rects: readonly QuietRect[]) => void): () => void {
  let elements: Element[] = [];
  const rects: QuietRect[] = [];

  const measure = () => {
    rects.length = 0;
    const margin = 200;
    for (const el of elements) {
      const r = el.getBoundingClientRect();
      // Zero-sized: hidden, e.g. a visited page Next keeps alive with display: none.
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom < -margin || r.top > window.innerHeight + margin) continue;
      rects.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
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
    // Many mutations arrive per commit; collect once afterwards.
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      collect();
    });
  });
  mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-quiet-zone"] });
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure);
  collect();

  return () => {
    mutations.disconnect();
    resize.disconnect();
    window.removeEventListener("scroll", measure);
    window.removeEventListener("resize", measure);
  };
}
