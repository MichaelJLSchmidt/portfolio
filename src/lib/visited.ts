"use client";

import { useSyncExternalStore } from "react";

/**
 * Case studies the visitor has opened, remembered in localStorage: their cards show a small
 * "Visited" stamp, and screen readers hear "Visited". RememberCard marks a page on arrival.
 */
const KEY = "summit:visited";
const EVENT = "summit:visited-change";

function read(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function markVisited(slug: string) {
  const list = read();
  if (list.includes(slug)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...list, slug]));
  } catch {
    // Storage blocked: the stamp simply doesn't show.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Whether a case study has been visited; false on the server and during hydration. */
export function useVisited(slug: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => read().includes(slug),
    () => false,
  );
}
