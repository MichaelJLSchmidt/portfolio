// End-to-end checks in Chromium against the static export (build first, e.g. with
// NEXT_PUBLIC_BASE_PATH=/portfolio NEXT_PUBLIC_PREVIEW=1 npm run build):
//
//   npm run test:e2e                  all scenarios
//   npm run test:e2e -- transitions   aborted view transitions; the calm and still motion modes
//   npm run test:e2e -- modes         full, calm and still on a card → case study → next round trip
//   npm run test:e2e -- hydration     direct loads of every route: no hydration or console errors
//   npm run test:e2e -- primitives    the motion lab: layout shift per primitive, focus parity
//                                     (needs a build with the lab: SITE_MODE=basecamp or a preview)
//   npm run test:e2e -- decode        heightmap decode check and its fallbacks
//   npm run test:e2e -- casestudy     the case-study template on the example page (needs a build
//                                     that includes examples: SITE_MODE=basecamp or a preview)
//
// Serves ./out like a static host (base path read from the build) and drives Chromium with
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
async function open({ calm = false, reduced = false, classic = false, init } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference" });
  await context.addInitScript(
    ({ calm, classic }) => {
      try {
        sessionStorage.setItem("summit:intro-played", "1");
        if (calm) localStorage.setItem("summit:calm-map", "1");
        if (classic) sessionStorage.setItem("summit:vt", "classic");
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
    { calm, classic },
  );
  await context.addInitScript(() => {
    // The return choreography's traces: html[data-vt], the named exit parts, the card rebuild.
    window.__return = { vt: 0, exits: 0, reassemble: 0 };
    document.addEventListener("DOMContentLoaded", () => {
      new MutationObserver((records) => {
        for (const r of records) {
          const el = r.target;
          if (r.attributeName === "data-vt" && el.getAttribute("data-vt") === "return") window.__return.vt++;
          if (r.attributeName === "data-reassemble" && el.hasAttribute("data-reassemble")) window.__return.reassemble++;
          if (r.attributeName === "style" && el.style?.viewTransitionName?.startsWith("vt-exit")) window.__return.exits++;
        }
      }).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-vt", "data-reassemble", "style"] });
    });
  });
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
      ...(main?.querySelectorAll("[data-reveal], [style*='view-transition-name']") ?? []),
      // The deck cards after a return: every part rebuilt, the name readable.
      ...(main?.querySelectorAll("article[data-slug] [class*='nameBar'], article[data-slug] [class*='typeLine'], article[data-slug] [class*='rules'], article[data-slug] [class*='stats'], article[data-slug] [class*='collector']") ?? []),
    ]
      .filter((el) => el && visible(el) && (opacity(el) < 0.99 || getComputedStyle(el).visibility === "hidden"))
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`);
    const openingCards = [...document.querySelectorAll('article[data-opening="true"]')].filter(visible).length;
    const nameColours = [...(main?.querySelectorAll("article[data-slug] h2, article[data-slug] h3") ?? [])].map((h) => getComputedStyle(h).color);
    if (nameColours.some((c) => c === "rgba(0, 0, 0, 0)")) hidden.push("card name (transparent)");
    return {
      path: location.pathname,
      h1: (h1?.querySelector(".visually-hidden") ?? h1)?.textContent ?? null,
      arrive: h1?.getAttribute("data-arrive") ?? null,
      hidden: [...new Set(hidden)],
      openingCards,
      field: document.querySelector("[data-field]")?.dataset.field,
      terrain: document.querySelector("[data-field]")?.dataset.terrain ?? null,
      focus: document.activeElement?.closest("article")?.dataset.slug ?? document.activeElement?.tagName.toLowerCase(),
      native: window.__vt.native,
      last: window.__vt.last,
      ret: { ...window.__return },
      rebuilding: document.querySelectorAll("[data-reassemble]").length,
      vtAttr: document.documentElement.getAttribute("data-vt"),
    };
  });
}

// The card the round trips open: a flagged example (there is no real case study yet), so these
// scenarios need a build that includes examples (SITE_MODE=basecamp or a preview).
const FLOW = { slug: "test-project", path: "/work/test-project/", title: "Test Project", terrain: "lab-099" };
const hasFlow = () => {
  if (existsSync(join(root, `out${FLOW.path}index.html`))) return true;
  console.log(`  skipped: no ${FLOW.path} in this build (build with SITE_MODE=basecamp)`);
  return false;
};

// --- transitions -------------------------------------------------------------------------------
async function transitions() {
  if (!hasFlow()) return;
  const card = FLOW;
  const modes = [
    { name: "full motion, transition runs", abort: null },
    { name: "full motion, previous return (?vt=classic)", abort: null, classic: true },
    { name: "full motion, transition skipped", abort: "skip" },
    { name: "full motion, DOM update times out", abort: "timeout" },
    { name: "full motion, DOM update fails", abort: "fail" },
    { name: "calm (Calm map switch): view transitions, still field", calm: true },
    { name: "still (reduced motion emulated): no view transitions", reduced: true },
  ];
  for (const mode of modes) {
    console.log(`\n${mode.name}`);
    const { context, page, errors } = await open(mode);
    // Full and calm run the field (calm holds it still); still shows the poster.
    const fieldOn = !mode.reduced;
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

    // The way back: card reassembly in full motion, the previous morph with ?vt=classic.
    const choreography = fieldOn && !mode.abort;
    const expectReturn = (r, label, before) => {
      check(`${label}: focus on the card`, r.focus === card.slug, `focus=${r.focus}`);
      check(`${label}: card rebuilt and done`, r.rebuilding === 0 && r.vtAttr === null, `rebuilding=${r.rebuilding} data-vt=${r.vtAttr}`);
      if (!choreography) return;
      const ran = r.ret.vt > before.vt && r.ret.exits > before.exits && r.ret.reassemble > before.reassemble;
      if (mode.classic) check(`${label}: previous return, no reassembly`, r.ret.vt === before.vt && r.ret.reassemble === before.reassemble, JSON.stringify(r.ret));
      else check(`${label}: exit, travel and reassembly ran`, ran, JSON.stringify({ before, after: r.ret }));
    };
    const returnTrace = () => page.evaluate(() => ({ ...window.__return }));

    await arm();
    let before = await returnTrace();
    await page.goBack();
    const back = await settle(page, { path: "/", terrain: fieldOn ? "region" : null });
    expectPage(back, "back", { path: "/", terrain: "region" });
    expectReturn(back, "back", before);

    await arm();
    await page.goForward();
    const again = await settle(page, { path: card.path, terrain: fieldOn ? card.terrain : null });
    expectPage(again, "forward", card);

    // The in-page back link takes the same way back.
    await arm();
    before = await returnTrace();
    await page.locator(`main nav a[href="${basePath}/"]`).first().click();
    const link = await settle(page, { path: "/", terrain: fieldOn ? "region" : null });
    expectPage(link, "back link", { path: "/", terrain: "region" });
    expectReturn(link, "back link", before);

    await arm();
    await page.locator(`article[data-slug="${card.slug}"] a`).first().click();
    const reopen = await settle(page, { path: card.path, terrain: fieldOn ? card.terrain : null });
    expectPage(reopen, "open again", card);
    if (mode.reduced) check("no View Transition API call", reopen.native === 0, `native calls=${reopen.native}`);
    else check("View Transition API used", reopen.native >= 5, `native calls=${reopen.native}`);
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
      if (hasFlow()) {
        await page.locator(`article[data-slug="${FLOW.slug}"] a`).first().click();
        const r = await settle(page, { path: FLOW.path, terrain: FLOW.terrain });
        check("card terrain shown after navigation", r.terrain === FLOW.terrain, `data-terrain=${r.terrain}`);
        check(`card heightmap via ${want}`, files.includes(`morph/${FLOW.terrain}${want}`), files.join(", "));
      }
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

// --- case-study template ------------------------------------------------------------------------
// On the flagged example, which uses every building block: the "On this page" trail (scroll-spy,
// aria-current, keyboard), the lightbox (focus in and out, Esc, zoom buttons), the before/after
// comparison (keyboard, view buttons), hotspots, and the fallbacks without JavaScript.
const EXAMPLE = "/work/test-project/";

async function casestudy() {
  if (!existsSync(join(root, `out${EXAMPLE}index.html`))) {
    console.log(`\ncase-study template: skipped (no ${EXAMPLE} in this build; build with SITE_MODE=basecamp)`);
    return;
  }
  const url = `${base}${EXAMPLE}`;
  const trail = 'nav[aria-label="On this page"]';
  const waitFor = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 8000, polling: 50 }).then(() => true, () => false);

  console.log("\ncase-study template: trail, desktop 1440×900");
  {
    const { context, page, errors } = await open();
    await page.goto(url, { waitUntil: "networkidle" });
    const info = await page.evaluate((trail) => {
      const nav = document.querySelector(trail);
      const links = [...(nav?.querySelectorAll("a") ?? [])];
      return {
        visible: !!nav && nav.getClientRects().length > 0,
        position: nav ? getComputedStyle(nav).position : null,
        links: links.map((a) => a.getAttribute("href")),
        h1Linked: links.some((a) => document.querySelector(a.getAttribute("href"))?.querySelector("h1")),
        jumpVisible: !!document.querySelector("#jump-heading")?.getClientRects().length,
        margin: getComputedStyle(document.querySelector("section[data-waypoint] h2")).scrollMarginTop,
        robots: document.querySelector('meta[name="robots"]')?.content,
      };
    }, trail);
    check("trail is a visible, sticky nav labelled “On this page”", info.visible && info.position === "sticky", `position=${info.position}`);
    check("trail lists the six waypoints, not the H1", info.links.length === 6 && !info.h1Linked, info.links.join(" "));
    check("“Jump to” chips hidden from 1200 px", !info.jumpVisible);
    check("waypoint headings have a scroll margin", parseFloat(info.margin) >= 80, info.margin);
    check("the example page is noindex", /noindex/.test(info.robots ?? ""), info.robots);
    await page.evaluate(() => document.getElementById("discovery").scrollIntoView({ block: "start" }));
    const spied = await waitFor(page, (t) => document.querySelector(`${t} a[aria-current="true"]`)?.getAttribute("href") === "#discovery", trail);
    const current = await page.locator(`${trail} a[aria-current="true"]`).count();
    check("scroll-spy marks the waypoint being read (aria-current=true)", spied && current === 1, `${current} current`);
    // Keyboard: Tab onto a trail link, Enter follows it.
    await page.focus(`${trail} a[href="#context"]`);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("href"));
    check("Tab moves along the trail", focused === "#decisions", `focus on ${focused}`);
    await page.keyboard.press("Enter");
    const followed = await waitFor(page, (t) => location.hash === "#decisions" && document.querySelector(`${t} a[aria-current="true"]`)?.getAttribute("href") === "#decisions", trail);
    // Smooth scrolling (Lenis, fine pointers) is still gliding: wait until the page stops moving.
    await page.waitForFunction(
      () =>
        new Promise((done) => {
          const y = window.scrollY;
          setTimeout(() => done(window.scrollY === y), 250);
        }),
      null,
      { timeout: 8000, polling: 300 },
    ).catch(() => {});
    const top = await page.evaluate(() => Math.round(document.getElementById("decisions").getBoundingClientRect().top));
    check("Enter jumps to the waypoint and the trail follows", followed, `hash=${await page.evaluate(() => location.hash)}`);
    check("the waypoint lands below the HUD", top >= 40 && top <= 160, `top=${top}px`);
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }

  console.log("\ncase-study template: phone 390×844");
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    const info = await page.evaluate((trail) => ({
      trail: !!document.querySelector(trail)?.getClientRects().length,
      jump: !!document.querySelector("#jump-heading")?.getClientRects().length,
      next: [...document.querySelectorAll("section[data-waypoint] a")].filter((a) => /^Next waypoint/.test(a.textContent) && a.getClientRects().length).length,
      top: [...document.querySelectorAll('section[data-waypoint] a[href="#main"]')].filter((a) => a.getClientRects().length).length,
      width: document.documentElement.scrollWidth,
      markers: [...document.querySelectorAll("button[data-hotspot]")].map((b) => b.getBoundingClientRect()).map((r) => Math.min(r.width, r.height)),
    }), trail);
    check("trail hidden, “Jump to” chips shown", !info.trail && info.jump);
    check("each waypoint ends with “Next waypoint” (5) and “Back to top” (6)", info.next === 5 && info.top === 6, `${info.next} next, ${info.top} back`);
    check("no sideways scrolling", info.width <= 390, `${info.width}px`);
    check("hotspot markers at least 24×24 px", info.markers.length === 5 && info.markers.every((m) => m >= 24), info.markers.join(", "));
    // The lightbox on touch: two fingers pinch, one finger pans.
    const fig = page.locator("figure[data-zoom]").first();
    await fig.scrollIntoViewIfNeeded();
    await fig.locator("button[data-lightbox-open]").waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    await fig.locator("button[data-lightbox-open]").tap();
    await page.waitForSelector("dialog[open]", { timeout: 5000 }).catch(() => {});
    const box = await page.locator("dialog[open] [data-lightbox-stage]").boundingBox();
    const transform = () => page.evaluate(() => document.querySelector("dialog[open] img")?.style.transform ?? "");
    if (box) {
      const cdp = await context.newCDPSession(page);
      const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
      const pinch = (type, d) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: cx - d, y: cy, id: 1 }, { x: cx + d, y: cy, id: 2 }] });
      await pinch("touchStart", 30);
      for (let d = 40; d <= 90; d += 10) await pinch("touchMove", d);
      await pinch("touchEnd", 0);
      const pinched = await transform();
      const pan = (type, x) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y: cy, id: 3 }] });
      await pan("touchStart", cx);
      for (let x = cx; x >= cx - 60; x -= 10) await pan("touchMove", x);
      await pan("touchEnd", 0);
      const panned = await transform();
      const scale = Number(pinched.match(/scale\(([\d.]+)\)/)?.[1] ?? 1);
      const tx = (t) => Number(t.match(/translate\((-?[\d.]+)px/)?.[1] ?? 0);
      check("lightbox: pinch zooms on touch", scale > 1.5, pinched);
      check("lightbox: one finger pans when zoomed", tx(panned) < tx(pinched) - 30, panned);
    } else check("lightbox opens on tap", false);
    await context.close();
  }

  console.log("\ncase-study template: lightbox");
  for (const reduced of [false, true]) {
    const { context, page, errors } = await open({ reduced });
    await page.goto(url, { waitUntil: "networkidle" });
    const fig = page.locator("figure[data-zoom]").first();
    await fig.scrollIntoViewIfNeeded();
    const button = fig.locator("button[data-lightbox-open]");
    await button.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    const before = await fig.evaluate((f) => ({
      fallback: f.querySelector("[data-lightbox-fallback]")?.hidden,
      name: f.querySelector("button[data-lightbox-open]")?.textContent.trim(),
    }));
    check(`${reduced ? "(reduced) " : ""}“Enlarge” button replaces the full-size link`, before.fallback === true && before.name === "Enlarge", JSON.stringify(before));
    await button.focus();
    await page.keyboard.press("Enter");
    const opened = await waitFor(page, () => document.querySelector("dialog[data-lightbox][open]"));
    const inside = await page.evaluate(() => {
      const d = document.querySelector("dialog[data-lightbox][open]");
      const img = d?.querySelector("img");
      return {
        focusInside: !!d?.contains(document.activeElement),
        src: img?.currentSrc || img?.getAttribute("src"),
        caption: !!d?.querySelector("p")?.textContent,
        transition: img ? getComputedStyle(img).transitionDuration : null,
      };
    });
    check(`${reduced ? "(reduced) " : ""}dialog opens with focus inside`, opened && inside.focusInside);
    check(`${reduced ? "(reduced) " : ""}the largest source loads on open`, /-(2400|2560)\.(avif|webp)$/.test(inside.src ?? ""), inside.src);
    if (reduced) check("no zoom animation with reduced motion", inside.transition === "0s", inside.transition);
    const label = (z) => page.locator(`dialog[open] button[data-zoom="${z}"]`).getAttribute("aria-label");
    if (!reduced) {
      // Wheel and click zoom around the pointer (desktop).
      const stage = await page.locator("dialog[open] [data-lightbox-stage]").boundingBox();
      await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
      await page.mouse.wheel(0, -300);
      const wheeled = await label("in");
      await page.locator('dialog[open] button[data-zoom="reset"]').click();
      await page.mouse.click(stage.x + stage.width / 2, stage.y + stage.height / 2);
      const clicked = await label("in");
      await page.locator('dialog[open] button[data-zoom="reset"]').click();
      check("wheel and click zoom in", !/currently 100%/.test(wheeled ?? "") && /currently 150%/.test(clicked ?? ""), `${wheeled} | ${clicked}`);
    }
    await page.locator('dialog[open] button[data-zoom="in"]').click();
    const zoomed = await label("in");
    await page.locator('dialog[open] button[data-zoom="out"]').click();
    await page.locator('dialog[open] button[data-zoom="in"]').click();
    await page.locator('dialog[open] button[data-zoom="reset"]').click();
    const reset = await label("reset");
    check(`${reduced ? "(reduced) " : ""}zoom buttons name the zoom level`, /150%/.test(zoomed ?? "") && /100%/.test(reset ?? ""), `${zoomed} | ${reset}`);
    await page.keyboard.press("Escape");
    const closed = await waitFor(page, () => !document.querySelector("dialog[data-lightbox][open]"));
    const back = await page.evaluate(() => document.activeElement?.matches("button[data-lightbox-open]"));
    check(`${reduced ? "(reduced) " : ""}Esc closes it and focus returns to “Enlarge”`, closed && back);
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }

  console.log("\ncase-study template: before/after and hotspots");
  {
    const { context, page, errors } = await open();
    await page.goto(url, { waitUntil: "networkidle" });
    const cmp = page.locator("figure[data-kind=compare]");
    await cmp.scrollIntoViewIfNeeded();
    await waitFor(page, () => document.querySelector("[data-compare]")?.dataset.enhanced === "true");
    const range = cmp.locator('input[type="range"]');
    check("slider is a native range labelled “Compare before and after”", (await range.getAttribute("aria-label")) === "Compare before and after");
    await range.focus();
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowLeft");
    const after5 = await cmp.evaluate((f) => ({ value: f.querySelector("input").value, pos: f.querySelector("[data-compare]").style.getPropertyValue("--pos"), text: f.querySelector("input").getAttribute("aria-valuetext") }));
    check("arrow keys move the clip", after5.value === "45" && after5.pos === "45%" && after5.text === "45% before, 55% after", JSON.stringify(after5));
    const view = (v) => cmp.locator(`button[data-compare-view="${v}"]`);
    await view("before").click();
    const b = await cmp.evaluate((f) => ({ value: f.querySelector("input").value, pressed: f.querySelector('[data-compare-view="before"]').getAttribute("aria-pressed") }));
    await view("side").click();
    const side = await cmp.evaluate((f) => ({ view: f.querySelector("[data-compare]").dataset.view, pressed: f.querySelector('[data-compare-view="side"]').getAttribute("aria-pressed") }));
    await view("after").click();
    const a = await cmp.evaluate((f) => ({ value: f.querySelector("input").value, view: f.querySelector("[data-compare]").dataset.view, pressed: f.querySelector('[data-compare-view="after"]').getAttribute("aria-pressed") }));
    check("“Before”, “Side by side”, “After” set the view (aria-pressed)", b.value === "100" && b.pressed === "true" && side.view === "side" && side.pressed === "true" && a.value === "0" && a.view === "slider" && a.pressed === "true", JSON.stringify({ b, side, a }));

    const hot = page.locator("figure[data-kind=hotspots]");
    await hot.scrollIntoViewIfNeeded();
    await hot.locator('button[data-hotspot="3"]').click();
    await waitFor(page, () => document.querySelector('button[data-hotspot="3"]')?.getAttribute("aria-pressed") === "true");
    const hs = await hot.evaluate((f) => ({
      pressed: [...f.querySelectorAll("button[data-hotspot]")].map((m) => m.getAttribute("aria-pressed")).join(""),
      active: [...f.querySelectorAll("[data-note]")].filter((n) => n.hasAttribute("data-active")).map((n) => n.dataset.note),
      notesVisible: [...f.querySelectorAll("[data-note]")].every((n) => n.getClientRects().length),
      named: f.querySelector('button[data-hotspot="3"]').getAttribute("aria-label"),
    }));
    check("a marker highlights its note in the visible list", hs.pressed === "falsefalsetruefalsefalse" && hs.active.join() === "3" && hs.notesVisible, JSON.stringify(hs));
    check("markers are named buttons", /^Note 3: /.test(hs.named ?? ""), hs.named);
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }

  console.log("\ncase-study template: without JavaScript");
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "load" });
    const r = await page.evaluate(() => {
      const visible = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
      const cmp = document.querySelector("figure[data-kind=compare]");
      const img = (prefix) => [...cmp.querySelectorAll("img")].find((i) => i.alt.startsWith(prefix));
      const [before, after] = [img("Before"), img("After")].map((i) => i.getBoundingClientRect());
      const zoom = document.querySelector("figure[data-zoom]");
      return {
        stacked: before.height > 0 && after.height > 0 && before.bottom <= after.top + 1,
        alts: [...cmp.querySelectorAll("img")].map((i) => i.alt),
        beforeFirst: cmp.querySelector("img")?.alt.startsWith("Before"),
        rangeHidden: !visible(cmp.querySelector('input[type="range"]')),
        fallback: visible(zoom.querySelector("[data-lightbox-fallback]")) ? zoom.querySelector("[data-lightbox-fallback]").getAttribute("href") : null,
        enlargeHidden: !visible(zoom.querySelector("[data-lightbox-open]")),
        notes: [...document.querySelectorAll("figure[data-kind=hotspots] [data-note]")].filter(visible).length,
        describe: [...document.querySelectorAll("details > summary")].filter((s) => s.textContent === "Describe this diagram").length,
        trailLinks: document.querySelectorAll('nav[aria-label="On this page"] a').length,
        banner: document.querySelector('[role="note"]')?.textContent ?? "",
        missingAlt: [...document.querySelectorAll("main img")].filter((i) => !i.hasAttribute("alt")).length,
      };
    });
    check("before and after stack, each with its own alt text, before first", r.stacked && r.beforeFirst && r.alts.every((a) => a.length > 10) && r.rangeHidden, JSON.stringify(r.alts));
    check("“Open full-size image” link instead of the lightbox", !!r.fallback && r.enlargeHidden, r.fallback);
    check("hotspot notes listed", r.notes === 5, `${r.notes} notes`);
    check("long descriptions behind “Describe this diagram”", r.describe >= 5, `${r.describe}`);
    check("trail links present", r.trailLinks === 6);
    check("fictional-example banner present", /FICTIONAL EXAMPLE|Fictional example/i.test(r.banner), r.banner.slice(0, 60));
    check("every image has an alt attribute", r.missingAlt === 0, `${r.missingAlt} without`);
    await context.close();
  }
}

// --- motion modes ---------------------------------------------------------------------------------
// Records what moves: CSS animations and transitions by property (with their durations), inline
// transforms written by script, glint passes, and the field's WebGL draws. Installed before load.
const motionProbe = () => {
  window.__motion = { anims: [], transitions: [], styleTransforms: 0, glints: 0, draws: 0 };
  const positional = /^(transform|translate|scale|rotate|font-stretch|font-weight|font-variation-settings|left|top|right|bottom|width|height|clip-path|background-position)$/;
  document.addEventListener(
    "animationstart",
    (e) => {
      const anim = e.target.getAnimations?.().find((a) => a.animationName === e.animationName);
      const frames = anim?.effect?.getKeyframes?.() ?? [];
      const props = [...new Set(frames.flatMap((f) => Object.keys(f)).filter((k) => !["offset", "easing", "composite", "computedOffset"].includes(k)))];
      const timing = anim?.effect?.getComputedTiming?.() ?? {};
      window.__motion.anims.push({ name: e.animationName, props, positional: props.some((p) => positional.test(p.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`))), ms: timing.duration, where: e.target.className?.toString?.().slice(0, 40) ?? e.target.tagName });
    },
    true,
  );
  document.addEventListener(
    "transitionrun",
    (e) => {
      const ms = parseFloat(getComputedStyle(e.target).transitionDuration) * 1000;
      window.__motion.transitions.push({ prop: e.propertyName, positional: positional.test(e.propertyName), where: e.target.className?.toString?.().slice(0, 40) ?? e.target.tagName, ms });
    },
    true,
  );
  document.addEventListener("DOMContentLoaded", () => {
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName === "data-glint" && r.target.getAttribute("data-glint") === "play") window.__motion.glints++;
        if (r.attributeName === "style" && /transform|translate/.test(r.target.getAttribute("style") ?? "") && !/view-transition/.test(r.target.getAttribute("style") ?? "")) window.__motion.styleTransforms++;
      }
    }).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["style", "data-glint"] });
  });
  for (const ctx of [window.WebGL2RenderingContext, window.WebGLRenderingContext].filter(Boolean)) {
    for (const fn of ["drawArrays", "drawElements"]) {
      const original = ctx.prototype[fn];
      ctx.prototype[fn] = function (...args) {
        window.__motion.draws++;
        return original.apply(this, args);
      };
    }
  }
};

