import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { includesExamples, includesLab } from "./src/hosting/config";

/**
 * The site is a pure static export, served from the domain root on Netlify. A build for a
 * sub-path still works (NEXT_PUBLIC_BASE_PATH, e.g. "/portfolio" to test asset() locally),
 * so the base path comes from the environment and defaults to empty.
 */
function normaliseBasePath(value: string | undefined): string {
  const trimmed = (value ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const basePath = normaliseBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

export default function nextConfig(phase: string): NextConfig {
  // Flagged examples (src/content/examples) exist only where includesExamples() says so. Where
  // they don't, their module is swapped for an empty one, so no route, card or copy of theirs
  // can reach any bundle.
  const examples = includesExamples(process.env, phase === PHASE_DEVELOPMENT_SERVER);
  // The motion lab's pages (page.lab.tsx) are routes only where the lab is included.
  const lab = includesLab(process.env, phase === PHASE_DEVELOPMENT_SERVER);
  return {
    output: "export",
    pageExtensions: lab ? ["tsx", "ts", "jsx", "js", "lab.tsx"] : ["tsx", "ts", "jsx", "js"],
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
      // Always defined (empty unless "1"), so preview-only branches (?name=, ?vt=, ?motion=, the
      // lab's hooks) are constant-folded out of production builds.
      NEXT_PUBLIC_PREVIEW: process.env.NEXT_PUBLIC_PREVIEW === "1" ? "1" : "",
    },
    turbopack: examples
      ? undefined
      : { resolveAlias: { "@/content/examples": "./src/content/examples/none.ts", "@/content/examples/case-studies": "./src/content/examples/none.ts" } },
  };
}
