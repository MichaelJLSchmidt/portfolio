'use client'

import { useLayoutEffect } from 'react'
import { useChrome } from '@/lib/chrome'
import { settleLocaleSwitch } from '@/motion/locale-switch'

/**
 * Keeps <html lang> on the active locale (the static HTML already carries it) and,
 * after a language switch, takes the visitor back to the same place on the page.
 * A layout effect, mounted after <main> and before <Reveals>: the page is in place
 * before the reveal system measures the first viewport and before the view
 * transition captures the new state. The [locale] layout remounts on a switch, so
 * this runs on mount; settleLocaleSwitch() does nothing unless a switch is pending.
 */
export function LocaleSync() {
  const { locale } = useChrome()
  useLayoutEffect(() => {
    document.documentElement.lang = locale
    settleLocaleSwitch(locale)
  }, [locale])
  return null
}
