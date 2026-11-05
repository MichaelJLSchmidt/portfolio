/**
 * The contour field ("living survey"): one full-screen WebGL2 quad that draws real swisstopo
 * contours, shared by the site (src/field/index.ts) and the password gate (scripts/site/holding.mjs
 * inlines this file). It has no imports on purpose: the gate's generator strips the types and
 * inlines it under a hash-pinned CSP. Every number it needs arrives in `FieldOptions`.
 *
 * What it draws: regular lines 1 px, every fifth an index line at 1.5 px, anti-aliased with
 * fract/fwidth; lines that crowd closer than ~2 px fade instead of aliasing. Quiet zones behind
 * text fade lines to `quiet.strength` with a feathered edge.
 *
 * How it moves (all of it calm, docs/motion.md):
 * - drift: a slow Lissajous offset, at most `ambient.driftPx` from rest, no faster than 2 px/s,
 *   loops of 120 s and more;
 * - breath: the iso levels shift by ±0.15 of the contour interval on a 24 s sine (32 s on touch);
 * - pointer (fine pointers only): a Gaussian bump at a lerped pointer (0.06 a frame at 60 fps),
 *   ~180 px wide, bending lines by at most `bumpPx`; its strength follows the pointer's speed on a
 *   bounce-free spring (stiffness 60, damping 18), settles to 40 % while the pointer rests and to
 *   0 when it leaves;
 * - a page change: dim to 60 % (0–400 ms), then crossfade to the next terrain's lines and back to
 *   full strength (400–1600 ms). Two slots, A on screen and B the destination.
 *
 * Frames: on demand. About 30 fps while only drift and breath run, 60 fps while the bump or a
 * crossfade moves, none while the tab is hidden, the canvas is off-screen, a dialog is open or
 * the tier is Off (`setPaused`).
 */

export type HeightmapSource = {
  /** Image URL (lossless WebP, heights packed in R (high) and G (low)). */
  image: string;
  /** Raw fallback URL (gzip of gradient-coded 16-bit heights), when the image decode is altered. */
  raw?: string;
  width: number;
  height: number;
  /** h = offset + (R * 65280 + G * 255) * scale, R and G in 0..1. */
  offset: number;
  scale: number;
  /** [x, y, R, G] reference texels: the upload is read back and compared once a session. */
  probe?: number[][];
  /** The raster's hash: a passed check is remembered per session under it. */
  sha?: string;
  /** Gradient at the 95th percentile, metres per texel: picks the contour interval. */
  steepM: number;
  /** The terrain's contour intervals (metres), finest first. */
  intervals: readonly number[];
  /** Where the cover crop is anchored (0..1), and on portrait screens if different. */
  focus: { u: number; v: number; uPortrait?: number };
};

export type FieldOptions = {
  ground: [number, number, number];
  lineColor: [number, number, number];
  lineAlpha: number;
  indexAlpha: number;
  lineWidthPx: number;
  indexWidthPx: number;
  indexEvery: number;
  /** Lines on steep terrain stay at least this many CSS px apart. */
  minSpacingPx: number;
  /** A slight zoom, so the drift never shows an edge. */
  zoom: number;
  dprMax: number;
  quiet: { strength: number; featherPx: number };
  ambient: { driftPx: number; driftPeriodsS: [number, number]; breath: number; breathPeriodS: number };
  bump: { radiusPx: number; maxPx: number; lerp: number; rest: number; speedPxS: number; stiffness: number; damping: number };
  route: { dimTo: number; dimMs: number; fadeMs: number };
  /** Frames per second while only the ambient motion runs. */
  idleFps: number;
};

/** What the field does now: "full", "calm" (half drift, no breath, half bump), "touch" (half drift, slower breath, no bump). */
export type FieldMotion = { drift: number; breath: number; breathPeriodS: number; bump: number };

export type QuietRect = { left: number; top: number; right: number; bottom: number };

const MAX_QUIET = 24;

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uHeightA;
uniform sampler2D uHeightB;
uniform vec2 uEncA;
uniform vec2 uEncB;
uniform vec4 uUvA;
uniform vec4 uUvB;
uniform float uIntervalA;
uniform float uIntervalB;
uniform float uMix;
uniform float uDim;
uniform float uBreath;
uniform vec2 uDrift;
uniform vec4 uBump;
uniform vec2 uResolution;
uniform float uLineWidth;
uniform float uIndexWidth;
uniform float uLineAlpha;
uniform float uIndexAlpha;
uniform float uIndexEvery;
uniform vec3 uGround;
uniform vec3 uLine;
uniform vec4 uQuiet[${MAX_QUIET}];
uniform int uQuietCount;
uniform float uQuietStrength;
uniform float uQuietFeather;
out vec4 outColor;

