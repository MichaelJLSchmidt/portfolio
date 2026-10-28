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
