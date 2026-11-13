/*
 * Locales: German and English, each under its own path prefix (/de/, /en/),
 * every page in both, card slugs the same in both. No imports, so the
 * build scripts (scripts/i18n-pages.mjs) and client code can share it.
 * Contract: docs/contracts.md#locales.
 */
export const locales = ['de', 'en'] as const
export type Locale = (typeof locales)[number]

/** With no browser language at all (an empty list): German. */
export const defaultLocale: Locale = 'de'
/** With browser languages that are neither German nor English: English. */
export const fallbackLocale: Locale = 'en'

/** localStorage key of the visitor's choice (written by the switcher, read by the root and 404 scripts). */
export const LOCALE_KEY = 'locale'

/** Each language's name in its own language (switcher, root page). */
export const localeNames: Record<Locale, string> = { de: 'Deutsch', en: 'English' }

/** Open Graph locale: Swiss Standard German, British English (the copy spells "organisation"). */
export const ogLocales: Record<Locale, string> = { de: 'de_CH', en: 'en_GB' }

export const isLocale = (value: unknown): value is Locale => locales.includes(value as Locale)

/**
 * Splits a pathname (without the base path) into its locale and the page path:
 * "/de/about/" -> { locale: "de", path: "/about" }, "/de" -> { "de", "/" };
 * a path without a locale prefix (the 404 page at an unknown address) keeps locale null.
 */
const prefix = new RegExp(`^/(${locales.join('|')})(?=/|$)`)

export function splitPath(pathname: string): { locale: Locale | null; path: string } {
  const match = prefix.exec(pathname)
  const rest = match ? pathname.slice(match[0].length) : pathname
  const path = rest.replace(/\/+$/, '') || '/'
  return { locale: match ? (match[1] as Locale) : null, path: path.startsWith('/') ? path : `/${path}` }
}

/** The page path without its locale ("/de/about/" -> "/about", "/de/" -> "/"). */
export const pagePath = (pathname: string) => splitPath(pathname).path

/** A link to `path` (with an optional #hash) in `locale`: "/" -> "/de/", "/about" -> "/de/about". */
export const localeHref = (locale: Locale, path: string) => (path === '/' ? `/${locale}/` : `/${locale}${path}`)

/**
 * The language rule, as an inline script expression (the root page and the 404 page run it before
 * anything renders, scripts/i18n-pages.mjs): a choice the visitor made earlier (localStorage) wins;
 * otherwise the first of navigator.languages that starts with "de" or "en"; English when there are
 * languages but none of them; German when there are none. Evaluates to "de" or "en".
 */
export const pickLocaleScript = `(function(){var s=null;try{s=localStorage.getItem(${JSON.stringify(LOCALE_KEY)})}catch(e){}if(s==="de"||s==="en")return s;var n=navigator.languages||(navigator.language?[navigator.language]:[]);for(var i=0;i<n.length;i++){var t=String(n[i]).toLowerCase();if(t.slice(0,2)==="de")return"de";if(t.slice(0,2)==="en")return"en"}return n.length?${JSON.stringify(fallbackLocale)}:${JSON.stringify(defaultLocale)}})()`
