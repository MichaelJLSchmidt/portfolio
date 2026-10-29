import { duration } from "@/styles/tokens";
import { currentMode } from "@/lib/motion-mode";

/**
 * Plays the glint layer(s) in `scope` once (full motion only). Glints are the signature level:
 * one at a time, so a glint asked for while another plays is skipped. Resolves when it is over.
 */
let playing: Element | null = null;

export function playGlint(scope: Element | null): Promise<void> {
  if (!scope || currentMode() !== "full" || (playing && playing.isConnected)) return Promise.resolve();
  const layers = scope.matches("[data-glint]") ? [scope] : [...scope.querySelectorAll("[data-glint]")];
  if (!layers.length) return Promise.resolve();
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

/**
 * A committed navigation (a card opened, a link to another page): the view transition freezes the
 * departing page in its snapshot, so the commit's glint plays on the destination instead, on its
 * H1 once it has arrived (SettleText `glint`, full motion). The path is the destination's.
 */
let arrival: { path: string; at: number } | null = null;

export function glintOnArrival(path: string) {
  arrival = { path: path.endsWith("/") ? path : `${path}/`, at: performance.now() };
}

/** True once for the page a commit has just led to (within a few seconds). */
export function takeArrivalGlint(path: string): boolean {
  const wanted = arrival;
  if (!wanted || performance.now() - wanted.at > 5000) return false;
  if (wanted.path !== (path.endsWith("/") ? path : `${path}/`)) return false;
  arrival = null;
  return true;
}
