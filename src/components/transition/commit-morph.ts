import { afterNextTransition, stillNavigation } from "@/lib/view-transition";

/**
 * Shared elements that pair only with the navigation the reader commits to: the trailhead band's
 * next card (SummitCard transitionNames="commit") morphs into the next case study's header and
 * H1, while the deck's card of the same name, which the band would otherwise pair with on the way
 * in from the deck, never does. The parts carry their name in `data-commit-morph` (and their class
 * in `data-commit-class`); a click that commits names them just before the view transition
 * captures the page, and they are unnamed once it is over.
 */
export function nameOnCommit(scope: Element | null) {
  if (!scope || stillNavigation() || typeof document.startViewTransition !== "function") return;
  // Only parts on screen: a part far off screen would fly in from nowhere.
  const parts = [...scope.querySelectorAll<HTMLElement>("[data-commit-morph]")].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
  if (!parts.length) return;
  for (const el of parts) {
    el.style.setProperty("view-transition-name", el.dataset.commitMorph ?? "");
    if (el.dataset.commitClass) el.style.setProperty("view-transition-class", el.dataset.commitClass);
  }
  afterNextTransition(() =>
    parts.forEach((el) => {
      el.style.removeProperty("view-transition-name");
      el.style.removeProperty("view-transition-class");
    }),
  );
}
