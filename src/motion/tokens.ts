import { breakpoints } from '@/design/layout'
import { type as typeScale } from '@/design/type'

/*
 * Motion tokens: the only source of easings, springs, durations, staggers,
 * distances, angles, weights and background-field parameters. JavaScript
 * imports them directly; CSS reads the custom properties that `motionCss()`
 * generates (injected in the root layout). No bounce, elastic or overshoot:
 * every bézier stays within [0, 1] and every spring is critically damped.
 * Contract: docs/contracts.md#motion-tokens. Foundation-owned; the reveal,
 * deal and discard values below were moved in from the Motion
 * session's choreography at integration.
 *
 * The scale (use these for new work):
 *   dur      xs 160, s 240, m 420, l 640, xl 900 ms        --dur-xs ... --dur-xl
 *   ease     outExpo, outQuint, inOut                       --ease-out-expo, --ease-out-quint, --ease-in-out
 *   stagger  words 70, lines 60, items 50, cards 80, svgGroups 120 ms
 *                                                           --stagger-words ... --stagger-svg-groups
 *   tiers    full x1; reduced (prefers-reduced-motion): 160 ms crossfades only
 *                                                           --motion-scale, --dur-reduced
 * Everything below the scale (duration.*, ease.outSoft, ...) is the table's
 * vocabulary (hand, play, field, eggs) plus the reveal choreography's fixed
 * values (reveal, deal, discard). Nothing here is unreferenced.
 */

export type MotionTier = 'full' | 'reduced'

/** The duration scale, in seconds (CSS: --dur-xs ... --dur-xl, tier-scaled). */
export const dur = { xs: 0.16, s: 0.24, m: 0.42, l: 0.64, xl: 0.9 } as const
export type DurationStep = keyof typeof dur

/** Tier multipliers for the scale. Reduced replaces every duration with one 160 ms crossfade. */
export const motionScale = { full: 1, reduced: 0 } as const satisfies Record<MotionTier, number>
export const reducedCrossfade = 0.16

/** A scale duration (s) for a tier: full as is, reduced always 160 ms. */
export function durFor(tier: MotionTier, step: DurationStep) {
  return tier === 'reduced' ? reducedCrossfade : dur[step]
}

const outExpo = [0.16, 1, 0.3, 1] as const
const outQuint = [0.22, 1, 0.36, 1] as const
const inOut = [0.65, 0, 0.35, 1] as const
/** A plain ease-out (the card's press, text links). */
const outCubic = [0.33, 1, 0.68, 1] as const

/** Cubic béziers. The first three are the scale; the rest are the table's named curves. */
export const ease = {
  outExpo,
  outQuint,
  inOut,
  // Table vocabulary (aliases of the scale where they are the same curve).
  outSoft: outQuint,
  draw: outExpo,
  bloom: inOut,
  /** Content leaving the screen: a plain ease-in. */
  in: [0.4, 0, 1, 1],
  // The header logo's curves (the logo lab's): a card arriving, moving, leaving.
  enter: [0.05, 0.7, 0.1, 1],
  move: [0.2, 0, 0, 1],
  exit: [0.3, 0, 0.8, 0.15],
  /** Text links (globals.css .link): the marker's morph and the triangle's fade, a plain ease-out that settles. */
  link: outCubic,
} as const

/**
 * Springs (Motion options), critically damped (damping >= 2·sqrt(stiffness·mass)),
 * so they never overshoot. CSS gets them as linear() curves, see springCss().
 */
/**
 * A critically damped spring (bounce 0) from Motion's `visualDuration`, with the stiffness and
 * damping Motion itself derives for it: stiffness = (2π / (1.2 × visualDuration))², damping =
 * 2 × √stiffness, mass 1. Used where a spring is specified by how long it looks, not by physics.
 */
function visualSpring(visualDuration: number) {
  const root = (2 * Math.PI) / (visualDuration * 1.2)
  const stiffness = root * root
  return { type: 'spring', stiffness, damping: 2 * Math.sqrt(stiffness), mass: 1 } as const
}

export const spring = {
  /** The workshop draw's card turn (the egg); the card play itself runs on cardPlay below. */
  play: { type: 'spring', stiffness: 220, damping: 29, mass: 0.9 },
  hover: { type: 'spring', stiffness: 400, damping: 40, mass: 1 },
  land: { type: 'spring', stiffness: 300, damping: 35, mass: 1 },
  /** The hand's siblings closing the played card's gap and opening it again (bounce 0, looks 280 ms). */
  gap: visualSpring(0.28),
} as const

