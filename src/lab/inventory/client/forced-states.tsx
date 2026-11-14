'use client'

import { useEffect } from 'react'

/*
 * Hover and focus, shown without a pointer or focus: the site's own rules, copied at runtime from
 * the stylesheets the page has loaded, with :hover replaced by [data-force~="hover"] and
 * :focus-visible by [data-force~="focus"]. An element with data-force="hover" therefore looks
 * exactly as the real rules make it look on hover; nothing is written by hand, so a changed
 * rule shows up here as it is. (hover: hover) conditions are dropped, so phones show the hover
 * state too. Mounted once on the inventory.
 */
const PSEUDO = /:hover|:focus-visible/

const force = (selector: string) =>
  selector.replace(/:hover/g, '[data-force~="hover"]').replace(/:focus-visible/g, '[data-force~="focus"]')

function collect(rules: CSSRuleList, out: string[]) {
  for (const rule of rules) {
    if (rule instanceof CSSStyleRule) {
      if (PSEUDO.test(rule.selectorText)) out.push(`${force(rule.selectorText)}{${rule.style.cssText}}`)
    } else if (rule instanceof CSSMediaRule) {
      const inner: string[] = []
      collect(rule.cssRules, inner)
      if (!inner.length) continue
      if (/^\(hover:\s*hover\)$/.test(rule.conditionText)) out.push(...inner)
      else out.push(`@media ${rule.conditionText}{${inner.join('')}}`)
    } else if (rule instanceof CSSSupportsRule) {
      const inner: string[] = []
      collect(rule.cssRules, inner)
      if (inner.length) out.push(`@supports ${rule.conditionText}{${inner.join('')}}`)
    } else if (rule instanceof CSSLayerBlockRule) {
      const inner: string[] = []
      collect(rule.cssRules, inner)
      if (inner.length) out.push(`@layer ${rule.name}{${inner.join('')}}`)
    }
  }
}

export function ForcedStates() {
  useEffect(() => {
    const out: string[] = []
    for (const sheet of document.styleSheets) {
      if ((sheet.ownerNode as Element | null)?.id === 'inv-forced') continue
      try {
        collect(sheet.cssRules, out)
      } catch {
        // A cross-origin sheet: none of the site's.
      }
    }
    const style = document.createElement('style')
    style.id = 'inv-forced'
    style.textContent = out.join('\n')
    document.head.append(style)
    document.documentElement.dataset.invForced = String(out.length)
    return () => {
      style.remove()
      delete document.documentElement.dataset.invForced
    }
  }, [])
  return null
}
