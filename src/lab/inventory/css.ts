import { readSource } from '../source'

/*
 * Custom properties as the site declares them: from the CSS the root layout injects
 * (identityCss(), logoGradientCss(), motionCss(), fieldInitialCss()) and from the token
 * stylesheets (src/styles/tokens.css, layout.css, type.css). Server only.
 */

export type CssVar = { name: string; value: string; file: string; line: number; comment: string }

/** The declarations of the first rule whose selector is exactly `selector` in a CSS string. */
export function declarations(css: string, selector = ':root'): Map<string, string> {
  const out = new Map<string, string>()
  let from = 0
  for (;;) {
    const at = css.indexOf(`${selector}{`, from)
    if (at < 0) return out
    // A selector match, not the tail of a longer one (":root[data-motion=...]").
    if (at > 0 && !/[}\s]/.test(css[at - 1])) {
      from = at + 1
      continue
    }
    const body = css.slice(at + selector.length + 1, css.indexOf('}', at))
    for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) out.set(m[1], m[2].trim())
    return out
  }
}

/** Every custom property a stylesheet declares in its top-level :root rules, with its line and comment. */
export function rootVars(file: string): CssVar[] {
  const text = readSource(file)
  const out: CssVar[] = []
  const re = /^:root\s*\{([\s\S]*?)\n\}/gm
  for (const block of text.matchAll(re)) {
    const start = block.index! + block[0].indexOf('{') + 1
    let comment = ''
    for (const line of block[1].split('\n')) {
      const t = line.trim()
      if (t.startsWith('/*')) comment = t.replace(/^\/\*+\s?|\s?\*+\/$/g, '')
      const m = /^(--[\w-]+)\s*:\s*(.+);$/.exec(t)
      if (m) {
        const index = text.indexOf(t, start)
        out.push({ name: m[1], value: m[2], file, line: text.slice(0, index).split('\n').length, comment })
      }
      if (!t) comment = ''
    }
  }
  return out
}
