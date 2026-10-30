"use client";

import { useEffect } from "react";
import { playArrival } from "@/components/motion/reveal";
import { restMorphedTitles } from "@/components/type/titles";
import { fieldStore } from "@/components/terrain/field-store";
import { transitionKind } from "@/lib/view-transition";
import { duration } from "@/styles/tokens";

/**
 * A route has committed (the conductor's fieldStore.routeSeq, the same moment the field starts):
 * the new page arrives.
 *
 * - Its own arrival choreography, on a link navigation in full and calm (`main[data-arrival]`):
 *   the parts marked `data-arrive-at` play from that many milliseconds after the commit (reveal.ts),
 *   titles arrive on their weight (WeightTitle), except one a morph brought in (the morph is its
 *   arrival). Browser back and forward (a traversal), still mode
 *   and a browser that animated the gesture itself get none of it.
 * - Focus moves to the new page's H1 (tabindex -1), so screen readers announce it, unless the
 *   page placed focus itself (the deck focuses the card the reader came from), or to the target
 *   of the URL's hash.
 *
 * It runs in a microtask after the commit: Next has scrolled the new page by then, and the view
 * transition has not captured it yet. Mounted once in the root layout; renders nothing.
 */
export function RouteArrival() {
  useEffect(() => {
    let seq = fieldStore.get().routeSeq;
    return fieldStore.subscribe(() => {
      const next = fieldStore.get().routeSeq;
      if (next === seq) return;
      seq = next;
      const kind = transitionKind();
      queueMicrotask(() => arrive(kind));
    });
  }, []);
  return null;
}

const visibleMain = () => [...document.querySelectorAll<HTMLElement>("main")].find((m) => m.getClientRects().length);

function arrive(kind: ReturnType<typeof transitionKind>) {
  const main = visibleMain();
  if (!main) return;
  if (kind === "route" || kind === "return") {
    restMorphedTitles(main);
    main.setAttribute("data-arrival", "route");
    playArrival(main);
    window.setTimeout(() => main.removeAttribute("data-arrival"), duration.arrival + duration.settle);
  }
  focusArrival(main);
}

function focusArrival(main: HTMLElement) {
  const active = document.activeElement;
  // The page placed focus itself (the deck's origin card).
  if (active && active !== document.body && main.contains(active) && active.getClientRects().length) return;
  const hash = decodeURIComponent(window.location.hash.slice(1));
  const target = (hash && document.getElementById(hash)) || main.querySelector<HTMLElement>("h1");
  if (!target || !main.contains(target)) return;
  if (!target.matches("a[href], button, input, select, textarea, [tabindex]")) {
    target.setAttribute("tabindex", "-1");
    target.setAttribute("data-route-focus", "");
  }
  target.focus({ preventScroll: true });
}
