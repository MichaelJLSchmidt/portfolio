# Motion

The site's motion language has one verb: **settle**. Text arrives slightly wide and condenses to its
set width, like contour lines tightening near a summit; interactive text breathes wider on hover or
focus and settles back; a single mint **glint** marks a first arrival or a committed action. Display
text rests at wdth 62, Archivo's narrowest, so a settle always comes from wider.

Later phases apply the primitives below; they do not invent new motion. Every value comes from
`src/styles/tokens.ts`. The motion lab (`/lab/`, basecamp and preview builds only) shows every
primitive in the three modes side by side.

## Modes

`html[data-motion]` holds one of three modes, set before first paint by the inline script in the root
layout (`src/lib/motion-mode.ts`) and kept in sync with the OS setting and the switch.

| | full | calm | still |
| --- | --- | --- | --- |
| Chosen by | default | the "Calm map" switch | the OS (`prefers-reduced-motion: reduce`), also without JavaScript |
| View Transition morphs (card ⇄ page, mini card → next page, HUD Basecamp label ⇄ Basecamp H1, figure ⇄ lightbox) | yes | yes | no API call; the 150 ms route fade |
| A route's arrival (parts timed from the commit) | yes | yes (fades without rises) | the page is simply there |
| Hover, focus, press responses | yes | yes | colour and opacity only, ≤ 200 ms |
| Title settles | yes | yes (cascade ≤ 240 ms) | rest state |
| Reveals, contour rules, map sheets | yes | yes; reveals fade without the rise | shown, never hidden |
| Glint (signature) | yes, at most one per viewport | no | no |
| Pointer shine (headlamp on type) | yes (mouse and pen) | no | no |
| Field: drift, line flow, headlamp, parallax, intro sweep | yes | no; the map holds still | poster |
| Field: terrain morph between routes | yes, with zoom push | yes, no zoom push or draw-on | poster |
| Card tilt, foil, glare, touch glint, deal-in | yes | no (deal-in and foil off; lift, settles stay) | no |
| Pings (trail pin, hotspot pins, camp pins), the slider's hint | yes | no | no |
| Career climb | follows the scroll | draws once on a timer | complete |
| Loops | the poster's drift only (desktop, field ambient) | no | no |
| Lenis smooth scroll | yes (fine pointer) | no | no |
| Haptics | on by default | off by default | off |

Precedence: still always wins. When the OS forces still, the switch shows "on" and its accessible
description says why. The switch is a native `<input type="checkbox" switch role="switch">` whose
visible label, "Calm map", is also its name (WCAG 2.5.3 Label in Name); its description reads
"Reduces motion on this site", plus the explanation when the OS forces still. The thumb shows the
state (html[data-calm], set at once on a flip); the mode itself (html[data-motion], which restyles
the whole page and re-renders what follows it) changes a frame later, so the switch answers first.

Preview builds accept `?motion=full|calm|still` for one page load (the lab's frames, tests,
recordings); the OS setting still wins.

### Writing CSS for the modes

Motion is opt-in per mode, so a mode switched mid-animation lands the element at once:

```css
/* Full only (glint, shine, tilt, loops, ambient): never without JavaScript. */
:root[data-motion="full"] .x { animation: … }

/* Full and calm, also without JavaScript (first-paint settles), never in still. */
@media (prefers-reduced-motion: no-preference) {
  :root:not([data-motion="still"]) .x { transition: … }
}
```

Colour and opacity transitions of `--dur-still` (200 ms) or less may stay unguarded. Hover styles go
under `@media (hover: hover)`; `:focus-visible` gets exactly the hover state (one `--on` switch read
by every declaration, as in `SignatureLink.module.css`).

In JS: `useMotionMode()` for rendering, `currentMode()` outside React (and in effects that run during
hydration, when the hook still reports the server snapshot, "still").

## Tokens

All in `src/styles/tokens.ts`, exposed as CSS custom properties by `tokensToCss()` (springs by
`springsToCss()` in `src/styles/motion-css.ts`). `npm test` checks that the CSS carries exactly the TS
values, that every token a stylesheet reads exists, and that no stylesheet adds its own duration,
`cubic-bezier()` or `font-stretch` (a shrinking allowance lists the older ones).

