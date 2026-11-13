/*
 * Hosting configuration: the only module that spells out the domains. The build
 * (scripts/hosting/build.mjs), the password gate (a Netlify Edge Function, gate-handler.ts) and
 * the docs refer to these constants by name: PRIMARY_DOMAIN, REDIRECT_DOMAINS.
 *
 * Plain TypeScript without imports, so Node (type stripping), Deno (Netlify Edge Functions) and
 * the app's type check all read it as is.
 */

/** Production. Gated until launch, then the open site. */
export const PRIMARY_DOMAIN = 'michaeljlschmidt.ch'

/**
 * Domain aliases: a 301 to https://PRIMARY_DOMAIN (path and query kept) before anything else, so
 * the gate's cookie is only ever set on the primary host.
 */
export const REDIRECT_DOMAINS = ['mjls.ch', 'www.mjls.ch', 'www.michaeljlschmidt.ch'] as const

/**
 * Who may see a deploy: SITE_ACCESS, set per deploy context in netlify.toml.
 * - gated: every request meets the password gate first; nothing is indexed
 * - public: no gate, indexable (production after launch: the launch switch)
 * Anything but "public", unset included, is gated: a build never opens by accident.
 */
export type SiteAccess = 'gated' | 'public'
export const siteAccess = (value: string | undefined): SiteAccess => (value === 'public' ? 'public' : 'gated')

export const gate = {
  /** Host-only cookie: the prefix requires Secure, Path=/ and no Domain attribute. */
  cookie: '__Host-gate',
  /** The language chosen with the gate page's DE·EN switch (wins over Accept-Language). */
  langCookie: '__Host-gate-lang',
  /** The logo gradient the last gate page showed: the next one picks another, like home does. */
  logoCookie: '__Host-gate-logo',
  maxAgeSeconds: 30 * 24 * 60 * 60,
  langMaxAgeSeconds: 365 * 24 * 60 * 60,
  /** Everything under this prefix belongs to the gate itself. */
  prefix: '/.gate/',
  unlock: '/.gate/unlock',
  lock: '/.gate/lock',
  /** GET /.gate/lang/<locale>?next=<path>: stores the choice, then back to next. */
  lang: '/.gate/lang/',
  /** The gate page's fonts: the only paths the edge function never sees. */
  assets: '/.gate/assets/',
  /**
   * Where the build stores those assets. Netlify does not reliably deploy dot-directories, so
   * /.gate/assets/* is rewritten here (_redirects). Requests straight to this directory are gated
   * like any other path.
   */
  assetsDir: '/_gate/',
  /** Wrong password: wait this long before answering. */
  failureDelayMs: 750,
  /** Netlify environment variable, Functions scope (netlify.toml values never reach edge functions). */
  passwordEnv: 'SITE_PASSWORD',
} as const
