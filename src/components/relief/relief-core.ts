/**
 * The relief fill (the site's one signature effect, after Heron's footer lens): a large bold title
 * fills with the sheet colour like terrain rising through a contour, its edge drawn as three mint
 * isolines over a faint grey band. Framework-free and without imports, so the gate inlines it (its
 * generator strips the types, scripts/site/holding.mjs). Every number arrives in ReliefOptions.
 *
 * Markup (ReliefFill.tsx, src/hosting/page.ts): a root holding a stack with the text twice, the
 * outline ([data-relief-text], a 1 px ring from an SVG morphology filter) and a fill copy
 * ([data-relief-fill], the sheet colour, for the CSS modes). attachRelief adds, inside the stack:
 *
 * - a construction layer (SVG, on top): baseline, x-height and cap-height guides overshooting the
 *   word by 24 px at half opacity, 6 px corner ticks on its box, 8 px crosshairs at glyph centres
 *   and the survey mark's coordinates in mono at the bottom right;
 * - in Full with WebGL2, a canvas under the outline: an elevation field E at a quarter of the
 *   CSS resolution, E = E·decay + stamps, lightly blurred each frame on the CPU, composited by a
 *   shader against the glyph mask (the text rasterised once the font is ready, and on resize).
 *
 * States (html[data-motion] picks the mode; the root's data-relief says which one runs):
 * - fine pointer: a lens at the pointer, lerped (0.09 a frame) so the fill lags, and a faster,
 *   slightly larger, weak second stamp (0.15) that softens the edge; while the pointer rests the
 *   field keeps rising and a glyph fills in about 1.2 s; on leave it decays (half-life 450 ms);
 * - keyboard focus: the fill grows from every glyph centre over 600 ms (plus the focus ring);
 * - press: the whole word fills in 120 ms;
 * - touch: once 60 % of it is in view, one survey pass sweeps left to right over 900 ms and stays;
 * - Calm: a 320 ms crossfade from outline to fill with one mint isoline ring (CSS);
 * - Off: the filled word, still (CSS);
 * - no WebGL2: a CSS radial mask on the fill copy, its radius animated.
 * The loop runs only while something moves and stops once nothing of the field shows.
 */
export type ReliefMode = "full" | "calm" | "still";

export type ReliefOptions = {
  mode: ReliefMode;
  /** A fine pointer (hover). Touch gets the survey pass. */
  fine: boolean;
  /** RGB 0..1. */
  colors: { sheet: [number, number, number]; glacier: [number, number, number]; band: [number, number, number] };
  /** The construction layer's ink (CSS colour) and the coordinates it prints. */
  ink: string;
  coordinates: string;
  dprMax: number;
  timing: { halfLifeMs: number; focusMs: number; pressMs: number; sweepMs: number; lerp: number; lerpFast: number; fillMs: number };
};

type Glyph = { x: number; y: number; ch: string; left: number; baseline: number };
type Line = { left: number; right: number; baseline: number; cap: number; xh: number };
type Metrics = { w: number; h: number; size: number; font: string; glyphs: Glyph[]; lines: Line[]; box: { l: number; t: number; r: number; b: number } };

const SVG = "http://www.w3.org/2000/svg";
const T = 1;
const MAX = 2;
/** Below this the field shows nothing (the grey band starts at T − 0.34): the loop stops and clears it. */
const VISIBLE = 0.6;

