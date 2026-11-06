// Chrome scenarios: the footer's copy button.
//
//   toast  "Copy address" (in the footer's Get in touch, after the email) copies the address, its
//          name changes to "Copied", a role="status" toast reads "Email address copied.", stays
//          4 s, pauses on hover, closes; in still mode it only fades.

export async function toast({ browser, base, check }) {
  for (const mode of ["full", "still"]) {
    console.log(`\ntoast: copy address (${mode})`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: mode === "still" ? "reduce" : "no-preference" });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const page = await context.newPage();
    await page.goto(`${base}/#contact`, { waitUntil: "load" });
    // By either of its labels: the locator must still find it once it says "Copied".
    const button = page.locator("#contact").getByRole("button", { name: /^(Copy address|Copied)$/ });
    const named = (name) => page.locator("#contact").getByRole("button", { name, exact: true }).count();
    if (!(await button.count())) {
      check("a Copy address button beside Email", false, "not found");
      await context.close();
      continue;
    }
    await button.scrollIntoViewIfNeeded();
    const order = await page.evaluate(() => {
      const button = [...document.querySelectorAll("#contact button")].find((b) => /Copy address/.test(b.textContent));
      const email = document.querySelector('#contact a[href^="mailto:"]');
      return { together: !!email && email.parentElement === button?.parentElement, before: !!email && !!(email.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING) };
    });
    check("Copy address sits with the email, after it", order.together && order.before, JSON.stringify(order));
    const status = page.locator("#contact [role=status]");
    check("the toast's status region exists before it speaks", (await status.count()) === 1);
    await button.click();
    // The clipboard write is asynchronous; under load the toast can take longer than a frame.
    await page.waitForFunction(() => /Email address copied/.test(document.querySelector("#contact [role=status]")?.textContent ?? ""), null, { timeout: 3000 }).catch(() => {});
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    check("the address is on the clipboard", /@/.test(copied) && !copied.startsWith("mailto:"), copied);
    check("the button's name changes to Copied", (await named("Copied")) === 1 && (await named("Copy address")) === 0);
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
    check("the name is back to Copy address", (await named("Copy address")) === 1);
    await context.close();
  }
}
