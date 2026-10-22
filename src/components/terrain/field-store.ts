"use client";

import { useSyncExternalStore } from "react";
import { fieldConfig, type FieldConfig } from "./field-settings";

/** Shared state between the route-aware backdrop, the lazy WebGL field and HUD controls. */
export type FieldState = {
  /** Terrain id the field should morph to (a card's terrain), or null for the region. */
  morphTarget: string | null;
  /** Terrain ids worth preloading (card hover/focus). */
  prefetch: string[];
  /** "poster" until the WebGL field has painted its first frame. */
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
  config: FieldConfig;
};

let state: FieldState = {
  morphTarget: null,
  prefetch: [],
  mode: "poster",
  introPlaying: false,
  skipIntro: 0,
  replayIntro: 0,
  intervalM: null,
  shownTerrain: null,
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
