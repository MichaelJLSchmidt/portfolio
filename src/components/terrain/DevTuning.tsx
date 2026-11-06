"use client";

import { Leva, button, folder, useControls } from "leva";
import { useEffect } from "react";
import { fieldConfig } from "@/field";

/**
 * Dev-only leva panel for the contour field: changes apply live (window.__terrain.retune), and
 * "Save to config" writes them to src/config/contour-field.json through the tuning server started
 * by `npm run dev`. Never shipped: imported behind a NODE_ENV === "development" check.
 */
const TUNING_URL = "http://localhost:4319/contour-field";
type Config = typeof fieldConfig;

export default function DevTuning() {
  const v = useControls("Contour field", {
    lineAlpha: { value: fieldConfig.lineAlpha, min: 0, max: 1, step: 0.01 },
    indexAlpha: { value: fieldConfig.indexAlpha, min: 0, max: 1, step: 0.01 },
    lineWidthPx: { value: fieldConfig.lineWidthPx, min: 0.5, max: 3, step: 0.25 },
    indexLineWidthPx: { value: fieldConfig.indexLineWidthPx, min: 0.5, max: 4, step: 0.25 },
    zoom: { value: fieldConfig.zoom, min: 1, max: 1.3, step: 0.01 },
    Quiet: folder({
      quietStrength: { value: fieldConfig.quiet.strength, min: 0, max: 1, step: 0.05 },
      quietFeatherPx: { value: fieldConfig.quiet.featherPx, min: 0, max: 160, step: 4 },
    }),
    Ambient: folder({
      driftPx: { value: fieldConfig.ambient.driftPx, min: 0, max: 60, step: 1 },
      breath: { value: fieldConfig.ambient.breath, min: 0, max: 0.5, step: 0.01 },
    }),
    Pointer: folder({
      radiusPx: { value: fieldConfig.bump.radiusPx, min: 60, max: 400, step: 10 },
      maxPx: { value: fieldConfig.bump.maxPx, min: 0, max: 6, step: 0.5 },
      rest: { value: fieldConfig.bump.rest, min: 0, max: 1, step: 0.05 },
    }),
  });

  const config = (): Config => ({
    ...fieldConfig,
    lineAlpha: v.lineAlpha,
    indexAlpha: v.indexAlpha,
    lineWidthPx: v.lineWidthPx,
    indexLineWidthPx: v.indexLineWidthPx,
    zoom: v.zoom,
    quiet: { strength: v.quietStrength, featherPx: v.quietFeatherPx },
    ambient: { ...fieldConfig.ambient, driftPx: v.driftPx, breath: v.breath },
    bump: { ...fieldConfig.bump, radiusPx: v.radiusPx, maxPx: v.maxPx, rest: v.rest },
  });

  useControls("Contour field", {
    "Save to config": button(async () => {
      const body = JSON.stringify(config(), null, 2);
      try {
        const res = await fetch(TUNING_URL, { method: "POST", headers: { "content-type": "application/json" }, body });
        if (!res.ok) throw new Error(String(res.status));
        console.info("[tuning] saved src/config/contour-field.json");
      } catch {
        await navigator.clipboard?.writeText(body);
        console.warn("[tuning] tuning server not reachable (run `npm run dev`); JSON copied to the clipboard instead.");
      }
    }),
  });

  useEffect(() => {
    (window as Window & { __terrain?: { retune?: (c: Config) => void } }).__terrain?.retune?.(config());
    // config() reads the controls' current values only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  return <Leva collapsed titleBar={{ title: "Tuning (dev only)" }} />;
}
