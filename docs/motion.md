# Calm Survey: art direction and motion

The site reads as a survey map sheet on a dark desk. The contours are always there and slightly
alive; every interaction maps to a cartographic action (lines tightening on a slope, a plate
stepping up one contour level, terrain rising through a contour). Fewer effects, one signature
effect: the relief fill on the footer wordmark and the gate mark.

The direction in one list:

- **One background, everywhere**: the "living survey", real swisstopo contours in stone grey
  (`docs/terrain.md`). It drifts and breathes too slowly to watch and bends a few pixels under a
  fine pointer.
- **One signature effect**: the relief fill (below). Nothing else fills, floods or glints.
- **Links are underlined at rest**; on hover and focus a second line draws in beside the first,
  like contours crowding on a slope.
- **Cards are calm map sheets**: 5:7, a 1 px frame, a contour plate. On hover the plate steps up one
  contour level, and the same plate travels into the case study's header.
- **Case studies alternate** the dark ground and light sheet bands, with layout breakers (a metric
  band, an image pair, a pinned decision, a map frame).
- **No red anywhere**, no cursor followers, no sound, no count-ups, no altitude or scroll readouts.
- **Mint (glacier) is rare**: focus rings, About's current-page underline, one index line per
  plate, the contents trail's marker and the relief fill's isolines.

## Rules

- At most two regions animate at once (the field counts as one; a page change is one).
- Ambient motion: lines move at most 2 px/s, the pointer bends them at most 6 px, and no ambient
  loop is shorter than 12 s.
- Durations: UI feedback at most 320 ms, entrances at most 600 ms, transitions at most 1000 ms. The
  exceptions are the terrain crossfade (1600 ms) and the title's weight arrival (900 ms).
- Three tiers on `html[data-motion]`: Full (`full`), Calm (`calm`: durations ×0.7, no stagger, no
  pointer effects but links) and Off (`still`). The OS setting for reduced motion always wins and
  forces Off; the footer's Motion control ("Motion: Full · Calm · Off", `summit:motion` in
  localStorage) chooses otherwise. Off pauses the background (the pause for WCAG 2.2.2) and
  disables haptics.
