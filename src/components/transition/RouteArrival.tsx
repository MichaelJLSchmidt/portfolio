"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * A route has committed: focus moves to the new page's H1 (tabindex -1, no ring), so screen
 * readers announce it, unless the page placed focus itself, or to the target of the URL's hash.
 * Mounted once in the root layout; renders nothing.
 */
export function RouteArrival() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    queueMicrotask(focusArrival);
  }, [pathname]);
  return null;
}

const visibleMain = () => [...document.querySelectorAll<HTMLElement>("main")].find((m) => m.getClientRects().length);

function focusArrival() {
  const main = visibleMain();
  if (!main) return;
  const active = document.activeElement;
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
