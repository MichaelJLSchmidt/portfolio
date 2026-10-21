import type { NextConfig } from "next";

/**
 * The site is a pure static export. It is served from a sub-path on GitHub Pages
 * ("/<repo>") and from the root on the production host, so the base path comes
 * from the environment and defaults to empty.
 */
function normaliseBasePath(value: string | undefined): string {
  const trimmed = (value ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const basePath = normaliseBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

const nextConfig: NextConfig = {
  output: "export",
  // Every route becomes a folder with index.html, so deep links and reloads work on static hosts.
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  // CLAUDE.md is the single agent guide for this repo; don't let `next dev` write AGENTS.md.
  agentRules: false,
  env: {
    // Re-export the normalised value so client code and next.config agree.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
