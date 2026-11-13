# Motion session

Branch: `claude/motion-choreography-reveals-och1mz` (pushed only there; never `main`).

## Plan

Written before editing. Everything attaches through the documented hooks (`<Reveal>`,
`<FirstLoadSequence>`, `<ReadingHairline/>`, `useDealScene`, `data-draw` / `data-draw-group`,
`data-hero-target`, `data-illustration`); no page file is edited.

1. **Engine** (`src/motion/reveal.ts` + small modules beside it). One reveal system for the eight
   kinds. CSS (`src/styles/reveal.css`) only hides armed, unrevealed blocks with `opacity: 0`;
   every movement is a WAAPI animation started by JS (backwards fill holds the start pose), so
   reduced motion never sees a transform and no-JS visitors get the final page after the 4 s
   arming timeout. Triggers: `data-reveal-order` blocks in the first viewport play in sequence
   after the route's base offset; every other block reveals with Motion `inView` (amount 0.25,
   margin from `reveal` tokens, once), batched per frame and staggered in document order so two
   adjacent blocks never start together with the same reveal. A job scheduler caps concurrent
   reveal jobs at 8 below 1024 px (the rest queue), sets `will-change` only while a job runs and
   cancels finished animations so everything is still at rest. Legacy `data-reveal` presets and
   `data-order` groups still in the current pages map onto the new kinds (aliases) until Layout's
   pages land; their CSS presets and the `--reveal-calm` / `--reveal-reduced` timings go (D4).
2. **First load** (`<FirstLoadSequence>` on home): the timeline below, plus `[data-chrome]` last;
   same-session revisits and client navigations to home crossfade everything within 300 ms.
   Any key, click, wheel or scroll completes the sequence (as before).
3. **Kinds**: lines (Motion+ `splitText` after `document.fonts.ready`, lines in clip masks,
   reverted afterwards), block, list, image, digits (digit strips), rule, draw (SVG strokes by
   group, tint fills after their group), note (after its related paragraph).
4. **Scroll-linked** (full tier only, at most one per viewport): reading hairline (CSS
   `animation-timeline: scroll(root)` behind `@supports`, Motion `scroll()` fallback; it stays as
   a progress indicator in calm and reduced, drawn with clip-path in reduced), `.hero-drift`
   (CSS `view()` behind `@supports`), the pinned deal (`useDealScene`, desktop ≥ 1024, Motion
   `scroll` on the stage, five phases, field at half resolution while pinned), About timeline
   strokes linked to view progress (native `ViewTimeline`; normal draw reveal otherwise).
5. **Tiers**: full / calm (× 0.6, no pinning or parallax, split only h1/h2, SVG draws 500 ms) /
   reduced (160 ms opacity only, SVGs drawn, digits static, field static, view transitions
   crossfade).
6. **D3**: `heroTarget()` measures `[data-hero-target]` at play time, falls back to the computed
   geometry.
7. **Eggs and smoke**: eggs keep working on the new timings; `scripts/smoke.mjs` gains per-tier
   checks (reduced: no transforms; calm: the deal stacks). A temporary lab route exercises every
   kind, the deal scene and the hairline; it is deleted before the final commit.
8. Review the diff against the spec with a subagent; verify with the production build and
   Playwright at 1440×900 and 390×844.

### Frame timeline (full tier; calm × 0.6; reduced: every offset 0, 160 ms opacity)

Token names in brackets. Values the tokens do not have yet are named constants in
`src/motion/choreography.ts` (see contract change requests).

**First load (home, first visit in the session)**

