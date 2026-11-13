/*
 * The background field's only shader. Two palettes: A (the resting field, with
 * the hover tint already mixed in on the CPU) and B (the bloomed identity).
 * B grows from uOrigin as a soft disc (uSpread 0..1). Each palette is shaded
 * as three soft colour pools (glow bottom-left, mid top-right, a mixed pool
 * centre-left) warped by low-frequency noise, with static 2% grain. The pool
 * centres drift on slow Lissajous loops (uDrift, full tier only).
 *
 * About (uTopo 0..1, eased on the CPU): the pools contract and the field fades
 * into the contour ground while contour lines rise out of a noise field and
 * settle on the region's real heights (h = mix(noise, elevation)), with the
 * lakes fading in. At uTopo = 1 the frame is the old page's SVG as the browser
 * draws it (contours.ts): its cover crop and 1.03 scale (uMap), its interval
 * (uLevels), 1 / 1.5 CSS px lines at 0.55 / 0.9 and lakes at 0.08, all at the
 * layer's 0.42 over the ground; lines anti-aliased by their screen-space
 * derivative (fwidth, in its Euclidean form), heights read
 * with texelFetch and interpolated here (Catmull-Rom on exact texels). The
 * engine then hands over to the SVG. Nothing here reads the pointer.
 *
 * A played card meeting the table (uImpact, uRing): one soft ring in the card's colour grows from
 * the landing point toward the farthest corner and fades as it goes (nothing lingers), while the
 * bloom (uSpread) fills from the same point. While the next page is slow to arrive (uWait) the
 * field breathes softly around the resting card: its luminance rises and falls a few per cent
 * within a soft radius.
 */
export const vertexSource = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

