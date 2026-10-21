"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import meta from "@terrain/terrain.json";
import { terrainIdForPath } from "@/content/cards";
import { site } from "@/content/site";
import { asset } from "@/lib/asset";
import { whenIdle } from "@/lib/idle";
import { cancelPendingIntro, useReducedMotion } from "@/lib/motion-preference";
import { deviceProfile, type DeviceProfile } from "./field-settings";
import { fieldStore, useFieldStore } from "./field-store";
import styles from "./TerrainBackdrop.module.css";

type FieldComponent = ComponentType<{ profile: DeviceProfile; paused: boolean; onReady: () => void }>;

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


/**
 * Fixed backdrop behind all content. First paint is the static contour poster (also the
 * reduced-motion and no-WebGL fallback); the WebGL field loads after the page is idle
 * and takes over once its first frame is drawn. Lives in the root layout: never remounts.
 */
export function TerrainBackdrop() {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const mode = useFieldStore((s) => s.mode);
  const introPlaying = useFieldStore((s) => s.introPlaying);
  const [field, setField] = useState<{ Component: FieldComponent; profile: DeviceProfile } | null>(null);

  useEffect(() => {
    fieldStore.set({ morphTarget: terrainIdForPath(pathname) });
  }, [pathname]);

  useEffect(() => {
    // `reduced` is true during hydration (server snapshot), so read the resolved attribute
    // before cancelling the intro; otherwise every first visit would lose it.
    if (document.documentElement.getAttribute("data-motion") === "reduced") cancelPendingIntro();
    if (reduced || field) return;
    let cancelled = false;
    whenIdle(() => {
      if (cancelled) return;
      if (!canRunField()) {
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
  }, [reduced, field]);

  const showField = mode === "field" && !reduced;
  const focus = meta.region.focus;

  return (
    <>
      <div className={styles.backdrop} data-field={showField ? "on" : "off"} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG poster, no optimisation needed */}
        <img
          className={styles.poster}
          src={asset(meta.poster.file)}
          alt=""
          width={meta.poster.width}
          height={meta.poster.height}
          decoding="async"
          style={{ objectPosition: `${focus.u * 100}% ${focus.v * 100}%` }}
        />
        {field && (
          <div className={styles.canvas}>
            <field.Component
              profile={field.profile}
              paused={reduced}
              onReady={() => fieldStore.set({ mode: "field" })}
            />
          </div>
        )}
        <div className={styles.scrim} />
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
