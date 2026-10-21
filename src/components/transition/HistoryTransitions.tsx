"use client";

import { useEffect } from "react";

/**
 * Browser back/forward: React commits a popstate navigation synchronously and does not
 * animate it, so the card ⇄ case-study morph would only run for link clicks. This
 * listener runs before Next's (capture phase), holds the event back and replays it on
 * the next task, where React treats it as a regular transition and runs the same
 * <ViewTransition> morph in reverse. Skipped when the browser already animated the
 * gesture itself (e.g. swipe back).
 */
let replaying = false;

export function HistoryTransitions() {
  useEffect(() => {
    if (typeof document.startViewTransition !== "function") return;
    const onPopState = (event: PopStateEvent & { hasUAVisualTransition?: boolean }) => {
      if (replaying || event.hasUAVisualTransition) return;
      event.stopImmediatePropagation();
      const state = event.state;
      setTimeout(() => {
        replaying = true;
        try {
          window.dispatchEvent(new PopStateEvent("popstate", { state }));
        } finally {
          replaying = false;
        }
      }, 0);
    };
    window.addEventListener("popstate", onPopState, { capture: true });
    return () => window.removeEventListener("popstate", onPopState, { capture: true });
  }, []);

  return null;
}
