# Feedback round 3

One session, on `main`. Contract changes: [Feedback round 3](../contracts.md#feedback-round-3)
(R1–R9). The plan is in `docs/backlog.md` (and below).

## Plan

Background and flicker first (every other check depends on a stable field), then the rest:

1. Item 4, chapter 05 flicker (R4).
2. Item 1, About's morph (R1).
3. Item 2, no pause button (R2).
4. Item 5, reveal timing (R5).
5. Item 3, the header logo's motion (R3).
6. Item 6, drawn chapter numerals (R6).
7. Item 7, the two-lane timeline (R7).
8. Item 8, the thesis overview (R8).
9. Item 9, the idle note and logo ↔ Back (R9); verification; push `main`; deploy check.

## What shipped

- **R4** `src/components/background/field-engine.ts`, `field-gl.ts`, `src/motion/scenes/deal-scene.ts`
  (`scenes/pin.ts` deleted), `src/components/header.module.css`. Cause and fix: `docs/backlog.md`.
- **R1** `public/terrain/field.webp` + `src/components/background/terrain.ts` (built by
  `scripts/terrain/build-field.py` from the portfolio repository's 1536 × 1056 master),
  `shader.ts`, `field-gl.ts` (texture, reference texels), `field-engine.ts` (the morph's phases,
  resolution and guard, handoff), `contour-layer.ts` (opacity fades, the drift), `contours.ts`
  (the SVGs' drawing and the one media query), `background-field.tsx` (`<picture>` + `<img>`,
  vignette), `src/styles/field.css`.
- **R2** `ambient-toggle.*` deleted; header, `use-tier.ts`, `preferences.ts`, the engine, both
  `site.ts`, the schema, the smoke check.
- **R5** `src/motion/reveal-trigger.ts` (new), `reveal.ts`, `kinds.ts`, `reveal.css`, tokens.
- **R3** `src/components/logo.tsx` (Motion `animate` from `motion/mini`, `hover`, `press`), `header.tsx`, `header.module.css`, `view-transitions.css`,
  `first-load.ts` (`CHROME_IN`), tokens (`logo`, `ease.enter` / `move` / `exit`).
- **R6** `scripts/build-numerals.mjs`, `scripts/assets/` (TTF + OFL),
  `src/content/generated/numerals.ts`, `src/components/layout/chapter-numeral.tsx`,
  `numeral-breaker.tsx`, `src/motion/numeral-stroke.ts`, `layout.css`; fontkit (dev).
- **R7** `src/components/about/career-timeline.tsx`, `thesis-stop.tsx`, the About page,
  `pages.css`, schema and both `about.ts`, `content.ts` checks, the `deck` deal mode.
- **R8** `src/app/[locale]/about/thesis/page.tsx`, `src/components/thesis/`,
  `src/components/illustrations/thesis/`, `content/<locale>/thesis.ts`, schema, the table store
  and pre-paint script (`data-about-map`), `detail.css`.
- **R9** `src/eggs/idle-hint.tsx`, `idle.clearance`.

## Decisions

- **Heightmap**: the brief named the 1536 × 1056 master; at that size no lossless encoding comes
  near 150 KB (725 KB at 1 m, 408 KB at 4 m). The shipped 768 × 528 image is that master averaged
  2 × 2, blurred σ 0.6 and stored in 4 m steps (147 KB with the lake mask). Its contours lie a
  median 0.09 viewBox units (p90 0.23) from the posters' vertices, closer than the 1536 master
  itself (0.20); the 1024 master fits about as well (0.11) but cannot reach the budget either.
  Offset 536.25 m from the master's `terrain.json`, scale 4 m (the same as the portfolio's field
  map `field.json`).
- **Lines**: the width estimate is the derivative's length (fwidth's Euclidean form): `fwidth()`
  sums |dx| + |dy| and drew diagonal lines up to 41% too wide (30% more ink than the SVG). Heights
  are Catmull-Rom over exact texels. With both, the shader's last frame has 4% more line ink than
  the SVG (small closed loops the posters drop), the same peak values, mean pixel difference 0.7 of
  255 at 1440 × 900.
