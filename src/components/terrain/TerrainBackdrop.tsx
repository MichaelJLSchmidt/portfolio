"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import meta from "@terrain/terrain.json";
import { terrainIdForPath } from "@/content/cards";
import { site } from "@/content/site";
import { asset } from "@/lib/asset";
import { whenIdle } from "@/lib/idle";
import { cancelPendingIntro, useMotionMode } from "@/lib/motion-mode";
import { deviceProfile, fieldConfig, posterMedia, type DeviceProfile } from "./field-settings";
import { fieldStore, useFieldStore } from "./field-store";
import styles from "./TerrainBackdrop.module.css";

type FieldComponent = ComponentType<{ profile: DeviceProfile; paused: boolean; calm: boolean; onReady: () => void }>;

// Dev-only tuning panel: the branch is removed from production builds.
const DevTuning =
  process.env.NODE_ENV === "development" ? dynamic(() => import("./DevTuning"), { ssr: false }) : () => null;

/** WebGL2 with a hardware GPU and a device that is not obviously constrained. */
function canRunField(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("field") === "force") return true;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return false;
    if ((nav.deviceMemory ?? 8) < 4) return false;
    if ((navigator.hardwareConcurrency ?? 8) < 4) return false;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|software/i.test(renderer);
  } catch {
    return false;
  }
}


// Posters at 100 m and 200 m, chosen by the same spacing rule as the field (see posterMedia).
const finePoster = meta.posters.find((p) => p.intervalM === 100) ?? meta.poster;
const coarsePoster = meta.posters.find((p) => p.intervalM === 200) ?? meta.poster;
const finePosterMedia = posterMedia(meta.heightmaps, finePoster.intervalM, fieldConfig);

/**
 * Fixed backdrop behind all content. First paint is the static contour poster (also the
 * still-mode and no-WebGL fallback); the WebGL field loads after the page is idle in full and
 * calm (where it holds still and only morphs) and takes over once its first frame is drawn.
 * Lives in the root layout: never remounts.
 */
export function TerrainBackdrop() {
  const { mode: motion } = useMotionMode();
  const still = motion === "still";
  const pathname = usePathname();
  const mode = useFieldStore((s) => s.mode);
  const introPlaying = useFieldStore((s) => s.introPlaying);
  const shownTerrain = useFieldStore((s) => s.shownTerrain);
  const [field, setField] = useState<{ Component: FieldComponent; profile: DeviceProfile } | null>(null);

  useEffect(() => {
    fieldStore.set({ morphTarget: terrainIdForPath(pathname) });
  }, [pathname]);

  useEffect(() => {
    // The hook reports still during hydration (server snapshot), so read the resolved attribute
    // before cancelling the intro; otherwise every first visit would lose it. The intro sweep
    // plays in full motion only.
    if (document.documentElement.getAttribute("data-motion") !== "full") cancelPendingIntro();
    if (still || field) return;
    let cancelled = false;
    whenIdle(() => {
      if (cancelled) return;
      // The motion lab's frames show the primitives alone (data-lab-frame): no field there.
      if (!canRunField() || document.querySelector("[data-lab-frame]")) {
        cancelPendingIntro();
        return;
      }
      import("./ContourField").then((m) => {
        if (!cancelled) setField({ Component: m.default, profile: deviceProfile() });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [still, field]);

  const showField = mode === "field" && !still;
  const focus = meta.region.focus;

  return (
    <>
      <div
        className={styles.backdrop}
        data-chrome=""
        data-field={showField ? "on" : "off"}
        data-terrain={showField ? (shownTerrain ?? "region") : undefined}
        aria-hidden="true"
      >
        <picture>
          <source media={finePosterMedia} srcSet={asset(finePoster.file)} />
          <img
            className={styles.poster}
            src={asset(coarsePoster.file)}
            alt=""
            width={coarsePoster.width}
            height={coarsePoster.height}
            decoding="async"
            style={{ objectPosition: `${focus.u * 100}% ${focus.v * 100}%` }}
          />
        </picture>
        {field && (
          <div className={styles.canvas}>
            <field.Component
              profile={field.profile}
              paused={still}
              calm={motion === "calm"}
              onReady={() => fieldStore.set({ mode: "field" })}
            />
          </div>
        )}
        <div className={styles.scrim} />
        <div className={styles.vignette} />
      </div>
      {introPlaying && showField && (
        <button
          type="button"
          className={`${styles.skip} hud-label`}
          onClick={() => fieldStore.set((s) => ({ skipIntro: s.skipIntro + 1 }))}
        >
          {site.hud.skipIntro}
        </button>
      )}
      <DevTuning />
    </>
  );
}
