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
| View Transition morphs (card ⇄ page, HUD Basecamp label ⇄ Basecamp H1) | yes | yes | no API call; the 150 ms route fade |
| Hover, focus, press responses | yes | yes | colour and opacity only, ≤ 200 ms |
| Title settles | yes | yes (cascade ≤ 240 ms) | rest state |
| Reveals, contour rules, map sheets | yes | yes; reveals fade without the rise | shown, never hidden |
| Glint | yes | no | no |
| Pointer shine (headlamp on type) | yes (mouse and pen) | no | no |
| Field: drift, line flow, headlamp, parallax, intro sweep | yes | no; the map holds still | poster |
| Field: terrain morph between routes | yes, with zoom push | yes, no zoom push or draw-on | poster |
| Card tilt, glare, touch shimmer, deal-in | yes | no | no |
| Loops (scroll cue, poster drift) | yes | no | no |
| Lenis smooth scroll | yes (fine pointer) | no | no |
| Haptics | on by default | off by default | off |

Precedence: still always wins. When the OS forces still, the switch shows "on" and its accessible
description says why. The switch is a native `<input type="checkbox" switch role="switch">` whose
visible label, "Calm map", is also its name (WCAG 2.5.3 Label in Name); its description reads
"Reduces motion on this site", plus the explanation when the OS forces still. The thumb shows the
state.

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
  `reveal 350`, `settle 420`, `route 600`, `settle-display 640`, `terrain 700`, `glint 900`, `draw 900`.
- **Easings** (`--ease-*`): `trail`, `summit`, `drop`, `scree` (content leaving the screen only; never
  ease in on UI), `settle` (0.16, 1, 0.3, 1), `glint` (0.45, 0, 0.55, 1).
- **Springs** (Motion, and `--spring-*` as `<duration> linear(…)` sampled from Motion's own spring):
  `press` {0.16 s, bounce 0}, `card` {0.35, 0.15}, `share` {0.42, 0.1}, `thumb` {0.2, 0.2}, `tilt`
  {stiffness 220, damping 26, mass 0.6}, `settle` {0.12, 0}. Use as `transition: transform
  var(--spring-press)`.
- **Staggers** (`--stagger-*`): `char` 14 ms (cascade ≤ 240), `word` 40 (≤ 320), `item` 50 (first 6
  items), `card` 70 (≤ 420). `staggerStep(stagger.char, n)` fits a cascade into its cap.
- **Distances** (`--dist-*`): `rise` 8 px, `rise-card` 12, `nudge` 4, `lift` −6, `tilt-max` 5°;
  `--scale-press` 0.97.
- **Axes** (`--axis-<role>-<state>-wdth|wght`): display rest 62/800, reveal 80/100, hover 70 (+8),
  press 700 weight, compact 72 (card names); label rest 100/600, reveal 110, hover 112/650, press 96;
  mono rest 87.5/500, reveal 112.5, hover 100, press 80. `--type-condensed-wdth` (88) and
  `--type-finding-wdth` (85) for condensed UI text.
- **Glint**: band 18% of the text, 100°, glacier at 55%, `--dur-glint`, dark surfaces only.
- **Headlamp**: radius 120 px (at least 1.2 em of lit type), Gaussian falloff k = 3, rise `micro`,
  fade 600 ms, type lit at most 50% towards glacier. Shared by the field and the type shine.
- **Haptics**: `press 6, open 8, commit 10, success [8,60,8], error [12,40,12], detent 4` ms, at most
  one pulse per 80 ms.
- **Layers** (`--layer-*`): backdrop 0, page 1, hud 30, overlay 40, skip-link 100.
- `legacy.tilt` keeps the cards' current tilt (14°, the old spring) until phase 4 moves them to
  `spring.tilt` and `distance.tiltMax`.

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
  its widest state: labels, buttons, nav).
- `role`: `display` (default for chars and words), `label` (default for block), `mono`.
- `trigger`: `paint` (CSS from first paint, before hydration), `inview`, `manual` (`ref.play()`).
- Plays once per element per session (`src/lib/settled.ts`; the pre-paint script renders settled
  elements at rest, so reloads and pages Next re-shows never replay).
- `settleOnArrival`: on a View Transition target it holds at the breath axes during the morph and
  settles after it lands.
- `glint`: one glint after the first settle this session (full only). `shine`: the headlamp lights the
  letters (full only, mouse and pen).
- Per-glyph properties are namespaced and registered without inheritance (`--kt-i`, `--kt-shine`).
- The accessible name is a visually hidden copy of the text; the letters are `aria-hidden`.

### Glint

`<Glint text="…" />` inside a positioned element, then `playGlint(element)`. An aria-hidden copy of
the text lies over the original with transparent letters; a band clipped to them moves by animating a
registered gradient position (`--glint-x`). Chosen because it works whatever colour the letters set
for themselves (rest colour, shine) and repaints one layer only. `surface="sheet"` draws a 1 px
moss-ink rule instead. Full mode only, one glint at a time.

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
- `nav`: the breath plus `current` (aria-current="page": glacier, a drawn rule).
- Keyboard focus gets exactly the hover motion; press narrows the weight; a commit (click, Enter,
  tap) plays the glint as navigation starts and a `commit` haptic. Hover only under `(hover: hover)`.
- Set the label's rest colour with `--l-rest-color` (e.g. in `labelClassName`).

### MotionButton

`<MotionButton label="Enable tilt" onClick={…} />`: the label breathes on hover and focus (box
reserved), press scales to 0.97 on the press spring, a `press` haptic.

### Reveal, ContourRule, MapSheet

Mark a block `data-reveal` (`""` rises 8 px and fades, `"card"` rises 12 px; in calm both only
fade), or use
`<ContourRule />` (a 1 px line that draws) and `<MapSheet fold="top|left">` (a light sheet that
unfolds with clip-path, its content fading in after). One controller (`reveal.ts`, mounted in the
root layout) runs them: anything in the first viewport is visible from first paint and never hidden
(so it can be the LCP element); below the fold, blocks wait and reveal once per session, at most two
groups at once within 600 ms, and snap to their end state while the page scrolls fast. Running text,
tables and numbers never move: a rising block that is or holds `.body-copy`, `.surface-copy` or a
table is shown at once, so mark labels, eyebrows, actions and panels without prose, not paragraphs.

### useMotionMode and haptic

`useMotionMode()` returns `{ mode, tier, calm, forcedStill, haptics, hapticsAvailable, setCalm,
setHaptics }`; `tier` is `desktop` (fine pointer, long edge ≥ 900 px), `mobile` or `low`
(`html[data-tier]`). `haptic(event)` vibrates on supporting Android browsers only, for direct user
actions (transient activation), at most once per 80 ms, never in still, in calm only when switched on.
The haptics switch (footer) is rendered only where vibration works (`html[data-haptics]`).

## Checks

- `npm test`: tokens ↔ CSS, tokens read by stylesheets exist, no new hard-coded motion values.
- `npm run test:e2e -- modes`: still has no transform, width or position animation, nothing over
  200 ms and no View Transition call; calm runs View Transitions with no ambient field frames and no
  glint; full keeps both.
- `npm run test:e2e -- hydration`: direct loads of every route without hydration or console errors,
  the motion attributes kept.
- `npm run test:e2e -- primitives`: layout shift per primitive (≤ 0.005) in each mode, focus parity
  of the signature link, no sticky hover after a tap.
- `npm run report:motion`: layout and style time in the first 3.5 s on an emulated phone with the
  CPU slowed 4× (and Lighthouse mobile with `--lighthouse`).
