"use client";

import { Canvas, advance, useFrame, useThree } from "@react-three/fiber";
import { cancelFrame, frame, type Process } from "@/lib/frameloop";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import meta from "@terrain/terrain.json";
import { color, easing } from "@/styles/tokens";
import { MAX_QUIET_ZONES, coverTransform, createContourMaterial } from "./contour-material";
import { INTRO_STORAGE_KEY, cancelPendingIntro } from "@/lib/motion-preference";
import { colorOf, contourInterval, hexToRgb, msOf, type DeviceProfile, type FieldConfig } from "./field-settings";
import { fieldStore } from "./field-store";
import { loadHeightmap, type HeightmapMeta } from "./heightmap-loader";
import { watchQuietZones, type QuietKind, type QuietRect } from "./quiet-zones";

/**
 * The persistent contour field. Mounted once from the root layout (lazy chunk with
 * Three/R3F), so it never remounts on route changes. Renders on demand: continuous
 * frames only while something animates, a low idle rate for the slow drift, nothing
 * while the tab is hidden or reduced motion is on.
 *
 * One animation loop: the scheduler runs on Motion's frame loop (which also drives Lenis
 * and the springs) and renders with R3F's advance() (frameloop "never"), so the page has
 * a single requestAnimationFrame loop while scrolling.
 */

type TerrainSource = {
  /** The heightmap (WebP, raw fallback and reference texels). */
  map: HeightmapMeta;
  width: number;
  height: number;
  offset: number;
  scale: number;
  min: number;
  max: number;
  posX: number;
  posY: number;
  /** Gradient percentiles (metres per texel), for the screen-adaptive contour interval. */
  gradientM: Record<string, number>;
};

const regionSource = (profile: DeviceProfile): TerrainSource => {
  const hm =
    meta.heightmaps.find((h) => h.width === profile.heightmapWidth) ??
    meta.heightmaps.find((h) => h.use === profile.heightmap) ??
    meta.heightmaps[0];
  return {
    map: hm,
    width: hm.width,
    height: hm.height,
    offset: meta.encoding.offset,
    scale: meta.encoding.scale,
    min: meta.elevation.min,
    max: meta.elevation.max,
    posX: meta.region.focus.u,
    posY: meta.region.focus.v,
    gradientM: hm.gradientM,
  };
};

const cardSource = (id: string): TerrainSource | null => {
  const card = (meta.cards as Record<string, (typeof meta.cards)[keyof typeof meta.cards]>)[id];
  if (!card) return null;
  const m = card.morph;
  return {
    map: m,
    width: m.width,
    height: m.height,
    offset: m.encoding.offset,
    scale: m.encoding.scale,
    min: m.elevation.min,
    max: m.elevation.max,
    posX: 0.5,
    posY: 0.5,
    gradientM: m.gradientM,
  };
};

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
  // Land exactly on the target: eased endpoints can be off by a rounding error.
  return p >= 1 ? t.to : t.from + (t.to - t.from) * t.ease(p);
};
const tweenDone = (t: Tween | null, now: number) => !t || now - t.start >= t.dur;

