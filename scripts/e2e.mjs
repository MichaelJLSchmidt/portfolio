// End-to-end checks in Chromium against the static export (build first, e.g. with
// NEXT_PUBLIC_BASE_PATH=/portfolio NEXT_PUBLIC_PREVIEW=1 npm run build):
//
//   npm run test:e2e                  all scenarios
//   npm run test:e2e -- transitions   card → case study per tier and on a phone (the art's morph, the
//                                     parts in steps, the header still), next, back, browser back,
//                                     a plain page change, aborted transitions
//   npm run test:e2e -- hydration     direct loads of every route: no hydration or console errors
//   npm run test:e2e -- primitives    the motion lab: layout shift per primitive, focus parity
//                                     (needs a build with the lab: SITE_MODE=basecamp or a preview)
//   npm run test:e2e -- casestudy     the Calm Survey case-study template on the example page (needs a build
//                                     that includes examples: SITE_MODE=basecamp or a preview)
//   npm run test:e2e -- terrain       the living survey: frames at rest, under the pointer, hidden,
//                                     Off, touch; a page change's crossfade; context loss
//                                     (scripts/e2e-terrain.mjs; needs NEXT_PUBLIC_PREVIEW=1)
//   npm run test:e2e -- deck          card order, card link names and the Next case study loop
//                                     (scripts/e2e/deck.mjs; needs the examples)
//   npm run test:e2e -- ia            page structure, header order, the Motion control, the 404, titles
//                                     inside their column (scripts/e2e/layout.mjs)
//   npm run test:e2e -- phone         every route at 320, 360 and 390 px: no overflow, the header and
//                                     footer inside the screen (scripts/e2e/layout.mjs)
//   npm run test:e2e -- fontswap      the web fonts held back on a throttled phone: CLS ≤ 0.05,
//                                     titles keep their boxes (scripts/e2e/typography.mjs)
//   npm run test:e2e -- toast         the footer's Copy address and its toast in full and still
//                                     (scripts/e2e/chrome.mjs)
//   npm run test:e2e -- arrival       route arrivals: timing, focus on the H1, the trailhead morph,
//                                     traversals, Basecamp, still (scripts/e2e/choreography.mjs)
//   npm run test:e2e -- reading       the career line per mode, no endless loops (choreography.mjs)
//   npm run test:e2e -- axe           axe-core WCAG 2.2 A/AA on every route: full, calm, still, a
//                                     phone, forced colours (scripts/e2e/axe.mjs)
//   npm run test:e2e -- access        forced colours, headings read once, haptics (8 ms, never in Off)
//                                     (scripts/e2e/choreography.mjs)
//   npm run test:e2e -- wording       no old names, CV or job-seeking phrases in the built HTML
//                                     (scripts/check-wording.mjs)
//   npm run test:e2e -- inp           the Next case study tap on a throttled phone (INP ≤ 150 ms)
//   npm run test:e2e -- pointer       no pointermove listener but the card tilt (scripts/e2e/interaction.mjs)
//   npm run test:e2e -- wordmark      the relief fill: rest, hover, leave, focus, touch, Calm, Off
//                                     (scripts/e2e/wordmark.mjs)
//   npm run test:e2e -- smoke         a smoke subset in Chromium, WebKit and Firefox (each where
//                                     Playwright has it installed; scripts/e2e/smoke.mjs)
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
import { deck } from "./e2e/deck.mjs";
import { ia, phone, routes as builtRoutes } from "./e2e/layout.mjs";
import { fontswap } from "./e2e/typography.mjs";
import { toast } from "./e2e/chrome.mjs";
import { access, arrival, reading } from "./e2e/choreography.mjs";
import { smoke } from "./e2e/smoke.mjs";
import { inp, pointer } from "./e2e/interaction.mjs";
import { axe } from "./e2e/axe.mjs";
import { wordmark } from "./e2e/wordmark.mjs";
import { wordingHits } from "./check-wording.mjs";

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

/**
 * A page with hooks on view transitions: counts calls that reach the browser's API, records each
 * transition's pseudo-element animations (name, keyframes, duration, delay) and html[data-route-kind],
 * and, when armed, aborts the next one: "skip" right after it starts, "timeout" by holding the DOM
 * update past Chrome's 4 s limit, "fail" by rejecting the update after it ran.
 */
