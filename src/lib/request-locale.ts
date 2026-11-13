/*
 * The locale of the page being rendered, for server components deep in the
 * tree (Picture's alt text, the footer, the Minimap's label, ...), so they
 * need no locale prop. Each [locale] layout and page calls
 * setRequestLocale(params.locale) first; React's cache() scopes the value to
 * one render, so the two locales never mix during the static build.
 * Server only. Contract: docs/contracts.md#locales.
 */
import { cache } from 'react'
import { type Locale, isLocale, locales } from './i18n'

const scope = cache(() => ({ locale: null as Locale | null }))

/** The [locale] param as a Locale (the build only generates these, dynamicParams = false). */
export function asLocale(value: string): Locale {
  if (!isLocale(value)) throw new Error(`Unknown locale "${value}" (src/lib/i18n.ts lists ${locales.join(', ')}).`)
  return value
}

/** Sets the render's locale; returns it. Call it first in every [locale] layout and page. */
export function setRequestLocale(value: string): Locale {
  const locale = asLocale(value)
  scope().locale = locale
  return locale
}

/** The render's locale (set by its layout or page). */
export function requestLocale(): Locale {
  const { locale } = scope()
  if (!locale) throw new Error('No locale for this render: call setRequestLocale(params.locale) in the page or layout.')
  return locale
}
