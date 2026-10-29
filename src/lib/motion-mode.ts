"use client";

import { useSyncExternalStore } from "react";
import { device } from "@/styles/tokens";
import { settledScript } from "./settled";

/**
 * Three motion modes, resolved before first paint and kept in sync (docs/motion.md):
 *
 * - full:  everything (the default);
 * - calm:  the "Calm map" switch: responses, title settles and view-transition morphs stay;
 *          ambient field motion, glints, pointer shine, tilt, loops and Lenis stop;
 * - still: the OS asks for reduced motion: no positional or width animation, no view transitions,
 *          opacity and colour changes of 200 ms or less only. Still always wins over the switch.
 *
 * The mode lives on <html data-motion="full|calm|still">, so CSS and JS agree; CSS also guards
 * still with @media (prefers-reduced-motion: reduce), which holds without JavaScript. The device
 * tier (data-tier: desktop, mobile, low) and vibration support (data-haptics) are resolved there
 * too, so controls that depend on them render right from first paint.
 */
export type MotionMode = "full" | "calm" | "still";
export type DeviceTier = "desktop" | "mobile" | "low";

export const CALM_STORAGE_KEY = "summit:calm-map";
export const HAPTICS_STORAGE_KEY = "summit:haptics";
export const INTRO_STORAGE_KEY = "summit:intro-played";
export const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const CHANGE_EVENT = "summit:motion-change";
const MODES: readonly MotionMode[] = ["full", "calm", "still"];

// Dev and preview builds only: ?motion=full|calm|still forces a mode for that page load (the
// motion lab's side-by-side frames, tests and recordings). The OS setting still wins.
const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";

// The tier rule matches the contour field's device profiles (field-settings.ts): a fine pointer
// and a long edge of at least device.desktopMinEdgePx (900 px) is "desktop"; constrained devices are "low".
const tierScript = `var n=navigator,t="mobile";try{if((n.connection&&n.connection.saveData)||(n.deviceMemory||8)<4||(n.hardwareConcurrency||8)<4)t="low";else if(!matchMedia("(pointer: coarse)").matches&&Math.max(innerWidth,innerHeight)>=${device.desktopMinEdgePx})t="desktop"}catch(e){}`;
const forcedScript = previewable
  ? `try{f=new URLSearchParams(location.search).get("motion");if(!/^(full|calm|still)$/.test(f||""))f=null}catch(e){}`
  : "";

/** Inline in <head>: sets the mode, tier and pending intro, and stops settled animations (settled.ts), before first paint. */
export const motionModeScript = `(function(){var d=document.documentElement,c=false,p=false,r=false,f=null;try{c=localStorage.getItem("${CALM_STORAGE_KEY}")==="1"}catch(e){}try{p=sessionStorage.getItem("${INTRO_STORAGE_KEY}")==="1"}catch(e){}try{r=matchMedia("${REDUCE_QUERY}").matches}catch(e){}${forcedScript}var m=r?"still":f||(c?"calm":"full");${tierScript}d.setAttribute("data-calm",c?"1":"0");d.setAttribute("data-motion",m);if(f)d.setAttribute("data-motion-forced",f);d.setAttribute("data-tier",t);try{if(typeof navigator.vibrate=="function"&&/Android/i.test(navigator.userAgent))d.setAttribute("data-haptics","")}catch(e){}d.setAttribute("data-intro",m!=="full"||p?"none":"pending");${settledScript}})()`;

const root = () => document.documentElement;

function readCalm(): boolean {
  try {
    return localStorage.getItem(CALM_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const osStill = () => window.matchMedia(REDUCE_QUERY).matches;
const forced = (): MotionMode | null => {
  const f = root().getAttribute("data-motion-forced") as MotionMode | null;
  return f && MODES.includes(f) ? f : null;
};

function resolve(calm: boolean): MotionMode {
  if (osStill()) return "still";
  return forced() ?? (calm ? "calm" : "full");
}

function apply(calm = readCalm()) {
  const el = root();
  el.setAttribute("data-calm", calm ? "1" : "0");
  el.setAttribute("data-motion", resolve(calm));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** The Calm map switch. Has no effect on the mode while the OS asks for reduced motion. */
export function setCalmMap(on: boolean) {
  try {
    if (on) localStorage.setItem(CALM_STORAGE_KEY, "1");
    else localStorage.removeItem(CALM_STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode, policies); the switch still works for this page view.
  }
  apply(on);
}

/** Haptics: "on" or "off" once the visitor chose; unset means the mode's default (on in full only). */
export function setHaptics(on: boolean) {
  try {
    localStorage.setItem(HAPTICS_STORAGE_KEY, on ? "on" : "off");
  } catch {
    hapticsFallback = on ? "on" : "off";
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

let hapticsFallback: "on" | "off" | null = null;
function readHaptics(): "on" | "off" | null {
  try {
    const v = localStorage.getItem(HAPTICS_STORAGE_KEY);
    return v === "on" || v === "off" ? v : hapticsFallback;
  } catch {
    return hapticsFallback;
  }
}

/** Vibration exists and does something: Android browsers only (desktop Chrome has a no-op). */
export function hapticsSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function" && /Android/i.test(navigator.userAgent);
}

/** Whether a haptic pulse may play now: supported, never in still, in calm only when switched on. */
export function hapticsOn(mode: MotionMode = currentMode()): boolean {
  if (!hapticsSupported() || mode === "still") return false;
  const pref = readHaptics();
  return pref ? pref === "on" : mode === "full";
}

/** Called when the intro will not play after all (no WebGL, low-spec device, not full motion). */
export function cancelPendingIntro() {
  root().setAttribute("data-intro", "none");
}

/** The resolved mode, read from <html> (the pre-paint script's result). Outside React too. */
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
    if (e.key === CALM_STORAGE_KEY) apply();
    else if (e.key === HAPTICS_STORAGE_KEY) cb();
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

const getCalm = () => root().getAttribute("data-calm") === "1";
const getOsStill = () => osStill();
const getHaptics = () => hapticsOn();
const getHapticsSupported = () => hapticsSupported();

/**
 * The motion mode for rendering. The server snapshot is "still", so server HTML and hydration
 * never start motion; the resolved mode follows right after hydration.
 */
export function useMotionMode() {
  const mode = useSyncExternalStore(subscribe, currentMode, () => "still" as MotionMode);
  const tier = useSyncExternalStore(subscribe, currentTier, () => "mobile" as DeviceTier);
  const calm = useSyncExternalStore(subscribe, getCalm, () => false);
  const forcedStill = useSyncExternalStore(subscribe, getOsStill, () => false);
  const haptics = useSyncExternalStore(subscribe, getHaptics, () => false);
  const hapticsAvailable = useSyncExternalStore(subscribe, getHapticsSupported, () => false);
  return {
    mode,
    tier,
    /** The visitor's Calm map choice (the mode may still be "still"). */
    calm,
    /** The OS asks for reduced motion: still, whatever the switch says. */
    forcedStill,
    haptics,
    hapticsAvailable,
    setCalm: setCalmMap,
    setHaptics,
  };
}
