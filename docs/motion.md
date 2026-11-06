# Motion

The site moves the way a map is read: the page is complete and readable from its first frame,
motion answers the reader (a hover, a press, the scroll, a page change) and then stops, and the
map holds still while a page is read. Every value comes from `src/styles/tokens.ts`. The motion
lab (`/lab/`, with `/lab/specimen/` and `/lab/terrain/`; in basecamp builds, local previews and
`npm run dev`, never in a live build) shows the primitives in the three modes side by side.

Four rules hold everywhere:

- **Readable from the first frame.** Body text, table cells and numbers never animate. Titles
  arrive on their weight only, and a light weight is still the whole word. The reveal controller
  shows a rising block at once when it is or holds `.body-copy`, `.surface-copy` or a table. The
  one exception is the home intro's statement: in full motion its weight eases from 300 to 400
  with a 6 px settle. It is legible throughout.
- **Every effect has a calm and a still twin.** Calm (the Calm map switch) keeps responses and
  page morphs and drops ambient motion, loops and flourishes. Still (the OS asks for reduced
  motion) moves nothing: colour and opacity change at once or within `--dur-still` (200 ms).
- **Nothing follows the pointer** but the Summit Card's tilt and foil (`TiltDriver`). The
  lightbox listens for `pointermove` only while a pointer is held down, to drag and pinch.
  `src/lib/pointer.test.ts` keeps it that way (`npm test`), and so does `npm run test:e2e -- pointer`.
- **Red is the route's colour.** `signal` (on dark) and `routePaper` (on paper) mark only the red
  route, the lines that are routes (an ascent's profile, the way a decision took, a drawing's
  path and blaze, the walked line of the career profile), trail links and their blazes. The
  "route red" test in `src/styles/tokens.test.ts` lists the files that may use them.

## Modes

`html[data-motion]` holds one of three modes. The inline script in the root layout
(`motionModeScript`, `src/lib/motion-mode.ts`) sets it before first paint; the same module keeps
it in step with the OS setting, the switch and other tabs. The same script sets `data-calm` (the switch's own state),
`data-tier` (`desktop`, `mobile` or `low`) and `data-haptics` (vibration works: Android).

| | full | calm | still |
| --- | --- | --- | --- |
| Chosen by | default | the Calm map switch (`localStorage` `summit:calm-map`) | the OS (`prefers-reduced-motion: reduce`), also without JavaScript |
| View Transition morphs (deck ⇄ case study, mini card → next case study, HUD About label ⇄ About H1, figure ⇄ lightbox) | yes | yes | no API call; the new page fades in over `--dur-calm` (150 ms) |
| A route's arrival (parts timed from the commit) | yes | yes | the page is simply there |
| Responses: flood, trail links, lifts, presses, switches | yes | yes; the flood and the card flips cross-fade, the trail line draws in 120 ms | colour and opacity only, at once or ≤ 200 ms |
| Title arrival (`WeightTitle`) | once per page view | rest state | rest state |
| Reveals | rise, draw, unfold, trace | rises become fades; draws, unfolds and traces stay; no page turn | shown, never hidden |
| Scroll-drawn lines (How I lead, the career profile) | follow the scroll where view timelines exist | the career profile draws once; the drawings are drawn | drawn |
| The red route | the walked line rides the scroll, a marker on its end | steps from waypoint to waypoint | drawn solid |
| Pings, the comparison's hint, the Mythic foil sweep | yes | no | no |
| Card tilt, foil, glare, the card's own rise | yes | no (the lift, the type line's fade, the pips and the rarity trace stay) | no |
| Field | holds still while read; on a route change morph, draw-on, zoom push, Bern's river and pin | morph only; river and pin fade in | posters only, cross-fading in 200 ms |
| Lenis smooth scroll | fine-pointer desktop | no | no |
| Haptics (Android) | on by default | off by default | off |

Precedence: still always wins. When the OS forces still, the switch shows on, is
`aria-disabled`, and its description says why. The switch is a native
`<input type="checkbox" switch role="switch">` whose visible label, "Calm map", is its name
(WCAG 2.5.3); its description reads "Reduces motion on this site". The thumb follows
`html[data-calm]`, which changes at once on a flip; the mode itself (which restyles the page and
re-renders whatever follows it) changes a frame later (`setCalmMap`), so the switch answers first.

Dev and preview builds accept `?motion=full|calm|still` for one page load (the lab's frames,
tests, recordings); the OS setting still wins.

### Writing CSS for the modes

Motion is opt-in per mode, so a mode switched mid-animation lands the element at once:

```css
/* Full only (title arrival, tilt, pings, the foil sweep, scroll-drawn lines): never without JavaScript. */
:root[data-motion="full"] .x { animation: … }

/* Full and calm, also before the script has run; never in still. */
@media (prefers-reduced-motion: no-preference) {
  :root:not([data-motion="still"]) .x { transition: … }
}

/* Calm's twin of a full effect (a fade for a rise, a cross-fade for a turn). */
:root[data-motion="calm"] .x { … }
```

`:root:not([data-motion])` is the page without JavaScript (the inline script never ran): the flood
shows at once on hover and focus, a before/after comparison stacks both images.

