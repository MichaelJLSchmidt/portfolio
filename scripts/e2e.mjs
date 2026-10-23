// End-to-end checks in Chromium against the static export (build first, e.g. with
// NEXT_PUBLIC_BASE_PATH=/portfolio NEXT_PUBLIC_PREVIEW=1 npm run build):
//
//   npm run test:e2e                  all scenarios
//   npm run test:e2e -- transitions   aborted view transitions; Calm map and reduced motion
//   npm run test:e2e -- decode        heightmap decode check and its fallbacks
//
// Serves ./out like GitHub Pages (base path read from the build) and drives Chromium with
// Playwright, which is not a dependency: `npm i -D playwright && npx playwright install chromium`,
// or NODE_PATH pointing at a global install. WebGL runs on SwiftShader, so the field is forced on
// with ?field=force.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const only = process.argv[2];

let playwright;
try {
  playwright = createRequire(import.meta.url)("playwright");
} catch {
  console.error("Playwright is not installed (npm i -D playwright && npx playwright install chromium).");
  process.exit(2);
}
if (!existsSync(join(root, "out/index.html"))) {
  console.error("No static export in ./out: run npm run build first.");
  process.exit(2);
}

// --- static server ----------------------------------------------------------------------------
const basePath = readFileSync(join(root, "out/index.html"), "utf8").match(/(?:src|href)="([^"]*?)\/_next\//)?.[1] ?? "";
const port = await new Promise((done) => {
  const probe = createServer().listen(0, () => {
    const { port } = probe.address();
    probe.close(() => done(port));
  });
});
const server = spawn(process.execPath, [join(root, "scripts/serve-out.mjs"), "--port", String(port)], {
  cwd: root,
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: basePath },
  stdio: "ignore",
});
const base = `http://localhost:${port}${basePath}`;
for (let i = 0; i < 50; i++) {
  if (await fetch(`${base}/`).then((r) => r.ok, () => false)) break;
  await new Promise((r) => setTimeout(r, 100));
}

const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? `  (${detail})` : ""}`);
};

/** A page with the intro marked as played, and hooks to count and sabotage view transitions. */
async function open({ calm = false, reduced = false, init } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference" });
  await context.addInitScript(
    ({ calm }) => {
      try {
        sessionStorage.setItem("summit:intro-played", "1");
        if (calm) localStorage.setItem("summit:calm-map", "1");
      } catch {}
      // Counts calls that reach the browser's API and, when armed, aborts the next one:
      // "skip" right after it starts, "timeout" by holding the DOM update past Chrome's 4 s
      // limit, "fail" by rejecting the update after it ran.
      window.__vt = { native: 0, abort: null, last: null };
      const start = Document.prototype.startViewTransition;
      if (!start) return;
      Document.prototype.startViewTransition = function (arg) {
        window.__vt.native++;
        const kind = window.__vt.abort;
        window.__vt.abort = null;
        const update = typeof arg === "function" ? arg : arg?.update;
        let sabotaged = arg;
        if (kind === "timeout" || kind === "fail") {
          const wrapped =
            kind === "timeout"
              ? async () => {
                  await new Promise((r) => setTimeout(r, 4500));
                  return update?.();
                }
              : async () => {
                  await update?.();
                  throw new Error("simulated update failure");
                };
          sabotaged = typeof arg === "function" ? wrapped : { ...arg, update: wrapped };
        }
        const transition = start.call(this, sabotaged);
        const last = (window.__vt.last = { kind, ready: "pending" });
        transition.ready.then(
          () => (last.ready = "ran"),
          (e) => (last.ready = e?.name ?? "rejected"),
        );
        if (kind === "skip") transition.skipTransition();
        return transition;
      };
    },
    { calm },
  );
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return { context, page, errors };
}

/** Waits until the page is settled (route, terrain, heading, no transition), then reports. */
async function settle(page, { path, terrain }) {
  await page.waitForURL((url) => url.pathname === `${basePath}${path}`, { timeout: 15000 });
  await page
    .waitForFunction(
      ({ terrain }) => {
        const backdrop = document.querySelector("[data-field]");
        const h1 = [...document.querySelectorAll("main h1")].find((h) => h.getClientRects().length);
        const vt = document.getAnimations().some((a) => a.effect?.pseudoElement?.startsWith("::view-transition"));
        // Entrances (reveals, settles) still running are not "left hidden": wait for them.
        const entering = document
          .getAnimations()
          .some((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity);
        return (
          !vt &&
          !entering &&
          !document.documentElement.hasAttribute("data-route-fade") &&
          (!terrain || backdrop?.dataset.terrain === terrain) &&
          (!h1 || !["hold", "settle"].includes(h1.getAttribute("data-arrive") ?? ""))
        );
      },
      { terrain },
      { timeout: 15000, polling: 100 },
    )
    .catch(() => {});
  return page.evaluate(() => {
    const visible = (el) => el && el.getClientRects().length > 0;
    const main = [...document.querySelectorAll("main")].find(visible);
    const h1 = main?.querySelector("h1");
    const opacity = (el) => Number(getComputedStyle(el).opacity);
    // Content the transition or its fallbacks could leave hidden.
    const hidden = [
      main,
      h1,
      ...(h1?.querySelectorAll('[class*="glyph"]') ?? []),
      ...(main?.querySelectorAll(".reveal, [style*='view-transition-name']") ?? []),
    ]
      .filter((el) => el && visible(el) && (opacity(el) < 0.99 || getComputedStyle(el).visibility === "hidden"))
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`);
    const openingCards = [...document.querySelectorAll('article[data-opening="true"]')].filter(visible).length;
    return {
      path: location.pathname,
      h1: h1?.getAttribute("aria-label") ?? null,
      arrive: h1?.getAttribute("data-arrive") ?? null,
      hidden: [...new Set(hidden)],
      openingCards,
      field: document.querySelector("[data-field]")?.dataset.field,
      terrain: document.querySelector("[data-field]")?.dataset.terrain ?? null,
      focus: document.activeElement?.closest("article")?.dataset.slug ?? document.activeElement?.tagName.toLowerCase(),
      native: window.__vt.native,
      last: window.__vt.last,
    };
  });
}

