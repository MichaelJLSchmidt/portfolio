import { currentMode } from "@/lib/motion-mode";

/**
 * Scroll reveals: a block marked `data-reveal` that starts below the fold waits (opacity 0, 12 px
 * lower) and arrives once, when 15 % of it is in view: opacity and a 12 px rise over --dur-enter,
 * ease-out. Never reversed, never on the sheet's bands (their markup doesn't ask for it), never in
 * Off. Anything in the first viewport is there from first paint (it may be the LCP element).
 * Siblings revealed together step 60 ms apart (at most four steps; Calm: together), set from
 * `data-reveal-index` or their order in a `data-reveal-group`.
 */
let io: IntersectionObserver | null = null;

const set = (el: Element, state: "wait" | "in" | "shown") => el.setAttribute("data-reveal-state", state);

export function startReveals(root: ParentNode = document): () => void {
  if (typeof window === "undefined") return () => {};
  io?.disconnect();
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        set(e.target, "in");
        io?.unobserve(e.target);
      }
    },
    { threshold: 0.15 },
  );
  const still = currentMode() === "still";
  for (const el of root.querySelectorAll("[data-reveal]")) {
    if (el.getAttribute("data-reveal-state")) continue;
    const r = el.getBoundingClientRect();
    // In the first viewport, on a sheet band (or Off): there from the first paint, no animation.
    if (still || !r.height || r.top < window.innerHeight || el.closest("[data-band]")) {
      set(el, "shown");
      continue;
    }
    const group = el.closest("[data-reveal-group]");
    if (group) {
      const index = [...group.querySelectorAll("[data-reveal]")].indexOf(el);
      (el as HTMLElement).style.setProperty("--reveal-i", String(Math.min(index, 3)));
    }
    set(el, "wait");
    io.observe(el);
  }
  return () => io?.disconnect();
}