async function modes() {
  if (!hasFlow()) return;
  const card = FLOW;
  for (const mode of ["full", "calm", "still"]) {
    console.log(`\nmotion mode: ${mode}`);
    const { context, page, errors } = await open({ calm: mode === "calm", reduced: mode === "still", init: motionProbe });
    await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
    if (mode !== "still") await page.waitForSelector('[data-field="on"]', { timeout: 20000 }).catch(() => {});
    const html = await page.evaluate(() => ({ motion: document.documentElement.dataset.motion, tier: document.documentElement.dataset.tier }));
    check(`html[data-motion="${mode}"]`, html.motion === mode, JSON.stringify(html));
    // The switch: its visible label is its name (Label in Name), its state matches, its description
    // says what it does, and in still also why it cannot turn motion back on.
    const named = await page.getByRole("switch", { name: "Calm map", exact: true }).count();
    const sw = await page.evaluate(() => {
      const input = document.querySelector('header input[role="switch"]');
      const desc = input?.getAttribute("aria-describedby");
      return { label: input?.closest("label")?.textContent.trim(), checked: input?.checked, described: desc ? document.getElementById(desc)?.textContent ?? "" : "" };
    });
    check("switch named and labelled “Calm map”, state shown", named === 1 && /^calm map$/i.test(sw.label ?? "") && sw.checked === (mode !== "full"), JSON.stringify(sw));
    check("switch described “Reduces motion on this site”", sw.described.startsWith("Reduces motion on this site"), sw.described);
    if (mode === "still") check("still: the switch explains why it is on", /reduced motion/i.test(sw.described), sw.described);

    // Hover and focus the deck heading area, open a card, try the next link, come back.
    await page.mouse.move(400, 400);
    await page.mouse.move(700, 450, { steps: 8 });
    await page.locator(`article[data-slug="${card.slug}"] a`).first().click();
    await settle(page, { path: card.path, terrain: mode === "still" ? null : card.terrain });
    const next = page.locator('nav[aria-label] a[data-variant="display"]').first();
    await next.scrollIntoViewIfNeeded();
    await next.hover();
    await page.waitForTimeout(400);
    await page.mouse.move(5, 5);
    await next.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(400);
    // Idle on the case study: no ambient field frames in calm.
    await page.waitForTimeout(800);
    const idleStart = await page.evaluate(() => window.__motion.draws);
    await page.waitForTimeout(2500);
    const idleDraws = (await page.evaluate(() => window.__motion.draws)) - idleStart;
    // Card → case study morphs; case study → case study has no shared element yet (no View
    // Transition); back to the deck morphs again.
    await next.click();
    await page.waitForTimeout(1500);
    await page.goBack();
    await page.waitForTimeout(1500);
    await page.goBack();
    await settle(page, { path: "/", terrain: mode === "still" ? null : "region" });
    const m = await page.evaluate(() => ({ ...window.__motion, native: window.__vt.native }));
    const moved = [...m.anims.filter((a) => a.positional).map((a) => `${a.name}@${a.where}`), ...m.transitions.filter((t) => t.positional).map((t) => `${t.prop}@${t.where}`)];
    if (mode === "still") {
      check("still: no transform, width or position animation", moved.length === 0 && m.styleTransforms === 0, [...new Set(moved)].slice(0, 8).join(", ") + ` styleTransforms=${m.styleTransforms}`);
      const slow = [...m.anims.filter((a) => a.ms > 200).map((a) => `${a.name} ${a.ms}ms`), ...m.transitions.filter((t) => t.ms > 200).map((t) => `${t.prop} ${t.ms}ms`)];
      check("still: opacity and colour changes within 200 ms", slow.length === 0, [...new Set(slow)].slice(0, 6).join(", "));
      check("still: no View Transition API call", m.native === 0, `native calls=${m.native}`);
    } else {
      check(`${mode}: View Transitions run`, m.native >= 2, `native calls=${m.native}`);
      check(`${mode}: settles and breaths animate`, moved.length > 0, `${moved.length} positional animations`);
    }
    if (mode === "calm") {
      check("calm: no ambient field frames while idle", idleDraws === 0, `${idleDraws} draws in 2.5 s`);
      check("calm: no glint", m.glints === 0, `${m.glints} glints`);
    }
    if (mode === "full") {
      check("full: the field keeps its ambient frames", idleDraws > 0, `${idleDraws} draws in 2.5 s`);
      check("full: a glint marked the first arrival or the commit", m.glints >= 1, `${m.glints} glints`);
    }
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }
}

