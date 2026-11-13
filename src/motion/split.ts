/*
 * Line splitting for the `lines` reveal. Motion+ splitText measures the line
 * breaks (call it only after document.fonts.ready, so they are the real
 * fonts' breaks); each line is then wrapped in a clip mask (.rv-mask, see
 * reveal.css). revert() puts the element's original nodes back, so the text
 * reflows normally on resize and React keeps the nodes it rendered.
 *
 * Only plain-text elements are split: markup inside (links, emphasis) would be
 * flattened while the lines move, so those elements reveal as a block instead.
 */
export type Split = { lines: HTMLElement[]; revert: () => void }

// Text splitText would read back as markup (it sets each word's innerHTML).
const markupLike = /<[a-z!/?]|&[#a-z0-9]+;/i

/** Motion+ splitText (or its local fallback) is loaded on the first split, not with the page. */
type SplitModule = typeof import('./split-text')
let plus: Promise<SplitModule> | null = null
let loaded: SplitModule | null = null
export const loadSplit = () => (plus ??= import('./split-text').then((m) => (loaded = m)))
/** The split module if it has already arrived (no await needed). */
export const splitLoaded = () => loaded

/** Splits `el` (call after `await loadSplit()`, so splitText is there). */
export function splitLines(el: HTMLElement, { splitText }: SplitModule): Split | null {
  if (el.childElementCount > 0 || el.dataset.split !== undefined) return null
  const text = el.textContent ?? ''
  if (!text.trim() || markupLike.test(text) || el.getClientRects().length === 0) return null
  const saved = [...el.childNodes]
  const label = el.getAttribute('aria-label')
  // Words, not characters: character spans would lose kerning and move the breaks.
  // Each mask is exactly one line box high: inline-block words round their line up, which
  // would push the text below down while split and make it jump back on revert.
  const lh = getComputedStyle(el).lineHeight
  const { lines } = splitText(el, { preserveHyphens: true, lineClass: 'rv-line', wordClass: 'rv-word' })
  for (const line of lines) {
    const mask = document.createElement('span')
    mask.className = 'rv-mask'
    if (lh.endsWith('px')) mask.style.height = lh
    line.style.display = 'block'
    line.before(mask)
    mask.append(line)
  }
  el.dataset.split = ''
  return {
    lines,
    revert: () => {
      // React may have replaced the text meanwhile (same-route update): keep its version.
      if (el.firstElementChild?.classList.contains('rv-mask')) el.replaceChildren(...saved)
      if (label === null) el.removeAttribute('aria-label')
      else el.setAttribute('aria-label', label)
      delete el.dataset.split
    },
  }
}

/** Groups elements into lines by their top offset (for build-time split words, WeightText). */
export function lineIndexes(items: HTMLElement[]) {
  let top = Number.NaN
  let line = -1
  return items.map((item) => {
    const t = item.offsetTop
    if (t !== top) {
      // A new line starts lower than the last one (inline-grid words share a top per line).
      if (Number.isNaN(top) || t > top) line++
      top = t
    }
    return line
  })
}
