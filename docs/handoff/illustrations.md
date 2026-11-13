# Illustrations session

## Branch

`claude/illustrations-svg-components-1k9w7o` (only this branch; never `main`).

## Plan

Written before editing. Scope: `src/components/illustrations/**` only.

1. **Kit.** One shared frame and a few drawing primitives so all 15 drawings share one stroke
   rhythm, one label style and one markup shape for the Motion session:
   - root `<svg role="img" aria-labelledby="<title> <desc>">` with a `<title>` and a `<desc>`,
     ids from `titleId` or `useId()`;
   - strokes in `currentColor` (= `--accent`, falling back to `--text`) at 80% opacity, 1.5 px
     (1.25 px below 640 px) through `--illustration-stroke` on the root; round caps and joins;
   - tints only as 8% fills of the accent (`data-draw-fill`), no gradients, shadows or filters;
   - labels as real `<text>` in Martian Mono 11 px, uppercase for categories;
   - every drawable stroke `pathLength="1"` + `data-draw`, grouped in `<g data-draw-group="1..n">`
     in reading order; everything rendered fully drawn.
2. **Fifteen drawings**, each with its data as optional props (defaults from the brief), the
   registry names, `IllustrationProps` and the contract viewBoxes kept as the default layout.
3. **Responsive.** Horizontal drawings that cannot hold their labels at 320 px get a vertical
   layout (`variant` prop: `auto` switches below 640 px with CSS only; `horizontal` / `vertical`
   force one).
4. **Verify.** `npm run build`; a temporary, uncommitted gallery route rendering all 15 in all six
   accents, screenshots in Chromium at 1440×900 and 390×844; a grep count of
   `pathLength="1"` / `data-draw` per file; a DOM check that every stroke element in the rendered
   gallery carries both.
5. **Handoff.** This file, with contract change requests for anything the contract fixes
   differently.

## What shipped

