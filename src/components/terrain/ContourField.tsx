"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import meta from "@terrain/terrain.json";
import { asset } from "@/lib/asset";
import { color, easing } from "@/styles/tokens";
import { coverTransform, createContourMaterial } from "./contour-material";
import { INTRO_STORAGE_KEY } from "@/lib/motion-preference";
import { colorOf, hexToRgb, msOf, type DeviceProfile, type FieldConfig } from "./field-settings";
import { fieldStore } from "./field-store";

/**
 * The persistent contour field. Mounted once from the root layout (lazy chunk with
 * Three/R3F), so it never remounts on route changes. Renders on demand: continuous
 * frames only while something animates, a low idle rate for the slow drift, nothing
 * while the tab is hidden or reduced motion is on.
 */

type TerrainSource = {
  file: string;
  width: number;
  height: number;
  offset: number;
  scale: number;
  min: number;
  max: number;
  posX: number;
  posY: number;
};

const regionSource = (profile: DeviceProfile): TerrainSource => {
  const hm = meta.heightmaps.find((h) => h.use === profile.heightmap) ?? meta.heightmaps[0];
  return {
    file: hm.file,
    width: hm.width,
    height: hm.height,
    offset: meta.encoding.offset,
    scale: meta.encoding.scale,
    min: meta.elevation.min,
    max: meta.elevation.max,
    posX: meta.region.focus.u,
    posY: meta.region.focus.v,
  };
};

const cardSource = (id: string): TerrainSource | null => {
  const card = (meta.cards as Record<string, (typeof meta.cards)[keyof typeof meta.cards]>)[id];
  if (!card) return null;
  const m = card.morph;
  return {
    file: m.file,
    width: m.width,
    height: m.height,
    offset: m.encoding.offset,
    scale: m.encoding.scale,
    min: m.elevation.min,
    max: m.elevation.max,
    posX: 0.5,
    posY: 0.5,
  };
};

const textureCache = new Map<string, Promise<THREE.Texture>>();

function loadHeightTexture(file: string): Promise<THREE.Texture> {
  const url = asset(file);
  let pending = textureCache.get(url);
  if (pending) return pending;
  pending = new Promise<THREE.Texture>((resolve, reject) => {
    const done = (image: ImageBitmap | HTMLImageElement) => {
      const tex = new THREE.Texture(image);
      // Raw data, not colour: no colour-space conversion, no flipping, no mipmaps.
      tex.colorSpace = THREE.NoColorSpace;
      tex.flipY = false;
      tex.premultiplyAlpha = false;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      resolve(tex);
    };
    if (typeof createImageBitmap === "function") {
      const loader = new THREE.ImageBitmapLoader();
      loader.setOptions({ imageOrientation: "from-image", premultiplyAlpha: "none", colorSpaceConversion: "none" });
      loader.load(url, done, undefined, reject);
    } else {
      new THREE.ImageLoader().load(url, done, undefined, reject);
    }
  });
  textureCache.set(url, pending);
  return pending;
}

const bezier = (p: readonly number[]) => {
  // Cubic-bezier easing (x→y) solved with a few Newton steps; fine for UI tweens.
  const [x1, y1, x2, y2] = p;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const fx = ((ax * t + bx) * t + cx) * t - x;
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= fx / d;
    }
    t = Math.min(Math.max(t, 0), 1);
    return ((ay * t + by) * t + cy) * t;
  };
};
const easeTrail = bezier(easing.trail);
const easeSummit = bezier(easing.summit);

type Tween = { from: number; to: number; start: number; dur: number; ease: (x: number) => number };
const tweenValue = (t: Tween | null, now: number, fallback: number) => {
  if (!t) return fallback;
  const p = t.dur <= 0 ? 1 : Math.min(Math.max((now - t.start) / t.dur, 0), 1);
  return t.from + (t.to - t.from) * t.ease(p);
};
const tweenDone = (t: Tween | null, now: number) => !t || now - t.start >= t.dur;

