import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { NextConfig } from 'next'
import { siteAccess } from './src/hosting/config.ts'

/*
 * Static export only: `npm run build` writes dist/, served from the domain
 * root (Netlify, netlify.toml). BASE_PATH (e.g. /sub/) is optional and empty by
 * default. Nothing here needs a server.
 */
const basePath = (process.env.BASE_PATH ?? '').replace(/\/+$/, '')

/*
 * The lab switch (src/lab/README.md): the internal tool pages exist only while the site is not
 * public. Their route files end in .lab.tsx, which is a page extension only then; a public build
 * (SITE_ACCESS=public) has no lab route, and NEXT_PUBLIC_LAB is empty, so the header's Lab link
 * and everything it imports fold away at build time.
 */
const lab = siteAccess(process.env.SITE_ACCESS) !== 'public'

// Motion+ comes from a private registry (MOTION_TOKEN). Installs without the
// token skip it: imports then resolve to a small local fallback, and the type
// check runs against tsconfig.fallback.json, which maps the same module.
const hasMotionPlus = existsSync(join(process.cwd(), 'node_modules/motion-plus/package.json'))

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  trailingSlash: true,
  basePath,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', ...(lab ? ['lab.tsx'] : [])],
  images: { unoptimized: true },
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_LAB: lab ? '1' : '' },
  typescript: hasMotionPlus ? {} : { tsconfigPath: 'tsconfig.fallback.json' },
  ...(hasMotionPlus ? {} : { turbopack: { resolveAlias: { 'motion-plus': './src/motion/plus-fallback.ts' } } }),
}

export default nextConfig
