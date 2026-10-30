"use client";

import { Canvas, advance, useFrame, useThree } from "@react-three/fiber";
import { cancelFrame, frame, type Process } from "@/lib/frameloop";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import meta from "@terrain/terrain.json";
import bern from "@terrain/bern/bern.json";
import { BASE_PATH } from "@/lib/asset";
import { cardTerrain } from "@/lib/card-terrain";
import { activeViewTransition } from "@/lib/view-transition";
import { color, duration, easing } from "@/styles/tokens";
import { currentMode } from "@/lib/motion-mode";
import { MAX_QUIET_ZONES, coverTransform, createContourMaterial } from "./contour-material";
import { Timeline, bezier, morphStep, planRoute, prewarmStep, type Step, type TimelineEvent } from "./conductor";
import { markTierC } from "./field-boot";
import { colorOf, contourInterval, hexToRgb, intervalSet, msOf, type DeviceProfile, type FieldConfig } from "./field-settings";
import { fieldStore } from "./field-store";
import { loadHeightmap, type HeightmapMeta } from "./heightmap-loader";
import { watchQuietZones, type QuietKind, type QuietRect } from "./quiet-zones";
import { createRiverMaterial, riverGeometry } from "./river-material";
import { BERN, routeTerrain } from "./route-terrain";

/**
 * The persistent contour field. Mounted once from the root layout (lazy chunk with
 * Three/R3F), so it never remounts on route changes. It holds still while a page is read and
 * moves only on a page change: no drift, line flow, headlamp, parallax or intro. Renders on
 * demand: frames only while something animates (a morph, a resize, the quiet zones following
 * the scroll), nothing while the tab is hidden, a dialog is open or the WebGL context is lost.
 *
 * Route changes are conducted (conductor.ts): two terrain slots, A on screen and B the
 * destination, and uMorph running 0 → 1 between them; when it lands, B becomes A. A route that
 * interrupts another picks up where the field is (a mostly-arrived destination becomes A first).
 * Bern brings the Aare (river-material.ts) and the zero-point pin.
 *
 * Calm mode also drops the draw-on and the zoom push: it morphs between routes and draws frames
 * only while it does. Tier B (phones, small screens) renders at a 0.75 render scale and throttles
 * its scroll frames to ~30 fps.
 *
 * One animation loop: the scheduler runs on Motion's frame loop (which also drives Lenis
 * and the springs) and renders with R3F's advance() (frameloop "never"), so the page has
 * a single requestAnimationFrame loop while scrolling.
 */

// Preview builds and dev only: the debug hook the e2e scenarios read (window.__terrain).
const previewable = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PREVIEW === "1";

type TerrainSource = {
  id: string | null;
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
  /** The terrain's interval set (alpine or lowland, by relief). */
  intervals: readonly number[];
  /** A card's terrain: the camera pushes in (full motion). */
  push: boolean;
};

type Slot = { src: TerrainSource; tex: THREE.Texture; interval: number };

const pickMap = <M extends { width: number; use: string }>(maps: readonly M[], profile: DeviceProfile): M =>
  maps.find((h) => h.width === profile.heightmapWidth) ?? maps.find((h) => h.use === profile.heightmap) ?? maps[0];

const regionSource = (profile: DeviceProfile): TerrainSource => {
  const hm = pickMap(meta.heightmaps, profile);
  return {
    id: null,
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
    intervals: intervalSet(meta.elevation.max - meta.elevation.min),
    push: false,
  };
};

const cardSource = (id: string): TerrainSource | null => {
  const card = cardTerrain(id);
  if (!card) return null;
  const m = card.morph;
  return {
    id,
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
    intervals: intervalSet(m.elevation.max - m.elevation.min),
    push: true,
  };
};

// Bern is framed on the zero point, so it sits at the centre of every screen.
const bernSource = (profile: DeviceProfile): TerrainSource => {
  const hm = pickMap(bern.heightmaps, profile);
  return {
    id: BERN,
    map: hm,
    width: hm.width,
    height: hm.height,
    offset: bern.encoding.offset,
    scale: bern.encoding.scale,
    min: bern.elevation.min,
    max: bern.elevation.max,
    posX: bern.zeroPoint.u,
    posY: bern.zeroPoint.v,
    gradientM: hm.gradientM,
    intervals: bern.intervalsM,
    push: false,
  };
};

