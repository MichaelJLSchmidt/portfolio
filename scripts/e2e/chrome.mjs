// Chrome scenarios: the HUD and the contact band's copy button.
//
//   hud    The bar stays on screen while scrolling (never hidden); after 120 px it condenses
//          (data-condensed) without a layout shift; the readout's box keeps its width across
//          terrains; the slots never overlap from 360 to 1920 px; the rings and labels settle.
//   toast  "Copy address" copies the address, its label settles to "COPIED", a role="status"
//          toast reads "COPIED — see you at the trailhead.", stays 4 s, pauses on hover, closes;
//          in still mode it only fades.
export async function hud({ browser, base, check }) {
  console.log("\nhud: three slots, condensing, the readout");
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
    // The readout's box: reserved at its widest, the same width whatever the terrain.
    const widthAt = () => page.evaluate(() => document.querySelector("header [data-terrain-readout] > [aria-hidden]").getBoundingClientRect().width);
    const home = await widthAt();
    await page.locator('header a[href$="/about/"]').first().click();
    await page.waitForURL(/\/about\/$/);
    // Measured at rest: the route's view transition over and the readout on Bern.
    await page.waitForFunction(
      () =>
        document.querySelector("header [data-terrain-readout]")?.getAttribute("data-terrain-readout") === "bern" &&
        !document.getAnimations().some((a) => a.effect?.pseudoElement?.startsWith("::view-transition")),
      null,
      { timeout: 15000 },
    );
    await page.waitForTimeout(400);
    const bern = await widthAt();
    check("the readout keeps its box from the region to Bern", Math.abs(home - bern) < 0.5, `${home.toFixed(1)} → ${bern.toFixed(1)} px`);
    check("Bern's readout shows coordinates at 1440 px", /E 2’600’000/.test(await page.locator("header [data-terrain-readout] .visually-hidden").textContent()));
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
    await page.waitForFunction(() => /COPIED/.test(document.querySelector("#contact [role=status]")?.textContent ?? ""), null, { timeout: 3000 }).catch(() => {});
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    check("the address is on the clipboard", /@/.test(copied) && !copied.startsWith("mailto:"), copied);
    check("the label settles to COPIED", (await button.getAttribute("aria-label")) === null && /COPIED/.test(await button.textContent()), await button.textContent());
    check("the toast reads “COPIED — see you at the trailhead.”", (await status.textContent()).includes("COPIED — see you at the trailhead."), await status.textContent());
    if (mode === "still") {
      const anim = await page.evaluate(() => getComputedStyle(document.querySelector("#contact [role=status]")).animationName);
      check("still: the toast only fades", anim === "none" || /fade/.test(anim), anim);
    }
    // Hover pauses the clock.
    await page.locator("#contact [role=status]").hover();
    await page.waitForTimeout(4600);
    check("hovering keeps the toast", (await status.textContent()).includes("COPIED"));
    await page.mouse.move(5, 5);
    await page.waitForTimeout(4400);
    check("4 s after the pointer leaves, it is gone", !(await status.textContent()).includes("COPIED"), await status.textContent());
    check("the label is back to Copy address", /Copy address/.test(await button.textContent()));
    await context.close();
  }
}
