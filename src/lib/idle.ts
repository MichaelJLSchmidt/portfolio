"use client";

import { useSyncExternalStore } from "react";

/** Runs `cb` once the page has loaded and the main thread is idle. */
export function whenIdle(cb: () => void) {
  const run = () => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(cb, { timeout: 1500 });
    else setTimeout(cb, 200);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
}

let idle = false;
let scheduled = false;
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  if (!scheduled) {
    scheduled = true;
    whenIdle(() => {
      idle = true;
      listeners.forEach((fn) => fn());
    });
  }
  return () => {
    listeners.delete(l);
  };
}

/** False during SSR and first paint, true once the page is idle: gate for optional enhancements. */
export function useIdle(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => idle,
    () => false,
  );
}

const finePointerQuery = "(hover: hover) and (pointer: fine)";

export function useFinePointer(): boolean {
  return useSyncExternalStore(
    (l) => {
      const mq = window.matchMedia(finePointerQuery);
      mq.addEventListener("change", l);
      return () => mq.removeEventListener("change", l);
    },
    () => window.matchMedia(finePointerQuery).matches,
    () => false,
  );
}
