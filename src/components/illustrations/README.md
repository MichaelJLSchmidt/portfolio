# Illustrations

Fifteen inline SVG drawings in one quiet, technical-drawing style (contract:
`docs/contracts.md#illustrations`). Server components, no client JS, no animation of their own:
every drawing renders fully drawn, and the Motion session's `draw` reveal animates it.

## Style

| | |
| --- | --- |
| Stroke | 1.5 px on screen at any rendered size, 1.25 px below 640 px (`--illustration-stroke` on the root); round caps and joins |
| Colour | `currentColor` = the page accent (`--accent`, falling back to `--text`); strokes at 80% opacity, guides (lanes, axes, grids, links) at 34% (`.il-faint`) |
| Fills | only 8% tints of the accent (`[data-draw-fill]`); no gradients, shadows or filters |
| Labels | real `<text>` in Martian Mono (`--font-mono`), 11 px in CSS px at any size; uppercase + 0.08em for categories (`.il-cat`), sentence case for names; tones: text, muted, accent; one 20 px key figure (`.il-figure`, AdoptionBars) |
| Cards | the TCG feel comes only from card-shaped rounded rectangles and the identity colour |

## Markup (what Motion and Layout can rely on)

```html
<svg class="illustration" role="img" aria-labelledby="<title-id> <desc-id>" data-illustration="<kebab-name>"
     data-layouts="h v" style="--il-ratio-h: 960 / 360; --il-ratio-v: 360 / 480">
  <title id="<title-id>">…</title>
  <desc id="<desc-id>">…</desc>
  <g data-draw-group="1">                       <!-- reading order, 1..n -->
    <g data-layout="h">                         <!-- only when the drawing has two layouts -->
      <svg class="il-plate" viewBox="0 0 960 360">   <!-- geometry, scales with the drawing -->
        <path d="…" pathLength="1" data-draw="" />   <!-- every stroke that draws on -->
        <circle … data-draw-fill="" />               <!-- tint: fade, do not draw -->
      </svg>
      <svg x="12.5%" y="80%"><text data-draw-label="">2021</text></svg>  <!-- label pinned in px -->
    </g>
    <g data-layout="v">…</g>
  </g>
  …
</svg>
```

- **Every stroke element that draws on** has `pathLength="1"` and `data-draw`, so
  `stroke-dasharray: 1; stroke-dashoffset: 1 → 0` draws it. Tints carry `data-draw-fill` (fade
  them in with their group); labels carry `data-draw-label` (fade them with their group).
- Groups are `<g data-draw-group="n">` in DOM order = reading order. With two layouts, each group
  holds both (`data-layout="h"` and `"v"`); the hidden one is `display: none`.
- Plain drawings without labels (DiscardedCard, ProjectTypeGlyph, WorkshopGlyph)
  keep a root `viewBox`; their groups are `<g data-draw-group class="il-plate">`.