- **Handoff**: the SVG layer is the ground plus the `<img>`, so it can crossfade (opacity 0 → 1)
  over the canvas without a dip; once it covers the canvas the canvas is hidden
  (`data-canvas-covered`) rather than faded under it (fading both at once would darken the middle
  of the crossfade over the black field).
- **Drift** keyframes: 0 → (+8, +5) → (−8, −5) → 0 per 120 s, alternating; it starts at the
  handoff and is held while the SVG fades out, the shader's leaving frame drawn at the held offset.
- **Logo egg**: the lab's "Reveal letters" moment as defined (letters hidden as the turn starts,
  shown from the moment the card is edge-on), then a second turn back after 1.6 s. A long press
  works wherever the logo shows (it never navigates).
- **Thesis slots**: two in 06 (knowledge base, check-in) and the round-2 source labels in 07, next
  to the testing drawing.
- **German**: the 07 sentence about the letter itself says "Eszett": German strings may not
  contain it (the build checks it).

## Deviations

- The brief's 1536 × 1056 heightmap size (see above): smaller, as the budget asked.
- No Lighthouse, axe or cross-browser runs (as briefed).

## Verification

Environment: headless Chromium in a container without a GPU, so WebGL is SwiftShader (the
shader runs on the CPU) and compositing is software. Paint and raster task durations are
meaningful; frame rates are not (about half the frames of a full-resolution shader frame drop
here, a GPU would draw them).

- `npm run build` (static export, content checks for both locales): passes.
- `scripts/smoke.mjs`: all checks pass for de and en, full and reduced, at 1440 × 900 and
  390 × 844 (new: About's morph in and out, the SVG layer, no pause button, the two-lane timeline,
  the thesis route, the projects link, the idle note where it fits, the deal cards' layers).
- `scripts/images/check.mjs`: passes (the removed-files list now names round 3's removals).
- `scripts/budget.mjs http://localhost:4100/random/en/` (advisory, D7): 180.9 KB gzip initial JS
  (round 2: 167.7 KB). The logo first pulled Motion's full `animate()` into every page (203 KB);
  it now uses the WAAPI-only `animate` from `motion/mini` (transforms and opacity are all it
  animates). The rest is this round's client code (the morph engine, the logo, the timeline card).
  The script fails on the root address (`/random/`), which redirects to a locale before it can read
  the response; pass a locale's home.
- **About's morph** (Chrome trace, home → About → home, 1440 × 900, the page content removed so
  only the background counts, the WebGL path): in, 9 paints (longest 0.18 ms; 1.0 ms at 4× CPU
  throttle), 3 raster tasks (longest 0.7 ms); out, 18–20 paints (0.19 ms; 0.96 ms at 4×), raster
  longest 1.9 ms. No Paint or Rasterize task over 4 ms. The paints are one-off state changes
  (the header's current link, the layers' display). At rest on About: no paints in 3 s, zero
  WebGL draw calls. With the whole page (its own reveals included): paints up to 1.9 ms (8.9 ms at
  4×, the page's text reveals). Found on the way and fixed: the hidden CSS fallback layer kept
  breathing and repainted every frame under the canvas on every page; the SVG layer was only
  rasterised when its crossfade began (primed at opacity 0); both in R1.
- **Shader vs SVG** (the SVG held back so the shader's last frame shows, then released): mean
  pixel difference 0.7 / 255, 1.3% of pixels over 6 levels (1440 × 900, 200 m); line ink within
  4%; geometry matches at 1920 × 1200 (100 m) too.
- **Chapter 05** (team-of-teams, slow and fast scrolling through the pinned deal, both ways):
  1440 × 900 and 390 × 844: zero canvas resizes, the four cards keep `will-change: transform` for
  the scene's lifetime (desktop; no scene on phones), longest paint 0.72 ms (desktop) / 4.25 ms
  (phone, the page's reveals). Chrome here reports no paint-invalidation rects, so paint flashing
  itself was not inspected.
- Visual checks (screenshots): numerals overlap the CSS numeral (92% of stroke pixels), draw
  contour by contour; the timeline at 1440, 1024, 390 and 360 (no horizontal scroll, text ≥ 14 px
  on phones); the logo at rest, hovered, mid-turn, turned, Back and back; the thesis page at 1440
  and 390; the timeline card → thesis hero morph both ways; the no-WebGL fallback crossfades the
  SVG in and out.