// --- hydration ------------------------------------------------------------------------------------
// Direct loads of every route: no hydration or console errors, and the motion attributes on <html>
// survive hydration (a failed hydration re-creates the document and drops them).
async function hydration() {
  const routes = ["/", "/about/", "/work/test-project/", "/lab/", "/lab/specimen/", "/no-such-page/"].filter(
    (r) => r === "/no-such-page/" || existsSync(join(root, "out", r, "index.html")),
  );
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    console.log(`\nhydration: direct loads at ${viewport.width}×${viewport.height}`);
    for (const route of routes) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const problems = [];
      page.on("pageerror", (e) => problems.push(e.message.slice(0, 160)));
      page.on("console", (m) => {
        // The 404 page's own document request is expected to fail.
        if (m.type() === "error" && !(route === "/no-such-page/" && /404/.test(m.text()))) problems.push(m.text().slice(0, 160));
      });
      await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      const attrs = await page.evaluate(() => ["data-motion", "data-tier", "data-calm", "data-intro"].map((a) => `${a}=${document.documentElement.getAttribute(a)}`));
      check(`${route}: no hydration or console errors`, problems.length === 0, problems.join(" | "));
      check(`${route}: motion attributes kept`, !attrs.some((a) => a.endsWith("=null")), attrs.join(" "));
      await context.close();
    }
  }
}

