"use client";

import { useSyncExternalStore } from "react";
import { device } from "@/styles/tokens";

/**
 * Three motion tiers, resolved before first paint and kept in sync (docs/motion.md). The visitor
 * picks one with the footer's Motion control; the OS setting for reduced motion always wins.
 *
 * - full  ("Full"):  everything, at its own pace;
 * - calm  ("Calm"):  durations ×0.7, no stagger, no pointer effects but links, half the field's
 *                    drift, no breath;
 * - still ("Off"):   nothing moves: opacity crossfades of 160 ms at most, the static poster, no
 *                    haptics. Off pauses the background (WCAG 2.2.2).
 *
 * The tier lives on <html data-motion="full|calm|still">, so CSS and JS agree; CSS also guards
 * Off with @media (prefers-reduced-motion: reduce), which holds without JavaScript. The device
 * tier (data-tier: desktop, mobile, low) and vibration support (data-haptics) are resolved there
 * too, so controls that depend on them render right from first paint.
 */
export type MotionMode = "full" | "calm" | "still";
export type DeviceTier = "desktop" | "mobile" | "low";

export const MOTION_STORAGE_KEY = "summit:motion";
export const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const CHANGE_EVENT = "summit:motion-change";
export const MODES: readonly MotionMode[] = ["full", "calm", "still"];

// Dev and preview builds only: ?motion=full|calm|still forces a tier for that page load (the
// motion lab's side-by-side frames, tests and recordings). The OS setting still wins.
const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";

// The tier rule matches the contour field's device profiles: a fine pointer and a long edge of at
// least device.desktopMinEdgePx (900 px) is "desktop"; constrained devices are "low".
const tierScript = `var n=navigator,t="mobile";try{if((n.connection&&n.connection.saveData)||(n.deviceMemory||8)<4||(n.hardwareConcurrency||8)<4)t="low";else if(!matchMedia("(pointer: coarse)").matches&&Math.max(innerWidth,innerHeight)>=${device.desktopMinEdgePx})t="desktop"}catch(e){}`;
const forcedScript = previewable
  ? `try{f=new URLSearchParams(location.search).get("motion");if(!/^(full|calm|still)$/.test(f||""))f=null}catch(e){}`
  : "";

/** Inline in <head>: sets the tier before first paint. */
export const motionModeScript = `(function(){var d=document.documentElement,c=null,r=false,f=null;try{c=localStorage.getItem("${MOTION_STORAGE_KEY}")}catch(e){}if(!/^(full|calm|still)$/.test(c||""))c=null;try{r=matchMedia("${REDUCE_QUERY}").matches}catch(e){}${forcedScript}var m=r?"still":f||c||"full";${tierScript}d.setAttribute("data-motion",m);if(f)d.setAttribute("data-motion-forced",f);d.setAttribute("data-tier",t);try{if(typeof navigator.vibrate=="function"&&/Android/i.test(navigator.userAgent))d.setAttribute("data-haptics","")}catch(e){}})()`;

const root = () => document.documentElement;

/** The visitor's choice (null: none yet, which means Full unless the OS reduces motion). */
function readChoice(): MotionMode | null {
  try {
    const v = localStorage.getItem(MOTION_STORAGE_KEY) as MotionMode | null;
    return v && MODES.includes(v) ? v : null;
  } catch {
    return fallbackChoice;
  }
}
let fallbackChoice: MotionMode | null = null;

const osStill = () => window.matchMedia(REDUCE_QUERY).matches;
const forced = (): MotionMode | null => {
  const f = root().getAttribute("data-motion-forced") as MotionMode | null;
  return f && MODES.includes(f) ? f : null;
};

function resolve(choice: MotionMode | null): MotionMode {
  if (osStill()) return "still";
  return forced() ?? choice ?? "full";
}

function apply() {
  root().setAttribute("data-motion", resolve(readChoice()));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** The Motion control: stores the choice and applies it. No effect while the OS reduces motion. */
export function setMotionChoice(mode: MotionMode) {
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, mode);
  } catch {
    // Storage can be blocked (private mode, policies); the choice still holds for this page view.
    fallbackChoice = mode;
  }
  apply();
}

/** Vibration exists and does something: Android browsers only (desktop Chrome has a no-op). */
export function hapticsSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function" && /Android/i.test(navigator.userAgent);
}

/** Whether a haptic pulse may play now: supported, and not in Off. */
export function hapticsOn(mode: MotionMode = currentMode()): boolean {
  return hapticsSupported() && mode !== "still";
}

/** The resolved tier, read from <html> (the pre-paint script's result). Outside React too. */
export function currentMode(): MotionMode {
  if (typeof document === "undefined") return "still";
  const m = root().getAttribute("data-motion") as MotionMode | null;
  return m && MODES.includes(m) ? m : "still";
}

export function currentTier(): DeviceTier {
  if (typeof document === "undefined") return "mobile";
  const t = root().getAttribute("data-tier");
  return t === "desktop" || t === "low" ? t : "mobile";
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia(REDUCE_QUERY);
  const onSystem = () => apply();
  const onStorage = (e: StorageEvent) => {
    if (e.key === MOTION_STORAGE_KEY) apply();
  };
  mq.addEventListener("change", onSystem);
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    mq.removeEventListener("change", onSystem);
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

const getChoice = () => readChoice() ?? "full";
const getOsStill = () => osStill();

/**
 * The tier for rendering. The server snapshot is "still", so server HTML and hydration never start
 * motion; the resolved tier follows right after hydration.
 */
const stillMode = (): MotionMode => "still";
const noSubscribe = () => () => {};

/** Just the tier, and only while `enabled` (otherwise "still", with no subscription). */
export function useModeIf(enabled: boolean): MotionMode {
  return useSyncExternalStore(enabled ? subscribe : noSubscribe, enabled ? currentMode : stillMode, stillMode);
}

export function useMotionMode() {
  const mode = useSyncExternalStore(subscribe, currentMode, () => "still" as MotionMode);
  const tier = useSyncExternalStore(subscribe, currentTier, () => "mobile" as DeviceTier);
  const choice = useSyncExternalStore(subscribe, getChoice, () => "full" as MotionMode);
  const forcedStill = useSyncExternalStore(subscribe, getOsStill, () => false);
  return {
    mode,
    tier,
    /** The visitor's choice (the tier may still be "still" when the OS reduces motion). */
    choice,
    /** The OS asks for reduced motion: Off, whatever the control says. */
    forcedStill,
    setChoice: setMotionChoice,
  };
}