function Field({ profile, paused, onReady }: { profile: DeviceProfile; paused: boolean; onReady: () => void }) {
  const material = useMemo(() => createContourMaterial(), []);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const anim = useRef({
    sweep: null as Tween | null,
    sweepValue: 1,
    morph: null as Tween | null,
    morphValue: 0,
    lamp: null as Tween | null,
    lampValue: 0,
    lampPos: [-1e4, -1e4] as [number, number],
    lastInput: 0,
    region: null as TerrainSource | null,
    target: null as TerrainSource | null,
    targetId: null as string | null,
    ready: false,
    readyNotified: false,
    capped: false,
    frameTimes: [] as number[],
    lastFrame: 0,
    t0: performance.now(),
  });

  // --- configuration → uniforms --------------------------------------------------
  useEffect(() => {
    const apply = (cfg: FieldConfig) => {
      const u = material.uniforms;
      u.uInterval.value = cfg.intervalM;
      u.uIndexEvery.value = cfg.indexEvery;
      u.uLineOpacity.value = cfg.lineOpacity;
      u.uIndexOpacity.value = cfg.indexOpacity;
      u.uGround.value.set(...hexToRgb(color.ground));
      u.uLineColor.value.set(...hexToRgb(colorOf(cfg.lineColor)));
      u.uIndexColor.value.set(...hexToRgb(colorOf(cfg.indexColor)));
      u.uGlowColor.value.set(...hexToRgb(colorOf(cfg.glowColor)));
      u.uGlow.value = profile.glow ? cfg.glowStrength / 0.3 : 0;
      u.uDrift.value = cfg.driftCyclesPerSecond;
      invalidate();
    };
    apply(fieldStore.get().config);
    let last = fieldStore.get().config;
    return fieldStore.subscribe(() => {
      const cfg = fieldStore.get().config;
      if (cfg !== last) {
        last = cfg;
        apply(cfg);
      }
    });
  }, [material, profile, invalidate]);

  // Pixel-based uniforms depend on the device pixel ratio.
  useEffect(() => {
    const cfg = fieldStore.get().config;
    const u = material.uniforms;
    u.uLineWidth.value = cfg.lineWidthPx * dpr;
    u.uIndexWidth.value = cfg.indexLineWidthPx * dpr;
    u.uHeadlampRadius.value = cfg.headlampRadiusPx * dpr;
    u.uGlowWidth.value = cfg.glowWidthPx * dpr;
    const a = anim.current;
    if (a.region) coverTransform(u.uUvA.value, size.width, size.height, a.region.width, a.region.height, a.region.posX, a.region.posY);
    if (a.target) coverTransform(u.uUvB.value, size.width, size.height, a.target.width, a.target.height, a.target.posX, a.target.posY);
    invalidate();
  }, [material, dpr, size.width, size.height, invalidate]);

  // --- region heightmap + intro ---------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const region = regionSource(profile);
    loadHeightTexture(region.file).then((tex) => {
      if (cancelled) return;
      const a = anim.current;
      const u = material.uniforms;
      a.region = region;
      u.uHeightA.value = tex;
      u.uEncA.value.set(region.offset, region.scale);
      u.uRangeA.value.set(region.min, region.max);
      // Until a target is set, B mirrors A so the morph mix is a no-op.
      if (!a.target) {
        u.uHeightB.value = tex;
        u.uEncB.value.set(region.offset, region.scale);
        u.uRangeB.value.set(region.min, region.max);
      }
      coverTransform(u.uUvA.value, size.width, size.height, region.width, region.height, region.posX, region.posY);
      if (!a.target) u.uUvB.value.copy(u.uUvA.value);

      let played = false;
      try {
        played = sessionStorage.getItem(INTRO_STORAGE_KEY) === "1";
        sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
      } catch {
        // No storage: play the intro every page load rather than failing.
      }
      // The first frame shows an empty map; the sweep starts once the canvas has faded in.
      if (!played && !paused) startIntro(msOf("medium"));
      a.ready = true;
      wake();
    });
    return () => {
      cancelled = true;
    };
    // Region texture choice is fixed for the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startIntro = (delay = 0) => {
    const a = anim.current;
    const dur = msOf(fieldStore.get().config.intro);
    a.sweep = { from: 0, to: 1, start: performance.now() + delay, dur, ease: easeSummit };
    a.sweepValue = 0;
    fieldStore.set({ introPlaying: true });
  };

  const finishIntro = (fast: boolean) => {
    const a = anim.current;
    if (!a.sweep || tweenDone(a.sweep, performance.now())) return;
    const now = performance.now();
    a.sweep = { from: tweenValue(a.sweep, now, 1), to: 1, start: now, dur: fast ? msOf("short") : 0, ease: easeTrail };
    document.documentElement.setAttribute("data-intro", "none");
    wake();
  };

  // Skip by any input, or the visible Skip control (store counter).
  useEffect(() => {
    const skip = () => finishIntro(true);
    const opts = { passive: true } as const;
    window.addEventListener("wheel", skip, opts);
    window.addEventListener("scroll", skip, opts);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip, opts);
    let lastSkip = fieldStore.get().skipIntro;
    let lastReplay = fieldStore.get().replayIntro;
    const unsub = fieldStore.subscribe(() => {
      const s = fieldStore.get();
      if (s.skipIntro !== lastSkip) {
        lastSkip = s.skipIntro;
        skip();
      }
      if (s.replayIntro !== lastReplay) {
        lastReplay = s.replayIntro;
        startIntro();
        wake();
      }
    });
    return () => {
      window.removeEventListener("wheel", skip);
      window.removeEventListener("scroll", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- morph to a card's terrain ---------------------------------------------------
  useEffect(() => {
    let token = 0;
    const morphTo = async (id: string | null) => {
      const my = ++token;
      const a = anim.current;
      const u = material.uniforms;
      const dur = msOf(fieldStore.get().config.morph);
      const now = () => performance.now();
      if (a.targetId === id) return;
      // Leaving one target for another: settle back to the region first.
      if (a.targetId && id) {
        a.morph = { from: tweenValue(a.morph, now(), a.morphValue), to: 0, start: now(), dur: dur / 2, ease: easeSummit };
        wake();
        await new Promise((r) => setTimeout(r, dur / 2));
        if (my !== token) return;
      }
      if (!id) {
        a.targetId = null;
        a.morph = { from: tweenValue(a.morph, now(), a.morphValue), to: 0, start: now(), dur, ease: easeSummit };
        wake();
        return;
      }
      const src = cardSource(id);
      if (!src) return;
      const tex = await loadHeightTexture(src.file);
      if (my !== token) return;
      a.target = src;
      a.targetId = id;
      u.uHeightB.value = tex;
      u.uEncB.value.set(src.offset, src.scale);
      u.uRangeB.value.set(src.min, src.max);
      coverTransform(u.uUvB.value, size.width, size.height, src.width, src.height, src.posX, src.posY);
      a.morph = { from: tweenValue(a.morph, now(), a.morphValue), to: 1, start: now(), dur, ease: easeSummit };
      wake();
    };
    morphTo(fieldStore.get().morphTarget);
    let last = fieldStore.get().morphTarget;
    let lastPrefetch = fieldStore.get().prefetch;
    return fieldStore.subscribe(() => {
      const s = fieldStore.get();
      if (s.morphTarget !== last) {
        last = s.morphTarget;
        morphTo(last);
      }
      if (s.prefetch !== lastPrefetch) {
        lastPrefetch = s.prefetch;
        for (const id of s.prefetch) {
          const src = cardSource(id);
          if (src) loadHeightTexture(src.file).catch(() => {});
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);

  // --- headlamp --------------------------------------------------------------------
  useEffect(() => {
    const cfg = () => fieldStore.get().config;
    const a = anim.current;
    const setPos = (x: number, y: number) => {
      a.lampPos = [x * dpr, (window.innerHeight - y) * dpr];
      a.lastInput = performance.now();
    };
    const fade = (to: number, dur: number) => {
      const now = performance.now();
      a.lamp = { from: tweenValue(a.lamp, now, a.lampValue), to, start: now, dur, ease: easeTrail };
      wake();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      setPos(e.clientX, e.clientY);
      if (a.lamp?.to !== 1) fade(1, msOf("micro"));
      wake();
    };
    const onPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget && e.pointerType !== "touch") fade(0, cfg().headlampFadeMs);
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      setPos(t.clientX, t.clientY);
      if (a.lamp?.to !== 1) fade(1, msOf("micro"));
      wake();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) fade(0, cfg().headlampFadeMs);
    };
    const opts = { passive: true } as const;
    window.addEventListener("pointermove", onPointerMove, opts);
    document.addEventListener("pointerout", onPointerOut, opts);
    window.addEventListener("touchstart", onTouch, opts);
    window.addEventListener("touchmove", onTouch, opts);
    window.addEventListener("touchend", onTouchEnd, opts);
    window.addEventListener("touchcancel", onTouchEnd, opts);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpr]);

  // --- frame scheduler --------------------------------------------------------------
  const sched = useRef({ raf: 0, timer: 0 as ReturnType<typeof setTimeout> | 0, lastRender: 0, paused });
  sched.current.paused = paused;

  const isBusy = (now: number) => {
    const a = anim.current;
    return (
      !tweenDone(a.sweep, now) ||
      !tweenDone(a.morph, now) ||
      !tweenDone(a.lamp, now) ||
      now - a.lastInput < 120 ||
      !a.readyNotified
    );
  };

  function tick(t: number) {
    const s = sched.current;
    s.raf = 0;
    if (document.hidden || s.paused) return;
    if (isBusy(t)) {
      const minGap = anim.current.capped ? 1000 / 30 - 2 : 1000 / 60 - 2;
      if (t - s.lastRender >= minGap) {
        s.lastRender = t;
        invalidate();
      }
      s.raf = requestAnimationFrame(tick);
    } else {
      // Idle: one more frame to settle, then the slow drift at a low frame rate.
      s.lastRender = t;
      invalidate();
      anim.current.frameTimes.length = 0;
      if (s.timer) clearTimeout(s.timer);
      s.timer = setTimeout(() => {
        s.timer = 0;
        wake();
      }, 1000 / profile.idleFps);
    }
  }

  function wake() {
    const s = sched.current;
    if (s.raf || document.hidden || s.paused) return;
    if (s.timer) {
      clearTimeout(s.timer);
      s.timer = 0;
    }
    s.raf = requestAnimationFrame(tick);
  }

  useEffect(() => {
    const onVisibility = () => {
      const s = sched.current;
      if (document.hidden) {
        cancelAnimationFrame(s.raf);
        s.raf = 0;
        if (s.timer) clearTimeout(s.timer);
        s.timer = 0;
      } else {
        wake();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = sched.current;
    if (paused) {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      if (s.timer) clearTimeout(s.timer);
      s.timer = 0;
      finishIntro(false);
    } else {
      wake();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(
    () => () => {
      const s = sched.current;
      cancelAnimationFrame(s.raf);
      if (s.timer) clearTimeout(s.timer);
      material.dispose();
    },
    [material],
  );

  useFrame(() => {
    const a = anim.current;
    if (!a.ready) return;
    const now = performance.now();
    const u = material.uniforms;

    a.sweepValue = tweenValue(a.sweep, now, a.sweepValue);
    a.morphValue = tweenValue(a.morph, now, a.morphValue);
    a.lampValue = tweenValue(a.lamp, now, a.lampValue);
    if (a.sweep && tweenDone(a.sweep, now)) {
      a.sweep = null;
      fieldStore.set({ introPlaying: false });
      document.documentElement.setAttribute("data-intro", "none");
    }
    if (a.morph && tweenDone(a.morph, now) && a.morphValue === 0 && !a.targetId && a.region) {
      // Back on the region: point B at A again and release the target texture slot.
      u.uHeightB.value = u.uHeightA.value;
      u.uEncB.value.copy(u.uEncA.value);
      u.uRangeB.value.copy(u.uRangeA.value);
      u.uUvB.value.copy(u.uUvA.value);
      a.target = null;
      a.morph = null;
    }

    u.uSweep.value = a.sweepValue;
    u.uMorph.value = a.morphValue;
    u.uHeadlampStrength.value = a.lampValue;
    u.uHeadlampPos.value.set(a.lampPos[0], a.lampPos[1]);
    u.uTime.value = (now - a.t0) / 1000;

    // Frame budget: if busy frames average over ~22 ms for a second, cap at 30 fps.
    if (!a.capped && a.lastFrame && now - a.lastFrame < 100) {
      a.frameTimes.push(now - a.lastFrame);
      const total = a.frameTimes.reduce((s, v) => s + v, 0);
      if (total >= 1000) {
        if (total / a.frameTimes.length > fieldStore.get().config.frameBudgetMs) a.capped = true;
        a.frameTimes.length = 0;
      }
    }
    a.lastFrame = now;

    if (!a.readyNotified) {
      a.readyNotified = true;
      // Reveal once this frame has actually been drawn.
      requestAnimationFrame(() => onReady());
    }
  });

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default function ContourField({
  profile,
  paused,
  onReady,
}: {
  profile: DeviceProfile;
  paused: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      orthographic
      frameloop="demand"
      dpr={[1, profile.dprMax]}
      flat
      linear
      gl={{ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <Field profile={profile} paused={paused} onReady={onReady} />
    </Canvas>
  );
}
