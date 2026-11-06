# Terrain

The contour field (`src/components/terrain/`) is one WebGL canvas behind every route. It holds
still while a page is read and takes no pointer input; it conducts route changes, adapts to the
device, survives a lost GPU context and recentres on Bern when About (`/about/`) opens. Motion
values come from `src/styles/tokens.ts` (`docs/motion.md`); the field's own tuning lives in
`src/config/contour-field.json`. The places its terrains and the case studies name come from
`npm run geo` (below).

## Route conductor

`conductor.ts` decides what the field does when a route commits; `ContourField.tsx` runs it on
Motion's frame loop (no requestAnimationFrame of its own) through uniforms. The field renders on
demand: frames only while something changes (a morph, a resize, the quiet zones following the
scroll), none while the page is read.

- **When:** `TerrainBackdrop` maps the path to a terrain (`routeTerrain` in `route-terrain.ts`:
  `/about/` is `"bern"`; a case study is its card's terrain, looked up in the small route → terrain
  map the root layout writes on `<html data-card-terrains>` from `cardTerrains()` in the cards
  module, so the cards' data stays out of the client bundle; every other path is `null`, the home
  region). It sets the terrain in a layout effect, so the conductor starts inside the View
  Transition's update. Nothing waits for it: navigation is never held, and the text keeps its
  quiet zones (below). Back and forward go the same way.
- **Morph:** two terrain slots, A on screen and B the destination. `uMorph` runs 0 → 1 over the
  `terrain` token (700 ms, `summit` easing); when it lands, B becomes A. A route that interrupts
  another picks up where the field is (a mostly arrived destination becomes A first).
- **Draw-on (`uReveal`):** in full motion the destination's isolines appear from the valleys
  upward over the `draw` token (900 ms). Lines above the front stay at `revealFloor` (30%), so the
  map never blanks; the front is a little brighter (`revealGain`).
- **Zoom push:** a card's terrain is drawn pushed in (`morphZoom` 0.14 over `zoomBase` 1.06) in
  full motion; the zoom follows the morph.
- **Modes:** full: morph, draw-on and the zoom push. Calm: morph only. Still: no WebGL at all;
  the backdrop's posters cross-fade in 200 ms (`--dur-still`).
- **Pre-warm** (desktop tier, full): hovering or focusing a link to another terrain (cards, About,
  the home link; one delegated `pointerover`/`focusin` listener that reads which link was entered,
  never where the pointer is) loads its heightmap and eases `uMorph` to 0.12 over `prewarm`
  (400 ms), and back on leave. Cards' `prefetchTerrain()` preloads on hover and focus in every mode.
- **Quiet zones through a route change:** from the commit until the View Transition has finished
  and the field's own motion is over, every quiet zone holds the strongest knockout (body text's
  7%, 64 px feather), and so does the column both pages' text covers; then it eases back over
  `medium`. At rest headings (`data-quiet-zone`) fade the lines behind them to 22% with a 48 px
  feather, running text (`.body-copy`, `.knockout`) to 7% with a 64 px feather.

### No pointer input

The field never follows the cursor. R3F's own event layer is off (`events={noEvents}`), so no
raycaster runs on pointer moves over the canvas, and nothing in the field listens for
`pointermove`. There is no drift, line flow, headlamp, parallax or intro sweep. The only input it
takes is the pre-warm's link entry above. `npm run test:e2e -- terrain` checks that a moving
pointer draws no frame; `-- pointer` and `src/lib/pointer.test.ts` keep the rest of the site to
the same rule.

### API

