"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import fieldMeta from "@terrain/field/field.json";
import exampleMeta from "@terrain/field/examples.json";
import { asset } from "@/lib/asset";
import { whenIdle } from "@/lib/idle";
import { useMotionMode } from "@/lib/motion-mode";
import { resolveTier } from "./field-boot";
import { routeTerrain } from "./route-terrain";
import styles from "./TerrainBackdrop.module.css";

type SiteField = import("@/field").SiteField;

// The motion lab's frames (data-lab-frame) show the primitives alone, without the field.
const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";
const labFrame = () => previewable && !!document.querySelector("[data-lab-frame]");

// Dev-only tuning panel: the branch is removed from production builds.
const DevTuning = process.env.NODE_ENV === "development" ? dynamic(() => import("./DevTuning"), { ssr: false }) : () => null;

type Poster = { landscape: string; portrait: string; size: [number, number]; sizePortrait: [number, number]; focus: { u: number; v: number; uPortrait?: number } };
const posters: Record<string, Poster> = {
  ...((exampleMeta as unknown as { posters?: Record<string, Poster> }).posters ?? {}),
  ...((fieldMeta as unknown as { posters?: Record<string, Poster> }).posters ?? {}),
};
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
const terrainIds = Object.keys(posters);

/**
 * The fixed backdrop behind every page: the living survey. First paint is the poster of the
 * route's terrain (an AVIF of the field's first frame, so the field can fade in on an identical
 * frame); the WebGL field (src/field) loads once the page is idle and takes over after its first
 * frame. A page change crossfades the field to the next terrain (the field's own dim and
 * crossfade); without the field the posters crossfade. Off shows the poster only: nothing moves,
 * which is also the pause for WCAG 2.2.2. Lives in the root layout: never remounts.
 */
export function TerrainBackdrop() {
  const { mode } = useMotionMode();
  const still = mode === "still";
  const pathname = usePathname();
  const terrain = routeTerrain(pathname) ?? "region";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<SiteField | null>(null);
  const [state, setState] = useState<{ field: "off" | "on" | "lost"; tier: string | null }>({ field: "off", tier: null });
  // Posters a route has needed so far stay mounted for the crossfade back.
  const [seen, setSeen] = useState<string[]>([terrain]);
  if (!seen.includes(terrain)) setSeen([...seen, terrain]);

  // A route commits: the field starts its dim and crossfade inside the view transition's update.
  useLayoutEffect(() => {
    fieldRef.current?.route(terrain);
  }, [terrain]);

  useEffect(() => {
    fieldRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    if (still || fieldRef.current) return;
    let cancelled = false;
    whenIdle(async () => {
      if (cancelled || labFrame()) return;
      const tier = await resolveTier();
      if (cancelled) return;
      setState((s) => ({ ...s, tier }));
      if (tier === "low") return;
      import("@/field").then(({ mountField }) => {
        const canvas = canvasRef.current;
        if (cancelled || !canvas || fieldRef.current) return;
        try {
          const mounted = mountField(
            canvas,
            { tier, mode, terrain: routeTerrain(window.location.pathname) ?? "region" },
            {
              onFirstFrame: () => setState((s) => ({ ...s, field: "on" })),
              onLost: () => {
                fieldRef.current?.destroy();
                fieldRef.current = null;
                setState((s) => ({ ...s, field: "lost" }));
              },
            },
          );
          fieldRef.current = mounted;
          // Preview builds: the hook the e2e scenarios, the legibility check and the dev panel use.
          if (previewable && mounted) {
            (window as Window & { __terrain?: unknown }).__terrain = {
              route: mounted.route,
              retune: mounted.retune,
              // A page change pinned half-way (check:legibility's mid-morph pass).
              freeze: (id: string | null, progress: number) => {
                mounted.route(id);
                mounted.field.hold(progress);
                return true;
              },
              frames: () => mounted.field.frames(),
              state: () => mounted.field.state(),
              tier,
            };
          }
        } catch {
          setState((s) => ({ ...s, field: "lost" }));
        }
      });
    });
    return () => {
      cancelled = true;
    };
    // The field mounts once per visit; later tiers and routes reach it through its own methods.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);

  useEffect(() => () => fieldRef.current?.destroy(), []);

  const fieldOn = state.field === "on" && !still;
  return (
    <>
      <div
        className={styles.backdrop}
        data-chrome=""
        data-field={state.field === "lost" ? "lost" : fieldOn ? "on" : "off"}
        data-terrain={terrain}
        data-poster={terrain}
        data-field-tier={state.tier ?? undefined}
        aria-hidden="true"
      >
        {terrainIds
          .filter((id) => seen.includes(id) && posters[id])
          .map((id) => {
            const p = posters[id];
            // Framed like the field: cover, anchored on the terrain's focus.
            const position = { "--focus": `${pct(p.focus.u)} ${pct(p.focus.v)}`, "--focus-portrait": `${pct(p.focus.uPortrait ?? p.focus.u)} ${pct(p.focus.v)}` } as CSSProperties;
            return (
              <picture key={id} className={styles.layer} data-layer={id} data-shown={id === terrain || undefined} style={position}>
                <source media="(orientation: portrait)" srcSet={asset(p.portrait)} width={p.sizePortrait[0]} height={p.sizePortrait[1]} />
                <img className={styles.poster} src={asset(p.landscape)} alt="" width={p.size[0]} height={p.size[1]} decoding="async" fetchPriority={id === terrain ? "high" : "low"} />
              </picture>
            );
          })}
        {!still && <canvas ref={canvasRef} className={styles.canvas} data-field-canvas="" />}
      </div>
      <DevTuning />
    </>
  );
}
