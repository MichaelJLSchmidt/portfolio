/**
 * Quiet zones ask the contour field to fade its lines behind text, the way contour lines
 * break under the labels of a printed map. Two strengths:
 * - "heading": elements marked `data-quiet-zone` (display type, page headers), lines at ~25%;
 * - "body": running text (`.body-copy`) and other text blocks (`.knockout`), lines at ~9%
 *   with a wider feather, so they visibly break around the copy.
 * The field reads their viewport rectangles, kept current with a ResizeObserver (size and
 * layout changes), scroll and resize events, and a MutationObserver for zones that arrive or
 * leave with a route change.
 */
export type QuietKind = "heading" | "body";
export type QuietRect = { left: number; top: number; right: number; bottom: number; kind: QuietKind };

const BODY_SELECTOR = ".body-copy, .knockout";
export const QUIET_ZONE_SELECTOR = `[data-quiet-zone], ${BODY_SELECTOR}`;

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
      rects.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, kind: el.matches(BODY_SELECTOR) ? "body" : "heading" });
    }
    // More zones than the shader holds: the ones on screen first.
    const onScreen = (r: QuietRect) => (r.bottom > 0 && r.top < window.innerHeight ? 0 : 1);
    rects.sort((a, b) => onScreen(a) - onScreen(b));
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
  mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-quiet-zone", "class"] });
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
