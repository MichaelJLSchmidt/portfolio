// Typography scenarios (`npm run test:e2e -- fontswap`).
//
//   fontswap  On a phone with the CPU slowed 4× and the web fonts held back 2.5 s (so the
//             fallback paints first), the swap moves nothing: the page's layout shift (CLS) stays
//             ≤ 0.05 and each display title's own shift ≤ 0.005 (WeightTitle: one element whose
//             fallback face is metric-matched).
export async function fontswap({ browser, base, check }) {
  const routes = ["/", "/about/", "/work/seilschaft/"];
  console.log("\nfontswap: web fonts held back 2.5 s on a throttled phone");
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await context.addInitScript(() => {
      window.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__shifts.push({ value: e.value, sources: e.sources.map((s) => s.node).filter(Boolean) });
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await context.route(/\.woff2(\?.*)?$/, async (r) => {
      await new Promise((ok) => setTimeout(ok, 2500));
      await r.continue();
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    // "commit": the load event would wait for the preloaded fonts.
    const response = await page.goto(`${base}${route}`, { waitUntil: "commit" });
    if (!response?.ok()) {
      console.log(`  skip  ${route}: not in this build`);
      await context.close();
      continue;
    }
    // Read once the page's stylesheets apply (it never paints before they do), with the fallback faces.
    const before = await page
      .waitForFunction(
        () => [...document.querySelectorAll('link[rel="stylesheet"]')].every((l) => l.sheet) && document.readyState !== "loading" && document.querySelector("h1")?.getBoundingClientRect().height,
        null,
        { timeout: 20000 },
      )
      .then((h) => h.jsonValue());
    await page.waitForFunction(() => document.fonts.status === "loaded", null, { timeout: 30000, polling: 100 });
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => document.querySelector("h1").getBoundingClientRect().height);
    check(`${route}: the H1 keeps its height through the swap`, Math.abs(after - before) < 1, `${Math.round(before)} → ${Math.round(after)} px`);
    const r = await page.evaluate(() => {
      const titles = [...document.querySelectorAll("[data-title]")];
      const own = titles.map((t) => ({
        title: t.textContent.trim().slice(0, 24),
        value: window.__shifts.filter((s) => s.sources.some((n) => t.contains(n) || n.contains?.(t))).reduce((a, s) => a + s.value, 0),
      }));
      return { cls: window.__shifts.reduce((a, s) => a + s.value, 0), own, fonts: document.fonts.status };
    });
    check(`${route}: CLS ≤ 0.05 with the font swap`, r.cls <= 0.05, `CLS ${r.cls.toFixed(4)} (fonts ${r.fonts})`);
    const worst = r.own.reduce((a, b) => (b.value > a.value ? b : a), { title: "—", value: 0 });
    check(`${route}: each display title's own shift ≤ 0.005`, worst.value <= 0.005, `${worst.title}: ${worst.value.toFixed(4)}`);
    await context.close();
  }
}
