"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { duration } from "@/styles/tokens";
import { calmNavigation } from "@/lib/view-transition";

/**
 * Calm map / reduced motion: routes change without a View Transition, and the incoming page
 * fades in over --dur-calm (opacity only, see globals.css). The attribute is set in a layout
 * effect, before the new page is painted.
 */
export function CalmRouteFade() {
  const pathname = usePathname();
  const shown = useRef(pathname);

  useLayoutEffect(() => {
    // Route changes only (not the first render, nor a dev re-run of this effect).
    if (shown.current === pathname) return;
    shown.current = pathname;
    if (!calmNavigation()) return;
    const root = document.documentElement;
    // Restart the fade for back-to-back navigations.
    root.removeAttribute("data-route-fade");
    void root.offsetWidth;
    root.setAttribute("data-route-fade", "");
    const done = setTimeout(() => root.removeAttribute("data-route-fade"), duration.calm + 50);
    return () => clearTimeout(done);
  }, [pathname]);

  return null;
}
