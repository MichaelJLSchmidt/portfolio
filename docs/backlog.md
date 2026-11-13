# Backlog

Follow-ups that are known and deliberately not done yet. Take one at a time.

## Feedback round 4: plan

Small header changes, one session, in this order (the logo first: its slot is shared with Back).
Contract: [Feedback round 4](contracts.md#feedback-round-4) (T1–T5). Report:
`docs/handoff/feedback-4.md`.

1. **T1, logo hover.** The fan opens wider (±4°, was ±1°), the cards part and lift (the front
   card more, a beat later), 360 ms `ease.move`; tokens in `logo.hover`.
2. **T2, the F card's gradient.** Four gradients from the four cards' colours (`logoGradients`
   in `palette.ts`); the pre-paint script picks one per page load, never the previous load's
   (localStorage); the three colours flow very slowly along the card (CSS on the gradient's
   stops, 24 s loop, phase-locked to the page clock so a remount does not jump); reduced: still.
3. **T5, Back.** On card pages Back stays on screen when the header leaves (it holds its place,
   counter to the header's slide; reduced: it does not fade) and gets a floating chip behind it;
   a richer hover: the arrow pulls back (head and stretching shaft), the letters roll one after
   another, a chip draws in behind; a press gives a little.
4. **T3, the switcher.** The active language sits on a filled chip (ink on text colour), the
   other is muted; switching slides the chip across (the switcher is a live view-transition
   group of its own, so the cross-fade does not double it); reduced: no slide.
5. **T4, the header's right side.** About, a hairline and the switcher share one capsule (the
   tray); the same chip language as Back's floating chip.
6. Docs (contracts, art direction, README), the smoke check (Back stays, the chip), build,
   verification at 1440 × 900 and 390 × 844 in both languages and tiers; push `main`; deploy check.

## Feedback round 3: plan

One session, in this order (the background first: every other check depends on it). Report:
`docs/handoff/feedback-3.md`.

1. **Item 4, chapter 05 flicker.** Drop `field.pinnedDetail` and `scenes/pin.ts`; the canvas
   resizes only from its ResizeObserver (device-pixel-content-box) and draws in the same callback;
   the deal cards get `will-change` once per mount; the header keeps one stable layer.
2. **Item 1, About morph.** A 768×528 region heightmap (lossless WebP, R/G heights, B lake mask
   rasterised from the SVG's lake path) built by `scripts/terrain/build-field.py` from the
   portfolio's 1536 master; the shader morphs noise into the terrain with fwidth lines that match
   the SVG (cover crop, 100 / 200 m by the shared media query, colours and alphas, lakes);
   full device resolution only while the morph runs, with a 0.75× guard; the SVG is an `<img>`
   that takes over with opacity only; the vignette is a static overlay; the drift animates
   `translate` from the handoff on. The mask-image reveal and `--contour-reveal` go.
3. **Item 2**, the pause button and everything only it used.
4. **Item 5**, reveal trigger 0.35 / −18%, tall blocks, the end of the page.
5. **Item 3**, the header logo's motion (deal-in, hover fan, the letters egg, logo ↔ Back).
6. **Item 6**, chapter numerals drawn from Bricolage's outlines (`scripts/build-numerals.mjs`).
7. **Item 7**, the two-lane career timeline.
8. **Item 8**, the master's thesis page (first draft).
9. **Item 9**, the idle note only where it fits; verification; push `main`; deploy check.

- **Card play on real devices.** In the CPU-only test container the view transition starts
  150–340 ms after the navigation (React renders the case page and waits for its hero image; the
  snapshots rasterise in software), and the 520–600 ms morphs run slower than their tokens. Check
  on a desktop and a mid-range phone (DevTools frame rendering stats, 60 fps, also at 4× CPU
  throttle) that V follows the navigation within a frame or two and that the field holds 60 fps
  through the ring and the bloom.
- **Nested view-transition groups.** Once Safari and Firefox ship `view-transition-group` (Chrome
  140+ has it), let the frame contain the band (`view-transition-group: contain` on the frame) so
  the band is clipped to the card's radius during the morph; today the band's group clips itself
  (`overflow: clip`) and the design does not depend on it.
- **Chapter 05 in German at 1440 × 900.** The German decision cards run about 15% longer (722 px
  against 629 px at 1440 px wide), so they would need a 0.66 scale under the pinned head; below
  `deal.pinned.minScale` (0.72) the chapter keeps its static row there (English pins at 0.76). Shorter
  German copy, or a compact card layout for the stage, would let it pin from 900 px too.
- **The returned card on top.** After Back the card lies on its neighbours (`data-returned`, as it
  arrived above the hand) until the pointer next moves over the hand, then it slides back under
  its right-hand neighbour. Check that this reads as intended, or settle it with a short delay.
- **Home intro timings.** Fine-tune the first-visit sequence (`at.firstLoad` in
  `src/motion/tokens.ts`): offsets, durations and the hand's deal. (The smoke check now reads each
  part's start from its animations' own timing, so tuning no longer upsets it; feedback round 2.)
- **Language detail.** German alternatives for the few kept English terms (Critique,
  Research-Share) if the persona prefers German; a per-locale Open Graph image. ("Design-System"
  is written with a hyphen since feedback round 2.)
- **Portrait.** About's hero shows an example photo (`about-portrait`, Unsplash); replace it with
  the real portrait (a 4:5 crop through `scripts/images`, alt text in both languages).
- **Timeline copy.** The timeline cards split each stop into title and place; the long Hyper
  Island description ("facilitation, team dynamics, digital experience design") was dropped for
  the card and belongs in the rewrite.

- **Thesis screenshots.** `/about/thesis` has three marked slots (`ImageSlot`, a `TODO(owner)` in
  `src/app/[locale]/about/thesis/page.tsx`): the knowledge base, the check-in, the round-2 source
  labels. Add the screenshots through `scripts/images/manifest.mjs` and swap each slot for an
  `OffsetImage`.
- **Thesis consent.** Publishing the internal survey figures and naming the employer needs the
  employer's consent; until then the page stays anonymous (both `content/<locale>/thesis.ts` say
  so).
