import { gate } from "./config.ts";
import {
  MAX_FIELD_LENGTH,
  clearedCookie,
  originAllowed,
  passwordMatches,
  readCookie,
  safeNext,
  sessionCookie,
  signCookie,
  verifyCookie,
} from "./gate.ts";
import { deserialize, renderPage, type FormState, type PageModel, type SerializedPageModel } from "./page.ts";

/**
 * The Basecamp gate as a request handler. The build wraps it in a Netlify Edge Function for
 * branch deploys and Deploy Previews only (SITE_MODE=basecamp); production never has it.
 *
 * - Every path is protected except the gate's own assets (/.basecamp/assets/*) and
 *   robots.txt, which the gate answers itself with "Disallow: /".
 * - No valid cookie: the gate page, 401 with a Cookie challenge (no-store).
 * - POST /.basecamp/unlock: password check, cookie, 303 to `next`; a wrong password waits,
 *   then shows the gate page with an error.
 * - GET /.basecamp/lock: clears the cookie, shows the gate page.
 * - No password configured: fail closed, the page says Basecamp is closed.
 * Every response carries X-Robots-Tag: noindex, nofollow.
 */

export type GateOptions = {
  page: SerializedPageModel;
  /** Content-Security-Policy for the gate page. */
  csp: string;
};

export type GateDeps = {
  /** BASECAMP_PASSWORD; undefined or empty closes Basecamp. */
  password: string | undefined;
  /** The protected response (Netlify: context.next()). */
  next: () => Promise<Response>;
  /** Unix seconds. */
  now?: () => number;
  wait?: (ms: number) => Promise<void>;
  log?: (message: string) => void;
};

const ROBOTS = "noindex, nofollow";
/** 401 needs a challenge; this names the form and the cookie (the "Cookie" scheme draft). */
const CHALLENGE = `Cookie realm="Basecamp", form-action="${gate.unlock}", cookie-name="${gate.cookie}"`;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
let warnedClosed = false;

function pageResponse(page: PageModel, csp: string, form: FormState, status: number, extra: HeadersInit = {}): Response {
  const headers = new Headers(extra);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", ROBOTS);
  headers.set("Content-Security-Policy", csp);
  headers.set("Referrer-Policy", "same-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(renderPage(page, form), { status, headers });
}

/** The protected response, marked noindex and kept out of shared caches. */
function gated(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", ROBOTS);
  const cacheControl = headers.get("Cache-Control");
  if (cacheControl && /\bpublic\b/i.test(cacheControl)) headers.set("Cache-Control", cacheControl.replace(/\bpublic\b/gi, "private"));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function readForm(request: Request): Promise<{ password: string; next: unknown } | null> {
  const type = request.headers.get("Content-Type") ?? "";
  const length = Number(request.headers.get("Content-Length") ?? 0);
  if (!/^application\/x-www-form-urlencoded\b|^multipart\/form-data\b/i.test(type) || length > 4 * MAX_FIELD_LENGTH) return null;
  try {
    const form = await request.formData();
    const password = form.get("password");
    if (typeof password !== "string" || password.length > MAX_FIELD_LENGTH) return null;
    return { password, next: form.get("next") };
  } catch {
    return null;
  }
}

export async function handleGate(request: Request, options: GateOptions, deps: GateDeps): Promise<Response> {
  const url = new URL(request.url);
  const page = deserialize(options.page);
  const now = deps.now?.() ?? Math.floor(Date.now() / 1000);
  const show = (form: Omit<FormState, "action">, status: number, extra?: HeadersInit) =>
    pageResponse(page, options.csp, { action: gate.unlock, ...form }, status, extra);

  if (url.pathname.startsWith(gate.assets)) return deps.next();
  if (url.pathname === "/robots.txt") {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": ROBOTS },
    });
  }

  const password = deps.password ?? "";
  if (!password) {
    if (!warnedClosed) {
      warnedClosed = true;
      (deps.log ?? console.error)(
        `[basecamp-gate] ${gate.passwordEnv} is not set (it needs the Functions scope in the Netlify UI): Basecamp is closed.`,
      );
    }
    return show({ next: "/", state: "closed" }, 503);
  }

  if (url.pathname === gate.lock) {
    return show({ next: "/", state: "idle" }, 200, { "Set-Cookie": clearedCookie() });
  }

  if (url.pathname === gate.unlock) {
    if (request.method !== "POST") return new Response(null, { status: 303, headers: { Location: "/", "X-Robots-Tag": ROBOTS } });
    if (!originAllowed(request.headers.get("Origin"), url)) return show({ next: "/", state: "idle" }, 403);
    const form = await readForm(request);
    const next = safeNext(form?.next, url);
    if (form && (await passwordMatches(form.password, password))) {
      const cookie = await signCookie(password, now + gate.maxAgeSeconds);
      return new Response(null, {
        status: 303,
        headers: { Location: next, "Set-Cookie": sessionCookie(cookie), "Cache-Control": "no-store", "X-Robots-Tag": ROBOTS },
      });
    }
    await (deps.wait ?? sleep)(gate.failureDelayMs);
    return show({ next, state: "error" }, 401, { "WWW-Authenticate": CHALLENGE });
  }

  if (await verifyCookie(password, readCookie(request.headers.get("Cookie"), gate.cookie), now)) {
    return gated(await deps.next());
  }
  const back = request.method === "GET" || request.method === "HEAD" ? safeNext(`${url.pathname}${url.search}`, url) : "/";
  return show({ next: back, state: "idle" }, 401, { "WWW-Authenticate": CHALLENGE });
}

/** Netlify Edge Function handler (the build generates the entry that calls this). */
export function createGate(options: GateOptions) {
  return (request: Request, context: { next: () => Promise<Response> }) =>
    handleGate(request, options, {
      password: (globalThis as { Netlify?: { env: { get(name: string): string | undefined } } }).Netlify?.env.get(gate.passwordEnv),
      next: () => context.next(),
    });
}
