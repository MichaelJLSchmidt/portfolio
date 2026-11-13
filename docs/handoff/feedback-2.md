# Feedback round 2

One session (the only one running) applies the second round of design feedback: M1–M3 (motion
settings), N1 (navigation), H1–H2 (home), A1–A3 (About), B1 (background) and F1–F3 (fixes).
Everything not named there stays as it is. Every new or changed visible string exists in German
and English.

## Branch

`claude/brave-einstein-jt7iyv`, merged into `main` once verification passes; `main` is pushed and
deployed once.

## Plan

Small commits in this order: motion settings, navigation, home, background, About, fixes, smoke,
docs.

**Motion settings**

- M1: two tiers only, `full` and `reduced` (`prefers-reduced-motion`). Out: `CalmSwitch` and its
  CSS, `MotionTier`'s `calm`, `motionScale.calm`, `tiers.calm`, `duration.svgDrawCalm`,
  `duration.calmBloom`, the stored `motion` preference and its pre-paint branch, every
  `tier === 'calm'` branch (kinds, first load, eggs, play, deal scene, field), `site.settings.calm*`
  copy and schema, the calm smoke and audit options, and the docs.
- M2: `AmbientToggle` in the header (where the calm switch was): an icon-only button (pause / play
  glyph, 16 px icon in a 44 px target), `aria-pressed`, accessible name "Pause background motion" /
  "Play background motion" (German "Hintergrundbewegung anhalten" / "… abspielen"). The choice is
  stored in localStorage (`ambient`) and applied before first paint as `html[data-ambient="paused"]`
  by the pre-paint script, which stays the single writer. Paused stops only ambient background
  motion: the field's breath and pool drift (its clock stops; hover, bloom and morphs still run) and
  the About contour drift. Hidden under reduced motion (the background is still then).
- M3: `idle.after` 10 s (`?idle` stays 1 s).

**Navigation**

- N1: `src/motion/header-scroll.ts`, started by the header: one passive scroll listener,
  rAF-throttled, writes `html[data-header="hidden"]`. Hides after more than 8 px of downward scroll
  in one direction past the header height; shows after 8 px upward. Always shown near the top, on
  pages that do not scroll, on focus inside the header, while the mobile sheet is open and after
  every route change; scroll changes during a view transition and overscroll bounce are ignored.
  CSS: `translate` only, 200 ms ease-in to hide, 240 ms outQuint to show (tokens); reduced: a
  160 ms crossfade, no slide. The mobile rail follows the same attribute (its own scroll logic and
  `data-rail` go). The reading hairline stays on screen at the top edge while the header is away.
  `scroll-padding-top` keeps anchors clear.

**Home**

- H1: the "What I bring" label and the three items align on one baseline from 1024; below, the
  label stays above the stacked items.
- H2: "Pick a card" centred at every width.

**Background**

- B1: `public/contour-bg/*.svg` (present, used unchanged) drawn by a `.contour-bg` layer inside the
  background field (above the canvas, below the content) with the old password page's CSS; every
  `url()` passes through `withBase()` (inline custom properties). Ground `#1B1C18`. No headlamp, no
  pointer. The poster drifts (transform only, ±8 / ±5 px, 120 s alternate, scale 1.03; tokens in
  `field.contourDrift`); stopped when paused, under reduced motion and while the tab is hidden. The
  morph: the shader's `uTopo` now contracts the pools and fades them into the ground, while the
  contour layer reveals through a radial mask growing from the centre (1.6 s inOut); at rest the
  WebGL field draws no frames; leaving reverses it; reduced: a 160 ms crossfade. The SVG is fetched
  when an About link is hovered, focused or touched (and on About). Removed: the heightmap shader
  code, `terrain.ts`, `public/terrain/`, `field.contours`, the posters and `data-poster`. The credit
  "Terrain data © swisstopo" / "Geländedaten © swisstopo" links to swisstopo's terms of use (footer
  small print, and the left edge from 1024).

**About**