// --- transitions -------------------------------------------------------------------------------
async function transitions() {
  const card = { slug: "kibon", path: "/work/kibon/", title: "kiBon 2.0", terrain: "dvb-001" };
  const modes = [
    { name: "full motion, transition runs", abort: null },
    { name: "full motion, transition skipped", abort: "skip" },
    { name: "full motion, DOM update times out", abort: "timeout" },
    { name: "full motion, DOM update fails", abort: "fail" },
    { name: "Calm map (no view transitions)", calm: true },
    { name: "reduced motion emulated (no view transitions)", reduced: true },
  ];
  for (const mode of modes) {
    console.log(`\n${mode.name}`);
    const { context, page, errors } = await open(mode);
    const fieldOn = !mode.calm && !mode.reduced;
    await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
    if (fieldOn) await page.waitForSelector('[data-field="on"]', { timeout: 20000 }).catch(() => {});
    const arm = () => page.evaluate((kind) => (window.__vt.abort = kind), mode.abort ?? null);
    const expectPage = (r, label, want) => {
      check(`${label}: ${want.title ?? "deck"} at ${want.path}`, r.path === `${basePath}${want.path}` && r.h1 === (want.title ?? r.h1), `${r.path} "${r.h1}"`);
      if (fieldOn) check(`${label}: field shows ${want.terrain}`, r.terrain === want.terrain, `data-terrain=${r.terrain}`);
      else check(`${label}: poster, field paused`, r.field === "off", `data-field=${r.field}`);
      check(`${label}: nothing left hidden`, r.hidden.length === 0 && r.openingCards === 0 && r.arrive !== "hold", JSON.stringify({ hidden: r.hidden, openingCards: r.openingCards, arrive: r.arrive }));
      if (mode.abort) check(`${label}: transition was aborted`, r.last?.kind === mode.abort && r.last.ready !== "ran", `ready: ${r.last?.ready}`);
    };

    await arm();
    await page.locator(`article[data-slug="${card.slug}"] a`).first().click();
    expectPage(await settle(page, { path: card.path, terrain: fieldOn ? card.terrain : null }), "open card", card);

    await arm();
    await page.goBack();
    const back = await settle(page, { path: "/", terrain: fieldOn ? "region" : null });
    expectPage(back, "back", { path: "/", terrain: "region" });
    check("back: focus on the card", back.focus === card.slug, `focus=${back.focus}`);

    await arm();
    await page.goForward();
    const again = await settle(page, { path: card.path, terrain: fieldOn ? card.terrain : null });
    expectPage(again, "forward", card);
    if (mode.calm || mode.reduced) check("no View Transition API call", again.native === 0, `native calls=${again.native}`);
    else check("View Transition API used", again.native >= 3, `native calls=${again.native}`);
    // React reports aborted transitions as recoverable errors (window.reportError): expected
    // here, since the aborts are simulated. Anything else is a failure.
    const expected = /simulated update failure|Transition was skipped|timeout in DOM update|ViewTransition (was aborted|timed out)/;
    const unexpected = errors.filter((e) => !(mode.abort && expected.test(e)));
    check("no unexpected page errors", unexpected.length === 0, unexpected.join("; "));
    await context.close();
  }
}

