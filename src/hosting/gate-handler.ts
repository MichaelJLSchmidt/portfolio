import { isLocale } from '../lib/i18n.ts'
import { PRIMARY_DOMAIN, REDIRECT_DOMAINS, gate } from './config.ts'
import {
  MAX_FIELD_LENGTH,
  clearedCookie,
  langCookie,
  originAllowed,
  passwordMatches,
  pickLocale,
  readCookie,
  safeNext,
  sessionCookie,
  signCookie,
  verifyCookie,
} from './gate.ts'
import { renderPage, type FormState, type GatePage } from './page.ts'

/*
 * The password gate as a request handler. The build wraps it in a Netlify Edge Function on every
 * path except the gate's own assets, in every deploy context while SITE_ACCESS is not "public"
 * (scripts/hosting/build.mjs, netlify.toml).
 *
 * - A domain alias (REDIRECT_DOMAINS): 301 to https://PRIMARY_DOMAIN, path and query kept, before
 *   anything else, so the cookie is only ever set on the primary host.
 * - Every path is protected except the gate's own assets (/.gate/assets/*) and robots.txt, which
 *   the gate answers itself with "Disallow: /".
 * - No valid cookie: the gate page, 401 with a Cookie challenge (no-store), in German or English
 *   (the language switch's cookie, else Accept-Language).
 * - POST /.gate/unlock (same origin only): password check, cookie, 303 to `next`; a wrong
 *   password waits, then shows the gate page with an error.
 * - GET /.gate/lock: clears the cookie, shows the gate page.
 * - GET /.gate/lang/<locale>?next=…: remembers the language, 303 back to `next`.
 * - No password configured: fail closed, the page says the site is closed.
 * Every response carries X-Robots-Tag: noindex, nofollow.
 */

export type GateOptions = {
  page: GatePage
  /** Content-Security-Policy for the gate page. */
  csp: string
  /** Path prefixes of content-hashed files: once unlocked, the browser may keep them for a year. */
  immutable?: string[]
}

export type GateDeps = {
  /** SITE_PASSWORD; undefined or empty closes the site. */
  password: string | undefined
  /** The protected response (Netlify: context.next()). */
  next: () => Promise<Response>
  /** Unix seconds. */
  now?: () => number
  wait?: (ms: number) => Promise<void>
  log?: (message: string) => void
}

const ROBOTS = 'noindex, nofollow'
/** 401 needs a challenge; this names the form and the cookie (the "Cookie" scheme draft). */
const CHALLENGE = `Cookie realm="Portfolio", form-action="${gate.unlock}", cookie-name="${gate.cookie}"`
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const aliases: readonly string[] = REDIRECT_DOMAINS
let warnedClosed = false

function pageResponse(options: GateOptions, form: FormState, status: number, extra: HeadersInit = {}): Response {
  const headers = new Headers(extra)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Content-Language', form.locale)
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Robots-Tag', ROBOTS)
  headers.set('Content-Security-Policy', options.csp)
  headers.set('Referrer-Policy', 'same-origin')
  headers.set('X-Content-Type-Options', 'nosniff')
  return new Response(renderPage(options.page, form), { status, headers })
}

const redirect = (location: string, status: number, extra: HeadersInit = {}) => {
  const headers = new Headers(extra)
  headers.set('Location', location)
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Robots-Tag', ROBOTS)
  return new Response(null, { status, headers })
}