- Animate transform and opacity (and a font's weight axis for titles); never layout.
- Every effect has a Calm and an Off twin. Off keeps 160 ms opacity crossfades at most.
- Text in the first viewport is there from the first paint; only content scrolled to rises.

`npm run test:e2e -- calm` holds the rules: Off moves nothing (identical screenshots 2 s apart),
a pointer resting for 10 s moves only the field, at most two regions animate at once through load,
scroll and a page change, Calm runs at 0.7.

## Tokens

Everything comes from `src/styles/tokens.ts`, exposed to CSS as custom properties
(`tokensToCss`). Components never write their own colour, duration, easing or size;
`src/styles/tokens.test.ts` fails a stylesheet that does.

| Group | Tokens |
| --- | --- |
| Colour | `ground` #1B1C18, `groundRaised` #22231F, `sheet` #DDE3E3, `ink` #1B1C18, `ink2` #4A4B43, `text` #E8EBE4, `text2` #A3A69C, `text3` #868980 (ground only), `line` #4A4C45, `lineIndex` #5E6159, `lineOnSheet` #9FA7A7, `fieldLine` #8A8C80 (shader, plates, posters), `glacier` #C8F5B0 |
| Type | Archivo (wdth 100) and Martian Mono; roles `display`, `h1`, `h2`, `h3`, `metric`, `pull`, `body`, `mono` with their clamps, weights, tracking and line heights; `text-wrap: balance` for headings, `pretty` for text |
| Grid | 12 columns ≥ 1280 px (margin clamp(32px, 4vw, 64px), gutter 24), 8 columns from 768 (32, 20), 4 below (16 + safe area, 16); max width 1440; sections clamp(96px, 10vw, 192px); a 4 px scale |
| Shape | radii 0 and 6; strokes 1, 1.5 and 2 |
| Duration | `press` 120, `fast` 200, `base` 320, `enter` 480, `level` 600, `morph` 680, `title` 900, `terrain` 1600, `leave` 160, `crossfade` 240, `still` 160, `draw` 1200 |
| Route | `pageOut` 180, `pageInAt` 120, `titleAt` 360, `titleFade` 280, `partsAt` 560, `morphPhone` 560, `leavePhone` 120, `morphCalm` 480 (`--route-*`) |
| Easing | `out`, `in`, `inOut`, `standard`, `decelerate`; no bounce anywhere |
| Distance | `rise` 12, `arrive` 16, `lift` −6, `arrowStep` 3, `headerSolid` 80 |
| Relief | `fillMs` 1200, `halfLifeMs` 450, `focusMs` 600, `pressMs` 120, `sweepMs` 900, `lerp` 0.09, `lerpFast` 0.15 |
| Breakpoints | 768 and 1280 (every width query uses one of them) |

`npm run check:contrast` holds the pairs to WCAG AA: text, text-2 and text-3 on the ground; text and
text-2 on the raised ground (never text-3 there); ink and ink-2 on the sheet; focus rings at 3:1.
Over the field, secondary text sits in a quiet zone (6:1); over the static poster a feathered ground
wash behind the same zones leaves the lines at the same 25 %.

## Primitives

| Primitive | Full | Calm | Off |
| --- | --- | --- | --- |
| **Title** (`type/Title.tsx`) | each word from wght 200 to its role's weight over 900 ms, 60 ms apart (four steps at most); a hidden copy at the final weight holds the width, so nothing moves | 600 ms, together | the final weight |
| **Link** (global `a`) | rest: a 1 px underline at 55 %; hover and focus: full colour and a second 1 px line at 50 % draws in left to right over 320 ms; press: the second line closes in; a CTA's arrow steps 3 px | same | no transition |
| **Survey button** (`ui/SurveyButton.tsx`) | a 1 px text-3 frame, 48 px (44 on phones), mono label and arrow; hover: frame to text, arrow 3 px up-right (200 ms); press: 0.985 for 120 ms; 8 ms haptic on primary presses | same | no movement |
| **Header** (`header/Header.tsx`) | transparent at the top; after 80 px the ground at 85 % with an 8 px blur (200 ms colour); stays still through page changes | same | at once |
| **Map-sheet card** (`card/MapSheetCard.tsx`) | fine pointer: lift 6 px (320 ms), frame to text-3, the level plate crossfades in (600 ms); focus: the same and the mint ring; press 0.985 | frame colour only | frame colour only |
| **Reveal** (`motion/reveal.ts`) | below the fold: opacity and a 12 px rise over 480 ms once at 15 % in view, 60 ms apart in a group; never on sheet bands | ×0.7, together | shown |
| **Career line** (`about/CareerProfile.tsx`) | drawn once over 1200 ms in-out as it comes into view | same | drawn |
| **Pinned decision** (`case-study/PinnedDecision.tsx`) | the sticky figure swaps with a 320 ms fade | same | at once |
| **Image pair** (`case-study/ImagePair.tsx`) | desktop: a scroll-driven drift of at most 24 px | none | none |
| **Contents trail** (`case-study/ContentsTrail.tsx`) | the rail fades aside over bands and breakers (200 ms) | same | at once |

The motion lab (`/lab/`, preview builds) shows every primitive in the three tiers side by side.

## The background

`docs/terrain.md` has the field in full: lines at 28 % (index 42 %), drift (Lissajous, 120 s and
150 s, at most 1.9 px/s), a 24 s breath of ±0.15 of an interval, a pointer bump (fine pointers, at
most 6 px, a bounce-free spring that rests at 40 %), frames on demand (about 30 a second at rest,
none hidden, off-screen, behind a dialog or in Off), and a page change's dim (to 60 % over 400 ms)
and crossfade (to 1600 ms).

## The relief fill

`src/components/relief/` (opt in a title by id in `src/content/relief.ts`; today the footer
wordmark and the gate mark). The core (`relief-core.ts`) has no imports, so the gate inlines it.

- **Rest**: the brand as live HTML text (a longer word wraps), a 1 px text-3 outline from an SVG
  morphology filter, and a construction layer: baseline, x-height and cap-height guides
  overshooting by 24 px at half opacity, 6 px corner ticks, 8 px crosshairs at glyph centres and
  the survey mark's coordinates in mono.
- **Fine pointer (Full)**: an elevation field at a quarter of the CSS resolution under a lens
  lerped at 0.09 a frame plus a faster (0.15), slightly larger, weak stamp; a resting pointer fills
  a glyph in about 1.2 s; on leave the field decays (half-life 450 ms). WebGL2 composites it with
  the glyph mask: the sheet colour above the threshold, three mint isolines and a faint grey band
  below it. The loop stops when nothing shows.
- **Keyboard focus**: every glyph fills from its centre within 600 ms, plus the 2 px mint ring.
  **Press**: the whole word in 120 ms. **Touch**: one survey pass left to right over 900 ms once
  60 % is in view; it stays.
- **Calm**: a 320 ms crossfade from outline to fill with one mint isoline ring. **Off**: filled,
  still, with the construction layer. **No WebGL2**: a CSS radial mask with an animated radius.

## Page changes

React `<ViewTransition>` (`src/styles/transitions.css`, `PageTransition.tsx`).
`html[data-route-kind]` says what started the change (`RouteMotion.tsx`): `open` (a card or the
next case study's mini card), `back` ("Back to case studies"), `page` (any other link),
`traverse` (browser back or forward) or `ua` (the browser animated the swipe itself). Base
animations never depend on it; it only refines.

| Change | Timeline |
| --- | --- |
| Card → case study (Full, desktop) | 0–160 ms the old page fades out, no movement; 0–680 ms the card's art (`card-art-<slug>`, share "art") morphs into the header plate, in-out, both 4:3 with `object-fit: cover`; 0–400 ms the field dims to 60 %, 400–1600 ms it crossfades to the summit; from 360 ms the title block and H1 fade in (280 ms) and the H1 arrives on its weight; 560–1000 ms the meta line, the summit line and the summary rise 16 px, 60 ms apart |
| Phones | morph 560 ms, the old page 120 ms, the parts as one block (a fade) |
| Calm | morph 480 ms, no stagger |
| Off | a 160 ms crossfade, no morph |
| Next case study | the mini card's art morphs into the next header plate on the same timeline; the page opens at the top |
| Other pages | the old page fades out over 180 ms; the new one rises 12 px over 320 ms from 120 ms; the header stays |
| Back (in-app link) | a 240 ms crossfade; the art morphs back when its card is in the restored view |
| Browser back/forward | React runs no view transition for a traversal: the arriving page fades in over 240 ms |
| iOS edge swipe | nothing of ours (`hasUAVisualTransition`) |
| No view transitions | the page changes at once; the field's crossfade still runs |

The header has its own name and never animates. Groups are stacked explicitly (art over pages,
the title block over the art, its lines over the block, the header on top). React keeps the root
live under the overlay when only boundaries change, so the field goes on drawing. Each page's
scroll position is kept in sessionStorage and restored before paint on back and traverse. After
every page change focus moves to the new page's H1 (or the hash's target).

## Accessibility and haptics

- Semantic HTML first, readable without JavaScript, keyboard operable, WCAG 2.2 AA
  (`npm run test:e2e -- axe` in Full, Calm, Off, on a phone and with forced colours).
- Links are underlined at rest; focus is always a 2 px mint ring (ink on the sheet) and is never
  hidden by the sticky header (`scroll-padding-top`).
- Haptics: 8 ms on primary presses where `navigator.vibrate` exists, never in Off.
- Nothing follows the pointer but the field's bump and the relief fill
  (`src/lib/pointer.test.ts`; the lightbox's drag is the one exception, attached on press).

## Checks

- `npm test`: tokens (values, CSS, no hard-coded motion values, breakpoints), no red anywhere, no
  pointer followers, the field's limits, the case-study model and its layout mapping.
- `npm run test:e2e -- transitions | calm | wordmark | terrain | arrival | reading | access | ...`
  (the list is in `scripts/e2e.mjs`).
- `npm run check:contrast`, `npm run check:legibility` (text against what is really behind it),
  `npm run check:name` (names of 8, 18 and 32 characters, brands of 2, 4 and 10).
