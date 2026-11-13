/*
 * Per-page metadata helpers (server): the hreflang alternates of a page in
 * every locale, plus x-default (the root, which picks the language). Absolute
 * when the deploy passes SITE_URL; base-path relative otherwise.
 * Contract: docs/contracts.md#locales.
 */
import type { Metadata } from 'next'
import { type Locale, localeHref, locales } from './i18n'
import { absoluteUrl, withBase } from './site'

const url = (path: string) => absoluteUrl(path) ?? withBase(path)
/** Pages end in a slash (trailingSlash), so the alternates do too. */
const page = (locale: Locale, path: string) => url(localeHref(locale, path).replace(/\/?$/, '/'))

/** Canonical URL of `path` (without the locale) in `locale`, and its alternates in every locale. */
export function pageAlternates(locale: Locale, path: string): Metadata['alternates'] {
  return {
    canonical: page(locale, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, page(l, path)])),
      'x-default': url('/'),
    },
  }
}