const sourceFor = (id: string | null, profile: DeviceProfile) =>
  id === BERN ? bernSource(profile) : id ? cardSource(id) : regionSource(profile);

const easeTrail = bezier(easing.trail);
const smooth = (x: number) => x * x * (3 - 2 * x);

type Tween = { from: number; to: number; start: number; dur: number; ease: (x: number) => number };
const tweenValue = (t: Tween | null, now: number, fallback: number) => {
  if (!t) return fallback;
  const p = t.dur <= 0 ? 1 : Math.min(Math.max((now - t.start) / t.dur, 0), 1);
  // Land exactly on the target: eased endpoints can be off by a rounding error.
  return p >= 1 ? t.to : t.from + (t.to - t.from) * t.ease(p);
};
const tweenDone = (t: Tween | null, now: number) => !t || now - t.start >= t.dur;

const LOSSES_KEY = "summit:field-losses";
/** Context losses this session (sessionStorage, mirrored in memory). */
let lossesInMemory = 0;
function countLoss(): number {
  let n = lossesInMemory + 1;
  try {
    n = Number(sessionStorage.getItem(LOSSES_KEY) ?? lossesInMemory) + 1;
    sessionStorage.setItem(LOSSES_KEY, String(n));
  } catch {
    // Memory only.
  }
  lossesInMemory = n;
  return n;
}

type FieldProps = {
  profile: DeviceProfile;
  paused: boolean;
  calm: boolean;
  onReady: () => void;
  /** The WebGL context was lost: show the poster now. `final`: the second loss this session (tier C from now on). */
  onContextLost: (final: boolean) => void;
};

/** A link's terrain, or undefined if it is not an internal link (null is the home region). */
function linkTerrain(target: EventTarget | null): { link: Element; id: string | null } | undefined {
  const link = target instanceof Element ? target.closest("a[href]") : null;
  if (!link) return undefined;
  const url = new URL((link as HTMLAnchorElement).href, window.location.href);
  if (url.origin !== window.location.origin) return undefined;
  const path = BASE_PATH && url.pathname.startsWith(BASE_PATH) ? url.pathname.slice(BASE_PATH.length) || "/" : url.pathname;
  return { link, id: routeTerrain(path) };
}

