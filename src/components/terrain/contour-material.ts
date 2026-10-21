import * as THREE from "three";

/**
 * Full-screen contour shader. Heights come from RG-packed 16-bit PNGs; lines are drawn
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
uniform vec3 uGlowColor;

uniform vec2 uHeadlampPos;    // device px, origin bottom-left
uniform float uHeadlampRadius; // device px
uniform float uHeadlampStrength;
uniform float uGlow;          // 0..1, desktop only
uniform float uGlowWidth;     // device px

uniform float uSweep;  // 0..1 draw-on from lake level upward
uniform float uTime;   // seconds
uniform float uDrift;  // cycles per second

float decodeHeight(sampler2D tex, vec2 uv, vec2 enc) {
  vec2 rg = texture(tex, uv).rg;
  return enc.x + (rg.r * 65280.0 + rg.g * 255.0) * enc.y;
}

// Coverage of a line of width w (px) at distance d (px) from its centre, ~1px anti-aliasing.
float lineMask(float d, float w) {
  return 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, d);
}

void main() {
  vec2 st = vec2(vUv.x, 1.0 - vUv.y);
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

  // Headlamp: eased radial falloff around the pointer.
  float dist = length(gl_FragCoord.xy - uHeadlampPos);
  float lit = 1.0 - smoothstep(0.0, 1.0, dist / max(uHeadlampRadius, 1.0));
  lit = lit * lit * (3.0 - 2.0 * lit) * uHeadlampStrength;

  // Intro sweep: lines appear from the lowest ground upward, with a bright leading edge.
  float sweepLevel = mix(range.x - 30.0, range.y + 60.0, uSweep);
  float revealed = 1.0 - smoothstep(sweepLevel - 60.0, sweepLevel, h);
  float front = exp(-abs(h - sweepLevel) / 45.0) * step(uSweep, 0.999) * revealed;

  float aReg = reg * mix(uLineOpacity, 1.0, lit);
  float aInd = ind * mix(uIndexOpacity, 1.0, lit);
  vec3 cReg = mix(uLineColor, uGlowColor, max(lit, front));
  vec3 cInd = mix(uIndexColor, uGlowColor, max(lit, front));

  vec3 col = uGround;
  col = mix(col, cReg, aReg * revealed);
  col = mix(col, cInd, aInd * revealed);

  // Soft halo around lit lines (desktop only).
  float halo = max(lineMask(dReg, uGlowWidth) * crowdReg, lineMask(dIdx, uGlowWidth * 1.3) * crowdIdx);
  col += uGlowColor * halo * lit * uGlow * 0.18 * revealed;

  fragColor = vec4(col, 1.0);
}
`;

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
    | "uGlowColor"
    | "uHeadlampPos"
    | "uHeadlampRadius"
    | "uHeadlampStrength"
    | "uGlow"
    | "uGlowWidth"
    | "uSweep"
    | "uTime"
    | "uDrift"]: THREE.IUniform;
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
    uLineOpacity: { value: 0.55 },
    uIndexOpacity: { value: 0.9 },
    uGround: { value: new THREE.Vector3() },
    uLineColor: { value: new THREE.Vector3() },
    uIndexColor: { value: new THREE.Vector3() },
    uGlowColor: { value: new THREE.Vector3() },
    uHeadlampPos: { value: new THREE.Vector2(-1e4, -1e4) },
    uHeadlampRadius: { value: 180 },
    uHeadlampStrength: { value: 0 },
    uGlow: { value: 0 },
    uGlowWidth: { value: 7 },
    uSweep: { value: 1 },
    uTime: { value: 0 },
    uDrift: { value: 0.02 },
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
