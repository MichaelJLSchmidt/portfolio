// Unit tests for the password gate: `npm test` (node:test; Node strips the types).
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { gate as de } from '../../content/de/gate.ts'
import { site as fictionalSite } from '../../content/de/site.ts'
import { gate as en } from '../../content/en/gate.ts'
import { identity } from '../../content/gate.ts'
import { PRIMARY_DOMAIN, REDIRECT_DOMAINS, gate, siteAccess } from './config.ts'
import { handleGate, type GateDeps } from './gate-handler.ts'
import {
  base64url,
  originAllowed,
  passwordMatches,
  pickGradient,
  pickLocale,
  readCookie,
  safeNext,
  signCookie,
  timingSafeEqual,
  verifyCookie,
} from './gate.ts'
import { renderPage, type GatePage } from './page.ts'

const NOW = 1_800_000_000
const PASSWORD = 'summit-test-password'
const host = new URL(`https://${PRIMARY_DOMAIN}/`)

describe('site access', () => {
  it('opens only for exactly "public"', () => {
    assert.equal(siteAccess('public'), 'public')
    for (const value of [undefined, '', 'gated', 'Public', 'live', 'true', '1'])
      assert.equal(siteAccess(value), 'gated')
  })
})

describe('cookie', () => {
  it('verifies a value it signed, until it expires', async () => {
    const value = await signCookie(PASSWORD, NOW + gate.maxAgeSeconds)
    assert.match(value, /^\d+\.[A-Za-z0-9_-]{43}$/)
    assert.equal(await verifyCookie(PASSWORD, value, NOW), true)
    assert.equal(await verifyCookie(PASSWORD, value, NOW + gate.maxAgeSeconds - 1), true)
    assert.equal(await verifyCookie(PASSWORD, value, NOW + gate.maxAgeSeconds), false)
    assert.equal(await verifyCookie(PASSWORD, value, NOW + gate.maxAgeSeconds + 3600), false)
  })

  it("refuses expiries further out than a fresh cookie's", async () => {
    const value = await signCookie(PASSWORD, NOW + 10 * gate.maxAgeSeconds)
    assert.equal(await verifyCookie(PASSWORD, value, NOW), false)
  })

  it('refuses a tampered signature or expiry', async () => {
    const value = await signCookie(PASSWORD, NOW + 3600)
    const [expiry, signature] = value.split('.')
    const flipped = signature.slice(0, -1) + (signature.endsWith('A') ? 'B' : 'A')
    assert.equal(await verifyCookie(PASSWORD, `${expiry}.${flipped}`, NOW), false)
    assert.equal(await verifyCookie(PASSWORD, `${Number(expiry) + 1}.${signature}`, NOW), false)
    assert.equal(await verifyCookie(PASSWORD, `${expiry}.${base64url(new Uint8Array(32))}`, NOW), false)
  })

  it('refuses malformed values', async () => {
    for (const value of [
      null,
      undefined,
      '',
      'abc',
      '123',
      '.',
      `${NOW + 60}.`,
      `x${NOW + 60}.${'A'.repeat(43)}`,
      `${NOW + 60}.${'A'.repeat(44)}`,
    ]) {
      assert.equal(await verifyCookie(PASSWORD, value, NOW), false, String(value))
    }
  })

  it('is invalidated by a password change (the key is derived from the password)', async () => {
    const value = await signCookie(PASSWORD, NOW + 3600)
    assert.equal(await verifyCookie(`${PASSWORD}-new`, value, NOW), false)
    assert.equal(await verifyCookie(PASSWORD, value, NOW), true)
  })

  it('reads one cookie from a Cookie header', () => {
    assert.equal(readCookie(`a=1; ${gate.cookie}=v.alue; b=2`, gate.cookie), 'v.alue')
    assert.equal(readCookie(`x${gate.cookie}=nope`, gate.cookie), null)
    assert.equal(readCookie(`${gate.langCookie}=en`, gate.cookie), null)
    assert.equal(readCookie(null, gate.cookie), null)
  })
})

