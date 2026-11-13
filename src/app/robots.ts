import type { MetadataRoute } from 'next'
import { indexable } from '@/lib/metadata'

export const dynamic = 'force-static'

/**
 * Disallow-all until launch (SITE_ACCESS=public, netlify.toml), when it opens. While the password
 * gate runs, it answers robots.txt itself (src/hosting/gate-handler.ts).
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', ...(indexable ? { allow: '/' } : { disallow: '/' }) } }
}