All in `src/components/illustrations/` ([contract: Illustrations](../contracts.md#illustrations)).
Conventions, the markup shape, every component's props and draw groups and the layout table are
in [`src/components/illustrations/README.md`](../../src/components/illustrations/README.md).

- **Kit**: `frame.tsx` (root frame with `<title>` + `<desc>` and `useId` ids; `Drawing` for
  labelled drawings with one or two layouts; `Plate` = geometry layer; `Pin` / `Label` / `Text` =
  labels in CSS px pinned to geometry; `Group` for plain drawings), `geometry.ts` (paths, smooth
  and monotone curves, arcs, chevrons, text metrics, wrap), `badges.tsx`, `illustrations.css`.
- **Fifteen drawings**, stubs and `data-stub` gone: TeamGrowthTimeline, IntakeBeforeAfter,
  DesignSystemLayers, ContributionLoop, AdoptionBars, ServiceBlueprint, JourneyEmotionCurve,
  TeamConstellation, WeekRing, CareerMatrix, WorkshopGlyphs (+ `WorkshopGlyph` with a `method`
  prop), ContourPortrait, AboutTimeline, ProjectTypeGlyph, DiscardedCard. Registry names,
  `illustrations`, `Illustration` and `IllustrationProps` unchanged (only optional props added).
- **Data as props** with the brief's values as defaults (years / headcount, offers, layers and
  badges, steps, team counts, lanes and touchpoints, journey steps and scores, squads, rituals,
  levels / tracks / path, workshop methods, timeline items). `AboutTimeline` takes
  `items={about.timeline.items}` directly (same shape as the content schema).
- **Responsive**: nine drawings have a vertical layout (`variant`, default `auto` = CSS switch
  below 640 px); the radial ones, the portrait, the card and the glyphs have one layout. Every
  layout was checked at 280 px wide (320 px screen); horizontal layouts at 576 and 936 px.
- **Strokes** stay 1.5 px (1.25 px below 640 px) on screen at every size without
  `vector-effect: non-scaling-stroke` (see change request 4).

### Draw groups (default props)

| Component | Groups | Strokes (`data-draw`; h / v) | Layouts |
| --- | --- | --- | --- |
| TeamGrowthTimeline | 6 | 32 per layout | h 960×360, v 360×480 |
| IntakeBeforeAfter | 4 | 40 per layout | h 960×480, v 360×760 |
| DesignSystemLayers | 6 | 23 / 18 | h 640×560, v 360×540 |
| ContributionLoop | 6 | 17 | 560×560 |
| AdoptionBars | 3 | 15 per layout | h 960×400, v 360×380 |
| ServiceBlueprint | 4 | 36 / 41 | h 1200×560, v 360×780 |
| JourneyEmotionCurve | 4 | 21 per layout | h 960×360, v 360×640 |
| TeamConstellation | 4 | 29 | 640×640 |
| WeekRing | 6 | 20 | 560×560 |
| CareerMatrix | 3 | 21 per layout | h 960×600, v 360×540 |
| WorkshopGlyphs | 4 | 35 per layout | h 960×160, v 360×320 |
| ContourPortrait | 7 | 19 (14 levels) | 480×600, plain |
| AboutTimeline | 8 | 8 per layout | h 960×240, v 360×560 |
| ProjectTypeGlyph | 2 | 3–5 by type | 48×48, plain |
| DiscardedCard | 2 | 5 | 132×184, plain |

## Contract change requests

1. **`--accent` does not follow `[data-identity]`.** `tokens.css` declares
   `--accent: var(--id-accent)` on `:root` only, so it resolves there (ink accent) and every
   identity scope inherits the ink accent; the contract (Colour) says it follows `--id-accent`.
   Smallest change (Foundation): add `--accent:var(--id-accent)` to each scope in
   `identityCss()` (`src/design/palette.ts`). Workaround on this branch: `illustrations.css`
   re-declares `--accent: var(--id-accent, var(--text))` on `.illustration`; delete that line
   once the scopes declare it. (Layout's `color: var(--accent)` rules have the same problem.)
2. **Labels are SVG `<text>`**, not HTML. The contract says "no fonts inside the SVG (labels stay
   HTML)"; the brief asks for real `<text>` in Martian Mono. No font is embedded: labels use the
   page's `--font-mono`. Please update the contract line.
3. **Root `<svg>` of labelled drawings has no `viewBox`.** It keeps its proportions with CSS
   `aspect-ratio`; geometry sits in nested `<svg class="il-plate" viewBox>` plates (the contract
   viewBox is the horizontal plate's) and labels in CSS px, so 11 px labels stay 11 px at any
   size. Plain drawings (ContourPortrait, DiscardedCard, ProjectTypeGlyph, WorkshopGlyph) keep the
   root `viewBox`. Consequence for Layout: size labelled drawings by width only (height `auto`).
4. **No `vector-effect: non-scaling-stroke`.** In Chromium 153 it breaks `pathLength="1"` dashes
   (checked: the dash pattern is laid out in screen px but normalised with the user-space length,
   so `stroke-dasharray: 1` shows repeating dashes), which would break the `draw` reveal. Instead
   the root is a size container (`container-type: inline-size`) and the plates' stroke width is
   divided by the drawing's scale (`calc(1000px / 100cqw)` where typed arithmetic exists, stepped
   container queries elsewhere). Consequence: the root needs a definite width (100% by default).
5. **Ids and description.** `aria-labelledby` lists the `<title>` and a new `<desc>`; the default
   title id is unique per instance (`illustration-<name>-<useId>`) instead of
   `illustration-<name>`. `titleId` still sets it; the desc id is `<titleId>-desc`.
6. **New optional props and exports.** `IllustrationProps` gains `title`, `description`,
   `variant` (`IllustrationVariant` = `auto | horizontal | vertical`); each component has optional
   data props (README). New exports: `WorkshopGlyph`, `workshopMethods`, `WorkshopMethod`,
   `IllustrationVariant` and the components' prop types.
7. **New data attributes** for the data-attribute table: `data-draw-fill` (tint fills: fade them
   with their group, do not draw), `data-draw-label` (text: fade with its group),
   `data-layout="h|v"` on the per-layout `<g>` inside each group and `data-layouts` on the root
   (CSS hides the inactive layout with `display: none`). For Motion: groups may hold both layouts;
   animating the hidden one is harmless.
8. **WorkshopGlyphs viewBox 960×120 → 960×160.** The names sit under the glyphs, so the row holds
   from 448 px wide (the Management skeleton's `.section-illustration` is 28rem); with names
   beside the glyphs in 960×120 the last name clipped at that width.
9. **ProjectTypeGlyph** no longer carries `data-type` on its first group (the stub had it; the
   contract does not list it). Easy to add back if Layout needs it.

## Known issues

- Verification: `npm run build` passes (type check included). Gallery (temporary route,
  `src/app/%5Fillustrations-lab/`, never committed, deleted) rendered all 15 at 936, 576, 349 and
  280 px plus all six accents at 280 px: Chromium at 1440×900 and 390×844, 180 instances each;
  a DOM check found 0 stroke elements without `pathLength="1"` + `data-draw`, 0 labels outside
  their SVG, rendered stroke width 1.50 px at 1440 (1.25 px at 390; 1.47 / 1.22 measured on the
  rotated cards = CTM rounding). Auto layouts switch to vertical at 390 and stay horizontal at
  1440 (checked per drawing). A simulated reveal (`stroke-dasharray: 1; stroke-dashoffset: 0.5`)
  half-draws every stroke. No horizontal scroll from the drawings. Grep: every `<path>`,
  `<circle>`, `<line>` in the source is either a drawn stroke (`pathLength="1"` + `data-draw`), a
  tint (`data-draw-fill`) or mask content (DiscardedCard's hidden-line masks).
- Minimum width 280 px: below about 260 px, WeekRing's side labels and the vertical CareerMatrix
  and DesignSystemLayers labels start to crowd (checked at 200 px).
- `auto` switches by viewport (640 px), not by container width: a horizontal drawing placed in a
  narrow column on desktop should get `variant="vertical"`.
- Long content strings: labels wrap by word but a single long word (e.g. a 14-letter lane name)
  stays whole; the lane, layer and level label columns hold the brief's defaults with room to
  spare, not arbitrary lengths.
- The `auto` variant renders both layouts, so those SVGs are roughly twice the markup
  (9–16 KB uncompressed each).
- Not run: Lighthouse, axe, Firefox, Safari (not requested). The stepped stroke fallback for
  browsers without typed arithmetic was not seen in a browser; it is the same formula at ±6%.
- Pages still pass no data props (Layout wires `about.timeline.items`, rituals, growth levels
  and so on when it places the drawings).