- **About's morph on a real GPU.** Round 3 measured paint and raster tasks (none over 4 ms) in a
  container without a GPU, where the shader runs in software and frames drop; check the frame
  rate (DevTools frame rendering stats, 60 fps, also at 4× CPU throttle) on a desktop and a
  mid-range phone. The 0.75× guard is the lever if a phone struggles.
- **JS budget.** 180.9 KB gzip initial JS (advisory 170 KB, D7) after round 3; 184.6 KB after
  card play, 185.0 KB after round 4.

## Resolved

- **Card → detail transition**, card play (contracts P1–P8). The play is "the card hits the table":
  a clone flies to the table's centre, lands with an accelerating drop, a hold, the contact shadow
  and the field's ring, then a three-part container transform (frame, band, title) becomes the
  page; return, switch, browser back / forward, a slow network and offline follow it. The mobile
  rail plays a card in one tap (the bottom sheet is gone); Chapter 05's head rides in the pinned
  deal stage.

- **Flicker in chapter 05 (team-of-teams deal scene)**, feedback round 3, item 4. *Cause:* when
  the decision row pinned or unpinned, the field engine switched the canvas to half resolution
  (`field.pinnedDetail`) and resized it from the pin callback. Resizing a WebGL canvas clears its
  drawing buffer, and the next draw came a frame later, so one blank frame showed at each pin
  boundary. At the same moment the deal scene toggled `will-change: transform` on the four cards,
  which promoted and demoted their layers and re-rasterised them mid-scroll (a full-page paint
  flash). *Fix:* `field.pinnedDetail` and `src/motion/scenes/pin.ts` are gone; the canvas is sized
  only by its ResizeObserver (`device-pixel-content-box` where supported), which draws in the same
  callback before paint; a size change inside the loop (About's morph) is applied at the start of
  an animation frame and drawn in that frame. The field container is `100lvh`, and a height-only
  change under 120 px is ignored (`field.ignoreHeight`), so mobile toolbars never resize it. The
  deal cards get `will-change: transform` once when the scene mounts and lose it on unmount. The
  sticky stage has no transformed ancestor and nothing uses `backdrop-filter`; the header keeps
  one stable layer (`will-change: translate`) for hiding and showing.
- **Idle note on short phones**, feedback round 3, item 9a. The note (fixed above the fan) overlapped
  the last "What I bring" item on short phones. It now measures itself once the handwriting has
  loaded (and on every resize while it shows): it appears only when its top sits at least
  `idle.clearance` (24 px) below the last item, otherwise it is skipped, unseen (the session flag is
  set only when it appears). Measured: 390 × 800 −44 px, 360 × 740 −92 px, 390 × 844 0 px (all
  skipped), 430 × 932 101 px and 1440 × 900 170 px (shown).

