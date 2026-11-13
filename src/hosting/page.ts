import { locales, type Locale } from '../lib/i18n.ts'
import { gate } from './config.ts'

/*
 * The password gate's page: pure string templating, so the build (Node) and the edge function
 * (Deno) share it. The build assembles the model (scripts/hosting/gate-page.mjs) from the copy in
 * content/ (content/gate.ts, content/<locale>/gate.ts), the site's tokens, fonts and logo, and
 * passes it to the edge function as JSON. Complete without JavaScript: the inline script only
 * shows the pending label while the password is checked and remembers a language switch for the
 * site.
 */

/** One language's words on the gate page (content/<locale>/gate.ts). */
export type GateCopy = {
  /** The tab title (the name follows it). */
  title: string
  /** One sentence: the portfolio is being reworked and needs a password. */
  lede: string
  /** The password field's label. */
  label: string
  submit: string
  /** The submit button's label while the password is checked (inline script). */
  pending: string
  /** Shown under the field after a wrong password, and announced. */
  error: string
  /** The tab title's prefix after a wrong password. */
  errorTitle: string
  /** Shown instead of the form while no password is configured. */
  closed: string
  /** Leads into the email and LinkedIn links, for visitors without a password. */
  contact: string
  email: string
  linkedin: string
  /** The language switch's accessible name. */
  language: string
}

/** The real name and links (content/gate.ts), the same in every language. */
export type GateIdentity = { name: string; email: string; linkedin: string }

export type GatePage = {
  identity: GateIdentity
  copy: Record<Locale, GateCopy>
  /** Inline <style> and <script> bodies; the build lists their hashes in the CSP. */
  css: string
  script: string
  /** Inline SVG of the site's logo (decorative). */
  logo: string
  /** The tab icon as a data: URL. */
  icon: string
  themeColor: string
  /** Font URLs to preload. */
  preload: string[]
}

export type FormState = {
  /** Path to open after unlocking. */
  next: string
  /** idle: the form; error: the form after a wrong password; closed: no form (no password set). */
  state: 'idle' | 'error' | 'closed'
  locale: Locale
  /** No ambient motion (the request asked to save data). */
  still?: boolean
}

/** For password managers: the gate has no accounts and ignores it. */
const USERNAME = 'portfolio'
/** The submit button's arrow (an SVG: the fonts' Latin subsets have no →). */
const ARROW = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 4l4 4-4 4"/></svg>`

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const switchHref = (locale: Locale, next: string) => `${gate.lang}${locale}?next=${encodeURIComponent(next)}`

function languageSwitch(page: GatePage, form: FormState): string {
  const items = locales.map((l) => {
    const current = l === form.locale ? ' aria-current="true"' : ''
    return `<li><a href="${escapeHtml(switchHref(l, form.next))}" hreflang="${l}" lang="${l}" data-locale="${l}"${current}>${l.toUpperCase()}</a></li>`
  })
  return `<nav class="language" aria-label="${escapeHtml(page.copy[form.locale].language)}"><ul>${items.join('')}</ul></nav>`
}

function unlockForm(copy: GateCopy, form: FormState): string {
  if (form.state === 'closed') return `<p class="closed">${escapeHtml(copy.closed)}</p>`
  const error = form.state === 'error'
  return [
    `<form class="unlock" method="post" action="${gate.unlock}">`,
    `<input type="hidden" name="next" value="${escapeHtml(form.next)}">`,
    `<input type="text" name="username" value="${USERNAME}" autocomplete="username" hidden>`,
    `<label for="password" class="label">${escapeHtml(copy.label)}</label>`,
    `<div class="row">`,
    `<input id="password" name="password" type="password" autocomplete="current-password" required maxlength="1024"`,
    error ? ` aria-invalid="true" aria-describedby="gate-error" autofocus>` : '>',
    `<button type="submit" data-pending="${escapeHtml(copy.pending)}">${escapeHtml(copy.submit)}${ARROW}</button>`,
    `</div>`,
    error
      ? `<p id="gate-error" class="error" role="alert"><svg viewBox="0 0 18 18" aria-hidden="true" focusable="false"><circle cx="9" cy="9" r="7.5"/><path d="M9 4.8v5.4M9 12.4v.8"/></svg><span>${escapeHtml(copy.error)}</span></p>`
      : '',
    `</form>`,
  ].join('')
}

function contact(page: GatePage, copy: GateCopy): string {
  const { email, linkedin } = page.identity
  return [
    `<p class="contact">${escapeHtml(copy.contact)} <span class="ways">`,
    `<a class="link" href="mailto:${escapeHtml(email)}">${escapeHtml(copy.email)}</a>`,
    `<span class="dot" aria-hidden="true"> · </span>`,
    `<a class="link" href="${escapeHtml(linkedin)}" rel="me">${escapeHtml(copy.linkedin)}</a></span></p>`,
  ].join('')
}

export function renderPage(page: GatePage, form: FormState): string {
  const copy = page.copy[form.locale]
  const title = `${copy.title} · ${page.identity.name}`
  const head = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
    `<title>${escapeHtml(form.state === 'error' ? `${copy.errorTitle} · ${title}` : title)}</title>`,
    `<meta name="robots" content="noindex, nofollow">`,
    `<meta name="color-scheme" content="dark">`,
    `<meta name="theme-color" content="${escapeHtml(page.themeColor)}">`,
    `<link rel="icon" href="${escapeHtml(page.icon)}">`,
    ...page.preload.map(
      (href) => `<link rel="preload" href="${escapeHtml(href)}" as="font" type="font/woff2" crossorigin>`,
    ),
    `<style>${page.css}</style>`,
  ]
  // The colour field: three pools, each drifting on its own loop, breathing together (CSS only).
  const field = `<div class="field" aria-hidden="true"><div class="breath">${[1, 2, 3]
    .map((n) => `<div class="drift drift-${n}"><div class="pool pool-${n}"></div></div>`)
    .join('')}</div></div>`
  const body = [
    field,
    `<header class="top">${languageSwitch(page, form)}</header>`,
    `<main class="gate">`,
    `<div class="mark">${page.logo}</div>`,
    `<h1 class="name">${escapeHtml(page.identity.name)}</h1>`,
    `<p class="lede">${escapeHtml(copy.lede)}</p>`,
    unlockForm(copy, form),
    contact(page, copy),
    `</main>`,
    `<script>${page.script}</script>`,
  ]
  const motion = form.still ? ' data-motion="still"' : ''
  return `<!doctype html><html lang="${form.locale}"${motion}><head>${head.join('')}</head><body>${body.join('')}</body></html>\n`
}
