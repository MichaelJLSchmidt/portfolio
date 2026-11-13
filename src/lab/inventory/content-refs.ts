import { contentFor } from '@/lib/content'
import type { Locale } from '@/lib/i18n'

/*
 * Where the content names something (an illustration, an image id): the paths of the string
 * values in a locale's content set that equal it, with array entries named by their slug or id
 * when they have one ("caseStudies[front-door].sections.approach.illustration"). The identity of
 * the case study a path is in comes along, so a drawing can be shown in its page's colour.
 */
export type ContentRef = { path: string; identity: string | null }

export function contentRefs(value: string, locale: Locale = 'en'): ContentRef[] {
  const out: ContentRef[] = []
  const walk = (node: unknown, path: string, identity: string | null) => {
    if (typeof node === 'string') {
      if (node === value) out.push({ path, identity })
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => {
        const key =
          v && typeof v === 'object' ? ((v as { slug?: string; id?: string }).slug ?? (v as { id?: string }).id) : null
        walk(v, `${path}[${key ?? i}]`, identity)
      })
    } else if (node && typeof node === 'object') {
      const own = (node as { identity?: unknown }).identity
      const id = typeof own === 'string' ? own : identity
      for (const [k, v] of Object.entries(node)) if (typeof v !== 'function') walk(v, path ? `${path}.${k}` : k, id)
    }
  }
  walk(contentFor(locale), '', null)
  return out
}