- Labelled drawings have no root `viewBox`: the root keeps its proportions with CSS
  `aspect-ratio`, geometry sits in `.il-plate` nested SVGs (the contract viewBox is the
  horizontal plate's), labels sit in CSS px so 11 px stays 11 px. **Size them by width only**
  (height `auto`); a fixed height on a labelled drawing would letterbox the geometry under the
  labels.
- The root is a size container (`container-type: inline-size`): give it a definite width (it
  fills its container by default).
- Why not `vector-effect: non-scaling-stroke`: in Chromium it breaks `pathLength` dashes (the dash
  pattern is laid out in screen space but normalised with the user-space length), so the draw
  reveal would show dashes. The plates' stroke width is instead divided by the drawing's scale
  (`illustrations.css`: exact with `calc(1000px / 100cqw)`, stepped container queries elsewhere).

## Accessibility

`role="img"`, `aria-labelledby` = title + desc. The `<desc>` says what the drawing shows in one or
two sentences and is built from the same props as the drawing (override with `description`). Ids
are unique per instance (`useId`); `titleId` sets the title id (the desc id is `<titleId>-desc`).
Where a visible caption already names the drawing, wrap it in `aria-hidden="true"`.

## Responsive layouts

Drawings with a vertical variant take `variant`: `auto` (default) renders both layouts and CSS
shows the vertical one below 640 px viewport width; `horizontal` / `vertical` render only that
one (use them when the placement's width is known, e.g. a narrow column on desktop). Every layout
is checked from 280 px wide (a 320 px screen); horizontal layouts from 576 px (a 640 px screen).

| Component | Horizontal | Vertical (below 640 px) |
| --- | --- | --- |
| TeamGrowthTimeline | 960×360, years across | 360×480, years down |
| IntakeBeforeAfter | 960×480, before \| after | 360×760, before above after |
| DesignSystemLayers | 640×560, labels beside the stack | 360×540, labels on the plates, badges above |
| AdoptionBars | 960×400 | 360×380, figure and key on their own rows |
| ServiceBlueprint | 1200×560, before \| after | 360×780, two blueprints stacked |
| JourneyEmotionCurve | 960×360, steps across | 360×640, steps down |
| CareerMatrix | 960×600, levels across | 360×540, levels down |
| WorkshopGlyphs | 960×160, a row of four, names under the glyphs (from 448 px) | 360×320, two by two |
| ContributionLoop, TeamConstellation, WeekRing | 560×560 / 640×640 / 560×560, one layout | – |
| DiscardedCard | 132×184, plain | – |
| ProjectTypeGlyph, WorkshopGlyph | 48×48 / 64×64, plain, for 20–32 px | – |

## Props

All take `IllustrationProps` (`className`, `titleId`, `title`, `description`, `variant`). Data
props are optional; the defaults are the brief's values.

| Component | Data props (defaults) | Groups |
| --- | --- | --- |
| TeamGrowthTimeline | `data` `{ year, headcount }[]` (2021–2025: 2, 3, 3, 4, 5), `labels` `{ team, joined }` | 1 axis + key, then one per year |
| IntakeBeforeAfter | `offers` (Check-up, Sprint, Embedded), `sources` (6), `labels` `{ before, after, team, frontDoor }` | 4 |
| DesignSystemLayers | `layers` (Tokens … Product apps, bottom up), `badges` (Angular, React, Vue, Server templates) | one per layer + badges |
| ContributionLoop | `steps` (Propose, Pair, Review, Release, Adopt) | 1 card, then one per step |
| AdoptionBars | `teams` (12), `adopted` (9), `labels` `{ adopted, notYet }` | 3 |
| ServiceBlueprint | `lanes` (Resident, Online service, Municipality, Residents' registry, Tax administration), `touchpoints` (lane per before-touchpoint: 2, 3, 2, 4, 1), `labels` `{ before, after }` | 4 |
| JourneyEmotionCurve | `steps` (8, dip at "Tell tax office"), `scores` (−2…+2 per step; the lowest is ringed) | 4 |
| TeamConstellation | `squads` `{ label?, size }[]` (A 4, B 3, C 5), `lead` | 1 lead, then one per squad |
| WeekRing | `days` (Mon–Fri), `rituals` `{ label, days, at? }[]` (Planning, 1:1s, Critique, Demo), `daily` (Stand-up), `dailyNote` | 1 days, 2 daily, then one per ritual |
| CareerMatrix | `levels` (4), `tracks` (3), `path` `[level, track][]` | 3 |
| WorkshopGlyphs | `methods` (crazy-eights, one-two-four-all, dot-voting, fishbowl), `labels` | one per method |
| WorkshopGlyph | `method` | 2 |
| ProjectTypeGlyph | `type` | 2 |
| DiscardedCard | – | 2 |

## Files

- `frame.tsx`: the kit (root frame, `Drawing` with layouts, `Plate`, `Pin`, `Label`, `Text`, `Group`).
- `geometry.ts`: coordinates, paths (smooth, monotone, arcs, rounded rects, chevrons), text metrics, wrap.
- `badges.tsx`: pill badges in px space.
- `illustrations.css`: colour, stroke correction, layouts, tints, labels.
- `contour-portrait.tsx`: its paths were generated once (marching squares over a head-and-shoulders
  distance field, 14 levels, simplified and smoothed) and are stored as data.
