import { haptics, type HapticEvent } from "@/styles/tokens";
import { hapticsOn } from "./motion-mode";

/**
 * A short vibration for a primary press (navigator.vibrate, Android browsers only): 8 ms. Plays
 * only while the page has transient user activation, at most one pulse per `haptics.minGapMs`, and
 * never in Off. No sound anywhere.
 */
let last = -Infinity;

export function haptic(event: HapticEvent = "press"): boolean {
  if (typeof navigator === "undefined" || !hapticsOn()) return false;
  // Direct user actions only: without transient activation the browser would block it anyway.
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
  if (activation && !activation.isActive) return false;
  const now = performance.now();
  if (now - last < haptics.minGapMs) return false;
  last = now;
  return navigator.vibrate(haptics.patterns[event]);
}
