import * as THREE from "three";
import { asset } from "@/lib/asset";

/**
 * Loads a heightmap texture and proves it decoded to the exact heights.
 *
 * The WebP is decoded as raw data (no colour-space conversion, no premultiplied alpha, no
 * flip). A browser could still alter the values, e.g. by ignoring colorSpaceConversion
 * "none". So once per heightmap per session, right after upload and before the field shows
 * it, its 16 reference texels (terrain.json `probe`) are read back from the uploaded texture
 * through a throwaway framebuffer: no shader, no draw, no wait on the GPU.
 *
 * On a mismatch the session switches to the raw fallback (`raw.file`): 16-bit heights,
 * gradient-coded and gzipped by the pipeline, decoded with DecompressionStream into a
 * DataTexture, where nothing can be colour-managed. That is checked the same way. If it is
 * unavailable or fails too, the field stays on the SVG poster. One console warning names the
 * browser and the mismatch.
 */
export type HeightmapMeta = {
  file: string;
  width: number;
  height: number;
  sha256: string;
  /** [x, y, R, G] reference texels from the packed raster. */
  probe: number[][];
  raw: { file: string };
};

type DecodePath = "image" | "raw" | "none";
type Probe = { ok: boolean; bad: number; first?: { x: number; y: number; want: [number, number]; got: [number, number] } };

const PATH_KEY = "summit:hm-decode";
const WARNED_KEY = "summit:hm-warned";
const okKey = (map: HeightmapMeta, path: DecodePath) => `summit:hm-ok:${map.sha256.slice(0, 16)}:${path}`;

// Session state lives in sessionStorage, mirrored in memory when storage is unavailable.
const memory = new Map<string, string>();
const read = (key: string) => {
  try {
    return sessionStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
};
const write = (key: string, value: string) => {
  memory.set(key, value);
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Memory only: the check simply runs again after a reload.
  }
};

const decodePath = (): DecodePath => (read(PATH_KEY) as DecodePath | null) ?? "image";

function browserName(): string {
  const ua = navigator.userAgent;
  const named = ua.match(/(Firefox|Edg|OPR|Chrome)\/(\d+)/);
  if (named) return `${{ Edg: "Edge", OPR: "Opera" }[named[1]] ?? named[1]} ${named[2]}`;
  const safari = ua.match(/Version\/([\d.]+).*Safari/);
  return safari ? `Safari ${safari[1]}` : ua;
}

// --- loading ---------------------------------------------------------------------------------

function loadImageTexture(url: string): Promise<THREE.Texture> {
  return new Promise<THREE.Texture>((resolve, reject) => {
    const done = (image: ImageBitmap | HTMLImageElement) => {
      const tex = new THREE.Texture(image);
      // Raw data, not colour: no colour-space conversion, no premultiplied alpha, no mipmaps,
      // and no flip anywhere (the bitmap keeps the file's row order, flipY stays false, the
      // shader samples top-down). `npm run verify:terrain -- --browser` checks this path.
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
}

/** The raw fallback: gzip(hi bytes, lo bytes) of zigzag residuals against a + b - c. */
async function loadRawTexture(url: string, width: number, height: number): Promise<THREE.Texture> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  let bytes = new Uint8Array(await res.arrayBuffer());
  // Our own gzip stream; a host's transfer compression is already undone by fetch.
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
  const tex = new THREE.DataTexture(rg, width, height, THREE.RGFormat, THREE.UnsignedByteType);
  tex.colorSpace = THREE.NoColorSpace;
  tex.flipY = false;
  tex.unpackAlignment = 1;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

// --- the check -------------------------------------------------------------------------------

/**
 * Reads the reference texels straight from the uploaded texture: attach it to a throwaway
 * framebuffer and copy each texel into a pixel-pack buffer, then fetch the bytes once a fence
 * says the GPU is done. No shader, no draw, and the main thread never waits for the GPU (the
 * upload is the one the field's first frame needs anyway). Framebuffer row y is texture row y
 * (no flip), as the shader sees it.
 */
async function readTexels(renderer: THREE.WebGLRenderer, tex: THREE.Texture, probe: number[][]): Promise<Uint8Array> {
  renderer.initTexture(tex);
  const gl = renderer.getContext() as WebGL2RenderingContext;
  const handle = (renderer.properties.get(tex) as { __webglTexture?: WebGLTexture }).__webglTexture;
  const out = new Uint8Array(probe.length * 4);
  if (!handle) return out;
  const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
  const fbo = gl.createFramebuffer();
  const pbo = gl.createBuffer();
  let sync: WebGLSync | null = null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
  try {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, handle, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      gl.bufferData(gl.PIXEL_PACK_BUFFER, out.length, gl.STREAM_READ);
      probe.forEach(([x, y], i) => gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, i * 4));
      sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
    }
  } finally {
    // Restore three's bindings exactly, so its state cache stays right.
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
    gl.deleteFramebuffer(fbo);
  }
  if (sync) {
    while (gl.clientWaitSync(sync, 0, 0) === gl.TIMEOUT_EXPIRED) await new Promise((r) => setTimeout(r, 4));
    gl.deleteSync(sync);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
    gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, out);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
  }
  gl.deleteBuffer(pbo);
  return out;
}