// --- primitives (motion lab) ----------------------------------------------------------------------
// Each primitive is exercised on the lab's specimen sheet (hover, focus and press on everything
// interactive, replay and glint buttons, the reveals scrolled into view) and its layout shift
// summed from every shift whose sources lie inside it, input or not (at most 0.005 each). Focus parity: keyboard
// focus gives the signature link exactly the hover state.
async function primitives() {
  if (!existsSync(join(root, "out/lab/specimen/index.html"))) {
    console.log("\nprimitives: skipped (no motion lab in this build; build with SITE_MODE=basecamp)");
    return;
  }
  for (const mode of ["full", "calm", "still"]) {
    console.log(`\nprimitives: layout shift in ${mode}`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: mode === "still" ? "reduce" : "no-preference" });
    await context.addInitScript(() => {
      window.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__shifts.push({ value: e.value, nodes: e.sources.map((s) => s.node).filter(Boolean) });
      }).observe({ type: "layout-shift", buffered: true });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/lab/specimen/?motion=${mode}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const sections = await page.$$eval("[data-primitive]", (els) => els.map((e) => e.dataset.primitive));
    for (const name of sections) {
      const section = page.locator(`[data-primitive="${name}"]`);
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      // Only what the primitive's own motion shifts: loading (the web fonts' swap) is not part of it.
      await page.evaluate(() => (window.__shifts.length = 0));
      // Everything interactive in it: hover, focus, press; then the replay and glint buttons.
      const targets = section.locator("a, button");
      const n = await targets.count();
      for (let i = 0; i < n; i++) {
        const t = targets.nth(i);
        if (!(await t.isVisible())) continue;
        await t.hover();
        await page.waitForTimeout(120);
        const box = await t.boundingBox();
        if (box && (await t.evaluate((el) => el.tagName === "BUTTON"))) {
          await page.mouse.down();
          await page.waitForTimeout(80);
          await page.mouse.up();
        }
        await t.focus();
      }
      await page.mouse.move(2, 2);
      await page.waitForTimeout(1300);
      const cls = await page.evaluate((name) => {
        const root = document.querySelector(`[data-primitive="${name}"]`);
        return window.__shifts.filter((s) => s.nodes.some((n) => root.contains(n))).reduce((sum, s) => sum + s.value, 0);
      }, name);
      check(`${name}: layout shift ≤ 0.005`, cls <= 0.005, cls.toFixed(4));
    }
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }

  console.log("\nprimitives: signature link focus parity");
  for (const where of ["lab", "case study"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(where === "lab" ? `${base}/lab/specimen/?motion=full` : `${base}${FLOW.path}`, { waitUntil: "networkidle" });
    const link = where === "lab" ? page.locator('a[data-variant="display"][data-lab-state="rest"]').first() : page.locator('a[data-variant="display"]').first();
    await link.scrollIntoViewIfNeeded();
    const state = () =>
      link.evaluate((a) => ({
        letters: [...a.querySelectorAll("[style*='--kt-i']")].map((c) => `${getComputedStyle(c).fontStretch}/${getComputedStyle(c).fontWeight}`).join(" "),
        arrow: [...a.querySelectorAll("span")].filter((s) => s.textContent === "→" && s.getClientRects().length).map((s) => getComputedStyle(s).transform).join(" "),
        colour: getComputedStyle(a.querySelector("span[class*='label']") ?? a).color,
      }));
    const rest = await state();
    await link.hover();
    await page.waitForTimeout(700);
    const hovered = await state();
    await page.mouse.move(2, 2);
    await page.waitForTimeout(700);
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(700);
    const focused = await state();
    check(`${where}: hover changes the link`, JSON.stringify(rest) !== JSON.stringify(hovered), JSON.stringify(hovered).slice(0, 120));
    check(`${where}: keyboard focus gives exactly the hover motion`, JSON.stringify(hovered) === JSON.stringify(focused), `${JSON.stringify(hovered).slice(0, 90)} vs ${JSON.stringify(focused).slice(0, 90)}`);
    await context.close();
  }

  // Touch: no sticky hover after a tap ((hover: hover) guards).
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(`${base}/lab/specimen/?motion=full`, { waitUntil: "networkidle" });
    const link = page.locator('a[data-variant="standalone"][data-lab-state="rest"]').first();
    await link.scrollIntoViewIfNeeded();
    const before = await link.evaluate((a) => getComputedStyle(a).getPropertyValue("--on").trim());
    await link.tap();
    await page.waitForTimeout(400);
    const after = await link.evaluate((a) => (a.matches(":focus-visible") ? "focus" : getComputedStyle(a).getPropertyValue("--on").trim()));
    check("touch: a tap leaves no sticky hover", before === "0" && after === "0", `before=${before} after=${after}`);
    await context.close();
  }
}

const scenarios = { transitions, modes, hydration, primitives, decode, casestudy };
try {
  for (const [name, run] of Object.entries(scenarios)) if (!only || only === name) await run();
} finally {
  await browser.close();
  server.kill();
}
console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