- A1: `ContourPortrait` and its copy go; `about-portrait` (Nik Bagherzadegan, Unsplash License,
  `crop: [4, 5]`) through `fetch-and-build.mjs`, alt text in both languages, in the hero where the
  drawing was.
- A2: "Timeline" / "Werdegang" as seven face-up cards (the "What's on the table" card family):
  years (mono), title, place (`about.timeline.items[].place`, new in both languages). From 1280 a
  line across the content width, the cards dealt from a small face-down stack at its left end
  (120 ms apart, 420 ms each, outExpo, as the section enters); 1024–1279 a scroll-snap strip with
  the line through it; below 1024 a vertical line on the left, cards at reading width, each dealt
  in from the left as it enters. Reduced: static. A new reveal kind `deal` runs both rows.
  `AboutTimeline`, its copy and `timeline-scene.ts` go.
- A3: "How I work" as four face-up cards (number, title, body at the body size): from 1024 a row
  dealt in with a slight fan that settles straight, 640–1023 2×2, below 640 one column. No flip,
  no hover lift.

**Fixes**

- F1: `dist/404.html` takes the locale from the address when it has one; stored and browser
  language decide only for addresses without one.
- F2: German "Design-System".
- F3: the home intro smoke check compares each part's start (the reveal job marks the block
  `data-revealed` when its animation starts) instead of when it crosses an opacity threshold.

**Smoke** (`scripts/smoke.mjs`): calm option and switch checks out; new checks for the ambient
toggle (state, storage, pre-paint, hidden in reduced), the header hiding and returning on a case
study, the rail in step, the About contour layer (no frames at rest, drift, paused, no pointer
reaction), the 404 locale rule, the timeline and how-I-work cards.

**Docs**: contracts (a "Feedback round 2" section, reference sections updated), art direction,
backlog, README where it names the calm switch.

## What shipped

- **M1** The calm tier is gone everywhere (`MotionTier` is `full | reduced`; tokens, tier helpers,
  pre-paint script, CSS, eggs, field, copy, schema, smoke, audit, docs). `CalmSwitch` deleted.
- **M2** `AmbientToggle` (`src/components/ambient-toggle.tsx`): a 16 px pause / play glyph in a
  44 px target, `aria-pressed`, stored in localStorage (`ambient`), applied before first paint
  (`html[data-ambient="paused"]`), hidden under reduced motion. Paused freezes the field's clock
  (breath and pool drift stop where they are), the CSS fallback's breath and the About contour
  drift; hover, bloom, switch, the About morph, transitions and reveals still run.
- **M3** `idle.after` 10 s; `?idle` 1 s.
- **N1** `src/motion/header-scroll.ts` (passive, rAF-throttled) writes `html[data-header]`;
  translate only, 200 ms ease-in out, 240 ms outQuint back; reduced crossfades. The rail follows
  the same attribute (its own scroll logic is gone). The reading hairline stays at the top edge.
- **H1** `align-items: baseline` on the "What I bring" row from 1024. **H2** hint centred always.
- **A1** `about-portrait` through `fetch-and-build.mjs` (`crop: [4, 5]`, 2048 × 2560), alt text in
  both languages, credited in the footer. `ContourPortrait` deleted.
- **A2** Seven face-up cards (`about.timeline.items[].place` added in both languages); the
  `deal` reveal kind: stack deal from 1280, scroll-snap strip 1024–1279, vertical line with cards
  dealt from the left below. `AboutTimeline`, `timeline-scene.ts` and the `timeline` tokens deleted.
- **A3** Four face-up cards; a fan deal that settles straight from 1024; 2×2; one column.
- **B1** `.contour-bg` in the background field with the old page's CSS (url()s via
  `withBase()`), drift tokens `field.contourDrift`, the pools contract and fade into the ground
  while a radial mask opens the layer (1.6 s inOut), no canvas frames at rest, reduced 160 ms
  crossfade. `terrain.ts`, `public/terrain/`, `field.contours`, `contour.line`, the posters and
  the heightmap shader code deleted. Credit "Terrain data © swisstopo" / "Geländedaten © swisstopo"
  links to swisstopo's terms of use (footer, and the left edge from 1024).
