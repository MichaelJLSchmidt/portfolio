import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { NextConfig } from 'next'

/*
 * Static export only: `npm run build` writes dist/, served from the domain
 * root (Netlify, netlify.toml). BASE_PATH (e.g. /sub/) is optional and empty by
 * default. Nothing here needs a server.
 */
const basePath = (process.env.BASE_PATH ?? '').replace(/\/+$/, '')

// Motion+ comes from a private registry (MOTION_TOKEN). Installs without the
// token skip it: imports then resolve to a small local fallback, and the type
// check runs against tsconfig.fallback.json, which maps the same module.
const hasMotionPlus = existsSync(join(process.cwd(), 'node_modules/motion-plus/package.json'))

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  typescript: hasMotionPlus ? {} : { tsconfigPath: 'tsconfig.fallback.json' },
  ...(hasMotionPlus ? {} : { turbopack: { resolveAlias: { 'motion-plus': './src/motion/plus-fallback.ts' } } }),
}

export default nextConfig