/** Where the glyphs sit, measured from the live text (ranges per character, canvas font metrics). */
function measure(stack: HTMLElement, text: HTMLElement): Metrics {
  const sr = stack.getBoundingClientRect();
  const cs = getComputedStyle(text);
  const size = parseFloat(cs.fontSize);
  const font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = font;
  const H = ctx.measureText("H");
  const cap = H.actualBoundingBoxAscent;
  const xh = ctx.measureText("x").actualBoundingBoxAscent;
  const ascent = H.fontBoundingBoxAscent;
  const glyphs: Glyph[] = [];
  const lines: Line[] = [];
  const node = [...text.childNodes].find((n) => n.nodeType === Node.TEXT_NODE) as Text | undefined;
  const range = document.createRange();
  const content = node?.data ?? "";
  for (let i = 0; node && i < content.length; i++) {
    const ch = content[i];
    if (!ch.trim()) continue;
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const r = range.getBoundingClientRect();
    const left = r.left - sr.left;
    const baseline = r.top - sr.top + ascent;
    glyphs.push({ ch, left, baseline, x: left + r.width / 2, y: baseline - cap / 2 });
    let line = lines.find((l) => Math.abs(l.baseline - baseline) < 1);
    if (!line) lines.push((line = { left, right: left + r.width, baseline, cap, xh }));
    line.left = Math.min(line.left, left);
    line.right = Math.max(line.right, left + r.width);
  }
  const box = lines.length
    ? { l: Math.min(...lines.map((l) => l.left)), r: Math.max(...lines.map((l) => l.right)), t: Math.min(...lines.map((l) => l.baseline - l.cap)), b: Math.max(...lines.map((l) => l.baseline)) }
    : { l: 0, t: 0, r: sr.width, b: sr.height };
  return { w: sr.width, h: sr.height, size, font, glyphs, lines, box };
}

