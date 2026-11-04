# Terrain

The contour field ("living survey") is one WebGL2 canvas behind every page: real swisstopo
contours, always there and slightly alive, never asking for attention. The site and the password
gate draw it with the same code, `src/field/core.ts` (no imports, so the gate can inline it). The
site's adapter, `src/field/index.ts`, adds the tuning (`src/config/contour-field.json`), the
terrains (`public/terrain/field/field.json`), the motion tier and its inputs; `TerrainBackdrop`
mounts it once from the root layout.

## What it draws

- Regular lines 1 px at 28 %, every fifth an index line at 1.5 px at 42 %, in stone grey
  (`fieldLine`) on the ground. Anti-aliased with `fract`/`fwidth`; lines that crowd closer than
  ~2 px (cliffs) fade instead of aliasing. No mint, no colour, no labels.
- The contour interval follows the screen: the finest of the terrain's set (alpine 50–500 m,
  lowland 10–50 m) that keeps steep lines at least 3.25 px apart (3 on phones). The region draws
  200 m on laptops and phones, like the gate.
- Quiet zones: behind `[data-quiet-zone]` and `.body-copy` the lines fade to 25 % with a 48 px
  feather (`src/field/quiet-zones.ts`), like contours broken under a printed map's labels. Over the
  static poster there are no quiet zones: those texts get a soft ground halo instead (globals.css).

## How it moves

| | Full | Calm | Touch | Off |
| --- | --- | --- | --- | --- |
| Drift (Lissajous, 120 s and 150 s, ≤ 1.9 px/s) | 28 px | half | half | none |
| Breath (iso levels ±0.15 of an interval) | 24 s | none | 32 s | none |
| Pointer bump (fine pointers only) | ≤ 6 px | ≤ 3 px | none | none |
| A page change | dim + crossfade | dim + crossfade | dim + crossfade | posters crossfade (160 ms) |

- **Pointer bump**: a Gaussian bend ~180 px wide at a lerped pointer (0.06 a frame at 60 fps). Its
  strength follows the pointer's speed on a bounce-free spring (stiffness 60, damping 18); with the
  pointer resting it settles to 40 % within ~1.2 s, and to 0 when the pointer leaves the page.
- **A page change**: the field dims to 60 % over 0–400 ms, then crossfades its lines to the next
  terrain while coming back to full strength (400–1600 ms). Two slots, A on screen and B the
  destination; a route that interrupts another picks up where the field is.
- **Frames**: on demand. About 30 a second at rest (drift and breath), 60 while the bump or a
  crossfade moves, none while the tab is hidden, a dialog is open, the canvas is off-screen or the
  tier is Off. The device-pixel ratio is capped at 1.5 on desktops and 1.25 on phones.

## Terrains

One height field per page type, ≤ 150 KB each (lossless WebP, heights packed in R and G, with a
gzipped raw fallback): the home region framed on Interlaken, Bern for About (on its zero point;
on portrait screens from the window's west edge), and each case study's summit (the Eiger, the
Mönch, the Jungfrau). `routeTerrain` (`src/components/terrain/route-terrain.ts`) maps a path to
its terrain.

- `npm run terrain` and `npm run terrain:bern` read swisstopo's swissALTIRegio (downloaded once
  into a git-ignored cache) and write the full-resolution masters to `terrain/` (committed; the
  site never loads them).
- `npm run terrain:field` derives the field's maps from them: area-averaged down to the largest
  width under the budget, lightly blurred (σ ≈ 1 texel, like the gate's former poster) and stored
  in height steps a fraction of the finest interval (4 m for the region, 0.5 m for Bern). The
  terrain scripts run it at their end.
- `npm run posters` renders each terrain's first frame (t = 0: no drift, no breath, no pointer)
  with `src/field/core.ts` in Chromium, landscape 1600 × 1000 and portrait 900 × 1600, as AVIF
  ≤ 60 KB. The poster is the first paint, the Off tier and the fallback without WebGL2; the field
  fades in over it on the identical frame.
- `npm run plates` writes the cards' art (`scripts/plates/build.mjs`): each summit's master cropped to
  4:3 around the summit and contoured at the card's interval in the field's language (1 px lines,
  1.5 px index lines every fifth, stone grey) with one mint index line, as an SVG ≤ 25 KB in
  `public/plates/`. A second plate, `<id>-level.svg`, steps the index emphasis and the mint line
  up one contour: the card's hover crossfades to it, and the case study's header shows it. The
  terrain scripts run it at their end.
- `npm run verify:terrain` decodes every master and field map and compares it with the heights
  the pipeline wrote. In the browser, the first upload of each map is read back once per session
  (16 reference texels); a browser that alters the decode gets the raw heights instead.

## Device tiers

`html[data-tier]` (the pre-paint script) is the starting point: "desktop" (a fine pointer and a
long edge of at least 900 px), "mobile", or "low" (Save-Data, little memory or few cores).
`field-boot.ts` lowers it to "low" without hardware WebGL2 or after a lost context; "low" shows the
posters only. `?field=force` skips the low-spec checks (headless browsers); preview builds take
`?tier=desktop|mobile|low`.

## Checks

- `npm test` (`src/lib/terrain.test.ts`): routes → terrains, intervals, the budgets of maps and
  posters, drift ≤ 2 px/s and loops ≥ 12 s, the breath, the bump's limits and its spring (no
  overshoot, ~40 % at rest), the crossfade within 1.6 s, the frame and pixel caps.
- `npm run test:e2e -- terrain`: poster first, the field taking over, the idle and active paces,
  no frames while hidden, no DOM change under a moving pointer, the summit on a case study, a
  lost context, Off (no canvas, nothing running) and touch (no bump).
- The lab (`/lab/terrain/`, preview builds) crossfades between every terrain and shows the frame
  count.
