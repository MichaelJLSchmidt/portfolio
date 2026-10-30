"use client";

import { useEffect } from "react";

/**
 * The lab's readiness signal for tests and recordings: `html[data-lab-ready]` once the page has
 * hydrated (and, on /lab/, once all three specimen frames have). Playwright's "networkidle" is
 * unreliable with three iframes, so scripts wait for this attribute instead.
 */
export const LAB_READY = "data-lab-ready";

export function markLabReady() {
  document.documentElement.setAttribute(LAB_READY, "");
}

/** Marks the page ready after hydration; inside a lab frame, tells the parent page too. */
export function useLabReady() {
  useEffect(() => {
    markLabReady();
    if (window.parent !== window) window.parent.postMessage({ lab: "ready" }, window.location.origin);
  }, []);
}