/** Seconds. */
export const duration = {
  /** Plain page changes (About, the 404 page's link home, the footer): the old page fades, then the new. */
  navFade: 0.2,
  // Background field
  bloom: 0.8,
  unbloom: 0.8,
  toInk: 1,
  crossfade: 0.8,
  hoverIn: 0.7,
  hoverOut: 1.1,
  hoverIntent: 0.08,
  breath: 9,
  fieldIn: 1.2,
  /**
   * About: the gradient's pools contract and fade into the contour field's ground while the
   * shader's contour lines rise from a noise relief onto the region's heights (and back on leaving).
   */
  topo: 1.6,
  /**
   * About: the SVG layer's crossfade over the shader's last frame (the last part of `topo`
   * entering; before the shader runs back, leaving).
   */
  contourHandoff: 0.3,
  // Reveals (the rest use the scale, dur.*)
  /** Digits: one value's strips, from the first strip's start to the last strip's end. */
  digits: 0.7,
  /** SVG strokes (draw kind). */
  svgDraw: 1.2,
  /** New hand: each card flies off to the dealer. */
  gather: 0.44,
  // UI
  /** The next project card's title underline (detail.css). */
  underline: 0.16,
  /**
   * Text links (globals.css .link): hovering in, the marker block slides left and down and
   * collapses into the underline (`linkIn`) while the triangle fades in (`linkMarkIn`); hovering
   * out runs the reverse, faster (`linkOut`, `linkMarkOut`). ease.link. Reduced: instant.
   */
  linkIn: 0.24,
  linkOut: 0.16,
  linkMarkIn: 0.16,
  linkMarkOut: 0.1,
  /** Header home slot: Back's arrow and label appearing, and the beat before the head and label. */
  slotMorph: 0.42,
  slotLag: 0.12,
  /** The logo's cards leave before Back appears (logo.exit), and Back fades before they return. */
  logoExit: 0.3,
  logoBackFade: 0.16,
  /**
   * The header's chips: the language chip sliding in from the language before on a switch, and
   * Back's chip drawing in on hover (or coming up while the header is away).
   */
  chip: 0.36,
  /** Back's hover: the arrow pulling back and each letter's roll (stagger.letters apart). */
  backPull: 0.42,
  /** The header (and the mobile rail with it) leaving on a scroll down (ease.in) and returning (outQuint). */
  headerHide: 0.2,
  headerShow: 0.24,
  discard: 0.7,
  glint: 1.2,
  longPress: 0.8,
  inspectHold: 0.4,
  fast: 0.18,
} as const

/** Seconds between siblings. words / lines / items / cards / svgGroups are the scale. */
export const stagger = {
  words: 0.07,
  lines: 0.06,
  items: 0.05,
  cards: 0.08,
  svgGroups: 0.12,
  /** New hand: between cards flying off to the dealer. */
  gather: 0.06,
  /** Digits: between the strips of one Scoreboard value. */
  digits: 0.04,
  /** Chapter numerals: between the contours as they draw (the left digit's first). */
  contours: 0.06,
  /** Back's letters rolling on hover. */
  letters: 0.025,
} as const

/** Seconds from the start of a sequence. */
export const at = {
  /**
   * Home, first visit (<FirstLoadSequence>, src/motion/first-load.ts): when each part starts and
   * how long it takes, in order. Steps 1-5 take about 1.25 s together, the hand the last 0.75 s;
   * the chrome (header) follows the hand. Reduced: all at once, 160 ms crossfades. Revisits in the
   * same session stay a short crossfade.
   */
  firstLoad: {
    /** 1. The name: its words turn up and settle (opsz / wght), stagger.words apart. */
    title: { at: 0, dur: 0.6 },
    /** 2. The label above the name. */
    label: { at: 0.25, dur: 0.35 },
    /** 3. The role line, then the intro: lines rise stagger.lines apart, all in by `end`. */
    copy: { at: 0.45, end: 0.95 },
    /** 4. The divider, drawn left to right like a link underline (ease.outSoft). */
    divider: { at: 0.85, dur: 0.3 },
    /** 5. "What I bring to the table", its items, then the hint, top to bottom. */
    items: { at: 1.0, dur: 0.25, stagger: 0.08 },
    /** 6. The hand: the four cards dealt one after the other. */
    cards: { at: 1.25, dur: 0.33, stagger: 0.14 },
  },
} as const

/**
 * The idle hint (home, once per session): after `after` seconds without a click, tap or key press
 * a handwritten note writes itself (a left-to-right reveal, `write` s), then its arrow draws
 * (`arrow` s, after `gap`). The next click, tap or key press fades it out (`fade`). Reduced: one
 * 160 ms fade in and out.
 */
export const idle = {
  after: 10,
  write: 1.2,
  gap: 0.08,
  arrow: 0.7,
  /** Share of the arrow's time for its curl; the head draws in the rest. */
  arrowCurl: 0.8,
  fade: 0.32,
  /** The note shows only with at least this much room (px) between it and the last "What I bring" item. */
  clearance: 24,
} as const

/**
 * The header on scrolling pages (src/motion/header-scroll.ts): it leaves after a deliberate scroll
 * down and returns after a deliberate scroll up, "deliberate" meaning more than `threshold` px in
 * one direction (overscroll bounce and scroll changes during a view transition never count).
 */
export const header = { threshold: 8 } as const