async function open({ calm = false, reduced = false, viewport = { width: 1440, height: 900 }, mobile = false, init } = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: reduced ? "reduce" : "no-preference",
    ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
  });
  await context.addInitScript(
    ({ calm }) => {
      try {
        if (calm) localStorage.setItem("summit:motion", "calm");
      } catch {}
      window.__vt = { native: 0, abort: null, last: null, runs: [] };
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
        const run = { route: null, parts: {} };
        window.__vt.runs.push(run);
        transition.ready.then(
          () => {
            last.ready = "ran";
            run.route = document.documentElement.getAttribute("data-route-kind");
            for (const a of document.getAnimations()) {
              const pe = a.effect?.pseudoElement ?? "";
              const m = pe.match(/^::view-transition-(group|old|new)\((.+)\)$/);
              if (!m || /plus-lighter/.test(a.animationName ?? "")) continue;
              const t = a.effect.getTiming();
              const key = `${m[1]}:${m[2].replace(/^_t_\d+_$/, "page")}`;
              (run.parts[key] ??= []).push({ name: a.animationName, duration: Math.round(t.duration), delay: Math.round(t.delay) });
            }
          },
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

async function settle(page, { path, terrain }) {
  await page.waitForURL((url) => url.pathname === `${basePath}${path}`, { timeout: 15000 });
  await page
    .waitForFunction(
      ({ terrain }) => {
        const backdrop = document.querySelector("[data-field]");
        const vt = document.getAnimations().some((a) => a.effect?.pseudoElement?.startsWith("::view-transition"));
        // Entrances still running are not "left hidden": wait for them (not for endless or
        // scroll-driven ones).
        const entering = document
          .getAnimations()
          .some((a) => a.playState === "running" && a.timeline === document.timeline && a.effect?.getTiming().iterations !== Infinity && !a.effect?.pseudoElement);
        return !vt && !entering && !document.documentElement.hasAttribute("data-route-kind") && (!terrain || backdrop?.dataset.terrain === terrain);
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
    // Content the transition or its fallbacks could leave hidden (reveals still waiting below the
    // fold are not hidden: they play when scrolled to).
    const hidden = [main, h1, ...(main?.querySelectorAll("[data-reveal], [data-vt-part], article[data-slug]") ?? [])]
      .filter((el) => !(el?.getAttribute("data-reveal-state") === "wait" && el.getBoundingClientRect().top >= window.innerHeight))
      .filter((el) => el && visible(el) && (opacity(el) < 0.99 || getComputedStyle(el).visibility === "hidden"))
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`);
    return {
      path: location.pathname,
      hidden: [...new Set(hidden)],
      field: document.querySelector("[data-field]")?.dataset.field,
      terrain: document.querySelector("[data-field]")?.dataset.terrain ?? null,
      focus: document.activeElement?.tagName.toLowerCase(),
      y: Math.round(scrollY),
      native: window.__vt.native,
      last: window.__vt.last,
    };
  });
}

// The card the round trips open: a flagged example (there is no real case study yet), so these
// scenarios need a build that includes examples (SITE_MODE=basecamp or a preview).
const FLOW = { slug: "test-project", path: "/work/test-project/", title: "Test Project", terrain: "moench" };
const hasFlow = () => {
  if (existsSync(join(root, `out${FLOW.path}index.html`))) return true;
  console.log(`  skipped: no ${FLOW.path} in this build (build with SITE_MODE=basecamp)`);
  return false;
};

// --- transitions -------------------------------------------------------------------------------
// The page changes (src/styles/transitions.css), timed from each transition's own animations:
// card → case study per tier and on a phone (the art's morph, the old page leaving, the title,
// meta lines and summary arriving in steps, the header still, the field's crossfade), the next
// case study (its art morphs, the page opens at the top), the in-app back link and browser back
// (240 ms, the scroll position restored), a plain page change, and aborted transitions.
const near = (v, want, tol = 1) => typeof v === "number" && Math.abs(v - want) <= tol;
const first = (run, key) => run?.parts?.[key]?.[0];

async function transitions() {
  console.log("\ntransitions: card → case study, per tier");
  if (!hasFlow()) return;
  const cases = [
    { label: "Full", art: 680, leave: 160, title: [360, 280], parts: [560, 620, 680] },
    { label: "Calm", calm: true, art: 480, leave: 160, title: [360, 280], parts: [560, 560, 560] },
    { label: "phone", mobile: true, viewport: { width: 390, height: 844 }, art: 560, leave: 120, title: [360, 280], parts: [560, 560, 560] },
    { label: "Off", reduced: true, art: 0, leave: 160, title: [0, 160], parts: [0, 0, 0] },
  ];
  for (const c of cases) {
    const { context, page, errors } = await open(c);
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    const card = page.locator(`#case-studies article[data-slug="${FLOW.slug}"] a`);
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    if (c.mobile) await card.tap();
    else await card.click();
    const r = await settle(page, { path: FLOW.path, terrain: FLOW.terrain });
    const run = await page.evaluate(() => window.__vt.runs.at(-1));
    const art = first(run, `group:card-art-${FLOW.slug}`);
    const old = first(run, "old:page");
    const title = first(run, "new:cs-title");
    const parts = ["new:cs-meta", "new:cs-summit", "new:cs-summary"].map((k) => first(run, k)?.delay);
    check(`${c.label}: the card's art morphs into the header plate (${c.art} ms)`, near(art?.duration, c.art), JSON.stringify(art));
    check(`${c.label}: the old page fades out in ${c.leave} ms, no movement`, near(old?.duration, c.leave) && old?.name === "vt-fade-out", JSON.stringify(old));
    check(`${c.label}: the H1 fades in from ${c.title[0]} ms`, near(title?.delay, c.title[0]) && near(title?.duration, c.title[1]), JSON.stringify(title));
    check(`${c.label}: meta, summit and summary from ${c.parts.join("/")} ms`, parts.every((d, i) => near(d, c.parts[i])), JSON.stringify(parts));
    check(`${c.label}: the header never moves`, !run?.parts?.["new:site-header"] && !run?.parts?.["group:site-header"], JSON.stringify(Object.keys(run?.parts ?? {})));
    check(`${c.label}: opened as "open", lands with nothing hidden, the field on the summit`, run?.route === "open" && r.hidden.length === 0 && r.terrain === FLOW.terrain, JSON.stringify(r));
    check(`${c.label}: focus moves to the H1`, r.focus === "h1", r.focus);
    check(`${c.label}: no page errors`, errors.length === 0, errors.join("; "));
    await context.close();
  }

  console.log("\ntransitions: next case study, back, browser back, a plain page change");
  {
    const { context, page, errors } = await open();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.getElementById("case-studies").scrollIntoView({ block: "start" }));
    await page.waitForTimeout(600);
    const homeY = await page.evaluate(() => Math.round(scrollY));
    await page.locator(`#case-studies article[data-slug="${FLOW.slug}"] a`).click();
    await settle(page, { path: FLOW.path, terrain: FLOW.terrain });

    // Next case study: its mini card's art morphs into the next header plate; the page opens at the top.
    const mini = page.locator('nav[aria-label="Next case study"] article a');
    await mini.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const nextSlug = await mini.evaluate((a) => a.closest("article").dataset.slug);
    await mini.click();
    const n = await settle(page, { path: `/work/${nextSlug}/` });
    const nextRun = await page.evaluate(() => window.__vt.runs.at(-1));
    check("next: the mini card's art morphs into the next header plate", near(first(nextRun, `group:card-art-${nextSlug}`)?.duration, 680), JSON.stringify(first(nextRun, `group:card-art-${nextSlug}`)));
    check("next: the page opens at the top", n.y === 0, `y=${n.y}`);

    // The in-app back link: a 240 ms crossfade, home back where it was.
    const back = page.locator('nav[aria-label="Next case study"] a[data-back]');
    await back.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await back.click();
    const b = await settle(page, { path: "/" });
    const backRun = await page.evaluate(() => window.__vt.runs.at(-1));
    check("back link: a 240 ms crossfade", backRun?.route === "back" && near(first(backRun, "old:page")?.duration, 240) && near(first(backRun, "new:page")?.duration, 240), JSON.stringify(first(backRun, "old:page")));
    check("back link: home where it was", Math.abs(b.y - homeY) <= 4, `${b.y} vs ${homeY}`);

    // Browser back: no view transition of React's; the arriving page fades in over 240 ms, and
    // the scroll position comes back.
    const before = await page.evaluate(() => window.__vt.native);
    await page.goBack();
    await page.waitForURL((url) => url.pathname === `${basePath}/work/${nextSlug}/`);
    const fade = await page.evaluate(() => document.getAnimations().find((a) => a.effect?.target?.tagName === "MAIN")?.effect.getTiming().duration ?? null);
    const t = await settle(page, { path: `/work/${nextSlug}/` });
    check("browser back: the page fades in over 240 ms", fade === 240 || (await page.evaluate((n) => window.__vt.native > n, before)), String(fade));
    check("browser back: the scroll position is restored", t.y > 200, `y=${t.y}`);

    // A plain page change: old page out (180 ms), new one rises in over 320 ms from 120 ms.
    await page.locator('header a[href$="/about/"]').click();
    await settle(page, { path: "/about/" });
    const pageRun = await page.evaluate(() => window.__vt.runs.at(-1));
    const out = first(pageRun, "old:page");
    const inn = first(pageRun, "new:page");
    check("About: the old page fades out in 180 ms", near(out?.duration, 180), JSON.stringify(out));
    check("About: the new one rises in over 320 ms from 120 ms", inn?.name === "vt-rise-page" && near(inn?.duration, 320) && near(inn?.delay, 120), JSON.stringify(inn));
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }

  console.log("\ntransitions: aborted transitions still land");
  for (const abort of ["skip", "timeout", "fail"]) {
    const { context, page, errors } = await open();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    const card = page.locator(`#case-studies article[data-slug="${FLOW.slug}"] a`);
    await card.scrollIntoViewIfNeeded();
    await page.evaluate((a) => (window.__vt.abort = a), abort);
    await card.click();
    const r = await settle(page, { path: FLOW.path });
    const expected = /simulated update failure|Transition was (skipped|aborted)|timeout/i;
    check(`${abort}: the case study lands, nothing hidden`, r.path === `${basePath}${FLOW.path}` && r.hidden.length === 0, JSON.stringify(r.hidden));
    check(`${abort}: no unexpected page errors`, errors.filter((e) => !expected.test(e)).length === 0, errors.join("; "));
    await context.close();
  }
}

// --- case-study template ------------------------------------------------------------------------
// On the flagged example, which uses every building block: the twelve parts in order (plate,
// sheet bands, chapters, breakers), the contents trail (current part, stepping aside over bands,
// keyboard; the phone's disclosure), the pinned decision's swap, the lightbox (focus in and out,
// Esc, zoom buttons, pinch), the before/after comparison (keyboard, view buttons), hotspots, and
// the fallbacks without JavaScript.
const EXAMPLE = "/work/test-project/";

async function casestudy() {
  if (!existsSync(join(root, `out${EXAMPLE}index.html`))) {
    console.log(`\ncase-study template: skipped (no ${EXAMPLE} in this build; build with SITE_MODE=basecamp)`);
    return;
  }
  const url = `${base}${EXAMPLE}`;
  const trail = 'nav[aria-label="On this page"]';
  const waitFor = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 8000, polling: 50 }).then(() => true, () => false);

  console.log("\ncase-study template: the parts in order, desktop 1440×900");
  {
    const { context, page, errors } = await open();
    await page.goto(url, { waitUntil: "networkidle" });
    const t = await page.evaluate((trail) => {
      const text = (el) => el?.textContent.replace(/\s+/g, " ").trim() ?? "";
      const order = ["main > header", "#summary", "#context", "[data-breaker] .t-metric", "#findings", "#decisions", "#options-heading", "#leading", "#outcome", "#reflection", 'nav[aria-label="Next case study"]'];
      const els = order.map((s) => document.querySelector(s));
      const nav = document.querySelector(trail);
      const decisions = [...document.querySelectorAll("#decisions article h3")].map(text);
      const options = [...document.querySelectorAll('[aria-labelledby="options-heading"] table')].map((tbl) => [...tbl.querySelectorAll("tbody tr")].map((tr) => text(tr.querySelector("th span span"))));
      const note = document.querySelector('aside[aria-label^="Side note"]');
      const para = note?.parentElement?.querySelector("p");
      return {
        missing: order.filter((_, i) => !els[i]),
        ordered: els.every((el, i) => el && (i === 0 || els[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)),
        plate: !!document.querySelector("main > header [data-card-art] img[src$='-level.svg']"),
        legend: text(document.querySelector('main > header [data-vt-part="summit"]')),
        summary: [...document.querySelectorAll("#summary dt")].map(text),
        sheets: [...document.querySelectorAll('main [data-band][data-surface="sheet"]')].map((el) => el.id || el.getAttribute("aria-labelledby")),
        chapters: ["#context", "#findings", "#leading"].map((s) => text(document.querySelector(`${s} p.mono`))),
        pull: !!document.querySelector("#leading h2.t-pull"),
        pair: document.querySelectorAll("[data-breaker] figure").length,
        decisions,
        options,
        reversed: text(document.querySelector('[aria-labelledby="options-heading"]')).includes("Turned back · "),
        tiles: document.querySelectorAll("#outcome li").length,
        log: !!document.querySelector("#outcome table caption"),
        lessons: [...document.querySelectorAll("#reflection li p.body-copy")].map(text),
        trail: nav ? { position: getComputedStyle(nav).position, links: [...nav.querySelectorAll("a")].map((a) => a.getAttribute("href")) } : null,
        noteBeside: note && para ? note.getBoundingClientRect().left >= para.getBoundingClientRect().right : null,
        robots: document.querySelector('meta[name="robots"]')?.content,
        quotes: document.querySelectorAll("main blockquote").length,
      };
    }, trail);
    check(
      "the twelve parts in order: plate, summary, context, metric, findings, decisions, options, leading, outcome, reflection, next",
      t.missing.length === 0 && t.ordered,
      JSON.stringify(t.missing),
    );
    check("header plate: the level plate, summit · altitude · coordinates", t.plate && /· [\d’]+ m · [\d.]+ N [\d.]+ E$/i.test(t.legend), t.legend);
    check("summary: problem, my role, team · duration · reach, key decision, outcome", t.summary.join("|") === "Problem|My role|Team · Duration · Reach|Key decision|Outcome", t.summary.join(" | "));
    check("sheet bands: summary, options, outcome", t.sheets.length === 3, JSON.stringify(t.sheets));
    check("chapters 01, 02, 03 with their mono lines", t.chapters.join("|") === "01 · Context|02 · Findings|03 · Leading the team", t.chapters.join(" | "));
    check("chapter 03 opens with the one pull statement", t.pull);
    check("decisions: numbered steps, each a question", t.decisions.length >= 2 && t.decisions.every((d, i) => d.startsWith(`Decision ${i + 1} — `)), t.decisions.join(" | "));
    check("options: every option with its status in words, one chosen per decision", t.options.length >= 3 && t.options.every((o) => o.length >= 2), JSON.stringify(t.options));
    check("the decision we reversed, dated", t.reversed);
    check("outcome: metric tiles and the after-launch log", t.tiles >= 3 && t.log, `${t.tiles} tiles`);
    check("reflection: every lesson says what I would do next time", t.lessons.length >= 2 && t.lessons.every((l) => l.startsWith("Next time I would")), String(t.lessons.length));
    check("contents trail: sticky, the seven parts", t.trail?.position === "sticky" && t.trail.links.join(" ") === "#summary #context #findings #decisions #leading #outcome #reflection", JSON.stringify(t.trail));
    check("side notes sit in the margin beside their paragraph", t.noteBeside === true);
    check("the example page is noindex, no quotes", /noindex/.test(t.robots ?? "") && t.quotes === 0, t.robots);

    // The trail marks the part being read, and steps aside over bands and breakers.
    await page.evaluate(() => document.getElementById("findings").scrollIntoView({ block: "start" }));
    const spied = await waitFor(page, (s) => document.querySelector(`${s} a[aria-current="location"]`)?.getAttribute("href") === "#findings", trail);
    check("the trail marks the part being read (aria-current=location)", spied);
    await page.evaluate(() => document.getElementById("options-heading").scrollIntoView({ block: "start" }));
    const over = await waitFor(page, (s) => document.querySelector(s)?.hasAttribute("data-over"), trail);
    check("the trail steps aside over a sheet band", over);
    // Keyboard: a trail link follows to its part, below the header.
    await page.evaluate(() => window.scrollTo(0, document.getElementById("context").offsetTop));
    await waitFor(page, (s) => !document.querySelector(s)?.hasAttribute("data-over"), trail);
    await page.focus(`${trail} a[href="#decisions"]`);
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => location.hash === "#decisions", null, { timeout: 5000 }).catch(() => {});
    await page.waitForFunction(() => Math.abs(document.getElementById("decisions").getBoundingClientRect().top - 80) < 80, null, { timeout: 8000, polling: 200 }).catch(() => {});
    const top = await page.evaluate(() => Math.round(document.getElementById("decisions").getBoundingClientRect().top));
    check("Enter on a trail link lands its part below the header", top >= 40 && top <= 160, `top=${top}px`);

    // The pinned decision: the figure on the right follows the step being read.
    const steps = await page.locator("#decisions [data-step]").count();
    const seen = [];
    let follows = true;
    for (let i = 0; i < steps; i++) {
      // Twice: smooth scrolling (Lenis) may still be gliding to the last target the first time.
      for (const pause of [600, 0]) {
        await page.evaluate((i) => {
          const s = document.querySelector(`#decisions [data-step="${i}"]`);
          window.scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * 0.3);
        }, i);
        await page.waitForTimeout(pause);
      }
      // Read once the scroll has settled; again a second later if smooth scrolling was still gliding.
      const active = () => page.evaluate((i) => !!document.querySelector(`#decisions [data-step-figure="${i}"]`)?.hasAttribute("data-active"), i);
      await page.waitForTimeout(500);
      let ok = await active();
      if (!ok) {
        await page.waitForTimeout(1200);
        ok = await active();
      }
      if (!ok) seen.push(await page.evaluate(() => ({ y: Math.round(scrollY), tops: [...document.querySelectorAll("#decisions [data-step]")].map((s) => Math.round(s.getBoundingClientRect().top)), active: [...document.querySelectorAll("#decisions [data-step-figure]")].map((f) => f.hasAttribute("data-active")) })));
      follows = ok && follows;
    }
    check("pinned decision: the sticky figure swaps to each step", steps >= 2 && follows, `${steps} steps ${JSON.stringify(seen)}`);
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    const m = await page.evaluate(() => {
      const note = document.querySelector('aside[aria-label^="Side note"]');
      const para = note?.parentElement?.querySelector("p");
      const dts = [...document.querySelectorAll("#summary dt")].map((dt) => [dt.textContent.trim(), dt.getBoundingClientRect().top]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
      const back = document.querySelector('nav[aria-label="Next case study"] a.cta, nav[aria-label="Next case study"] a[class*="back"]');
      return {
        noteAfter: note && para ? note.getBoundingClientRect().top >= para.getBoundingClientRect().bottom - 1 : null,
        first: dts.slice(0, 2),
        tables: [...document.querySelectorAll('[aria-labelledby="options-heading"] table')].every((t) => t.scrollWidth <= t.clientWidth + 1),
        back: back ? Math.round(back.getBoundingClientRect().height) : 0,
        width: document.documentElement.scrollWidth,
      };
    });
    check("phone: side notes follow their paragraph", m.noteAfter === true);
    check("phone: My role and Team come first in the summary", m.first.join("|") === "My role|Team · Duration · Reach", m.first.join(" | "));
    check("phone: the options stack, no table scrolls sideways", m.tables);
    check("phone 360: no sideways scrolling", m.width <= 360, `${m.width}px`);
    await context.close();
  }

  console.log("\ncase-study template: phone 390×844");
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    const info = await page.evaluate((trail) => {
      const nav = document.querySelector(trail);
      const toggle = nav?.querySelector("button[aria-expanded]");
      return {
        bar: toggle ? Math.round(toggle.getBoundingClientRect().height) : 0,
        position: nav ? getComputedStyle(nav).position : null,
        listHidden: nav ? !nav.querySelector("ol").getClientRects().length : false,
        width: document.documentElement.scrollWidth,
        markers: [...document.querySelectorAll("button[data-hotspot]")].map((b) => b.getBoundingClientRect()).map((r) => Math.min(r.width, r.height)),
      };
    }, trail);
    check("contents: a sticky 40 px disclosure, closed", info.bar === 40 && info.position === "sticky" && info.listHidden, JSON.stringify(info));
    await page.evaluate(() => window.scrollTo(0, document.getElementById("context").offsetTop));
    await page.locator(`${trail} button[aria-expanded]`).tap();
    const opened = await page.evaluate((trail) => document.querySelector(`${trail} button`).getAttribute("aria-expanded") === "true" && document.querySelector(`${trail} ol`).getClientRects().length > 0, trail);
    await page.locator(`${trail} a[href="#outcome"]`).tap();
    await page.waitForFunction(() => location.hash === "#outcome", null, { timeout: 5000 }).catch(() => {});
    const closed = await page.evaluate((trail) => document.querySelector(`${trail} button`).getAttribute("aria-expanded") === "false", trail);
    check("contents: opens, leads to a part and closes", opened && closed);
    check("no sideways scrolling", info.width <= 390, `${info.width}px`);
    check("hotspot markers at least 24×24 px", info.markers.length === 5 && info.markers.every((m) => m >= 24), info.markers.join(", "));
    // The lightbox on touch: two fingers pinch, one finger pans.
    const fig = page.locator("figure[data-zoom]").first();
    await fig.scrollIntoViewIfNeeded();
    await fig.locator("button[data-lightbox-open]").waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    await fig.locator("button[data-lightbox-open]").tap();
    await page.waitForSelector("dialog[open]", { timeout: 5000 }).catch(() => {});
    // The figure morphs into the overlay first (a view transition): interact once it has landed.
    await page.waitForFunction(() => !document.getAnimations().some((a) => a.effect?.pseudoElement?.startsWith("::view-transition")), null, { timeout: 5000 }).catch(() => {});
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
    // The figure morphs into the overlay first (a view transition): interact once it has landed.
    await page.waitForFunction(() => !document.getAnimations().some((a) => a.effect?.pseudoElement?.startsWith("::view-transition")), null, { timeout: 5000 }).catch(() => {});
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
        banner: document.querySelector("main header p")?.textContent ?? "",
        missingAlt: [...document.querySelectorAll("main img")].filter((i) => !i.hasAttribute("alt")).length,
      };
    });
    check("before and after stack, each with its own alt text, before first", r.stacked && r.beforeFirst && r.alts.every((a) => a.length > 10) && r.rangeHidden, JSON.stringify(r.alts));
    check("“Open full-size image” link instead of the lightbox", !!r.fallback && r.enlargeHidden, r.fallback);
    check("hotspot notes listed", r.notes === 5, `${r.notes} notes`);
    check("long descriptions behind “Describe this diagram”", r.describe >= 5, `${r.describe}`);
    check("contents links present", r.trailLinks === 7, String(r.trailLinks));
    check("the example line above the H1", /^Example — fictional case study$/i.test(r.banner.trim()), r.banner.slice(0, 60));
    check("every image has an alt attribute", r.missingAlt === 0, `${r.missingAlt} without`);
    await context.close();
  }
}

