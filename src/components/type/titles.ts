/**
 * The one IntersectionObserver every WeightTitle that arrives in view shares: it marks a title
 * `data-title-in` the first time it comes into view (its stylesheet plays the arrival in full
 * motion), then lets it go. A title whose arrival has ended is marked `data-title-done`, so it
 * never plays again, not even when Next shows its page again. Reveals.tsx rescans on every route.
 */
let io: IntersectionObserver | null = null;

export function watchTitles() {
  if (typeof IntersectionObserver === "undefined") return;
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-title-in", "");
          io?.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.addEventListener("animationend", (e) => {
      const el = e.target as Element;
      if (e.animationName.includes("title-arrive") && el.hasAttribute("data-title")) el.setAttribute("data-title-done", "");
    });
  }
  document.querySelectorAll('[data-title="view"]:not([data-title-in])').forEach((el) => io?.observe(el));
}

/**
 * A page morph brought these titles in (a shared element of the route's view transition): the
 * morph is their arrival, so they rest at once. Called by RouteArrival before the first frame.
 */
export function restMorphedTitles(main: Element) {
  main.querySelectorAll<HTMLElement>("[data-title]").forEach((el) => {
    if (el.style.viewTransitionName) el.setAttribute("data-title-morphed", "");
  });
}
