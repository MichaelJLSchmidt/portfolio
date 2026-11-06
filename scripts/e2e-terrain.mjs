// The living survey (`npm run test:e2e -- terrain`; a preview build, NEXT_PUBLIC_PREVIEW=1, for
// window.__terrain). Chromium on SwiftShader, so frame counts are a lower bound of a real GPU's.
//
//   - first paint is the poster of the route's terrain; the field takes over once it has drawn
//   - at rest it draws about 30 frames a second (drift and breath), more while a fine pointer
//     moves, none while the tab is hidden; moving the pointer changes nothing in the page
//   - Off (reduced motion): no canvas at all, the poster only, no movement
//   - touch: the pointer never bends the lines (no extra frames from a finger)
//   - a page change crossfades to the next terrain within the terrain token (1.6 s)
//   - a lost context brings the poster back at once
export function terrainScenarios({ browser, base, check }) {
  const FORCE = "?field=force";
  const fieldOn = (page) =>
    page.waitForFunction(() => document.querySelector("[data-field]")?.getAttribute("data-field") === "on", null, { timeout: 20000 }).then(
      () => true,
      () => false,
    );
  const frames = (page) => page.evaluate(() => window.__terrain?.frames() ?? 0);
  const rate = async (page, ms) => {
    const a = await frames(page);
    await page.waitForTimeout(ms);
    return ((await frames(page)) - a) / (ms / 1000);
  };

  async function terrain() {
    console.log("\nterrain: the living survey");
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/${FORCE}`, { waitUntil: "load" });
    const poster = await page.evaluate(() => {
      const img = document.querySelector('[data-layer="region"][data-shown] img');
      return { shown: !!img, src: img?.getAttribute("src") ?? "" };
    });
    check("first paint: the region's poster", poster.shown && /\/terrain\/field\/posters\/region-l\.avif$/.test(poster.src), poster.src);
    check("the field takes over once it has drawn", await fieldOn(page));
    await page.waitForTimeout(1200);

    const idle = await rate(page, 3000);
    check("at rest: about 30 frames a second, never more", idle > 3 && idle <= 33, `${idle.toFixed(1)} fps`);

    // A fine pointer: more frames while it moves, and nothing in the page changes.
    await page.evaluate(() => {
      window.__mut = 0;
      window.__mo = new MutationObserver((r) => (window.__mut += r.length));
      window.__mo.observe(document.querySelector("main"), { attributes: true, childList: true, subtree: true, characterData: true });
    });
    const state = () => page.evaluate(() => window.__terrain.state());
    check("at rest: the idle pace", (await state()).active === false);
    let activeWhileMoving = false;
    for (let i = 0; i < 40; i++) {
      await page.mouse.move(300 + i * 12, 450 + Math.sin(i / 4) * 60);
      await page.waitForTimeout(16);
      if (i === 30) activeWhileMoving = (await state()).active;
    }
    check("a moving pointer: the active pace (60 fps budget), a bump", activeWhileMoving && (await state()).bump > 0);
    await page.waitForTimeout(2500);
    const rest = await state();
    check("the pointer resting: back to the idle pace, the bump held at ~40 %", !rest.active && Math.abs(rest.bump - 0.4) < 0.05, JSON.stringify(rest));
    const mutations = await page.evaluate(() => (window.__mo.disconnect(), window.__mut));
    check("a moving pointer changes nothing in the page", mutations === 0, `${mutations} mutations`);

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    check("a hidden tab: no frames", (await rate(page, 1200)) === 0);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // A page change: dim, then crossfade to the summit within 1.6 s (plus its load).
    await page.click('a[href*="/work/"]');
    await page.waitForURL(/\/work\//);
    const target = await page.evaluate(() => document.querySelector("[data-field]")?.getAttribute("data-terrain"));
    check("a case study shows its summit", !!target && target !== "region", target ?? "");
    const routing = (await page.evaluate(() => window.__terrain.state())).routing;
    await page.waitForFunction(() => !window.__terrain.state().routing, null, { timeout: 4000 }).catch(() => {});
    const landed = !(await page.evaluate(() => window.__terrain.state())).routing;
    check("the crossfade runs at the active pace and lands", routing && landed);

    // A lost context: the poster is back at once.
    await page.evaluate(() => document.querySelector("canvas[data-field-canvas]")?.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext());
    await page.waitForTimeout(300);
    const lost = await page.evaluate(() => document.querySelector("[data-field]")?.getAttribute("data-field"));
    check("a lost context: back to the poster", lost === "lost", lost ?? "");
    await context.close();

    // Off: no canvas, the poster only, nothing animates.
    const off = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const p2 = await off.newPage();
    await p2.goto(`${base}/${FORCE}`, { waitUntil: "load" });
    await p2.waitForTimeout(2500);
    const still = await p2.evaluate(() => ({
      canvas: !!document.querySelector("canvas[data-field-canvas]"),
      poster: !!document.querySelector("[data-layer][data-shown] img"),
      running: document.getAnimations().filter((a) => a.playState === "running").length,
    }));
    check("Off: the poster, no canvas, nothing running", !still.canvas && still.poster && still.running === 0, JSON.stringify(still));
    await off.close();

    // Touch: a finger never bends the lines.
    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const p3 = await touch.newPage();
    await p3.goto(`${base}/${FORCE}`, { waitUntil: "load" });
    if (await fieldOn(p3)) {
      await p3.waitForTimeout(1200);
      const rest = await rate(p3, 2000);
      const a = await frames(p3);
      for (let i = 0; i < 10; i++) await p3.touchscreen.tap(100 + i * 20, 500);
      const tapped = (await frames(p3)) - a;
      check("touch: a finger adds no frames of its own", tapped <= Math.ceil(rest * 1.5) + 2, `${tapped} frames during taps, ${rest.toFixed(1)} fps at rest`);
    } else check("touch: the field runs on a phone", false);
    await touch.close();
  }

  return { terrain };
}
