/*
 * View-transition vocabulary.
 *   play:   a hand card, landed on the table, becomes its detail page
 *   return: the page goes back into the card and the card into its hand slot (Back, Escape)
 *   switch: from one card's page straight to another card
 *   nav:    any other link (About, the 404 page's link home)
 *   locale: the same page in the other language (the header's switcher): the
 *           [locale] layout remounts and every part cross-fades once, in place;
 *           never a card morph
 * Browser back / forward carries no type: every map falls back to its default
 * (the shared morph, vt-morph).
 *
 * CSS (src/styles/view-transitions.css) targets the view-transition classes
 * these maps give, not :active-view-transition-type(): Firefox (144+) supports
 * view-transition-class but not transition types.
 */
export const PLAY = 'play'
export const RETURN = 'return'
export const SWITCH = 'switch'
export const NAV = 'nav'
export const LOCALE = 'locale'

/** The class every part of the page cross-fades with on a language switch (view-transitions.css). */
export const LOCALE_FADE = 'locale-fade'

/**
 * The three shared names of a card, kept to the minimum (with the canvas-free root): its frame
 * (the card face, and on the page the full-screen .play-frame), its band (the page's hero image,
 * [data-hero-target]) and its title (the page's h1).
 */
export const cardName = (id: string) => `card-${id}`
export const bandName = (id: string) => `card-band-${id}`
export const titleName = (id: string) => `card-title-${id}`
/** About's Master's card and the thesis hero (R7, R8): one shared element, like a hand card and its case. */
export const thesisName = 'thesis-card'

type Part = 'frame' | 'band' | 'title'

/**
 * Card morphs. React takes the class from the element that mounts, so the page's maps (the hero)
 * time play / switch / back-forward into a page (`vt-in`), and the hand's maps time return and
 * every way back into the hand (`vt-out`). `vt-<part>` tells the three groups apart.
 */
const toPage = (part: Part) => ({
  [PLAY]: `vt-play vt-${part}`,
  [SWITCH]: `vt-play vt-${part}`,
  [LOCALE]: LOCALE_FADE,
  default: `vt-morph vt-in vt-${part}`,
})
const toHand = (part: Part) => ({
  [RETURN]: `vt-return vt-${part}`,
  [LOCALE]: LOCALE_FADE,
  default: `vt-morph vt-out vt-${part}`,
})

export const heroFrameShare = toPage('frame')
export const heroBandShare = toPage('band')
export const heroTitleShare = toPage('title')
export const handFrameShare = toHand('frame')
export const handBandShare = toHand('band')
export const handTitleShare = toHand('title')

/** The thesis card and its hero: the plain shared morph (no frame, band or title parts). */
export const thesisShare = { [LOCALE]: LOCALE_FADE, default: 'vt-morph' }

/** Page content enter / exit classes, keyed by transition type. */
export const pageExit = {
  [PLAY]: 'page-exit-play',
  [SWITCH]: 'page-exit-play',
  [RETURN]: 'page-exit-return',
  [NAV]: 'page-fade',
  [LOCALE]: LOCALE_FADE,
  default: 'page-exit-return',
}
export const pageEnter = {
  [PLAY]: 'page-enter-play',
  [SWITCH]: 'page-enter-play',
  [RETURN]: 'page-enter-return',
  [NAV]: 'page-fade',
  [LOCALE]: LOCALE_FADE,
  default: 'page-enter-return',
}
