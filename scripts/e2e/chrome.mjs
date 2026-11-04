// Chrome scenarios: the HUD and the contact band's copy button.
//
//   hud    The bar stays on screen while scrolling (never hidden); after 120 px it condenses
//          (data-condensed) without a layout shift; the slots never overlap from 360 to 1920 px.
//   toast  "Copy address" copies the address, its label changes to "Copied", a role="status"
//          toast reads "Email address copied.", stays 4 s, pauses on hover, closes; in still
//          mode it only fades.

export async function toast({ browser, base, check }) {
  for (const mode of ["full", "still"]) {
    console.log(`\ntoast: copy address (${mode})`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: mode === "still" ? "reduce" : "no-preference" });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const page = await context.newPage();
    await page.goto(`${base}/#contact`, { waitUntil: "load" });
    // By either of its labels: the locator must still find it once it says "Copied".
    const button = page.locator("#contact button", { hasText: /^(Copy address|Copied)$/ });
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
