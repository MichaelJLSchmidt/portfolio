"use client";

import { useSyncExternalStore } from "react";

/**
 * Reduced motion is on when the OS asks for it OR the visitor switched on "Calm map".
 * The resolved state lives on <html data-motion="reduced|full"> so CSS and JS agree,
 * and an inline script sets it before first paint (see `motionPreferenceScript`).
 */
export const CALM_STORAGE_KEY = "summit:calm-map";
const CHANGE_EVENT = "summit:motion-change";
const QUERY = "(prefers-reduced-motion: reduce)";

export const motionPreferenceScript = `(function(){var c=false;try{c=localStorage.getItem("${CALM_STORAGE_KEY}")==="1"}catch(e){}var r=false;try{r=matchMedia("${QUERY}").matches}catch(e){}var d=document.documentElement;d.setAttribute("data-calm",c?"1":"0");d.setAttribute("data-motion",c||r?"reduced":"full")})()`;

function readCalm(): boolean {
  try {
    return localStorage.getItem(CALM_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function apply() {
  const calm = readCalm();
  const reduced = calm || window.matchMedia(QUERY).matches;
  const root = document.documentElement;
  root.setAttribute("data-calm", calm ? "1" : "0");
  root.setAttribute("data-motion", reduced ? "reduced" : "full");
}

export function setCalmMap(on: boolean) {
  try {
    if (on) localStorage.setItem(CALM_STORAGE_KEY, "1");
    else localStorage.removeItem(CALM_STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode, policies); the toggle still works for this page view.
  }
  const root = document.documentElement;
  root.setAttribute("data-calm", on ? "1" : "0");
  root.setAttribute("data-motion", on || window.matchMedia(QUERY).matches ? "reduced" : "full");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  const onChange = () => {
    apply();
    cb();
  };
  mq.addEventListener("change", onChange);
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", onChange);
  };
}

const getReduced = () => document.documentElement.getAttribute("data-motion") === "reduced";
const getCalm = () => document.documentElement.getAttribute("data-calm") === "1";

/** True when motion should be reduced. Server snapshot is "reduced" so SSR never starts motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getReduced, () => true);
}

export function useCalmMap(): boolean {
  return useSyncExternalStore(subscribe, getCalm, () => false);
}
