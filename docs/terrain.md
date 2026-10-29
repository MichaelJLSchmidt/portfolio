# Terrain

The contour field (`src/components/terrain/`) is one WebGL canvas behind every route. It conducts
route changes, adapts to the device, survives a lost GPU context and recentres on Bern when Basecamp
(`/about/`) opens. Motion values come from `src/styles/tokens.ts` (`docs/motion.md`); the field's own
tuning lives in `src/config/contour-field.json`.

## Route conductor

`conductor.ts` decides what the field does when a route commits; `ContourField.tsx` runs it on Motion's
frame loop (no requestAnimationFrame of its own) through uniforms.

- **When:** `TerrainBackdrop` maps the path to a terrain (`route-terrain.ts`: `/about/` is `"bern"`,
  every other path goes to `terrainIdForPath` in the cards module) and sets it in a layout effect, so
  the conductor starts inside the View Transition's update. Nothing waits for it: navigation is never
  held, and the text keeps its quiet zones (below). Back and forward go the same way.
- **Morph:** two terrain slots, A on screen and B the destination. `uMorph` runs 0 → 1 over the
  `terrain` token (700 ms, `summit` easing); when it lands, B becomes A. A route that interrupts
  another picks up where the field is (a mostly arrived destination becomes A first).
- **Draw-on (`uReveal`):** in full motion the destination's isolines appear from the valleys upward
  over the `draw` token (900 ms). Lines above the front stay at `revealFloor` (30%), so the map never
  blanks; the front is a little brighter.
- **Modes:** full: morph, draw-on and the zoom push on card terrains. Calm: morph only. Still: no
  WebGL at all; the backdrop's posters cross-fade in 200 ms (`--dur-still`).
- **Pre-warm** (tier A, full): hovering or focusing any link to another terrain (cards, Basecamp, the
  home link; one delegated listener) loads its heightmap and eases `uMorph` to 0.12 over 400 ms, and
  back on leave. Cards' `prefetchTerrain()` still preloads, as before.
- **Quiet zones through a route change:** from the commit until the View Transition has finished and
  the field's own motion is over, every quiet zone holds the strongest knockout (body text's 9%,
  64 px feather) and so does the column both pages' text covers; then it eases back over `medium`.

### API

| | |
| --- | --- |
| `fieldStore.set({ morphTarget })` | Morph to a terrain id (`null`: the home region). Unchanged from before. |
| `prefetchTerrain(id)` | Preload a terrain (cards call it on hover and focus). Unchanged. |
| `fieldStore.get().readout` | The readout of the terrain the field is heading to: `{ id, label, e, n, altitudeM }`, kept in step with `morphTarget` from the first idle moment (`null` before; `readoutFor(morphTarget)` from `readout.ts` gives it at any time). |
| `fieldStore.get().routeSeq` | Incremented on every route change (the conductor holds the quiet zones). |
| `fieldStore.get().tier` | The field's tier once resolved: `"desktop"` (A), `"mobile"` (B), `"low"` (C). |
| `routeTerrain(pathname)` | Path → terrain id (`route-terrain.ts`). |
| `planRoute(to, mode, values, …)` | The steps a route change plays (`conductor.ts`, unit-tested). |

Durations: `terrain` 700 ms (morph), `draw` 900 ms (draw-on), `breathOut` 240 ms (river and pin
leave), `long` 560 ms (the pin's ping), `micro` 140 ms (the pin appears), `medium` 360 ms (the quiet
zones let go). Easings: `summit` for the morph and the draws, `trail` for appearances, `scree` for
what leaves.

## Recentre on Bern

Every navigation to `/about/`:

- 0–700 ms: the terrain morphs to Bern. The contour interval eases in log space from its current value
  to Bern's (10 m on every screen size checked), so lines multiply as the relief flattens. Nothing
  scales; no zoom push.