export const fragmentSource = `#version 300 es
precision highp float;

uniform vec2 uRes;          // drawing-buffer size in pixels
uniform float uAspect;      // width / height
uniform float uTime;        // field time in seconds (frozen in reduced and while paused)
uniform vec3 uA[3];         // field, mid, glow (sRGB)
uniform vec3 uB[3];
uniform vec2 uI;            // pool intensity of A and B
uniform float uSpread;      // bloom radius 0..1
uniform vec2 uOrigin;       // bloom centre, viewport fractions (y down)
uniform float uMaxD;        // distance from the origin to the farthest corner
uniform vec2 uPull;         // point A's pools drift toward (y down)
uniform float uPullAmt;
uniform vec2 uDrift[3];     // each pool's slow Lissajous offset (aspect-scaled, full tier only)
uniform vec2 uBreath;       // pool scale, luminance
uniform float uLum;         // luminance dip (switch)
uniform float uFade;        // fade in from black
uniform float uGrain;
uniform float uTopo;        // About: 0 the field, 1 the contour map (eased on the CPU)
uniform vec3 uGround;       // the contour field's ground
uniform float uContours;    // the lines' and lakes' strength 0..1 (0: no heightmap)
uniform highp sampler2D uHeight; // the region heightmap: R, G height bytes, B lake coverage (RGBA8)
uniform vec2 uEnc;          // height = uEnc.x + (R * 256 + G) * uEnc.y, R and G as bytes
uniform vec2 uRange;        // lowest and highest height (m): the noise relief spans it
uniform vec2 uView;         // the canvas's CSS size
uniform vec4 uMap;          // CSS px (from the top left) -> heightmap texels: xy * uMap.xy + uMap.zw
uniform vec2 uLevels;       // contour interval and index interval (m)
uniform vec2 uWidths;       // line and index line width (drawing-buffer px)
uniform vec4 uAlphas;       // line, index line, lake, layer opacity
uniform vec3 uLine;         // line colour
uniform vec3 uLake;         // lake colour
uniform vec2 uImpact;       // where a played card met the table, viewport fractions (y down)
uniform vec3 uRing;         // the impact's ring: radius 0..1 (eased), strength, soft width
uniform vec3 uRingCol;      // the ring's colour (the played card's glow, sRGB)
uniform vec2 uWait;         // the waiting breath: luminance offset (+/-), radius (viewport heights)

out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v / 0.875;
}

float pool(vec2 q, vec2 c, float r) {
  vec2 d = q - c;
  return exp(-dot(d, d) / (r * r));
}

vec3 shade(vec3 field, vec3 mid, vec3 glow, float intensity, vec2 q, float n, float pullAmt) {
  vec2 pull = vec2(uPull.x * uAspect, uPull.y);
  // About: the pools contract toward their centres as the field fades into the ground.
  float s = uBreath.x * (1.0 - 0.7 * uTopo);
  vec2 c1 = mix(vec2(0.16 * uAspect, 0.88) + uDrift[0], pull, pullAmt);
  vec2 c2 = mix(vec2(0.86 * uAspect, 0.16) + uDrift[1], pull, pullAmt * 0.45);
  vec2 c3 = mix(vec2(0.34 * uAspect, 0.52) + uDrift[2], pull, pullAmt * 0.8);
  float g1 = pool(q, c1, 0.52 * s);
  float g2 = pool(q, c2, 0.58 * s);
  float g3 = pool(q, c3, 0.42 * s);
  float mod1 = 0.7 + 0.6 * n;
  vec3 col = field;
  col = mix(col, mid, clamp((g2 + g3 * 0.6) * mod1, 0.0, 1.0) * intensity);
  col = mix(col, glow, clamp((g1 * 0.55 + g3 * 0.22) * mod1, 0.0, 1.0) * intensity);
  return col;
}

vec3 gradient() {
  vec2 uv = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  vec2 p = vec2(uv.x * uAspect, uv.y);
  float t = uTime * 0.012;

  float n = fbm(p * 1.3 + vec2(t, -t * 0.7));
  vec2 warp = vec2(noise(p * 1.1 + vec2(3.1, t)), noise(p * 1.1 + vec2(-t, 7.3))) - 0.5;
  vec2 q = p + warp * 0.32;

  vec3 colA = shade(uA[0], uA[1], uA[2], uI.x, q, n, uPullAmt);
  vec3 col = colA;
  if (uSpread > 0.0) {
    vec3 colB = shade(uB[0], uB[1], uB[2], uI.y, q, n, 0.0);
    vec2 o = vec2(uOrigin.x * uAspect, uOrigin.y);
    float soft = 0.22;
    float r = uSpread * (uMaxD + soft);
    float d = length(p - o) + (n - 0.5) * 0.12 * uSpread * (1.0 - uSpread) * 4.0;
    float mask = 1.0 - smoothstep(r - soft, r, d);
    col = mix(colA, colB, mask);
  }
  if (uRing.y > 0.0 || uWait.x != 0.0) {
    float di = length(p - vec2(uImpact.x * uAspect, uImpact.y));
    if (uRing.y > 0.0) {
      float rr = uRing.x * (uMaxD + uRing.z);
      float ring = exp(-pow((di - rr) / uRing.z, 2.0));
      col = mix(col, uRingCol, clamp(ring * uRing.y, 0.0, 1.0));
    }
    if (uWait.x != 0.0) col *= 1.0 + uWait.x * exp(-(di * di) / (uWait.y * uWait.y));
  }
  col *= uBreath.y * uLum * uFade;
  col += (hash(gl_FragCoord.xy + 0.5) - 0.5) * uGrain;
  return col;
}

ivec2 texelAt(ivec2 i) {
  return clamp(i, ivec2(0), textureSize(uHeight, 0) - 1);
}

// Catmull-Rom weights for the four taps around a sample (interpolating, so the lines pass where
// the heights say, and C1-smooth, so they bend without the kinks of bilinear filtering).
vec4 catmullRom(float w) {
  float w2 = w * w;
  float w3 = w2 * w;
  return vec4(-0.5 * w3 + w2 - 0.5 * w, 1.5 * w3 - 2.5 * w2 + 1.0, -1.5 * w3 + 2.0 * w2 + 0.5 * w, 0.5 * w3 - 0.5 * w2);
}

// Height (m) and lake coverage at heightmap texel coordinates (texel centres at i + 0.5): the
// height bicubic over 4 x 4 exact texels, the lake coverage bilinear over the middle 2 x 2.
vec2 terrainAt(vec2 t) {
  vec2 f = t - 0.5;
  vec2 i0 = floor(f);
  vec2 w = f - i0;
  ivec2 base = ivec2(i0) - 1;
  vec4 wx = catmullRom(w.x);
  vec4 wy = catmullRom(w.y);
  vec2 lx = vec2(1.0 - w.x, w.x);
  vec2 ly = vec2(1.0 - w.y, w.y);
  float height = 0.0;
  float lake = 0.0;
  for (int y = 0; y < 4; y++) {
    vec4 row;
    for (int x = 0; x < 4; x++) {
      vec3 c = texelFetch(uHeight, texelAt(base + ivec2(x, y)), 0).rgb;
      row[x] = floor(c.r * 255.0 + 0.5) * 256.0 + floor(c.g * 255.0 + 0.5);
      if (x >= 1 && x <= 2 && y >= 1 && y <= 2) lake += c.b * lx[x - 1] * ly[y - 1];
    }
    height += wy[y] * dot(wx, row);
  }
  return vec2(uEnc.x + height * uEnc.y, lake);
}

// Coverage of a line "width" px wide at "d" px from its centre (a 1 px box filter).
float cover(float d, float width) {
  return clamp(width * 0.5 + 0.5 - d, 0.0, 1.0);
}

void main() {
  // The field fades into the ground; at 1 only the ground (the gradient is not computed).
  vec3 col = uGround;
  if (uTopo < 1.0) col = mix(gradient(), uGround, uTopo);

  if (uContours > 0.0 && uTopo > 0.0) {
    vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * uView / uRes;
    vec2 t = css * uMap.xy + uMap.zw;
    vec2 terrain = terrainAt(t);
    // A static noise relief over the same range, morphing into the real heights.
    float relief = mix(uRange.x, uRange.y, fbm(t / 180.0 + 11.0));
    float h = mix(relief, terrain.x, smoothstep(0.15, 0.95, uTopo));

    // Regular lines on every interval except the index levels, index lines on those (as the SVG).
    float level = h / uLevels.x;
    // Level change per pixel: fwidth's Euclidean form (fwidth() itself sums |dx| + |dy|, which
    // overstates diagonal gradients by up to 41% and draws those lines too wide).
    float fw = max(length(vec2(dFdx(level), dFdy(level))), 1e-6);
    float every = uLevels.y / uLevels.x;
    float k = floor(level + 0.5);
    float dk = abs(level - k);
    bool onIndex = abs(mod(k, every)) < 0.5 || abs(mod(k, every) - every) < 0.5;
    float dReg = (onIndex ? 1.0 - dk : dk) / fw;
    float li = h / uLevels.y;
    float dIdx = abs(li - floor(li + 0.5)) / (fw / every);

    // The lines fade in at the start; the lakes as the relief settles.
    float fadeLines = smoothstep(0.0, 0.4, uTopo);
    float aLake = uAlphas.z * terrain.y * smoothstep(0.3, 1.0, uTopo) * uContours;
    float aReg = uAlphas.x * cover(dReg, uWidths.x) * fadeLines * uContours;
    float aIdx = uAlphas.y * cover(dIdx, uWidths.y) * fadeLines * uContours;
    // Premultiplied "over", in the SVG's order: lake, regular lines, index lines.
    vec3 C = uLake * aLake;
    float A = aLake;
    C = uLine * aReg + C * (1.0 - aReg);
    A = aReg + A * (1.0 - aReg);
    C = uLine * aIdx + C * (1.0 - aIdx);
    A = aIdx + A * (1.0 - aIdx);
    // The layer's opacity over the ground (or, while morphing, over the fading field).
    float o = uAlphas.w;
    col = col * (1.0 - o * A) + o * C;
  }
  outColor = vec4(col, 1.0);
}
`