async function check(gl: THREE.WebGLRenderer, tex: THREE.Texture, map: HeightmapMeta, path: DecodePath): Promise<Probe> {
  if (read(okKey(map, path)) === "1") return { ok: true, bad: 0 };
  const px = await readTexels(gl, tex, map.probe);
  let bad = 0;
  let first: Probe["first"];
  map.probe.forEach(([x, y, r, g], i) => {
    if (px[i * 4] === r && px[i * 4 + 1] === g && px[i * 4 + 2] === 0) return;
    bad++;
    first ??= { x, y, want: [r, g], got: [px[i * 4], px[i * 4 + 1]] };
  });
  if (!bad) write(okKey(map, path), "1");
  return { ok: bad === 0, bad, first };
}

function warnOnce(map: HeightmapMeta, probe: Probe | null, outcome: string) {
  if (read(WARNED_KEY)) return;
  write(WARNED_KEY, "1");
  const detail = probe?.first
    ? `texel ${probe.first.x},${probe.first.y}: R/G ${probe.first.want.join("/")} expected, ${probe.first.got.join("/")} decoded; ${probe.bad} of ${map.probe.length} reference texels differ`
    : "reference texels differ";
  console.warn(`[terrain] ${browserName()} decoded ${map.file.replace(/.*\//, "")} to different heights (${detail}). ${outcome}`);
}

// --- entry point -----------------------------------------------------------------------------

const cache = new Map<string, Promise<THREE.Texture>>();

/** A verified height texture, or a rejection when this session can only show the poster. */
export function loadHeightmap(gl: THREE.WebGLRenderer, map: HeightmapMeta): Promise<THREE.Texture> {
  let pending = cache.get(map.file);
  if (pending) return pending;
  pending = (async () => {
    let mismatch: Probe | null = null;
    if (decodePath() === "image") {
      const tex = await loadImageTexture(asset(map.file));
      const probe = await check(gl, tex, map, "image");
      if (probe.ok) return tex;
      tex.dispose();
      mismatch = probe;
      write(PATH_KEY, "raw");
    }
    if (decodePath() === "raw" && typeof DecompressionStream === "function") {
      const tex = await loadRawTexture(asset(map.raw.file), map.width, map.height);
      const probe = await check(gl, tex, map, "raw");
      if (probe.ok) {
        if (mismatch) warnOnce(map, mismatch, "Using the raw 16-bit heights for this session.");
        return tex;
      }
      tex.dispose();
      mismatch ??= probe;
    }
    write(PATH_KEY, "none");
    warnOnce(map, mismatch, "Showing the static contour map for this session.");
    throw new Error(`${map.file}: no exact decode in this browser`);
  })();
  cache.set(map.file, pending);
  // A failed load (offline, decode error) is not cached, so a later request can retry.
  pending.catch(() => cache.delete(map.file));
  return pending;
}
