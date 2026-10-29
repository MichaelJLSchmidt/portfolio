import * as THREE from "three";
import { headlamp } from "@/styles/tokens";

const FALLOFF = headlamp.falloff.toFixed(3);

/**
 * Full-screen contour shader. Heights come from RG-packed 16-bit WebPs; lines are drawn
 * at constant pixel width with fwidth(), so they stay crisp at any zoom or DPR.
 */
const vertexShader = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = uv;
  // The plane is 2×2 units, already covering clip space: no camera transform needed.
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uHeightA;
uniform sampler2D uHeightB;
uniform vec2 uEncA;        // offset, scale (metres)
uniform vec2 uEncB;
uniform vec4 uUvA;         // cover mapping: scale.xy, offset.zw
uniform vec4 uUvB;
uniform vec2 uRangeA;      // min, max elevation (metres)
uniform vec2 uRangeB;
uniform float uMorph;      // 0 = region, 1 = target terrain

uniform float uInterval;   // metres between lines
uniform float uIndexEvery; // every n-th line is an index line
uniform float uLineWidth;  // device px
uniform float uIndexWidth; // device px
uniform float uLineOpacity;
uniform float uIndexOpacity;
uniform vec3 uGround;
uniform vec3 uLineColor;
uniform vec3 uIndexColor;

uniform vec2 uHeadlampPos;    // device px, origin bottom-left
uniform float uHeadlampRadius; // device px
uniform float uHeadlampStrength; // 0..1, fades in and out
uniform float uHeadlampGain;  // lit lines reach this many times their strength
uniform float uSweepGain;     // the same for the intro sweep's leading edge

uniform float uSweep;  // 0..1 draw-on from lake level upward
uniform float uTime;   // seconds
uniform float uDrift;  // cycles per second

uniform vec2 uResolution;  // drawing buffer, device px
uniform vec2 uPan;         // map offset in UV (pointer + scroll parallax, slow drift)
uniform float uZoom;       // > 1 zooms in around the screen centre (camera push on morph)

#define MAX_QUIET 24
uniform vec4 uQuiet[MAX_QUIET];     // quiet zones behind text: left, bottom, right, top (device px)
uniform vec2 uQuietKind[MAX_QUIET]; // per zone: feather (device px), line strength inside (0..1)
uniform int uQuietCount;

float decodeHeight(sampler2D tex, vec2 uv, vec2 enc) {
  vec2 rg = texture(tex, uv).rg;
  return enc.x + (rg.r * 65280.0 + rg.g * 255.0) * enc.y;
}

// Coverage of a line of width w (px) at distance d (px) from its centre, ~1px anti-aliasing.
float lineMask(float d, float w) {
  return 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, d);
}

