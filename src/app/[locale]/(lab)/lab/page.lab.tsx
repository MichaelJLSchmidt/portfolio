import type { Metadata } from 'next'
import Link from 'next/link'
import { site } from '@content/en/site'
import { checkLabPages, labPages, labRoutes } from '@/lab/pages'
import { checks, eggList, gatePaths, storedValues, urlFlags } from '@/lab/shortcuts'
import { CopyIds, StoredValue, TierBadge } from '@/lab/ui/client'
import { LabFrame, Source } from '@/lab/ui/frame'
import { getContent } from '@/lib/content'
import { type Locale, localeHref } from '@/lib/i18n'
import { setRequestLocale } from '@/lib/request-locale'
import { withBase } from '@/lib/site'
import { NAV } from '@/motion/transitions'

export const metadata: Metadata = { title: 'Lab', robots: { index: false, follow: false } }

/** A full page load of `path` (with an optional query) in `locale`: load-time eggs run again. */
const pageUrl = (locale: Locale, path: string) => {
  const [page, query] = path.split('?')
  const href = localeHref(locale, page).replace(/\/?$/, '/')
  return withBase(query === undefined ? href : `${href}?${query}`)
}

/*
 * The lab overview: every testing page and every test shortcut, read from the code (src/lab/pages.ts,
 * src/lab/shortcuts.ts). Links to the site's own pages are plain links (a full page load), so the
 * eggs that run when a page loads (the rare pull, the idle hint, the first-visit intro) run again.
 */
