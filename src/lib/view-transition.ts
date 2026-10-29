import { beginReturn, finishReassembly } from "@/components/transition/return-transition";

/**
 * View transitions for route changes. React's <ViewTransition> starts them through
 * document.startViewTransition, so that call is wrapped once here:
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

/** Still mode: routes change without View Transitions. */
export const stillNavigation = () =>
  typeof document !== "undefined" && document.documentElement.getAttribute("data-motion") === "still";

if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
  const start = Document.prototype.startViewTransition;
  Document.prototype.startViewTransition = function (this: Document, ...args: Parameters<typeof start>) {
    if (stillNavigation()) throw new DOMException("View transitions are off (still motion mode).", "InvalidStateError");
    // A card still rebuilding from the last return is complete before anything is captured.
    finishReassembly();
    const run = beginReturn();
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
    // `finished` rejects when the update fails or times out; either way it is over.
    const clear = () => {
      if (active === transition) active = null;
      run?.finished();
    };
    transition.finished.then(clear, clear);
    // An aborted transition draws nothing: drop the choreography's state right away.
    if (run) transition.ready.catch(() => run.finished());
    return transition;
  } as typeof start;
}

export function activeViewTransition(): ViewTransition | null {
  if (typeof document === "undefined") return null;
  return (document as Doc).activeViewTransition ?? active;
}