/** The protected response, marked noindex and kept out of shared caches. */
function gated(response: Response, hashed: boolean): Response {
  const headers = new Headers(response.headers)
  headers.set('X-Robots-Tag', ROBOTS)
  const cacheControl = headers.get('Cache-Control')
  if (hashed && (response.status === 200 || response.status === 304))
    headers.set('Cache-Control', 'private, max-age=31536000, immutable')
  else if (cacheControl && /\bpublic\b/i.test(cacheControl))
    headers.set('Cache-Control', cacheControl.replace(/\bpublic\b/gi, 'private'))
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

async function readForm(request: Request): Promise<{ password: string; next: unknown } | null> {
  const type = request.headers.get('Content-Type') ?? ''
  const length = Number(request.headers.get('Content-Length') ?? 0)
  if (!/^application\/x-www-form-urlencoded\b|^multipart\/form-data\b/i.test(type) || length > 4 * MAX_FIELD_LENGTH)
    return null
  try {
    const form = await request.formData()
    const password = form.get('password')
    if (typeof password !== 'string' || password.length > MAX_FIELD_LENGTH) return null
    return { password, next: form.get('next') }
  } catch {
    return null
  }
}

export async function handleGate(request: Request, options: GateOptions, deps: GateDeps): Promise<Response> {
  const url = new URL(request.url)
  if (aliases.includes(url.hostname)) return redirect(`https://${PRIMARY_DOMAIN}${url.pathname}${url.search}`, 301)

  const now = deps.now?.() ?? Math.floor(Date.now() / 1000)
  const cookies = request.headers.get('Cookie')
  const locale = pickLocale(request.headers.get('Accept-Language'), readCookie(cookies, gate.langCookie))
  const still = /^on$/i.test(request.headers.get('Save-Data') ?? '')
  const show = (form: Omit<FormState, 'locale' | 'still'>, status: number, extra: Record<string, string> = {}) =>
    pageResponse(options, { ...form, locale, still }, status, { Vary: 'Accept-Language, Cookie', ...extra })

  if (url.pathname.startsWith(gate.assets)) return deps.next()
  if (url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': ROBOTS },
    })
  }
  if (url.pathname.startsWith(gate.lang)) {
    const chosen = url.pathname.slice(gate.lang.length)
    const back = safeNext(url.searchParams.get('next'), url)
    return redirect(back, 303, isLocale(chosen) ? { 'Set-Cookie': langCookie(chosen) } : {})
  }

  const password = deps.password ?? ''
  if (!password) {
    if (!warnedClosed) {
      warnedClosed = true
      ;(deps.log ?? console.error)(
        `[site-gate] ${gate.passwordEnv} is not set (it needs the Functions scope in the Netlify UI): the site is closed.`,
      )
    }
    return show({ next: '/', state: 'closed' }, 503)
  }

  if (url.pathname === gate.lock) {
    return show({ next: '/', state: 'idle' }, 200, { 'Set-Cookie': clearedCookie() })
  }

  if (url.pathname === gate.unlock) {
    if (request.method !== 'POST') return redirect('/', 303)
    if (!originAllowed(request.headers.get('Origin'), url)) return show({ next: '/', state: 'idle' }, 403)
    const form = await readForm(request)
    const next = safeNext(form?.next, url)
    if (form && (await passwordMatches(form.password, password))) {
      const cookie = await signCookie(password, now + gate.maxAgeSeconds)
      return redirect(next, 303, { 'Set-Cookie': sessionCookie(cookie) })
    }
    await (deps.wait ?? sleep)(gate.failureDelayMs)
    return show({ next, state: 'error' }, 401, { 'WWW-Authenticate': CHALLENGE })
  }

  if (await verifyCookie(password, readCookie(cookies, gate.cookie), now)) {
    const hashed = (options.immutable ?? []).some((prefix) => url.pathname.startsWith(prefix))
    return gated(await deps.next(), hashed)
  }
  const back =
    request.method === 'GET' || request.method === 'HEAD' ? safeNext(`${url.pathname}${url.search}`, url) : '/'
  return show({ next: back, state: 'idle' }, 401, { 'WWW-Authenticate': CHALLENGE })
}

type NetlifyContext = { next: (options?: { sendConditionalRequest?: boolean }) => Promise<Response> }

/** Netlify Edge Function handler (the build generates the entry that calls this). */
export function createGate(options: GateOptions) {
  return (request: Request, context: NetlifyContext) =>
    handleGate(request, options, {
      password: (globalThis as { Netlify?: { env: { get(name: string): string | undefined } } }).Netlify?.env.get(
        gate.passwordEnv,
      ),
      // Revalidations reach the static file, so an unchanged file answers 304 instead of the full body.
      next: () => context.next({ sendConditionalRequest: true }),
    })
}
