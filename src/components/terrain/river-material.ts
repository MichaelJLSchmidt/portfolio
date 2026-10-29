import * as THREE from "three";
import type { ContourUniforms } from "./contour-material";

/**
 * The Aare: the only coloured line on the site (ice), drawn over the contour field when Bern is
 * on screen. A ribbon mesh whose vertices are points in the Bern terrain's coordinates (0..1,
 * from public/terrain/bern/bern.json), mapped to the screen exactly as the field samples its
 * heightmap (cover fit, zoom, pan) and widened there to a constant pixel width. It draws on
 * along its length in flow direction (uDraw) and fades as a whole (uOpacity); quiet zones break
 * it behind text like every other line.
 */
const vertexShader = /* glsl */ `
in vec2 aPoint;
in vec2 aPrev;
in vec2 aNext;
in float aSide;
in float aDist;

uniform vec4 uUv;         // the Bern slot's cover mapping (as uUvA/uUvB in the contour shader)
uniform vec2 uResolution; // device px
uniform vec2 uPan;
uniform float uZoom;
uniform float uHalfWidth; // device px

out float vAcross;
out float vDist;

// Terrain coordinates → device px (origin bottom-left): the inverse of the contour shader's
// gl_FragCoord → heightmap mapping.
vec2 toScreen(vec2 uv) {
  vec2 st = (uv - uUv.zw) / uUv.xy;
  vec2 p = vec2(st.x, 1.0 - st.y);
  return ((p - uPan - 0.5) * uZoom + 0.5) * uResolution;
}

void main() {
  vec2 here = toScreen(aPoint);
  vec2 a = normalize(here - toScreen(aPrev) + vec2(1e-6, 0.0));
  vec2 b = normalize(toScreen(aNext) - here + vec2(1e-6, 0.0));
  vec2 tangent = normalize(a + b + vec2(0.0, 1e-6));
  vec2 normal = vec2(-tangent.y, tangent.x);
  // Mitre, limited so sharp bends don't spike.
  float mitre = 1.0 / max(dot(normal, vec2(-a.y, a.x)), 0.5);
  float reach = uHalfWidth + 1.0;
  vec2 pos = here + normal * aSide * reach * mitre;
  vAcross = aSide * reach;
  vDist = aDist;
  gl_Position = vec4(pos / uResolution * 2.0 - 1.0, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

in float vAcross;
in float vDist;
out vec4 fragColor;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uDraw;      // 0..1 along the river
uniform float uHalfWidth;

#define MAX_QUIET 24
uniform vec4 uQuiet[MAX_QUIET];
uniform vec2 uQuietKind[MAX_QUIET];
uniform int uQuietCount;
uniform float uQuietHold;
uniform vec2 uHoldKind;
uniform vec4 uQuietColumn;

void main() {
  float edge = 1.0 - smoothstep(uHalfWidth - 0.5, uHalfWidth + 0.5, abs(vAcross));
  // A soft head where the line is drawing.
  float drawn = 1.0 - smoothstep(uDraw - 0.004, uDraw, vDist);
  float keep = 1.0;
  for (int i = 0; i < MAX_QUIET; i++) {
    if (i >= uQuietCount) break;
    vec4 r = uQuiet[i];
    vec2 kind = mix(uQuietKind[i], uHoldKind, uQuietHold);
    vec2 outside = max(max(r.xy - gl_FragCoord.xy, gl_FragCoord.xy - r.zw), 0.0);
    keep = min(keep, mix(1.0, kind.y, 1.0 - smoothstep(0.0, kind.x, length(outside))));
  }
  if (uQuietHold > 0.0) {
    vec2 outside = max(max(uQuietColumn.xy - gl_FragCoord.xy, gl_FragCoord.xy - uQuietColumn.zw), 0.0);
    keep = min(keep, mix(1.0, uHoldKind.y, (1.0 - smoothstep(0.0, uHoldKind.x, length(outside))) * uQuietHold));
  }
  float alpha = edge * drawn * keep * uOpacity;
  if (alpha <= 0.0) discard;
  fragColor = vec4(uColor, alpha);
}
`;

export type RiverUniforms = {
  [K in "uUv" | "uHalfWidth" | "uColor" | "uOpacity" | "uDraw"]: THREE.IUniform;
};

/**
 * River pieces (polylines in terrain coordinates, flow direction) → a ribbon geometry: two
 * vertices per point, with the neighbours for the screen-space normal and the distance along
 * the whole river (0..1, pieces in order) for the draw-on.
 */
export function riverGeometry(pieces: readonly (readonly (readonly number[])[])[], aspect = 1): THREE.BufferGeometry {
  const seg = (p: readonly number[], q: readonly number[]) => Math.hypot((q[0] - p[0]) * aspect, q[1] - p[1]);
  const total = pieces.reduce((s, l) => s + l.slice(1).reduce((t, p, i) => t + seg(l[i], p), 0), 0) || 1;
  const point: number[] = [], prev: number[] = [], next: number[] = [], side: number[] = [], dist: number[] = [], index: number[] = [];
  let run = 0;
  for (const line of pieces) {
    const base = point.length / 2;
    line.forEach((p, i) => {
      if (i > 0) run += seg(line[i - 1], p);
      const a = line[Math.max(i - 1, 0)], b = line[Math.min(i + 1, line.length - 1)];
      for (const s of [-1, 1]) {
        point.push(p[0], p[1]);
        prev.push(a[0], a[1]);
        next.push(b[0], b[1]);
        side.push(s);
        dist.push(run / total);
      }
      if (i > 0) {
        const v = base + i * 2;
        index.push(v - 2, v - 1, v, v - 1, v + 1, v);
      }
    });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("aPoint", new THREE.Float32BufferAttribute(point, 2));
  geometry.setAttribute("aPrev", new THREE.Float32BufferAttribute(prev, 2));
  geometry.setAttribute("aNext", new THREE.Float32BufferAttribute(next, 2));
  geometry.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 1));
  geometry.setAttribute("aDist", new THREE.Float32BufferAttribute(dist, 1));
  // three needs a position attribute to size the draw; the shader never reads it.
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array((point.length / 2) * 3), 3));
  geometry.setIndex(index);
  return geometry;
}

/** The river material shares the field's view and quiet-zone uniforms (same objects). */
export function createRiverMaterial(field: ContourUniforms): THREE.ShaderMaterial & { uniforms: RiverUniforms & Partial<ContourUniforms> } {
  const uniforms = {
    uUv: { value: new THREE.Vector4(1, 1, 0, 0) },
    uHalfWidth: { value: 0.75 },
    uColor: { value: new THREE.Vector3(1, 1, 1) },
    uOpacity: { value: 0 },
    uDraw: { value: 0 },
    uResolution: field.uResolution,
    uPan: field.uPan,
    uZoom: field.uZoom,
    uQuiet: field.uQuiet,
    uQuietKind: field.uQuietKind,
    uQuietCount: field.uQuietCount,
    uQuietHold: field.uQuietHold,
    uHoldKind: field.uHoldKind,
    uQuietColumn: field.uQuietColumn,
  };
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    uniforms,
    // The ribbon's triangles wind either way as the river bends.
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }) as THREE.ShaderMaterial & { uniforms: RiverUniforms & Partial<ContourUniforms> };
}