float heightAt(sampler2D t, vec2 enc, vec2 uv) {
  vec2 rg = texture(t, uv).rg;
  return enc.x + (rg.r * 65280.0 + rg.g * 255.0) * enc.y;
}

float lineMask(float d, float w) {
  return 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, d);
}

// The strength of the lines at one terrain: regular and index, anti-aliased with fract/fwidth.
float contours(sampler2D t, vec2 enc, vec4 uvT, float interval, vec2 st) {
  float h = heightAt(t, enc, st * uvT.xy + uvT.zw);
  float level = h / interval + uBreath;
  float fw = max(fwidth(level), 1e-5);
  float dReg = abs(fract(level - 0.5) - 0.5) / fw;
  float idx = level / uIndexEvery;
  float fwIdx = fw / uIndexEvery;
  float dIdx = abs(fract(idx - 0.5) - 0.5) / fwIdx;
  // Where lines crowd closer than ~2 px (cliffs) they fade instead of aliasing into noise.
  float reg = lineMask(dReg, uLineWidth) * (1.0 - smoothstep(0.22, 0.55, fw)) * uLineAlpha;
  float ind = lineMask(dIdx, uIndexWidth) * (1.0 - smoothstep(0.22, 0.55, fwIdx)) * uIndexAlpha;
  return max(reg, ind);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  // The pointer bump: lines near the pointer bend outwards by at most uBump.w device px.
  vec2 d = frag - uBump.xy;
  float r2 = dot(d, d);
  float g = exp(-r2 / (2.0 * uBump.z * uBump.z));
  vec2 dir = r2 > 1e-4 ? d * inversesqrt(r2) : vec2(0.0);
  vec2 p = frag - dir * uBump.w * g - uDrift;
  vec2 st = p / uResolution;
  st.y = 1.0 - st.y;
  float a = mix(contours(uHeightA, uEncA, uUvA, uIntervalA, st), contours(uHeightB, uEncB, uUvB, uIntervalB, st), uMix);
  // Quiet zones: lines fade to uQuietStrength inside each rectangle, feathered outwards.
  float keep = 1.0;
  for (int i = 0; i < ${MAX_QUIET}; i++) {
    if (i >= uQuietCount) break;
    vec4 r = uQuiet[i];
    vec2 outside = max(max(r.xy - frag, frag - r.zw), 0.0);
    float q = 1.0 - smoothstep(0.0, uQuietFeather, length(outside));
    keep = min(keep, mix(1.0, uQuietStrength, q));
  }
  outColor = vec4(mix(uGround, uLine, a * keep * uDim), 1.0);
}`;

export type Terrain = { source: HeightmapSource; tex: WebGLTexture };

/** The contour interval for a terrain as drawn: the finest that keeps steep lines `minSpacingPx` apart. */
export function contourInterval(src: HeightmapSource, viewW: number, viewH: number, zoom: number, minSpacingPx: number): number {
  const va = viewW / viewH;
  const ta = src.width / src.height;
  const visibleTexels = src.width * (va > ta ? 1 : va / ta);
  const texelsPerPx = visibleTexels / (zoom * Math.max(viewW, 1));
  const needed = minSpacingPx * src.steepM * texelsPerPx;
  return src.intervals.find((i) => i >= needed) ?? src.intervals[src.intervals.length - 1];
}

/** Cover-fit a texture into the view, anchored at the focus, zoomed in slightly: uv = st * xy + zw. */
export function coverTransform(viewW: number, viewH: number, src: HeightmapSource, zoom: number): [number, number, number, number] {
  const va = viewW / viewH;
  const ta = src.width / src.height;
  const sx = (va > ta ? 1 : va / ta) / zoom;
  const sy = (va > ta ? ta / va : 1) / zoom;
  const u = viewW <= viewH ? (src.focus.uPortrait ?? src.focus.u) : src.focus.u;
  return [sx, sy, u * (1 - sx), src.focus.v * (1 - sy)];
}

/**
 * The drift at time t (s): a Lissajous offset in CSS px, zero at t = 0 (the poster's frame). Its
 * speed never exceeds 2π·A/T on either axis.
 */
export function driftAt(t: number, amplitudePx: number, [tx, ty]: [number, number]): [number, number] {
  return [amplitudePx * Math.sin((2 * Math.PI * t) / tx), amplitudePx * Math.sin((2 * Math.PI * t) / ty)];
}

/** The breath at time t (s): the iso levels' offset in contour intervals. */
export const breathAt = (t: number, amount: number, periodS: number) => (amount ? amount * Math.sin((2 * Math.PI * t) / periodS) : 0);

/** One step of a bounce-free spring (semi-implicit Euler, sub-stepped). */
export function springStep(x: number, v: number, target: number, dt: number, k: number, c: number): [number, number] {
  const steps = Math.max(1, Math.ceil(dt / 0.008));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    v += (k * (target - x) - c * v) * h;
    x += v * h;
  }
  return [x, v];
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// --- heightmaps ---------------------------------------------------------------------------------

function uploadRGBA(gl: WebGL2RenderingContext, image: TexImageSource): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
  setFilters(gl);
  return tex;
}

function uploadRG(gl: WebGL2RenderingContext, data: Uint8Array, w: number, h: number): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, w, h, 0, gl.RG, gl.UNSIGNED_BYTE, data);
  setFilters(gl);
  return tex;
}

function setFilters(gl: WebGL2RenderingContext) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/**
 * Reads the reference texels back from an uploaded texture: they must equal the packed values.
 * The read goes into a pixel buffer and is collected once a fence has passed, so it never stalls
 * the page (a plain readPixels waits for the GPU to finish everything queued, frames included).
 */
function probeOk(gl: WebGL2RenderingContext, tex: WebGLTexture, probe: number[][] | undefined): Promise<boolean> {
  if (!probe?.length) return Promise.resolve(true);
  // RGBA8 and RG8 are always colour-renderable in WebGL2, so the framebuffer isn't checked (that
  // check is a round trip that waits for the GPU too); if a read failed, the buffer stays zero and
  // the probe fails, which falls back safely.
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
  gl.bufferData(gl.PIXEL_PACK_BUFFER, probe.length * 4, gl.STREAM_READ);
  probe.forEach(([x, y], i) => gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, i * 4));
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fbo);
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!sync) {
    gl.deleteBuffer(buffer);
    return Promise.resolve(false);
  }
  gl.flush();
  return new Promise((done) => {
    const poll = () => {
      const state = gl.isContextLost() ? gl.WAIT_FAILED : gl.clientWaitSync(sync, 0, 0);
      if (state === gl.TIMEOUT_EXPIRED) return void setTimeout(poll, 8);
      gl.deleteSync(sync);
      let ok = state !== gl.WAIT_FAILED;
      if (ok) {
        const px = new Uint8Array(probe.length * 4);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, px);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        ok = probe.every(([, , r, g], i) => px[i * 4] === r && px[i * 4 + 1] === g);
      }
      gl.deleteBuffer(buffer);
      done(ok);
    };
    poll();
  });
}

/** The raw fallback: gzip(hi bytes, lo bytes) of zigzag residuals against a + b - c, as RG bytes. */
async function decodeRaw(url: string, width: number, height: number): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  let bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const n = width * height;
  if (bytes.length !== n * 2) throw new Error(`${url}: unexpected size`);
  const v = new Uint16Array(n);
  const rg = new Uint8Array(n * 2);
  for (let y = 0, i = 0; y < height; y++) {
    for (let x = 0; x < width; x++, i++) {
      const a = x > 0 ? v[i - 1] : y > 0 ? v[i - width] : 0;
      const b = y > 0 ? v[i - width] : a;
      const c = x > 0 && y > 0 ? v[i - width - 1] : b;
      const z = (bytes[i] << 8) | bytes[n + i];
      const h = (a + b - c + ((z >>> 1) ^ -(z & 1))) & 0xffff;
      v[i] = h;
      rg[i * 2] = h >> 8;
      rg[i * 2 + 1] = h & 255;
    }
  }
  return rg;
}

/** A decode that passed its check this session (checked once per terrain, not on every page). */
const checked = (src: HeightmapSource, path: string, ok?: boolean): boolean => {
  const key = `summit:hm-ok:${(src.sha ?? src.image).slice(0, 16)}:${path}`;
  try {
    if (ok) sessionStorage.setItem(key, "1");
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

async function loadTexture(gl: WebGL2RenderingContext, src: HeightmapSource): Promise<WebGLTexture> {
  const res = await fetch(src.image);
  if (!res.ok) throw new Error(`${src.image}: ${res.status}`);
  const bitmap = await createImageBitmap(await res.blob(), { premultiplyAlpha: "none", colorSpaceConversion: "none" });
  const tex = uploadRGBA(gl, bitmap);
  bitmap.close?.();
  if (checked(src, "image") || ((await probeOk(gl, tex, src.probe)) && checked(src, "image", true))) return tex;
  gl.deleteTexture(tex);
  if (!src.raw || typeof DecompressionStream !== "function") throw new Error(`${src.image}: no exact decode in this browser`);
  const raw = uploadRG(gl, await decodeRaw(src.raw, src.width, src.height), src.width, src.height);
  if (await probeOk(gl, raw, src.probe)) {
    console.warn(`[terrain] ${src.image} decoded to different heights in this browser; using the raw heights.`);
    return raw;
  }
  gl.deleteTexture(raw);
  throw new Error(`${src.image}: no exact decode in this browser`);
}

// --- the field ------------------------------------------------------------------------------------

export type Field = {
  /** Shows a terrain: the first at once, later ones through the route's dim and crossfade. */
  show(source: HeightmapSource): Promise<void>;
  setMotion(motion: FieldMotion): void;
  /** Off, a hidden tab or an open dialog: no frames. */
  setPaused(paused: boolean): void;
  setQuietZones(rects: readonly QuietRect[]): void;
  /** The pointer, in viewport CSS px (fine pointers only), or null when it left the page. */
  pointer(x: number | null, y: number | null): void;
  /** Draws one frame now at time t (s): the poster's frame is `frameAt(0)`. */
  frameAt(t: number): void;
  /** New tuning (the dev panel): lines, widths, quiet zones, motion. */
  retune(next: FieldOptions): void;
  resize(): void;
  /** Frames drawn so far (tests). */
  frames(): number;
  /** What the loop does now (tests): the active pace (bump, crossfade), a page change, paused. */
  state(): { active: boolean; routing: boolean; paused: boolean; bump: number };
  /** Tests (preview builds): pins a page change's crossfade at this progress (0..1); null lets it go on. */
  hold(progress: number | null): void;
  destroy(): void;
};

export function createField(canvas: HTMLCanvasElement, initial: FieldOptions, hooks: { onFirstFrame?: () => void; onLost?: () => void } = {}): Field | null {
  let opts = initial;
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: "low-power", preserveDrawingBuffer: false });
  if (!gl) return null;

  const program = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VERT],
    [gl.FRAGMENT_SHADER, FRAG],
  ] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    gl.attachShader(program, s);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link");
  gl.useProgram(program);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    hA: U("uHeightA"), hB: U("uHeightB"), encA: U("uEncA"), encB: U("uEncB"), uvA: U("uUvA"), uvB: U("uUvB"),
    iA: U("uIntervalA"), iB: U("uIntervalB"), mix: U("uMix"), dim: U("uDim"), breath: U("uBreath"), drift: U("uDrift"),
    bump: U("uBump"), res: U("uResolution"), lw: U("uLineWidth"), iw: U("uIndexWidth"), la: U("uLineAlpha"), ia: U("uIndexAlpha"),
    every: U("uIndexEvery"), ground: U("uGround"), line: U("uLine"), quiet: U("uQuiet"), quietN: U("uQuietCount"),
    quietS: U("uQuietStrength"), quietF: U("uQuietFeather"),
  };
  gl.uniform1i(u.hA, 0);
  gl.uniform1i(u.hB, 1);
  const applyStatics = () => {
    gl.uniform3f(u.ground, ...opts.ground);
    gl.uniform3f(u.line, ...opts.lineColor);
    gl.uniform1f(u.la, opts.lineAlpha);
    gl.uniform1f(u.ia, opts.indexAlpha);
    gl.uniform1f(u.every, opts.indexEvery);
    gl.uniform1f(u.quietS, opts.quiet.strength);
  };
  applyStatics();

  let A: Terrain | null = null;
  let B: Terrain | null = null;
  let view = { w: 1, h: 1, dpr: 1 };
  let motion: FieldMotion = { drift: 1, breath: 1, breathPeriodS: opts.ambient.breathPeriodS, bump: 1 };
  let paused = false;
  let quiet: readonly QuietRect[] = [];
  let frames = 0;
  let first = true;
  const t0 = performance.now();
  // The route: dim 0..1 (1 = dimmed), crossfade 0..1; `held` pins the crossfade (tests).
  const route = { start: -1, mix: 0, dim: 0 };
  let held: number | null = null;
  // The pointer bump.
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, inside: false, seen: false, speed: 0, amp: 0, vel: 0, target: 0, lastX: 0, lastY: 0, lastT: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, opts.dprMax);
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    view = { w, h, dpr };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(u.res, canvas.width, canvas.height);
    gl!.uniform1f(u.lw, opts.lineWidthPx * dpr);
    gl!.uniform1f(u.iw, opts.indexWidthPx * dpr);
    gl!.uniform1f(u.quietF, opts.quiet.featherPx * dpr);
    bindSlots();
    writeQuiet();
    wake();
  }

  function bindSlot(slot: Terrain, unit: number, enc: WebGLUniformLocation | null, uv: WebGLUniformLocation | null, interval: WebGLUniformLocation | null) {
    gl!.activeTexture(gl!.TEXTURE0 + unit);
    gl!.bindTexture(gl!.TEXTURE_2D, slot.tex);
    gl!.uniform2f(enc, slot.source.offset, slot.source.scale);
    gl!.uniform4f(uv, ...coverTransform(view.w, view.h, slot.source, opts.zoom));
    gl!.uniform1f(interval, contourInterval(slot.source, view.w, view.h, opts.zoom, opts.minSpacingPx));
  }

  function bindSlots() {
    if (!A) return;
    bindSlot(A, 0, u.encA, u.uvA, u.iA);
    bindSlot(B ?? A, 1, u.encB, u.uvB, u.iB);
  }

  function writeQuiet() {
    const n = Math.min(quiet.length, MAX_QUIET);
    const data = new Float32Array(MAX_QUIET * 4);
    const d = view.dpr;
    for (let i = 0; i < n; i++) {
      const r = quiet[i];
      // Viewport CSS px → device px, origin bottom-left like gl_FragCoord.
      data.set([r.left * d, (view.h - r.bottom) * d, r.right * d, (view.h - r.top) * d], i * 4);
    }
    gl!.uniform4fv(u.quiet, data);
    gl!.uniform1i(u.quietN, n);
  }

  // --- the loop ---------------------------------------------------------------------------------
  let raf = 0;
  let lastFrame = 0;
  let lastTick = 0;

  /** Something moves faster than the ambient motion: the bump or a page change. */
  const busy = () =>
    route.start >= 0 ||
    Math.abs(ptr.vel) > 1e-3 ||
    Math.abs(ptr.amp - ptr.target) > 1e-3 ||
    (ptr.amp > 1e-3 && (Math.abs(ptr.tx - ptr.x) > 0.25 || Math.abs(ptr.ty - ptr.y) > 0.25));
  const ambient = () => motion.drift > 0 || motion.breath > 0;

  function tick(now: number) {
    raf = 0;
    if (paused || !A) return;
    const dt = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 1 / 60;
    lastTick = now;
    const active = busy() || first;
    // Idle: ~30 fps for the drift and the breath alone.
    if (!active && now - lastFrame < 1000 / opts.idleFps - 2) {
      schedule();
      return;
    }
    step(now, active ? dt : (now - lastFrame) / 1000);
    draw((now - t0) / 1000);
    lastFrame = now;
    schedule();
  }

  function schedule() {
    if (raf || paused || !A) return;
    if (!ambient() && !busy()) return;
    raf = requestAnimationFrame(tick);
  }

  function wake() {
    if (paused || !A) return;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  /** Advances the pointer bump and the route by dt seconds. */
  function step(now: number, dt: number) {
    // The pointer: the bump's centre trails it (lerp per 60 fps frame), its strength springs to a
    // target set by the pointer's speed (at least the rest strength while inside).
    const k = 1 - Math.pow(1 - opts.bump.lerp, dt * 60);
    ptr.x += (ptr.tx - ptr.x) * k;
    ptr.y += (ptr.ty - ptr.y) * k;
    ptr.speed *= Math.pow(0.02, dt);
    ptr.target = ptr.inside && motion.bump > 0 ? Math.min(1, Math.max(opts.bump.rest, ptr.speed / opts.bump.speedPxS)) : 0;
    if (ptr.speed < 1) ptr.speed = 0;
    [ptr.amp, ptr.vel] = springStep(ptr.amp, ptr.vel, ptr.target, dt, opts.bump.stiffness, opts.bump.damping);
    if (!ptr.inside && ptr.amp < 1e-3 && Math.abs(ptr.vel) < 1e-3) ptr.amp = ptr.vel = 0;
    // The route: dim, then crossfade and undim.
    if (route.start >= 0) {
      const { dimMs, fadeMs, dimTo } = opts.route;
      const t = held !== null && B ? dimMs + held * fadeMs : now - route.start;
      if (t < dimMs) {
        route.dim = easeInOut(t / dimMs) * (1 - dimTo);
      } else if (!B) {
        route.dim = 1 - dimTo;
      } else {
        const p = Math.min(1, (t - dimMs) / fadeMs);
        route.mix = easeInOut(p);
        route.dim = (1 - easeInOut(p)) * (1 - dimTo);
        if (p >= 1) {
          A = B;
          B = null;
          route.mix = 0;
          route.dim = 0;
          route.start = -1;
          bindSlots();
        }
      }
    }
  }

  function draw(t: number) {
    const d = view.dpr;
    const [dx, dy] = driftAt(t, opts.ambient.driftPx * motion.drift, opts.ambient.driftPeriodsS);
    gl!.uniform2f(u.drift, dx * d, -dy * d);
    gl!.uniform1f(u.breath, breathAt(t, opts.ambient.breath * motion.breath, motion.breathPeriodS));
    gl!.uniform4f(u.bump, ptr.x * d, (view.h - ptr.y) * d, opts.bump.radiusPx * d, opts.bump.maxPx * motion.bump * ptr.amp * d);
    gl!.uniform1f(u.mix, route.mix);
    gl!.uniform1f(u.dim, 1 - route.dim);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    frames++;
    if (first) {
      first = false;
      hooks.onFirstFrame?.();
    }
  }

  // --- context loss -----------------------------------------------------------------------------
  const onLost = (e: Event) => {
    e.preventDefault();
    paused = true;
    hooks.onLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const cache = new Map<string, Promise<WebGLTexture>>();
  const texture = (src: HeightmapSource) => {
    let p = cache.get(src.image);
    if (!p) {
      p = loadTexture(gl!, src);
      cache.set(src.image, p);
      p.catch(() => cache.delete(src.image));
    }
    return p;
  };

  resize();

  return {
    async show(source) {
      if (A && A.source.image === source.image && !B) return;
      if (A) {
        // A page change: start dimming now; the crossfade follows once the terrain is ready.
        if (route.start >= 0 && B) {
          A = route.mix > 0.5 ? B : A;
          B = null;
          route.mix = 0;
          bindSlots();
        }
        route.start = performance.now();
        wake();
      }
      let tex: WebGLTexture;
      try {
        tex = await texture(source);
      } catch (err) {
        // The terrain can't be shown: the page keeps the current one at full strength.
        route.start = -1;
        route.dim = 0;
        wake();
        throw err;
      }
      if (!A) {
        A = { source, tex };
        bindSlots();
        wake();
        return;
      }
      if (A.source.image === source.image) {
        B = null;
        bindSlots();
        return;
      }
      B = { source, tex };
      // Loaded after the dim: the crossfade starts from here.
      const elapsed = performance.now() - route.start;
      if (elapsed > opts.route.dimMs) route.start = performance.now() - opts.route.dimMs;
      bindSlots();
      wake();
    },
    setMotion(next) {
      motion = next;
      wake();
    },
    hold(progress) {
      held = progress === null ? null : Math.min(0.999, Math.max(0, progress));
      wake();
    },
    setPaused(next) {
      paused = next;
      if (paused && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      lastTick = 0;
      wake();
    },
    setQuietZones(rects) {
      quiet = rects;
      writeQuiet();
      wake();
    },
    pointer(x, y) {
      const now = performance.now();
      if (x === null || y === null) {
        ptr.inside = false;
      } else {
        if (!ptr.seen) {
          ptr.x = ptr.tx = x;
          ptr.y = ptr.ty = y;
          ptr.seen = true;
        }
        if (ptr.lastT) {
          const dts = Math.max(0.008, (now - ptr.lastT) / 1000);
          const v = Math.hypot(x - ptr.lastX, y - ptr.lastY) / dts;
          ptr.speed = Math.max(ptr.speed * 0.6, v);
        }
        ptr.tx = x;
        ptr.ty = y;
        ptr.inside = true;
        ptr.lastX = x;
        ptr.lastY = y;
      }
      ptr.lastT = now;
      wake();
    },
    frameAt(t) {
      if (!A) return;
      draw(t);
    },
    retune(next) {
      opts = next;
      applyStatics();
      resize();
    },
    resize,
    frames: () => frames,
    state: () => ({ active: busy(), routing: route.start >= 0, paused, bump: ptr.amp }),
    destroy() {
      paused = true;
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