// --- heightmap decode check -----------------------------------------------------------------------
// Simulates a browser that colour-manages the WebP (a gamma curve on the decoded R and G values)
// and checks the session fallback: raw heights when DecompressionStream exists, else the poster.
const colourManaged = ({ noDecompression }) => {
  if (noDecompression) delete window.DecompressionStream;
  const original = window.createImageBitmap.bind(window);
  window.createImageBitmap = async (source, ...rest) => {
    const bitmap = await original(source, ...rest);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    const img = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    for (let i = 0; i < img.data.length; i += 4) for (const k of [0, 1]) img.data[i + k] = Math.round(255 * (img.data[i + k] / 255) ** 0.9);
    ctx.putImageData(img, 0, 0);
    return original(canvas);
  };
};
// Counts and times readPixels: the decode check is the field's only read-back.
const timeReadPixels = () => {
  window.__readPixels = { calls: 0, ms: 0 };
  const original = WebGL2RenderingContext.prototype.readPixels;
  WebGL2RenderingContext.prototype.readPixels = function (...args) {
    const t = performance.now();
    const result = original.apply(this, args);
    window.__readPixels.calls++;
    window.__readPixels.ms += performance.now() - t;
    return result;
  };
};

async function decode() {
  const modes = [
    { name: "WebP decodes exactly", expect: "image" },
    { name: "WebP colour-managed: raw heights", expect: "raw", simulate: {} },
    { name: "WebP colour-managed, no DecompressionStream: poster", expect: "none", simulate: { noDecompression: true } },
  ];
  for (const mode of modes) {
    console.log(`\n${mode.name}`);
    const { context, page, errors } = await open({ init: timeReadPixels });
    if (mode.simulate) await context.addInitScript(colourManaged, mode.simulate);
    const warnings = [];
    const files = [];
    page.on("console", (m) => m.type() === "warning" && m.text().includes("[terrain]") && warnings.push(m.text()));
    page.on("request", (r) => /\/terrain\/.*\.(webp|bin)$/.test(r.url()) && files.push(r.url().replace(/.*\/terrain\//, "")));
    const state = () =>
      page.evaluate(() => ({
        field: document.querySelector("[data-field]")?.dataset.field,
        terrain: document.querySelector("[data-field]")?.dataset.terrain ?? null,
        path: sessionStorage.getItem("summit:hm-decode") ?? "image",
        readPixels: window.__readPixels,
      }));

    await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector("[data-field]")?.dataset.terrain || sessionStorage.getItem("summit:hm-decode") === "none", null, { timeout: 20000 }).catch(() => {});
    let s = await state();
    check(`decode path: ${mode.expect}`, s.path === mode.expect, `path=${s.path}`);
    if (mode.expect === "none") {
      await page.waitForTimeout(1500);
      s = await state();
      check("field stays on the poster", s.field === "off", `data-field=${s.field}`);
      check("no raw heights fetched", !files.some((f) => f.endsWith(".bin")), files.join(", "));
    } else {
      check("field shows the region", s.field === "on" && s.terrain === "region", `data-field=${s.field} data-terrain=${s.terrain}`);
      const want = mode.expect === "raw" ? ".bin" : ".webp";
      check(`region heightmap via ${want}`, files.some((f) => f.startsWith("heightmap-") && f.endsWith(want)), files.join(", "));
      // 16 reference texels per checked heightmap: the image path, plus the raw one after a mismatch.
      const want16 = mode.expect === "raw" ? 32 : 16;
      check("reference texels read back once", s.readPixels.calls === want16, `${s.readPixels.calls} readPixels`);
      check("read-back never blocks the main thread", s.readPixels.ms < 5, `${s.readPixels.ms.toFixed(2)} ms in readPixels`);
      // A card's terrain goes through the same path.
      await page.locator('article[data-slug="kibon"] a').first().click();
      const r = await settle(page, { path: "/work/kibon/", terrain: "dvb-001" });
      check("card terrain shown after navigation", r.terrain === "dvb-001", `data-terrain=${r.terrain}`);
      check(`card heightmap via ${want}`, files.includes(`morph/dvb-001${want}`), files.join(", "));
    }
    check(mode.expect === "image" ? "no warning" : "one console warning naming the browser", mode.expect === "image" ? warnings.length === 0 : warnings.length === 1 && /\] (Chrome|Edge|Firefox|Safari|Opera) \d/.test(warnings[0]), warnings.join(" | "));

    // Same session, next page load: the result is remembered, nothing is checked or warned again.
    files.length = 0;
    warnings.length = 0;
    await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
    await page.waitForTimeout(mode.expect === "none" ? 2500 : 0);
    if (mode.expect !== "none") await page.waitForFunction(() => document.querySelector("[data-field]")?.dataset.terrain === "region", null, { timeout: 20000 }).catch(() => {});
    s = await state();
    check("reload: no new warning, no repeated read-back", warnings.length === 0 && s.readPixels.calls === 0, `${warnings.length} warning(s), ${s.readPixels.calls} read-back(s)`);
    if (mode.expect === "raw") check("reload: WebP not fetched again", !files.some((f) => f.endsWith(".webp")), files.join(", "));
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }
}

const scenarios = { transitions, decode };
try {
  for (const [name, run] of Object.entries(scenarios)) if (!only || only === name) await run();
} finally {
  await browser.close();
  server.kill();
}
console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