| | |
| --- | --- |
| `fieldStore.set({ morphTarget })` | Morph to a terrain id (`null`: the home region). |
| `prefetchTerrain(id)` | Preload a terrain (cards call it on hover and focus). |
| `fieldStore.get().routeSeq` | Incremented on every route change, also when the terrain stays (the conductor holds the quiet zones; `RouteArrival` starts the page's arrival). |
| `fieldStore.get().shownTerrain` | The terrain on screen once a morph has landed (`null`: the region). |
| `fieldStore.get().tier` | The field's tier once resolved: `"desktop"` (A), `"mobile"` (B), `"low"` (C). |
| `routeTerrain(pathname)` | Path → terrain id (`route-terrain.ts`); `setCardTerrains(map)` sets the card map where there is no document (tests). |
| `planRoute(to, mode, values, …)` | The steps a route change plays (`conductor.ts`, unit-tested). |

Durations: `terrain` 700 ms (morph), `draw` 900 ms (draw-on, the Aare), `breathOut` 240 ms (river
and pin leave), `long` 560 ms (the pin's ping), `micro` 140 ms (the pin appears), `still` 200 ms
(calm's river and pin), `instant` 80 ms (the lines drop to the floor), `medium` 360 ms (the quiet
zones let go), `prewarm` 400 ms. Easings: `summit` for the morph and the draws, `trail` for
appearances, `scree` for what leaves.

## Recentre on Bern

Every navigation to `/about/`:

- 0–700 ms: the terrain morphs to Bern. The contour interval eases in log space from its current
  value to Bern's, so lines multiply as the relief flattens. Nothing scales; no zoom push.
- 200–900 ms: the Aare draws in the `ice` colour (#8FC7E8), the only coloured line in the field,
  in flow direction, and stays.
- 300 ms: a small crosshair pin pings once in `glacier` at the zero point (LV95 E 2'600'000 /
  N 1'200'000, the old observatory).
- Leaving reverses it: the interval returns with the morph, the river and the pin fade out in 240 ms.
- Calm: the terrain and the interval change; the river and the pin appear (200 ms) without drawing
  or pinging. Still and tier C: Bern's poster, with the river and the pin.

The river is a ribbon mesh (`river-material.ts`) in the Bern terrain's coordinates, mapped to the
screen exactly as the field samples its heightmap and widened there to 1.5 px; quiet zones break it
behind text like every other line. The pin is drawn in the contour shader.

### Framing on portrait screens

Bern is framed like `object-position`. Landscape screens frame it on the zero point (u 0.25,
v 0.556 of the window, from `bern.json`), which shows the window's full width: the pin sits a
quarter of the way across, clear of the About title, which takes the right half of landscape
screens from 640 px. Portrait screens frame it from the window's west edge (`BERN_PORTRAIT_U` = 0
in `route-terrain.ts`; `posXPortrait` in `ContourField`), so the Aare runs down a phone's right
edge and the lower part of the screen stays clear for the title and the portrait card. The
backdrop's Bern poster follows the same rule (`--focus-u-portrait` under
`@media (orientation: portrait)` in `TerrainBackdrop.module.css`), so first paint, still mode and
the field agree. `npm run test:e2e -- terrain` keeps the pin and the Aare clear of the title and
the portrait at 1440×900, 1280×800 and 390×844.

**Forced colours** hide the backdrop (field and poster) entirely.

## Device tiers

`field-boot.ts` resolves the tier once the page is idle (lazily loaded; none of it is in a route's
initial JavaScript), from `html[data-tier]` (set before first paint by `motion-mode.ts`):

| Tier | Who | Field |
| --- | --- | --- |
| A `desktop` | fine pointer, long edge ≥ 900 px | DPR cap 2; the 1536 heightmaps from 1400 device pixels on the long edge, the phone ones below; pre-warm |
| B `mobile` | touch, or a long edge under 900 px | DPR 1 at a 0.75 render scale; the phone heightmaps (region 1024, Bern 800); frames only during transitions and scrolling (≤ 30 fps), none when idle |
| C `low` | no WebGL2 (or a software renderer), Save-Data, < 4 GB memory or < 4 cores, a context lost twice this session; and still mode on any device | posters only, cross-fading in 200 ms on route changes |

Tier A keeps a DPR cap of 2: on a 2× screen, a cap of 1.5 drew the lines visibly softer and heavier
(the 1.33× upscale smears a 1.5 px line over two pixels), so the cap was not lowered.

In still mode the store's `tier` reads `"low"` (posters only), whatever the device; leaving still
restores the device's tier.

`?field=force` skips the low-spec checks (headless browsers). Preview builds take
`?tier=desktop|mobile|low` (or `A`, `B`, `C`) and `?dpr=…` for one page load. The backdrop shows
the resolved tier as `data-field-tier`.

## Robustness

- **Context loss:** the poster shows at once (`data-field="lost"`, no fade). The field tries one
  restore (the browser's, or one `restoreContext()` after a second); on restore, Three.js uploads the
  textures again on the next frame. A second loss in the session switches to tier C for the rest of it (`sessionStorage`
  `summit:field-tier`).
- **Pauses:** no frames while the page is hidden, while a `dialog` is open (a `MutationObserver` on
  `open`, so the case-study lightbox and the altimeter's jump sheet need no change) or while the
  context is lost.
- **Heightmap decode failures** keep the poster (`heightmap-loader.ts`). A route whose heightmap
  fails settles back on the terrain on screen.

## Contour intervals per terrain

The interval is the smallest step of the terrain's set that keeps lines on steep terrain (the
map's 95th-percentile gradient) at least `minSpacingPx` apart on screen. Each terrain has its own
set, by relief (`intervalSet` in `field-settings.ts`): under 1000 m of relief (Bern) 10, 20 or
50 m; the Alps 50, 100, 200, 250 or 500 m. With the committed spacing (3.25 px desktop, 3 px
mobile) Bern draws 20 m on phones, small tablets and laptops, 10 m on large portrait tablets
(820 × 1180) and from about 1920 px wide, 50 m on 320 px phones; the region draws 200 m, 250 m and
100 m on the same screens.

## The Bern terrain

`npm run terrain:bern` (`scripts/terrain/bern.mjs`, configured by `scripts/terrain/bern.config.json`)
writes `public/terrain/bern/`:

- **Window:** 12 × 9 km, LV95 E 2'597'000–2'609'000, N 1'196'000–1'205'000. It holds the zero
  point, the Aare through Bern, Ittigen station and the Bantiger (the About climb), each at least
  1 km inside; the script stops if one is not.
- **Elevation:** swisstopo swissALTIRegio (10 m DTM), the same COG and STAC item the region uses
  (`data.geo.admin.ch`); only the window's cells are read (range requests, about 6 MB, cached in
  `scripts/terrain/.cache/`).
- **Heightmaps:** the region's encoding (16-bit heights in R+G, lossless WebP, raw `.bin`
  fallback, reference texels for the runtime decode check) at 0.1 m steps, lightly blurred:
  `heightmap-1536` (1536 × 1152, desktop, about 556 KB) and `heightmap-800` (800 × 600, phones and
  small screens, about 236 KB). `npm run verify:terrain` covers them.
- **The Aare:** swissTLM3D Gewässernetz (swisstopo) through `api3.geo.admin.ch` (identify on
  `ch.swisstopo.swisstlm3d-gewaessernetz`, the features named Aare), stitched, clipped to the
  window, simplified to 5 m and stored in terrain coordinates in flow direction. If that request
  fails the script traces the DEM's valley floor instead (and says so in `bern.json`).
- **Posters:** 10 m and 20 m (800 × 600; still mode, tier C), with the river and the pin, picked by
  the same spacing rule as the field.
- **Altitude at the zero point:** read from the DEM and rounded: 554 m. The script checks the DEM
  against the city's figures (lowest point 481 m, main station 541 m, within 6 m) and stops if
  they disagree.
- **Metadata:** `bern.json` (what the field needs: encoding, texels, intervals, the river, the
  zero point's u and v), and two small extracts: `posters.json` (the backdrop's posters, their
  focus and the gradients their media queries use) and `summary.json` (the zero point's altitude
  and the interval set, for the unit tests).
- `-- --refresh` re-downloads; `-- --placeholder` builds seeded noise (480–950 m) without the
  network, flagged `"placeholder": true` everywhere, with no altitude and no river.

**Data status:** real swisstopo data (swissALTIRegio, updated 2026-06-01) and the official river
network; no placeholder is committed.

## Summit terrains

The three case studies climb real mountains, and their cards are cut from the real terrain:
crops of the region's DTM around the Eiger (Seilschaft, by the Mittellegi ridge), the Mönch (Test
Project, by its southeast ridge) and the Jungfrau (Gratweg, by the Rottalsattel). Each is a `crop`
card in `src/content/terrain.config.json`: a centre in LV95, a width (6, 5.5 and 5 km), aspect
1.5, a 150 m contour interval and a 448 px morph heightmap (448 × 299). `npm run terrain` draws
its trail through the verified places named in `trailPlaces` (from `src/content/geo-data.json`)
and pins each at its spot height; the last pin is the summit (3'967, 4'110 and 4'158 m). The cards'
SVGs stay under 10 KB and the morph heightmaps around 40–43 KB. All three are flagged examples, so
they are listed in `public/terrain/examples.json`, not in `terrain.json`.

A case study's ascent (its six stages and summit, `ascents` in `src/content/geo.ts`) is chosen
by its card's terrain id: `eiger`, `moench` or `jungfrau`. A card on any other terrain has no
ascent, and its case-study page refuses to build. `npm run terrain -- --only=<id>` rebuilds one
card terrain and its metadata without touching the region (after `npm run geo` has changed a
place, for instance).

## Geo data

`npm run geo` (`scripts/geo/build.mjs`, configured by `scripts/geo/geo.config.json`) writes
`src/content/geo-data.json`, committed; `src/content/geo.ts` types it. Every altitude carries its
source.

- **Places:** names, positions and official spot heights from swissNAMES3D (2025, the national
  map's names in 3D, read from swisstopo's yearly CSV through a small ZIP reader so the script runs
  on every OS), each cross-checked against the swissALTI3D height service (`dem`). They agree within
  2 m everywhere but the Jungfrau railway's stations inside the mountain (Eismeer, Jungfraujoch),
  where the DEM reads the rock above the tunnel. Unnamed points on a ridge (the upper Mittellegi
  ridge, the Mönch's southeast ridge) take the height service's crest value.
- **swisstopo wins every conflict** with the research values in the config, and each place keeps
  the conflict next to its value: Eiger 3'967 (not 3'970), Eismeer 3'160 (not 3'118), Mönchsjoch
  hut 3'656, Mönch 4'110 (not 4'107), Rottalsattel 3'877, Mittellegi hut 3'354, Eigergletscher
  2'322, the Bantiger tower's foot 937. A place swisstopo cannot answer for keeps its research value,
  flagged `unverified` (none at present). Values from outside swisstopo are flagged `secondary`:
  the tip of the Bantiger tower, about 1'129 m.
- **Stations:** places that are railway stations are marked `station`; the stages after an
  ascent's last station are climbed on foot, so the red route is blazed from there.
- **The About climb** (`aboutClimb`): Ittigen station (526 m) → Bolligen (539 m) → Ferenberg
  (726 m) → the Bantiger (947 m) along the swissTLM3D hiking trails, routed through the network
  (7.97 km), with heights from the profile service at 405 points resampled to 160
  (`[distance m, elevation m]`), each stop's distance along the trail and how far it was snapped
  onto it. The career profile on About draws it; the Bern terrain behind the page holds the same
  ground.
- Downloads are cached in `scripts/terrain/.cache/geo/`; `-- --refresh` fetches everything again.
  Run `npm run geo` before `npm run terrain`, which reads the places for the card trails.

## Checks

- `npm test`: `routeTerrain`, the interval sets (Bern's 12 km window draws 20 m on a laptop and a
  phone), the conductor's plan and timeline (`src/lib/terrain.test.ts`).
- `npm run test:e2e -- terrain` (a preview build): `scripts/e2e-terrain.mjs`, through the
  preview-only debug hook `window.__terrain` (timeline events, state, frame count, `loseContext()`,
  `freeze()`): the morphs' timing from the commit, Bern's interval, river and pin, no frames while a
  page is read or the pointer moves, pre-warm, calm and still, About's clearings, context loss,
  tier B, the pause behind a dialog.
- `npm run check:legibility`: also measures text over a field frozen mid-morph with the hold on.
