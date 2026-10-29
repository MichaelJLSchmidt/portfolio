// The terrain conductor and the Bern terrain, end to end (`npm run test:e2e -- terrain`), in Chromium
// against the static export, with the field forced on (?field=force, SwiftShader) like the other
// scenarios. Needs a preview build (NEXT_PUBLIC_PREVIEW=1): the field's debug hook
// (window.__terrain: timeline events, state, frame count, context loss) exists only there.
//
// Covered: morphs to a card terrain and to Bern (data-terrain, and the conductor's timing from the
// hook: each tween starts at the route commit and runs its token's duration, ±50 ms); back and
// forward; the interval reaching 10 m on Bern and the Aare on screen after its draw; the readout;
// pre-warm; calm (no draw-on), still (posters, no WebGL context); context loss (poster, restore,
// then tier C); tier B (no idle frames under touch emulation); the field pausing behind a dialog;
// no console errors. SwiftShader's frame times say nothing about real devices: the timing checks
// bracket each tween's end between two frames and report the gap.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const TOLERANCE_MS = 50;

export function terrainScenarios({ browser, base, root, check, settle }) {
  const bern = JSON.parse(readFileSync(join(root, "public/terrain/bern/summary.json"), "utf8"));
  const bernReadout = `BERN · E 2’600’000 · N 1’200’000 · ALT ${bern.zeroPoint.altitudeM} M`;

  /** A page with the intro played; console errors and page errors are collected. */
  async function open({ viewport = { width: 960, height: 600 }, calm = false, reduced = false, mobile = false, init } = {}) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: reduced ? "reduce" : "no-preference",
      ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    });
    await context.addInitScript((calm) => {
      try {
        sessionStorage.setItem("summit:intro-played", "1");
        sessionStorage.setItem("summit:deck-dealt", "1");
        if (calm) localStorage.setItem("summit:calm-map", "1");
      } catch {}
      // What the shared settle() reports on (e2e.mjs installs the real counters in its scenarios).
      window.__vt = { native: 0, abort: null, last: null };
      window.__return = { vt: 0, exits: 0, reassemble: 0 };
    }, calm);
    if (init) await context.addInitScript(init);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
    return { context, page, errors };
  }

  const fieldOn = (page) => page.waitForSelector('[data-field="on"]', { timeout: 30000 });
  const state = (page) => page.evaluate(() => window.__terrain?.state() ?? null);
  const clearEvents = (page) => page.evaluate(() => window.__terrain && (window.__terrain.events.length = 0));
  const events = (page) => page.evaluate(() => window.__terrain?.events.slice() ?? []);
  /** Waits for the route's morph to land and the quiet-zone hold to let go. */
  const landed = (page, terrain) =>
    page.waitForFunction(
      (terrain) => {
        const s = window.__terrain?.state();
        return document.querySelector("[data-field]")?.dataset.terrain === terrain && s && !s.routing && s.values.hold === 0 && s.values.morph === 0;
      },
      terrain,
      { timeout: 20000, polling: 50 },
    );
  /** Hover a link and wait for the pre-warm to have loaded its terrain (tier A, full). */
  async function prewarm(page, locator, terrain) {
    await locator.hover();
    await page
      .waitForFunction((t) => window.__terrain?.events.some((e) => e.type === "prewarm" && e.to === t), terrain, { timeout: 20000, polling: 50 })
      .catch(() => {});
  }

  /** The tween of `channel` the latest route started, and that route's commit. */
  function timing(evs, channel) {
    const commit = [...evs].reverse().find((e) => e.type === "commit");
    const end = evs.find((e) => e.type === "end" && e.channel === channel && e.start >= (commit?.at ?? 0) - 1);
    return commit && end
      ? { startDelay: end.start - commit.at, duration: end.duration, seen: [end.prev - end.start, end.end - end.start], commit, end }
      : null;
  }
  /**
   * A tween's start against the route commit, and its end: the field saw it still running at
   * `seen[0]` and done at `seen[1]` (ms after its start), so its true end lies in between, within
   * the tolerance. SwiftShader stretches the frames around a View Transition; the frame gap shows it.
   */
  function checkTiming(label, t, channel, { delay, duration }) {
    if (!t) return check(`${label}: ${channel} ran`, false, "no tween recorded");
    check(`${label}: ${channel} starts ${delay} ms after the commit (±${TOLERANCE_MS})`, Math.abs(t.startDelay - delay) <= TOLERANCE_MS, `${t.startDelay.toFixed(0)} ms`);
    const [running, done] = t.seen;
    check(
      `${label}: ${channel} runs ${duration} ms (±${TOLERANCE_MS})`,
      t.duration === duration && running <= duration + TOLERANCE_MS && done >= duration - TOLERANCE_MS,
      `token ${t.duration} ms; running at ${running.toFixed(0)} ms, done at ${done.toFixed(0)} ms (frame gap ${(done - running).toFixed(0)} ms)`,
    );
  }

  /** Ice-coloured pixels in the backdrop alone (page and HUD hidden for the shot): the Aare. */
  async function iceShare(page) {
    const hide = (on) =>
      page.evaluate((on) => {
        for (const el of document.querySelectorAll(".page, header[data-chrome]")) el.style.visibility = on ? "hidden" : "";
      }, on);
    await hide(true);
    await page.waitForTimeout(600);
    const png = await page.screenshot();
    await hide(false);
    const { default: sharp } = await import("sharp");
    const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let n = 0;
    for (let i = 0; i < data.length; i += 3) if (data[i + 2] > 150 && data[i + 2] - data[i] > 45 && data[i + 1] > 120) n++;
    return n / (info.width * info.height);
  }

  async function conductor() {
    console.log("\nterrain: the route conductor (full motion, tier A)");
    const { context, page, errors } = await open();
    await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
    await fieldOn(page);
    await landed(page, "region");
    const s0 = await state(page);
    check("tier A on a fine-pointer desktop (DPR cap 2)", s0?.tier === "desktop" && s0.dpr <= 2, JSON.stringify({ tier: s0?.tier, dpr: s0?.dpr }));

    // Pre-warm: hovering the card leans the field 12% towards its terrain, and back on leave.
    const cardLink = page.locator('article[data-slug="seilschaft"] a').first();
    await cardLink.scrollIntoViewIfNeeded();
    await clearEvents(page);
    await prewarm(page, cardLink, "lab-097");
    await page.waitForTimeout(600);
    const warm = await state(page);
    check("pre-warm: hover leans towards the card's terrain (uMorph 0.12)", Math.abs(warm.values.morph - 0.12) < 0.01 && warm.slots[1] === "lab-097", JSON.stringify(warm.slots) + ` morph=${warm.values.morph.toFixed(3)}`);
    await page.mouse.move(2, 2);
    await page.waitForTimeout(700);
    const cold = await state(page);
    check("pre-warm: leaving eases back to 0", cold.values.morph === 0, `morph=${cold.values.morph}`);

    // Card: morph 700 ms, draw-on 900 ms, from the route commit.
    await prewarm(page, cardLink, "lab-097");
    await clearEvents(page);
    await cardLink.click();
    await settle(page, { path: "/work/seilschaft/", terrain: "lab-097" });
    await landed(page, "lab-097").catch(() => {});
    let evs = await events(page);
    check("card: data-terrain=lab-097", (await page.getAttribute("[data-field]", "data-terrain")) === "lab-097");
    checkTiming("card", timing(evs, "morph"), "morph", { delay: 0, duration: 700 });
    checkTiming("card", timing(evs, "reveal"), "reveal", { delay: 0, duration: 900 });
    check("card: quiet zones held, then released", evs.some((e) => e.type === "end" && e.channel === "hold" && e.to === 0), evs.filter((e) => e.channel === "hold").map((e) => `${e.type}→${e.to}`).join(" "));

    // Back to the deck, then Basecamp through the HUD link.
    await clearEvents(page);
    await page.goBack();
    await settle(page, { path: "/", terrain: "region" });
    await landed(page, "region").catch(() => {});
    evs = await events(page);
    checkTiming("back", timing(evs, "morph"), "morph", { delay: 0, duration: 700 });

    const about = page.locator('header a[href$="/about/"]').first();
    await prewarm(page, about, "bern");
    await clearEvents(page);
    await about.click();
    await settle(page, { path: "/about/", terrain: "bern" });
    await landed(page, "bern").catch(() => {});
    evs = await events(page);
    const sb = await state(page);
    check("Bern: data-terrain=bern", (await page.getAttribute("[data-field]", "data-terrain")) === "bern");
    checkTiming("Bern", timing(evs, "morph"), "morph", { delay: 0, duration: 700 });
    checkTiming("Bern", timing(evs, "riverDraw"), "riverDraw", { delay: 200, duration: 700 });
    checkTiming("Bern", timing(evs, "ping"), "ping", { delay: 300, duration: 560 });
    check("Bern: no zoom push (zoom at its base)", Math.abs(sb.zoom - 1.06) < 1e-6, `zoom=${sb.zoom}`);
    check("Bern: no isoline draw-on (the Aare is its draw)", !evs.some((e) => e.channel === "reveal"), "");
    check("Bern: the interval reached 10 m", Math.abs(sb.interval - 10) < 1e-6, `${sb.interval.toFixed(2)} m`);
    check("Bern: the Aare drawn and on screen", sb.riverVisible && sb.values.riverDraw === 1 && sb.values.riverOpacity === 1, JSON.stringify(sb.values));
    const ice = await iceShare(page);
    check("Bern: ice-coloured river pixels in the frame", ice > 0.0005, `${(ice * 100).toFixed(3)}% of the screen`);
    check("Bern: the pin at the zero point (screen centre)", Math.abs(sb.pin[0] / sb.dpr - 480) < 30 && Math.abs((600 - sb.pin[1] / sb.dpr) - 300) < 30, JSON.stringify(sb.pin.map(Math.round)));

    // Leaving reverses it; back and forward get the same treatment.
    await clearEvents(page);
    await page.goBack();
    await settle(page, { path: "/", terrain: "region" });
    await landed(page, "region").catch(() => {});
    evs = await events(page);
    const sh = await state(page);
    checkTiming("leaving Bern", timing(evs, "riverOpacity"), "riverOpacity", { delay: 0, duration: 240 });
    check("leaving Bern: the interval returned, the river and the pin gone", sh.interval >= 50 && !sh.riverVisible && sh.values.pin === 0, `interval ${sh.interval.toFixed(0)} m`);
    await clearEvents(page);
    await page.goForward();
    await settle(page, { path: "/about/", terrain: "bern" });
    await landed(page, "bern").catch(() => {});
    evs = await events(page);
    check("forward: Bern again, the Aare draws again", evs.some((e) => e.type === "end" && e.channel === "riverDraw" && e.to === 1), "");
    check("no console errors", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  async function readout() {
    if (!existsSync(join(root, "out/lab/terrain/index.html"))) {
      console.log("\nterrain: readout skipped (no lab in this build; build with SITE_MODE=basecamp)");
      return;
    }
    console.log("\nterrain: the readout (lab page)");
    const html = readFileSync(join(root, "out/lab/terrain/index.html"), "utf8");
    check("server-rendered readout of the home region", html.includes("JUNGFRAU · ALT 4’158 M"), "");
    check("lab page is noindex", /<meta name="robots" content="noindex, nofollow"/.test(html), "");
    for (const mode of ["full", "still"]) {
      const { context, page, errors } = await open({ reduced: mode === "still" });
      await page.goto(`${base}/lab/terrain/?field=force`, { waitUntil: "load" });
      await page.waitForSelector("html[data-lab-ready]", { state: "attached", timeout: 30000 });
      const text = () => page.locator("main [data-terrain-readout] .visually-hidden").textContent();
      check(`${mode}: home readout`, (await text()) === "JUNGFRAU · ALT 4’158 M", await text());
      await page.locator('button[data-morph="bern"]').click();
      await page.waitForTimeout(900);
      check(`${mode}: Bern readout`, (await text()) === bernReadout, await text());
      // What is shown: the static parts, and each rolling group's own value (AnimateNumber keeps a
      // visually hidden copy of it as its first child; its digit columns hold every digit).
      const shown = await page.evaluate(() => {
        const root = document.querySelector("main [data-terrain-readout] [data-run]").cloneNode(true);
        const rolls = root.querySelectorAll("[data-part] > span > *");
        const alt = root.querySelectorAll('[data-part="alt"] > span > *').length;
        for (const n of rolls) n.replaceWith(n.firstElementChild?.textContent ?? n.textContent);
        return { text: root.textContent.replace(/\s+/g, " ").trim(), rolls: rolls.length, alt };
      });
      check(`${mode}: the shown digits match the text`, shown.text === bernReadout, shown.text);
      if (mode === "still") check("still: numbers snap (no rolling digits)", shown.rolls === 0, `${shown.rolls} rolling groups`);
      // The altitude changed, so it rolls (AnimateNumber); the coordinates appear with Bern, at their value.
      else check("full: a changed number rolls (the altitude, AnimateNumber)", shown.alt === 1, `${shown.alt} rolling altitude groups, ${shown.rolls} in all`);
      const card = await page.locator('button[data-morph]:not([data-morph="bern"]):not([data-morph="region"])').first();
      if (await card.count()) {
        await card.click();
        await page.waitForTimeout(900);
        check(`${mode}: a card's readout`, /ALT \d/.test(await text()), await text());
      }
      check(`${mode}: no console errors`, errors.length === 0, errors.join(" | "));
      await context.close();
    }
  }

  async function modes() {
    console.log("\nterrain: calm and still");
    {
      const { context, page, errors } = await open({ calm: true });
      await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
      await fieldOn(page);
      await landed(page, "region");
      await clearEvents(page);
      await page.locator('article[data-slug="seilschaft"] a').first().click();
      await settle(page, { path: "/work/seilschaft/", terrain: "lab-097" });
      await landed(page, "lab-097").catch(() => {});
      let evs = await events(page);
      check("calm: the card's terrain morphs", evs.some((e) => e.type === "end" && e.channel === "morph" && e.duration === 700), "");
      check("calm: no draw-on", !evs.some((e) => e.channel === "reveal" || e.channel === "floor"), evs.map((e) => e.channel).filter(Boolean).join(","));
      check("calm: no zoom push", Math.abs((await state(page)).zoom - 1.06) < 1e-6, `zoom=${(await state(page)).zoom}`);
      await clearEvents(page);
      await page.locator('header a[href$="/about/"]').first().click();
      await settle(page, { path: "/about/", terrain: "bern" });
      await landed(page, "bern").catch(() => {});
      evs = await events(page);
      const s = await state(page);
      check("calm: Bern's interval reached 10 m", Math.abs(s.interval - 10) < 1e-6, `${s.interval.toFixed(2)} m`);
      check("calm: the river and the pin appear without drawing or pinging", s.riverVisible && !evs.some((e) => e.channel === "ping") && evs.some((e) => e.channel === "riverDraw" && e.duration === 0), "");
      check("calm: no console errors", errors.length === 0, errors.join(" | "));
      await context.close();
    }
    {
      // Still: count every WebGL context the page asks for.
      const init = () => {
        window.__glContexts = 0;
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
          if (/webgl/.test(type)) window.__glContexts++;
          return get.call(this, type, ...rest);
        };
      };
      const { context, page, errors } = await open({ reduced: true, init });
      await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      await page.locator('header a[href$="/about/"]').first().click();
      await page.waitForURL(/\/about\/$/);
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => {
        const b = document.querySelector("[data-field]");
        const layer = (name) => Number(getComputedStyle(b.querySelector(`[data-layer="${name}"]`)).opacity);
        return { field: b.dataset.field, poster: b.dataset.poster, bern: layer("bern"), region: layer("region"), canvas: !!b.querySelector("canvas"), img: b.querySelector('[data-layer="bern"] img')?.currentSrc ?? null, gl: window.__glContexts };
      });
      check("still: Bern's poster cross-faded in, the region's out", r.poster === "bern" && r.bern === 1 && r.region === 0 && /bern\/contours-\d+\.svg/.test(r.img ?? ""), JSON.stringify(r));
      check("still: no canvas and no WebGL context", !r.canvas && r.gl === 0 && r.field === "off", `contexts=${r.gl}`);
      const fade = await page.evaluate(() => getComputedStyle(document.querySelector('[data-layer="bern"]')).transitionDuration);
      check("still: the cross-fade takes 200 ms", fade === "0.2s", fade);
      check("still: no console errors", errors.length === 0, errors.join(" | "));
      await context.close();
    }
  }

  async function robustness() {
    console.log("\nterrain: context loss, tier B, dialogs");
    {
      const { context, page, errors } = await open();
      await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
      await fieldOn(page);
      await page.evaluate(() => window.__terrain.loseContext());
      await page.waitForTimeout(50);
      const lost = await page.evaluate(() => {
        const b = document.querySelector("[data-field]");
        return { field: b.dataset.field, poster: Number(getComputedStyle(b.querySelector('[data-layer="region"] img')).opacity) };
      });
      check("context lost: the poster shows at once", lost.field === "lost" && lost.poster === 1, JSON.stringify(lost));
      const restored = await page.waitForSelector('[data-field="on"]', { timeout: 15000 }).then(() => true, () => false);
      check("context lost: one restore brings the field back", restored, "");
      await page.waitForTimeout(500);
      await page.evaluate(() => window.__terrain.loseContext());
      await page.waitForTimeout(800);
      const final = await page.evaluate(() => {
        const b = document.querySelector("[data-field]");
        return { field: b.dataset.field, tier: b.dataset.fieldTier, canvas: !!b.querySelector("canvas"), stored: sessionStorage.getItem("summit:field-tier") };
      });
      check("second loss: tier C for the session (posters only)", final.tier === "low" && !final.canvas && final.stored === "low", JSON.stringify(final));
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
      const after = await page.evaluate(() => ({ tier: document.querySelector("[data-field]").dataset.fieldTier, canvas: !!document.querySelector("[data-field] canvas") }));
      check("after a reload: still tier C", after.tier === "low" && !after.canvas, JSON.stringify(after));
      check("context loss: no console errors", errors.length === 0, errors.join(" | "));
      await context.close();
    }
    {
      const { context, page, errors } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
      await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
      await fieldOn(page);
      await page.waitForTimeout(1500);
      const s = await state(page);
      check("tier B under touch emulation: DPR 1 at a 0.75 render scale", s.tier === "mobile" && s.dpr === 0.75, JSON.stringify({ tier: s.tier, dpr: s.dpr }));
      const before = await page.evaluate(() => window.__terrain.frames);
      await page.waitForTimeout(2500);
      const idle = (await page.evaluate(() => window.__terrain.frames)) - before;
      check("tier B: 0 frames while idle", idle === 0, `${idle} frames in 2.5 s`);
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(600);
      const scrolled = (await page.evaluate(() => window.__terrain.frames)) - before;
      check("tier B: scrolling draws (throttled) frames", scrolled > 0, `${scrolled} frames`);
      check("tier B: no console errors", errors.length === 0, errors.join(" | "));
      await context.close();
    }
    if (existsSync(join(root, "out/work/test-project/index.html"))) {
      const { context, page, errors } = await open();
      await page.goto(`${base}/work/test-project/?field=force`, { waitUntil: "networkidle" });
      await fieldOn(page);
      // The lightbox attaches once its figure is near the viewport (Enhance.tsx).
      const figure = page.locator("figure:has(button[data-lightbox-open])").first();
      await figure.scrollIntoViewIfNeeded();
      const enlarge = figure.locator("button[data-lightbox-open]");
      await enlarge.waitFor({ state: "visible", timeout: 15000 });
      await enlarge.click();
      await page.waitForSelector("dialog[open]");
      await page.waitForTimeout(300);
      const paused = (await state(page)).paused;
      const before = await page.evaluate(() => window.__terrain.frames);
      await page.mouse.move(300, 300, { steps: 5 });
      await page.waitForTimeout(800);
      const drawn = (await page.evaluate(() => window.__terrain.frames)) - before;
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      check("dialog open: the field pauses", paused && drawn === 0, `paused=${paused}, ${drawn} frames`);
      check("dialog closed: the field runs again", !(await state(page)).paused, "");
      check("dialog: no console errors", errors.length === 0, errors.join(" | "));
      await context.close();
    }
  }

  return {
    terrain: async () => {
      await conductor();
      await readout();
      await modes();
      await robustness();
    },
  };
}
