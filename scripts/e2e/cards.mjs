// The deck and its cards (phase 4): `npm run test:e2e -- cards`. Needs a build with
// the flagged examples (SITE_MODE=basecamp or a preview).
//
//   cards  the spread grid (0°, 63:88, three columns on desktop) and the phone list (one column,
//          scroll-snap y proximity); arrival once per session (rise and fade, no rotation); hover
//          (lift −6 px, tilt ≤ 5°, foil ≤ 0.18 on R and M only), keyboard focus (lift, never tilt),
//          calm (no tilt, no foil); press 0.98; scope pips ("Scope n of 5"); one stat size, the
//          impact's after-value with "from <before>"; the visited stamp; no gyroscope control.
import { existsSync } from "node:fs";
import { join } from "node:path";

const ORDER = ["seilschaft", "gratweg", "test-project"];

export async function cards({ browser, base, root, check }) {
  console.log("\ncards: the deck and its cards");
  if (!existsSync(join(root, "out/work/seilschaft/index.html"))) {
    console.log("  skipped: the example case studies are not in this build (build with SITE_MODE=basecamp)");
    return;
  }
  const newPage = async ({ viewport = { width: 1440, height: 900 }, calm = false, mobile = false, dealt = true } = {}) => {
    const context = await browser.newContext({ viewport, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
    await context.addInitScript(
      ({ calm, dealt }) => {
        try {
          
          if (dealt) sessionStorage.setItem("summit:deck-dealt", "1");
          if (calm) localStorage.setItem("summit:calm-map", "1");
        } catch {}
      },
      { calm, dealt },
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
    return { context, page, errors };
  };
  const card = (slug) => `article[data-slug="${slug}"]`;

  // Layout: the spread grid at rest.
  {
    const { context, page, errors } = await newPage();
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.locator(card(ORDER[0])).scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      const arts = [...document.querySelectorAll("#work article[data-slug]")];
      const boxes = arts.map((a) => a.getBoundingClientRect());
      const tilt = arts.map((a) => a.querySelector("[class*=tilt]"));
      return {
        tops: boxes.map((b) => Math.round(b.top)),
        lefts: boxes.map((b) => Math.round(b.left)),
        transforms: tilt.map((t) => getComputedStyle(t).transform),
        ratio: tilt.map((t) => +(t.getBoundingClientRect().width / t.getBoundingClientRect().height).toFixed(3)),
        gyro: [...document.querySelectorAll("button")].some((b) => /tilt/i.test(b.textContent)),
      };
    });
    check("desktop: three cards side by side, in one row", new Set(r.tops).size === 1 && r.lefts[0] < r.lefts[1] && r.lefts[1] < r.lefts[2], JSON.stringify(r.tops));
    check("cards rest at 0° (no rotation)", r.transforms.every((t) => t === "none" || /^matrix\(1, 0, 0, 1,/.test(t)), r.transforms.join(" | "));
    check("cards keep the 63:88 ratio", r.ratio.every((x) => Math.abs(x - 63 / 88) < 0.01), r.ratio.join(", "));
    check("no gyroscope control", !r.gyro);

    // Hover: lift, tilt within 5°, foil within 0.18 on R and M only. The tilt springs load once
    // the page is idle.
    await page.waitForFunction(() => document.readyState === "complete");
    await page.waitForTimeout(2000);
    const target = page.locator(card("seilschaft"));
    const box = await target.boundingBox();
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1, { steps: 6 });
    await page.waitForTimeout(900);
    const hover = await target.evaluate((el) => {
      const deg = (v) => Math.abs(parseFloat(v || "0"));
      const foil = el.querySelector("[class*=foil]");
      return {
        translate: getComputedStyle(el.querySelector("[class*=stage]")).translate,
        rx: deg(el.style.getPropertyValue("--rx")),
        ry: deg(el.style.getPropertyValue("--ry")),
        foil: foil ? Number(getComputedStyle(foil).opacity) : null,
        rarity: el.dataset.rarity,
      };
    });
    const px = (t) => parseFloat(t.split(" ")[1] ?? "0");
    check("hover lifts the card −6 px", Math.abs(px(hover.translate) + 6) < 0.1, hover.translate);
    check("hover tilts it, at most 5°", hover.rx + hover.ry > 0.2 && hover.rx <= 5.01 && hover.ry <= 5.01, `rx ${hover.rx} ry ${hover.ry}`);
    check("the foil shows on the hovered card, at most 0.18", hover.foil !== null && hover.foil > 0 && hover.foil <= 0.18, String(hover.foil));
    const others = await page.evaluate(() =>
      [...document.querySelectorAll("#work article[data-slug]")].filter((a) => a.dataset.active !== "true").map((a) => Number(getComputedStyle(a.querySelector("[class*=foil]") ?? a).opacity)),
    );
    check("no foil on the cards not hovered", others.every((o) => o === 0 || o === 1), JSON.stringify(others));
    // Press: 0.98.
    // The press spring takes 350 ms; with the field drawing in software, frames come slowly.
    await page.mouse.down();
    await page
      .waitForFunction((sel) => Number(getComputedStyle(document.querySelector(`${sel} [class*=stage]`)).scale) < 0.981, card("seilschaft"), { timeout: 2000, polling: 50 })
      .catch(() => {});
    const pressed = await target.evaluate((el) => getComputedStyle(el.querySelector("[class*=stage]")).scale);
    await page.mouse.move(5, 5);
    await page.mouse.up();
    check("press scales the card to 0.98", Math.abs(Number(pressed) - 0.98) < 0.002, pressed);
    await page.waitForTimeout(600);

    // Keyboard focus: the lift, never the tilt.
    await target.locator("a").focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(600);
    const focus = await target.evaluate((el) => ({ translate: getComputedStyle(el.querySelector("[class*=stage]")).translate, rx: el.style.getPropertyValue("--rx") || "0deg" }));
    check("keyboard focus lifts the card and never tilts it", Math.abs(px(focus.translate) + 6) < 0.1 && Math.abs(parseFloat(focus.rx)) < 0.01, JSON.stringify(focus));

    // Marks and stats.
    const marks = await target.evaluate((el) => ({
      pips: el.querySelector("[role=img][aria-label^='Scope']")?.getAttribute("aria-label"),
      filled: el.querySelectorAll("[class*=pipMark][data-on]").length,
      sizes: [...el.querySelectorAll("dd")].map((d) => getComputedStyle(d).fontSize),
      impact: [...el.querySelectorAll("dd")].at(-1)?.querySelector(".visually-hidden")?.textContent,
      note: [...el.querySelectorAll("dd")].at(-1)?.querySelector("small")?.textContent,
    }));
    check("scope pips read “Scope n of 5”, n filled", /^Scope (\d) of 5$/.test(marks.pips ?? "") && marks.filled === Number(marks.pips?.match(/\d/)?.[0]), JSON.stringify(marks));
    check("one size for every stat value", new Set(marks.sizes).size === 1, marks.sizes.join(", "));
    check("the impact shows its after-value, “from <before>” beneath", /^\d+%$/.test(marks.impact ?? "") && /^from \d+%/.test(marks.note ?? ""), `${marks.impact} / ${marks.note}`);
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }

  // Calm: no tilt, no foil.
  {
    const { context, page } = await newPage({ calm: true });
    await page.goto(`${base}/`, { waitUntil: "load" });
    const target = page.locator(card("seilschaft"));
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1, { steps: 6 });
    await page.waitForTimeout(800);
    const calm = await target.evaluate((el) => ({ rx: el.style.getPropertyValue("--rx") || "0deg", foil: Number(getComputedStyle(el.querySelector("[class*=foil]")).opacity), lift: getComputedStyle(el.querySelector("[class*=stage]")).translate }));
    check("calm: no tilt and no foil; the lift (a response) stays", Math.abs(parseFloat(calm.rx)) < 0.01 && calm.foil === 0 && Math.abs(parseFloat(calm.lift.split(" ")[1]) + 6) < 0.1, JSON.stringify(calm));
    await context.close();
  }

  // Arrival once per session: wait below the fold, then rise and fade, no rotation; not again.
  {
    const { context, page } = await newPage({ dealt: false });
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.waitForSelector("#work article[data-arrive]", { state: "attached" });
    const before = await page.$$eval("#work article[data-slug]", (as) => as.map((a) => a.dataset.arrive));
    check("below the fold the cards wait to arrive", before.every((s) => s === "wait"), before.join(","));
    await page.locator("#work-heading").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 300));
    const samples = [];
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(60);
      samples.push(await page.$$eval("#work article[data-slug]", (as) => as.map((a) => getComputedStyle(a).transform)));
    }
    await page.waitForTimeout(900);
    const after = await page.$$eval("#work article[data-slug]", (as) => as.map((a) => a.dataset.arrive));
    const rotated = samples.flat().filter((t) => t !== "none" && !/^matrix\(1, 0, 0, 1,/.test(t));
    check("they arrive as they come into view", after.every((s) => s === "in"), after.join(","));
    check("the deal rises and fades, never rotates", rotated.length === 0, rotated.slice(0, 2).join(" | "));
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(600);
    const again = await page.$$eval("#work article[data-slug]", (as) => as.map((a) => a.dataset.arrive));
    check("once per session: after a reload they are simply there", again.every((s) => s === "done"), again.join(","));
    await context.close();
  }

  // Phones: one column of full-width cards that snap (y proximity).
  {
    const { context, page } = await newPage({ viewport: { width: 390, height: 844 }, mobile: true });
    await page.goto(`${base}/`, { waitUntil: "load" });
    const r = await page.evaluate(() => {
      const arts = [...document.querySelectorAll("#work article[data-slug]")];
      const list = arts[0].closest("ul");
      return {
        snap: getComputedStyle(document.documentElement).scrollSnapType,
        align: getComputedStyle(arts[0].closest("li")).scrollSnapAlign,
        lefts: arts.map((a) => Math.round(a.getBoundingClientRect().left)),
        widths: arts.map((a) => Math.round(a.getBoundingClientRect().width)),
        list: Math.round(list.getBoundingClientRect().width),
      };
    });
    check("phone: one column of full-width cards", new Set(r.lefts).size === 1 && r.widths.every((w) => w >= r.list - 1), JSON.stringify(r));
    // "y proximity" serialises as "y" (proximity is the default).
    check("phone: the cards snap (y proximity, centred)", /^y( proximity)?$/.test(r.snap) && r.align.includes("center"), `${r.snap} / ${r.align}`);
    await context.close();
  }

  // Visited: after its case study, the card shows the "Visited" stamp and its name says "Visited".
  {
    const { context, page } = await newPage();
    await page.goto(`${base}/work/gratweg/`, { waitUntil: "load" });
    await page.waitForFunction(() => localStorage.getItem("summit:visited")?.includes("gratweg"), null, { timeout: 15000 });
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.waitForSelector('article[data-slug="gratweg"][data-visited]', { timeout: 15000 }).catch(() => {});
    const v = await page.evaluate(() => {
      const el = document.querySelector('article[data-slug="gratweg"]');
      const other = document.querySelector('article[data-slug="seilschaft"]');
      const stamp = el.querySelector("[class*=visited]");
      return { stamp: (stamp?.querySelector(".visually-hidden") ?? stamp)?.textContent.trim(), label: el.querySelector("a").getAttribute("aria-label"), other: !!other.querySelector("[class*=visited]") };
    });
    check("a visited card shows the “Visited” stamp", v.stamp === "Visited", String(v.stamp));
    check("screen readers hear “Visited”", /, Visited$/.test(v.label ?? ""), v.label);
    check("cards not visited have no stamp", !v.other);
    await context.close();
  }
}
