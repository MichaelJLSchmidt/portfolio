/**
 * View transitions: the one running now, for code that must not act while a transition holds the
 * page (the lightbox's backdrop click, the field's crossfade). React's <ViewTransition> starts
 * route transitions itself (docs/motion.md, "Transitions").
 */
type Doc = Document & { activeViewTransition?: ViewTransition | null };

let active: ViewTransition | null = null;

if (typeof document !== "undefined" && typeof document.startViewTransition === "function" && !("activeViewTransition" in document)) {
  // Browsers without document.activeViewTransition: track the running transition here.
  const start = Document.prototype.startViewTransition;
  Document.prototype.startViewTransition = function (this: Document, ...args: Parameters<typeof start>) {
    const transition = start.apply(this, args);
    active = transition;
    const clear = () => {
      if (active === transition) active = null;
    };
    transition.finished.then(clear, clear);
    // A transition skipped by the next one rejects these: expected, not an error to report.
    transition.ready.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
    return transition;
  } as typeof start;
}

export function activeViewTransition(): ViewTransition | null {
  if (typeof document === "undefined") return null;
  return (document as Doc).activeViewTransition ?? active;
}
