'use client'

import Link from 'next/link'
import { usePathname, useSelectedLayoutSegment } from 'next/navigation'
import { type CSSProperties, useEffect, useLayoutEffect, useRef } from 'react'
import { useChrome } from '@/lib/chrome'
import { cardIdForPath } from '@/lib/hand-data'
import { localeHref, localeNames, locales, pagePath } from '@/lib/i18n'
import { withBase } from '@/lib/site'
import { showHeader, watchHeader } from '@/motion/header-scroll'
import { beginLocaleSwitch, rememberLocale } from '@/motion/locale-switch'
import { returnHome } from '@/motion/play'
import { LOCALE, NAV, RETURN } from '@/motion/transitions'
import { Logo, type LogoHandle } from './logo'
import { ReadingHairline } from './reading-hairline'
import styles from './header.module.css'

/*
 * Persistent header: the home slot at the top left; at the right the tray, one
 * capsule with About, a hairline and the language switcher; the reading
 * hairline on its bottom edge. 64 px high (--header-h).
 *
 * The home slot is one link to the table. On detail pages (the three case
 * studies and Management) it shows a back arrow and "Back" (the card returns
 * to the hand); everywhere else the logo (./logo.tsx). Logo -> Back: the
 * logo's cards play their exit (Motion, 300 ms), then the arrow's shaft draws
 * and the label rises from a mask (header.module.css). Back -> logo: Back
 * fades and the cards are dealt again. The slot has its own view-transition
 * name (home-slot, live and not animated by the transition, like the header),
 * so the morph runs once, inside the page transition. The logo's hover, focus,
 * gradient and letters egg (a click on home, a long press by touch) live in
 * logo.tsx. The link's label (site.header.homeLabel) names it; the logo is
 * decorative. Back's label is read once (a visually hidden copy); its letters,
 * which roll on hover, are aria-hidden. Back never leaves the screen: when the
 * header slides away it holds its place on a floating chip (header.module.css).
 *
 * About is a standalone text link (globals.css .link: its marker, line and
 * triangle). The header is outside the page, so its colour is the identity
 * of the page shown (palette.ts: :root's link colours follow the page's own
 * scope), updated on every navigation, card play, Back and language switch
 * included; the logo's flowing gradient on home and 404.
 *
 * The language switcher links each language to the same page in it; the
 * active one carries aria-current and sits on a face-up chip. Choosing the
 * other stores the choice and switches in place (src/motion/locale-switch.ts:
 * a short cross-fade, the scroll position kept); the new header's chip slides
 * in from the language before. On the 404 page there is no such page, so the
 * link opens the same address under the other language's prefix (/de/… or
 * /en/…), whose 404 page then speaks that language (the address's locale wins).
 *
 * On pages that scroll, the header leaves after a deliberate scroll down and
 * returns on a scroll up (src/motion/header-scroll.ts); every route change
 * shows it again and starts the watch afresh.
 */
export function Header() {
  const { locale, site, href } = useChrome()
  const pathname = usePathname()
  const path = pagePath(pathname)
  const lost = useSelectedLayoutSegment() === '404'
  const back = Boolean(cardIdForPath(path))
  const current = (page: string) => (path === page ? 'page' : undefined)
  const home = href('/')
  const ref = useRef<HTMLElement>(null)
  const slot = useRef<HTMLAnchorElement>(null)
  const logo = useRef<LogoHandle>(null)
  const switcher = useRef<HTMLElement>(null)
  useEffect(() => {
    showHeader()
    return watchHeader(ref.current!)
  }, [pathname])
  // Mounted by a language switch (this header replaces the other language's): the chip arrives
  // from the language before, in the same frame the new page is captured.
  useLayoutEffect(() => {
    if (document.documentElement.dataset.localeSwitch !== undefined) switcher.current!.dataset.arrived = ''
  }, [])
  return (
    <header ref={ref} className={styles.header} style={{ viewTransitionName: 'site-header' }} data-chrome="">
      <Link
        ref={slot}
        href={home}
        className={styles.slot}
        style={{ viewTransitionName: 'home-slot' }}
        data-slot-mode={back ? 'back' : 'mark'}
        aria-label={back ? undefined : site.header.homeLabel}
        transitionTypes={[back ? RETURN : NAV]}
        // On home the logo takes the click (it would only reload the table): the letters egg.
        onClick={(e) => logo.current?.claimClick(path === '/') && e.preventDefault()}
        // Back: the page folds into its card first (src/motion/play.ts), then the router navigates.
        onNavigate={(e) => back && returnHome(home) && e.preventDefault()}
      >
        <span className={styles.mark} aria-hidden={back || undefined}>
          <Logo ref={logo} className={styles.logo} mode={back ? 'back' : 'mark'} slot={slot} />
        </span>
        <span className={styles.back} aria-hidden={!back || undefined}>
          <svg className={styles.arrow} viewBox="0 0 20 12" fill="none" stroke="currentColor" aria-hidden="true">
            <path className={styles.head} d="M6.5 1.5 2 6l4.5 4.5" />
            <path className={styles.shaft} d="M2 6h16.5" />
          </svg>
          <span className={styles.mask}>
            <span className={styles.label}>
              <span className="sr-only">{site.header.back}</span>
              {/* Each letter and its copy below it: the hover rolls them up one after another. */}
              <span className={styles.letters} aria-hidden="true">
                {[...site.header.back].map((c, i) => (
                  <span key={i} className={styles.letter} style={{ '--i': i } as CSSProperties}>
                    <span>{c}</span>
                    <span>{c}</span>
                  </span>
                ))}
              </span>
            </span>
          </span>
        </span>
      </Link>
      <div className={styles.end}>
        <nav aria-label={site.header.nav} className={styles.nav}>
          <ul>
            <li>
              <Link
                href={href('/about')}
                className={styles.about}
                transitionTypes={[NAV]}
                aria-current={current('/about')}
              >
                <span className="link link-standalone">{site.header.about}</span>
              </Link>
            </li>
          </ul>
        </nav>
        <span className={styles.rule} aria-hidden="true" />
        <nav
          ref={switcher}
          aria-label={site.header.language}
          className={styles.language}
          // Its own live view-transition group: the switch's cross-fade never doubles the chip.
          style={{ '--active': locales.indexOf(locale), viewTransitionName: 'locale-switcher' } as CSSProperties}
          data-locale-switcher=""
        >
          {/* The face-up chip under the active language; it slides across on a switch. */}
          <span className={styles.chip} aria-hidden="true" />
          <ul>
            {locales.map((l) => (
              <li key={l}>
                <Link
                  // On 404 the server knows only the 404 route, not the address: link the other
                  // language's 404 page; a click reloads this address in that language instead.
                  href={localeHref(l, lost ? '/404' : path)}
                  hrefLang={l}
                  lang={l}
                  className={styles.locale}
                  aria-current={l === locale ? 'page' : undefined}
                  scroll={false}
                  prefetch={lost ? false : undefined}
                  transitionTypes={[LOCALE]}
                  data-locale={l}
                  onNavigate={(e) => {
                    if (l === locale) return e.preventDefault()
                    if (lost) {
                      e.preventDefault()
                      rememberLocale(l)
                      location.assign(withBase(localeHref(l, path)))
                      return
                    }
                    beginLocaleSwitch(l)
                  }}
                >
                  {l.toUpperCase()}
                  <span className="sr-only"> {localeNames[l]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <ReadingHairline />
    </header>
  )
}
