import * as THREE from "three";

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
uniform vec3 uGlowColor;

uniform vec2 uHeadlampPos;    // device px, origin bottom-left
uniform float uHeadlampRadius; // device px
uniform float uHeadlampStrength;
uniform float uGlow;          // 0..1, desktop only
uniform float uGlowWidth;     // device px

uniform float uSweep;  // 0..1 draw-on from lake level upward
uniform float uTime;   // seconds
uniform float uDrift;  // cycles per second

uniform vec2 uResolution;  // drawing buffer, device px
uniform vec2 uPan;         // map offset in UV (pointer + scroll parallax, slow drift)
uniform float uZoom;       // > 1 zooms in around the screen centre (camera push on morph)
uniform vec2 uLens;        // loupe under the headlamp: radius (device px), strength 0..1
uniform vec2 uPulse;       // rising alpenglow band: period (s), strength
uniform vec3 uPulseColor;
uniform vec3 uRipple;      // click ping: x, y (device px), age (s); age < 0 = none
uniform float uRippleSpeed; // device px per second

#define MAX_QUIET 8
uniform vec4 uQuiet[MAX_QUIET]; // quiet zones behind text: left, bottom, right, top (device px)
uniform int uQuietCount;
uniform vec2 uQuietParams;      // feather (device px), line strength inside a zone (0..1)

float decodeHeight(sampler2D tex, vec2 uv, vec2 enc) {
  vec2 rg = texture(tex, uv).rg;
  return enc.x + (rg.r * 65280.0 + rg.g * 255.0) * enc.y;
}

// Coverage of a line of width w (px) at distance d (px) from its centre, ~1px anti-aliasing.
float lineMask(float d, float w) {
  return 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, d);
}

void main() {
  // Loupe: the terrain swells under the headlamp. Lines keep their pixel width (fwidth).
  vec2 frag = gl_FragCoord.xy;
  vec2 toLamp = frag - uHeadlampPos;
  float lens = (1.0 - smoothstep(0.0, uLens.x, length(toLamp))) * uHeadlampStrength;
  lens = lens * lens * (3.0 - 2.0 * lens);
  frag = uHeadlampPos + toLamp * (1.0 - uLens.y * lens);
  vec2 p = (frag / uResolution - 0.5) / uZoom + 0.5 + uPan;
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

  // Headlamp: eased radial falloff around the pointer.
  float dist = length(gl_FragCoord.xy - uHeadlampPos);
  float lit = 1.0 - smoothstep(0.0, 1.0, dist / max(uHeadlampRadius, 1.0));
  lit = lit * lit * (3.0 - 2.0 * lit) * uHeadlampStrength;

  // Intro sweep: lines appear from the lowest ground upward, with a bright leading edge.
  float sweepLevel = mix(range.x - 30.0, range.y + 60.0, uSweep);
  float revealed = 1.0 - smoothstep(sweepLevel - 60.0, sweepLevel, h);
  float front = exp(-abs(h - sweepLevel) / 45.0) * step(uSweep, 0.999) * revealed;

  // Rising alpenglow: a band of warm light climbs from the valleys to the summits.
  float pulseLevel = mix(range.x - 250.0, range.y + 250.0, fract(uTime / uPulse.x));
  float pulse = exp(-abs(h - pulseLevel) / 110.0) * uPulse.y;

  // Click ping: a ring that lights the lines it passes.
  float ripple = 0.0;
  if (uRipple.z >= 0.0) {
    float rr = length(gl_FragCoord.xy - uRipple.xy);
    float radius = uRipple.z * uRippleSpeed;
    ripple = exp(-abs(rr - radius) / (0.06 * uRippleSpeed)) * (1.0 - smoothstep(0.2, 1.6, uRipple.z));
  }

  // Quiet zones: lines fade to uQuietParams.y inside the rectangles, feathered outwards.
  float quiet = 0.0;
  for (int i = 0; i < MAX_QUIET; i++) {
    if (i >= uQuietCount) break;
    vec4 r = uQuiet[i];
    vec2 outside = max(max(r.xy - gl_FragCoord.xy, gl_FragCoord.xy - r.zw), 0.0);
    quiet = max(quiet, 1.0 - smoothstep(0.0, uQuietParams.x, length(outside)));
  }
  float keep = mix(1.0, uQuietParams.y, quiet);

  float light = max(max(lit, front), ripple);
  float aReg = reg * mix(uLineOpacity, 1.0, max(light, pulse)) * keep;
  float aInd = ind * mix(uIndexOpacity, 1.0, max(light, pulse)) * keep;
  vec3 cReg = mix(mix(uLineColor, uPulseColor, pulse), uGlowColor, light);
  vec3 cInd = mix(mix(uIndexColor, uPulseColor, pulse), uGlowColor, light);

  vec3 col = uGround;
  col = mix(col, cReg, aReg * revealed);
  col = mix(col, cInd, aInd * revealed);

  // Soft halo around lit lines (desktop only).
  float halo = max(lineMask(dReg, uGlowWidth) * crowdReg, lineMask(dIdx, uGlowWidth * 1.3) * crowdIdx);
  col += uGlowColor * halo * max(lit, ripple) * uGlow * 0.18 * revealed * keep;
  col += uPulseColor * halo * pulse * uGlow * 0.08 * revealed * keep;

  fragColor = vec4(col, 1.0);
}
`;

/** Must match MAX_QUIET in the fragment shader. */
export const MAX_QUIET_ZONES = 8;

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
    | "uDrift"
    | "uResolution"
    | "uPan"
    | "uZoom"
    | "uLens"
    | "uPulse"
    | "uPulseColor"
    | "uRipple"
    | "uRippleSpeed"
    | "uQuiet"
    | "uQuietCount"
    | "uQuietParams"]: THREE.IUniform;
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
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPan: { value: new THREE.Vector2() },
    uZoom: { value: 1 },
    uLens: { value: new THREE.Vector2(220, 0.3) },
    uPulse: { value: new THREE.Vector2(9, 0.5) },
    uPulseColor: { value: new THREE.Vector3() },
    uRipple: { value: new THREE.Vector3(0, 0, -1) },
    uRippleSpeed: { value: 900 },
    uQuiet: { value: Array.from({ length: MAX_QUIET_ZONES }, () => new THREE.Vector4()) },
    uQuietCount: { value: 0 },
    uQuietParams: { value: new THREE.Vector2(48, 0.25) },
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
