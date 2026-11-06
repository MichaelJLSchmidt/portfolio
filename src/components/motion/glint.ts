import { duration } from "@/styles/tokens";
import { currentMode } from "@/lib/motion-mode";

/**
 * Plays the glint layer(s) in `scope` once (full motion only): the Mythic card's foil sweep, the
 * only glint left. One at a time, so a glint asked for while another plays is skipped. An `auto`
 * glint (one nobody asked for: a Mythic card arriving) is also skipped within a screen's height of
 * the last one on the page, so there is at most one per viewport. Resolves when it is over.
 */
let playing: Element | null = null;
let lastAuto: { path: string; y: number } | null = null;

export function playGlint(scope: Element | null, { auto = false }: { auto?: boolean } = {}): Promise<void> {
  if (!scope || currentMode() !== "full" || (playing && playing.isConnected)) return Promise.resolve();
  const layers = scope.matches("[data-glint]") ? [scope] : [...scope.querySelectorAll("[data-glint]")];
  if (!layers.length) return Promise.resolve();
  if (auto) {
    const here = { path: window.location.pathname, y: window.scrollY };
    if (lastAuto && lastAuto.path === here.path && Math.abs(lastAuto.y - here.y) < window.innerHeight) return Promise.resolve();
    lastAuto = here;
  }
  playing = scope;
  return new Promise((done) => {
    const end = () => {
      window.clearTimeout(timer);
      layers.forEach((l) => l.setAttribute("data-glint", ""));
      if (playing === scope) playing = null;
      done();
    };
    // Restart cleanly if a layer was left mid-pass; the timer covers a missed animationend.
    layers.forEach((l) => l.setAttribute("data-glint", ""));
    void (layers[0] as HTMLElement).offsetWidth;
    layers.forEach((l) => l.setAttribute("data-glint", "play"));
    const timer = window.setTimeout(end, duration.glint + 100);
    layers[0].addEventListener("animationend", end, { once: true });
  });
}