export default async function LabPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale)
  const { locale, href } = await getContent()
  checkLabPages()
  const routes = labRoutes()
  const flags = urlFlags()
  const stored = storedValues()
  return (
    <LabFrame
      path="/lab"
      title="Lab"
      intro="Internal testing pages and the shortcuts that force a state. Temporary: none of it exists in a public build (SITE_ACCESS=public)."
    >
      <CopyIds />
      <section className="tool-section" aria-labelledby="lab-pages">
        <h2 id="lab-pages" className="t-h3">
          Testing pages
        </h2>
        <ul className="tool-cards">
          {labPages.map((p) => {
            const route = routes.find((r) => r.path === p.path)!
            return (
              <li key={p.path} className="tool-card">
                <Link
                  href={href(p.path)}
                  className="link link-standalone t-lead"
                  transitionTypes={[NAV]}
                  prefetch={p.path === '/lab/inventory' ? false : undefined}
                >
                  {p.title}
                </Link>
                <p className="tool-line">{p.purpose}</p>
                <p className="tool-meta">
                  <code>{localeHref(locale, p.path)}/</code> · <Source file={route.file} />
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="tool-section" aria-labelledby="lab-flags">
        <h2 id="lab-flags" className="t-h3">
          URL flags
        </h2>
        <p className="tool-line">Every flag the code reads from the address. Each link is a full page load.</p>
        <table className="tool-table">
          <thead>
            <tr>
              <th scope="col">Flag</th>
              <th scope="col">What it does</th>
              <th scope="col">Try it</th>
              <th scope="col">Read in</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.flag}>
                <th scope="row">
                  <code>?{f.kind === 'get' ? `${f.flag}=…` : f.flag}</code>
                </th>
                <td>{f.note || '(no comment in the code)'}</td>
                <td>
                  <ul className="tool-inline">
                    {f.links.map((l) => (
                      <li key={l}>
                        <a className="link" href={pageUrl(locale, l)}>
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <Source file={f.file} line={f.line} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tool-section" aria-labelledby="lab-keys">
        <h2 id="lab-keys" className="t-h3">
          Keyboard
        </h2>
        <p className="tool-line">
          The site&rsquo;s own shortcut sheet (press <kbd>?</kbd> on any page), from{' '}
          <Source file="content/en/site.ts" name="site.shortcuts.items" />.
        </p>
        <dl className="tool-keys">
          {site.shortcuts.items.map((row) => (
            <div key={row.keys}>
              <dt>
                <kbd>{row.keys}</kbd>
              </dt>
              <dd>{row.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="tool-section" aria-labelledby="lab-eggs">
        <h2 id="lab-eggs" className="t-h3">
          Easter eggs
        </h2>
        <p className="tool-line">
          Every egg in <Source file="src/eggs/registry.ts" name="eggs" />, with its trigger and the page to try it on.
        </p>
        <table className="tool-table">
          <thead>
            <tr>
              <th scope="col">Egg</th>
              <th scope="col">Trigger</th>
              <th scope="col">Full motion</th>
              <th scope="col">Reduced</th>
              <th scope="col">Try it</th>
            </tr>
          </thead>
          <tbody>
            {eggList().map((e) => (
              <tr key={e.name}>
                <th scope="row">
                  <code>{e.name}</code>
                  {e.on ? null : <span className="tool-off"> off</span>}
                </th>
                <td>{e.trigger}</td>
                <td>{e.full}</td>
                <td>{e.reduced}</td>
                <td>
                  <a className="link" href={pageUrl(locale, e.path)}>
                    {e.path}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tool-section" aria-labelledby="lab-stored">
        <h2 id="lab-stored" className="t-h3">
          Stored state
        </h2>
        <p className="tool-line">
          What the site remembers in this browser (every <code>*_KEY</code> it stores). Clear one to see its first time
          again, e.g. <code>table-drawn</code> for the home intro.
        </p>
        <table className="tool-table">
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">Storage</th>
              <th scope="col">What it is</th>
              <th scope="col">Now</th>
              <th scope="col">Defined in</th>
            </tr>
          </thead>
          <tbody>
            {stored.map((s) => (
              <tr key={s.key}>
                <th scope="row">
                  <code>{s.key}</code>
                </th>
                <td>{s.storage}</td>
                <td>{s.note || `(no comment in the code: ${s.constant})`}</td>
                <td>
                  <StoredValue storage={s.storage} name={s.key} />
                </td>
                <td>
                  <Source file={s.file} line={s.line} name={s.constant} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tool-section" aria-labelledby="lab-motion">
        <h2 id="lab-motion" className="t-h3">
          Motion tier
        </h2>
        <p className="tool-line">
          <TierBadge />. There is no flag or setting: the pre-paint script follows <code>prefers-reduced-motion</code> (
          <Source file="src/motion/preferences.ts" name="prefsScript" />
          ). To force the reduced tier, turn on the system&rsquo;s reduced motion, or in Chrome DevTools: Rendering,
          Emulate CSS media feature <code>prefers-reduced-motion: reduce</code>.
        </p>
      </section>

      <section className="tool-section" aria-labelledby="lab-hosting">
        <h2 id="lab-hosting" className="t-h3">
          Hosting addresses
        </h2>
        <ul className="tool-list">
          <li>
            <a className="link" href={withBase('/')}>
              /
            </a>{' '}
            The root: picks the language (stored choice, then the browser&rsquo;s) and replaces the address.
          </li>
          <li>
            <a className="link" href={pageUrl(locale, '/no-such-page')}>
              {localeHref(locale, '/no-such-page')}/
            </a>{' '}
            Any unknown address: the 404 page and its discard.
          </li>
          {gatePaths().map((g) => (
            <li key={g.path}>
              <a className="link" href={withBase(g.path)}>
                {g.path}
              </a>{' '}
              {g.note} Netlify deploys only (<Source file="src/hosting/config.ts" name="gate" />
              ).
            </li>
          ))}
        </ul>
      </section>

      <section className="tool-section" aria-labelledby="lab-checks">
        <h2 id="lab-checks" className="t-h3">
          Checks from the command line
        </h2>
        <ul className="tool-list">
          {checks().map((c) => (
            <li key={c.file}>
              <Source file={c.file} /> {c.summary}
              {c.usage ? (
                <>
                  {' '}
                  <code className="tool-usage">{c.usage}</code>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </LabFrame>
  )
}
