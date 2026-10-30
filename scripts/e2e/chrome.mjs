// Chrome scenarios: the HUD and the contact band's copy button.
//
//   hud    The bar stays on screen while scrolling (never hidden); after 120 px it condenses
//          (data-condensed) without a layout shift; the slots never overlap from 360 to 1920 px.
//   toast  "Copy address" copies the address, its label changes to "Copied", a role="status"
//          toast reads "Email address copied.", stays 4 s, pauses on hover, closes; in still
//          mode it only fades.
export async function hud({ browser, base, check }) {
  console.log("\nhud: two slots, condensing");
  for (const width of [360, 640, 1024, 1280, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await context.newPage();
    await page.goto(`${base}/about/`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const r = await page.evaluate(() => {
      const bar = document.querySelector("header[data-chrome]").firstElementChild;
      const items = [...bar.children].flatMap((slot) => [...slot.children]).filter((el) => el.getClientRects().length);
      const boxes = items.map((el) => el.getBoundingClientRect());
      const overlaps = boxes.some((a, i) => boxes.some((b, j) => j > i && a.left < b.right - 0.5 && b.left < a.right - 0.5));
      return { overlaps, inside: boxes.every((b) => b.left >= 0 && b.right <= innerWidth + 0.5) };
    });
    check(`${width} px: the slots never overlap and stay on screen`, !r.overlaps && r.inside, JSON.stringify(r));
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      window.__shifts = [];
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__shifts.push(e.value);
      }).observe({ type: "layout-shift", buffered: true });
    });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    const before = await page.evaluate(() => window.__shifts.length);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(900);
    const s = await page.evaluate((n) => {
      const h = document.querySelector("header[data-chrome]");
      const r = h.getBoundingClientRect();
      return { condensed: h.hasAttribute("data-condensed"), top: r.top, visible: getComputedStyle(h).visibility, shifts: window.__shifts.slice(n).reduce((a, b) => a + b, 0) };
    }, before);
    check("after 120 px the bar condenses, still on screen", s.condensed && s.top === 0 && s.visible === "visible", JSON.stringify(s));
    check("condensing moves nothing (no layout shift)", s.shifts < 0.0005, s.shifts.toFixed(5));
    await page.mouse.wheel(0, -900);
    await page.waitForTimeout(700);
    check("back at the top it rests again", !(await page.evaluate(() => document.querySelector("header[data-chrome]").hasAttribute("data-condensed"))));
    await context.close();
  }
}

export async function toast({ browser, base, check }) {
  for (const mode of ["full", "still"]) {
    console.log(`\ntoast: copy address (${mode})`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: mode === "still" ? "reduce" : "no-preference" });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const page = await context.newPage();
    await page.goto(`${base}/#contact`, { waitUntil: "load" });
    const button = page.locator("#contact button", { hasText: "Copy address" });
    if (!(await button.count())) {
      check("a Copy address button beside Email", false, "not found");
      await context.close();
      continue;
    }
    await button.scrollIntoViewIfNeeded();
    const order = await page.evaluate(() => [...document.querySelectorAll("#contact ul > li")].map((li) => li.textContent.trim().slice(0, 14)));
    check("Copy address sits right after Email", /^Email/.test(order[0] ?? "") && /Copy address/.test(order[1] ?? ""), order.join(" · "));
    const status = page.locator("#contact [role=status]");
    check("the toast's status region exists before it speaks", (await status.count()) === 1);
    await button.click();
    // The clipboard write is asynchronous; under load the toast can take longer than a frame.
    await page.waitForFunction(() => /Email address copied/.test(document.querySelector("#contact [role=status]")?.textContent ?? ""), null, { timeout: 3000 }).catch(() => {});
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    check("the address is on the clipboard", /@/.test(copied) && !copied.startsWith("mailto:"), copied);
    check("the label changes to Copied", (await button.getAttribute("aria-label")) === null && /Copied/i.test(await button.textContent()), await button.textContent());
    check("the toast reads “Email address copied.”", (await status.textContent()).includes("Email address copied."), await status.textContent());
    if (mode === "still") {
      const anim = await page.evaluate(() => getComputedStyle(document.querySelector("#contact [role=status]")).animationName);
      check("still: the toast only fades", anim === "none" || /fade/.test(anim), anim);
    }
    // Hover pauses the clock.
    await page.locator("#contact [role=status]").hover();
    await page.waitForTimeout(4600);
    check("hovering keeps the toast", (await status.textContent()).includes("Email address copied."));
    await page.mouse.move(5, 5);
    await page.waitForTimeout(4400);
    check("4 s after the pointer leaves, it is gone", !(await status.textContent()).includes("Email address copied."), await status.textContent());
    check("the label is back to Copy address", /Copy address/.test(await button.textContent()));
    await context.close();
  }
}