| Element | Start (ms) | Duration (ms) | Easing | Stagger (ms) | Ends (ms) |
| --- | --- | --- | --- | --- | --- |
| Hand cards (4), dealt from off screen, flip face up | 0 | 420 [`dur.m`] | outExpo [`ease.draw`] | 80 [`stagger.cards`] | 660 |
| Title words turn up (rise from the word mask + rotateX [`angle.word`]) | 520 | 640 [`dur.l`] | outExpo | 70 [`stagger.words`] | 520 + 70·(n−1) + 640 |
| Title opsz 24 → 96 / wght 280 → 700 settle [`opsz`, `weight`] | 520 | 900 [`dur.xl`] | outQuint | 70 [`stagger.words`] | – |
| Role line (`lines`) | 900 | 640 [`dur.l`] | outExpo | – | 1540 |
| Intro lines (`lines`) | 1000 | 640 [`dur.l`] | outExpo | 60 [`stagger.lines`] | 1640 + 60·(n−1) |
| Divider (`rule`, scaleX from the left) | 1300 | 640 [`dur.l`] | inOut | – | 1940 |
| The rest (hint, "On the table now", label), each by its kind | 1300 + 50·(i+1) | by kind | by kind | 50 [`stagger.items`] | – |
| Chrome (`[data-chrome]`: header, card counter), opacity | after the rest | 240 [`dur.s`] | outQuint | 50 [`stagger.items`] | – |
| Revisit (same session) / client navigation to home: every part, opacity | 0 (title), 60 (rest) [`stagger.lines`] | 240 [`dur.s`] | outQuint | – | ≤ 300 |

**Other first viewports** (`data-reveal-order`): start = base + 80 [`stagger.cards`] × (order + 1)
+ `delay`; base = 0 on load / nav, 348 ms (`duration.zoom` × 0.6) after a play or switch. The h1
reveals at the base (play / switch: final at once, its title morphs in the view transition).

**Reveal kinds (below the fold: Motion `inView`, amount 0.25, once)**

| Kind | Target | From → to | Duration (ms) | Easing | Stagger (ms) | Calm | Reduced |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lines | each split line in an `overflow: clip` mask | translateY 110% → 0 | 640 [`dur.l`] | outExpo | 60 [`stagger.lines`] | split only h1/h2; other elements as `block` | opacity 160 |
| block | the element | translateY 12 px → 0, opacity 0 → 1 | 420 [`dur.m`] | outQuint | – | 252 | opacity 160 |
| list | each direct child | translateX −12 px → 0, opacity 0 → 1 | 420 [`dur.m`] | outQuint | 50 [`stagger.items`] | 252 / 30 | opacity 160 (whole list) |
| image | media box / inner img | clip inset(10% round 12px) → inset(0 round 4px); img scale 1.12 → 1 | 900 [`dur.xl`] | outExpo | – | 540 | opacity 160 |
| digits | each `[data-digit]` strip | rolls up from blank to the digit | 700 total per value | outExpo | 40 per digit [`stagger.metric`], 50 per item | × 0.6 | static |
| rule | the element | scaleX 0 → 1, origin left | 640 [`dur.l`] | inOut | – | 384 | opacity 160 |
| draw | `[data-draw]` (pathLength 1) | stroke-dashoffset 1 → 0; 8% tints opacity after their group | 1200 | inOut | 120 per group [`stagger.svgGroups`] | 500 / 72 | drawn, opacity 160 |
| note | the element | opacity 0 → 1, after its related paragraph ends | 240 [`dur.s`] | outQuint | – | 144 | 160 |

Blocks that enter view in the same frame start 50 ms apart in document order, and a block that
reveals with the same kind as the block before it starts at least 80 ms [`stagger.cards`] after
it, so no two neighbours share a timing.

**Scroll-linked (full tier)**

| Effect | Driver | Range | Values |
| --- | --- | --- | --- |
| Reading hairline | CSS `scroll(root)` / Motion `scroll()` | whole document | `--reading-progress` 0 → 1 |
| `.hero-drift` | CSS `view()` | `exit` | translateY 0 → 6% |
| Pinned deal (≥ 1024) | Motion `scroll`, target = stage, offset `start start` / `end end` | stage ≤ 250svh | 0–0.2 card 1, 0.2–0.4 card 2, 0.4–0.6 card 3, 0.6–0.8 card 4, 0.8–1 settle |
| About timeline | `ViewTimeline` | entry 100% → cover 60% | groups drawn in order across the range |

## What shipped

All of it attaches through the documented hooks; no page, layout component, illustration, content
or Foundation file was edited.