describe('password comparison', () => {
  it('matches only the exact password', async () => {
    assert.equal(await passwordMatches(PASSWORD, PASSWORD), true)
    assert.equal(await passwordMatches(`${PASSWORD} `, PASSWORD), false)
    assert.equal(await passwordMatches('', PASSWORD), false)
    assert.equal(await passwordMatches('x', PASSWORD), false)
    assert.equal(await passwordMatches('', ''), false)
  })

  it('compares every byte, wherever the first difference is', () => {
    const counted = (bytes: number[]) => {
      const reads = { count: 0 }
      const array = new Proxy(new Uint8Array(bytes), {
        get(target, key) {
          if (typeof key === 'string' && /^\d+$/.test(key)) reads.count++
          const value = Reflect.get(target, key)
          return typeof value === 'function' ? value.bind(target) : value
        },
      })
      return { array, reads }
    }
    for (const differAt of [0, 15, 31, -1]) {
      const a = Array.from({ length: 32 }, (_, i) => i)
      const b = a.map((v, i) => (i === differAt ? v + 1 : v))
      const left = counted(a)
      const right = counted(b)
      assert.equal(timingSafeEqual(left.array, right.array), differAt === -1)
      assert.equal(left.reads.count, 32, `reads all bytes when bytes differ at ${differAt}`)
      assert.equal(right.reads.count, 32)
    }
    assert.equal(timingSafeEqual(new Uint8Array(2), new Uint8Array(3)), false)
  })
})

describe('next', () => {
  it('keeps same-host relative paths', () => {
    assert.equal(safeNext('/', host), '/')
    assert.equal(safeNext('/de/work/front-door/', host), '/de/work/front-door/')
    assert.equal(safeNext('/en/about/?rare', host), '/en/about/?rare')
    assert.equal(safeNext('/a/../en/about/', host), '/en/about/')
    assert.equal(safeNext('/de/work/front-door/index.htm?x=1', host), '/de/work/front-door/?x=1')
    assert.equal(safeNext('/index.html', host), '/')
  })

  it('refuses anything that could leave the host or loop back into the gate', () => {
    for (const value of [
      'https://evil.example/',
      '//evil.example/',
      '/\\evil.example/',
      '\\\\evil.example',
      'javascript:alert(1)',
      'evil.example',
      '/foo\nbar',
      '/\u0000',
      `https://${PRIMARY_DOMAIN}/`,
      gate.unlock,
      gate.lock,
      `${gate.lang}en`,
      `${gate.assets}x.woff2`,
      `/${'a'.repeat(2000)}`,
      undefined,
      null,
      42,
    ]) {
      assert.equal(safeNext(value, host), '/', String(value))
    }
  })
})

describe('origin', () => {
  it('accepts the gated host itself, or no Origin', () => {
    assert.equal(originAllowed(null, host), true)
    assert.equal(originAllowed(host.origin, host), true)
    const preview = new URL('https://deploy-preview-7--example.netlify.app/.gate/unlock')
    assert.equal(originAllowed(preview.origin, preview), true)
  })

  it('refuses every other origin, other deploys of the same site included', () => {
    const preview = new URL('https://deploy-preview-7--example.netlify.app/.gate/unlock')
    assert.equal(originAllowed(`https://${PRIMARY_DOMAIN}`, preview), false)
    for (const origin of [
      'null',
      'https://evil.example',
      `http://${PRIMARY_DOMAIN}`,
      ...REDIRECT_DOMAINS.map((d) => `https://${d}`),
      `https://${PRIMARY_DOMAIN}.evil.example`,
      '',
    ]) {
      assert.equal(originAllowed(origin, host), false, origin)
    }
  })
})

