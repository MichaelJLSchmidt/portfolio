import { beginReturn, finishReassembly } from "@/components/transition/return-transition";

/**
 * View transitions for route changes. React's <ViewTransition> starts them through
 * document.startViewTransition, so that call is wrapped once here:
 *
 * - Every transition gets a kind (`transitionKind()`): "route" (a link), "traverse" (browser back
 *   or forward: a 180 ms cross-fade plus the shared elements, `html[data-vt="traverse"]`, and no
 *   arrival choreography), "return" (a link back into the deck, the card reassembly) or "view"
 *   (in the page: the deck's Cards ⇄ Index switch, the lightbox).
 *
 * - Still mode (the OS asks for reduced motion): no View Transition at all. The wrapper throws
 *   before the API is reached, and React commits the navigation directly (its fallback when a
 *   transition cannot start). RouteFade then fades the incoming page in. Full and calm both
 *   morph (motion-mode.ts).
 * - Otherwise the running transition is tracked (the native document.activeViewTransition is
 *   used where the browser has it), so components that mount inside one can wait for it to
 *   land, e.g. a heading that settles afterwards.
 * - Going back into the deck adds the card reassembly (return-transition.ts): it prepares the
 *   old state before the browser captures it and rebuilds the card once React has committed.
 *
 * Imported for its side effect by HistoryTransitions (root layout), before any navigation.
 */
type Doc = Document & { activeViewTransition?: ViewTransition | null };
type Update = (() => Promise<void> | void) | null | undefined;

let active: ViewTransition | null = null;

export type TransitionKind = "route" | "traverse" | "return" | "view";
let kind: TransitionKind | null = null;
/** When HistoryTransitions last replayed a popstate (the next transition is a traversal). */
let traversal = -Infinity;

/** HistoryTransitions: the transition about to start comes from browser back or forward. */
export function markTraversal() {
  traversal = performance.now();
}

/** Called once the next transition that starts is over (or after `fallbackMs` if none starts). */
const afterNext: (() => void)[] = [];
export function afterNextTransition(done: () => void, fallbackMs = 4000) {
  let ran = false;
  const once = () => {
    if (ran) return;
    ran = true;
    window.clearTimeout(timer);
    done();
  };
  const timer = window.setTimeout(() => {
    const i = afterNext.indexOf(once);
    if (i >= 0) afterNext.splice(i, 1);
    once();
  }, fallbackMs);
  afterNext.push(once);
}

/** A link click: whatever starts next is not a traversal. */
export function clearTraversal() {
  traversal = -Infinity;
}

/** Still mode: routes change without View Transitions. */
export const stillNavigation = () =>
  typeof document !== "undefined" && document.documentElement.getAttribute("data-motion") === "still";

if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
  const start = Document.prototype.startViewTransition;
  Document.prototype.startViewTransition = function (this: Document, ...args: Parameters<typeof start>) {
    if (stillNavigation()) throw new DOMException("View transitions are off (still motion mode).", "InvalidStateError");
    // A card still rebuilding from the last return is complete before anything is captured.
    finishReassembly();
    const root = this.documentElement;
    const flag = root.getAttribute("data-vt");
    const traverse = performance.now() - traversal < 1000;
    traversal = -Infinity;
    // Browser back and forward cross-fade (globals.css); a link back into the deck rebuilds the card.
    // In-page transitions (the deck's view switch, the lightbox) are no route change.
    const local = !!flag && (flag.startsWith("view") || flag === "lightbox");
    const run = local || traverse ? null : beginReturn();
    const own: TransitionKind = local ? "view" : traverse ? "traverse" : run ? "return" : "route";
    if (traverse) root.setAttribute("data-vt", "traverse");
    if (run) {
      const arg = args[0] as Update | { update?: Update } | undefined;
      const update = typeof arg === "function" ? arg : arg?.update;
      const wrapped = async () => {
        await update?.();
        run.afterUpdate();
      };
      args[0] = (typeof arg === "function" || !arg ? wrapped : { ...arg, update: wrapped }) as Parameters<typeof start>[0];
    }
    const transition = start.apply(this, args);
    active = transition;
    kind = own;
    const waiting = afterNext.splice(0);
    const after = () => waiting.forEach((f) => f());
    transition.finished.then(after, after);
    // `finished` rejects when the update fails or times out; either way it is over.
    const clear = () => {
      if (active === transition) {
        active = null;
        kind = null;
      }
      if (traverse && root.getAttribute("data-vt") === "traverse") root.removeAttribute("data-vt");
      run?.finished();
    };
    transition.finished.then(clear, clear);
    // An aborted transition draws nothing: drop the choreography's state right away.
    if (run) transition.ready.catch(() => run.finished());
    return transition;
  } as typeof start;
}

/** The kind of the transition running now, or null when none runs. */
export function transitionKind(): TransitionKind | null {
  return activeViewTransition() ? kind ?? "route" : null;
}

export function activeViewTransition(): ViewTransition | null {
  if (typeof document === "undefined") return null;
  return (document as Doc).activeViewTransition ?? active;
}