- **Reveal engine** ([Reveal](../contracts.md#reveal)). `src/motion/reveal.ts` (orchestration:
  home sequence, `data-reveal-order` sequence, Motion `inView` with the `reveal` tokens and
  per-frame batching, margin notes after their paragraph, legacy breaker, Minimap
  `aria-current`, the neighbour rule above), `kinds.ts` (the eight kinds + the title),
  `jobs.ts` (one job per block: start timer, `[data-revealed]`, `will-change` on each target
  only from the end of an animation's delay to its finish, finished animations cancelled, at
  most 8 jobs at once below 1024 px, the rest queued), `split.ts` (Motion+ `splitText`, loaded
  on demand and prefetched at route start, run after `document.fonts.ready` with the element
  kept hidden until both are ready; words not characters so kerning and breaks hold; each line
  in an `overflow: clip` mask pinned to the line-height so nothing below moves; reverted to the
  original nodes afterwards), `first-load.ts`, `deal.ts` (`drawCards` / `fanCards` /
  `dealOffset`, still exported from `reveal.ts` for the hand and the eggs),
  `choreography.ts` (tier helpers `msFor` / `spanFor` / `gapFor` / `drawFor` and the `pending`
  values). `<Reveal>` no longer writes `data-revealed`; `reveal.css` now only hides armed,
  unrevealed blocks with `opacity: 0` (never the eager hero image, never digits in reduced) and
  styles the masks; every movement is WAAPI from JS, so reduced never sees a transform and
  no-JS visitors get the final page after the 4 s arming timeout.
- **Legacy presets** (D4): their CSS presets and the `--reveal-calm` / `--reveal-reduced` uses
  are gone; the values still in today's pages are aliased onto the kinds in `kindOf()`
  (`headline` → title, `h2` / `paragraph` / `line` → lines, `tags` → list or block, `email` /
  `callout` / `metric` / `row` → block, `divider` → rule, `discard` → the 404 egg) and
  `data-order` groups onto orders. Integration can delete the alias cases once the Layout pages
  have landed. WeightText titles (`.wt-word`) are animated in place (no split).
- **First load** (`<FirstLoadSequence>`): the timeline above. The title is the `h1` inside the
  wrapper (with or without `data-reveal`); the first block after it is the role line, the
  second the intro, rules are the divider, everything else (including blocks before the title)
  is "the rest" in document order; `[data-chrome]` last. The opsz / wght settle animates
  `font-variation-settings` only; the live word gets `contain: inline-size` while it moves, so
  its reserved box never widens. Revisits and client navigations to home: one 240 ms crossfade,
  the rest 60 ms later, all started in the same frame (300 ms). Any key, click, wheel or scroll
  completes the sequence. First-visit blocks go through the same entry point as every other
  reveal (eager hero image never animated, notes after their paragraph); the revisit is one job
  for every part, so the mobile cap cannot push a part past 300 ms.
- **Scroll-linked** ([Scenes](../contracts.md#scenes), [Reading hairline](../contracts.md#reading-hairline)):
  `ReadingHairline` animates the registered `--reading-progress` with
  `animation-timeline: scroll(root)` inside `@supports`, otherwise Motion `scroll()` (loaded
  on demand); in reduced the bar is clipped instead of scaled. `.hero-drift` in `reveal.css`
  (full tier, `view()` range `exit`, so the gap it opens is above the fold; a `<picture>`
  with the class is made `display: block`). `useDealScene`: full tier, ≥ 1024 px, a row that
  fits under the header; the stage gets `height: 250svh`, the card row pins (sticky, centred
  under the header), Motion `scroll(…, { target: stage, offset: ['start start', 'end end'] })`
  drives five phases: the cards wait face down as a deck in the last slot, each travels to its
  slot on a shallow arc turning face up, lands with a quarter of its hand-fan tilt, and the
  settle squares the row up (phases ease in-out: the scroll is the clock). Everything is inline
  and removed on teardown; the cards are never hidden by CSS. While pinned, the field renders
  at half its normal resolution (`scenes/pin.ts` → `GlField.detail`; the field already renders
  at `field.renderScale` 0.5 of CSS pixels, so pinned it is 0.25: 720×450 → 360×225 at
  1440×900). About timeline: in full tier, an
  SVG `[data-illustration="about-timeline"]` inside a `draw` reveal is linked to its
  `ViewTimeline` (groups drawn in order across `entry 100%` → `cover 60%`, tints after);
  otherwise the normal draw reveal.
- **Tiers**: calm = every duration, offset and stagger × 0.6 (`motionScale`), no pinning, no
  drift, `lines` split only on h1 / h2 (others reveal as `block`), SVG strokes 500 ms, the hand
  fades in on first load. Reduced = every kind one 160 ms opacity crossfade, offsets 0, SVGs
  drawn, digits static (never hidden), the field static (its swaps now `reducedCrossfade`), and
  every view transition a 160 ms crossfade (`view-transitions.css`: morph groups do not move,
  old / new images and page content crossfade).
- **D3**: `heroTarget()` measures `main [data-hero-target]` at play time when it is on screen
  and falls back to the computed geometry otherwise (playing from home).
- **Field** (`src/components/background/**`): half resolution while pinned; every retarget
  draws at least one frame, and the field redraws once each view transition has finished
  (`VT_DONE` from `view-transition.ts`). This fixes a latent bug the reduced smoke exposed: a
  160 ms swap that ran entirely while a transition held rendering left the previous colour on
  screen after a switch.
- **Eggs**: unchanged behaviour on the new timings (deal 420 ms / 80 ms apart for intro,
  Mulligan and Coffee; calm fades on `dur.m`; the rare pull waits for the new deal). The 404
  discard runs on the legacy wrapper and also on a `DiscardedCard` inside a `draw` reveal
  (`src/eggs/discard.ts`), so it survives the Layout rewrite. Haptics stay `navigator.vibrate`
  guarded, on card gestures only.
- **Smoke** (`scripts/smoke.mjs`): new motion suite per tier on a case study (every reveal ends
  visible and still, no `will-change` left, only the background runs at rest, hairline follows
  the scroll, deal scene pinned in full desktop and a static stack otherwise, reduced animates
  no transform or clip and draws the hairline with a clip); the intro probe reads effective
  opacity (the hidden state now sits on the `h1`, not its words).

## Contract change requests

1. **Tokens** (`src/motion/tokens.ts`): move `pending` from `src/motion/choreography.ts` in, so
   no motion value lives outside the tokens: `at.firstLoad = { title: 0.52, role: 0.9, intro:
   1.0, rest: 1.3 }` (replacing the legacy `at.draw / title / lines / chrome`),
   `duration.digits: 0.7`, `duration.svgDraw: 1.2`, `duration.svgDrawCalm: 0.5`,
   `distance.block: 12` (block rise; today it borrows `distance.list`, also 12), `mask: 1.1`
   (110%), `image: { inset: 0.1, scale: 1.12 }`, `digitRoll: 5`, `zoomLanded: 0.6`,
   `deal: { stage: 250, phases, landTilt: 0.25, flipPerspective: 800, toss: 28, below: 0.6 }`
   (the last three are the existing deal's geometry, moved out of code), `jobs.mobile: 8`,
   `field.pinnedDetail: 0.5`, the timeline range and group span (0.5), `discard: { drop: 5,
   fade: 0.4 }` (the existing egg's values). Also rename `stagger.metric` (used for the 40 ms
   digit offset) to `stagger.digits`.
2. **Retire unused tokens** (nothing references them after this branch): `duration.draw, words,
   settle, repeatTitle, returnTitle, h2, line, list, image, imageScale, metric, tags, callout,
   divider, buttons, emailUnderline, calmReveal, reducedReveal, reducedSwap`; `stagger.draw,
   introLines, list, tags, rows`; `at.draw, title, lines, chrome, facts, summary, label,
   buttons`; `distance.paragraph`; CSS `--reveal-calm`, `--reveal-reduced`, `--angle-word`,
   `--angle-metric`.
3. **Reveal section text**: the "Stub" paragraph (data-revealed up front) and the legacy intro
   note are obsolete; describe the implementation instead (CSS hides armed blocks with opacity
   only; JS animates). Add: a margin note's related paragraph is the last `block` / `lines`
   reveal before it in its section (`[data-section]`, `section` or `article`).
4. **Illustrations**: an explicit tint marker, `data-tint` on the 8% fill shapes. Supported now
   alongside the fallback heuristic (a non-`data-draw` shape whose computed fill is not `none`).
   Dashed strokes that also draw lose their dashes while drawing (the reveal uses
   `stroke-dasharray: 1`) and get them back at the end.
5. **Layout, hero**: put `.hero-drift` on the hero image (img or picture) inside a frame that
   clips (`overflow: clip`); the class translates by 6% of the image's own height.
6. **Breaker lift**: the field's intensity lift still keys off the legacy
   `data-reveal="breaker"`. If Layout drops it, the lift goes; to keep it, name a hook (for
   example `[data-numeral]`) and Motion will attach to it.

## Known issues

- **Scroll-linked count.** The spec allows one scroll-linked effect per viewport. The content
  effects never meet (drift at the top of a case page, the deal in section 05, the timeline on
  About), but the hairline is always there, so it runs beside the drift and beside the pinned
  deal. It is kept as a progress indicator (in every tier); if it must count, the smallest fix
  is to fade it out while a scene is pinned (the pin bus is already there).
- **Revisit timing** is 300 ms from the moment the reveal system runs (measured 291–298 ms);
  the first frame after hydration adds whatever the browser needs (≈ 90 ms in headless Chromium
  with software WebGL).
- **Below the fold only on view.** A block that a jump (anchor, End key) carries past the
  viewport without ever intersecting reveals when it is scrolled back into view, not before.
- **Not exercised on real pages yet**: `note`, `image`, `digits` with real metrics, `draw` with
  real illustrations and the deal scene with real copy were tested on a temporary lab route
  (deleted) and with today's stub pages; the Layout, Illustrations and Content branches will be
  the real test. A deal row taller than the space under the header keeps the static row.
- **Legacy aliases** in `kindOf()` stay until the Layout pages land (D4).
- **JS budget** (`scripts/budget.mjs`, home): initial 164.8 KB gzip (main: 159.8), 184.6 KB
  loaded by network idle (main: 164.4). The lazy splitText chunk carries part of Motion again.
- **Smoke flake**: one of six full-tier desktop/phone passes failed "about: elevation texture
  loaded" (the texture is fetched in a `requestIdleCallback` in `about-topo.tsx`, Layout's, and
  the check waits 2 s); 8 of 8 isolated runs and the rerun passed.
- No Lighthouse, axe or cross-browser runs (as briefed). Only Chromium was used.

## Verification

- `npm run build` (static export, type check): passes, also with `tsconfig.fallback.json`
  (no Motion+ token).
- `node scripts/smoke.mjs http://localhost:4100/random/ --motion=full|calm|reduced`
  (1440×900 and 390×844): all passed in all three tiers. An earlier reduced run failed on the
  field colour after a switch (the latent field bug under Field above, exposed by this branch's
  shorter reduced swap); fixed, and `main` passes the same run.
- Playwright on a temporary lab route (every kind, the deal, the hairline, the drift, the
  linked timeline; deleted before the final commit) and on home, at 1440×900 and 390×844:
  full-tier frames at 600 and 1500 ms and at rest; reduced: every first-viewport block fully
  visible at 450 ms with no transform, translate, scale, rotate or clip animated; calm: the deal
  stage stays static (no `data-scene-active`, natural height). Also checked: lines masks hold
  the layout (the block below does not move through split and revert), all lab blocks end
  revealed in every tier at both sizes, `will-change` present only while animating and 0 at
  rest, at most 8 concurrent reveal jobs on a phone with 12 tiles entering at once, the field
  at half resolution only while the deal is pinned, the drift 0 → 6% only while the hero
  exits (none in calm), reduced view transitions are 160 ms opacity crossfades with no group
  movement, eggs (M, "draw", 404 discard, workshop draw, `?`) work.
