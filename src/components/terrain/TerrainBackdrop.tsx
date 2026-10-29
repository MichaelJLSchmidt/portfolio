"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import meta from "@terrain/terrain.json";
import bern from "@terrain/bern/posters.json";
import { site } from "@/content/site";
import { asset } from "@/lib/asset";
import { haptic } from "@/lib/haptics";
import { whenIdle } from "@/lib/idle";
import { cancelPendingIntro, useMotionMode } from "@/lib/motion-mode";
import { fieldConfig, posterMedia, type DeviceProfile } from "./field-settings";
import { fieldStore, useFieldStore } from "./field-store";
import { BERN, routeTerrain } from "./route-terrain";
import styles from "./TerrainBackdrop.module.css";

type FieldComponent = ComponentType<{
  profile: DeviceProfile;
  paused: boolean;
  calm: boolean;
  onReady: () => void;
  onContextLost: (final: boolean) => void;
}>;

// The motion lab's frames (data-lab-frame) show the primitives alone, without the field. Only
// builds with the lab carry the check.
const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";
const labFrame = () => previewable && !!document.querySelector("[data-lab-frame]");

// Dev-only tuning panel: the branch is removed from production builds.
const DevTuning =
  process.env.NODE_ENV === "development" ? dynamic(() => import("./DevTuning"), { ssr: false }) : () => null;

// Posters at 100 m and 200 m, chosen by the same spacing rule as the field (see posterMedia);
// Basecamp's at 10 m and 20 m, with the Aare and the zero-point pin.
const finePoster = meta.posters.find((p) => p.intervalM === 100) ?? meta.poster;
const coarsePoster = meta.posters.find((p) => p.intervalM === 200) ?? meta.poster;
const finePosterMedia = posterMedia(meta.heightmaps, finePoster.intervalM, fieldConfig);
const [bernFine, bernCoarse] = [bern.posters[0], bern.posters[bern.posters.length - 1]];
const bernFineMedia = posterMedia(bern.heightmaps, bernFine.intervalM, fieldConfig);

/**
 * Fixed backdrop behind all content. First paint is the static contour poster of the route's
 * terrain (also the still-mode, tier C and no-WebGL fallback, cross-fading in 200 ms on route
 * changes); the WebGL field loads after the page is idle in full and calm (where it holds still
 * and only morphs) and takes over once its first frame is drawn. On a lost WebGL context the
 * poster is back at once. Lives in the root layout: never remounts.
 */
export function TerrainBackdrop() {
  const { mode: motion } = useMotionMode();
  const still = motion === "still";
  const pathname = usePathname();
  const routeId = routeTerrain(pathname);
  const mode = useFieldStore((s) => s.mode);
  const introPlaying = useFieldStore((s) => s.introPlaying);
  const shownTerrain = useFieldStore((s) => s.shownTerrain);
  const tier = useFieldStore((s) => s.tier);
  const [field, setField] = useState<{ Component: FieldComponent; profile: DeviceProfile } | null>(null);
  const [lost, setLost] = useState(false);
  // Basecamp's poster loads once a route needs it, and stays for the cross-fade back.
  const [bernSeen, setBernSeen] = useState(routeId === BERN);
  if (routeId === BERN && !bernSeen) setBernSeen(true);
  const shownPath = useRef(pathname);

  // The route commits: the conductor starts now, alongside the View Transition (layout effects
  // run inside its update), never holding it.
  useLayoutEffect(() => {
    const changed = shownPath.current !== pathname;
    shownPath.current = pathname;
    fieldStore.set((s) => ({ morphTarget: routeId, routeSeq: s.routeSeq + (changed ? 1 : 0) }));
  }, [pathname, routeId]);

  useEffect(() => {
    // The hook reports still during hydration (server snapshot), so read the resolved attribute
    // before cancelling the intro; otherwise every first visit would lose it. The intro sweep
    // plays in full motion only.
    if (document.documentElement.getAttribute("data-motion") !== "full") cancelPendingIntro();
    let cancelled = false;
    // Still mode is tier C on any device: posters, no WebGL at all (the canvas is not rendered;
    // the field mounts again after). The boot module still keeps the store's readout in step.
    if (still) {
      fieldStore.set({ mode: "poster", tier: "low" });
      whenIdle(() => {
        if (!cancelled) import("./field-boot");
      });
      return () => {
        cancelled = true;
      };
    }
    if (field) {
      fieldStore.set({ tier: field.profile.tier });
      return;
    }
    whenIdle(() => {
      if (cancelled) return;
      // The motion lab's frames never show the field: they load nothing for it.
      if (labFrame()) {
        cancelPendingIntro();
        return;
      }
      import("./field-boot").then((boot) => {
        if (cancelled) return;
        const resolved = boot.resolveTier();
        fieldStore.set({ tier: resolved });
        if (resolved === "low") {
          cancelPendingIntro();
          return;
        }
        const profile = boot.profileFor(resolved);
        import("./ContourField").then((m) => {
          if (!cancelled) setField({ Component: m.default, profile });
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [still, field]);

  const showField = mode === "field" && !still && !!field;
  const focus = meta.region.focus;

  return (
    <>
      <div
        className={styles.backdrop}
        data-chrome=""
        data-field={lost ? "lost" : showField ? "on" : "off"}
        data-terrain={showField ? (shownTerrain ?? "region") : undefined}
        data-poster={routeId === BERN ? "bern" : "region"}
        data-field-tier={tier ?? undefined}
        aria-hidden="true"
      >
        <div className={styles.layer} data-layer="region">
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
        </div>
        <div className={styles.layer} data-layer="bern">
          {bernSeen && (
            <picture>
              <source media={bernFineMedia} srcSet={asset(bernFine.file)} />
              <img
                className={styles.poster}
                src={asset(bernCoarse.file)}
                alt=""
                width={bernCoarse.width}
                height={bernCoarse.height}
                decoding="async"
                style={{ objectPosition: `${bern.focus.u * 100}% ${bern.focus.v * 100}%` }}
              />
            </picture>
          )}
        </div>
        {field && !still && (
          <div className={styles.canvas}>
            <field.Component
              profile={field.profile}
              paused={still}
              calm={motion === "calm"}
              onReady={() => {
                setLost(false);
                fieldStore.set({ mode: "field" });
              }}
              onContextLost={(final) => {
                setLost(true);
                fieldStore.set({ mode: "poster", ...(final ? { tier: "low" as const } : {}) });
                if (final) setField(null);
              }}
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
          onClick={() => {
            haptic("press");
            fieldStore.set((s) => ({ skipIntro: s.skipIntro + 1 }));
          }}
        >
          {site.hud.skipIntro}
        </button>
      )}
      <DevTuning />
    </>
  );
}