/**
 * The header logo (src/components/logo.tsx), ported from the logo lab's concept 3 motion: the two
 * card groups animate transform and opacity only. Seconds, degrees, and the logo's SVG user units
 * (about 1 CSS px). Only user input moves it at rest (hover, focus, the letters egg).
 *   deal    part of the home intro, once a session: the back card, then the front one `front` s
 *           later, `dur` s each (ease.enter), from a small offset and turn, opaque at `opaque` of
 *           the way; returning from Back the front card follows `returnFront` s later
 *   hover   hover and focus-visible: the fan opens by `deg` either way, the cards part by
 *           `spread` units and lift (the front card more, `front` s later), `dur` s (ease.move);
 *           closing, both together
 *   turn    the letters egg: each card turns (scaleX 1 -> 0 -> 1, ease.exit then ease.enter), the
 *           M and F cut-outs showing from the moment it is edge-on; it turns back after `hold` s;
 *           touch: a `longPress` s hold
 *   exit    to Back: the cards close up (`close` units) and sink (`sink`) as they fade
 *   flow    the front card's gradient (one of palette.ts logoGradients per page load): its three
 *           colours travel along the card, one loop every `dur` s, linear (CSS --logo-flow);
 *           phase-locked to the page clock; reduced: still
 */
export const logo = {
  deal: {
    dur: 0.4,
    front: 0.12,
    returnFront: 0.08,
    opaque: 0.45,
    from: { back: { x: -4, y: 10, deg: -10 }, front: { x: 4, y: 10, deg: 10 } },
  },
  hover: { dur: 0.36, deg: 4, spread: 1.5, lift: { back: 0.5, front: 1.5 }, front: 0.04 },
  flow: { dur: 24 },
  turn: { dur: 0.6, front: 0.12, hold: 1.6 },
  exit: { dur: duration.logoExit, sink: 3, close: 6 },
  longPress: 0.5,
} as const

/** Pixels unless noted. */
export const distance = {
  reveal: 4,
  /** block reveal: rise. */
  block: 12,
  /** list reveal: items dealt in from the left. */
  list: 12,
  hoverLift: 28,
  spread: 12,
} as const

/** Degrees. */
export const angle = {
  hand: [-9, -3, 3, 9],
  /** Home title words turn up from this angle (rotateX). */
  word: -35,
  /** 404: the discarded card's resting tilt (--angle-discard). */
  discard: -12,
  tap: 90,
} as const

/**
 * Font weights and optical sizes (Bricolage display, Hanken text). Animated
 * headlines settle on the type scale (src/design/type.ts): h1 on display, h2 on h2.
 */
export const weight = {
  body: 400,
  label: 600,
  card: 620,
  h1Start: 280,
  h1: typeScale.display.weight,
  h2Start: 360,
  h2: typeScale.h2.weight,
  h3: typeScale.h3.weight,
} as const

export const opsz = {
  start: 24,
  end: typeScale.display.opsz,
  h2: typeScale.h2.opsz,
  h3: typeScale.h3.opsz,
} as const

/** Background field. */
export const field = {
  breathScale: 0.06,
  breathLum: 0.04,
  intensityRest: 0.35,
  intensityHover: 0.55,
  intensityPage: 0.45,
  breaker: 0.1,
  grain: 0.02,
  renderScale: 0.5,
  fps: 30,
  maxFrameMs: 24,
  frameWindow: 60,
  switchDip: 0.06,
  /**
   * About's contour layer (the old password page's SVG): it drifts very slowly, `translate` only
   * (compositor), `x` / `y` px either way on one `period` s loop from the identity offset
   * (ease.inOut, alternating), starting once the shader has handed over; the layer is scaled by
   * `scale` (static) so no edge shows. Full tier; still under reduced motion and while the tab is
   * hidden (contour-layer.ts).
   */
  contourDrift: { x: 8, y: 5, scale: 1.03, period: 120 },
  /**
   * About's morph renders at the device's resolution, capped at `dprMax`, only while it runs (the
   * resting field stays at renderScale). When the median of the first `guardFrames` frame
   * intervals is above `guardMs`, the rest of that morph renders at `slowScale` of it.
   */
  morph: { dprMax: 2, slowScale: 0.75, guardFrames: 10, guardMs: 20 },
  /**
   * While a card is played (its ring, the bloom, the waiting breath) the field draws every frame,
   * and nothing renders above `dprMax` (About's morph, if one runs at the same time, included), so
   * a mid-range phone holds 60 fps.
   */
  play: { dprMax: 1.5 },
  /**
   * Pool drift (full tier, on top of the breath): a slow Lissajous offset of each pool's centre,
   * `poolDrift` of the viewport, one pair of loop lengths (s) per pool, all of them >= 90 s.
   */
  poolDrift: 0.025,
  poolDriftPeriods: [
    [97, 131],
    [113, 151],
    [127, 103],
  ],
  /**
   * Height-only changes of the canvas box smaller than this (CSS px) are ignored: a mobile toolbar
   * showing or hiding where 100lvh is not supported. The canvas never resizes on scroll.
   */
  ignoreHeight: 120,
} as const

