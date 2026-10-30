/**
 * The italic face (Archivo Italic, not preloaded) is fetched only once italic text comes near the
 * screen: until then every italic element is set in the local text fallback (globals.css), which
 * fetches nothing. The first one within a screen and a half sets html[data-italic] for the rest
 * of the visit, and the face loads. Italic sits in the cards (reminders, flavour text) and pull
 * quotes, so most first views never need it. Without JavaScript italic stays in the fallback.
 */
const SELECTOR = "em, i, .italic";
let io: IntersectionObserver | null = null;

/** Watches the page's italic elements (idempotent; call again after a route change). */
export function watchItalicFace() {
  const root = document.documentElement;
  if (root.hasAttribute("data-italic")) return;
  io ??= new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      root.setAttribute("data-italic", "");
      io?.disconnect();
      io = null;
    },
    { rootMargin: "150% 0px" },
  );
  document.querySelectorAll(SELECTOR).forEach((el) => io?.observe(el));
}