- **F1** `dist/404.html`: the address's `/de/` or `/en/` wins. **F2** "Design-System" (and
  "Design-Systems", "Design-Systemen"). **F3** the intro check reads the animations' start times.

## Decisions

- **Pause button name.** The accessible name stays "Pause background motion" ("Hintergrundbewegung
  anhalten") in both states and `aria-pressed` carries the state: a toggle button's name must not
  change with its state (WAI-ARIA APG), otherwise screen readers announce "Play background motion,
  pressed" for a paused background. "Play background motion" ("Hintergrundbewegung abspielen") is
  the tooltip while paused.
- **Pause = freeze.** Pausing stops the field's clock where it is instead of easing the breath
  away, so pause / play never shows a jump; hover pull and blooms keep running (interaction, not
  ambient motion).
- **The contour layer lives in the background field** (above the canvas, below the content), so
  the morph shares the field's state machine; the engine writes `--contour-reveal` with the same
  duration and curve as the shader's fade. The url()s come in as custom properties set with
  `withBase()` (CSS cannot read the base path). The SVG is preloaded on About-link intent.
- **Drift loop.** "120 s alternating loop" read as one loop there and back in 120 s (60 s each way,
  `--dur-contour-drift`), ease-in-out, from (−8, −5) to (+8, +5) px at scale 1.03.
- **Timeline place.** Each stop's title was split into a title and a place (organisation and
  city) in both languages; the Hyper Island detail line was dropped (backlog).
- **Card proportions below 1024.** At reading width a 132 × 184 card would be far taller than its
  three lines, so below 1024 the timeline and How I work cards keep the family's edges, corners
  and labels but take their height from their content; from 1024 they keep the proportions (and
  grow only when the words need it).
- **1024–1279 strip** is not dealt (only the ≥ 1280 row is); it rises as one block.
- **Hairline in reduced.** While the header is away it moves to the top edge at once (no slide).
- **Idle note on phones.** With "Pick a card" centred, the note sat on top of it at 390 px. Both
  point at the cards, so below 1024 the hint steps back (fades out) while the note shows and
  returns when it goes; the note keeps its place (moving it up ran into the "What I bring" items).

## Deviations

- M2: the accessible name does not switch to "Play background motion" (see Decisions); that text
  is the tooltip.

## Review

A subagent reviewed the diff against the numbered items. One finding, fixed: from 1024 to about
1150 px the How I work cards took their width from the stretched row height (aspect ratio), so
they overlapped and the page widened at 1024. A definite width keeps them in their columns
(measured at 1024, 1100, 1180, 1280, 1440 and 1920 px in both languages: no overlap, no clipping,
no page overflow). Nothing else was missing or wrong.

## Verification

- `npm run build` (BASE_PATH=/random/): passes, type check and the content checks for both
  locales included; `node scripts/images/check.mjs`: 13 photos, ok.
- `scripts/smoke.mjs` at 1440×900 and 390×844 on the final build: de full 208 ok, de reduced 197
  ok, en full 208 ok, en reduced 197 ok, no failures.
- `scripts/budget.mjs http://localhost:4100/random/de/`: 167.7 KB gzip initial JS (within 170 KB).
  Pointed at the root (`/random/`) it fails, because the root replaces its URL with a locale
  before the script can read the response.
- By eye (Playwright screenshots): the About background at 1440×900 and 390×844 (lakes, line
  weights and opacity, vignette), the morph in and out of About, 0 canvas frames at rest and no
  change under the pointer; the header leaving and returning on a case study (full and reduced,
  rail in step); the timeline and How I work cards at 390, 1024, 1280 and 1440 px and mid-deal;
  the home baseline and the centred hint at 1440 and 390; the idle note (10 s; `?idle` 1 s) at
  360–430 px.
