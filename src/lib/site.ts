/** Prefix for raw URLs (plain <a>, fetch). next/link adds the base path itself. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
export const withBase = (path: string) => `${basePath}${path}`

/**
 * The site's origin at build time, from SITE_URL (the deploy workflow passes
 * actions/configure-pages' base_url). Server only; null in local builds, where
 * absolute URLs (Open Graph) are left out. Never hard-coded.
 */
export const siteOrigin = (() => {
  try {
    return process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : null
  } catch {
    return null
  }
})()

/** An absolute URL under the base path, or null without SITE_URL. */
export const absoluteUrl = (path: string) => (siteOrigin ? `${siteOrigin}${withBase(path)}` : null)
