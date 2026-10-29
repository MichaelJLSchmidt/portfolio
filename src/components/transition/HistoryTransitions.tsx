"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/asset";
import { markTraversal, stillNavigation } from "@/lib/view-transition";
import { watchNavigationIntent } from "./return-transition";
import { transitionTo } from "./route-transition";

/**
 * Browser back/forward: React commits a popstate navigation synchronously and does not
 * animate it, so the card ⇄ case-study morph would only run for link clicks. This
 * listener runs before Next's (capture phase), holds the event back and replays it on
 * the next task, where React treats it as a regular transition and runs the same
 * <ViewTransition> morph in reverse, as a traversal: a 180 ms cross-fade plus the shared
 * elements, no arrival choreography and no glint (view-transition.ts). Skipped when the browser
 * already animated the gesture itself (e.g. swipe back), and in still mode, where navigation runs
 * without View Transitions. Between two case studies React animates nothing, so that replay runs
 * inside a view transition of its own (route-transition.ts).
 */
let replaying = false;

const caseStudy = (path: string) => (BASE_PATH && path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) : path).match(/^\/work\/([^/]+)\/?$/)?.[1];
const shownCaseStudy = () => [...document.querySelectorAll<HTMLElement>("main[data-card]")].find((m) => m.getClientRects().length)?.dataset.card;

export function HistoryTransitions() {
  // Where link clicks lead, for the return choreography (return-transition.ts).
  useEffect(() => watchNavigationIntent(), []);

  useEffect(() => {
    if (typeof document.startViewTransition !== "function") return;
    const onPopState = (event: PopStateEvent & { hasUAVisualTransition?: boolean }) => {
      if (replaying || event.hasUAVisualTransition || stillNavigation()) return;
      event.stopImmediatePropagation();
      const state = event.state;
      const from = shownCaseStudy();
      const to = caseStudy(window.location.pathname);
      const replay = () => {
        replaying = true;
        markTraversal();
        try {
          window.dispatchEvent(new PopStateEvent("popstate", { state }));
        } finally {
          replaying = false;
        }
      };
      setTimeout(() => {
        if (from && to && from !== to) {
          markTraversal();
          transitionTo(replay);
        } else replay();
      }, 0);
    };
    window.addEventListener("popstate", onPopState, { capture: true });
    return () => window.removeEventListener("popstate", onPopState, { capture: true });
  }, []);

  return null;
}
