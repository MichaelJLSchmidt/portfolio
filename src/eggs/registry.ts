/*
 * Easter eggs: optional, never blocking, each with an on flag and its
 * behaviour per motion tier. Code for an egg runs only when it fires.
 */
export const eggs = {
  mulligan: {
    on: true,
    trigger:
      'M on the start page, or (touch) a long press on the empty table there, not on a card or text (800 ms, 10 ms haptic)',
    full: 'the four cards fly off to the dealer (bottom right) and are dealt again, face down then face up',
    reduced: 'nothing moves; announced',
  },
  workshop: {
    on: true,
    trigger: '"Draw a method" (management.workshops.drawButton) on /management',
    full: 'a card turns over (3D flip) to a random method',
    reduced: 'instant swap',
  },
  rarePull: {
    on: true,
    trigger: '1 in 40 page loads (or ?rare in the address)',
    full: 'one hand card gets a single 1200 ms holographic glint',
    reduced: 'none',
  },
  tap: {
    on: true,
    trigger: 'T on a focused card, or a double tap on a card as it flies to the table (mobile)',
    full: 'the card turns 90 degrees on the hover spring and shows the line on its long edge; untaps on the next navigation',
    reduced: 'turns at once',
  },
  shortcuts: {
    on: true,
    trigger: '?',
    full: 'a dialog; its title types itself (Motion+ typewriter, loaded on first open)',
    reduced: 'title shown at once',
  },
  discard: {
    on: true,
    trigger: 'any unknown address (404)',
    full: 'a card falls face down into the discard zone (rotate to -12 degrees, 700 ms)',
    reduced: 'fades in',
  },
  onTheTable: {
    on: true,
    trigger: 'About: five face-down mini cards (about.onTheTable.items)',
    full: 'a tap flips a card to its value',
    reduced: 'instant swap',
  },
  inspect: {
    on: true,
    trigger: 'hold Space on a focused card (400 ms), or long press (400 ms, 10 ms haptic) on mobile',
    full: 'the card grows to 2x in place with its one-line summary',
    reduced: 'at once',
  },
  idleHint: {
    on: true,
    trigger:
      'home only: 10 s without a click, tap or key press (pointer movement and scrolling do not count), once per session',
    full: 'a handwritten note, "(a selection of my projects)", writes itself beside the hand, then a curly arrow draws toward the cards; the next click, tap or key press fades it out',
    reduced: 'the note and arrow fade in and out (160 ms)',
  },
  coffee: {
    on: true,
    trigger: 'typing "draw" on the start page',
    full: 'a fifth card, "Coffee?", is dealt from off screen and opens the contact chapter on About (/about#contact); it leaves the hand on navigation',
    reduced: 'appears',
  },
} as const

export type EggName = keyof typeof eggs
export const eggOn = (name: EggName) => eggs[name].on
