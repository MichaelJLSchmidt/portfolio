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

uniform float uRevealGain;  // the draw-on front's lines reach this many times their strength

uniform float uReveal;      // 0..1 route draw-on: the destination's lines from the valleys upward
uniform float uRevealFloor; // strength of lines above the draw-on front (1 = no draw-on)

uniform vec2 uResolution;  // drawing buffer, device px
uniform float uZoom;       // > 1 zooms in around the screen centre (camera push on morph)

#define MAX_QUIET 24
uniform vec4 uQuiet[MAX_QUIET];     // quiet zones behind text: left, bottom, right, top (device px)
uniform vec2 uQuietKind[MAX_QUIET]; // per zone: feather (device px), line strength inside (0..1)
uniform int uQuietCount;
uniform float uQuietHold;   // 0..1: during a route change every zone takes the strongest knockout
uniform vec2 uHoldKind;     // that knockout: feather (device px), strength
uniform vec4 uQuietColumn;  // and the content column, old and new page together (device px)

uniform vec2 uPinPos;       // the zero-point pin, device px (origin bottom-left)
uniform float uPinStrength; // 0..1
uniform float uPinPing;     // 0..1, the one ping's ring
uniform vec4 uPinShape;     // arm length, centre gap, line width, ping radius (device px)
uniform vec3 uPinColor;

float decodeHeight(sampler2D tex, vec2 uv, vec2 enc) {
  vec2 rg = texture(tex, uv).rg;
  return enc.x + (rg.r * 65280.0 + rg.g * 255.0) * enc.y;
}

// Coverage of a line of width w (px) at distance d (px) from its centre, ~1px anti-aliasing.
float lineMask(float d, float w) {
  return 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, d);
}

void main() {
  vec2 p = (gl_FragCoord.xy / uResolution - 0.5) / uZoom + 0.5;
  vec2 st = vec2(p.x, 1.0 - p.y);
  float hA = decodeHeight(uHeightA, st * uUvA.xy + uUvA.zw, uEncA);
  float hB = decodeHeight(uHeightB, st * uUvB.xy + uUvB.zw, uEncB);
  float m = smoothstep(0.0, 1.0, uMorph);
  float h = mix(hA, hB, m);
  vec2 range = mix(uRangeA, uRangeB, m);

  float level = h / uInterval;
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

  // Route draw-on: the destination's lines appear from the valleys upward; above the front they
  // keep the floor's strength, so the map never blanks, and the front itself is a little brighter.
  float span = max(range.y - range.x, 1.0);
  float band = max(span * 0.05, 8.0);
  float revealLevel = mix(range.x - band, range.y + band, uReveal);
  float below = 1.0 - smoothstep(revealLevel - band, revealLevel, h);
  float drawn = mix(uRevealFloor, 1.0, below);
  float revealFront = exp(-abs(h - revealLevel) / band) * below * (1.0 - uRevealFloor) * step(uReveal, 0.999);

  // Quiet zones: lines fade to the zone's strength inside its rectangle, feathered outwards,
  // like contours interrupted under a map's labels. Headings keep ~25% of a line, body text
  // ~9%; where zones overlap, the stronger knockout wins. Through a route change every zone,
  // and the column both pages' text shares, holds the strongest knockout.
  float keep = 1.0;
  for (int i = 0; i < MAX_QUIET; i++) {
    if (i >= uQuietCount) break;
    vec4 r = uQuiet[i];
    vec2 kind = mix(uQuietKind[i], uHoldKind, uQuietHold);
    vec2 outside = max(max(r.xy - gl_FragCoord.xy, gl_FragCoord.xy - r.zw), 0.0);
    float q = 1.0 - smoothstep(0.0, kind.x, length(outside));
    keep = min(keep, mix(1.0, kind.y, q));
  }
  if (uQuietHold > 0.0) {
    vec2 outside = max(max(uQuietColumn.xy - gl_FragCoord.xy, gl_FragCoord.xy - uQuietColumn.zw), 0.0);
    float q = 1.0 - smoothstep(0.0, uHoldKind.x, length(outside));
    keep = min(keep, mix(1.0, uHoldKind.y, q * uQuietHold));
  }

  // The draw-on front keeps its colour and only gains strength: the map stays monochrome.
  float gain = mix(1.0, uRevealGain, revealFront * 0.6);
  float aReg = min(reg * uLineOpacity * gain, 1.0) * keep;
  float aInd = min(ind * uIndexOpacity * gain, 1.0) * keep;

  vec3 col = uGround;
  col = mix(col, uLineColor, aReg * drawn);
  col = mix(col, uIndexColor, aInd * drawn);

  // The zero-point pin: a crosshair with a gap at its centre, and one expanding ring.
  if (uPinStrength > 0.0 || (uPinPing > 0.0 && uPinPing < 1.0)) {
    vec2 d = abs(gl_FragCoord.xy - uPinPos);
    float w = uPinShape.z;
    float armX = lineMask(d.y, w) * step(uPinShape.y, d.x) * (1.0 - smoothstep(uPinShape.x - 0.5, uPinShape.x + 0.5, d.x));
    float armY = lineMask(d.x, w) * step(uPinShape.y, d.y) * (1.0 - smoothstep(uPinShape.x - 0.5, uPinShape.x + 0.5, d.y));
    float ring = 0.0;
    if (uPinPing > 0.0 && uPinPing < 1.0) ring = lineMask(abs(length(d) - uPinPing * uPinShape.w), w) * (1.0 - uPinPing);
    float pin = max(max(armX, armY) * uPinStrength, ring) * keep;
    col = mix(col, uPinColor, pin * 0.9);
  }

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
    | "uRevealGain"
    | "uReveal"
    | "uRevealFloor"
    | "uResolution"
    | "uZoom"
    | "uQuiet"
    | "uQuietKind"
    | "uQuietCount"
    | "uQuietHold"
    | "uHoldKind"
    | "uQuietColumn"
    | "uPinPos"
    | "uPinStrength"
    | "uPinPing"
    | "uPinShape"
    | "uPinColor"]: THREE.IUniform;
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
    uRevealGain: { value: 2 },
    uReveal: { value: 1 },
    uRevealFloor: { value: 1 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uZoom: { value: 1 },
    uQuiet: { value: Array.from({ length: MAX_QUIET_ZONES }, () => new THREE.Vector4()) },
    uQuietKind: { value: Array.from({ length: MAX_QUIET_ZONES }, () => new THREE.Vector2(48, 0.25)) },
    uQuietCount: { value: 0 },
    uQuietHold: { value: 0 },
    uHoldKind: { value: new THREE.Vector2(64, 0.09) },
    uQuietColumn: { value: new THREE.Vector4(0, 0, 0, 0) },
    uPinPos: { value: new THREE.Vector2(-1e4, -1e4) },
    uPinStrength: { value: 0 },
    uPinPing: { value: 0 },
    uPinShape: { value: new THREE.Vector4(9, 3, 1.25, 30) },
    uPinColor: { value: new THREE.Vector3(1, 1, 1) },
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
