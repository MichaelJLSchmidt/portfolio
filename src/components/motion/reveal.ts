import { currentMode } from "@/lib/motion-mode";
import { isSettled, markSettled, settleKey } from "@/lib/settled";
import { duration, levels, stagger } from "@/styles/tokens";

/**
 * Reveals: blocks marked `data-reveal` ("" rises --dist-rise and fades, "card" rises
 * --dist-rise-card; in calm both only fade; "rule" draws, "sheet" unfolds from its fold edge,
 * "line" traces a drawn line such as the footer's elevation profile over the draw token, "list"
 * draws a list's ring bullets with the item stagger, "caption" fades in after its figure, "mark" draws a small mark's paths,
 * "fade" fades in only (running text may take it), after its block's --fade-after; "turn" is a
 * binder page turning in (BinderPage, full motion only); "trace" a drawing whose route traces in
 * over the draw token (CareerProfile: its own stylesheet says how);
 * "figure" unfolds a figure behind a scan line, its corner ticks after; a figure below the fold
 * shows a contour placeholder until its images have decoded) appear as they scroll into view, once
 * per session. Anything in the first viewport is shown from first paint and never
 * hidden, so it can be the LCP element; only blocks below the fold wait (data-reveal-state).
 * Budgets (the reveal level): at most two groups animate at once, each within 600 ms (item stagger
 * for the first six); a group that would exceed that, or arrives while the page scrolls fast,
 * snaps to its end state. Still mode never hides anything. One controller for the whole site.
 *
 * Running text, tables and numbers never move (readability outranks motion): a rising block ("" or
 * "card") that is or holds body copy, a surface-copy panel or a table is shown at once. A sheet
 * only unfolds and fades, so its text never moves.
 *
 * A route's arrival (RouteArrival, a link navigation in full and calm) is the exception to "the
 * first viewport is simply there": a block marked `data-arrive-at="<ms>"` that is on screen when the
 * route commits plays from that many milliseconds after the commit and lands by the arrival's end
 * (duration.arrival), every time the page is reached by a link (`playArrival`). Below the fold it
 * reveals as usual.
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

function prepare(el: Element, r: DOMRect | null) {
  // A page Next keeps alive while hidden: prepared once it shows again.
  if (!r) return;
  const key = keyOf(el);
  const shown = r.top < window.innerHeight && r.bottom > 0;
  if (currentMode() === "still" || isSettled(key) || shown || r.bottom <= 0 || movesText(el)) {
    if (shown) markSettled(key);
    set(el, "done");
    return;
  }
  keys.set(el, key);
  set(el, "wait");
  io?.observe(el);
  if (el.getAttribute("data-reveal") === "figure") placeholdUntilDecoded(el);
}

/** A figure below the fold shows a contour placeholder until its images decode, then they fade in. */
function placeholdUntilDecoded(el: Element) {
  const images = [...el.querySelectorAll("img")].filter((img) => !img.complete);
  if (!images.length) return;
  el.setAttribute("data-decoding", "");
  const decoded = images.map((img) =>
    new Promise<void>((resolve) => {
      img.addEventListener("load", () => resolve(), { once: true });
      img.addEventListener("error", () => resolve(), { once: true });
    }).then(() => img.decode().catch(() => {})),
  );
  Promise.all(decoded).then(() => el.removeAttribute("data-decoding"));
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
  // A traced line takes the draw token (it holds no text); a caption fades after its
  // rule or figure; everything else keeps the budget.
  const own = Math.max(
    ...group.map((el) => {
      const kind = el.getAttribute("data-reveal");
      // A drawing whose route traces in (the career profile; its stylesheet animates the route).
      if (kind === "line" || kind === "trace") return duration.draw;
      if (kind === "mark") return duration.trace;
      // A binder page turning in (full only; its stylesheet animates it).
      if (kind === "turn") return duration.long;
      if (kind === "fade") return duration.reveal + duration.tap;
      if (kind === "figure") return duration.settle + duration.short;
      // A sheet whose marks draw after it opens (the evidence legend's swatches).
      if (kind === "sheet" && el.hasAttribute("data-draws")) return duration.reveal / 2 + duration.trace + duration.short;
      if (kind === "caption") return duration.settle + 2 * duration.short;
      if (kind === "list") return duration.reveal + (Math.min(el.children.length, stagger.item.max) - 1) * stagger.item.step;
      const rows = el.querySelector("[data-sheet-rows]")?.children.length ?? 0;
      if (kind === "sheet" && rows) return Math.max(duration.reveal + duration.short, duration.reveal / 2 + (Math.min(rows, stagger.item.max) - 1) * stagger.item.step + duration.micro);
      return 0;
    }),
  );
  const total = Math.max(own, Math.min(levels.reveal.maxMs, duration.reveal + (Math.min(group.length, stagger.item.max) - 1) * step));
  window.setTimeout(() => {
    running--;
    group.forEach((el) => {
      set(el, "done");
      (el as HTMLElement).style.removeProperty("--reveal-delay");
    });
  }, total + 50);
}

/** True while the page scrolls faster than the reveal level's snap speed (reveals and settles snap). */
export const scrollingFast = () => speed > levels.reveal.snapPxPerMs;

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

/**
 * The route's arrival: plays the on-screen blocks marked `data-arrive-at` of the page that has just
 * committed (before the view transition captures it), timed from now.
 */
export function playArrival(main: Element) {
  if (currentMode() === "still") return;
  scan();
  main.querySelectorAll<HTMLElement>("[data-reveal][data-arrive-at]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!el.getClientRects().length || r.top >= window.innerHeight || r.bottom <= 0) return;
    io?.unobserve(el);
    markSettled(keys.get(el) ?? keyOf(el));
    const at = Number(el.dataset.arriveAt) || 0;
    // Its own duration (data-arrive-dur), or up to the arrival's end.
    const own = Number(el.dataset.arriveDur) || Math.max(duration.instant, duration.arrival - at);
    el.style.setProperty("--reveal-delay", `${at}ms`);
    el.style.setProperty("--reveal-dur", `${own}ms`);
    // Restart: the page may be one Next kept alive and shows again.
    set(el, "done");
    void el.offsetWidth;
    set(el, "play");
    // The content (or rows) fade in after the sheet; then the reveal is done.
    const rows = Math.min(el.querySelector("[data-sheet-rows]")?.children.length ?? 0, stagger.item.max);
    const end = Math.max(own + duration.short, rows ? own / 2 + (rows - 1) * stagger.item.step + duration.micro : 0);
    window.setTimeout(() => {
      set(el, "done");
      el.style.removeProperty("--reveal-delay");
      el.style.removeProperty("--reveal-dur");
    }, at + end + 50);
  });
}

function scan() {
  // Every box is read before any state is written: one layout for the whole scan, not one per block.
  const found = [...document.querySelectorAll("[data-reveal]:not([data-reveal-state])")];
  const rects = found.map((el) => (el.getClientRects().length ? el.getBoundingClientRect() : null));
  found.forEach((el, i) => prepare(el, rects[i]));
}
