// End-to-end check of the Netlify deploys on localhost, with Netlify's own CLI: its build
// pipeline (Frameworks API, edge bundling) and its edge runtime (Deno).
//
//   npm run test:hosting
//
// 1. Gated run (`netlify serve --context deploy-preview`, what branch deploys and Deploy
//    Previews get): every path is gated, the gate's assets stay public, a wrong password waits
//    and errs, the right one sets the cookie and opens the site, lock closes it again.
// 2. Production-like run (`netlify serve --context production`): the under-construction page,
//    no gate, every other path back to /. Skipped (and said so) while the page's own facts are
//    still placeholders, because the production build refuses to run then.
//
// Needs netlify-cli: NETLIFY_CLI=/path/to/netlify, or `netlify` on PATH (npm i -g netlify-cli).
// Locally, edge functions only receive variables from .env files, so the script writes a
// temporary .env.development.local (a random BASECAMP_PASSWORD, plus DENO_CERT when set, for
// TLS-intercepting proxies) and removes it again. Playwright, when it resolves (like
// scripts/e2e.mjs), adds a browser pass through the form.
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { request } from "node:http";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BASECAMP_HOST, PRIMARY_DOMAIN, REDIRECT_DOMAINS, gate } from "../src/hosting/config.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = process.env.NETLIFY_CLI || "netlify";
const envFile = join(root, ".env.development.local");
const password = `e2e-${randomBytes(12).toString("hex")}`;
const isWindows = process.platform === "win32";

let failed = 0;
let passed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`  ${ok ? "✓" : "✗"} ${name}${!ok && detail ? `  (${detail})` : ""}`);
};

const freePort = () =>
  new Promise((done) => {
    const server = createServer().listen(0, () => {
      const { port } = server.address();
      server.close(() => done(port));
    });
  });

/** Starts the CLI and resolves once its server is ready. */
async function start(args) {
  const port = await freePort();
  const env = { ...process.env, BROWSER: "none" };
  // The .env file carries DENO_CERT; a process variable of the same name would shadow it.
  delete env.DENO_CERT;
  const child = spawn(cli, [...args, "--offline", "--port", String(port)], { cwd: root, env, detached: !isWindows, shell: isWindows });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  const ready = await new Promise((done) => {
    const timer = setTimeout(() => done(false), 300_000);
    const poll = setInterval(() => {
      if (/Local dev server ready|Server now ready/.test(log)) {
        clearInterval(poll);
        clearTimeout(timer);
        done(true);
      }
    }, 250);
    child.on("exit", () => {
      clearInterval(poll);
      clearTimeout(timer);
      done(false);
    });
  });
  const stop = () => {
    if (child.exitCode !== null) return;
    if (isWindows) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
    else process.kill(-child.pid, "SIGTERM");
  };
  if (!ready) {
    stop();
    throw new Error(`netlify ${args.join(" ")} did not start:\n${log.slice(-3000)}`);
  }
  return { base: `http://localhost:${port}`, log: () => log, stop };
}

const get = (base, path, init = {}) => fetch(`${base}${path}`, { redirect: "manual", ...init });
const unlock = (base, body, headers = {}) =>
  get(base, gate.unlock, { method: "POST", body: new URLSearchParams(body), headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers } });
/** A request with another Host header (fetch does not send one). */
const withHost = (base, path, host) =>
  new Promise((done, fail) => {
    const { port } = new URL(base);
    request({ port, path, headers: { Host: host } }, (res) => {
      res.resume();
      done({ status: res.statusCode, location: res.headers.location });
    })
      .on("error", fail)
      .end();
  });
const firstFile = (dir, test) => (existsSync(dir) ? readdirSync(dir).find(test) : undefined);