describe('language', () => {
  it("follows the site's rule on Accept-Language: German, English, other -> English, none -> German", () => {
    assert.equal(pickLocale('de-CH,de;q=0.9,en;q=0.8', null), 'de')
    assert.equal(pickLocale('en-US,en;q=0.9', null), 'en')
    assert.equal(pickLocale('fr-CH,fr;q=0.9,de;q=0.8,en;q=0.7', null), 'de')
    assert.equal(pickLocale('fr-CH,fr;q=0.9,en;q=0.8,de;q=0.7', null), 'en')
    assert.equal(pickLocale('fr-FR,fr;q=0.9', null), 'en')
    assert.equal(pickLocale('*', null), 'en')
    assert.equal(pickLocale('', null), 'de')
    assert.equal(pickLocale(null, null), 'de')
  })

  it('orders by preference and ignores q=0', () => {
    assert.equal(pickLocale('en;q=0.5,de;q=0.8', null), 'de')
    assert.equal(pickLocale('de;q=0,en', null), 'en')
    assert.equal(pickLocale('DE-ch', null), 'de')
    assert.equal(pickLocale('deu,en', null), 'en')
  })

  it('lets a choice made with the switch win', () => {
    assert.equal(pickLocale('de-CH', 'en'), 'en')
    assert.equal(pickLocale('en-US', 'de'), 'de')
    assert.equal(pickLocale('en-US', 'fr'), 'en')
  })
})

describe('logo gradient', () => {
  const names = ['ember', 'tide', 'grove', 'saffron']

  it('picks one at random, never the one the last page load showed', () => {
    assert.equal(
      pickGradient(names, null, () => 0),
      'ember',
    )
    assert.equal(
      pickGradient(names, null, () => 0.999),
      'saffron',
    )
    assert.equal(
      pickGradient(names, 'ember', () => 0),
      'tide',
    )
    for (let i = 0; i < 200; i++) assert.notEqual(pickGradient(names, 'grove'), 'grove')
    const seen = new Set(Array.from({ length: 400 }, () => pickGradient(names, null)))
    assert.deepEqual([...seen].sort(), [...names].sort())
  })

  it('ignores a last value that is not a gradient', () => {
    assert.ok(names.includes(pickGradient(names, 'nope', () => 0.5)))
    assert.equal(
      pickGradient(['ember'], 'ember', () => 0.5),
      'ember',
    )
  })
})

// --- the page ----------------------------------------------------------------------------------

const page: GatePage = {
  identity,
  copy: { de, en },
  css: '',
  script: '',
  logo: '<svg aria-hidden="true"></svg>',
  icon: 'data:,',
  themeColor: '#0E0F11',
  preload: [],
  gradients: ['ember', 'tide', 'grove', 'saffron'],
}
const options = { page, csp: "default-src 'none'" }

