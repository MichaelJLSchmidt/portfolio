"use client";

import { useSyncExternalStore } from "react";
import { BASE_PATH } from "@/lib/asset";
import { fieldConfig, type FieldConfig, type FieldTier } from "./field-settings";
import { routeTerrain } from "./route-terrain";

/** Shared state between the route-aware backdrop and the lazy WebGL field. */
export type FieldState = {
  /** Terrain id the field should morph to (a card's terrain, "bern"), or null for the region. */
  morphTarget: string | null;
  /** Terrain ids worth preloading (card hover/focus). */
  prefetch: string[];
  /** "poster" until the WebGL field has painted its first frame (and again after a context loss). */
  mode: "poster" | "field";
  /** Contour interval the field settled on for this screen (shown in the dev panel). */
  intervalM: number | null;
  /** Terrain the field is showing once a morph has landed (null = the region). */
  shownTerrain: string | null;
  /** Incremented on every route change, also when the terrain stays (the conductor holds the quiet zones). */
  routeSeq: number;
  /** The field's device tier once resolved (field-boot.ts); null before. */
  tier: FieldTier | null;
  config: FieldConfig;
};

// On the client the store starts on the current route's terrain.
const initialTarget =
  typeof window === "undefined" ? null : routeTerrain(window.location.pathname.slice(BASE_PATH.length) || "/");

let state: FieldState = {
  morphTarget: initialTarget,
  prefetch: [],
  mode: "poster",
  intervalM: null,
  shownTerrain: null,
  routeSeq: 0,
  tier: null,
  config: fieldConfig,
};
const listeners = new Set<() => void>();

export const fieldStore = {
  get: () => state,
  set(patch: Partial<FieldState> | ((s: FieldState) => Partial<FieldState>)) {
    const next = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useFieldStore<T>(selector: (s: FieldState) => T): T {
  return useSyncExternalStore(
    fieldStore.subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function prefetchTerrain(id: string) {
  if (!state.prefetch.includes(id)) fieldStore.set({ prefetch: [...state.prefetch, id] });
}
