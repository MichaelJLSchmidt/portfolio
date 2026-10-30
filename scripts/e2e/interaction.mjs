// Interaction primitives (`npm run test:e2e -- flood`, `-- trail`, `-- portrait`, `-- pointer`):
//
//   flood     the contour flood on titles and buttons: a mouse entering floods from where it came
//             in (radial, the entry point read once) and recedes on leaving; keyboard focus floods
//             left to right (sweep); a tap floods from the finger and recedes after 600 ms; calm
//             cross-fades, still shows it at once; no text is added to the page (echoes only)
//   trail     trail links: a dotted underline at rest, the red line drawn on hover and focus, no
//             width change; a committed link keeps its blaze for the session, also on a reload
//   portrait  the About portrait card: "Show facts" turns it to the facts (the photo face inert
//             and hidden from screen readers), "Show photo" back; the label says what it shows
//   pointer   nothing follows the cursor: moving the pointer inside a title, running text or the
//             footer wordmark changes nothing in the page and draws no field frame (the unit test
//             src/lib/pointer.test.ts keeps pointermove listeners to the card tilt and the
//             lightbox drag)
const ROUTES = ["/", "/about/", "/work/seilschaft/"];

const exists = async (page, url) => (await page.goto(url, { waitUntil: "load" }))?.ok();

export async function flood({ browser, base, check }) {
  console.log("\nflood: titles and buttons");
  for (const mode of ["full", "calm", "still"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: mode === "still" ? "reduce" : "no-preference" });
    if (mode === "calm") await context.addInitScript(() => localStorage.setItem("summit:calm-map", "1"));
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const title = page.locator("h2[data-flood]").first();
    await title.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const box = await title.boundingBox();
    // In from the left edge, a third of the way down.
    await page.mouse.move(box.x - 30, box.y + box.height / 3);
    await page.mouse.move(box.x + 6, box.y + box.height / 3, { steps: 2 });
    await page.waitForTimeout(mode === "full" ? 1400 : 300);
    const on = await title.evaluate((el) => ({
      state: el.getAttribute("data-flood-state"),
      src: el.getAttribute("data-flood-src"),
      fx: parseFloat(el.style.getPropertyValue("--fx")),
      fy: parseFloat(el.style.getPropertyValue("--fy")),
      h: el.getBoundingClientRect().height,
      layer: getComputedStyle(el.querySelector("[data-flood-layer]")).opacity,
      frame: getComputedStyle(el).getPropertyValue("--flood-frame").trim(),
      echoes: [...el.querySelectorAll("[data-echo]")].map((e) => e.textContent).join(""),
    }));
    check(`${mode}: a mouse entering floods the title`, on.state === "in" && on.layer === "1", JSON.stringify(on).slice(0, 160));
    check(`${mode}: from where it came in (radial, the entry point)`, on.src === "radial" && on.fx < 20 && Math.abs(on.fy - on.h / 3) < 12, `${on.src} ${on.fx},${on.fy}`);
    if (mode === "full") check("full: the sprite has run to its last frame", on.frame === "11", on.frame);
    check(`${mode}: the flood adds no text to the title (echoes only)`, on.echoes === "", on.echoes);
    await page.mouse.move(box.x - 60, box.y - 60);
    await page.waitForTimeout(mode === "full" ? 600 : 300);
    const off = await title.evaluate((el) => ({ state: el.getAttribute("data-flood-state"), layer: getComputedStyle(el.querySelector("[data-flood-layer]")).opacity }));
    check(`${mode}: leaving lets it recede`, off.state === "out" && off.layer === "0", JSON.stringify(off));

    // Keyboard: a flood button floods left to right.
    const button = page.locator("button[data-flood]").first();
    if (await button.count()) {
      await button.scrollIntoViewIfNeeded();
      await button.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(mode === "full" ? 1400 : 300);
      const k = await button.evaluate((el) => ({ focused: el.matches(":focus-visible"), state: el.getAttribute("data-flood-state"), src: el.getAttribute("data-flood-src"), layer: getComputedStyle(el.querySelector("[data-flood-layer]")).opacity, width: el.getBoundingClientRect().width }));
      check(`${mode}: keyboard focus floods a button left to right`, k.focused && k.state === "in" && k.src === "sweep" && k.layer === "1", JSON.stringify(k));
    }
    // Still: the change is instant; calm: a cross-fade within --dur-flood-calm.
    const t = await title.evaluate((el) => getComputedStyle(el.querySelector("[data-flood-layer]")).transitionDuration);
    if (mode === "still") check("still: the flood shows at once", /^0s/.test(t), t);
    if (mode === "calm") check("calm: the flood cross-fades in 160 ms", t.includes("0.16s"), t);
    check(`${mode}: no page errors`, errors.length === 0, errors.join("; "));
    await context.close();
  }

  // Touch: from the finger, receding after 600 ms.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    const title = page.locator("h2[data-flood]").first();
    await title.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const box = await title.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(150);
    const tapped = await title.evaluate((el) => ({ state: el.getAttribute("data-flood-state"), fx: parseFloat(el.style.getPropertyValue("--fx")), w: el.getBoundingClientRect().width }));
    check("touch: a tap floods from the finger", tapped.state === "in" && Math.abs(tapped.fx - tapped.w / 2) < 20, JSON.stringify(tapped));
    await page.waitForTimeout(700);
    const later = await title.getAttribute("data-flood-state");
    check("touch: it recedes after 600 ms", later === "out", later);
    await context.close();
  }
}