- **Durations** (`--dur-*`): the scale `instant 80, micro 140, calm 150, short 220, medium 360, long
  560, scenic 900, cinematic 1400`, and semantic ones: `tap 120` (press), `breath 160` (one letter's
  breath), `underline 180` (inline link), `still 200` (still mode's ceiling), `breath-out 240`,
  `reveal 350`, `settle 420`, `route 600`, `settle-display 640`, `terrain 700`, `glint 900`, `draw 900`,
  `trace 400` (a small mark tracing itself: the logo's rings, a rarity shape), `leave 160` (unshared
  content leaving as a route starts), `crossfade 180` (back and forward), `sheet 300` (a bottom
  sheet), `unfold 240` (a small sheet: the fiction banner, a hotspot's note), `arrival 740` (a
  route's arrival has landed), `shift 600` (card contours shifting by one interval), `prewarm 400`
  (the field leaning towards a hovered link's terrain), `toast 4000` (how long a toast stays: a
  reading time).
- **Arrival** (`arrival`, ms after a route commits): `lines 260` (a case study's type and meta lines
  settle), `summary 380` (its summary sheet unfolds, to `duration.arrival`), `landed 420` (Basecamp's
  lead and legend, the H1 having landed).
- **Easings** (`--ease-*`): `trail`, `summit`, `drop`, `scree` (content leaving the screen only; never
  ease in on UI), `settle` (0.16, 1, 0.3, 1), `glint` (0.45, 0, 0.55, 1).
- **Springs** (Motion, and `--spring-*` as `<duration> linear(…)` sampled from Motion's own spring):
  `press` {0.16 s, bounce 0}, `card` {0.35, 0.15}, `share` {0.42, 0.1}, `thumb` {0.2, 0.2}, `tilt`
  {stiffness 220, damping 26, mass 0.6}, `settle` {0.12, 0}. Use as `transition: transform
  var(--spring-press)`; `--spring-<name>-dur` and `--spring-<name>-ease` give the parts where the
  duration and the timing function are set apart (view-transition pseudo-elements).
- **Staggers** (`--stagger-*`): `char` 14 ms (cascade ≤ 240), `word` 40 (≤ 320), `item` 50 (first 6
  items), `card` 70 (≤ 420). `staggerStep(stagger.char, n)` fits a cascade into its cap.
- **Distances** (`--dist-*`): `rise` 8 px, `rise-card` 12, `nudge` 4, `lift` −6, `tilt-max` 5°,
  `tilt-mini` 3° (the trailhead band's mini card), `perspective` 900, `hud-condense` 120 (the HUD
  condenses past it); `--scale-press` 0.97, `--scale-card-press` 0.98.
- **Axes** (`--axis-<role>-<state>-wdth|wght`): display rest 62/800, reveal 80/100, hover 70 (+8),
  press 700 weight, compact 72 (card names); label rest 100/600, reveal 110, hover 112/650, press 96;
  mono rest 87.5/500, reveal 112.5, hover 100, press 80, condensed 75 (the HUD after scroll).
  `--type-condensed-wdth` (88) and `--type-finding-wdth` (85) for condensed UI text.
- **Glint**: band 18% of the text, 100°, glacier at 55%, `--dur-glint`, dark surfaces only.
- **Headlamp**: radius 120 px (at least 1.2 em of lit type), Gaussian falloff k = 3, rise `micro`,
  fade 600 ms, type lit at most 50% towards glacier. Shared by the field and the type shine.
- **Haptics**: `press 6, open 8, commit 10, success [8,60,8], error [12,40,12], detent 4` ms, at most
  one pulse per 80 ms (the map is under Accessibility and haptics).
- **Layers** (`--layer-*`): backdrop 0, page 1, hud 30, overlay 40, skip-link 100.
- **Breakpoints** (`breakpoint`, at most three; media queries write them literally, `(min-width:
  1024px)` or `(width < 1024px)`, and `npm test` checks every width query): `sm 640` (the HUD's
  readout and haptics switch, two-up grids), `md 1024` (the HUD's whole navigation, two-column hero,
  case-study and Basecamp headers), `lg 1280` (the HUD's clock and the readout's coordinates, the
  case-study trail). `device.desktopMinEdgePx` (900) is the desktop tier's long edge, not a layout
  breakpoint.

## Levels and budgets

Every effect belongs to one level (`levels` in the tokens):

| Level | Budget |
| --- | --- |
| ambient | one channel, desktop, full mode only |
| reveal | at most 2 groups at once, ≤ 600 ms each, once per session |
| response | ≤ 300 ms, interruptible |
| transition | one at a time, readable within 300 ms |
| signature (glint) | at most one per viewport, once per session |

Body text, flavour text, table cells and numbers inside prose never move. Animate only transform,
opacity, clip-path, colour, and font-stretch or font-weight on isolated, size-reserved elements.

## Primitives

All in `src/components/motion/`. Each works in full, calm and still with no layout shift
(`npm run test:e2e -- primitives` sums the shift per primitive: ≤ 0.005).

### SettleText

```tsx
<SettleText as="h1" text={"Two\nlines"} mode="chars" trigger="paint" glint shine quiet settleOnArrival />
```

- `mode`: `chars` (per-letter cascade, display titles), `words`, `block` (one run in a box reserved at
  its widest state: labels, buttons, nav). `block` with `wrap` is for text that may wrap
  (headings): every letter keeps its rest-width box, so line breaks never change, and the whole
  block settles at once.
- `role`: `display` (default for chars and words), `label` (default for block), `mono`, or `text`:
  the className sets the rest axes (`--kt-rest-wdth`, `--kt-rest-wght`, written as
  `.x[data-role] { … }` to outrank the defaults) and the text settles from the breath above them,
  a small settle (H3s, waypoint findings).
- `reserve` (block): `widest` (default) or `rest`, a box at the rest axes (or `--kt-box-wdth`) with
  the run over it, spilling past it for the moment of the settle (tight rows: the HUD).
- `widths="display"`: every letter's box takes its measured width at the display rest axes
  (`src/lib/display-widths.json`, `scripts/measure-display.mjs`), so the web font replacing the
  fallback moves nothing (display titles in the first viewport). The display cut also has a
  fallback face with Archivo's vertical metrics (`globals.css`). `widths="condensed"`: the same for
  the condensed cut at wght 600 (`src/lib/condensed-widths.json`), each word space a measured gap
  at the end of its word, so wrapping text keeps the web font's line breaks (the case-study type
  line).
- Boxes reserved at the label breath axes (SignatureLink and MotionButton ghosts) take the
  "Archivo Breath Fallback" until the web font arrives: a fallback can't widen, and a narrower
  box would rewrap a row of links when the font lands.
- `delay` (ms): the line leads; `channel="heading"`: one heading settle at a time, snapping to rest
  while the page scrolls fast. `scope="site"`: once per session wherever it appears (the HUD).
- `trigger`: `paint` (CSS from first paint, before hydration), `inview`, `manual` (`ref.play()`).
- Plays once per element per session (`src/lib/settled.ts`; the pre-paint script renders settled
  elements at rest, so reloads and pages Next re-shows never replay).
- `settleOnArrival`: on a View Transition target it holds at the breath axes during the morph and
  settles after it lands (browser back and forward show it at rest).
- `arrive={ms}`: part of a route's arrival (`arrival` in the tokens): on a link navigation it settles
  that long after the route commits, every time; direct loads settle from first paint as usual.
- `glint`: one glint after the first settle this session (full only), and again whenever a commit
  led to the page (`glintOnArrival`). `shine`: the headlamp lights the letters (full only, mouse and
  pen). `breath`: the letters follow an ancestor's `--on` to the breath axes (a hovered card, the
  current waypoint).
- Per-glyph properties are namespaced and registered without inheritance (`--kt-i`, `--kt-shine`).
- The accessible name is a visually hidden copy of the text; the letters are `aria-hidden`.

### Glint

`<Glint text="…" />` inside a positioned element, then `playGlint(element)`. An aria-hidden copy of
the text lies over the original with transparent letters; a band clipped to them moves by animating a
registered gradient position (`--glint-x`). Chosen because it works whatever colour the letters set
for themselves (rest colour, shine) and repaints one layer only. `surface="sheet"` draws a 1 px
moss-ink rule instead. Full mode only, one glint at a time. `playGlint(el, { auto: true })` for a
glint nobody asked for (a first arrival, a Mythic card arriving, a card crossing a phone's middle,
the contact band): it is skipped within a screen's height of the last one on the page, so there is
at most one signature per viewport. A commit to another page calls `glintOnArrival(path)`: the
transition freezes the departing link in its snapshot, so the destination's H1 glints once it has
landed.

### Headlamp

`watchHeadlamp((lamp) => …)` (`src/lib/headlamp.ts`): one pointermove listener for mouse and pen,
delivered once per frame on Motion's frame loop; `headlampFalloff(d)` for a distance in radii. The
contour field and the type shine both use it.

### SignatureLink

```tsx
<SignatureLink href="/work/x/" variant="display" label="Seilschaft" arrow="→" before={<span>Next expedition</span>} />
```

- `inline`: a contour underline draws (clip-path, `--dur-underline`) and the colour moves to glacier.
- `standalone` / `display`: letters breathe wider left to right (14 ms ripple), the arrow nudges 4 px;
  leaving settles back right to left within 240 ms. The label's box is reserved at the breath axes.
- `nav`: the breath plus `current` (`true`/`"page"`: aria-current="page"; `"location"`: the place
  within a section, e.g. Expeditions on a case study; glacier, a drawn rule).
- `chip`: a pill; the label breathes and the border brightens from contour to glacier; pressed or
  current, it fills with the sheet colour (ground text).
- `role`: `label` (default), `mono` (the HUD; a container can narrow `--l-rest-wdth`), `display`.
  `settle`: the letters settle from the role's reveal axes at first paint, once per session.
  `arrowAt="start"`: a leading arrow that nudges back (back links). `plain`: an `<a>` instead of
  `next/link` (files: the CV).
- Keyboard focus gets exactly the hover motion; press narrows the weight; a commit (click, Enter,
  tap) ticks the `commit` haptic (a jump within the page: `detent`) and glints: on the destination's
  H1 for another page, on the link otherwise. Hover only under `(hover: hover)`.
- Set the label's rest colour with `--l-rest-color` (e.g. in `labelClassName`).

### RuledHeading

`<RuledHeading id="x" text="What changed" className="display" ruleClassName={…} />`: a contour rule
draws as the heading scrolls into view, then the H2 settles a moment later (`--dur-short`) as one
block (`SettleText mode="block" wrap`, the heading channel). Section heads (`SectionHead`: the
eyebrow settles in mono, letter by letter), Basecamp's headings and the ascent; waypoint headings
build the same order from a rule, a mono label and the finding (role `text`).

### RollNumber

`<RollNumber value={4158} />` (`pad={2} trend={1}` for a clock): a number that rolls digit by digit
to its new value (Motion+ `AnimateNumber`, one shared lazy chunk loaded the first time a value
changes, so a page whose numbers never move never fetches it; never in still, where numbers snap). Server and hydration render `formatInteger` (or zero-padded), so they
agree; each thousands group rolls on its own so the digits match. Decorative: give screen readers
the value as text and hide this. The terrain readout, the Bern clock and the career climb's readout
use it.

`<RollValue value="38% → 82%" only="last" />`: a value as written whose numbers roll once, the
first time it is in view this session, from a nearby value a little below (`only="last"`: a before
→ after pair rolls its after-value). The box is reserved at the written value and screen readers
get it as text. The Summit log and the case studies' metric tiles.

### MotionButton

`<MotionButton label="Enable tilt" onClick={…} />`: the label breathes on hover and focus (box
reserved), press scales to 0.97 on the press spring, a `press` haptic (`pressHaptic={false}` when
the action ticks its own). `labels={["Copy address", "COPIED"]}` reserves the box at the widest of
them, and a change of label settles the new one in from the label's reveal width.

### Reveal, ContourRule, MapSheet

Mark a block `data-reveal`:

| Kind | What it does |
| --- | --- |
| `""` | rises 8 px and fades (calm: fades) |
| `"card"` | rises 12 px and fades (calm: fades) |
| `"fade"` | fades only, after its block's `--fade-after` (running text may take it) |
| `"rule"` | draws (scaleX) |
| `"line"` | traces a drawn line over the draw token (the footer's elevation profile) |
| `"list"` | draws a list's ring bullets with the item stagger (`--i` per item) |
| `"quote"` | draws a pull quote's rule (its `::before`), then fades the quote in |
| `"caption"` | fades in after its figure |
| `"mark"` | draws a small mark's paths (`pathLength="1"`): the decision's marker, the 90-day trail |
| `"sheet"` | unfolds from its fold edge (`data-fold="top|left"`, clip-path) over `--sheet-dur` (default `--dur-reveal`), its content fading in after; `data-sheet-rows` on a child fades its rows in turn (`--i`); `data-draws` gives it time for marks that draw after it opens |
| `"figure"` | unfolds behind a 1 px scan line over `--dur-settle`, then its corner ticks; below the fold its images show a contour placeholder until decoded, then cross-fade in |

`<ContourRule />` is a 1 px line that draws and `<MapSheet fold="top|left" arriveAt={…}>` a light
sheet that unfolds. One controller (`reveal.ts`, mounted in the root layout) runs them: anything in
the first viewport is visible from first paint and never hidden (so it can be the LCP element);
below the fold, blocks wait and reveal once per session, at most two groups at once within 600 ms,
and snap to their end state while the page scrolls fast. Running text, tables and numbers never
move: a rising block that is or holds `.body-copy`, `.surface-copy` or a table is shown at once, so
mark labels, eyebrows, actions and panels without prose, not paragraphs.

The one exception to "the first viewport is simply there" is a route's arrival by a link (below):
a block marked `data-arrive-at="<ms>"` that is on screen when the route commits plays from that many
milliseconds after the commit, up to the arrival's end (or for `data-arrive-dur`), every time.

### useMotionMode and haptic

`useMotionMode()` returns `{ mode, tier, calm, forcedStill, haptics, hapticsAvailable, setCalm,
setHaptics }`; `tier` is `desktop` (fine pointer, long edge ≥ 900 px), `mobile` or `low`
(`html[data-tier]`). `haptic(event)` vibrates on supporting Android browsers only, for direct user
actions (transient activation), at most once per 80 ms, never in still, in calm only when switched on.
The haptics switch (footer) is rendered only where vibration works (`html[data-haptics]`).

## Route transitions

`src/lib/view-transition.ts` wraps `document.startViewTransition` once and gives every transition a
kind (`transitionKind()`):

| Kind | When | What plays |
| --- | --- | --- |
| `route` | a link to another page | the old page's own content leaves over `leave` 160 ms (the new page fades in over the same: plus-lighter, the map and HUD at constant brightness); shared parts travel on the share spring; then the arrival |
| `return` | a back link into the deck | the card reassembly (`return-transition.ts`): the page's parts drop out, the artwork and title travel back, the card rebuilds and its name glints |
| `traverse` | browser back and forward (`HistoryTransitions` replays popstate inside a transition) | `html[data-vt="traverse"]`: a `crossfade` 180 ms cross-fade plus the shared elements both pages have; no arrival choreography, no glint |
| `view` | in the page: the deck's Cards ⇄ Index switch, the lightbox | their own timing |

Still mode never calls the API (the wrapper throws, React commits directly) and the new page fades
in over `calm` 150 ms (`RouteFade`).

**The arrival** (`RouteArrival`, run when the conductor's `fieldStore.routeSeq` moves, the moment the
field starts): on a `route` or `return` transition the new page's `main` gets `data-arrival`, its
`data-arrive-at` blocks play (`reveal.ts`) and `SettleText arrive` settles. Text never waits: it is
readable throughout. Then focus moves to the new page's H1 (`tabindex="-1"`, no ring) so screen
readers announce it, unless the page placed focus itself (the deck focuses the card the reader came
from) or the URL has a hash (its target).

| Route | 0 ms | travel | then |
| --- | --- | --- | --- |
| Deck → case study | press state, `open` haptic | artwork → header, name → H1, share spring | type and meta lines settle from 260 ms; the summary sheet unfolds 380 → 740 ms; the H1 settles once landed, then glints |
| Case study → next | press state, `commit` haptic | the trailhead band's mini card (named only for this commit, `commit-morph.ts`) → header and H1, inside a transition of the band's own (`route-transition.ts`: React animates nothing between two pages of one template) | as above; the commit's glint on the H1 |
| → Basecamp (HUD) | press state, `commit` haptic | the HUD label → H1, share spring | the H1 holds just wide through the morph and settles after; the lead settles and the legend unfolds from 420 ms (rows in turn) |
| Back link → deck | `commit` haptic | the reassembly | the card is focused |

## Catalogue

Every component's motion by mode. "Settle", "breath", "glint", the reveal kinds and the arrival are
the primitives above; "once" means once per session (`settled.ts`).

### Chrome

| Component | Full | Calm | Still |
| --- | --- | --- | --- |
| HUD bar (`Hud`, `HudFrame`) | condenses past 120 px (mono to wdth 75); labels settle once (site scope); logo rings trace on every route change | same | rest states, colour only |
| Nav links, CV, Basecamp link | SignatureLink nav: breath, current rule | same | colour |
| Terrain readout | numbers roll to each terrain (and waypoint) | roll | snap |
| Bern clock | the minute rolls | roll | snap |
| Calm map / haptics switches | thumb on the thumb spring, labels settle, `press` haptic | same | colour |
| Skip link | settles in when focused | same | opacity |
| Focus rings | arrive 6 px out and ease to 3 px (`tap`) | same | fade only |
| Footer | elevation line traces (`line`); links underline | same | drawn |
| Field (`TerrainBackdrop`, `ContourField`) | drift, line flow, headlamp, parallax (desktop), the route conductor (morph, draw-on, Bern's river and pin) | holds still; morphs only | poster, cross-fade 200 ms |
| Poster (field off) | slow drift on desktop | still | still |

### Home

| Component | Full | Calm | Still |
| --- | --- | --- | --- |
| Hero name, eyebrow | settle from first paint; the name's glint once | settle, no glint | rest |
| Scroll cue | its line draws down once, then rests | same | drawn |
| Section heads | rule draws, eyebrow settles (chars), heading settles (block), one heading at a time | same | rest |
| Summit log | the sheet unfolds; each number rolls once from nearby (pairs: the after-value) | same | as written |
| Trail rules | titles settle as a group (item stagger); evidence lines fade in `tap` later | same | shown |
| Field notes | each note's sheet unfolds in turn; quotes never move | same | shown |
| Workshops | the formats as chips (the chip variant's look, no response: they are not controls) | same | same |
| Contact band | heading settles and glints once (the page's last signature); Copy address: label settles to COPIED, toast (status) with a glint, `success` haptic | no glint | colour |

### Deck and cards

| Component | Full | Calm | Still |
| --- | --- | --- | --- |
| Deck view switch | names morph Cards ⇄ Index over 360 ms | cross-fade | at once |
| Card arrival | rises 12 px in the card stagger, name settles, type line, pips fill, rarity traces; Mythic gold glint | settles, no rise or glint | there |
| Card hover / focus | lift −6 px, border, name breath, chips breathe in turn, contours shift, stats roll once, tilt ≤ 5° and foil (pointer) | lift, breath, roll | colour |
| Card press / open | scale 0.98, `open` haptic, the case study's H1 glints after the morph | same, no glint | colour |
| Touch | stats roll in view; one glint as a card crosses the middle (at most one per viewport) | roll | none |
| Visited stamp | settles once | same | rest |
| Index rows | name breath, rule draws, terrain pre-warms | same | colour |

### Case study

| Component | Full | Calm | Still |
| --- | --- | --- | --- |
| Fiction banner | unfolds (240 ms) behind its alpenglow-ink rule; never dismissed | same | there |
| Type and meta lines | settle at 260 ms on arrival (direct load: from first paint) | same | rest |
| Summit summary | sheet unfolds from its top fold (360 ms), rows fade in turn; values never move | same | there |
| HUD readout while reading | "WAYPOINT n / N · ALT", the altitude climbing to the summit, numbers roll | roll | snap |
| Trail ("On this page", ≥ 1280 px) | scroll-linked fill; the pin pings once as a waypoint becomes current; its label breathes +8 | fill, breath | fill, colour |
| Altimeter bar (< 1280 px) | from the first waypoint: the label settles on every change, a progress contour; the jump sheet rises (300 ms), `press` and `detent` haptics, focus to the heading | same | sheet fades in |
| Waypoint headings | rule, mono label, then the finding settles; one at a time; snap when scrolling fast | same | rest |
| Lists, quotes, insight | ring bullets draw; quote rule then fade; insight sheet unfolds | same | shown |
| Decisions | a contour marker draws beside the chosen option | same | drawn |
| Figures | unfold behind a scan line (420 ms), corner ticks, caption after; contour placeholder until decoded | same | shown |
| Lightbox | the figure morphs into the overlay and back (share spring); focus trap, Esc, focus returns; `press` haptics | same | at once |
| Before/after | labels breathe while held; a one-time hint 50 → 56 → 50%; `detent` at 0/50/100% | no hint | colour |
| Hotspots | pins ping once in turn (80 ms apart); a pressed pin's title in a mini sheet that unfolds and settles; `detent` | no ping | at once |
| Evidence legend | unfolds; its swatches draw | same | shown |
| Metric tiles | numbers roll once from nearby | same | as written |
| Trailhead band | Next expedition (display link) beside the next card's mini card; the back link's arrow nudges back 4 px | same | colour |

### Basecamp

| Component | Full | Calm | Still |
| --- | --- | --- | --- |
| H1 | the HUD label morphs into it, holds, settles, glints | no glint | rest |
| Lead, legend | lead settles and legend unfolds from 420 ms on arrival; legend rows fade in turn, their labels settling in mono | same | there |
| Rope rules | leads settle as a group | same | rest |
| First 90 days | a short contour trail draws between the three steps (across; down on phones) | same | drawn |
| Career climb | the climbed line follows the scroll (a view timeline where supported, the scroll handler elsewhere) with a climber; camp pins ping once; the readout's altitude rolls camp to camp; upright beside the plaques on phones | draws once on a timer (1.4 s) | complete |
| Zero point and river | the pin sits at the screen's centre and the Aare's start above it: the header reaches past the middle so both stay clear of text (1440×900, 1280×800, 390×844) | same | poster |

### Gate and holding page

The password field's underline draws on focus, the button reads CHECKING… while it waits, errors
signal in place; reduced motion turns them off (CSS in `src/hosting`).

## Accessibility and haptics

- **Haptics** (Android only, always through `haptic()`): card open `open` 8 ms; Next and every
  navigation commit `commit` 10; buttons and switches `press` 6; Copy address `success` [8, 60, 8];
  jumps (in-page links, the altimeter's sheet), the slider's detents and hotspots `detent` 4.
  Nothing on scroll, hover or reveals.
- **Forced colours**: no foil, glare, glint or field (the backdrop is hidden); focus rings in
  `Highlight`.
- **Screen readers**: every split text is read once (a visually hidden copy, the letters
  `aria-hidden`); the toast's text is a status; the readout is plain text; a route change announces
  the new H1 (focus); the switches' names are their visible labels.
- **WCAG 2.2.2 / 2.3.3**: nothing moves on its own for more than 5 s but the desktop field's ambient
  in full motion (and the poster's drift standing in for it), which the Calm map switch stops; calm
  and still cover every interaction-triggered motion above. The Bern clock updates once a minute
  (its roll stops in calm and still).

## Checks

- `npm test`: tokens ↔ CSS, tokens read by stylesheets exist, no new hard-coded motion values.
- `npm run test:e2e -- modes`: still has no transform, width or position animation, nothing over
  200 ms and no View Transition call; calm runs View Transitions with no ambient field frames and no
  glint; full keeps both.
- `npm run test:e2e -- hydration`: direct loads of every route without hydration or console errors,
  the motion attributes kept.
- `npm run test:e2e -- primitives`: layout shift per primitive (≤ 0.005) in each mode, focus parity
  of the signature link, no sticky hover after a tap.
- `npm run test:e2e -- arrival`: route arrivals' timing, focus on the H1, the trailhead morph,
  traversals, Basecamp, still. `-- reading`: the waypoint readout, the trail, the altimeter bar,
  the career climb per mode, no endless loops. `-- cards`, `-- views`, `-- transitions`, `-- modes`.
- `npm run report:motion`: layout and style time in the first 3.5 s on an emulated phone with the
  CPU slowed 4× (and Lighthouse mobile with `--lighthouse`).