/**
 * Loads a page. Lab pages signal readiness themselves (html[data-lab-ready], src/components/lab/
 * ready.ts): "networkidle" is unreliable with the lab's three frames.
 */
async function load(page, url) {
  if (new URL(url).pathname.includes("/lab/")) {
    await page.goto(url, { waitUntil: "load" });
    await page.waitForSelector("html[data-lab-ready]", { state: "attached", timeout: 30000 });
  } else {
    await page.goto(url, { waitUntil: "networkidle" });
  }
}

// --- hydration ------------------------------------------------------------------------------------
// Direct loads of every route: no hydration or console errors, and the motion attributes on <html>
// survive hydration (a failed hydration re-creates the document and drops them).
async function hydration() {
  const routes = [...builtRoutes(root), "/lab/", "/lab/specimen/"].filter((r) => r === "/no-such-page/" || existsSync(join(root, "out", r, "index.html")));
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
      await load(page, `${base}${route}`);
      await page.waitForTimeout(600);
      const attrs = await page.evaluate(() => ["data-motion", "data-tier"].map((a) => `${a}=${document.documentElement.getAttribute(a)}`));
      check(`${route}: no hydration or console errors`, problems.length === 0, problems.join(" | "));
      check(`${route}: motion attributes kept`, !attrs.some((a) => a.endsWith("=null")), attrs.join(" "));
      await context.close();
    }
  }
}

