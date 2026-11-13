import type { Viewport } from 'next'
import { BackgroundField } from '@/components/background/background-field'
import { fieldInitialCss } from '@/components/background/field-css'
import { RouterBridge } from '@/components/router-bridge'
import { identityCss, logoGradientCss, palette } from '@/design/palette'
import { prefsScript } from '@/motion/preferences'
import { mapPaths, pathFields } from '@/motion/table-store'
import { motionCss } from '@/motion/tokens'
import { display, hand, mono, text } from './fonts'
import './globals.css'

/*
 * The root layout: <html>, the head scripts and the background field, the
 * same for every locale. It never remounts, so switching the language keeps
 * the field running and keeps what the pre-paint script wrote on <html>
 * (motion tier, field, hand reserve). Everything with words is in
 * app/[locale]/layout.tsx, which does remount on a switch. <html lang> comes
 * from the locale: written into each page's HTML at build time
 * (scripts/i18n-pages.mjs) and kept in step on the client (LocaleSync).
 * Contract: docs/contracts.md#locales.
 */
export const viewport: Viewport = {
  themeColor: palette.ink.field,
  colorScheme: 'dark',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={`${display.variable} ${text.variable} ${mono.variable} ${hand.variable}`}
      data-motion="full"
      suppressHydrationWarning
    >
      <head>
        {/* Motion tier, first-visit flag, the logo's gradient and reveal arming, before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: prefsScript(pathFields(), mapPaths) }} />
        <style
          dangerouslySetInnerHTML={{ __html: identityCss() + logoGradientCss() + fieldInitialCss() + motionCss() }}
        />
      </head>
      <body>
        {/* Persistent: never remount, not on navigation and not when the language changes. */}
        <BackgroundField />
        <RouterBridge />
        {children}
      </body>
    </html>
  )
}