function Field({ profile, paused, calm, onReady, onContextLost }: FieldProps) {
  const material = useMemo(() => createContourMaterial(), []);
  const riverMaterial = useMemo(() => createRiverMaterial(material.uniforms), [material]);
  const river = useMemo(() => (bern.river ? riverGeometry(bern.river.pieces) : null), []);
  const riverMesh = useRef<THREE.Mesh>(null);
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
    // Through a route change every zone takes the strongest knockout and the wider feather.
    material.uniforms.uHoldKind.value.set(
      Math.max(cfg.bodyQuietFeatherPx, cfg.quietFeatherPx) * d,
      Math.min(cfg.bodyQuietStrength, cfg.quietStrength),
    );
  }

  const timeline = useMemo(() => new Timeline(), []);
  const anim = useRef({
    /** Map offset (UV), eased towards the pointer/scroll target: terrain moves slowly. */
    /** Slot A: the terrain on screen; slot B: where the field is heading (or leaning, pre-warm). */
    A: null as Slot | null,
    B: null as Slot | null,
    /** The route's terrain (the latest morph target). */
    routeId: null as string | null,
    routeToken: 0,
    /** A route morph is loading or running (pre-warm stays out of its way). */
    routing: false,
    /** The route's heightmap is loading. */
    loading: false,
    /** Pre-warm: the hovered or focused destination. */
    prewarmId: undefined as string | null | undefined,
    prewarmToken: 0,
    /** Contour interval glide in log space (resizes, tuning), added to the slots' blend. */
    glide: null as Tween | null,
    lnShown: Math.log(100),
    /** Quiet zones now, and the old page's while a route change holds them. */
    rects: [] as readonly QuietRect[],
    prevRects: [] as readonly QuietRect[],
    holdSeq: 0,
    holdVtDone: true,
    ready: false,
    readyNotified: false,
    lost: false,
    capped: false,
    frameTimes: [] as number[],
    frames: 0,
  });

  // --- configuration → uniforms --------------------------------------------------
  useEffect(() => {
    const apply = (cfg: FieldConfig) => {
      const u = material.uniforms;
      u.uIndexEvery.value = cfg.indexEvery;
      // Line strengths per device profile, read live so the tuning panel applies at once.
      const lines = cfg[profile.kind];
      u.uLineOpacity.value = lines.lineOpacity;
      u.uIndexOpacity.value = lines.indexOpacity;
      u.uGround.value.set(...hexToRgb(color.ground));
      u.uLineColor.value.set(...hexToRgb(colorOf(cfg.lineColor)));
      u.uIndexColor.value.set(...hexToRgb(colorOf(cfg.indexColor)));
      u.uHeadlampGain.value = cfg.headlampGain;
      u.uSweepGain.value = cfg.sweepGain;
      u.uDrift.value = cfg.driftCyclesPerSecond;
      u.uPinColor.value.set(...hexToRgb(colorOf(cfg.pin.color)));
      riverMaterial.uniforms.uColor.value.set(...hexToRgb(colorOf(cfg.river.color)));
      writeQuietKinds();
      writePixelSizes();
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
    // updateIntervals reads refs and the session's fixed profile only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, profile]);

  function writePixelSizes() {
    const cfg = fieldStore.get().config;
    const u = material.uniforms;
    const d = dprRef.current;
    u.uLineWidth.value = cfg.lineWidthPx * d;
    u.uIndexWidth.value = cfg.indexLineWidthPx * d;
    u.uPinShape.value.set(cfg.pin.armPx * d, cfg.pin.gapPx * d, cfg.pin.widthPx * d, cfg.pin.pingPx * d);
    riverMaterial.uniforms.uHalfWidth.value = (cfg.river.widthPx * d) / 2;
  }

  // Pixel-based uniforms depend on the device pixel ratio.
  useEffect(() => {
    const u = material.uniforms;
    writePixelSizes();
    writeQuietKinds();
    u.uResolution.value.set(size.width * dpr, size.height * dpr);
    const a = anim.current;
    if (a.A) bind("A", a.A);
    bind("B", a.B ?? a.A);
    updateIntervals(true);
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, dpr, size.width, size.height]);

  // --- quiet zones behind text -------------------------------------------------------
  const toDevice = (r: { left: number; top: number; right: number; bottom: number }, out: THREE.Vector4) => {
    // Viewport CSS px → device px with the origin at the bottom-left, like gl_FragCoord.
    const h = sizeRef.current.height;
    const d = dprRef.current;
    return out.set(r.left * d, (h - r.bottom) * d, r.right * d, (h - r.top) * d);
  };
  function writeColumn() {
    // The content column through a route change: everything either page's text covers on screen.
    const a = anim.current;
    const rects = [...a.prevRects, ...a.rects].filter((r) => r.bottom > 0 && r.top < sizeRef.current.height);
    const col = material.uniforms.uQuietColumn.value as THREE.Vector4;
    if (!rects.length) return col.set(-1e5, -1e5, -1e5, -1e5);
    toDevice(
      {
        left: Math.min(...rects.map((r) => r.left)),
        top: Math.min(...rects.map((r) => r.top)),
        right: Math.max(...rects.map((r) => r.right)),
        bottom: Math.max(...rects.map((r) => r.bottom)),
      },
      col,
    );
  }
  useEffect(() => {
    const u = material.uniforms;
    const write = (rects: readonly QuietRect[]) => {
      const n = Math.min(rects.length, MAX_QUIET_ZONES);
      for (let i = 0; i < n; i++) toDevice(rects[i], (u.uQuiet.value as THREE.Vector4[])[i]);
      quietKinds.current = rects.slice(0, n).map((r) => r.kind);
      u.uQuietCount.value = n;
      anim.current.rects = rects;
      writeQuietKinds();
      writeColumn();
      wake();
    };
    return watchQuietZones(write);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, dpr]);

  // --- contour interval from the on-screen scale -----------------------------------
  const zoomOf = (slot: Slot) => {
    const cfg = fieldStore.get().config;
    return cfg.zoomBase + (slot.src.push && !sched.current.calm ? cfg.morphZoom : 0);
  };
  function updateIntervals(animate: boolean) {
    const a = anim.current;
    if (!a.A) return;
    const cfg = fieldStore.get().config;
    const view = sizeRef.current;
    const spacing = { minSpacingPx: cfg[profile.kind].minSpacingPx, steepPercentile: cfg.steepPercentile };
    const before = a.lnShown;
    for (const slot of [a.A, a.B]) if (slot) slot.interval = contourInterval(slot.src, view, zoomOf(slot), spacing, slot.src.intervals);
    const now = performance.now();
    const target = lnBlend(timeline.values.morph);
    a.glide = animate && Math.abs(before - target) > 1e-6 ? { from: before - target, to: 0, start: now, dur: msOf("long"), ease: easeTrail } : null;
    const intervalM = (a.B ?? a.A).interval;
    if (fieldStore.get().intervalM !== intervalM) fieldStore.set({ intervalM });
    wake();
  }
  const lnBlend = (m: number) => {
    const a = anim.current;
    const lnA = Math.log(a.A!.interval);
    const lnB = a.B ? Math.log(a.B.interval) : lnA;
    return lnA + (lnB - lnA) * smooth(m);
  };

  // --- terrain slots ----------------------------------------------------------------
  function bind(which: "A" | "B", slot: Slot | null) {
    if (!slot) return;
    const u = material.uniforms;
    const s = slot.src;
    const view = sizeRef.current;
    (which === "A" ? u.uHeightA : u.uHeightB).value = slot.tex;
    (which === "A" ? u.uEncA : u.uEncB).value.set(s.offset, s.scale);
    (which === "A" ? u.uRangeA : u.uRangeB).value.set(s.min, s.max);
    coverTransform((which === "A" ? u.uUvA : u.uUvB).value, view.width, view.height, s.width, s.height, s.posX, s.posY);
  }
  function setB(slot: Slot | null) {
    const a = anim.current;
    a.B = slot;
    // Without a destination, B mirrors A so the morph mix is a no-op.
    bind("B", slot ?? a.A);
    updateIntervals(false);
  }

  const debugEvents = useRef<Record<string, unknown>[]>([]);
  const log = (e: Record<string, unknown>) => {
    if (previewable) debugEvents.current.push({ ...e, at: performance.now() });
  };
  useEffect(() => {
    if (!previewable) return;
    timeline.onEvent = (e: TimelineEvent) => log({ type: e.end === null ? "start" : "end", channel: e.channel, from: e.from, to: e.to, start: e.start, end: e.end, prev: e.prev, duration: e.duration });
  }, [timeline]);

  function play(steps: Step[]) {
    timeline.play(steps, performance.now());
    wake();
  }

  /** A route committed: conduct the field to its terrain. */
  async function routeTo(id: string | null) {
    const a = anim.current;
    const my = ++a.routeToken;
    a.routeId = id;
    a.prewarmId = undefined;
    a.loading = false;
    if (!a.A) return;
    const cfg = fieldStore.get().config;
    const mode = sched.current.calm ? "calm" : "full";
    const plan = (morphTo: number, changes: boolean) => {
      a.routing = true;
      log({ type: "route", to: id ?? "region", mode, morphFrom: timeline.values.morph, morphTo });
      play([morphStep(morphTo), ...planRoute(id, mode, timeline.values, { changes, revealFloor: cfg.revealFloor })]);
    };
    const m = timeline.values.morph;
    // Back to the terrain on screen (a route reversed mid-morph, or pre-warm leaning elsewhere).
    if (a.A.src.id === id) return plan(0, m > 0.001);
    if (a.B?.src.id === id) return plan(1, true);
    // A mostly-arrived destination becomes the terrain on screen; the new one loads into B.
    if (m > 0.5 && a.B) {
      [a.A, a.B] = [a.B, a.A];
      bind("A", a.A);
      bind("B", a.B);
      timeline.set("morph", 1 - m);
    }
    // No terrain to go to (unknown, or its heightmap failed): settle on the one on screen.
    const src = sourceFor(id, profile);
    if (!src) return plan(0, false);
    a.routing = a.loading = true;
    const asked = performance.now();
    let tex: THREE.Texture;
    try {
      tex = await loadHeightmap(gl, src.map);
    } catch {
      if (my !== a.routeToken) return;
      a.loading = false;
      return plan(0, false);
    }
    log({ type: "loaded", to: id ?? "region", ms: Math.round(performance.now() - asked), current: my === a.routeToken });
    if (my !== a.routeToken) return;
    a.loading = false;
    setB({ src, tex, interval: a.A.interval });
    plan(1, true);
  }

  /** Pre-warm (tier A, full): lean towards a hovered or focused destination. */
  async function prewarm(id: string | null) {
    const a = anim.current;
    const cfg = fieldStore.get().config;
    if (profile.tier !== "desktop" || sched.current.calm || currentMode() !== "full" || !a.A || a.routing) return;
    // Already leaning there (pointerover bubbles from every child of the link), or there already.
    if (id === a.A.src.id || a.prewarmId === id) return;
    a.prewarmId = id;
    const my = ++a.prewarmToken;
    const src = sourceFor(id, profile);
    if (!src) return;
    let tex: THREE.Texture;
    try {
      tex = await loadHeightmap(gl, src.map);
    } catch {
      return;
    }
    if (my !== a.prewarmToken || a.prewarmId !== id || a.routing || !a.A || a.A.src.id === id) return;
    if (a.B?.src.id !== id) setB({ src, tex, interval: a.A.interval });
    log({ type: "prewarm", to: id ?? "region" });
    play([prewarmStep(cfg.prewarm.morph, msOf(cfg.prewarm.duration))]);
  }
  function unprewarm(id: string | null) {
    const a = anim.current;
    if (a.prewarmId !== id) return;
    a.prewarmId = undefined;
    a.prewarmToken++;
    if (a.routing) return;
    log({ type: "prewarm-leave", to: id ?? "region" });
    play([prewarmStep(0, msOf(fieldStore.get().config.prewarm.duration))]);
  }

  /** Every route change: hold the quiet zones (old and new page) until the transition is over. */
  function holdQuietZones() {
    const a = anim.current;
    a.prevRects = a.rects;
    a.holdVtDone = false;
    const seq = ++a.holdSeq;
    timeline.set("hold", 1);
    writeColumn();
    const vt = activeViewTransition();
    (vt ? vt.finished.catch(() => {}) : Promise.resolve()).then(() => {
      if (seq !== a.holdSeq) return;
      a.holdVtDone = true;
      wake();
    });
    wake();
  }

  // --- first terrain ---------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const load = (id: string | null) => {
      const src = sourceFor(id, profile) ?? regionSource(profile);
      // Verified once per session; a browser that alters the decoded heights gets the raw
      // fallback, and the poster stays if neither decodes exactly (heightmap-loader.ts).
      loadHeightmap(gl, src.map).then(
        (tex) => {
          if (cancelled) return;
          const a = anim.current;
          a.A = { src, tex, interval: 100 };
          a.routeId = src.id;
          bind("A", a.A);
          bind("B", a.A);
          updateIntervals(false);
          a.lnShown = lnBlend(0);
          // Arriving straight on Basecamp: the river and the pin are simply there.
          if (src.id === BERN) {
            timeline.set("riverDraw", 1);
            timeline.set("riverOpacity", 1);
            timeline.set("pin", 1);
          }
          a.ready = true;
          wake();
          // The route moved on while the first terrain loaded: conduct from here.
          const target = fieldStore.get().morphTarget;
          if (target !== src.id) routeTo(target);
        },
        () => {
          // Heightmap unavailable (offline, decode error): stay on the static poster.
        },
      );
    };
    load(fieldStore.get().morphTarget);
    return () => {
      cancelled = true;
    };
    // The first terrain is chosen once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- routes, prefetch and pre-warm ------------------------------------------------------
  useEffect(() => {
    let lastTarget = fieldStore.get().morphTarget;
    let lastSeq = fieldStore.get().routeSeq;
    let lastPrefetch = fieldStore.get().prefetch;
    const unsub = fieldStore.subscribe(() => {
      const s = fieldStore.get();
      if (s.routeSeq !== lastSeq) {
        lastSeq = s.routeSeq;
        holdQuietZones();
      }
      if (s.morphTarget !== lastTarget) {
        lastTarget = s.morphTarget;
        log({ type: "commit", to: lastTarget ?? "region" });
        // Before the first terrain is in, its loader picks up the latest target.
        if (anim.current.A) routeTo(lastTarget);
      }
      if (s.prefetch !== lastPrefetch) {
        lastPrefetch = s.prefetch;
        for (const id of s.prefetch) {
          const src = sourceFor(id, profile);
          if (src) loadHeightmap(gl, src.map).catch(() => {});
        }
      }
    });
    // Pre-warm on desktop: hover or focus on any link to another terrain (cards, Basecamp, home).
    if (profile.tier !== "desktop") return unsub;
    const enter = (e: Event) => {
      if (e instanceof PointerEvent && e.pointerType === "touch") return;
      const hit = linkTerrain(e.target);
      if (hit) prewarm(hit.id);
    };
    const leave = (e: Event) => {
      const hit = linkTerrain(e.target);
      const next = (e as PointerEvent | FocusEvent).relatedTarget;
      if (!hit || (next instanceof Node && hit.link.contains(next))) return;
      unprewarm(hit.id);
    };
    document.addEventListener("pointerover", enter, { passive: true });
    document.addEventListener("pointerout", leave, { passive: true });
    document.addEventListener("focusin", enter);
    document.addEventListener("focusout", leave);
    return () => {
      unsub();
      document.removeEventListener("pointerover", enter);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("focusin", enter);
      document.removeEventListener("focusout", leave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);

  // --- frame scheduler --------------------------------------------------------------
  const sched = useRef({
    scheduled: false,
    timer: 0 as ReturnType<typeof setTimeout> | 0,
    lastRender: 0,
    lastTick: 0,
    paused,
    calm,
    /** A dialog is open (a lightbox): nothing behind it needs frames. */
    dialog: false,
    // The callbacks actually queued on Motion's loop (this component's functions are
    // recreated on every render), so they can be cancelled.
    queuedTick: null as Process | null,
    queuedRender: null as Process | null,
  });
  sched.current.paused = paused;
  sched.current.calm = calm;

  const isBusy = (now: number) => {
    const a = anim.current;
    const moving = timeline.update(now);
    return (
      moving ||
      !tweenDone(a.glide, now) ||
      (a.ready && !a.readyNotified)
    );
  };

  // Renders after this frame's updates (Lenis, springs) have run. A frame can start work of its
  // own (the quiet zones letting go once the transition is over): the loop then keeps running.
  const render = ({ timestamp }: { timestamp: number }) => {
    anim.current.frames++;
    advance(timestamp);
    if (timeline.active && !sched.current.scheduled) wake();
  };

  function tick({ timestamp: t }: { timestamp: number }) {
    const s = sched.current;
    const a = anim.current;
    s.scheduled = false;
    if (document.hidden || s.paused || s.dialog || a.lost) return;
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
      // At most ~60–80 fps: every vsync on 60/75 Hz, every other one on 120/144 Hz. Tier B, and
      // a field over its frame budget, at ~30 fps.
      const minGap = a.capped || profile.tier === "mobile" ? 1000 / 30 - 4 : 1000 / 80;
      if (t - s.lastRender >= minGap) {
        s.lastRender = t;
        s.queuedRender = frame.render(render);
      }
      s.scheduled = true;
      s.queuedTick = frame.update(tick);
    } else {
      // Idle: one more frame to settle (in tier B no sooner than its ~30 fps allow: scrolling
      // moves the quiet zones one write at a time), then nothing until something changes.
      const gap = profile.tier === "mobile" ? 1000 / 30 - 4 - (t - s.lastRender) : 0;
      if (gap > 0) {
        s.timer = setTimeout(() => {
          s.timer = 0;
          wake();
        }, gap);
        return;
      }
      s.lastRender = t;
      s.lastTick = 0;
      s.queuedRender = frame.render(render);
      a.frameTimes.length = 0;
      if (s.timer) clearTimeout(s.timer);
    }
  }

  function wake() {
    const s = sched.current;
    const a = anim.current;
    // Nothing to draw until the first heightmap is in (or if it never arrives).
    if (s.scheduled || document.hidden || s.paused || s.dialog || a.lost || !a.ready) return;
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
    // An open dialog (the case-study lightbox) covers the page: pause until it closes.
    const onDialogs = () => {
      const open = !!document.querySelector("dialog[open]");
      if (open === sched.current.dialog) return;
      sched.current.dialog = open;
      if (open) stop();
      else wake();
    };
    const dialogs = new MutationObserver(onDialogs);
    dialogs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });
    onDialogs();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      dialogs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- WebGL context loss -----------------------------------------------------------
  // The poster shows at once; the field tries one restore. A second loss this session hands the
  // backdrop to tier C (posters only) for the rest of the session.
  useEffect(() => {
    const canvas = gl.domElement;
    const lose = gl.getContext().getExtension("WEBGL_lose_context");
    let retry: ReturnType<typeof setTimeout> | 0 = 0;
    const onLost = (e: Event) => {
      e.preventDefault();
      const a = anim.current;
      a.lost = true;
      stop();
      const losses = countLoss();
      log({ type: "context-lost", losses });
      if (losses >= 2) markTierC();
      onContextLost(losses >= 2);
      if (losses >= 2) return;
      // The browser restores a context whose loss was prevented when it can; if it has not after
      // a second, ask once (this only works for a loss the page caused, e.g. in tests).
      retry = setTimeout(() => {
        if (!anim.current.lost) return;
        try {
          lose?.restoreContext();
        } catch {
          // A real GPU reset: only the browser can restore it.
        }
      }, 1000);
    };
    const onRestored = () => {
      const a = anim.current;
      a.lost = false;
      // three re-creates its GL state and uploads the textures again on the next render.
      a.readyNotified = false;
      log({ type: "context-restored" });
      wake();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      if (retry) clearTimeout(retry);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  useEffect(() => {
    if (paused) {
      stop();
    } else {
      wake();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // Calm: the map holds still; what is drawing lands.
  useEffect(() => {
    if (!calm) {
      updateIntervals(true);
      return;
    }
    // No draw-on in calm: what is drawing lands.
    timeline.set("reveal", 1);
    timeline.set("floor", 1);
    if (timeline.values.riverOpacity > 0) timeline.set("riverDraw", 1);
    timeline.set("ping", 0);
    updateIntervals(true);
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm]);

  useEffect(
    () => () => {
      stop();
      material.dispose();
      riverMaterial.dispose();
      river?.dispose();
    },
    [material, riverMaterial, river],
  );

  // --- preview-only debug hook (e2e scenarios, check:legibility) ---------------------
  useEffect(() => {
    if (!previewable) return;
    const u = material.uniforms;
    const lose = gl.getContext().getExtension("WEBGL_lose_context");
    const hook = {
      events: debugEvents.current,
      get frames() {
        return anim.current.frames;
      },
      state: () => {
        const a = anim.current;
        return {
          tier: profile.tier,
          dpr: dprRef.current,
          slots: [a.A?.src.id ?? (a.A ? "region" : null), a.B ? (a.B.src.id ?? "region") : null],
          values: { ...timeline.values },
          interval: u.uInterval.value as number,
          zoom: u.uZoom.value as number,
          riverVisible: !!riverMesh.current?.visible,
          pin: (u.uPinPos.value as THREE.Vector2).toArray(),
          routing: a.routing,
          lost: a.lost,
          paused: sched.current.paused || sched.current.dialog,
        };
      },
      loseContext: () => lose?.loseContext(),
      restoreContext: () => lose?.restoreContext(),
      /** Holds the field mid-morph towards `id` with the route hold on (check:legibility). */
      freeze: async (id: string | null, m: number) => {
        const a = anim.current;
        const src = sourceFor(id, profile);
        if (!a.A || !src) return false;
        const tex = await loadHeightmap(gl, src.map);
        setB({ src, tex, interval: a.A.interval });
        a.routing = true;
        a.holdVtDone = false;
        a.holdSeq++;
        timeline.set("morph", m);
        timeline.set("hold", 1);
        writeColumn();
        wake();
        return true;
      },
    };
    (window as unknown as { __terrain?: typeof hook }).__terrain = hook;
    return () => {
      delete (window as unknown as { __terrain?: typeof hook }).__terrain;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, gl]);

  const pinScratch = useMemo(() => new THREE.Vector2(), []);

  useFrame(() => {
    const a = anim.current;
    if (!a.ready || !a.A) return;
    const now = performance.now();
    const u = material.uniforms;
    timeline.update(now);
    const v = timeline.values;

    // A morph that has landed: the destination becomes the terrain on screen.
    if (!timeline.busy("morph")) {
      if (v.morph >= 1 && a.B) {
        a.A = a.B;
        a.B = null;
        bind("A", a.A);
        bind("B", a.A);
        timeline.set("morph", 0);
        updateIntervals(false);
      } else if (v.morph <= 0 && a.B && a.prewarmId === undefined) {
        // Back where it started (a reversed route, a pre-warm let go): release slot B.
        setB(null);
      }
      if (a.routing && !a.loading && !a.B) a.routing = false;
    }
    // The terrain on screen once a route has landed (backdrop data-terrain).
    if (!a.routing) {
      const shown = a.A.src.id;
      if (fieldStore.get().shownTerrain !== shown) fieldStore.set({ shownTerrain: shown });
    }
    // The quiet-zone hold lets go once the View Transition and the field's own motion are over.
    if (v.hold > 0 && a.holdVtDone && !a.routing && !timeline.busy("reveal") && !timeline.busy("hold")) {
      timeline.play([{ channel: "hold", to: 0, delay: 0, duration: duration.medium, easing: "trail" }], now);
    }

    u.uMorph.value = v.morph;
    u.uReveal.value = v.reveal;
    u.uRevealFloor.value = v.floor;
    u.uQuietHold.value = v.hold;
    // Contour interval: each slot's own (from its interval set), blended in log space with the
    // shader's smoothstep, plus a glide after a resize.
    const ln = lnBlend(v.morph) + tweenValue(a.glide, now, 0);
    if (a.glide && tweenDone(a.glide, now)) a.glide = null;
    a.lnShown = ln;
    u.uInterval.value = Math.exp(ln);
    // Camera: a card's terrain is pushed in (full motion); the zoom follows the morph.
    const zA = zoomOf(a.A);
    const zB = a.B ? zoomOf(a.B) : zA;
    u.uZoom.value = zA + (zB - zA) * v.morph;
    // The map holds still while the page is read: no drift, line flow, headlamp or parallax.

    // Bern: the Aare and the zero-point pin follow the slot Bern is in.
    const bernUv = a.A.src.id === BERN ? (u.uUvA.value as THREE.Vector4) : a.B?.src.id === BERN ? (u.uUvB.value as THREE.Vector4) : null;
    const mesh = riverMesh.current;
    if (mesh) mesh.visible = !!bernUv && v.riverOpacity > 0;
    if (bernUv) {
      const r = riverMaterial.uniforms;
      (r.uUv.value as THREE.Vector4).copy(bernUv);
      r.uDraw.value = v.riverDraw;
      r.uOpacity.value = v.riverOpacity * fieldStore.get().config.river.opacity;
      // Terrain coordinates → device px, the inverse of the shader's mapping.
      const res = u.uResolution.value as THREE.Vector2;
      const pan = u.uPan.value as THREE.Vector2;
      const zoom = u.uZoom.value as number;
      const px = (bern.zeroPoint.u - bernUv.z) / bernUv.x;
      const py = 1 - (bern.zeroPoint.v - bernUv.w) / bernUv.y;
      pinScratch.set(((px - pan.x - 0.5) * zoom + 0.5) * res.x, ((py - pan.y - 0.5) * zoom + 0.5) * res.y);
      u.uPinPos.value.copy(pinScratch);
      u.uPinStrength.value = v.pin;
      u.uPinPing.value = v.ping;
    } else {
      u.uPinStrength.value = 0;
      u.uPinPing.value = 0;
    }

    if (!a.readyNotified) {
      a.readyNotified = true;
      // Reveal once this frame has actually been drawn.
      frame.postRender(() => onReady());
    }
  });

  return (
    <>
      <mesh frustumCulled={false} material={material}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      {river && <mesh ref={riverMesh} frustumCulled={false} geometry={river} material={riverMaterial} renderOrder={1} visible={false} />}
    </>
  );
}

export default function ContourField({ profile, paused, calm, onReady, onContextLost }: FieldProps) {
  // Tier A: up to the DPR cap; tier B: a fixed 0.75 drawing-buffer scale at DPR 1.
  const dpr: number | [number, number] = profile.renderScale === 1 ? [1, profile.dprMax] : profile.dprMax * profile.renderScale;
  return (
    <Canvas
      orthographic
      frameloop="never"
      dpr={dpr}
      flat
      linear
      gl={{ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <Field profile={profile} paused={paused} calm={calm} onReady={onReady} onContextLost={onContextLost} />
    </Canvas>
  );
}