/** Reveals: trigger (Motion inView, src/motion/reveal-trigger.ts) and the kinds' fixed geometry. */
export const reveal = {
  /** Share of a block inside the (shortened) viewport before it reveals. */
  amount: 0.35,
  /** The viewport's bottom 18% does not count: reveals start a little after a block appears. */
  margin: '0px 0px -18% 0px',
  /** A block taller than the viewport: amount = min(amount, tallAmount × innerHeight / its height). */
  tallAmount: 0.45,
  /** Scrolled to within this many px of the page's end: every waiting block reveals. */
  endSlack: 4,
  /** The field's lift while a full-bleed breaker is in view (not a reveal; unchanged). */
  breakerAmount: 0.25,
  /** lines and title words rise from this share of their own height below the mask (110%). */
  mask: 1.1,
  /** image: clip inset at the start (share of the box) and the inner image's start scale. */
  image: { inset: 0.1, scale: 1.12 },
  /** digits: cells a strip rolls through before it lands (blank first). */
  digitRoll: 5,
  /** Below 1024 px: reveal jobs that may run at once (the rest queue). */
  mobileJobs: 8,
  /** Case hero image drift (full tier, CSS --hero-drift): translateY of its own height while it exits. */
  heroDrift: 0.06,
} as const

/** The deal: the pinned decisions scene (stage, phases, tilt) and dealing hand cards from off screen. */
export const deal = {
  /** Pinned stage height (svh): short, so all four cards land soon. */
  stage: 180,
  /** Scroll progress where each phase ends: four cards, then the settle. */
  phases: [0.2, 0.4, 0.6, 0.8, 1],
  /** A dealt card lands with this share of its hand-fan angle (removed in the settle). */
  landTilt: 0.25,
  /** Card flip perspective (px; every card that turns over, incl. the workshop draw), toss angle (deg)
   *  and how far below the screen the dealer sits (card heights). */
  flipPerspective: 800,
  toss: 28,
  below: 0.6,
  /**
   * About's timeline (the `deal` reveal, mode "deck"): the cards are dealt in order from a deck at
   * the start of the year axis, `stagger` s apart, on the `land` spring (linear()): each from at
   * most `reach` px toward the deck, turned `tilt` degrees, opaque after `appear` of its way.
   */
  deck: { stagger: 0.07, reach: 240, tilt: -4, appear: 0.3 },
  /**
   * About's "How I work" from 1024 px (mode "fan"): each card rises `rise` px into a slight fan
   * (`tilt` of its hand-fan angle, angle.hand) over `dur` s, `stagger` s apart, then the row
   * settles straight together over `settle` s (inOut).
   */
  fan: { dur: 0.42, stagger: 0.08, rise: 32, tilt: 0.5, settle: 0.42 },
  /**
   * Chapter 05 (desktop): the chapter head (label, numeral, h2) rides in the sticky stage above the
   * dealt cards, and only from `minPinnedHeight` px of viewport height. The arithmetic: the header
   * (64) + the head row (`pinned.head`, 200: the numeral's 192 px line box with the h2 beside it)
   * + the padding (3 × `pinned.pad`, about 40) + the hand's reserve under the cards (120) + a cards
   * row of at least about 300 px + a 40 px safety margin = 764 ≈ 760. Below it the cards lie in a
   * static row under the title and nothing pins.
   */
  minPinnedHeight: 760,
  /**
   * The pinned stage's rows: the head row is `head` px; the canvas row gets the viewport under the
   * header less the head row, the padding and the hand's reserve, measured once on mount and again
   * only when the width changes (`debounce` s), never from the head or the scroll. Cards taller
   * than the canvas are scaled to fit it; a fit below `minScale` keeps the static row instead (the
   * cards' text would be too small to read: at 0.72 the body is about 14 px).
   */
  pinned: { head: 200, pad: 12, minScale: 0.72, debounce: 0.15 },
} as const

/** A cubic bézier as four numbers (x1, y1, x2, y2), all within [0, 1]: no overshoot. */
type Curve = readonly [number, number, number, number]
/** A part of a sequence: starts `at` s after its anchor and runs `dur` s. */
type Span = { readonly at: number; readonly dur: number }

/** Into contact: accelerating, so the card meets the table at speed (no rebound follows). */
const intoContact: Curve = [0.55, 0, 0.85, 0.35]
const morphCurve: Curve = [0.3, 0, 0, 1]
const flyBack: Curve = [0.5, 0, 0.1, 1]

