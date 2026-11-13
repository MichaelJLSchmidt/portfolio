import type { SvgNode } from './model'

/*
 * Standalone SVG: the same tree as the inline mark, with colours baked in
 * (CSS variables do not resolve in a file on its own) and fixed ids.
 */
export type Paints = { neutral: string; accent: string; container: string }

export type StringOptions = {
  paints: Paints
  /** Pixel size written as width / height (PNG rendering); omitted for downloads. */
  size?: { width: number; height: number }
  title?: string
  /**
   * Favicon: neutral and accent become currentColor, and a style sets the
   * colour per prefers-color-scheme (light tab → `light`, dark tab → `dark`).
   */
  scheme?: { light: string; dark: string }
  idPrefix?: string
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

export function resolveValue(value: string, paints: Paints, idPrefix: string, scheme: boolean) {
  return value
    .replace(/@neutral/g, scheme ? 'currentColor' : paints.neutral)
    .replace(/@accent/g, scheme ? 'currentColor' : paints.accent)
    .replace(/@container/g, paints.container)
    .replace(/@id:/g, `${idPrefix}-`)
}

export function toSvgString(root: SvgNode, opts: StringOptions): string {
  const prefix = opts.idPrefix ?? 'mark'
  const scheme = Boolean(opts.scheme)
  const write = (node: SvgNode, depth: number): string => {
    const attrs: string[] = []
    for (const [k, v] of Object.entries(node.attrs ?? {})) {
      if (v === undefined) continue
      // Lab-only hooks stay out of the files.
      if (k === 'role' || k === 'aria-label' || k === 'data-concept' || k === 'data-variant') continue
      attrs.push(`${k}="${esc(resolveValue(String(v), opts.paints, prefix, scheme))}"`)
    }
    if (node.tag === 'svg' && opts.size) attrs.push(`width="${opts.size.width}" height="${opts.size.height}"`)
    const pad = '  '.repeat(depth)
    const extra: string[] = []
    if (node.tag === 'svg') {
      if (opts.title) extra.push(`${pad}  <title>${esc(opts.title)}</title>`)
      if (opts.scheme) {
        const { light, dark } = opts.scheme
        const css =
          light === dark
            ? `:root{color:${light}}`
            : `:root{color:${light}}@media (prefers-color-scheme:dark){:root{color:${dark}}}`
        extra.push(`${pad}  <style>${css}</style>`)
      }
    }
    const kids = [...extra, ...(node.children ?? []).map((c) => write(c, depth + 1))]
    const open = `${pad}<${node.tag}${attrs.length ? ' ' + attrs.join(' ') : ''}`
    return kids.length ? `${open}>\n${kids.join('\n')}\n${pad}</${node.tag}>` : `${open}/>`
  }
  return write(root, 0) + '\n'
}