- 200–900 ms: the Aare draws in the `ice` colour (#8FC7E8), the only coloured line on the site, in
  flow direction, and stays.
- 300 ms: a small crosshair pin pings once in `glacier` at the zero point (LV95 E 2'600'000 /
  N 1'200'000, the old observatory), which the terrain is framed on: the centre of every screen.
- Leaving reverses it: the interval returns with the morph, the river and the pin fade out in 240 ms.
- Calm: the terrain and the interval change; the river and the pin appear (200 ms) without drawing or
  pinging. Still and tier C: Bern's poster, with the river and the pin.

The river is a ribbon mesh (`river-material.ts`) in the Bern terrain's coordinates, mapped to the
screen exactly as the field samples its heightmap and widened there to 1.5 px; quiet zones break it
behind text like every other line. The pin is drawn in the contour shader.

### Readout

`TerrainReadout` (`TerrainReadout.tsx`) renders the store's readout, e.g. `BERN · E 2’600’000 ·
N 1’200’000 · ALT 554 M`, the home region as `JUNGFRAU · ALT 4’158 M`, a card as far as its terrain
metadata goes (the centre of a real crop, the top of a seeded massif). The server and hydration
render it from the route with `formatInteger`; after hydration, changed numbers roll with
`AnimateNumber` (Motion+, loaded lazily, one thousands group at a time so the digits match
`formatInteger` exactly) over the `terrain` token, and snap in still. Screen readers get the plain
text once.

**Mounting it in the HUD (a later phase):** render `<TerrainReadout className="hud-label" />` in
`src/components/hud/Hud.tsx`. It needs no props, works without the WebGL field (tier C, still) and
during server rendering. `ReadoutNumber` (Motion+) is a separate lazy chunk, so the HUD's initial
JavaScript only grows by the readout's few lines. Reserve its width (it changes between terrains),
for example with a fixed-width slot or by letting it wrap below the coordinates on phones.

## Device tiers

`field-boot.ts` resolves the tier once the page is idle (lazily loaded; none of it is in a route's
initial JavaScript), from phase 1's `html[data-tier]`:

| Tier | Who | Field |
| --- | --- | --- |
| A `desktop` | fine pointer, long edge ≥ 900 px | DPR cap 2, ambient drift ~30 fps (10 fps after a minute idle), headlamp, parallax, pre-warm |
| B `mobile` | touch, or a long edge under 900 px | DPR 1 at a 0.75 render scale; no drift, line flow, headlamp or parallax; frames only during transitions and scrolling (≤ 30 fps), 0 when idle |
| C `low` | no WebGL2 (or a software renderer), Save-Data, < 4 GB memory or < 4 cores, a context lost twice this session; and still mode on any device | posters only, cross-fading in 200 ms on route changes |

Tier A keeps a DPR cap of 2: on a 2× screen, a cap of 1.5 drew the lines visibly softer and heavier
(the 1.33× upscale smears a 1.5 px line over two pixels), so the cap was not lowered.

In still mode the store's `tier` reads `"low"` (posters only), whatever the device; leaving still
restores the device's tier.

`?field=force` skips the low-spec checks (headless browsers). Preview builds take `?tier=desktop|mobile|low`
(or `A`, `B`, `C`) and `?dpr=…` for one page load. The backdrop shows the resolved tier as
`data-field-tier`.

## Robustness

- **Context loss:** the poster shows at once (`data-field="lost"`, no fade). The field tries one
  restore (the browser's, or one `restoreContext()` after a second); three uploads the textures again.
  A second loss in the session switches to tier C for the rest of it (`sessionStorage
  summit:field-tier`).
- **Pauses:** no frames while the page is hidden, while a `dialog` is open (a `MutationObserver` on
  `open`, so the case-study lightbox needs no change) or while the context is lost.
- **Heightmap decode failures** keep the poster (`heightmap-loader.ts`, unchanged). A route whose
  heightmap fails settles back on the terrain on screen.

## The Bern terrain

`npm run terrain:bern` (`scripts/terrain/bern.mjs`, configured by `scripts/terrain/bern.config.json`)
writes `public/terrain/bern/`:

- **Window:** 8 × 8 km centred on the zero point, LV95 E 2'596'000–2'604'000, N 1'196'000–1'204'000.
- **Elevation:** swisstopo swissALTIRegio (10 m DTM), the same COG and STAC item the region uses
  (`data.geo.admin.ch`); only the window's ~800 × 800 cells are read (range requests, cached in
  `scripts/terrain/.cache/`).
- **Heightmaps:** the region's encoding (16-bit heights in R+G, lossless WebP, raw `.bin` fallback,
  reference texels for the runtime decode check) at 0.1 m steps, lightly blurred: `heightmap-1536`
  (desktop, bicubic from the native grid) and `heightmap-800` (phones and small screens, native).
  `npm run verify:terrain` covers them.
- **The Aare:** swissTLM3D Gewässernetz (swisstopo) through `api3.geo.admin.ch` (identify on
  `ch.swisstopo.swisstlm3d-gewaessernetz`, the features named Aare), stitched, clipped to the window,
  simplified to 5 m and stored in terrain coordinates in flow direction. If that request fails the
  script traces the DEM's valley floor instead (and says so in `bern.json`).
- **Posters:** 10 m and 20 m (still mode, tier C), with the river and the pin, picked by the same
  spacing rule as the field.
- **Altitude at the zero point:** read from the DEM and rounded: 554 m. The script checks the DEM
  against the city's figures (lowest point 481 m, main station 541 m) and stops if they disagree.
- **Metadata:** `bern.json` (what the field needs), and two small extracts: `summary.json` (the
  readout) and `posters.json` (the backdrop's posters and the gradients their media queries use).
- `-- --refresh` re-downloads; `-- --placeholder` builds seeded noise (480–950 m) without the network,
  flagged `"placeholder": true` everywhere, with no altitude and no river.

**Data status:** real swisstopo data (swissALTIRegio, updated 2026-06-01) and the official river
network; no placeholder is committed.

### Contour intervals per terrain

The interval is still the smallest step that keeps lines on steep terrain (the map's 95th-percentile
gradient) at least `minSpacingPx` apart on screen, but each terrain has its own set, by relief
(`intervalSet` in `field-settings.ts`): under 1000 m of relief (Bern) 10, 20 or 50 m; the Alps keep
50, 100, 200, 250 or 500 m.

## Checks

- `npm test`: `routeTerrain`, the readout's formatting, the interval sets, the conductor's plan and
  timeline (`src/lib/terrain.test.ts`).
- `npm run test:e2e -- terrain` (a preview build): `scripts/e2e-terrain.mjs`, through the preview-only
  debug hook `window.__terrain` (timeline events, state, frame count, `loseContext()`, `freeze()`).
- `npm run check:legibility`: also measures text over a field frozen mid-morph with the hold on.