/**
 * Playing a card: "the card hits the table" (src/motion/play.ts, src/components/hand/table-card.tsx,
 * src/styles/view-transitions.css). Seconds, px and unitless scales; `play` holds the desktop values
 * (from 1024 px), `mobilePlay` the phone and tablet ones. Stage 1 runs on a fixed clone of the card
 * face laid out at the table size and FLIP-inverted from its slot, so its transform is identity
 * when it lands and the view-transition snapshot is rasterised at full size:
 *
 *   desktop  0 press · 90 lift · 200 flight (rise, then drop) · 500 contact · 560 navigate
 *   mobile   0 press · 80 flight (rise, then drop) · 400 contact · 450 navigate (no lift: the rail
 *            and the phone fan sit at the screen's edge, the card leaves them in one movement)
 *
 * Stage 2 (V = the view transition's start) is a three-part container transform: the card's frame
 * grows to the full-screen .play-frame and dissolves, its band becomes the hero image, its title
 * the h1. Every curve stays within [0, 1]; the impact is acceleration into contact, a hold, the
 * contact shadow and the field's ring, never a bounce.
 */
const play = {
  /** Pointer down / key: the card gives a little under the finger. */
  press: { dur: 0.09, ease: outCubic, scale: 0.97 },
  /** Haptics (ms), only where navigator.vibrate exists: the press, and the card meeting the table. */
  haptic: { press: 8, impact: 12 },
  /** Out of the hand: 16 px up and 4% larger than in its slot (desktop only). */
  lift: { dur: 0.11, ease: ease.outQuint, y: -16, scale: 1.04 },
  /**
   * To the centre of the table. x and y run on separate curves: y leads (it rises early), x
   * catches up, which draws the arc. Rotation and the fan's tilt settle to 0 on `rotate`;
   * `rotateFrom` is added to the slot's own rotation at the start (degrees).
   */
  flight: {
    dur: 0.3,
    x: [0.45, 0, 0.25, 1] as Curve,
    y: [0.2, 0.6, 0.35, 1] as Curve,
    rotate: [0.3, 0, 0.2, 1] as Curve,
    rotateFrom: 0,
  },
  /** The first part of the flight's scale: up to `scale` of the table size, as if lifted toward the eye. */
  rise: { dur: 0.18, ease: ease.outQuint, scale: 1.06 },
  /** The rest of the flight: down to the table size, accelerating, so it reaches contact at speed. */
  drop: { dur: 0.12, ease: intoContact, scale: 1 },
  /**
   * Shadows, keyed to the scale phases: `lifted` while the card is off the table (at `rest` of its
   * strength while still in the hand, about the hand card's own shadow; full at the top of the
   * rise, gone as it lands), `contact` on landing, whose blur spreads `spread.from` -> `spread.to`
   * px over `spread.dur` (ease-out) into `settled` as the card settles. Opacity layers only (no
   * box-shadow animation).
   */
  shadow: {
    lifted: '0 28px 56px -12px rgba(0,0,0,.55)',
    rest: 0.5,
    contact: '0 2px 4px rgba(0,0,0,.5)',
    settled: '0 2px 10px rgba(0,0,0,.5)',
    spread: { from: 4, to: 10, dur: 0.08, ease: [0, 0, 0.58, 1] as Curve },
  },
  /** At rest on the table before the navigation starts (the snapshot is taken of a still card). */
  hold: 0.06,
  /** Navigate this long after the press (press + lift + flight + hold). */
  navigate: 0.56,
  /** The card on the table (px), 63:88 like every card; it lands centred at `landing` of the viewport. */
  card: { w: 212, h: 296 },
  landing: { x: 0.5, y: 0.46 },
  /** The field's answer to the impact: one soft ring in the card's colour from the landing point. */
  ring: { dur: 0.7, ease: ease.outExpo, intensity: 0.14, width: 0.07 },
  /**
   * Stage 2, from V. The frame's group runs `dur` on `ease`; the band's starts `band` s and the
   * title's `title` s after it (the three-part container transform). The old card's face (number,
   * year, summary, facts, tap line: what its snapshot holds once the named band and title are cut
   * out) is gone after `details`. Band and title cross-fade in staggered windows; the full-screen
   * frame stays opaque until `dissolve`, then fades on the DOM (its new snapshot is live). The page
   * that is left exits `exit.y` px down with opacity.
   */
  morph: {
    dur: 0.6,
    ease: morphCurve,
    band: 0.02,
    title: 0.04,
    details: 0.15,
    bandOut: { at: 0.06, dur: 0.24 } as Span,
    imageIn: { at: 0.12, dur: 0.3 } as Span,
    titleOut: { at: 0.04, dur: 0.2 } as Span,
    h1In: { at: 0.14, dur: 0.24 } as Span,
    dissolve: { at: 0.46, dur: 0.26, ease: [0, 0, 0.2, 1] as Curve },
    exit: { dur: 0.18, ease: ease.in, y: 8 },
  },
  /**
   * The detail hero's own parts (not in the view transition), from V: the top label and counter,
   * the summary (each `dur`, rising `y` px), then the meta pairs `meta.stagger` apart from
   * `meta.at`; inside a pair the rule draws over `rule`, then its label and value rise.
   */
  hero: {
    label: 0.42,
    summary: 0.5,
    dur: 0.24,
    ease: ease.outQuint,
    y: 8,
    meta: {
      at: 0.62,
      stagger: 0.1,
      rule: 0.24,
      label: { at: 0.06, dur: 0.2 } as Span,
      value: { at: 0.12, dur: 0.2 } as Span,
    },
  },
} as const

