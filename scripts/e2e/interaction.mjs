// Interaction checks (`npm run test:e2e -- pointer`, `-- inp`):
//
//   pointer   nothing follows the cursor: moving the pointer inside a title or running text
//             changes nothing in the page (the unit test src/lib/pointer.test.ts keeps pointermove
//             listeners to the field, the wordmark and the lightbox drag)
//   inp       the next case study's tap on a throttled phone
const ROUTES = ["/", "/about/", "/work/seilschaft/"];

const exists = async (page, url) => (await page.goto(url, { waitUntil: "load" }))?.ok();


export async function pointer({ browser, base, check }) {
  console.log("\npointer: nothing follows the cursor");
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    window.__draws = 0;
    for (const c of [window.WebGL2RenderingContext, window.WebGLRenderingContext].filter(Boolean)) {
      for (const fn of ["drawArrays", "drawElements"]) {
        const o = c.prototype[fn];
        c.prototype[fn] = function (...a) {
          window.__draws++;
          return o.apply(this, a);
        };
      }
    }
  });
  const page = await context.newPage();
  for (const route of ROUTES) {
    if (!(await exists(page, `${base}${route}`))) continue;
    await page.waitForTimeout(1500);
    // Inside a title and running text (the wordmark's relief answers the pointer on purpose:
    // scripts/e2e/wordmark.mjs).
    for (const selector of ["main h1", "main .body-copy"]) {
      const target = page.locator(selector).first();
      if (!(await target.count())) continue;
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
      const box = await target.boundingBox();
      if (!box) continue;
      const y = box.y + box.height / 2;
      // Entering may answer; let that finish, then move inside it.
      await page.mouse.move(box.x + 4, y);
      await page.waitForTimeout(1600);
      await page.evaluate(() => {
        window.__mut = 0;
        window.__mo = new MutationObserver((r) => (window.__mut += r.length));
        window.__mo.observe(document.documentElement, { attributes: true, childList: true, subtree: true, characterData: true });
        window.__draws0 = window.__draws;
      });
      for (let i = 1; i <= 15; i++) await page.mouse.move(box.x + 4 + ((box.width - 8) * i) / 15, y + Math.sin(i) * Math.min(6, box.height / 4));
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        window.__mo.disconnect();
        return { mutations: window.__mut, draws: window.__draws - window.__draws0 };
      });
      check(`${route} ${selector}: moving inside it changes nothing`, r.mutations === 0 && r.draws === 0, JSON.stringify(r));
    }
  }
  await context.close();
}

/**
 * inp: the Next case study tap on a throttled phone (CPU ×4, 390 × 844): the interaction's longest
 * event duration (Event Timing, the same measure as INP) stays within the 150 ms budget.
 */
export async function inp({ browser, base, check }) {
  console.log("\ninp: Next case study on a throttled phone");
  for (const slug of ["seilschaft", "test-project"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await context.addInitScript(() => {
      window.__events = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (e.interactionId) window.__events.push({ name: e.name, duration: e.duration, id: e.interactionId });
      }).observe({ type: "event", durationThreshold: 16, buffered: true });
    });
    const page = await context.newPage();
    if (!(await exists(page, `${base}/work/${slug}/`))) {
      await context.close();
      continue;
    }
    const cdp = await context.newCDPSession(page);
    await page.waitForTimeout(1500);
    const link = page.locator('nav[aria-label="Next case study"] article a');
    await link.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.evaluate(() => (window.__events = []));
    await link.tap();
    await page.waitForTimeout(2500);
    const events = await page.evaluate(() => window.__events);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const worst = events.reduce((m, e) => Math.max(m, e.duration), 0);
    check(`${slug}: Next case study responds within 150 ms (throttled phone)`, events.length > 0 && worst <= 150, `${Math.round(worst)} ms (${events.map((e) => `${e.name} ${Math.round(e.duration)}`).join(", ")})`);
    await context.close();
  }
}
