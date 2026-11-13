'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { pagePath } from '@/lib/i18n'
import styles from './site-footer.module.css'

/**
 * The footer's frame, per route: nothing on home (one screen, the hand below
 * it), the note everywhere else, and on About the photo credits and the
 * terrain attribution as small print above it (`about`, rendered on the server).
 */
export function FooterShell({ about, children }: { about?: ReactNode; children: ReactNode }) {
  const path = pagePath(usePathname())
  if (path === '/') return null
  return (
    <footer className={`${styles.footer} spread-grid`} style={{ viewTransitionName: 'site-footer' }}>
      {path === '/about' && about}
      <div className={styles.inner}>{children}</div>
    </footer>
  )
}