const mobilePlay = {
  ...play,
  press: { ...play.press, dur: 0.08 },
  /** No lift on phones (see above); kept at zero so stage 1 reads the same shape. */
  lift: { ...play.lift, dur: 0, y: 0, scale: 1 },
  /** From the rail the card also turns from -3°, as if picked up with the thumb. */
  flight: { ...play.flight, dur: 0.32, rotateFrom: -3 },
  rise: { ...play.rise, dur: 0.22, scale: 1.04 },
  drop: { ...play.drop, dur: 0.1 },
  hold: 0.05,
  navigate: 0.45,
  /** The card on the table: min(54vw, 240 px) wide at 63:88. */
  card: { vw: 0.54, max: 240, ratio: 63 / 88 },
  landing: { x: 0.5, y: 0.44 },
  ring: { ...play.ring, dur: 0.6 },
  morph: {
    ...play.morph,
    dur: 0.52,
    title: 0.03,
    details: 0.13,
    bandOut: { at: 0.05, dur: 0.2 } as Span,
    imageIn: { at: 0.1, dur: 0.26 } as Span,
    titleOut: { at: 0.03, dur: 0.18 } as Span,
    h1In: { at: 0.12, dur: 0.22 } as Span,
    dissolve: { ...play.morph.dissolve, at: 0.4, dur: 0.22 },
  },
  hero: {
    ...play.hero,
    label: 0.36,
    summary: 0.43,
    dur: 0.22,
    y: 6,
    meta: { ...play.hero.meta, at: 0.54, stagger: 0.08 },
  },
  /**
   * The rail (phones, off home): a pressed edge gives `press.scale`; a movement over `slop` px
   * cancels the press (the browser takes over the scroll). While a card leaves it, the other edges
   * drop `drop` px and dim to `dim` over `dur`. The open card's edge sits `current.y` px lower at
   * `current.opacity` with an accent line ("in play").
   */
  rail: { slop: 10, drop: 8, dim: 0.5, dur: 0.18, current: { y: 6, opacity: 0.62 } },
} as const

export const cardPlay = {
  play,
  mobilePlay,
  /**
   * Back to the table (Back, Escape; src/motion/play.ts): the hero's details fade out (`details`)
   * while the full-screen frame materialises again (`frame`, ending with them), so the old snapshot
   * has a frame; then navigate. The frame shrinks into the card's slot over `morph` while the new
   * hand face fades in late (`faceIn`); the hero image hands over to the band and the h1 to the
   * card's title in windows of their own; home's content enters at `home`. The siblings' gap
   * moves on spring.gap.
   */
  return: {
    details: 0.16,
    frame: { at: 0.02, dur: 0.14 } as Span,
    navigate: 0.16,
    morph: { dur: 0.52, ease: flyBack },
    faceIn: { at: 0.26, dur: 0.2 } as Span,
    imageOut: { at: 0.1, dur: 0.2 } as Span,
    bandIn: { at: 0.18, dur: 0.22 } as Span,
    h1Out: { at: 0, dur: 0.16 } as Span,
    titleIn: { at: 0.26, dur: 0.2 } as Span,
    home: { at: 0.2, dur: 0.28 } as Span,
  },
  /**
   * A card played while another card's page is open: B flies as in a play while A's hero dims to
   * `dim` (over the flight); A's page exits with the morph's `exit`, and A's card re-enters its slot
   * (`reenter.at`, phones `reenter.atMobile`, from V), rising `reenter.y` px over `reenter.dur`.
   */
  switch: { dim: 0.3, reenter: { at: 0.3, atMobile: 0.26, y: 12, dur: 0.24 } },
  /**
   * A slow network (src/motion/use-play-pending.ts, hand/play-status.tsx): `cue` s after navigate
   * with no commit the field breathes under the resting card (`breath`: one `period` s cycle of
   * ±`lum` luminance, easing in over `ramp` s, within `radius` of the viewport height around it);
   * after `label` s a plain "Loading…" fades in under the card (`fade` s), after `longWait` s it
   * reads "Still loading…". The hero image fades in over `image` once decoded. Offline at the
   * impact: no navigation; after `offline.hold` the card flies back to its slot (`offline.back`)
   * while the bloom recedes, and a plain message shows near the hand for `offline.message` s.
   */
  loading: {
    cue: 0.35,
    breath: { period: 1.6, lum: 0.06, ramp: 0.4, radius: 0.45 },
    label: 1.5,
    longWait: 12,
    fade: 0.24,
    image: 0.32,
    offline: { hold: 0.2, back: { dur: 0.42, ease: flyBack }, message: 5 },
  },
  /**
   * prefers-reduced-motion: no clone, no flight, no shared morph. The page cross-fades as one
   * (`out` for the old, `in` for the new) and the field's colour fades over `bloom`.
   */
  reduced: { out: 0.12, in: 0.2, bloom: 0.3 },
} as const

