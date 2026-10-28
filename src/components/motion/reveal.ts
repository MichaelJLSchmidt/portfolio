import { currentMode } from "@/lib/motion-mode";
import { isSettled, markSettled, settleKey } from "@/lib/settled";
import { duration, levels, stagger } from "@/styles/tokens";

/**
 * Reveals: blocks marked `data-reveal` ("" rises --dist-rise and fades, "card" rises
 * --dist-rise-card, "rule" draws, "sheet" unfolds from its fold edge) appear as they scroll into
 * view, once per session. Anything in the first viewport is shown from first paint and never
 * hidden, so it can be the LCP element; only blocks below the fold wait (data-reveal-state).
 * Budgets (the reveal level): at most two groups animate at once, each within 600 ms (item stagger
 * for the first six); a group that would exceed that, or arrives while the page scrolls fast,
 * snaps to its end state. Still mode never hides anything. One controller for the whole site.
 *
 * Running text, tables and numbers never move (readability outranks motion): a rising block ("" or
 * "card") that is or holds body copy, a surface-copy panel or a table is shown at once. A sheet
 * only unfolds and fades, so its text never moves.
 */
type State = "wait" | "play" | "done";

const keys = new WeakMap<Element, string>();
let io: IntersectionObserver | null = null;
let running = 0;
let lastY = 0;
let lastT = 0;
let speed = 0;

const set = (el: Element, state: State) => el.setAttribute("data-reveal-state", state);
const NEVER_MOVES = ".body-copy, .surface-copy, table";
const rises = (el: Element) => ["", "card"].includes(el.getAttribute("data-reveal") ?? "");
const movesText = (el: Element) => rises(el) && (el.matches(NEVER_MOVES) || !!el.querySelector(NEVER_MOVES));

function keyOf(el: Element): string {
  const scope = el.closest("main") ?? document.body;
  const index = [...scope.querySelectorAll("[data-reveal]")].indexOf(el);
  return settleKey(window.location.pathname, `reveal:${el.id || index}`);
}

function prepare(el: Element) {
  if (el.hasAttribute("data-reveal-state")) return;
  const rects = el.getClientRects();
  // A page Next keeps alive while hidden: prepared once it shows again.
  if (!rects.length) return;
  const key = keyOf(el);
  const r = el.getBoundingClientRect();
  const shown = r.top < window.innerHeight && r.bottom > 0;
  if (currentMode() === "still" || isSettled(key) || shown || r.bottom <= 0 || movesText(el)) {
    if (shown) markSettled(key);
    set(el, "done");
    return;
  }
  keys.set(el, key);
  set(el, "wait");
  io?.observe(el);
}

function play(group: Element[]) {
  const snap = speed > levels.reveal.snapPxPerMs || running >= levels.reveal.maxGroups || currentMode() === "still";
  group.forEach((el) => {
    io?.unobserve(el);
    const key = keys.get(el);
    if (key) markSettled(key);
  });
  if (snap) return group.forEach((el) => set(el, "done"));
  running++;
  const step = stagger.item.step;
  group.forEach((el, i) => {
    (el as HTMLElement).style.setProperty("--reveal-delay", `${Math.min(i, stagger.item.max - 1) * step}ms`);
    set(el, "play");
  });
  const total = Math.min(levels.reveal.maxMs, duration.reveal + (Math.min(group.length, stagger.item.max) - 1) * step);
  window.setTimeout(() => {
    running--;
    group.forEach((el) => {
      set(el, "done");
      (el as HTMLElement).style.removeProperty("--reveal-delay");
    });
  }, total + 50);
}

/** Starts the controller (idempotent); returns a function that rescans, e.g. after a route change. */
export function startReveals(): () => void {
  if (io) return scan;
  const onScroll = () => {
    const now = performance.now();
    const dt = now - lastT;
    if (dt > 0 && dt < 200) speed = Math.abs(window.scrollY - lastY) / dt;
    else speed = 0;
    lastY = window.scrollY;
    lastT = now;
  };
  lastY = window.scrollY;
  lastT = performance.now();
  window.addEventListener("scroll", onScroll, { passive: true });
  io = new IntersectionObserver(
    (entries) => {
      const group = entries
        .filter((e) => e.isIntersecting || e.boundingClientRect.bottom < 0)
        .map((e) => e.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      if (group.length) play(group);
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      scan();
    });
  }).observe(document.body, { childList: true, subtree: true });
  scan();
  return scan;
}

function scan() {
  document.querySelectorAll("[data-reveal]:not([data-reveal-state])").forEach(prepare);
}
