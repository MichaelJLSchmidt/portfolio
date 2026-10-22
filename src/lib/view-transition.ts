/**
 * The view transition currently running, if any. React's <ViewTransition> starts them through
 * document.startViewTransition, so the call is observed once here (the native
 * document.activeViewTransition is used where the browser has it). Components that mount
 * inside a transition can wait for it to land, e.g. a heading that settles afterwards.
 */
type Doc = Document & { activeViewTransition?: ViewTransition | null };

let active: ViewTransition | null = null;

if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
  const start = Document.prototype.startViewTransition;
  Document.prototype.startViewTransition = function (this: Document, ...args: Parameters<typeof start>) {
    const transition = start.apply(this, args);
    active = transition;
    transition.finished.finally(() => {
      if (active === transition) active = null;
    });
    return transition;
  } as typeof start;
}

export function activeViewTransition(): ViewTransition | null {
  if (typeof document === "undefined") return null;
  return (document as Doc).activeViewTransition ?? active;
}
