/**
 * Hosting configuration: the only module that spells out the domains. The build
 * (scripts/site), the Basecamp gate (edge function) and the docs refer to these constants by
 * name: PRIMARY_DOMAIN, REDIRECT_DOMAINS, BASECAMP_HOST.
 *
 * Plain TypeScript with no imports, so Node (type stripping), Deno (Netlify Edge Functions)
 * and the app's type check all read it as is.
 */

/** Production. Serves the under-construction page until launch, then the full site. */
export const PRIMARY_DOMAIN = "michaeljlschmidt.ch";

/** Domain aliases that answer with a 301 to https://PRIMARY_DOMAIN, path kept. */
export const REDIRECT_DOMAINS = ["mjls.ch", "www.mjls.ch", "www.michaeljlschmidt.ch"] as const;

/** Branch subdomain of BASECAMP_BRANCH: the full work-in-progress site behind the gate. */
export const BASECAMP_HOST = "basecamp.michaeljlschmidt.ch";

/** The integration branch; pull requests target it, main is production. */
export const BASECAMP_BRANCH = "basecamp";

/**
 * What a build produces (SITE_MODE, set per deploy context in netlify.toml):
 * - construction: only the under-construction page, no Next.js build (production until launch)
 * - basecamp: the full site plus the password gate (branch deploys and Deploy Previews)
 * - live: the full site, no gate (production after launch)
 */
export const SITE_MODES = ["construction", "basecamp", "live"] as const;
export type SiteMode = (typeof SITE_MODES)[number];

/**
 * Flagged examples (src/content/examples: fictional case studies that demonstrate the page
 * format) ship where the site is reviewed, never where it is public:
 * - SITE_MODE=basecamp (branch deploys and Deploy Previews): included;
 * - SITE_MODE=live: excluded, whatever else is set (no route, no card, no assets);
 * - no SITE_MODE: included in `npm run dev` and in a local preview (NEXT_PUBLIC_PREVIEW=1),
 *   excluded otherwise (a plain `npm run build` is a live build).
 */
export function includesExamples(env: Record<string, string | undefined>, dev = false): boolean {
  if (env.SITE_MODE) return env.SITE_MODE === "basecamp";
  return dev || env.NEXT_PUBLIC_PREVIEW === "1";
}

/**
 * The motion lab (/lab/: every motion primitive in full, calm and still side by side) is a review
 * tool: it exists exactly where flagged examples do (basecamp builds, local previews and
 * `npm run dev`) and never in a live build. Its pages are named page.lab.tsx and only become
 * routes where next.config.ts adds that extension.
 */
export const includesLab = includesExamples;

export const gate = {
  /** Host-only cookie: Secure, Path=/ and no Domain attribute are required by the prefix. */
  cookie: "__Host-basecamp",
  maxAgeSeconds: 30 * 24 * 60 * 60,
  /** Everything under this prefix belongs to the gate itself. */
  prefix: "/.basecamp/",
  unlock: "/.basecamp/unlock",
  lock: "/.basecamp/lock",
  /** The gate page's styles, fonts and poster: the only unprotected paths. */
  assets: "/.basecamp/assets/",
  /**
   * Where the build stores those assets. Netlify does not reliably deploy dot-directories,
   * so /.basecamp/assets/* is rewritten here (_redirects). Requests straight to this
   * directory are gated like any other path.
   */
  assetsDir: "/_basecamp/",
  /** Wrong password: wait this long before answering. */
  failureDelayMs: 750,
  /** Netlify environment variable, Functions scope (netlify.toml values never reach edge functions). */
  passwordEnv: "BASECAMP_PASSWORD",
} as const;