describe('the gate page', () => {
  it('shows the real name and links, not the fictional site persona', () => {
    assert.notEqual(identity.name, fictionalSite.name)
    assert.match(identity.email, /^[^@\s]+@[^@\s]+\.[a-z]+$/)
    assert.match(identity.linkedin, /^https:\/\/www\.linkedin\.com\/in\/[^/]+\/$/)
    const html = renderPage(page, { next: '/', state: 'idle', locale: 'en', gradient: 'tide' })
    assert.ok(html.includes(`<h1 class="name">${identity.name}</h1>`))
    assert.ok(html.includes(`href="mailto:${identity.email}"`))
    assert.ok(html.includes(`href="${identity.linkedin}" rel="me"`))
  })

  it('invites contact in both languages, with the email and LinkedIn links', () => {
    assert.equal(en.contact, 'You can reach out to me:')
    assert.equal(de.contact, 'Du kannst dich gerne bei mir melden:')
    for (const [locale, copy] of [
      ['de', de],
      ['en', en],
    ] as const) {
      const html = renderPage(page, { next: '/', state: 'idle', locale, gradient: 'ember' })
      assert.ok(
        html.includes(
          `<p class="contact">${copy.contact} <span class="ways"><a class="link" href="mailto:${identity.email}">${copy.email}</a>`,
        ),
      )
      assert.ok(html.includes(`<a class="link" href="${identity.linkedin}" rel="me">${copy.linkedin}</a></span></p>`))
    }
  })

  it('has the same words in both languages, and German follows the site rules', () => {
    assert.deepEqual(Object.keys(de).sort(), Object.keys(en).sort())
    for (const [key, value] of Object.entries(de)) {
      assert.ok(value, key)
      assert.doesNotMatch(value, /ß|—|;/, key)
    }
  })

  it('is complete without JavaScript, labelled, noindex, and in the chosen language', () => {
    for (const locale of ['de', 'en'] as const) {
      const html = renderPage(page, { next: '/en/about/', state: 'idle', locale, gradient: 'grove' })
      const copy = page.copy[locale]
      assert.match(html, new RegExp(`^<!doctype html><html lang="${locale}" data-logo-gradient="grove">`))
      assert.ok(html.includes('<meta name="robots" content="noindex, nofollow">'))
      assert.ok(html.includes(`<p class="lede">${copy.lede}</p>`))
      assert.ok(html.includes(`<form class="unlock" method="post" action="${gate.unlock}">`))
      assert.ok(html.includes(`<label for="password" class="label">${copy.label}</label>`))
      assert.ok(
        html.includes('<input id="password" name="password" type="password" autocomplete="current-password" required'),
      )
      assert.ok(html.includes('<input type="hidden" name="next" value="/en/about/">'))
      assert.doesNotMatch(html, /aria-invalid|role="alert"|autofocus/)
      // The DE·EN switch: links that work without JavaScript, the current one marked.
      assert.ok(html.includes(`aria-label="${copy.language}"`))
      assert.ok(
        html.includes(`<a href="${gate.lang}de?next=%2Fen%2Fabout%2F" hreflang="de" lang="de" data-locale="de"`),
      )
      assert.match(html, new RegExp(`data-locale="${locale}" aria-current="true">${locale.toUpperCase()}</a>`))
      assert.doesNotMatch(html, /<script src|<link rel="stylesheet"|\/_next\//)
    }
  })

  it('marks a wrong password in the field, the title and an announced message', () => {
    const html = renderPage(page, { next: '/', state: 'error', locale: 'de', gradient: 'ember' })
    assert.ok(html.includes(`<title>${de.errorTitle} · ${de.title} · ${identity.name}</title>`))
    assert.ok(html.includes('aria-invalid="true" aria-describedby="gate-error" autofocus>'))
    assert.match(
      html,
      new RegExp(
        `<p id="gate-error" class="error" role="alert"><svg [^>]*aria-hidden="true"[^>]*>.*?</svg><span>${de.error}</span></p>`,
      ),
    )
  })

  it('escapes what it prints', () => {
    const html = renderPage(page, {
      next: '/"><script>x</script>',
      state: 'idle',
      locale: 'en',
      gradient: '"><script>x</script>',
    })
    assert.doesNotMatch(html, /<script>x/)
  })
})

// --- the handler -------------------------------------------------------------------------------

function harness({ password }: { password: string | undefined } = { password: PASSWORD }) {
  const calls = { next: 0, waits: [] as number[], logs: [] as string[] }
  const deps: GateDeps = {
    password,
    now: () => NOW,
    next: async () => {
      calls.next++
      return new Response('protected', { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } })
    },
    wait: async (ms) => void calls.waits.push(ms),
    log: (message) => void calls.logs.push(message),
    random: () => 0.5,
  }
  const request = (path: string, init: RequestInit = {}, base: URL = host) =>
    handleGate(new Request(new URL(path, base), init), options, deps)
  const unlock = (body: Record<string, string>, headers: Record<string, string> = {}) =>
    request(gate.unlock, { method: 'POST', body: new URLSearchParams(body), headers })
  return { calls, request, unlock }
}

const cookieFrom = (response: Response) => response.headers.get('Set-Cookie')!.split(';')[0]
/** The session cookie a response sets, if any (gate pages also set the logo gradient's). */
const session = (response: Response) =>
  response.headers.getSetCookie().find((c) => c.startsWith(`${gate.cookie}=`)) ?? null
/** Copy as the page prints it (apostrophes escaped). */
const printed = (text: string) => text.replaceAll("'", '&#39;')

