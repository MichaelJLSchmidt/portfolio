/*
 * The chapter numerals' stroke (src/components/layout/chapter-numeral.tsx) is one CSS px at any
 * size. A non-scaling stroke would break their pathLength dashes (Chromium), so each numeral gets
 * the width in its own user units instead: --numeral-stroke = viewBox height / rendered height,
 * kept up to date by a ResizeObserver while the route is shown (the reveal engine starts it).
 */
export function watchNumeralStrokes(root: ParentNode): () => void {
  const svgs = [...root.querySelectorAll<SVGSVGElement>('svg[data-numeral-svg]')]
  if (!svgs.length || typeof ResizeObserver !== 'function') return () => {}
  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const svg = entry.target as SVGSVGElement
      const height = entry.contentRect.height
      const units = svg.viewBox.baseVal?.height ?? 0
      if (height > 0 && units > 0) svg.style.setProperty('--numeral-stroke', (units / height).toFixed(3))
    }
  })
  for (const svg of svgs) ro.observe(svg)
  return () => ro.disconnect()
}