async function gatedRun() {
  console.log("\nGated run: netlify serve --context deploy-preview");
  const server = await start(["serve", "--context", "deploy-preview"]);
  try {
    const { base } = server;
    const chunk = `/_next/static/chunks/${firstFile(join(root, "out/_next/static/chunks"), (f) => f.endsWith(".js"))}`;
    const font = firstFile(join(root, "out", gate.assetsDir), (f) => f.endsWith(".woff2"));

    for (const path of ["/", "/work/test-project/", "/about/", chunk, "/terrain/heightmap-1536.webp", `${gate.assetsDir}${font}`]) {
      const res = await get(base, path);
      const html = await res.text();
      check(
        `${path} without a cookie: gate page, no-store, noindex`,
        res.status === 401 &&
          res.headers.get("cache-control") === "no-store" &&
          res.headers.get("x-robots-tag") === "noindex, nofollow" &&
          html.includes(`action="${gate.unlock}"`) &&
          html.includes('autocomplete="current-password"'),
        `${res.status} ${res.headers.get("content-type")}`,
      );
    }
    const deep = await (await get(base, "/work/test-project/?from=e2e")).text();
    check("the gate remembers the requested path", deep.includes('name="next" value="/work/test-project/?from=e2e"'));

    const asset = await get(base, `${gate.assets}${font}`);
    check("gate assets under /.basecamp/assets/ are public", asset.status === 200 && asset.headers.get("content-type") === "font/woff2", String(asset.status));
    const robots = await get(base, "/robots.txt");
    check("robots.txt disallows everything", robots.status === 200 && (await robots.text()).includes("Disallow: /"));

    const t0 = Date.now();
    const wrong = await unlock(base, { password: "not-it", next: "/about/" });
    const wrongHtml = await wrong.text();
    check(
      "a wrong password waits ~750 ms and shows the gate with an alert",
      wrong.status === 401 && Date.now() - t0 >= 700 && wrongHtml.includes('role="alert"') && !wrong.headers.get("set-cookie"),
      `${wrong.status} after ${Date.now() - t0} ms`,
    );
    const foreign = await unlock(base, { password, next: "/" }, { Origin: "https://evil.example" });
    // 403 on Netlify; the local server retries 403s under other paths and ends on the gate page.
    check("an unlock from a foreign origin is refused", [401, 403].includes(foreign.status) && !foreign.headers.get("set-cookie"), String(foreign.status));

    const ok = await unlock(base, { password, next: "/work/test-project/" }, { Origin: `https://${PRIMARY_DOMAIN}` });
    const setCookie = ok.headers.get("set-cookie") ?? "";
    check(
      "the right password (posted from PRIMARY_DOMAIN) sets the cookie and 303s to next",
      ok.status === 303 &&
        ok.headers.get("location") === "/work/test-project/" &&
        setCookie.startsWith(`${gate.cookie}=`) &&
        ["Path=/", "Secure", "HttpOnly", "SameSite=Lax", `Max-Age=${gate.maxAgeSeconds}`].every((a) => setCookie.includes(a)),
      `${ok.status} ${ok.headers.get("location")} ${setCookie}`,
    );
    const cookie = setCookie.split(";")[0];
    for (const [path, type] of [["/work/test-project/", "text/html"], [chunk, "javascript"], ["/terrain/heightmap-1536.webp", "image/webp"]]) {
      const res = await get(base, path, { headers: { Cookie: cookie } });
      check(
        `${path} with the cookie: the site, still noindex`,
        res.status === 200 && (res.headers.get("content-type") ?? "").includes(type) && res.headers.get("x-robots-tag") === "noindex, nofollow",
        `${res.status} ${res.headers.get("content-type")}`,
      );
    }
    const tampered = cookie.replace(/.$/, (c) => (c === "A" ? "B" : "A"));
    check("a tampered cookie is refused", (await get(base, "/", { headers: { Cookie: tampered } })).status === 401);
    const lock = await get(base, gate.lock, { headers: { Cookie: cookie } });
    check("lock clears the cookie and shows the gate", lock.status === 200 && /Max-Age=0/.test(lock.headers.get("set-cookie") ?? "") && (await lock.text()).includes(gate.unlock));

    await browserPass(base);
    check("Netlify bundled and ran the gate as an edge function", /Loaded edge function basecamp-gate/.test(server.log()));
  } finally {
    server.stop();
  }
}

