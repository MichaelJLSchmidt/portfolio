"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { activeViewTransition } from "@/lib/view-transition";
import { duration } from "@/styles/tokens";

/** What started a page change; html[data-route-kind] while it runs (src/styles/transitions.css). */
export type RouteKind = "open" | "back" | "page" | "traverse" | "ua";

const KEY = "summit:scroll:";
const root = () => document.documentElement;
const save = (path: string) => {
  try {
    sessionStorage.setItem(KEY + path, String(Math.round(window.scrollY)));
  } catch {}
};
const saved = (path: string): number | null => {
  try {
    const v = sessionStorage.getItem(KEY + path);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
};

/** An in-app link this page change will follow (same origin, a new page, no modifier keys). */
function internalLink(e: MouseEvent): HTMLAnchorElement | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return null;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return null;
  return a;
}

/**
 * The page change's kind and the scroll memory. Mounted once in the root layout; renders nothing.
 *
 * - A click on a card (or the next case study's mini card) is "open": the art morphs into the
 *   header plate and the case study arrives in steps; "Back to case studies" (data-back) is
 *   "back"; any other in-app link is "page".
 * - Browser back and forward are "traverse" (a 240 ms crossfade, the art's morph a bonus), or "ua"
 *   when the browser already animated the swipe (iOS: hasUAVisualTransition), which skips ours.
 * - Each page's scroll position is kept in sessionStorage; "back" and "traverse" restore it before
 *   paint, so a card that was in view is in view again (and its art can morph back).
 */
export function RouteMotion() {
  const pathname = usePathname();
  const path = useRef(pathname);
  const kind = useRef<RouteKind | null>(null);

  useEffect(() => {
    const mark = (k: RouteKind) => {
      kind.current = k;
      root().setAttribute("data-route-kind", k);
    };
    const onClick = (e: MouseEvent) => {
      const a = internalLink(e);
      if (!a) return;
      save(path.current);
      mark(a.closest("article[data-slug]") ? "open" : a.hasAttribute("data-back") ? "back" : "page");
    };
    const onPop = (e: PopStateEvent) => mark((e as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition ? "ua" : "traverse");
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!kind.current) save(path.current);
      });
    };
    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", onPop);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // A page has committed: restore its scroll (back, traverse) before paint, then clear the kind
  // once the transition has finished.
  useLayoutEffect(() => {
    if (path.current === pathname) return;
    path.current = pathname;
    const k = kind.current;
    if (k === "back" || k === "traverse" || k === "ua") {
      const y = saved(pathname);
      if (y !== null) window.scrollTo({ top: y, behavior: "instant" });
    }
    const clear = () => {
      if (kind.current !== k) return;
      kind.current = null;
      root().removeAttribute("data-route-kind");
    };
    const t = activeViewTransition();
    if (t) t.finished.then(clear, clear);
    else window.setTimeout(clear, duration.terrain);
  }, [pathname]);

  return null;
}
