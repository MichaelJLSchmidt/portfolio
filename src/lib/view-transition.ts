/**
 * View transitions for route changes. React's <ViewTransition> starts them through
 * document.startViewTransition, so that call is wrapped once here:
 *
 * - Calm map / reduced motion: no View Transition at all. The wrapper throws before the API is
 *   reached, and React commits the navigation directly (its fallback when a transition cannot
 *   start). CalmRouteFade then fades the incoming page in.
 * - Otherwise the running transition is tracked (the native document.activeViewTransition is
 *   used where the browser has it), so components that mount inside one can wait for it to
 *   land, e.g. a heading that settles afterwards.
 *
 * Imported for its side effect by HistoryTransitions (root layout), before any navigation.
 */
type Doc = Document & { activeViewTransition?: ViewTransition | null };

let active: ViewTransition | null = null;

export const calmNavigation = () =>
  typeof document !== "undefined" && document.documentElement.getAttribute("data-motion") === "reduced";

if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
  const start = Document.prototype.startViewTransition;
  Document.prototype.startViewTransition = function (this: Document, ...args: Parameters<typeof start>) {
    if (calmNavigation()) throw new DOMException("View transitions are off (reduced motion).", "InvalidStateError");
    const transition = start.apply(this, args);
    active = transition;
    // `finished` rejects when the update fails or times out; either way it is over.
    const clear = () => {
      if (active === transition) active = null;
    };
    transition.finished.then(clear, clear);
    return transition;
  } as typeof start;
}

export function activeViewTransition(): ViewTransition | null {
  if (typeof document === "undefined") return null;
  return (document as Doc).activeViewTransition ?? active;
}
