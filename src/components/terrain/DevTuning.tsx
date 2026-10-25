"use client";

import { Leva, button, folder, monitor, useControls } from "leva";
import { useEffect } from "react";
import { duration } from "@/styles/tokens";
import { LINE_COLORS, fieldConfig, type FieldConfig } from "./field-settings";
import { fieldStore } from "./field-store";

/**
 * Dev-only leva panel for the contour field. "Save to config" writes the current values
 * to src/config/contour-field.json through the tuning server started by `npm run dev`.
 * Never shipped: imported behind a NODE_ENV === "development" check.
 */
const TUNING_URL = "http://localhost:4319/contour-field";
const durationTokens = Object.keys(duration);

export default function DevTuning() {
  const values = useControls("Contour field", {
    // Contour interval: the smallest of 50/100/200/250/500 m that keeps lines on the
    // steepest terrain (gradient percentile) at least minSpacingPx apart on this screen.
    minSpacingPx: { value: fieldConfig.minSpacingPx, min: 1, max: 12, step: 0.25 },
    steepPercentile: { value: fieldConfig.steepPercentile, options: [50, 90, 95, 99] },
    indexEvery: { value: fieldConfig.indexEvery, min: 2, max: 10, step: 1 },
    lineWidthPx: { value: fieldConfig.lineWidthPx, min: 0.5, max: 4, step: 0.25 },
    indexLineWidthPx: { value: fieldConfig.indexLineWidthPx, min: 0.5, max: 5, step: 0.25 },
    // Line strengths per device profile (fieldConfig.desktop / fieldConfig.mobile).
    "Line strength": folder({
      desktopLineOpacity: { value: fieldConfig.desktop.lineOpacity, min: 0, max: 1, step: 0.01, label: "desktop lines" },
      desktopIndexOpacity: { value: fieldConfig.desktop.indexOpacity, min: 0, max: 1, step: 0.01, label: "desktop index" },
      mobileLineOpacity: { value: fieldConfig.mobile.lineOpacity, min: 0, max: 1, step: 0.01, label: "mobile lines" },
      mobileIndexOpacity: { value: fieldConfig.mobile.indexOpacity, min: 0, max: 1, step: 0.01, label: "mobile index" },
    }),
    lineColor: { value: fieldConfig.lineColor, options: LINE_COLORS },
    indexColor: { value: fieldConfig.indexColor, options: LINE_COLORS },
    headlampRadiusPx: { value: fieldConfig.headlampRadiusPx, min: 40, max: 400, step: 10 },
    headlampFadeMs: { value: fieldConfig.headlampFadeMs, min: 0, max: 2000, step: 20 },
    // Lit lines keep their colour and reach this many times their strength.
    headlampGain: { value: fieldConfig.headlampGain, min: 1, max: 3, step: 0.05 },
    sweepGain: { value: fieldConfig.sweepGain, min: 1, max: 3, step: 0.05 },
    parallax: { value: fieldConfig.parallax, min: 0, max: 0.08, step: 0.002 },
    scrollParallax: { value: fieldConfig.scrollParallax, min: 0, max: 0.2, step: 0.005 },
    driftCyclesPerSecond: { value: fieldConfig.driftCyclesPerSecond, min: 0, max: 0.2, step: 0.005 },
    // Quiet zones behind text: line strength inside, feather outside (CSS px).
    quietStrength: { value: fieldConfig.quietStrength, min: 0, max: 1, step: 0.05 },
    quietFeatherPx: { value: fieldConfig.quietFeatherPx, min: 0, max: 160, step: 4 },
    bodyQuietStrength: { value: fieldConfig.bodyQuietStrength, min: 0, max: 1, step: 0.01 },
    bodyQuietFeatherPx: { value: fieldConfig.bodyQuietFeatherPx, min: 0, max: 160, step: 4 },
    zoomBase: { value: fieldConfig.zoomBase, min: 1, max: 1.3, step: 0.01 },
    morphZoom: { value: fieldConfig.morphZoom, min: 0, max: 0.5, step: 0.01 },
    intro: { value: fieldConfig.intro, options: durationTokens },
    morph: { value: fieldConfig.morph, options: durationTokens },
    frameBudgetMs: { value: fieldConfig.frameBudgetMs, min: 12, max: 40, step: 1 },
    dormantAfterMs: { value: fieldConfig.dormantAfterMs, min: 5000, max: 300000, step: 5000 },
  });

  useControls("Contour field", {
    "Interval (m)": monitor(() => fieldStore.get().intervalM ?? 0, { interval: 250 }),
    "Replay intro": button(() => fieldStore.set((s) => ({ replayIntro: s.replayIntro + 1 }))),
    "Toggle morph (kiBon)": button(() =>
      fieldStore.set((s) => ({ morphTarget: s.morphTarget ? null : "dvb-001" })),
    ),
    "Save to config": button(async () => {
      const body = JSON.stringify(fieldStore.get().config, null, 2);
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
    const { desktopLineOpacity, desktopIndexOpacity, mobileLineOpacity, mobileIndexOpacity, ...rest } = values;
    const cfg = fieldStore.get().config;
    const next: FieldConfig = {
      ...cfg,
      ...rest,
      desktop: { ...cfg.desktop, lineOpacity: desktopLineOpacity, indexOpacity: desktopIndexOpacity },
      mobile: { ...cfg.mobile, lineOpacity: mobileLineOpacity, indexOpacity: mobileIndexOpacity },
    };
    fieldStore.set({ config: next });
  }, [values]);

  return <Leva collapsed titleBar={{ title: "Tuning (dev only)" }} />;
}
