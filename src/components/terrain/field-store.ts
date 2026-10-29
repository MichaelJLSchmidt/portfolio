"use client";

import { useSyncExternalStore } from "react";
import { BASE_PATH } from "@/lib/asset";
import { fieldConfig, type FieldConfig, type FieldTier } from "./field-settings";
import { readoutFor, type Readout } from "./readout";
import { routeTerrain } from "./route-terrain";

/** Shared state between the route-aware backdrop, the lazy WebGL field and HUD controls. */
export type FieldState = {
  /** Terrain id the field should morph to (a card's terrain, "bern"), or null for the region. */
  morphTarget: string | null;
  /** Terrain ids worth preloading (card hover/focus). */
  prefetch: string[];
  /** "poster" until the WebGL field has painted its first frame (and again after a context loss). */
  mode: "poster" | "field";
  introPlaying: boolean;
  /** Incremented to ask the field to skip the intro. */
  skipIntro: number;
  /** Incremented by the dev panel to replay the intro. */
  replayIntro: number;
  /** Contour interval the field settled on for this screen (shown in the dev panel). */
  intervalM: number | null;
  /** Terrain the field is showing once a morph has landed (null = the region). */
  shownTerrain: string | null;
  /** The readout of the terrain the field is heading to (kept in step with morphTarget). */
  readout: Readout;
  /** Incremented on every route change, also when the terrain stays (the conductor holds the quiet zones). */
  routeSeq: number;
  /** The field's device tier once resolved (field-boot.ts); null before. */
  tier: FieldTier | null;
  config: FieldConfig;
};

// On the client the store starts on the current route's terrain, so a readout rendered during
// hydration matches the server's (which derives it from the route too).
const initialTarget =
  typeof window === "undefined" ? null : routeTerrain(window.location.pathname.slice(BASE_PATH.length) || "/");

let state: FieldState = {
  morphTarget: initialTarget,
  prefetch: [],
  mode: "poster",
  introPlaying: false,
  skipIntro: 0,
  replayIntro: 0,
  intervalM: null,
  shownTerrain: null,
  readout: readoutFor(initialTarget),
  routeSeq: 0,
  tier: null,
  config: fieldConfig,
};
const listeners = new Set<() => void>();

export const fieldStore = {
  get: () => state,
  set(patch: Partial<FieldState> | ((s: FieldState) => Partial<FieldState>)) {
    const next = typeof patch === "function" ? patch(state) : patch;
    if (next.morphTarget !== undefined && next.morphTarget !== state.morphTarget) next.readout = readoutFor(next.morphTarget);
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