Colour and opacity transitions of `--dur-still` (200 ms) or less may stay unguarded. Hover styles
go under `@media (hover: hover)`; keyboard focus gets exactly the hover state through one `--on`
switch that every declaration reads (`TrailLink.module.css`, `SummitCard.module.css`,
`PortraitCard.module.css`, `BinderPage.module.css`).

In JS: `useMotionMode()` for rendering; `currentMode()` outside React and in effects that run
during hydration (the hook still reports the server snapshot, "still", so server HTML never
starts motion); `useModeIf(enabled)` for components with many instances that need the mode for
one optional feature (no subscription, so no re-render on a flip, while disabled).

## Tokens

All in `src/styles/tokens.ts`, written as custom properties by `tokensToCss()` (springs by
`springsToCss()` in `src/styles/motion-css.ts`) and inlined in the root layout's tokens layer.
Names turn camelCase into kebab-case: `breathOut` is `--dur-breath-out`.

- **Durations** (`--dur-*`, ms). The scale: `instant 80`, `micro 140`, `calm 150` (still mode's
  page fade), `short 220`, `medium 360`, `long 560`, `scenic 900`. Semantic:
  `tap 120` (press, focus ring), `breathOut 240` (a tilted card going flat; the field's river and
  pin leaving), `still 200` (still mode's ceiling), `reveal 350`, `settle 420` (a figure's scan
  line), `route 600`, `title 600` (`WeightTitle`), `intro 400` (the home intro), `trail 280` and
  `trailCalm 120` (a trail link's line), `flood 360`, `floodTail 900`, `floodCalm 160`,
  `floodTouch 600` (the contour flood), `flip 400` and `flipCalm 150` (cards turning over),
  `legendUnfold 340` (the case-study summary), `terrain 700` (the field's morph), `glint 900`
  (the foil sweep), `draw 900` (a line drawing on), `trace 400` (a small mark tracing itself),
  `leave 160` (a page's own content leaving), `crossfade 180` (back and forward), `sheet 300` (a
  bottom sheet), `unfold 240` (a small sheet), `arrival 740` (a route's arrival has landed),
  `shift 600` (a card's contours shifting), `prewarm 400` (the field leaning towards a link's
  terrain), `toast 4000` (a reading time, not motion). `route` is the route change's own
  budget (the conductor's timings stay within it).
- **Arrival** (`arrival`, ms after a route commits): `summary 380` (a case study's summary
  unfolds), `landed 420` (About's facts).
- **Easings** (`--ease-*`): `trail` (0.22, 1, 0.36, 1), `summit` (0.65, 0, 0.35, 1), `drop`
  (0.32, 0.72, 0, 1), `scree` (0.7, 0, 0.84, 0; content leaving the screen only, never easing in
  on UI), `settle` (0.16, 1, 0.3, 1), `glint` (0.45, 0, 0.55, 1). `--ease-flood` is a generated
  `linear()` that spends `--dur-flood` on the flood's head and the rest on its slow tail.
- **Springs** (Motion, and `--spring-*` as `<duration> linear(…)` sampled from Motion's own
  spring): `press` {0.16 s, bounce 0}, `card` {0.35, 0.15}, `share` {0.42, 0.1}, `thumb` {0.2,
  0.2}, `tilt` {stiffness 220, damping 26, mass 0.6}, `settle` {0.12, 0}. Use as
  `transition: transform var(--spring-press)`; `--spring-<name>-dur` and `--spring-<name>-ease`
  give the parts separately (view-transition pseudo-elements).
- **Staggers** (`--stagger-*`): `item` 50 ms for the first 6 items, `card` 70 ms capped at
  420 ms. `staggerStep(stagger.card, n)` fits a cascade into its cap.
- **Distances** (`--dist-*`): `rise` 8 px, `rise-card` 12, `trail-step` 3 (a trail link's arrow,
  in two steps), `intro-settle` 6, `lift` −6, `tilt-max` 5°, `tilt-mini` 3° (the trailhead band's
  mini card), `perspective` 900, `hud-condense` 120 (the HUD condenses past it).
  `--scale-press` 0.97, `--scale-card-press` 0.98.
- **Flood** (`flood`): 12 frames, the last 3 a tail, the fringe at 25% one frame ahead
  (`--flood-last`, `--flood-fringe`).
- **Glint** (`glint`): band 18% of the text, 100°, `--dur-glint` on the glint easing. The token's
  colour is glacier at 55%, but the only glint left, the Mythic card's foil sweep, sets its own
  colour in `Glint.module.css` (summit gold at 60%).
- **Type roles** (`type`, `titleAxes`; `--type-*`, `--title-*`): display wdth 75, wght 800,
  line-height 0.86 (titles arrive from wght 200); body 17–19 px, line-height 1.55, 60–68
  characters; button wdth 112, wght 720, +0.02 em; mono 11 px, +0.14 em, wdth 87.5, wght 500;
  compact (card names) wdth 72, wght 800; condensed wdth 88.
- **Haptics**: `press 6`, `open 8`, `commit 10`, `success [8, 60, 8]`, `error [12, 40, 12]`,
  `detent 4` ms, at most one pulse per 80 ms.
- **Layers** (`--layer-*`): backdrop 0, page 1, hud 30, overlay 40, skip-link 100.
- **Breakpoints** (`breakpoint`, at most three; media queries write them literally, `(min-width:
  1024px)` or `(width < 1024px)`): `sm 640` (the haptics switch joins the HUD, the red route leaves
  the margin, the career profile runs across, About's two-column title on landscape screens),
  `md 1024` (desktop section spacing, the How I lead switchback, the deck's ridge three across),
  `lg 1280` (the waypoint trail beside a case study's stages; the altimeter bar below it).
  `device.desktopMinEdgePx` (900) is the desktop tier's long edge, not a layout breakpoint.

`npm test` checks that the CSS carries exactly the TS values, that every token a stylesheet reads
exists, that no stylesheet adds its own duration, `cubic-bezier()` or `font-stretch` (a shrinking
allowance lists the older ones), that every width query uses a breakpoint, that every rule sits in
a cascade layer (`layers.test.ts`), the route red and the pointer rule.

## Levels and budgets

Every effect belongs to one level (`levels` in the tokens):

| Level | Budget | Now |
| --- | --- | --- |
| ambient | one channel, desktop, full mode only | none: the field holds still while a page is read |
| reveal | at most 2 groups at once, ≤ 600 ms each, once per session; snaps while the page scrolls faster than 2.5 px/ms | reveals and the card arrival; title arrivals belong here too, but the controller does not count them |
| response | ≤ 300 ms, interruptible | hover, focus, press; the flood (360 ms plus its tail) and the card flips (400 ms) run longer, and both reverse from wherever they are |
| transition | one at a time, readable within 300 ms | route morphs, the lightbox |
| signature | at most one per viewport, once per session | the Mythic card's foil sweep only |

Animate only transform, opacity, clip-path, stroke offsets, colour, and the weight and width of
isolated, size-reserved elements.

## Primitives

Each works in full, calm and still with no layout shift (`npm run test:e2e -- primitives`
measures the shift per primitive in the lab: ≤ 0.005).

### WeightTitle

```tsx
<WeightTitle as="h1" text={"Two\nlines"} arrive="load" flood />
```

`src/components/type/WeightTitle.tsx`. A display title is one element holding its text (no letter
spans). At rest Archivo wght 800 at wdth 75, upper case. In full motion it arrives from wght 200:
one registered progress value, `--title-t`, runs 0 → 1 over `--dur-title` (600 ms, trail easing)
and drives both axes. The weight runs linearly; the width follows four knots solved per title at
build time, so the line keeps its length all the way (drift at most 2%, typically under 0.5%) and
nothing around it moves. `contain: layout paint` keeps each frame to the title.

- `arrive`: `"load"` (from the first frame, pure CSS: the hero, the 404), `"view"` (the default:
  when it first comes into view, through one shared IntersectionObserver in `titles.ts`) or
  `"none"` (always at rest).
- Once per page view: a title whose arrival ended is marked `data-title-done` and stays at rest, also
  when Next shows its page again (a reload plays it again); one a page morph brought in is marked
  `data-title-morphed` by `RouteArrival` and rests at once (the morph is its arrival).
- Calm and still show the rest state; so does a page without JavaScript.
- `flood`: adds the contour flood (below), opted in per title from `src/content/flood.ts`.
- `scripts/measure-titles.mjs` (`npm run titles`; `npm run build` and `npm run dev` run it first)
  shapes every title listed in `src/lib/display-titles.ts` with HarfBuzz and writes the knots to
  `src/lib/title-axes.json`. A title not measured, or drifting past 2%, keeps the rest width and
  animates its weight alone. `titleEm()` gives a title's measured width for sizing it to its column.

### Contour flood and FloodButton

`src/components/interaction/flood.ts`, the rules under "contour flood" in `globals.css`. On every
element marked `data-flood` (a title, a button, the footer wordmark) an aria-hidden glacier copy
spreads through it on hover, keyboard focus or a tap. The copies draw their text from
`data-echo`, so no words are duplicated in the page.

- One set of delegated listeners (`startFlood`, started by `Reveals`): `pointerover` reads where a
  mouse or pen came in, once; keyboard focus floods left to right; a tap floods from the finger
  and recedes after `--dur-flood-touch` (600 ms). It never follows the pointer.
- The script writes only the host's state and entry point (`data-flood-state`, `data-flood-src`,
  `--fx --fy --ew --eh`). The stylesheet steps a registered integer, `--flood-frame`, through a
  twelve-frame alpha sprite: radial from the entry point, or a left-to-right sweep. The fringe
  (25%) runs one frame ahead. Arriving takes `--dur-flood` plus a slow three-frame tail
  (`--dur-flood-tail`, `--ease-flood`); leaving runs back over `--dur-flood`.
- Calm cross-fades the copy over `--dur-flood-calm`; still shows it at once; forced colours hide it.
- The sprites (`flood-radial.webp`, `flood-sweep.webp`, ≤ 15 KB each) come from
  `npm run flood` (`scripts/flood/sprites.mjs`, seeded, byte-identical on a re-run).

`<FloodButton label="Copy address" labels={["Copy address", "Copied"]} />`: a 1.5 px contour
outline with the label in the button cut (wdth 112, wght 720). The flood fills it on hover and
focus and the label turns ground (14:1); a press fills it at once and insets 1 px, with the
`press` haptic (`pressHaptic={false}` when the action ticks its own). Its box is reserved at the
widest label it can show, so a change of label moves nothing. `flood.buttons` switches its flood off.

### TrailLink

`<TrailLink href="/about/">More about me</TrailLink>`, `variant="inline"` in running text. At
rest a dotted underline at 40%; on hover (fine pointers) and keyboard focus a solid 2 px
signal-red line draws left to right under the label over `--dur-trail` (a background, so a
wrapped phrase draws line by line) and the arrow steps 3 px forward in two steps (`arrowAt="start"`
steps back, for back links). A committed click ticks `commit` (`detent` for a jump within the
page) and leaves a small white-red-white blaze beside the link for the rest of the session
(`sessionStorage` `summit:blazed`, not `:visited`). Calm draws in `--dur-trail-calm` (120 ms);
still changes at once. The link never changes width. `plain` renders an `<a>` (mail, external).

### RuledHeading and ContourRule

`<RuledHeading id="x" text="How I lead" flood />`: the line leads. A `<ContourRule />` (a 1 px
line, `data-reveal="rule"`) draws as the title scrolls into view, and the `WeightTitle` arrives on
its weight. `SectionHead` wraps it for home and About sections. In the first viewport and in still
both are simply there.

### Reveals and MapSheet

Mark a block `data-reveal`; one controller (`src/components/motion/reveal.ts`, mounted by
`Reveals` in the root layout, styles in `src/styles/motion.css`) plays it:

| Kind | What it does |
| --- | --- |
| `""` | rises 8 px and fades (calm: fades) |
| `"card"` | rises 12 px and fades (calm: fades) |
| `"fade"` | fades only, after its block's `--fade-after` (running text may take it) |
| `"rule"` | draws (scaleX) over `--dur-settle` |
| `"line"` | traces a drawn line from its start over `--dur-draw` (the footer's profile, a case study's elevation profile) |
| `"list"` | draws a list's ring bullets with the item stagger |
| `"caption"` | fades in after its figure |
| `"mark"` | draws a small mark's paths (`pathLength="1"`) over `--dur-trace` (About's three-step trail) |
| `"sheet"` | unfolds from its fold edge (`data-fold="top\|left"`, clip-path) over `--sheet-dur` (default `--dur-reveal`), its content fading in after; `data-sheet-rows` fades rows in turn (`--i`); `data-draws` leaves time for marks that draw after it opens |
| `"figure"` | unfolds behind a 1 px scan line over `--dur-settle`, then its corner ticks; below the fold a contour placeholder shows until its images decode, then they cross-fade in |
| `"turn"` | full only: a binder page turning in over `--dur-long` (its own stylesheet animates it) |
| `"trace"` | a drawing whose route traces in over `--dur-draw` (the career profile; its own stylesheet animates it) |

The pages use `rule`, `sheet`, `figure`, `caption`, `line`, `mark`, `card` (the trailhead band's
mini card), `trace` and `turn`; `""`, `fade` and `list` are supported but unused at present.

Anything in the first viewport is visible from first paint and never hidden, so it can be the
LCP element. Below the fold, blocks wait (`data-reveal-state="wait"`) and play once per session
(`src/lib/settled.ts`): at most two groups at once within 600 ms, snapping to their end while the
page scrolls fast. Still mode never hides anything. A rising block that is or holds body copy, a
surface-copy panel or a table is shown at once.

`<MapSheet fold="top|left" arriveAt={ms}>` is a raised-ground panel with a hairline that unfolds
(`data-reveal="sheet"`). The one exception to "the first viewport is simply there" is a route's
arrival by a link: a block marked `data-arrive-at="<ms>"` that is on screen when the route commits
plays from that many milliseconds after the commit up to the arrival's end (`--dur-arrival`), or
for `data-arrive-dur`, every time (`playArrival`).

### PortraitCard

`src/components/about/PortraitCard.tsx`. The About portrait on a thin Summit Card frame, turned
over by its `FloodButton` ("Show facts" / "Show photo", the label says what it will show) or a
click on the card. Both faces are in the DOM; the one turned away is `inert` and `aria-hidden`.
Full motion turns the card over (`rotateY` over `--dur-flip`, summit easing); calm stacks the faces
and cross-fades them over `--dur-flip-calm`; still swaps at once. Hover, and keyboard focus on the
button, lift it by `--dist-lift`. The binder's pockets on About (`BinderPage`) turn the same way,
lifting half as far.

### Glint

`<Glint text="…" />` inside a positioned element, then `playGlint(element, { auto: true })`
(`src/components/motion/glint.ts`). An aria-hidden copy with transparent letters lies over the
text; a band clipped to them moves by animating a registered gradient position (`--glint-x`), so
one layer repaints. Kept for one use: a Mythic card's foil sweeps once across its name as the card
arrives. Full motion only, one at a time; an `auto` glint is skipped within a screen's height of
the last one on the page. Forced colours hide it.

### RouteLayer (the red route)

`src/components/route/RouteLayer.tsx`, geometry in `src/lib/route-geometry.ts` (pure,
unit-tested). One red path down the page through its waypoints, the reader's way up the mountain.
Rendered as the first child of `main` on home and on case studies; `main:has(> [data-route-layer])`
becomes its containing block and stacking context, and the layer sits behind the content, so
panels and cards cover it. Decorative (`aria-hidden`).

- **Waypoints** are the elements marked `data-route`: the default anchor passes the element's top
  in the page's left gutter (half of `main`'s inline padding); `data-route-anchor="center"`
  enters a drawing at its top centre and leaves at its foot, masked behind it;
  `data-route-anchor="ridge"` joins the deck's ridgeline at its right end and leaves for the
  gutter along it, masked across it. `data-route-blaze` marks where the route is climbed on foot:
  from there it is a blaze, a 6 px paper-dusk casing under the red.
- **Geometry**: one subpath (a dash pattern restarts at every `M`). Between waypoints the route
  runs straight down, or, when it changes sides, crosses in the lowest band free of text
  (`freeBand`, at least 32 px tall) with quarter-circle corners (radius 24). A switchback (a short
  zig-zag) precedes each gutter waypoint: 40 px tall, swinging 7 px on desktop. Lengths are summed
  from the segments, so no `getTotalLength()` is needed. The layer measures again whenever the
  layout changes (a ResizeObserver on `main` and the document, fonts loading, a resize).
- **Phones** (under 640 px) put every waypoint in the 16 px margin: a 2 px trail with a 28 px
  switchback swinging 4 px before each.
- **Progress** follows a reading line 30% down the screen (the same line as the case study's
  reading spy, so the waypoint trail is a magnified view of the same progress). `routeKeyframes`
  places each waypoint at the scroll offset where it crosses that line; the route is drawn as far
  as the line reaches on load and complete at the bottom of the page.
- **Full**: a dashed base (3/7, 60%) with the walked line solid over it, driven by a
  `ScrollTimeline` on the document (Lenis scrolls the document, so it follows), and a "you are
  here" marker (a red dot ringed in ground and paper) riding its end on `offset-path`. Without
  scroll timelines the same keyframes are painted from the scroll on Motion's frame loop, at most
  once a frame.
- **Calm**: the walked line advances a waypoint at a time (`stepAt`), easing over `--dur-medium`;
  the marker steps with it.
- **Still**: the whole route drawn solid; no dashed base, no marker, nothing animated.
- **Pages**: home runs from the title's tags through the four How I lead drawings and along the
  ridge of cards to Get in touch; a case study from the trailhead through its six stages to the
  results, blazed after the ascent's last railway station (`lastStation`, from `geo.ts`). About
  has no route layer: its route is the career profile itself. Forced colours draw it in
  `CanvasText`; print hides it.

### useMotionMode and haptics

`useMotionMode()` returns `{ mode, tier, calm, forcedStill, haptics, hapticsAvailable, setCalm,
setHaptics }`; `tier` is `desktop` (a fine pointer and a long edge of at least 900 px), `mobile` or
`low` (Save-Data, under 4 GB of memory or under 4 cores). `haptic(event)` (`src/lib/haptics.ts`)
vibrates on supporting Android browsers only, for direct user actions (transient activation), at
most once per 80 ms, never in still and in calm only when switched on. The haptics switch renders
only where vibration works (`html[data-haptics]`): in the HUD from 640 px, in the footer below.

## Route transitions

`src/lib/view-transition.ts` wraps `document.startViewTransition` once and gives every transition
a kind (`transitionKind()`):

| Kind | When | What plays |
| --- | --- | --- |
| `route` | a link to another page | the old page's own content fades out over `--dur-leave` (160 ms) while the new page fades in over the same (plus-lighter, so the field and the HUD keep their brightness); shared parts travel on the share spring; then the arrival |
| `return` | a back link from a case study into the deck | the card reassembly (`return-transition.ts`) |
| `traverse` | browser back and forward (`HistoryTransitions` replays popstate inside a transition) | `html[data-vt="traverse"]`: a `--dur-crossfade` (180 ms) cross-fade plus the shared elements both pages have; no arrival choreography |
| `view` | in the page: the lightbox (`html[data-vt="lightbox"]`) | its own timing |

Still mode never calls the API (the wrapper throws, React commits directly) and `RouteFade` fades
the new page in over `--dur-calm` (opacity only). Browsers without the API morph shared elements
with a Motion `layoutId` instead (`MorphSwitch`, loaded lazily), in full and calm.

**The arrival** (`RouteArrival`) runs when the conductor's `fieldStore.routeSeq` moves, the
moment the field starts. On a `route` or `return` transition the new page's `main` gets
`data-arrival`, titles a morph brought in are put at rest, and the `data-arrive-at` blocks play.
Text never waits: it is readable throughout. Then, on every kind, focus moves to the new page's
H1 (`tabindex="-1"`, no ring) so screen readers announce it, unless the page placed focus itself
(the deck focuses the card the reader came from) or the URL has a hash (its target).

| Route | 0 ms | Travel | Then |
| --- | --- | --- | --- |
| Deck → case study | press scale 0.98, `open` haptic; a tilted card springs flat first (≤ 120 ms); the route starts a frame after the press paints | the card's artwork → the header artwork, its name → the H1, on the share spring; the title's two snapshots keep their size and cross-fade early, so the text stays sharp | the summary sheet unfolds 380 → 740 ms; the H1 rests (the morph was its arrival) and takes focus |
| Case study → next | `commit` haptic | the trailhead band's mini card → the next header and H1, named only for this commit (`commit-morph.ts`), inside a transition of the band's own (`route-transition.ts`: React animates nothing between two pages of one template) | as above |
| → About (HUD) | `commit` haptic | the HUD's About label grows into the About H1 (`AboutLink` ⇄ `MorphTarget`, share spring) | the facts legend unfolds from its left fold at 420 ms, its rows fading in turn |
| About → elsewhere | | the H1 shrinks back into the HUD label | the destination's own arrival |
| Back link → deck | `commit` haptic | the reassembly: 0–220 ms the page's own content (`data-vt-exit`) drops 8 px and fades on scree; from 100 ms the artwork and title travel back over 700 ms | from `--dur-settle` the card rebuilds: its neatline draws in the rarity colour over `--dur-medium` and its parts rise `--stagger-item` apart (`--dur-short`, drop easing); the card is focused |

**The terrain conductor** (`docs/terrain.md`) starts from the same commit: `TerrainBackdrop` sets
the route's terrain in a layout effect inside the transition's update, and the field morphs over
`--dur-terrain` (700 ms) alongside the page. Nothing waits for it, and every quiet zone holds the
strongest knockout until the transition and the field's own motion are over.

## Catalogue

Every effect by mode. "Once" means once per session (`settled.ts`).

### Chrome

| Effect | Full | Calm | Still | Tokens |
| --- | --- | --- | --- | --- |
| HUD condenses past 120 px (`HudFrame`) | the backdrop cross-fades to solid; the row moves up 6 px | same | backdrop only | `distance.hudCondense`, `--dur-still`, `--dur-settle`, `--ease-settle` |
| HUD brand rings (`HudMark`) | hover and focus scale each ring one step out, inner first; after a route change they trace again | same | none | `--dur-short`, `--dur-trace`, `--stagger-item` |
| HUD links (`HudLink`) | colour to glacier; a rule marks the current page or place; `commit` haptic | same | same (colour only) | `--dur-still` |
| Calm map and Haptics switches | the thumb moves on the thumb spring, the label's colour follows; `press` haptic | same | thumb at once | `--spring-thumb`, `--dur-micro` |
| Skip link | appears in place, fading in with its ring | same | fades | `--dur-tap` |
| Focus rings | arrive 6 px out and ease to 3 px as they fade in | same | fade only | `--dur-tap`, `--ease-settle` |
| Footer elevation profile | traces once from its start | same | drawn | `--dur-draw` (reveal `line`) |
| Footer wordmark | the contour flood | cross-fade | at once | flood tokens |
| Toast (Copy address) | rises in; stays 4 s, paused while hovered or focused | fades in | fades within 200 ms | `--dur-reveal`, `--dur-toast`, `--dur-still` |
| Lenis smooth scroll | fine-pointer desktop | off | off | |
| Field and posters | holds still while read; on a route change: morph, draw-on, zoom push on card terrains, Bern's river and pin; pre-warm on hovering or focusing a link to another terrain (desktop tier) | morph only; river and pin fade in | posters cross-fade | `--dur-terrain`, `--dur-draw`, `--dur-prewarm`, `--dur-still` |
| Page change | View Transition (above) | same | page fades in | `--dur-leave`, `--spring-share-*`, `--dur-calm` |

### Home

| Effect | Full | Calm | Still | Tokens |
| --- | --- | --- | --- | --- |
| Hero name (`HeroName`) | arrives on its weight from the first frame | rest | rest | `--dur-title`, `--ease-trail` |
| Hero name, hover, focus or tap | the contour flood (`flood.heroName`) | cross-fade | at once | flood tokens |
| Map sheet furniture (corner ticks, scale bar) | static | static | static | |
| Intro statement | weight 300 → 400 with a 6 px settle | rest | rest | `--dur-intro`, `--dist-intro-settle` |
| Section heads (`SectionHead`) | the rule draws, then the title arrives on its weight; the title floods per `flood.sections` | the rule draws, title at rest | there | `--dur-settle`, `--dur-title` |
| How I lead drawings | each line draws with the scroll (view timeline, entry 10% → cover 40%) where supported; drawn elsewhere | drawn | drawn | |
| How I lead text, Earlier work's logbook | never move | | | |
| Trail links ("More about me", Get in touch) | see TrailLink | | | `--dur-trail` |
| Copy address (`FloodButton`) | flood; the label turns to "Copied" in its reserved box; toast; `success` haptic | cross-fade | at once | flood tokens |

### Deck and cards

| Effect | Full | Calm | Still | Tokens |
| --- | --- | --- | --- | --- |
| Card arrival (once per card as it enters; cards on screen are there) | rises 12 px and fades in the card stagger; the type line fades `--dur-tap` later; the scope pips fill in turn; the rarity shape traces | no rise or fade; type line, pips and trace stay | there | `--dur-reveal`, `--stagger-card`, `--dist-rise-card`, `--dur-tap`, `--dur-trace` |
| Mythic foil sweep | once, after the card's arrival | none | none | `--dur-glint` |
| Hover or focus | lifts −6 px on the card spring; the border brightens, the shadow deepens; the artwork's contours grow by a line around the summit; the open chip slides in; foil (rarity R and M) and glare; the field pre-warms the card's terrain | lift, border, contours, chip | the chip fades; colour only | `--spring-card`, `--dur-still`, `--dur-medium`, `--dur-shift` |
| Tilt (fine pointer, after the page is idle) | ≤ 5° (mini card 3°) on the tilt spring, foil and glare following the pointer; back flat over 240 ms on leave | flat | flat | `spring.tilt`, `--dur-breath-out`, `--dist-tilt-max` |
| Press and open | scale 0.98 on the press spring, `open` haptic, the morph | same | colour | `--spring-press`, `--scale-card-press` |
| Visited stamp, ridge, captions | static | static | static | |
| Return from a case study | the reassembly (Route transitions) | same | the card is simply there | `--dur-settle`, `--dur-medium`, `--ease-drop` |

### Case study

| Effect | Full | Calm | Still | Tokens |
| --- | --- | --- | --- | --- |
| H1 | arrives on its weight on a direct load; rests after a morph; floods (`flood.caseStudyTitle`) | rest; flood cross-fades | rest; flood at once | `--dur-title` |
| Trailhead spread, stages, side notes, key insight, fork diagrams, logbook, descent | never move | | | |
| Summary (`LegendSheet`, the paper sheet) | on a link arrival unfolds from its top 380 → 740 ms; below the fold it unfolds as it comes into view; the text fades in after | same | there | `arrival.summary`, `--dur-legend-unfold`, `--dur-short` |
| Figures | unfold behind a scan line, corner ticks after, the caption last; a contour placeholder until decoded, then the image cross-fades in | same | shown | `--dur-settle`, `--dur-short`, `--dur-still` |
| Waypoint trail (≥ 1280 px) | the glacier fill follows the scroll; node colours ease; the current pin pings once | fill, colours | fill; colours at once | `--dur-medium`, `--dur-long` |
| Altimeter bar (< 1280 px) | shown from the first stage; its progress line follows the scroll; the jump sheet rises; `press` and `detent` haptics; a jump focuses the stage's heading | same | the sheet fades | `--dur-sheet`, `--dur-still` |
| Elevation profile | the line traces once; the table never moves | same | drawn | `--dur-draw` |
| Evidence legend | unfolds from its left fold; its swatches draw, then fill | same | shown | `--dur-trace`, `--dur-short` |
| Lightbox | the image morphs into the dialog and back; zoom eases; focus in, Esc, focus back; `press` haptics | same | opens at once | `--spring-share-*`, `--dur-short` |
| Before/after | a one-time hint, the divider swinging 50 → 56 → 50%; `detent` at 0, 50 and 100%; `press` on its view buttons | no hint | no hint | `duration.long` |
| Hotspots | pins ping once in turn; a pressed pin's title unfolds beside it; `detent` | no ping; unfold stays | at once | `--dur-instant`, `--dur-long`, `--dur-unfold` |
| Trail links (back, skim, jump chips, Next stage, Back to top) | see TrailLink | | | `--dur-trail` |
| Trailhead band | the mini card rises in; Next project as a display trail link; the commit morph | the mini card fades in | there | `--dist-rise-card`, `--dur-reveal` |

### About

| Effect | Full | Calm | Still | Tokens |
| --- | --- | --- | --- | --- |
| H1 | the HUD label morphs into it and it rests; on a direct load it arrives on its weight, the clipped stem copy hidden meanwhile | morph, rest | rest | `--spring-share-*`, `--dur-title`, `--dur-short` |
| Portrait card | lifts on hover or focus; turns over to the facts | lifts; cross-fade | swaps at once | `--dist-lift`, `--dur-flip`, `--dur-flip-calm` |
| Facts legend (`MapSheet`) | on a link arrival unfolds from its left fold at 420 ms, rows fading in turn; below the fold as it comes into view | same | there | `arrival.landed`, `--dur-micro`, `--stagger-item` |
| Lead, Who I am, How I work with people, Field kit, Tools and craft | never move | | | |
| How I start | a short trail draws between the three steps (across; down on phones) | same | drawn | `--dur-trace` (reveal `mark`) |
| Career profile | the walked red line follows the scroll (view timeline `--career-climb`) where supported, else draws once on entry; roles and heights never move | draws once on entry | drawn | `--dur-draw` (reveal `trace`) |
| Card binder | the page turns in once; a pocket card lifts and turns over to its line | page at rest; cards cross-fade | swaps at once | `--dur-long`, `--dur-flip`, `--dur-flip-calm` |
| Get in touch | as on home | | | |
| Field | recentres on Bern: the Aare draws, the zero-point pin pings | river and pin fade in | Bern's poster | `docs/terrain.md` |

### Route

| Effect | Full | Calm | Still | Tokens |
| --- | --- | --- | --- | --- |
| Walked line | follows the scroll (scroll timeline; frame-loop fallback) | steps waypoint to waypoint | the whole route solid | `--dur-medium`, `--ease-settle` |
| Dashed base | shown | shown | hidden | `--color-signal` |
| "You are here" marker | rides the walked line's end | steps with it | hidden | `--color-signal`, `--color-ground`, `--color-paper-dusk` |
| Blaze (above the last station) | white-red-white | same | same | `--color-paper-dusk` |
| Phone margin trail | 2 px in the 16 px margin, switchbacks before each waypoint | same | same | |

### Gate and holding page

Rendered by `src/hosting/page.ts` with CSS and a tiny script from `scripts/site/holding.mjs`, no
React. The password field's underline draws on focus over `--dur-trail` (at once with reduced
motion); the submit button reads "Checking…" while the password is checked; a wrong password shows
the error in place (border, underline and message), never a shake. Nothing follows the pointer and
nothing moves on its own; the poster is static.

## Accessibility and haptics

- **Haptics** (Android only, always through `haptic()`): opening a card `open` (8 ms); a
  navigation commit (HUD links, trail links, Next project, back links) `commit` (10); buttons and
  switches (`FloodButton`, the Calm map switch, the altimeter bar and its sheet, lightbox and
  comparison buttons, the toast's dismiss) `press` (6); Copy address `success`; a jump within the
  page, the comparison's detents and hotspots `detent` (4). `error` exists but nothing on the site
  plays it. Nothing on scroll, hover or reveals.
- **Forced colours**: no foil, glare, glint, flood or field (the backdrop is hidden); the route
  and the trail links' line in system colours; focus rings in `Highlight`.
- **Screen readers**: titles are one text node; flood copies, button echoes and drawings are
  aria-hidden; the toast's text is a status; a route change announces the new H1 (focus); the
  switches' names are their visible labels; the portrait card's face turned away is inert; the
  binder's card faces are hidden (each pocket is a toggle named by its card, and the lines are
  listed as text beside the binder).
- **WCAG 2.2.2 / 2.3.3**: nothing moves on its own; every motion answers an interaction, the
  scroll or a page change, and calm and still cover all of it.
- **Contrast** (`npm run check:contrast`, `scripts/check-contrast.mjs`): text over the field at
  least 7:1 (in a quiet zone, on the HUD backdrop, knocked out), text on paper or raised ground at
  least 4.5:1, meaningful non-text marks (the route, focus rings, outlines, rarity shapes) at
  least 3:1. On the paper of the case-study summary only `paperInk`, `paperInk2`, `mossInk` and
  `alpenglowInk` carry text (`paperSafeInk`); the route there is `routePaper`.

## Checks

- `npm test`: tokens ↔ CSS, tokens read by stylesheets exist, no new hard-coded motion values,
  breakpoints, cascade layers, the route red, no pointer following, the red route's geometry
  (`route-geometry.test.ts`), the terrain conductor (`terrain.test.ts`).
- `npm run test:e2e -- modes`: still has no transform, width or position animation, nothing over
  200 ms and no View Transition call; calm and full run View Transitions and animate responses;
  no field frames while a page is read; no glint on titles.
- `-- transitions`: aborted, skipped and timed-out View Transitions still navigate cleanly, in
  every mode. `-- hydration`: direct loads of every route without hydration or console errors.
- `-- primitives`: layout shift per primitive in the lab (≤ 0.005) per mode, focus parity of
  trail links, no width change, no sticky hover after a tap.
- `-- flood`, `-- trail`, `-- portrait`, `-- pointer`, `-- inp`: the interaction primitives by
  mouse, keyboard and touch in each mode; nothing follows the cursor; the Next project tap on a
  throttled phone (INP ≤ 200 ms).
- `-- arrival`: route arrivals' timing, focus on the H1, the trailhead morph, traversals, About,
  still. `-- reading`: the waypoint trail, the altimeter bar, the career profile per mode, no
  endless loops. `-- about`: the HUD label ⇄ About H1 morph in each mode.
- `-- route`: one path through every waypoint, never across a line of text, the phone margin, the
  blaze; full on a scroll timeline and through Lenis, the fallback, calm, still.
- `-- terrain`: the conductor's timing, Bern, pre-warm, a still field while reading, calm and
  still, About's pin and Aare clear of its title and portrait.
- `-- cards`, `-- deck`, `-- toast`, `-- hud`, `-- fontswap`, `-- access`: the card's responses,
  the deck loop, the toast, the HUD's condensing, the font swap (CLS ≤ 0.05), forced colours and
  the haptics map.
- `npm run report:motion`: layout and style time in a page's first 3.5 s on an emulated phone
  with the CPU slowed 4× (Lighthouse mobile with `--lighthouse`).
- `npm run record:motion`: review videos in `motion-recordings/` (the lab, a round trip per mode,
  the terrain conductor per mode, the home page, About from the HUD, the case-study loop).
