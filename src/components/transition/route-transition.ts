import { fieldStore } from "@/components/terrain/field-store";
import { stillNavigation } from "@/lib/view-transition";

/**
 * Runs a navigation inside a view transition of its own, for route changes React does not
 * animate: from one case study to another (the same page template with other props, so no
 * <ViewTransition> boundary enters or leaves). The browser captures the page as it is, then
 * `navigate` starts the route change, and the new page is captured once the route has committed
 * (the conductor's fieldStore.routeSeq) or after `timeoutMs`, whichever comes first; named parts
 * pair as in any other transition (commit-morph.ts). Still mode and browsers without the API
 * navigate directly.
 */
export function transitionTo(navigate: () => void, timeoutMs = 1500) {
  if (stillNavigation() || typeof document.startViewTransition !== "function") return navigate();
  const seq = fieldStore.get().routeSeq;
  document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const done = () => {
          unsubscribe();
          window.clearTimeout(timer);
          // After the commit's own microtasks (RouteArrival), before the new page is captured.
          queueMicrotask(resolve);
        };
        const unsubscribe = fieldStore.subscribe(() => fieldStore.get().routeSeq !== seq && done());
        const timer = window.setTimeout(done, timeoutMs);
        navigate();
      }),
  );
}
