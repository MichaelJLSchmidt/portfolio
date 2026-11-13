import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

/** Experimental page: never indexed. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } }
}