void main() {
  vec2 p = (gl_FragCoord.xy / uResolution - 0.5) / uZoom + 0.5 + uPan;
  vec2 st = vec2(p.x, 1.0 - p.y);
  float hA = decodeHeight(uHeightA, st * uUvA.xy + uUvA.zw, uEncA);
  float hB = decodeHeight(uHeightB, st * uUvB.xy + uUvB.zw, uEncB);
  float m = smoothstep(0.0, 1.0, uMorph);
  float h = mix(hA, hB, m);
  vec2 range = mix(uRangeA, uRangeB, m);

  float level = h / uInterval + uTime * uDrift;
  float fw = max(fwidth(level), 1e-5);

  // Distance to the nearest regular and index line, in device pixels.
  float dReg = abs(fract(level - 0.5) - 0.5) / fw;
  float idx = level / uIndexEvery;
  float fwIdx = fw / uIndexEvery;
  float dIdx = abs(fract(idx - 0.5) - 0.5) / fwIdx;

  // Where lines crowd closer than ~2px (cliffs), fade them instead of aliasing into noise.
  float crowdReg = 1.0 - smoothstep(0.22, 0.55, fw);
  float crowdIdx = 1.0 - smoothstep(0.22, 0.55, fwIdx);

  float reg = lineMask(dReg, uLineWidth) * crowdReg;
  float ind = lineMask(dIdx, uIndexWidth) * crowdIdx;

  // Headlamp: a soft Gaussian falloff around the pointer, reaching zero at the radius.
  float x = length(gl_FragCoord.xy - uHeadlampPos) / max(uHeadlampRadius, 1.0);
  float lit = max(exp(-${FALLOFF} * x * x) - exp(-${FALLOFF}), 0.0) / (1.0 - exp(-${FALLOFF})) * uHeadlampStrength;

  // Intro sweep: lines appear from the lowest ground upward, with a brighter leading edge.
  float sweepLevel = mix(range.x - 30.0, range.y + 60.0, uSweep);
  float revealed = 1.0 - smoothstep(sweepLevel - 60.0, sweepLevel, h);
  float front = exp(-abs(h - sweepLevel) / 45.0) * step(uSweep, 0.999) * revealed;

  // Quiet zones: lines fade to the zone's strength inside its rectangle, feathered outwards,
  // like contours interrupted under a map's labels. Headings keep ~25% of a line, body text
  // ~9%; where zones overlap, the stronger knockout wins.
  float keep = 1.0;
  for (int i = 0; i < MAX_QUIET; i++) {
    if (i >= uQuietCount) break;
    vec4 r = uQuiet[i];
    vec2 outside = max(max(r.xy - gl_FragCoord.xy, gl_FragCoord.xy - r.zw), 0.0);
    float q = 1.0 - smoothstep(0.0, uQuietKind[i].x, length(outside));
    keep = min(keep, mix(1.0, uQuietKind[i].y, q));
  }

  // Lit lines keep their colour and only gain strength: the map stays monochrome.
  float gain = max(mix(1.0, uHeadlampGain, lit), mix(1.0, uSweepGain, front));
  float aReg = min(reg * uLineOpacity * gain, 1.0) * keep;
  float aInd = min(ind * uIndexOpacity * gain, 1.0) * keep;

  vec3 col = uGround;
  col = mix(col, uLineColor, aReg * revealed);
  col = mix(col, uIndexColor, aInd * revealed);

  fragColor = vec4(col, 1.0);
}
`;

/** Must match MAX_QUIET in the fragment shader. */
export const MAX_QUIET_ZONES = 24;

export type ContourUniforms = {
  [K in
    | "uHeightA"
    | "uHeightB"
    | "uEncA"
    | "uEncB"
    | "uUvA"
    | "uUvB"
    | "uRangeA"
    | "uRangeB"
    | "uMorph"
    | "uInterval"
    | "uIndexEvery"
    | "uLineWidth"
    | "uIndexWidth"
    | "uLineOpacity"
    | "uIndexOpacity"
    | "uGround"
    | "uLineColor"
    | "uIndexColor"
    | "uHeadlampPos"
    | "uHeadlampRadius"
    | "uHeadlampStrength"
    | "uHeadlampGain"
    | "uSweepGain"
    | "uSweep"
    | "uTime"
    | "uDrift"
    | "uResolution"
    | "uPan"
    | "uZoom"
    | "uQuiet"
    | "uQuietKind"
    | "uQuietCount"]: THREE.IUniform;
};

export function createContourMaterial(): THREE.ShaderMaterial & { uniforms: ContourUniforms } {
  const uniforms: ContourUniforms = {
    uHeightA: { value: null },
    uHeightB: { value: null },
    uEncA: { value: new THREE.Vector2() },
    uEncB: { value: new THREE.Vector2() },
    uUvA: { value: new THREE.Vector4(1, 1, 0, 0) },
    uUvB: { value: new THREE.Vector4(1, 1, 0, 0) },
    uRangeA: { value: new THREE.Vector2(0, 1) },
    uRangeB: { value: new THREE.Vector2(0, 1) },
    uMorph: { value: 0 },
    uInterval: { value: 100 },
    uIndexEvery: { value: 5 },
    uLineWidth: { value: 1 },
    uIndexWidth: { value: 1.5 },
    uLineOpacity: { value: 0.3 },
    uIndexOpacity: { value: 0.5 },
    uGround: { value: new THREE.Vector3() },
    uLineColor: { value: new THREE.Vector3() },
    uIndexColor: { value: new THREE.Vector3() },
    uHeadlampPos: { value: new THREE.Vector2(-1e4, -1e4) },
    uHeadlampRadius: { value: headlamp.radiusPx },
    uHeadlampStrength: { value: 0 },
    uHeadlampGain: { value: 1.5 },
    uSweepGain: { value: 2 },
    uSweep: { value: 1 },
    uTime: { value: 0 },
    uDrift: { value: 0.02 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPan: { value: new THREE.Vector2() },
    uZoom: { value: 1 },
    uQuiet: { value: Array.from({ length: MAX_QUIET_ZONES }, () => new THREE.Vector4()) },
    uQuietKind: { value: Array.from({ length: MAX_QUIET_ZONES }, () => new THREE.Vector2(48, 0.25)) },
    uQuietCount: { value: 0 },
  };
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  }) as THREE.ShaderMaterial & { uniforms: ContourUniforms };
}

/** CSS object-fit: cover + object-position, expressed as a UV transform (matches the SVG poster). */
export function coverTransform(
  out: THREE.Vector4,
  viewW: number,
  viewH: number,
  texW: number,
  texH: number,
  posX: number,
  posY: number,
) {
  const va = viewW / viewH;
  const ta = texW / texH;
  const sx = va > ta ? 1 : va / ta;
  const sy = va > ta ? ta / va : 1;
  out.set(sx, sy, posX * (1 - sx), posY * (1 - sy));
  return out;
}
