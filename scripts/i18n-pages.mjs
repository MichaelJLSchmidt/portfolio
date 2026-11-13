// Runs after `next build` (package.json "build"):
//
//   <html lang>      every page under dist/<locale>/ gets lang="<locale>": the root layout is shared
//                    by both locales (it never remounts, so a language switch keeps the field and
//                    <html> as they are) and cannot read the locale; on the client LocaleSync keeps
//                    the attribute in step
//
// and writes the two pages that live outside the locales:
//
//   dist/index.html  the root (/random/): a tiny inline script picks the language and replaces the
//                    URL with /random/<locale>/ before anything paints; without JavaScript, plain
//                    links to both languages
//   dist/404.html    GitHub Pages serves it for every unknown address. The address's own locale
//                    wins (/random/en/… is English whatever the stored or browser language); only
//                    an address without one is decided by the same script as the root. Such an
//                    address from before the locales (e.g. /random/about/) moves to the same page
//                    in that language when it exists. Otherwise it loads that locale's 404 page
//                    (/random/<locale>/404/) and writes it into the document, so the address
//                    stays; without JavaScript, or if the page cannot load, a short note in both
//                    languages with links home
//
// The language rule is src/lib/i18n.ts (pickLocaleScript): a stored choice wins, then the first of
// navigator.languages that starts with "de" or "en"; other languages get English, none get German.
// Next's own fallback 404 (dist/404/, dist/_not-found/) is removed. BASE_PATH is read here, at
// build time, like next.config.ts does; nothing hard-codes a leading slash.
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { load, root } from './load-ts.mjs'

const dist = join(root, 'dist')
const { defaultLocale, localeNames, locales, pickLocaleScript } = await load('src/lib/i18n.ts')
const { palette, text } = await load('src/design/palette.ts')
const copy = Object.fromEntries(
  await Promise.all(
    locales.map(async (locale) => {
      const { site } = await load(`content/${locale}/site.ts`)
      const { notFound } = await load(`content/${locale}/pages/not-found.ts`)
      return [locale, { site, notFound }]
    }),
  ),
)

const base = `${(process.env.BASE_PATH ?? '').replace(/\/+$/, '')}/`
const origin = (() => {
  try {
    return process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : null
  } catch {
    return null
  }
})()
const url = (path) => `${origin ?? ''}${base}${path}`
const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// The favicon as Next emitted it (hashed), so both pages show the same tab icon.
const icon = /<link rel="icon"[^>]*>/.exec(readFileSync(join(dist, defaultLocale, 'index.html'), 'utf8'))?.[0] ?? ''

const head = (title, extra = '') => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${palette.ink.field}">
<meta name="color-scheme" content="dark">
<title>${escape(title)}</title>
${icon}
${extra}<style>html{background:${palette.ink.field};color:${text};color-scheme:dark}body{margin:0;font:1rem/1.6 system-ui,sans-serif}main{max-width:36rem;padding:20vh clamp(20px,5.3vw,48px)}p{margin:0 0 1rem}ul{display:flex;gap:1.5rem;margin:0;padding:0;list-style:none}a{display:inline-flex;align-items:center;min-height:44px;color:inherit;text-underline-offset:0.25em}</style>`

const homeLinks = () =>
  `<ul>${locales
    .map((l) => `<li><a href="${base}${l}/" hreflang="${l}" lang="${l}">${escape(localeNames[l])}</a></li>`)
    .join('')}</ul>`

// ---------------------------------------------------------------- root
const alternates = [
  ...locales.map((l) => `<link rel="alternate" hreflang="${l}" href="${url(`${l}/`)}">`),
  `<link rel="alternate" hreflang="x-default" href="${url('')}">`,
].join('\n')
const name = copy[defaultLocale].site.name
const index = `<!doctype html>
<html lang="${defaultLocale}">
<head>
${head(name, `${alternates}\n`)}
<script>location.replace(${JSON.stringify(base)}+${pickLocaleScript}+"/"+location.search+location.hash)</script>
</head>
<body>
<noscript><main><p>${escape(name)}</p>${homeLinks()}</main></noscript>
</body>
</html>
`

// ---------------------------------------------------------------- 404
const notFound = `<!doctype html>
<html lang="${defaultLocale}">
<head>
${head(locales.map((l) => copy[l].notFound.title).join(' · '))}
<script>(function(){var d=document.documentElement,b=${JSON.stringify(base)},p=location.pathname,rest=p.indexOf(b)===0?p.slice(b.length):"",m=/^(${locales.join('|')})(?=[/]|$)/.exec(rest),l=m?m[1]:${pickLocaleScript},old=rest&&!m;d.lang=l;d.setAttribute("data-js","");function lost(){fetch(b+l+"/404/").then(function(r){if(!r.ok)throw r;return r.text()}).then(function(h){document.open();document.write(h);document.close()}).catch(function(){d.removeAttribute("data-js")})}if(!old)return lost();fetch(b+l+"/"+rest,{method:"HEAD"}).then(function(r){if(!r.ok)throw r;location.replace(b+l+"/"+rest+location.search+location.hash)}).catch(lost)})()</script>
<style>[data-js] main{display:none}</style>
</head>
<body>
<main>${locales
  .map(
    (l) =>
      `<p lang="${l}">${escape(copy[l].notFound.title)} <a href="${base}${l}/">${escape(copy[l].notFound.back)}</a></p>`,
  )
  .join('')}</main>
</body>
</html>
`

// ---------------------------------------------------------------- <html lang>
let pages = 0
for (const locale of locales) {
  for (const entry of readdirSync(join(dist, locale), { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue
    const file = join(entry.parentPath, entry.name)
    const html = readFileSync(file, 'utf8')
    const tag = /<html\b[^>]*>/i.exec(html)?.[0]
    if (!tag) throw new Error(`${file}: no <html> element`)
    const lang = /\slang="([^"]*)"/.exec(tag)?.[1]
    if (lang && lang !== locale) throw new Error(`${file}: <html lang="${lang}"> under /${locale}/`)
    if (!lang) writeFileSync(file, html.replace(tag, tag.replace(/^<html/i, `<html lang="${locale}"`)))
    pages++
  }
}

writeFileSync(join(dist, 'index.html'), index)
writeFileSync(join(dist, '404.html'), notFound)
for (const dir of ['404', '_not-found']) rmSync(join(dist, dir), { recursive: true, force: true })
console.log(
  `i18n pages: lang on ${pages} pages, dist/index.html (language choice), dist/404.html (404 in ${locales.join(' / ')}), base ${base}`,
)