// --- primitives (motion lab) ----------------------------------------------------------------------
// Each primitive is exercised on the lab's specimen sheet (hover, focus and press on everything
// interactive, the replay button, the reveals scrolled into view) and its layout shift
// summed from every shift whose sources lie inside it, input or not (at most 0.005 each). Focus parity: keyboard
// focus gives the trail link exactly the hover state.
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
    await load(page, `${base}/lab/specimen/?motion=${mode}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const sections = await page.$$eval("[data-primitive]", (els) => els.map((e) => e.dataset.primitive));
    for (const name of sections) {
      const section = page.locator(`[data-primitive="${name}"]`);
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      // Only what the primitive's own motion shifts: loading (the web fonts' swap) is not part of it.
      await page.evaluate(() => (window.__shifts.length = 0));
      // Everything interactive in it: hover, focus, press; the replay button too.
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

  // Links "contour tightening": hover draws the second line in; keyboard focus gives exactly the
  // hover state; nothing changes width. The standalone call to action also steps its arrow.
  console.log("\nprimitives: link focus parity");
  for (const where of ["lab", "case study"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await load(page, where === "lab" ? `${base}/lab/specimen/?motion=full` : `${base}${FLOW.path}`);
    const link = where === "lab" ? page.locator('[data-primitive="link"] a.cta').first() : page.locator('nav[aria-label="Next case study"] a.cta').first();
    await link.scrollIntoViewIfNeeded();
    const state = () =>
      link.evaluate((a) => ({
        lines: getComputedStyle(a).backgroundSize,
        arrow: [...a.querySelectorAll("[data-arrow]")].map((s) => getComputedStyle(s).transform).join(" "),
        width: Math.round(a.getBoundingClientRect().width * 10) / 10,
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
    check(`${where}: hover draws the second line and steps the arrow`, /100% 1px, 100% 1px/.test(hovered.lines) && rest.lines !== hovered.lines && rest.arrow !== hovered.arrow, JSON.stringify({ rest, hovered }));
    check(`${where}: keyboard focus gives exactly the hover state`, JSON.stringify(hovered) === JSON.stringify(focused), `${JSON.stringify(hovered)} vs ${JSON.stringify(focused)}`);
    check(`${where}: the link never changes width`, rest.width === hovered.width && rest.width === focused.width, `${rest.width} / ${hovered.width} / ${focused.width}`);
    await context.close();
  }

  // Touch: the underline at full colour at rest, and no sticky hover after a tap.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await load(page, `${base}/lab/specimen/?motion=full`);
    const link = page.locator('[data-primitive="link"] a.cta').first();
    await link.scrollIntoViewIfNeeded();
    const before = await link.evaluate((a) => getComputedStyle(a).backgroundSize);
    await link.tap();
    await page.waitForTimeout(400);
    await page.touchscreen.tap(4, 400);
    await page.waitForTimeout(400);
    const after = await link.evaluate((a) => getComputedStyle(a).backgroundSize);
    check("touch: no sticky hover after a tap", before === after && /100% 1px, 0% 1px/.test(after), `before=${before} after=${after}`);
    await context.close();
  }
}

/** Plain wording in every built page (scripts/check-wording.mjs). */
async function wording() {
  console.log("\nwording: the built HTML");
  const hits = wordingHits(join(root, "out"));
  for (const word of ["Höhenlinie", "Expedition", "Basecamp", "CV", ".pdf", "open to", "available for", "looking for"]) {
    const found = hits.filter((h) => h.word.toLowerCase().startsWith(word.toLowerCase().replace(/^\./, ".")));
    check(`no “${word}” in any page`, found.length === 0, found.slice(0, 3).map((h) => `${h.file}: ${h.context}`).join(" | "));
  }
}

const scenarios = { transitions, hydration, primitives, casestudy, wording };
// The contour field (scripts/e2e-terrain.mjs).
Object.assign(scenarios, (await import("./e2e-terrain.mjs")).terrainScenarios({ browser, base, root, check, settle }));
Object.assign(scenarios, Object.fromEntries(Object.entries({ deck, ia, phone, fontswap, toast, arrival, reading, access, pointer, inp, smoke, axe, wordmark }).map(([name, run]) => [name, () => run({ browser, playwright, base, basePath, root, check, open, settle })])));
try {
  for (const [name, run] of Object.entries(scenarios)) if (!only || only === name) await run();
} finally {
  await browser.close();
  server.kill();
}
console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