/** The form in a real browser: error announced, then unlocked, then locked again. */
async function browserPass(base) {
  let playwright;
  try {
    playwright = createRequire(import.meta.url)("playwright");
  } catch {
    console.log("  - browser pass skipped (Playwright not installed)");
    return;
  }
  const browser = await playwright.chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/about/`);
    await page.fill("#password", "not-it");
    await page.click("button[type=submit]");
    await page.waitForSelector("#access-error");
    const focused = await page.evaluate(() => document.activeElement?.id);
    check(
      "browser: the error is an alert, described on the focused field",
      focused === "password" && (await page.getAttribute("#password", "aria-describedby")) === "access-error",
      `focus on ${focused}`,
    );
    await page.fill("#password", password);
    await page.click("button[type=submit]");
    await page.waitForURL(`${base}/about/`);
    const cookies = await page.context().cookies();
    const session = cookies.find((c) => c.name === gate.cookie);
    check("browser: unlocked onto the requested page", (await page.locator("main h1").count()) > 0 && session?.httpOnly && session.secure && session.sameSite === "Lax");
    await page.goto(`${base}${gate.lock}`);
    await page.goto(`${base}/about/`);
    check("browser: locked again after /.basecamp/lock", (await page.locator("#password").count()) === 1);
  } finally {
    await browser.close();
  }
}

async function productionRun() {
  console.log("\nProduction-like run: netlify serve --context production");
  const complete = spawnSync(process.execPath, ["scripts/check-content.mjs", "--build", "--mode=construction"], {
    cwd: root,
    env: { ...process.env, NEXT_PUBLIC_PREVIEW: "" },
    stdio: "ignore",
  }).status === 0;
  if (!complete) {
    console.log("  - skipped: the under-construction page still has placeholders, so the production build stops (npm run check:content -- --mode=construction)");
    return;
  }
  const server = await start(["serve", "--context", "production"]);
  try {
    const { base } = server;
    check("no gate in the production build", !existsSync(join(root, ".netlify/v1/edge-functions/basecamp-gate.ts")) && !/Loaded edge function/.test(server.log()));
    const home = await get(base, "/");
    const html = await home.text();
    check(
      "/ is the under-construction page, posting to BASECAMP_HOST",
      home.status === 200 && !home.headers.get("x-nf-edge-functions") && html.includes(`action="https://${BASECAMP_HOST}${gate.unlock}"`),
      String(home.status),
    );
    check("/ is indexable, with a canonical URL", html.includes(`rel="canonical" href="https://${PRIMARY_DOMAIN}/"`) && !html.includes("noindex"));
    check("/ sends the CSP from _headers", (home.headers.get("content-security-policy") ?? "").includes(`form-action https://${BASECAMP_HOST}`));
    for (const path of ["/work/test-project/", "/about/", gate.lock, "/nothing/here"]) {
      const res = await get(base, path);
      check(`${path} redirects to / (302)`, res.status === 302 && new URL(res.headers.get("location"), base).pathname === "/", `${res.status} ${res.headers.get("location")}`);
    }
    const font = firstFile(join(root, "out/assets"), (f) => f.endsWith(".woff2"));
    const asset = await get(base, `/assets/${font}`);
    check("fonts are served from /assets/", asset.status === 200 && asset.headers.get("content-type") === "font/woff2");
    const robots = await (await get(base, "/robots.txt")).text();
    check("robots.txt allows crawling", robots.includes("Allow: /"));
    for (const domain of REDIRECT_DOMAINS) {
      const alias = await withHost(base, "/work/?x=1", domain);
      check(`${domain} (REDIRECT_DOMAINS) → 301 to PRIMARY_DOMAIN, path kept`, alias.status === 301 && alias.location === `https://${PRIMARY_DOMAIN}/work/?x=1`, `${alias.status} ${alias.location}`);
    }
  } finally {
    server.stop();
  }
}

if (spawnSync(cli, ["--version"], { shell: isWindows }).status !== 0) {
  console.error(`netlify-cli not found: install it (npm i -g netlify-cli) or set NETLIFY_CLI.`);
  process.exit(2);
}
if (existsSync(envFile)) {
  console.error(`${envFile} exists; move it aside while this runs (the check writes its own).`);
  process.exit(2);
}
writeFileSync(envFile, `${gate.passwordEnv}=${password}\n${process.env.DENO_CERT ? `DENO_CERT=${process.env.DENO_CERT}\n` : ""}`);
try {
  await gatedRun();
  await productionRun();
} finally {
  rmSync(envFile, { force: true });
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
