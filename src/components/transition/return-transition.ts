import { playGlint } from "@/components/motion/glint";
import { BASE_PATH } from "@/lib/asset";
import { clearTraversal } from "@/lib/view-transition";
import { duration, stagger } from "@/styles/tokens";

/**
 * The way back into the deck (case study → deck): a "card reassembly".
 *
 * 1. The page's own content (everything not shared with the card, marked `data-vt-exit`)
 *    leaves first: each part gets a view-transition name just before the old state is
 *    captured and exits with the scree easing (globals.css, `.vt-exit`).
 * 2. The artwork and title travel back into the card (the same morph as forward, retimed
 *    under `html[data-vt="return"]`).
 * 3. Once the new page is in the DOM, the deck card is rebuilt around the landed artwork:
 *    `data-reassemble` plays the neatline and the staggered rise of its parts
 *    (SummitCard.module.css), a glint crosses its name once the neatline has closed (the Glint
 *    primitive, full motion), then the attribute is removed.
 *
 * view-transition.ts calls `beginReturn` for every route transition but browser back and forward
 * (those cross-fade); it only acts when a detail page (`main[data-card]`) is left for the deck
 * by a link (the back links). Dev and preview builds keep the previous
 * return behind `?vt=classic` (and back with `?vt=new`), remembered for the session, so both
 * can be compared.
 */
export type ReturnRun = { afterUpdate(): void; finished(): void };

const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";
const FLAG_KEY = "summit:vt";
/** When the rebuilt card's neatline has closed (its glint plays then), and its last part has risen. */
const NEATLINE_CLOSED_MS = duration.settle + duration.medium;
const REASSEMBLE_MS = duration.settle + 4 * stagger.item.step + duration.short + duration.instant;

let intended: { path: string; at: number } | null = null;
let reassembling: { card: Element; timer: number } | null = null;

function classic(): boolean {
  if (!previewable) return false;
  try {
    const flag = new URLSearchParams(window.location.search).get("vt");
    if (flag === "classic") sessionStorage.setItem(FLAG_KEY, "classic");
    if (flag === "new") sessionStorage.removeItem(FLAG_KEY);
    return sessionStorage.getItem(FLAG_KEY) === "classic";
  } catch {
    return false;
  }
}

const withoutBase = (path: string) => (BASE_PATH && path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) || "/" : path);
const isDeck = (path: string) => withoutBase(path) === "/";

/**
 * Remembers where a link click is going: a link navigation starts its view transition before
 * the URL changes. (After a history step the URL already shows the destination.)
 */
export function watchNavigationIntent(): () => void {
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || a.target === "_blank" || a.origin !== window.location.origin) return;
    intended = { path: a.pathname, at: performance.now() };
    clearTraversal();
  };
  document.addEventListener("click", onClick, { capture: true });
  classic();
  return () => document.removeEventListener("click", onClick, { capture: true });
}

/** Stops a card rebuild still playing, e.g. when the next navigation starts during it. */
export function finishReassembly() {
  if (!reassembling) return;
  window.clearTimeout(reassembling.timer);
  reassembling.card.removeAttribute("data-reassemble");
  reassembling = null;
}

export function beginReturn(): ReturnRun | null {
  const recent = intended && performance.now() - intended.at < 1500 ? intended.path : null;
  intended = null;
  const destination = recent ?? window.location.pathname;
  const main = [...document.querySelectorAll<HTMLElement>("main[data-card]")].find((m) => m.getClientRects().length);
  if (!main || !isDeck(destination) || classic()) return null;
  const slug = main.dataset.card!;
  const root = document.documentElement;
  root.setAttribute("data-vt", "return");

  // Name the visible parts that leave, before the browser captures the old state.
  const exits = [...main.querySelectorAll<HTMLElement>("[data-vt-exit]")].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
  exits.forEach((el, i) => {
    el.style.setProperty("view-transition-name", `vt-exit-${i}`);
    el.style.setProperty("view-transition-class", "vt-exit");
  });
  const unname = () =>
    exits.forEach((el) => {
      el.style.removeProperty("view-transition-name");
      el.style.removeProperty("view-transition-class");
    });

  return {
    afterUpdate() {
      unname();
      const card = [...document.querySelectorAll(`article[data-slug="${CSS.escape(slug)}"]`)].find((c) => c.getClientRects().length);
      if (!card) return;
      finishReassembly();
      card.setAttribute("data-reassemble", "");
      reassembling = { card, timer: window.setTimeout(finishReassembly, Math.max(REASSEMBLE_MS, NEATLINE_CLOSED_MS)) };
      window.setTimeout(() => playGlint(card.querySelector("[data-name-glint]")), NEATLINE_CLOSED_MS);
    },
    finished() {
      unname();
      root.removeAttribute("data-vt");
    },
  };
}