/** 404 discard: drop height (px) and the share of the fall in which the card fades in. */
export const discard = { drop: 120, fade: 0.4 } as const

/** Hand geometry. */
export const hand = {
  card: { w: 176, h: 246 },
  cardSm: { w: 100, h: 140 },
  /** Hover / focus lifts a card until this much of it shows (pages show 45%). */
  reveal: 0.9,
  overlap: 28,
  visibleHome: 0.72,
  visiblePage: 0.45,
  visibleHomeSm: 0.7,
  perspective: 1200,
  /** The fan's tilt (rotateX of .hand-row, degrees): the played card's clone starts with it. */
  tilt: 8,
  rail: 48,
  hoverScale: 1.06,
  inspectScale: 2,
  breakpoint: breakpoints.md,
} as const

/*
 * Tiers. full (default) and reduced (prefers-reduced-motion). For the table
 * vocabulary: `ui` scales hover/fill/underline timings, `travel` scales
 * distances. The scale (dur) uses motionScale instead; the card play has its
 * own reduced values (cardPlay.reduced).
 */
export const tiers = {
  full: { ui: 1, travel: 1 },
  reduced: { ui: 0, travel: 0 },
} as const satisfies Record<MotionTier, unknown>

type Bezier = readonly number[]
const ms = (s: number) => `${Math.round(s * 1000)}ms`
const bezier = (b: Bezier) => `cubic-bezier(${b.join(',')})`
const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/**
 * A spring as a CSS easing: simulate x'' = (-k(x-1) - c·v)/m from rest until it
 * settles and sample it into linear(). Returns the curve and its duration.
 */
export function springCss({ stiffness, damping, mass }: { stiffness: number; damping: number; mass: number }) {
  const dt = 1 / 600
  let x = 0
  let v = 0
  let t = 0
  const trace: number[] = [0]
  while (t < 3) {
    const a = (-stiffness * (x - 1) - damping * v) / mass
    v += a * dt
    x += v * dt
    t += dt
    trace.push(x)
    if (Math.abs(x - 1) < 0.0005 && Math.abs(v) < 0.005) break
  }
  const points = 40
  const values = Array.from({ length: points + 1 }, (_, i) => {
    const value = trace[Math.round((i / points) * (trace.length - 1))]
    // Critically damped springs never pass 1; clamp the integration error too.
    return Number(Math.min(1, value).toFixed(4))
  })
  values[points] = 1
  return { easing: `linear(${values.join(',')})`, duration: t }
}

const springs = Object.fromEntries(Object.entries(spring).map(([k, s]) => [k, springCss(s)])) as Record<
  keyof typeof spring,
  { easing: string; duration: number }
>

function vars(tier: MotionTier): string {
  const { ui, travel } = tiers[tier]
  const out: string[] = []
  // Plain page fades keep a short duration in reduced (an opacity crossfade); the rest scale by `ui`.
  for (const [k, v] of Object.entries(duration))
    out.push(`--dur-${kebab(k)}:${ms(k === 'navFade' && tier === 'reduced' ? reducedCrossfade : v * ui)}`)
  for (const [k, s] of Object.entries(springs)) out.push(`--spring-${k}-dur:${ms(s.duration * ui)}`)
  for (const [k, v] of Object.entries(distance)) out.push(`--travel-${kebab(k)}:${v * travel}px`)
  // The scale: --dur-xs ... --dur-xl.
  for (const k of Object.keys(dur) as DurationStep[]) out.push(`--dur-${k}:${ms(durFor(tier, k))}`)
  out.push(`--motion-scale:${motionScale[tier]}`)
  return out.join(';')
}

const px = (v: number) => `${v}px`
const span = (name: string, v: Span) => [`--${name}-at:${ms(v.at)}`, `--${name}-dur:${ms(v.dur)}`]

/**
 * The card play's CSS values for one device (desktop on :root, phones and tablets under 1024 px):
 * the view-transition pseudo-elements, the play frame and the table card read them.
 */
