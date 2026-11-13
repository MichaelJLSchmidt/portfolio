'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { interceptHistory, registerNavigate } from '@/motion/play'

/*
 * The router for play / return / switch (registerNavigate) and the replay of
 * browser back / forward as typed navigations (interceptHistory), mounted once
 * in the root layout. Persistent on purpose: a language switch remounts the
 * [locale] layout (header, hand, page), and a listener living there would be
 * removed while Next handles the popstate that changes the language. Mounted
 * here, its popstate listener is registered before Next's own (child effects
 * run before the app router's), so the replay always runs first.
 */
export function RouterBridge() {
  const router = useRouter()
  const pathname = usePathname()
  const route = useRef(pathname)
  route.current = pathname

  useEffect(() => {
    registerNavigate(
      (href, types, replace) =>
        replace
          ? router.replace(href, { transitionTypes: types, scroll: false })
          : router.push(href, { transitionTypes: types }),
      (href) => router.prefetch(href),
    )
    const offHistory = interceptHistory(() => route.current.replace(/\/$/, '') || '/')
    return () => {
      registerNavigate(null)
      offHistory()
    }
  }, [router])

  return null
}
