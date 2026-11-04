import config from "@/config/contour-field.json";
import fieldMeta from "@terrain/field/field.json";
// Flagged examples' summits; live builds swap this for an empty file (next.config.ts).
import exampleMeta from "@terrain/field/examples.json";
import { asset } from "@/lib/asset";
import { color, duration } from "@/styles/tokens";
import { createField, type Field, type FieldMotion, type FieldOptions, type HeightmapSource } from "./core";
import { watchQuietZones } from "./quiet-zones";

/**
 * The site's contour field: the shared WebGL2 core (core.ts) with the site's tuning
 * (src/config/contour-field.json), the terrains (public/terrain/field/field.json, written by
 * npm run terrain), the motion tier and the inputs it listens to: a fine pointer, the quiet zones
 * behind text, the tab's visibility and open dialogs. Loaded lazily by TerrainBackdrop once the
 * page is idle, so none of it is in a route's initial JavaScript.
 */
export type Tier = "desktop" | "mobile";
export type MotionTier = "full" | "calm" | "still";

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export const fieldConfig = config;

export function fieldOptions(tier: Tier, cfg = config): FieldOptions {
  const t = cfg[tier];
  return {
    ground: hex(color.ground),
    lineColor: hex(color[cfg.lineColor as keyof typeof color] ?? color.fieldLine),
    lineAlpha: cfg.lineAlpha,
    indexAlpha: cfg.indexAlpha,
    lineWidthPx: cfg.lineWidthPx,
    indexWidthPx: cfg.indexLineWidthPx,
    indexEvery: cfg.indexEvery,
    minSpacingPx: t.minSpacingPx,
    zoom: cfg.zoom,
    dprMax: t.dprMax,
    quiet: cfg.quiet,
    ambient: {
      driftPx: cfg.ambient.driftPx,
      driftPeriodsS: cfg.ambient.driftPeriodsS as [number, number],
      breath: cfg.ambient.breath,
      breathPeriodS: cfg.ambient.breathPeriodS,
    },
    bump: { ...cfg.bump },
    // Dim 0–400 ms, then crossfade and undim until the terrain token's 1600 ms.
    route: { dimTo: cfg.route.dimTo, dimMs: cfg.route.dimMs, fadeMs: duration.terrain - cfg.route.dimMs },
    idleFps: cfg.idleFps,
  };
}

/**
 * What the field does in a tier, on a device: Full (drift, breath, the bump on fine pointers),
 * Calm (half drift, no breath, the bump at half), touch (half drift, a slower breath, no bump).
 */
export function fieldMotion(mode: MotionTier, finePointer: boolean, cfg = config): FieldMotion {
  const touch = !finePointer;
  const half = cfg.bump.calmMaxPx / cfg.bump.maxPx;
  if (mode === "still") return { drift: 0, breath: 0, breathPeriodS: cfg.ambient.breathPeriodS, bump: 0 };
  if (mode === "calm") return { drift: 0.5, breath: 0, breathPeriodS: cfg.ambient.breathPeriodS, bump: touch ? 0 : half };
  return { drift: touch ? 0.5 : 1, breath: 1, breathPeriodS: touch ? cfg.ambient.touchBreathPeriodS : cfg.ambient.breathPeriodS, bump: touch ? 0 : 1 };
}

type Meta = (typeof fieldMeta.terrains)[keyof typeof fieldMeta.terrains];
const terrains = { ...(exampleMeta.terrains as Record<string, Meta>), ...(fieldMeta.terrains as Record<string, Meta>) };

/** A terrain id ("region", "bern", a summit) → the core's heightmap source. */
export function terrainSource(id: string | null): HeightmapSource | null {
  const m = terrains[id ?? "region"];
  if (!m) return null;
  return {
    image: asset(m.file),
    raw: asset(m.raw),
    width: m.width,
    height: m.height,
    offset: m.encoding.offset,
    scale: m.encoding.scale,
    probe: m.probe,
    sha: m.sha256,
    steepM: m.gradientM.p95,
    intervals: m.intervalsM,
    focus: m.focus,
  };
}

export type SiteField = {
  route(id: string | null): void;
  setMode(mode: MotionTier): void;
  /** New tuning (the dev panel). */
  retune(cfg: typeof config): void;
  destroy(): void;
  field: Field;
};

/** Mounts the field on a canvas; null without WebGL2. */
export function mountField(
  canvas: HTMLCanvasElement,
  { tier, mode, terrain }: { tier: Tier; mode: MotionTier; terrain: string | null },
  hooks: { onFirstFrame: () => void; onLost: () => void },
): SiteField | null {
  const field = createField(canvas, fieldOptions(tier), hooks);
  if (!field) return null;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  let current = mode;
  const apply = () => field.setMotion(fieldMotion(current, fine.matches));
  apply();

  // Pause: Off, a hidden tab, an open dialog (the lightbox) or a canvas off-screen.
  const reasons = new Set<string>();
  const pause = (why: string, on: boolean) => {
    if (on) reasons.add(why);
    else reasons.delete(why);
    field.setPaused(reasons.size > 0);
  };
  pause("still", mode === "still");
  const onVisibility = () => pause("hidden", document.hidden);
  document.addEventListener("visibilitychange", onVisibility);
  const dialogs = new MutationObserver(() => pause("dialog", !!document.querySelector("dialog[open]")));
  dialogs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
  const seen = new IntersectionObserver(([e]) => pause("offscreen", !e.isIntersecting));
  seen.observe(canvas);

  // The pointer: fine pointers only (a mouse or a pen), never touch.
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    field.pointer(e.clientX, e.clientY);
  };
  const onLeave = (e: PointerEvent | MouseEvent) => {
    if (!e.relatedTarget) field.pointer(null, null);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerout", onLeave, { passive: true });
  fine.addEventListener("change", apply);

  const stopQuiet = watchQuietZones((rects) => field.setQuietZones(rects));
  const onResize = () => field.resize();
  window.addEventListener("resize", onResize);

  const show = (id: string | null) => {
    const src = terrainSource(id) ?? terrainSource(null);
    if (src) field.show(src).catch(() => hooks.onLost());
  };
  show(terrain);

  return {
    field,
    route: show,
    retune: (cfg) => field.retune(fieldOptions(tier, cfg)),
    setMode(next) {
      current = next;
      pause("still", next === "still");
      apply();
    },
    destroy() {
      document.removeEventListener("visibilitychange", onVisibility);
      dialogs.disconnect();
      seen.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
      fine.removeEventListener("change", apply);
      window.removeEventListener("resize", onResize);
      stopQuiet();
      field.destroy();
    },
  };
}