function Field({ profile, paused, onReady }: { profile: DeviceProfile; paused: boolean; onReady: () => void }) {
  const material = useMemo(() => createContourMaterial(), []);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  // Async callbacks (texture loads, morphs) must use the current size, not the first render's.
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const dprRef = useRef(dpr);
  dprRef.current = dpr;
  // Kind of each quiet zone in the uniform arrays (see quiet-zones.ts).
  const quietKinds = useRef<QuietKind[]>([]);
  function writeQuietKinds() {
    const cfg = fieldStore.get().config;
    const d = dprRef.current;
    const kinds = material.uniforms.uQuietKind.value as THREE.Vector2[];
    quietKinds.current.forEach((kind, i) =>
      kind === "body"
        ? kinds[i].set(cfg.bodyQuietFeatherPx * d, cfg.bodyQuietStrength)
        : kinds[i].set(cfg.quietFeatherPx * d, cfg.quietStrength),
    );
  }

  const anim = useRef({
    sweep: null as Tween | null,
    sweepValue: 1,
    morph: null as Tween | null,
    morphValue: 0,
    lamp: null as Tween | null,
    lampValue: 0,
    lampPos: [-1e4, -1e4] as [number, number],
    lastInput: performance.now(),
    /** Map offset (UV), eased towards the pointer/scroll target: terrain moves slowly. */
    pan: [0, 0] as [number, number],
    panPointer: [0, 0] as [number, number],
    panScroll: 0,
    ripplePos: [0, 0] as [number, number],
    rippleStart: -1,
    lastFrame: 0,
    region: null as TerrainSource | null,
    /** Terrain currently loaded into texture slot B, and its id. */
    target: null as TerrainSource | null,
    slotId: null as string | null,
    /** Terrain the field is heading to (null = the region). */
    targetId: null as string | null,
    /** Contour interval (m) for the region and the target terrain at the current screen size. */
    intervalA: 100,
    intervalB: 100,
    /** Region interval changes (resize, tuning) glide in log space instead of popping. */
    intervalTween: null as Tween | null,
    ready: false,
    readyNotified: false,
    capped: false,
    frameTimes: [] as number[],
    t0: performance.now(),
  });

  // --- configuration → uniforms --------------------------------------------------
  useEffect(() => {
    const apply = (cfg: FieldConfig) => {
      const u = material.uniforms;
      u.uIndexEvery.value = cfg.indexEvery;
      u.uLineOpacity.value = cfg.lineOpacity;
      u.uIndexOpacity.value = cfg.indexOpacity;
      u.uGround.value.set(...hexToRgb(color.ground));
      u.uLineColor.value.set(...hexToRgb(colorOf(cfg.lineColor)));
      u.uIndexColor.value.set(...hexToRgb(colorOf(cfg.indexColor)));
      u.uGlowColor.value.set(...hexToRgb(colorOf(cfg.glowColor)));
      u.uGlow.value = profile.glow ? cfg.glowStrength / 0.3 : 0;
      u.uDrift.value = cfg.driftCyclesPerSecond;
      writeQuietKinds();
      updateIntervals(true);
      wake();
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
    // updateIntervals reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, profile]);

  // Pixel-based uniforms depend on the device pixel ratio.
  useEffect(() => {
    const cfg = fieldStore.get().config;
    const u = material.uniforms;
    u.uLineWidth.value = cfg.lineWidthPx * dpr;
    u.uIndexWidth.value = cfg.indexLineWidthPx * dpr;
    u.uHeadlampRadius.value = cfg.headlampRadiusPx * dpr;
    u.uGlowWidth.value = cfg.glowWidthPx * dpr;
    u.uRippleSpeed.value = cfg.rippleSpeedPxS * dpr;
    writeQuietKinds();
    u.uResolution.value.set(size.width * dpr, size.height * dpr);
    const a = anim.current;
    if (a.region) coverTransform(u.uUvA.value, size.width, size.height, a.region.width, a.region.height, a.region.posX, a.region.posY);
    if (a.target) coverTransform(u.uUvB.value, size.width, size.height, a.target.width, a.target.height, a.target.posX, a.target.posY);
    updateIntervals(true);
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, dpr, size.width, size.height]);

  // --- quiet zones behind text -------------------------------------------------------
  useEffect(() => {
    const u = material.uniforms;
    const write = (rects: readonly QuietRect[]) => {
      // Viewport CSS px → device px with the origin at the bottom-left, like gl_FragCoord.
      const h = sizeRef.current.height;
      const n = Math.min(rects.length, MAX_QUIET_ZONES);
      for (let i = 0; i < n; i++) {
        const r = rects[i];
        (u.uQuiet.value as THREE.Vector4[])[i].set(r.left * dpr, (h - r.bottom) * dpr, r.right * dpr, (h - r.top) * dpr);
      }
      quietKinds.current = rects.slice(0, n).map((r) => r.kind);
      u.uQuietCount.value = n;
      writeQuietKinds();
      wake();
    };
    return watchQuietZones(write);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, dpr]);

  // --- contour interval from the on-screen scale -----------------------------------
  function updateIntervals(animate: boolean) {
    const a = anim.current;
    const cfg = fieldStore.get().config;
    const view = sizeRef.current;
    if (a.region) {
      const next = contourInterval(a.region, view, cfg.zoomBase, cfg);
      if (next !== a.intervalA) {
        const now = performance.now();
        const shown = Math.exp(tweenValue(a.intervalTween, now, Math.log(a.intervalA)));
        a.intervalTween = animate
          ? { from: Math.log(shown), to: Math.log(next), start: now, dur: msOf("long"), ease: easeTrail }
          : null;
        a.intervalA = next;
        wake();
      }
    }
    if (a.target) a.intervalB = contourInterval(a.target, view, cfg.zoomBase + cfg.morphZoom, cfg);
    const intervalM = a.slotId ? a.intervalB : a.intervalA;
    if (fieldStore.get().intervalM !== intervalM) fieldStore.set({ intervalM });
  }

  // --- region heightmap + intro ---------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const region = regionSource(profile);
    // Verified once per session; a browser that alters the decoded heights gets the raw
    // fallback, and the poster stays if neither decodes exactly (heightmap-loader.ts).
    loadHeightmap(gl, region.map).then((tex) => {
      if (cancelled) return;
      const size = sizeRef.current;
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
      updateIntervals(false);

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
    }, () => {
      // Heightmap unavailable (offline, decode error): stay on the static poster.
      cancelPendingIntro();
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
      const current = () => tweenValue(a.morph, now(), a.morphValue);
      const tweenTo = (to: number, ms: number) => {
        a.morph = { from: current(), to, start: now(), dur: ms, ease: easeSummit };
        wake();
      };
      a.targetId = id;
      if (!id) return tweenTo(0, dur);
      // Already loaded in slot B (e.g. A → B → A before B arrived): just head back to it.
      if (a.slotId === id) return tweenTo(1, dur);
      // Slot B still shows another terrain: settle back to the region before swapping it.
      if (a.slotId && current() > 0.001) {
        const settle = (dur / 2) * current();
        tweenTo(0, settle);
        await new Promise((r) => setTimeout(r, settle));
        if (my !== token) return;
      }
      const src = cardSource(id);
      if (!src) return;
      let tex: THREE.Texture;
      try {
        tex = await loadHeightmap(gl, src.map);
      } catch {
        return;
      }
      if (my !== token) return;
      const size = sizeRef.current;
      a.target = src;
      a.slotId = id;
      u.uHeightB.value = tex;
      u.uEncB.value.set(src.offset, src.scale);
      u.uRangeB.value.set(src.min, src.max);
      coverTransform(u.uUvB.value, size.width, size.height, src.width, src.height, src.posX, src.posY);
      updateIntervals(false);
      tweenTo(1, dur);
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
          if (src) loadHeightmap(gl, src.map).catch(() => {});
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
      // Parallax: the map leans away from the pointer, a little.
      const k = cfg().parallax;
      a.panPointer = [(e.clientX / window.innerWidth - 0.5) * k, -(e.clientY / window.innerHeight - 0.5) * k];
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
    // Click or tap: an altimeter ping rings out from the point of contact.
    const onPointerDown = (e: PointerEvent) => {
      a.ripplePos = [e.clientX * dpr, (window.innerHeight - e.clientY) * dpr];
      a.rippleStart = performance.now();
      a.lastInput = a.rippleStart;
      wake();
    };
    // Scrolling descends the map slowly (slower than the content).
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      a.panScroll = -(window.scrollY / max) * cfg().scrollParallax;
      a.lastInput = performance.now();
      wake();
    };
    const opts = { passive: true } as const;
    window.addEventListener("pointermove", onPointerMove, opts);
    document.addEventListener("pointerout", onPointerOut, opts);
    window.addEventListener("touchstart", onTouch, opts);
    window.addEventListener("touchmove", onTouch, opts);
    window.addEventListener("touchend", onTouchEnd, opts);
    window.addEventListener("touchcancel", onTouchEnd, opts);
    window.addEventListener("pointerdown", onPointerDown, opts);
    window.addEventListener("scroll", onScroll, opts);
    onScroll();
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll);
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
  const sched = useRef({
    scheduled: false,
    timer: 0 as ReturnType<typeof setTimeout> | 0,
    lastRender: 0,
    lastTick: 0,
    paused,
    // The callbacks actually queued on Motion's loop (this component's functions are
    // recreated on every render), so they can be cancelled.
    queuedTick: null as Process | null,
    queuedRender: null as Process | null,
  });
  sched.current.paused = paused;

  const isBusy = (now: number) => {
    const a = anim.current;
    return (
      !tweenDone(a.sweep, now) ||
      !tweenDone(a.morph, now) ||
      !tweenDone(a.lamp, now) ||
      !tweenDone(a.intervalTween, now) ||
      now - a.lastInput < 120 ||
      (a.rippleStart >= 0 && now - a.rippleStart < 1800) ||
      Math.abs(a.pan[0] - a.panPointer[0]) + Math.abs(a.pan[1] - a.panPointer[1] - a.panScroll) > 2e-4 ||
      (a.ready && !a.readyNotified)
    );
  };

  // Renders after this frame's updates (Lenis, springs) have run.
  const render = ({ timestamp }: { timestamp: number }) => advance(timestamp);

  function tick({ timestamp: t }: { timestamp: number }) {
    const s = sched.current;
    const a = anim.current;
    s.scheduled = false;
    if (document.hidden || s.paused) return;
    if (isBusy(t)) {
      // Frame budget: rAF intervals stretch when frames are too expensive. If they average
      // over ~22 ms for a second of continuous animation, cap rendering at 30 fps.
      if (!a.capped && s.lastTick && t - s.lastTick < 100) {
        a.frameTimes.push(t - s.lastTick);
        const total = a.frameTimes.reduce((sum, v) => sum + v, 0);
        if (total >= 1000) {
          if (total / a.frameTimes.length > fieldStore.get().config.frameBudgetMs) a.capped = true;
          a.frameTimes.length = 0;
        }
      }
      s.lastTick = t;
      // At most ~60–80 fps: every vsync on 60/75 Hz, every other one on 120/144 Hz.
      const minGap = a.capped ? 1000 / 30 - 4 : 1000 / 80;
      if (t - s.lastRender >= minGap) {
        s.lastRender = t;
        s.queuedRender = frame.render(render);
      }
      s.scheduled = true;
      s.queuedTick = frame.update(tick);
    } else {
      // Idle: one more frame to settle, then the slow drift at a low frame rate.
      s.lastRender = t;
      s.lastTick = 0;
      s.queuedRender = frame.render(render);
      a.frameTimes.length = 0;
      if (s.timer) clearTimeout(s.timer);
      s.timer = setTimeout(() => {
        s.timer = 0;
        wake();
      }, 1000 / (performance.now() - a.lastInput < fieldStore.get().config.dormantAfterMs ? profile.ambientFps : profile.idleFps));
    }
  }

  function wake() {
    const s = sched.current;
    // Nothing to draw until the region heightmap is in (or if it never arrives).
    if (s.scheduled || document.hidden || s.paused || !anim.current.ready) return;
    if (s.timer) {
      clearTimeout(s.timer);
      s.timer = 0;
    }
    s.scheduled = true;
    s.queuedTick = frame.update(tick);
  }

  function stop() {
    const s = sched.current;
    if (s.queuedTick) cancelFrame(s.queuedTick);
    if (s.queuedRender) cancelFrame(s.queuedRender);
    s.queuedTick = s.queuedRender = null;
    s.scheduled = false;
    if (s.timer) clearTimeout(s.timer);
    s.timer = 0;
  }

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stop();
      else wake();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused) {
      stop();
      finishIntro(false);
    } else {
      wake();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(
    () => () => {
      stop();
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
    if (a.morph && tweenDone(a.morph, now) && a.morphValue === 0 && !a.targetId && a.slotId && a.region) {
      // Back on the region: point B at A again and release the target texture slot.
      u.uHeightB.value = u.uHeightA.value;
      u.uEncB.value.copy(u.uEncA.value);
      u.uRangeB.value.copy(u.uRangeA.value);
      u.uUvB.value.copy(u.uUvA.value);
      a.target = null;
      a.slotId = null;
      a.morph = null;
      updateIntervals(false);
    }
    // Report the terrain on screen once a morph has landed (backdrop data-terrain).
    if (!a.morph || tweenDone(a.morph, now)) {
      const shown = a.morphValue >= 1 ? a.slotId : a.morphValue <= 0 ? null : undefined;
      if (shown !== undefined && fieldStore.get().shownTerrain !== shown) fieldStore.set({ shownTerrain: shown });
    }

    u.uSweep.value = a.sweepValue;
    u.uMorph.value = a.morphValue;
    // Contour interval: the region's (gliding after a resize) blended in log space towards
    // the target terrain's while morphing, with the same smoothstep the shader uses.
    const lnA = tweenValue(a.intervalTween, now, Math.log(a.intervalA));
    const lnB = a.target ? Math.log(a.intervalB) : lnA;
    const mm = a.morphValue * a.morphValue * (3 - 2 * a.morphValue);
    u.uInterval.value = Math.exp(lnA + (lnB - lnA) * mm);
    const cfg = fieldStore.get().config;
    // Camera: push in while morphing to a card's terrain.
    u.uZoom.value = cfg.zoomBase + a.morphValue * cfg.morphZoom;
    // Pan eases towards pointer + scroll targets, plus a very slow autonomous drift.
    const dt = a.lastFrame ? Math.min(0.1, (now - a.lastFrame) / 1000) : 0;
    a.lastFrame = now;
    const ease = 1 - Math.exp(-dt * 2.2);
    a.pan[0] += (a.panPointer[0] - a.pan[0]) * ease;
    a.pan[1] += (a.panPointer[1] + a.panScroll - a.pan[1]) * ease;
    const t = (now - a.t0) / 1000;
    u.uPan.value.set(a.pan[0] + Math.sin(t * 0.05) * 0.008, a.pan[1] + Math.cos(t * 0.037) * 0.008);
    const age = a.rippleStart >= 0 ? (now - a.rippleStart) / 1000 : -1;
    u.uRipple.value.set(a.ripplePos[0], a.ripplePos[1], age >= 0 && age < 1.8 ? age : -1);
    u.uHeadlampStrength.value = a.lampValue;
    u.uHeadlampPos.value.set(a.lampPos[0], a.lampPos[1]);
    u.uTime.value = (now - a.t0) / 1000;

    if (!a.readyNotified) {
      a.readyNotified = true;
      // Reveal once this frame has actually been drawn.
      frame.postRender(() => onReady());
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
      frameloop="never"
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
