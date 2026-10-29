import { haptics, type HapticEvent } from "@/styles/tokens";
import { hapticsOn } from "./motion-mode";

/**
 * A short vibration for a direct user action (navigator.vibrate, supporting Android browsers
 * only): press, open, commit, success, error or detent (patterns in the tokens). Plays only while
 * the page has transient user activation, at most one pulse per `haptics.minGapMs`, never in still
 * and in calm only when the visitor switched haptics on. No sound anywhere.
 */
let last = -Infinity;

export function haptic(event: HapticEvent): boolean {
  if (typeof navigator === "undefined" || !hapticsOn()) return false;
  // Direct user actions only: without transient activation the browser would block it anyway.
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
  if (activation && !activation.isActive) return false;
  const now = performance.now();
  if (now - last < haptics.minGapMs) return false;
  last = now;
  const pattern = haptics.patterns[event];
  return navigator.vibrate(typeof pattern === "number" ? pattern : [...pattern]);
}
