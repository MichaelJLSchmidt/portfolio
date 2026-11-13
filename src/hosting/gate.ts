import { defaultLocale, fallbackLocale, isLocale, type Locale } from '../lib/i18n.ts'
import { gate } from './config.ts'

/*
 * The password gate's logic, free of any Netlify API so Node's test runner covers it: cookie
 * signing and verification, password comparison, the `next` and Origin checks, the language
 * choice. Web Crypto only (global in Deno and Node).
 *
 * Cookie value: `<expiry>.<signature>`, expiry in Unix seconds, signature the base64url
 * HMAC-SHA-256 of "gate:<expiry>". The HMAC key is derived from the password (PBKDF2), so
 * changing the password invalidates every cookie.
 */

const encoder = new TextEncoder()

/** PBKDF2 rounds for the cookie key: ~10 ms once per password per isolate, then cached. */
const KEY_ITERATIONS = 50_000
const KEY_SALT = 'site-gate:cookie-key:v1'
/** Longest password and form field the gate reads. */
export const MAX_FIELD_LENGTH = 1024

const COOKIE_VALUE = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/

export function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

// One derived key per isolate; a new password replaces it.
let cachedKey: { password: string; key: Promise<CryptoKey> } | null = null

export function cookieKey(password: string): Promise<CryptoKey> {
  if (cachedKey?.password === password) return cachedKey.key
  const key = crypto.subtle
    .importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])
    .then((material) =>
      crypto.subtle.deriveKey(
        { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(KEY_SALT), iterations: KEY_ITERATIONS },
        material,
        { name: 'HMAC', hash: 'SHA-256', length: 256 },
        false,
        ['sign', 'verify'],
      ),
    )
  cachedKey = { password, key }
  return key
}

const signedText = (expiry: number) => encoder.encode(`gate:${expiry}`)

/** A cookie value valid until `expiry` (Unix seconds). */
export async function signCookie(password: string, expiry: number): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await cookieKey(password), signedText(expiry))
  return `${expiry}.${base64url(new Uint8Array(signature))}`
}

/**
 * True for an untampered value signed with this password that has not expired. Expiries further
 * out than a fresh cookie's are refused too. The signature check is crypto.subtle.verify, which
 * compares in constant time.
 */
export async function verifyCookie(password: string, value: string | null | undefined, now: number): Promise<boolean> {
  const match = COOKIE_VALUE.exec(value ?? '')
  if (!match) return false
  const expiry = Number(match[1])
  if (expiry <= now || expiry > now + gate.maxAgeSeconds + 300) return false
  return crypto.subtle.verify('HMAC', await cookieKey(password), fromBase64url(match[2]), signedText(expiry))
}

/** Byte-wise comparison whose running time depends only on the length. */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/**
 * Compares the submitted password in constant time: both sides are hashed first, so the
 * comparison always runs over 32 bytes and reveals neither content nor length.
 */
export async function passwordMatches(given: string, expected: string): Promise<boolean> {
  const digest = async (text: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text)))
  const [a, b] = await Promise.all([digest(given), digest(expected)])
  return timingSafeEqual(a, b) && expected.length > 0
}

/**
 * Where to go after unlocking: a same-host relative path (directory index files as their
 * directory), or "/". Absolute and protocol-relative URLs, backslashes, control characters and
 * the gate's own paths are refused.
 */
export function safeNext(value: unknown, requestUrl: URL): string {
  if (typeof value !== 'string' || value.length > MAX_FIELD_LENGTH) return '/'
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return '/'
  let target: URL
  try {
    target = new URL(value, requestUrl.origin)
  } catch {
    return '/'
  }
  if (target.origin !== requestUrl.origin || target.pathname.startsWith(gate.prefix)) return '/'
  // Netlify's local server hands directory requests to edge functions as …/index.htm(l).
  return `${target.pathname.replace(/\/index\.html?$/, '/')}${target.search}`
}

/**
 * The unlock form is posted from the gated host itself (same origin), or by a client that sends
 * no Origin. Anything else ("null" included) is refused.
 */
export function originAllowed(origin: string | null, requestUrl: URL): boolean {
  return origin === null || origin === requestUrl.origin
}

/** One cookie from a Cookie header. */
export function readCookie(header: string | null, name: string): string | null {
  for (const part of (header ?? '').split(';')) {
    const eq = part.indexOf('=')
    if (eq > 0 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim()
  }
  return null
}

export function sessionCookie(value: string): string {
  return `${gate.cookie}=${value}; Path=/; Max-Age=${gate.maxAgeSeconds}; Secure; HttpOnly; SameSite=Lax`
}

export function clearedCookie(): string {
  return `${gate.cookie}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`
}

export function langCookie(locale: Locale): string {
  return `${gate.langCookie}=${locale}; Path=/; Max-Age=${gate.langMaxAgeSeconds}; Secure; HttpOnly; SameSite=Lax`
}

/**
 * The gate page's language, by the site's language rule (src/lib/i18n.ts) decided on the server:
 * a choice made with the switch (its cookie) wins; otherwise the Accept-Language entries in order
 * of preference (q=0 ignored), the first German or English one; English when there are languages
 * but none of them; German when there are none.
 */
export function pickLocale(acceptLanguage: string | null, chosen: string | null): Locale {
  if (isLocale(chosen)) return chosen
  const entries = (acceptLanguage ?? '')
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => /^\s*q\s*=\s*([\d.]+)\s*$/i.exec(p)).find(Boolean)
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q[1]) : 1, index }
    })
    .filter((e) => e.tag && !(e.q <= 0) && !Number.isNaN(e.q))
    .sort((a, b) => b.q - a.q || a.index - b.index)
  for (const { tag } of entries) {
    const primary = tag.split('-')[0]
    if (isLocale(primary)) return primary
  }
  return entries.length ? fallbackLocale : defaultLocale
}