export async function trail({ browser, base, check }) {
  console.log("\ntrail: trail links");
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const link = page.locator('a[data-trail="standalone"]').first();
  await link.scrollIntoViewIfNeeded();
  const read = () =>
    link.evaluate((a) => {
      const label = a.querySelector("span[class*='label']");
      const cs = getComputedStyle(label);
      return { dotted: cs.textDecorationStyle, size: cs.backgroundSize, width: Math.round(a.getBoundingClientRect().width * 10) / 10 };
    });
  const rest = await read();
  await link.hover();
  await page.waitForTimeout(500);
  const hovered = await read();
  check("at rest a dotted underline, no red line", rest.dotted === "dotted" && /^0(px|%)/.test(rest.size), JSON.stringify(rest));
  check("hover draws the red line", /^100%/.test(hovered.size) || parseFloat(hovered.size) > 10, hovered.size);
  check("the link never changes width", rest.width === hovered.width, `${rest.width} → ${hovered.width}`);
  const href = await link.getAttribute("href");
  await link.click();
  await page.waitForTimeout(1500);
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const blazed = await page.locator(`a[data-trail][href="${href}"]`).first().getAttribute("data-blazed");
  check("a committed link keeps its blaze for the session", blazed === "", String(blazed));
  await context.close();
}

export async function portrait({ browser, base, check }) {
  console.log("\nportrait: the About portrait card");
  for (const mode of ["full", "calm", "still"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: mode === "still" ? "reduce" : "no-preference" });
    if (mode === "calm") await context.addInitScript(() => localStorage.setItem("summit:calm-map", "1"));
    const page = await context.newPage();
    if (!(await exists(page, `${base}/about/`))) {
      console.log("  skip: no About page");
      await context.close();
      return;
    }
    const button = page.getByRole("button", { name: "Show facts" });
    const state = () =>
      page.evaluate(() => {
        const card = document.getElementById("portrait-card");
        const [front, back] = card.querySelectorAll(":scope > div > *");
        return { facing: card.dataset.facing, frontInert: front.inert, backInert: back.inert, backHidden: back.getAttribute("aria-hidden"), frontHidden: front.getAttribute("aria-hidden") };
      });
    const before = await state();
    check(`${mode}: the photo faces up; the facts are inert and hidden`, before.facing === "photo" && before.backInert && before.backHidden === "true", JSON.stringify(before));
    await button.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);
    const after = await state();
    check(`${mode}: Enter turns it to the facts`, after.facing === "facts" && after.frontInert && !after.backInert && after.frontHidden === "true", JSON.stringify(after));
    check(`${mode}: the button now says "Show photo"`, (await page.getByRole("button", { name: "Show photo" }).count()) === 1);
    const facts = await page.evaluate(() => [...document.querySelectorAll("#portrait-card dt")].map((d) => d.textContent));
    check(`${mode}: the facts are text`, facts.length >= 4, facts.join(", "));
    await context.close();
  }
}

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
    // Inside a title, running text and the footer wordmark (cards tilt on purpose: not here).
    for (const selector of ["main h1", "main .body-copy", "footer a[data-flood]"]) {
      const target = page.locator(selector).first();
      if (!(await target.count())) continue;
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
      const box = await target.boundingBox();
      if (!box) continue;
      const y = box.y + box.height / 2;
      // Entering may answer (a flood, a pre-warm); let that finish, then move inside it.
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
