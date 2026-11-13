# Feedback round 4

One session, on `main`. Contract changes: [Feedback round 4](../contracts.md#feedback-round-4)
(T1–T5). The plan is in `docs/backlog.md` (and below).

## Plan

The logo first (its slot is shared with Back), then Back, then the right side:

1. T1, the logo's hover: wider, parting and lifting.
2. T2, the F card's gradient: four from the cards' colours, one per load, a very calm flow.
3. T5, Back stays on screen on card pages; a richer hover.
4. T3, the switcher: the active language on a face-up chip that slides on a switch.
5. T4, the header's right side as one capsule (the tray).
6. Docs, the smoke check, build, verification, push `main`, deploy check.

## What shipped

- **T1** `src/components/logo.tsx` (`setFan`: `translate() rotate()` in both states, the front
  card 40 ms later), tokens `logo.hover` (±4°, 1.5 units apart, lift 0.5 / 1.5, 360 ms).
- **T2** `src/design/palette.ts` (`logoGradients`, `logoGradientNames`, `logoGradientCss()`),
  `src/app/layout.tsx` (injects it), `src/motion/preferences.ts` (the pick, never the last load's,
  `LOGO_GRADIENT_KEY`), `logo.tsx` (the `linearGradient`, the phase lock), `header.module.css`
  (the stops' `logo-flow` keyframes; still under reduced), tokens `logo.flow` (24 s → `--logo-flow`).
  Pairs: ember → saffron, saffron → grove, grove → tide, tide → ember (each card's glow and accent,
  then the next card's accent round the colour wheel). An earlier pairing (each card with its warm
  or cool neighbour) made ember and saffron look alike; the wheel keeps all four apart.
- **T5** `src/components/header.tsx` (Back's label: a visually hidden copy plus aria-hidden
  rolling letters), `header.module.css` (the counter-slide, the floating chip, the hover: arrow
  pull on `transform` so the morph's delayed `scale` / `opacity` never hold it, letter roll,
  chip, press), tokens `duration.chip`, `duration.backPull`, `stagger.letters`.
- **T3** `header.tsx` (the chip element, `--active`, `data-arrived` in a layout effect when a
  language switch mounts the header, the `locale-switcher` view-transition name),
  `header.module.css`, `src/styles/view-transitions.css` (the new name with the persistent chrome).
- **T4** `header.tsx` (About, a hairline, the switcher in `.end`), `header.module.css` (the tray).
- Docs: `contracts.md` (T1–T5; L6, R3, N1, the calm rule, Colour, tokens, data attributes,
  view-transition names, routes, the file map), `art-direction.md`, `README.md`, the schema's and
  two modules' comments ("DE · EN" is gone).
- `scripts/smoke.mjs`: a gradient per load, never the last one, flowing only in the full tier;
  Back stays in place, opaque and clickable while the header is away (the header's own
  visibility is now read on the tray, since Back never fades); the chip under the active
  language after every switch; "only the background moves at rest" allows the logo's stops.

## Verification

- `npm run build` (type check, content checks, both locales).
- `scripts/smoke.mjs` for `de` and `en`, full and reduced: all passed.
- Back through the header's slide (transitions paused at 0, 40, … 260 ms): the arrow's top stays at
  the same position to 0.01 px while the header goes from 0 to −64 px; `elementFromPoint` over it
  hits Back while the header is away.
- The language switch: the new header's chip slides 44 px from the language before into place
  inside the live `locale-switcher` group.
- Screenshots at 1440 × 900, 390 × 844 and 360 × 740 (the tray fits beside the logo at 360 px).
- `scripts/budget.mjs`: 185.0 KB gzip initial JS against 184.6 KB before this round (+0.4 KB;
  the advisory 170 KB was already exceeded, see the backlog).

## Notes

- The gradient is the one thing besides the field that moves at rest. It is CSS on three
  `<stop>`s (a style and a paint of a ~37 × 31 px area per frame); it stops under reduced motion,
  like the field's ambient motion.
- The tray's width follows About's label, so during a language switch its left edge cross-fades
  with the header over 240 ms; the switcher itself stays live and its chip slides.