describe('gate handler', () => {
  it('shows the gate page for any path without a valid cookie', async () => {
    const { calls, request } = harness()
    for (const path of [
      '/',
      '/de/',
      '/en/work/front-door/',
      '/_next/static/chunks/app.js',
      '/images/about-og-1280.jpg',
      '/terrain/field.webp',
      '/de/index.txt?_rsc=1',
      '/404.html',
      '/no/such/page/',
      `${gate.assetsDir}x.woff2`,
    ]) {
      const res = await request(path)
      assert.equal(res.status, 401, path)
      assert.match(res.headers.get('WWW-Authenticate')!, /^Cookie realm="Portfolio"/)
      assert.equal(res.headers.get('Cache-Control'), 'no-store')
      assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow')
      assert.match(res.headers.get('Content-Type')!, /^text\/html/)
      assert.equal(res.headers.get('Content-Security-Policy'), options.csp)
      const html = await res.text()
      assert.ok(html.includes(`<form class="unlock" method="post" action="${gate.unlock}">`))
      assert.doesNotMatch(html, /protected/)
    }
    assert.equal(calls.next, 0)
    const res = await request('/en/work/front-door/?a=1')
    assert.match(await res.text(), /name="next" value="\/en\/work\/front-door\/\?a=1"/)
  })

  it('answers in the language Accept-Language asks for, or the one chosen with the switch', async () => {
    const { request } = harness()
    const lang = async (headers: Record<string, string>) => {
      const res = await request('/', { headers })
      return [res.headers.get('Content-Language'), /<html lang="(\w+)"/.exec(await res.text())?.[1]]
    }
    assert.deepEqual(await lang({ 'Accept-Language': 'de-CH,de;q=0.9' }), ['de', 'de'])
    assert.deepEqual(await lang({ 'Accept-Language': 'en-GB' }), ['en', 'en'])
    assert.deepEqual(await lang({ 'Accept-Language': 'it-CH,it;q=0.9' }), ['en', 'en'])
    assert.deepEqual(await lang({}), ['de', 'de'])
    assert.deepEqual(await lang({ 'Accept-Language': 'de-CH', Cookie: `${gate.langCookie}=en` }), ['en', 'en'])
  })

  it('remembers a language switch and goes back to the page', async () => {
    const { calls, request } = harness()
    const res = await request(`${gate.lang}en?next=${encodeURIComponent('/de/about/?x=1')}`)
    assert.equal(res.status, 303)
    assert.equal(res.headers.get('Location'), '/de/about/?x=1')
    const setCookie = res.headers.get('Set-Cookie')!
    assert.ok(setCookie.startsWith(`${gate.langCookie}=en; `))
    for (const attribute of ['Path=/', 'Secure', 'HttpOnly', 'SameSite=Lax'])
      assert.ok(setCookie.split('; ').includes(attribute))
    const unsafe = await request(`${gate.lang}de?next=${encodeURIComponent('https://evil.example/')}`)
    assert.equal(unsafe.headers.get('Location'), '/')
    const unknown = await request(`${gate.lang}fr?next=/`)
    assert.equal(unknown.status, 303)
    assert.equal(unknown.headers.get('Set-Cookie'), null)
    assert.equal(calls.next, 0)
  })

  it('sends domain aliases to the primary domain first, path and query kept, before any cookie', async () => {
    const { calls, request } = harness()
    for (const domain of REDIRECT_DOMAINS) {
      for (const path of ['/', '/en/about/?x=1', gate.unlock, `${gate.assets}x.woff2`, '/robots.txt']) {
        const res = await request(path, {}, new URL(`https://${domain}/`))
        assert.equal(res.status, 301, `${domain}${path}`)
        assert.equal(res.headers.get('Location'), `https://${PRIMARY_DOMAIN}${path}`)
        assert.equal(res.headers.get('Set-Cookie'), null)
      }
      const post = await request(
        gate.unlock,
        { method: 'POST', body: new URLSearchParams({ password: PASSWORD, next: '/' }) },
        new URL(`https://${domain}/`),
      )
      assert.equal(post.status, 301)
      assert.equal(post.headers.get('Set-Cookie'), null)
    }
    assert.equal(calls.next, 0)
  })

  it("lets the gate's own assets through and answers robots.txt itself", async () => {
    const { calls, request } = harness()
    assert.equal(await (await request(`${gate.assets}gate.woff2`)).text(), 'protected')
    assert.equal(calls.next, 1)
    const robots = await request('/robots.txt')
    assert.equal(await robots.text(), 'User-agent: *\nDisallow: /\n')
    assert.equal(robots.headers.get('X-Robots-Tag'), 'noindex, nofollow')
    assert.equal(calls.next, 1)
  })

  it('unlocks with the right password: cookie, then 303 to next', async () => {
    const { calls, unlock, request } = harness()
    const res = await unlock({ password: PASSWORD, next: '/en/work/front-door/' }, { Origin: host.origin })
    assert.equal(res.status, 303)
    assert.equal(res.headers.get('Location'), '/en/work/front-door/')
    const setCookie = res.headers.get('Set-Cookie')!
    assert.match(setCookie, new RegExp(`^${gate.cookie.replace('-', '\\-')}=\\d+\\.[A-Za-z0-9_-]{43}; `))
    for (const attribute of ['Path=/', `Max-Age=${gate.maxAgeSeconds}`, 'Secure', 'HttpOnly', 'SameSite=Lax']) {
      assert.ok(setCookie.split('; ').includes(attribute), attribute)
    }
    assert.doesNotMatch(setCookie, /Domain=/i)
    assert.deepEqual(calls.waits, [])

    const inside = await request('/en/work/front-door/', { headers: { Cookie: cookieFrom(res) } })
    assert.equal(await inside.text(), 'protected')
    assert.equal(inside.headers.get('X-Robots-Tag'), 'noindex, nofollow')
    assert.equal(inside.headers.get('Cache-Control'), 'private, max-age=31536000, immutable')
  })

  it('keeps content-hashed files cacheable for a year, private; everything else as the host sends it, private', async () => {
    const { unlock } = harness()
    const cookie = cookieFrom(await unlock({ password: PASSWORD, next: '/' }))
    const deps: GateDeps = {
      password: PASSWORD,
      now: () => NOW,
      next: async () => new Response('file', { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } }),
    }
    const withImmutable = { ...options, immutable: ['/_next/static/'] }
    const get = (path: string) =>
      handleGate(new Request(new URL(path, host), { headers: { Cookie: cookie } }), withImmutable, deps)
    assert.equal(
      (await get('/_next/static/chunks/a.js')).headers.get('Cache-Control'),
      'private, max-age=31536000, immutable',
    )
    assert.equal((await get('/images/a.jpg')).headers.get('Cache-Control'), 'private, max-age=0, must-revalidate')
    assert.equal((await get('/de/')).headers.get('Cache-Control'), 'private, max-age=0, must-revalidate')
  })

  it('redirects to / when next is unsafe', async () => {
    const { unlock } = harness()
    const res = await unlock({ password: PASSWORD, next: 'https://evil.example/' })
    assert.equal(res.headers.get('Location'), '/')
  })

  it('waits, then shows the gate again with an announced error on a wrong password', async () => {
    const { calls, unlock } = harness()
    const res = await unlock({ password: 'wrong', next: '/en/about/' }, { 'Accept-Language': 'en' })
    assert.deepEqual(calls.waits, [gate.failureDelayMs])
    assert.equal(res.status, 401)
    assert.equal(session(res), null)
    assert.equal(res.headers.get('Cache-Control'), 'no-store')
    const html = await res.text()
    assert.ok(html.includes(`role="alert"`))
    assert.ok(html.includes(`<span>${printed(en.error)}</span>`))
    assert.ok(html.includes(`<button type="submit" data-pending="${en.pending}">${en.submit}<svg`))
    assert.ok(html.includes('aria-invalid="true" aria-describedby="gate-error"'))
    assert.match(html, /name="next" value="\/en\/about\/"/)
  })

  it('refuses an unlock from any other origin, the primary domain included when it is not this host', async () => {
    const { calls, unlock, request } = harness()
    for (const origin of ['https://evil.example', 'null', `https://www.${PRIMARY_DOMAIN}`]) {
      const res = await unlock({ password: PASSWORD, next: '/' }, { Origin: origin })
      assert.equal(res.status, 403)
      assert.equal(session(res), null)
    }
    const preview = new URL('https://deploy-preview-7--example.netlify.app/')
    const cross = await request(
      gate.unlock,
      {
        method: 'POST',
        body: new URLSearchParams({ password: PASSWORD, next: '/' }),
        headers: { Origin: host.origin },
      },
      preview,
    )
    assert.equal(cross.status, 403)
    assert.equal(calls.next, 0)
    const own = await unlock({ password: PASSWORD, next: '/' }, { Origin: host.origin })
    assert.equal(own.status, 303)
  })

  it('answers GET on the unlock path with a redirect home', async () => {
    const { request } = harness()
    const res = await request(gate.unlock)
    assert.equal(res.status, 303)
    assert.equal(res.headers.get('Location'), '/')
  })

  it('locks: clears the cookie and shows the gate page', async () => {
    const { unlock, request } = harness()
    const cookie = cookieFrom(await unlock({ password: PASSWORD, next: '/' }))
    const res = await request(gate.lock, { headers: { Cookie: cookie } })
    assert.equal(res.status, 200)
    assert.equal(session(res), `${gate.cookie}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`)
    assert.match(await res.text(), /<form class="unlock" method="post"/)
  })

  it('logs everyone out when the password changes', async () => {
    const before = harness()
    const cookie = cookieFrom(await before.unlock({ password: PASSWORD, next: '/' }))
    const after = harness({ password: `${PASSWORD}-rotated` })
    const res = await after.request('/', { headers: { Cookie: cookie } })
    assert.equal(res.status, 401)
    assert.equal(after.calls.next, 0)
  })

  it('keeps the field still when the request asks to save data', async () => {
    const { request } = harness()
    assert.match(
      await (await request('/', { headers: { 'Save-Data': 'on' } })).text(),
      /<html lang="de" data-logo-gradient="\w+" data-motion="still">/,
    )
    assert.match(await (await request('/')).text(), /<html lang="de" data-logo-gradient="\w+">/)
  })

  it('fails closed without a password: the page without the form, 503, one log line', async () => {
    const { calls, request, unlock } = harness({ password: undefined })
    for (const [locale, copy] of [
      ['de', de],
      ['en', en],
    ] as const) {
      const res = await request('/en/about/', { headers: { 'Accept-Language': locale } })
      assert.equal(res.status, 503)
      assert.equal(res.headers.get('Cache-Control'), 'no-store')
      assert.equal(session(res), null)
      const html = await res.text()
      // The same layout: logo, name, the sentence, the way to get in touch; no form, no extra line.
      assert.ok(html.includes(`<div class="mark">`))
      assert.ok(html.includes(`<h1 class="name">${identity.name}</h1>`))
      assert.ok(html.includes(`<p class="lede">${copy.lede}</p><p class="contact">${copy.contact} `))
      assert.doesNotMatch(html, /<form|class="closed"|<label|type="password"/)
    }
    assert.equal((await unlock({ password: '', next: '/' })).status, 503)
    assert.equal((await request(gate.lock)).status, 503)
    assert.equal(calls.next, 0)
    assert.equal(calls.logs.length, 1)
    assert.ok(calls.logs[0].includes(gate.passwordEnv))
  })

  it('shows a logo gradient per page load, never the last one, and remembers it in a cookie', async () => {
    const { request } = harness()
    const res = await request('/', { headers: { Cookie: `${gate.logoCookie}=grove` } })
    const html = await res.text()
    const shown = /<html [^>]*data-logo-gradient="(\w+)"/.exec(html)?.[1]
    assert.ok(shown && page.gradients.includes(shown) && shown !== 'grove', shown)
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith(`${gate.logoCookie}=`))!
    assert.equal(cookie.split(';')[0], `${gate.logoCookie}=${shown}`)
    for (const attribute of ['Path=/', 'Secure', 'HttpOnly', 'SameSite=Lax'])
      assert.ok(cookie.split('; ').includes(attribute))
    // A forged cookie value never reaches the page.
    const forged = await (await request('/', { headers: { Cookie: `${gate.logoCookie}="><script>` } })).text()
    assert.match(forged, /<html lang="de" data-logo-gradient="(ember|tide|grove|saffron)">/)
  })
})
