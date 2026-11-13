import type { Metadata } from 'next'
import { AboutSmallPrint } from '@/components/about-small-print'
import { Hand } from '@/components/hand/hand'
import { PlayStatus } from '@/components/hand/play-status'
import { Header } from '@/components/header'
import { LiveRegion } from '@/components/live-region'
import { LocaleSync } from '@/components/locale-sync'
import { Reveals } from '@/components/reveals'
import { RouteFocus } from '@/components/route-focus'
import { SiteFooter } from '@/components/site-footer'
import { Eggs } from '@/eggs/eggs'
import { ChromeProvider } from '@/lib/chrome'
import { contentFor, images, localeParams } from '@/lib/content'
import { heroImages } from '@/lib/hero-images'
import { locales, ogLocales } from '@/lib/i18n'
import { asLocale, setRequestLocale } from '@/lib/request-locale'
import { absoluteUrl } from '@/lib/site'

/*
 * One locale's chrome (/de/, /en/): the skip links, header, main, footer,
 * hand and eggs, with that locale's words. Only this locale's slim chrome
 * reaches the client (ChromeProvider, D7). Switching the language is a client
 * navigation to the other locale: this layout remounts with the other words
 * while the root layout (the field, <html>) stays; the switch cross-fades
 * (src/motion/locale-switch.ts). Contract: docs/contracts.md#locales.
 */
export const dynamicParams = false
export const generateStaticParams = localeParams

type Props = { params: Promise<{ locale: string }> }

/** Default Open Graph image (about-og, 1280 px JPEG), only when the deploy passes SITE_URL. */
const og = images['about-og']
const ogUrl = absoluteUrl('/images/about-og-1280.jpg')
const rootUrl = absoluteUrl('/')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const { site, imageAlt } = contentFor(locale)
  return {
    title: { default: site.name, template: `%s · ${site.name}` },
    description: site.description,
    robots: { index: false, follow: false },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: site.name,
      description: site.description,
      locale: ogLocales[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocales[l]),
      ...(ogUrl
        ? {
            images: [
              { url: ogUrl, width: 1280, height: Math.round((1280 * og.height) / og.width), alt: imageAlt['about-og'] },
            ],
          }
        : {}),
    },
    ...(rootUrl ? { metadataBase: new URL(rootUrl) } : {}),
  }
}

export default async function LocaleLayout({ children, params }: Props & { children: React.ReactNode }) {
  const locale = setRequestLocale((await params).locale)
  const { site, hand, coffeeEgg } = contentFor(locale)
  return (
    <ChromeProvider data={{ locale, site, hand, coffeeEgg }}>
      {/* First focusable element; only shown while the first-visit intro runs. */}
      <button type="button" className="intro-skip" data-intro-skip="">
        {site.introSkip}
      </button>
      <a className="skip-link" href="#main">
        {site.skipLink}
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter about={<AboutSmallPrint />} />
      <Hand heroes={heroImages(locale)} />
      <LiveRegion />
      <PlayStatus />
      <RouteFocus />
      {/* After a language switch: <html lang>, the same place on the page (before Reveals measures). */}
      <LocaleSync />
      <Reveals />
      <Eggs />
    </ChromeProvider>
  )
}