function playVars(p: typeof play | typeof mobilePlay): string {
  const m = p.morph
  const card =
    'w' in p.card
      ? [`--table-card-w:${px(p.card.w)}`, `--table-card-h:${px(p.card.h)}`]
      : [
          `--table-card-w:min(${p.card.vw * 100}vw, ${px(p.card.max)})`,
          `--table-card-h:calc(var(--table-card-w) / ${p.card.ratio})`,
        ]
  return [
    ...card,
    `--table-landing-x:${p.landing.x * 100}%`,
    `--table-landing-y:${p.landing.y * 100}%`,
    `--play-press-scale:${p.press.scale}`,
    `--play-press-dur:${ms(p.press.dur)}`,
    `--play-press-ease:${bezier(p.press.ease)}`,
    // From the press to contact (the switch's dim runs over it).
    `--play-contact:${ms(p.press.dur + p.lift.dur + p.flight.dur)}`,
    `--play-morph-dur:${ms(m.dur)}`,
    `--play-morph-ease:${bezier(m.ease)}`,
    `--play-band-delay:${ms(m.band)}`,
    `--play-title-delay:${ms(m.title)}`,
    `--play-details:${ms(m.details)}`,
    ...span('play-band-out', m.bandOut),
    ...span('play-image-in', m.imageIn),
    ...span('play-title-out', m.titleOut),
    ...span('play-h1-in', m.h1In),
    `--play-dissolve-at:${ms(m.dissolve.at)}`,
    `--play-dissolve-dur:${ms(m.dissolve.dur)}`,
    `--play-dissolve-ease:${bezier(m.dissolve.ease)}`,
    // The frame's new image holds (opacity 1) until the DOM dissolve has ended, so the view
    // transition (and its group order) lasts as long as the dissolve: nothing re-stacks under it.
    `--play-hold:${ms(m.dissolve.at + m.dissolve.dur)}`,
    `--play-exit-dur:${ms(m.exit.dur)}`,
    `--play-exit-ease:${bezier(m.exit.ease)}`,
    `--play-exit-y:${px(m.exit.y)}`,
  ].join(';')
}

/** The device-independent card play values (shadows, rail, return, loading, reduced). */
function cardPlayConstants(): string[] {
  const { shadow } = play
  const r = cardPlay.return
  const rail = mobilePlay.rail
  return [
    `--play-shadow-lifted:${shadow.lifted}`,
    `--play-shadow-contact:${shadow.contact}`,
    `--play-shadow-settled:${shadow.settled}`,
    `--switch-dim:${cardPlay.switch.dim}`,
    `--play-shadow-spread-from:${px(shadow.spread.from)}`,
    `--play-shadow-spread-to:${px(shadow.spread.to)}`,
    `--play-shadow-spread-dur:${ms(shadow.spread.dur)}`,
    `--play-shadow-spread-ease:${bezier(shadow.spread.ease)}`,
    `--rail-drop:${px(rail.drop)}`,
    `--rail-dim:${rail.dim}`,
    `--rail-dur:${ms(rail.dur)}`,
    `--rail-current-y:${px(rail.current.y)}`,
    `--rail-current-opacity:${rail.current.opacity}`,
    `--return-details:${ms(r.details)}`,
    ...span('return-frame', r.frame),
    `--return-morph-dur:${ms(r.morph.dur)}`,
    `--return-morph-ease:${bezier(r.morph.ease)}`,
    ...span('return-face-in', r.faceIn),
    ...span('return-image-out', r.imageOut),
    ...span('return-band-in', r.bandIn),
    ...span('return-h1-out', r.h1Out),
    ...span('return-title-in', r.titleIn),
    ...span('return-home', r.home),
    `--loading-image:${ms(cardPlay.loading.image)}`,
    `--loading-fade:${ms(cardPlay.loading.fade)}`,
    `--reduced-out:${ms(cardPlay.reduced.out)}`,
    `--reduced-in:${ms(cardPlay.reduced.in)}`,
  ]
}

/** CSS custom properties for every tier. */
export function motionCss(): string {
  const constants = [
    ...Object.entries(ease).map(([k, v]) => `--ease-${kebab(k)}:${bezier(v)}`),
    ...Object.entries(springs).map(([k, s]) => `--spring-${k}:${s.easing}`),
    ...Object.entries(weight).map(([k, v]) => `--wght-${kebab(k)}:${v}`),
    `--opsz-start:${opsz.start}`,
    `--opsz-end:${opsz.end}`,
    ...Object.entries(stagger).map(([k, v]) => `--stagger-${kebab(k)}:${ms(v)}`),
    `--dur-reduced:${ms(reducedCrossfade)}`,
    `--angle-discard:${angle.discard}deg`,
    `--angle-tap:${angle.tap}deg`,
    `--hero-drift:${reveal.heroDrift * 100}%`,
    `--reveal-mask:${reveal.mask * 100}%`,
    `--contour-drift-scale:${field.contourDrift.scale}`,
    // Chapter 05's pinned stage (layout.css): its head row and the space around and between rows.
    `--deal-head:${deal.pinned.head}px`,
    `--deal-pad:${deal.pinned.pad}px`,
    // The header logo's gradient loop (reduced: no animation, header.module.css).
    `--logo-flow:${ms(logo.flow.dur)}`,
    ...cardPlayConstants(),
  ]
  return [
    `:root{${constants.join(';')};${vars('full')};${playVars(play)}}`,
    `@media (max-width:${breakpoints.md - 0.02}px){:root{${playVars(mobilePlay)}}}`,
    `:root[data-motion="reduced"]{${vars('reduced')}}`,
    // No-JS fallback: the pre-paint script normally sets data-motion="reduced".
    `@media (prefers-reduced-motion:reduce){:root{${vars('reduced')}}}`,
  ].join('')
}