/** The construction layer: guides, corner ticks, crosshairs and the coordinates. */
function construction(svg: SVGSVGElement, m: Metrics, opts: ReliefOptions) {
  svg.replaceChildren();
  svg.setAttribute("viewBox", `0 0 ${m.w} ${m.h}`);
  svg.setAttribute("width", String(m.w));
  svg.setAttribute("height", String(m.h));
  const el = (name: string, attrs: Record<string, string | number>) => {
    const e = document.createElementNS(SVG, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    svg.appendChild(e);
    return e;
  };
  const line = (x1: number, y1: number, x2: number, y2: number, opacity = 1) =>
    el("line", { x1, y1, x2, y2, stroke: opts.ink, "stroke-width": 1, "stroke-opacity": opacity, "vector-effect": "non-scaling-stroke", "shape-rendering": "crispEdges" });
  for (const l of m.lines) {
    for (const y of [l.baseline, l.baseline - l.xh, l.baseline - l.cap]) line(l.left - 24, Math.round(y) + 0.5, l.right + 24, Math.round(y) + 0.5, 0.5);
  }
  const { l, t, r, b } = m.box;
  const tick = 6;
  for (const [x, y, dx, dy] of [
    [l, t, 1, 1],
    [r, t, -1, 1],
    [l, b, 1, -1],
    [r, b, -1, -1],
  ]) {
    line(x, y, x + dx * tick, y);
    line(x, y, x, y + dy * tick);
  }
  for (const g of m.glyphs) {
    line(g.x - 4, g.y, g.x + 4, g.y);
    line(g.x, g.y - 4, g.x, g.y + 4);
  }
  const label = el("text", { x: r, y: b + 18, "text-anchor": "end", fill: opts.ink, "font-family": "var(--font-mono, ui-monospace), monospace", "font-size": 11, "letter-spacing": "0.08em" });
  label.textContent = opts.coordinates;
}

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5); gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uMask;
uniform sampler2D uField;
uniform vec3 uSheet;
uniform vec3 uMint;
uniform vec3 uBand;
uniform float uDpr;
in vec2 vUv;
out vec4 outColor;
float iso(float e, float level, float w) {
  float d = abs(e - level) / max(w, 1e-5);
  return 1.0 - smoothstep(0.5 * uDpr - 0.5, 0.5 * uDpr + 0.5, d);
}
void main() {
  float m = texture(uMask, vUv).a;
  if (m <= 0.002) { outColor = vec4(0.0); return; }
  float e = texture(uField, vUv).r;
  float w = fwidth(e);
  float fill = smoothstep(${T.toFixed(1)} - w, ${T.toFixed(1)} + w, e);
  float band = smoothstep(${(T - 0.34).toFixed(2)}, ${(T - 0.3).toFixed(2)}, e) * (1.0 - fill);
  float lines = max(max(iso(e, ${(T - 0.08).toFixed(2)}, w), iso(e, ${(T - 0.16).toFixed(2)}, w)), iso(e, ${(T - 0.24).toFixed(2)}, w)) * (1.0 - fill);
  vec3 col = uBand;
  float a = band * 0.16;
  col = mix(col, uMint, lines);
  a = max(a, lines * 0.95);
  col = mix(col, uSheet, fill);
  a = max(a, fill) * m;
  outColor = vec4(col * a, a);
}`;

type Gl = {
  gl: WebGL2RenderingContext;
  mask: WebGLTexture;
  field: WebGLTexture;
  dpr: number;
  u: Record<string, WebGLUniformLocation | null>;
};

function setupGl(canvas: HTMLCanvasElement, opts: ReliefOptions): Gl | null {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  const program = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VERT],
    [gl.FRAGMENT_SHADER, FRAG],
  ] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    gl.attachShader(program, s);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = (unit: number) => {
    const t = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const mask = tex(0);
  const field = tex(1);
  const u = Object.fromEntries(["uMask", "uField", "uSheet", "uMint", "uBand", "uDpr"].map((n) => [n, gl.getUniformLocation(program, n)]));
  gl.uniform1i(u.uMask, 0);
  gl.uniform1i(u.uField, 1);
  gl.uniform3fv(u.uSheet, opts.colors.sheet);
  gl.uniform3fv(u.uMint, opts.colors.glacier);
  gl.uniform3fv(u.uBand, opts.colors.band);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  return { gl, mask, field, dpr: 1, u };
}

/**
 * Attaches the relief fill to `root` (it must hold [data-relief-stack] with [data-relief-text]).
 * Returns a cleanup that removes everything it added.
 */
export function attachRelief(root: HTMLElement, opts: ReliefOptions): () => void {
  const stack = root.querySelector<HTMLElement>("[data-relief-stack]");
  const text = root.querySelector<HTMLElement>("[data-relief-text]");
  if (!stack || !text) return () => {};
  const svg = document.createElementNS(SVG, "svg") as SVGSVGElement;
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("data-relief-construction", "");
  stack.appendChild(svg);
  const cleanups: (() => void)[] = [() => svg.remove()];
  const set = (state: string) => root.setAttribute("data-relief", state);

  let m = measure(stack, text);
  construction(svg, m, opts);

  // Calm and Off: CSS alone (the fill copy, the ring); the construction layer stays.
  const css = opts.mode !== "full";
  let canvas: HTMLCanvasElement | null = null;
  let g: Gl | null = null;
  if (!css) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.setAttribute("data-relief-canvas", "");
    stack.insertBefore(canvas, stack.firstChild);
    g = setupGl(canvas, opts);
    if (!g) {
      canvas.remove();
      canvas = null;
    } else cleanups.push(() => canvas?.remove());
  }
  set(css ? opts.mode : g ? "gl" : "mask");

  // --- the field (Full with WebGL2) ---------------------------------------------------------------
  let fw = 1;
  let fh = 1;
  let E = new Float32Array(1);
  let tmp = new Float32Array(1);
  const Q = 4;
  const resizeField = () => {
    fw = Math.max(1, Math.ceil(m.w / Q));
    fh = Math.max(1, Math.ceil(m.h / Q));
    E = new Float32Array(fw * fh);
    tmp = new Float32Array(fw * fh);
  };
  const rasterise = () => {
    if (!g || !canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, opts.dprMax);
    g.dpr = dpr;
    canvas.width = Math.max(1, Math.round(m.w * dpr));
    canvas.height = Math.max(1, Math.round(m.h * dpr));
    const mask = document.createElement("canvas");
    mask.width = canvas.width;
    mask.height = canvas.height;
    const c = mask.getContext("2d")!;
    c.scale(dpr, dpr);
    c.font = m.font;
    c.fillStyle = "#fff";
    c.textBaseline = "alphabetic";
    for (const gl of m.glyphs) c.fillText(gl.ch, gl.left, gl.baseline);
    const { gl } = g;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, g.mask);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    gl.uniform1f(g.u.uDpr, dpr);
  };
  resizeField();
  rasterise();

  /** Adds a Gaussian stamp of peak `amp` at (x, y) CSS px, radius r (σ = r / 2). */
  const stamp = (x: number, y: number, r: number, amp: number) => {
    const s = r / 2 / Q;
    const cx = x / Q;
    const cy = y / Q;
    const x0 = Math.max(0, Math.floor(cx - 3 * s));
    const x1 = Math.min(fw - 1, Math.ceil(cx + 3 * s));
    const y0 = Math.max(0, Math.floor(cy - 3 * s));
    const y1 = Math.min(fh - 1, Math.ceil(cy + 3 * s));
    const k = 1 / (2 * s * s);
    for (let j = y0; j <= y1; j++) {
      const dy = j + 0.5 - cy;
      for (let i = x0; i <= x1; i++) {
        const dx = i + 0.5 - cx;
        const idx = j * fw + i;
        E[idx] = Math.min(MAX, E[idx] + amp * Math.exp(-(dx * dx + dy * dy) * k));
      }
    }
  };
  /** A light blur (1-2-1 across and down) keeps the edge smooth; returns the field's maximum. */
  const blur = () => {
    let max = 0;
    for (let j = 0; j < fh; j++) {
      const row = j * fw;
      for (let i = 0; i < fw; i++) tmp[row + i] = 0.25 * E[row + Math.max(0, i - 1)] + 0.5 * E[row + i] + 0.25 * E[row + Math.min(fw - 1, i + 1)];
    }
    for (let j = 0; j < fh; j++) {
      const up = Math.max(0, j - 1) * fw;
      const row = j * fw;
      const down = Math.min(fh - 1, j + 1) * fw;
      for (let i = 0; i < fw; i++) {
        const v = 0.25 * tmp[up + i] + 0.5 * tmp[row + i] + 0.25 * tmp[down + i];
        E[row + i] = v;
        if (v > max) max = v;
      }
    }
    return max;
  };

  const t = opts.timing;
  const lens = () => 0.55 * m.size;
  const pointer = { x: 0, y: 0, on: false };
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 0, y: 0 };
  let focusStart = -1;
  let pressStart = -1;
  let sweepStart = -1;
  let held = false;
  let frame = 0;
  let last = 0;

  const draw = () => {
    if (!g) return;
    const { gl } = g;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, g.field);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, fw, fh, 0, gl.RED, gl.FLOAT, E);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const tick = (now: number) => {
    frame = 0;
    const dt = Math.min(100, last ? now - last : 16.7);
    last = now;
    const f = dt / 16.7;
    if (!held) {
      const decay = Math.pow(0.5, dt / t.halfLifeMs);
      for (let i = 0; i < E.length; i++) E[i] *= decay;
    }
    // Amplitude per frame so a glyph under a resting pointer fills in about fillMs.
    const amp = 0.11 * f * (1200 / t.fillMs);
    if (pointer.on) {
      const a1 = 1 - Math.pow(1 - t.lerp, f);
      const a2 = 1 - Math.pow(1 - t.lerpFast, f);
      p1.x += (pointer.x - p1.x) * a1;
      p1.y += (pointer.y - p1.y) * a1;
      p2.x += (pointer.x - p2.x) * a2;
      p2.y += (pointer.y - p2.y) * a2;
      stamp(p1.x, p1.y, lens(), amp);
      stamp(p2.x, p2.y, lens() * 1.05, amp * 0.35);
    }
    if (focusStart >= 0) {
      const p = Math.min(1, (now - focusStart) / t.focusMs);
      for (const gl of m.glyphs) stamp(gl.x, gl.y, 0.6 * m.size, 0.12 * f * (0.5 + p));
    }
    if (pressStart >= 0) {
      const add = (MAX * dt) / t.pressMs;
      for (let i = 0; i < E.length; i++) E[i] = Math.min(MAX, E[i] + add);
      if (now - pressStart > t.pressMs) pressStart = -1;
    }
    if (sweepStart >= 0) {
      // The survey pass: a soft front moves left to right; behind it the word is filled and stays.
      const p = Math.min(1, (now - sweepStart) / t.sweepMs);
      const front = (m.box.l - 0.5 * m.size + p * (m.box.r - m.box.l + m.size)) / Q;
      const soft = (0.5 * m.size) / Q;
      for (let j = 0; j < fh; j++)
        for (let i = 0; i < fw; i++) {
          const v = 1.6 * Math.min(1, Math.max(0, (front - i) / soft));
          if (v > E[j * fw + i]) E[j * fw + i] = v;
        }
      if (p >= 1) {
        sweepStart = -1;
        held = true;
      }
    }
    const max = blur();
    draw();
    if (pointer.on || focusStart >= 0 || pressStart >= 0 || sweepStart >= 0 || (!held && max > VISIBLE)) frame = requestAnimationFrame(tick);
    else {
      last = 0;
      if (!held) {
        E.fill(0);
        draw();
      }
    }
  };
  const run = () => {
    if (!frame && g) frame = requestAnimationFrame(tick);
  };
  cleanups.push(() => cancelAnimationFrame(frame));

  // --- inputs -------------------------------------------------------------------------------------
  const listen = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    root.addEventListener(type, fn as EventListener);
    cleanups.push(() => root.removeEventListener(type, fn as EventListener));
  };
  const local = (e: PointerEvent) => {
    const r = stack.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  if (opts.mode === "full" && opts.fine) {
    listen("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      const p = local(e);
      Object.assign(pointer, p, { on: true });
      Object.assign(p1, p);
      Object.assign(p2, p);
      if (g) run();
      else {
        root.style.setProperty("--relief-x", `${p.x}px`);
        root.style.setProperty("--relief-y", `${p.y}px`);
        root.setAttribute("data-relief-on", "");
      }
    });
    listen("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const p = local(e);
      Object.assign(pointer, p);
      if (!g) {
        root.style.setProperty("--relief-x", `${p.x}px`);
        root.style.setProperty("--relief-y", `${p.y}px`);
      }
    });
    listen("pointerleave", () => {
      pointer.on = false;
      root.removeAttribute("data-relief-on");
      root.removeAttribute("data-relief-pressed");
    });
  }
  if (opts.mode === "full") {
    listen("focus", () => {
      if (!root.matches(":focus-visible")) return;
      focusStart = performance.now();
      root.setAttribute("data-relief-on", "");
      run();
    });
    listen("blur", () => {
      focusStart = -1;
      root.removeAttribute("data-relief-pressed");
      if (!pointer.on) root.removeAttribute("data-relief-on");
    });
    listen("pointerdown", () => {
      pressStart = performance.now();
      root.setAttribute("data-relief-pressed", "");
      run();
    });
    listen("keydown", (e) => {
      if (e.key !== "Enter") return;
      pressStart = performance.now();
      root.setAttribute("data-relief-pressed", "");
      run();
    });
    if (!opts.fine && typeof IntersectionObserver === "function") {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((en) => en.isIntersecting)) return;
          io.disconnect();
          sweepStart = performance.now();
          root.setAttribute("data-relief-swept", "");
          run();
        },
        { threshold: 0.6 },
      );
      io.observe(stack);
      cleanups.push(() => io.disconnect());
    }
  }

  // Re-measure and re-rasterise when the size changes (and once the font has loaded).
  const remeasure = () => {
    m = measure(stack, text);
    construction(svg, m, opts);
    const keep = held;
    resizeField();
    rasterise();
    if (keep) {
      E.fill(1.6);
      draw();
    }
  };
  if (typeof ResizeObserver === "function") {
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) return void (first = false);
      remeasure();
    });
    ro.observe(stack);
    cleanups.push(() => ro.disconnect());
  }
  document.fonts?.ready.then(() => remeasure());

  return () => {
    for (const c of cleanups.reverse()) c();
    for (const a of ["data-relief", "data-relief-on", "data-relief-pressed", "data-relief-swept"]) root.removeAttribute(a);
  };
}
