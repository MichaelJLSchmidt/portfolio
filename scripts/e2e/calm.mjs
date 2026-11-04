// The calm rules (`npm run test:e2e -- calm`), on the built pages:
//
//   off       Off (OS reduced motion): no canvas, the poster shown, no animation running, and two
//             screenshots 2 s apart are identical
//   still     a fine pointer resting on the page for 10 s in Full: with the field's canvas hidden,
//             the page at 0 s and 10 s is identical and nothing else animates, while the field
//             itself keeps drawing (slowly)
//   regions   at most two regions animate at once (the field counts as one): sampled through the
//             home page's load, a scroll into the cards, and a case study's arrival
//   calm      Calm: reveals run at 0.7 × Full, the title's weight arrival in 600 ms
import { createRequire } from "node:module";
import { join } from "node:path";

export async function calm({ browser, base, root, check }) {
  console.log("\ncalm: what moves, and how much");
  const sharp = createRequire(join(root, "package.json"))("sharp");
  const same = async (a, b) => {
    const [x, y] = await Promise.all([a, b].map((png) => sharp(png).raw().toBuffer()));
    let diff = 0;
    for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - y[i]) > 2) diff++;
    return diff;
  };
  const newPage = async ({ reduced = false, calm = false, viewport = { width: 1440, height: 900 } } = {}) => {
    const context = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" });
    await context.addInitScript((calm) => {
      try {
        if (calm) localStorage.setItem("summit:motion", "calm");
      } catch {}
    }, calm);
    const page = await context.newPage();
    return { context, page };
  };

  // Off: nothing moves.
  for (const path of ["/", "/about/", "/work/test-project/"]) {
    const { context, page } = await newPage({ reduced: true });
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const a = await page.screenshot();
    await page.waitForTimeout(2000);
    const b = await page.screenshot();
    const r = await page.evaluate(() => ({
      canvas: !!document.querySelector("canvas[data-field-canvas]"),
      poster: !!document.querySelector("[data-layer][data-shown] img"),
      running: document.getAnimations().filter((x) => x.playState === "running").length,
    }));
    const diff = await same(a, b);
    check(`Off ${path}: the poster, no canvas, nothing running, the page identical after 2 s`, !r.canvas && r.poster && r.running === 0 && diff === 0, JSON.stringify({ ...r, diff }));
    await context.close();
  }

  // Full, a fine pointer resting for 10 s: only the field moves.
  {
    const { context, page } = await newPage();
    await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector("[data-field]")?.getAttribute("data-field") === "on", null, { timeout: 20000 }).catch(() => {});
    await page.mouse.move(700, 420);
    await page.waitForTimeout(2500);
    const hide = (on) => page.evaluate((on) => document.querySelector("canvas[data-field-canvas]")?.style.setProperty("visibility", on ? "hidden" : ""), on);
    const frames = () => page.evaluate(() => window.__terrain?.frames() ?? 0);
    await hide(true);
    const a = await page.screenshot();
    // The frames over the 10 s themselves (a screenshot here takes a while and the field goes on).
    const f0 = await frames();
    const t0 = Date.now();
    await page.waitForTimeout(10000);
    const f1 = await frames();
    const seconds = (Date.now() - t0) / 1000;
    const b = await page.screenshot();
    const running = await page.evaluate(() => document.getAnimations().filter((x) => x.playState === "running").map((x) => x.animationName ?? "?"));
    await hide(false);
    const diff = await same(a, b);
    check("Full, the pointer resting 10 s: the page (field hidden) identical, nothing else animating", diff === 0 && running.length === 0, JSON.stringify({ diff, running }));
    const state = await page.evaluate(() => window.__terrain?.state());
    check("Full, the pointer resting 10 s: the field still draws, at the idle pace", f1 > f0 && (f1 - f0) / seconds <= 33, `${((f1 - f0) / seconds).toFixed(1)} fps ${JSON.stringify(state)}`);
    await context.close();
  }

  // At most two animating regions at once.
  {
    const { context, page } = await newPage();
    await context.addInitScript(() => {
      window.__regions = 0;
      // A region: the field (its canvas and its backdrop's fades), the page change (the view
      // transition and the arriving page's parts it choreographs), or a block of the page.
      const region = (el) => (el.closest("[data-field]") ? "field" : el.closest("header, footer, section, article, main > *") ?? el);
      // Colour-only transitions (a header turning solid, a frame's colour) are feedback, not motion.
      const colourOnly = (a) => typeof a.transitionProperty === "string" && /color|background|border|outline|fill|stroke/.test(a.transitionProperty);
      const sample = () => {
        const set = new Set();
        const changing = document.getAnimations().some((a) => a.effect?.pseudoElement?.startsWith("::view-transition"));
        for (const a of document.getAnimations()) {
          if (a.playState !== "running" || a.timeline !== document.timeline || colourOnly(a)) continue;
          const t = a.effect?.target;
          if (a.effect?.pseudoElement?.startsWith("::view-transition")) set.add("page change");
          else if (t && changing && t.closest("main")) set.add("page change");
          else if (t) set.add(region(t));
        }
        // The field counts as one region whenever it draws.
        const draws = window.__terrain?.frames?.() ?? 0;
        if (draws !== window.__lastDraws) set.add("field");
        window.__lastDraws = draws;
        if (set.size > window.__regions) window.__worst = [...set].map((r) => (typeof r === "string" ? r : `${r.tagName.toLowerCase()}.${String(r.className).split(" ")[0]}#${r.id}`));
        window.__regions = Math.max(window.__regions, set.size);
      };
      const loop = () => {
        sample();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    await page.goto(`${base}/?field=force`, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(1500);
    await page.locator("#case-studies article a").first().click();
    await page.waitForURL(/\/work\//);
    await page.waitForTimeout(2500);
    const regions = await page.evaluate(() => window.__regions);
    const worst = await page.evaluate(() => window.__worst);
    check("at most two regions animate at once (load, scroll, a page change)", regions <= 2, `${regions} at most: ${JSON.stringify(worst)}`);
    await context.close();
  }

  // Calm: 0.7 × Full for reveals; the title's weight arrival in 600 ms.
  {
    const durations = async (calmMode) => {
      const { context, page } = await newPage({ calm: calmMode });
      await context.addInitScript(() => {
        window.__reveal = null;
        document.addEventListener("animationstart", (e) => e.animationName === "reveal-rise" && (window.__reveal ??= e.target.getAnimations().find((a) => a.animationName === "reveal-rise")?.effect.getTiming().duration ?? null), true);
      });
      await page.goto(`${base}/work/test-project/`, { waitUntil: "networkidle" });
      const title = await page.evaluate(() => {
        const a = document.querySelector("main h1")?.getAnimations({ subtree: true })[0];
        return a ? a.effect.getTiming().duration : null;
      });
      await page.evaluate(() => document.getElementById("findings").scrollIntoView());
      await page.waitForFunction(() => window.__reveal !== null, null, { timeout: 5000 }).catch(() => {});
      const reveal = await page.evaluate(() => window.__reveal);
      await context.close();
      return { title, reveal };
    };
    const full = await durations(false);
    const c = await durations(true);
    check("Calm: reveals at 0.7 × Full", full.reveal && c.reveal && Math.abs(c.reveal - full.reveal * 0.7) < 2, JSON.stringify({ full, calm: c }));
    check("Calm: the title arrives in 600 ms (Full 900 ms)", full.title === 900 && c.title === 600, JSON.stringify({ full: full.title, calm: c.title }));
  }
}
