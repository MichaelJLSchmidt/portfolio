import localFont from 'next/font/local'

/*
 * Self-hosted variable fonts (unmodified Latin files from Fontsource, OFL).
 * Display: Bricolage Grotesque, opsz 12–96 and wght 200–800 only (no width
 * axis in this file, so width can never animate). Text: Hanken Grotesk.
 * Mono: Martian Mono (labels, metrics, tabular figures).
 */
export const display = localFont({
  src: '../fonts/BricolageGrotesque-opsz-wght.latin.woff2',
  variable: '--font-display-face',
  weight: '200 800',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

export const text = localFont({
  src: '../fonts/HankenGrotesk-wght.latin.woff2',
  variable: '--font-text-face',
  weight: '100 900',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

export const mono = localFont({
  src: '../fonts/MartianMono-wght.latin.woff2',
  variable: '--font-mono-face',
  weight: '100 800',
  display: 'swap',
  adjustFontFallback: false,
})

/*
 * Handwriting: Caveat (OFL, latin subset incl. German umlauts), only for the idle hint on home.
 * Not preloaded: the browser fetches it the first time the note renders.
 */
export const hand = localFont({
  src: '../fonts/Caveat-wght.latin.woff2',
  variable: '--font-hand-face',
  weight: '400 700',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
})
