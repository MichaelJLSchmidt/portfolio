// The relief fill on the footer wordmark (`npm run test:e2e -- wordmark`), measured in pixels of
// the sheet colour inside the word (a screenshot of it, decoded with sharp):
//
//   at rest   the 1 px outline and the construction layer (guides, corner ticks, a crosshair per
//             glyph, the coordinates), no fill; the link named, its insides hidden from readers
//   hover     a fine pointer resting on a glyph fills it within about 1.2 s, with mint isolines at
//             the edge; on leave the fill decays and the loop stops (no more draws)
//   focus     keyboard focus fills every glyph within 600 ms
//   touch     one survey pass once it is in view, then it stays filled
//   Calm      the fill crossfades in on hover; Off: filled at rest, nothing moves
//   no layout shift in any of it
import { createRequire } from "node:module";
import { join } from "node:path";

export async function wordmark({ browser, base, root, check }) {
  console.log("\nwordmark: the relief fill");
  const sharp = createRequire(join(root, "package.json"))("sharp");
  const SHEET = [221, 227, 227];
  /** Shares of the word's box in the sheet colour and in mint. */
  const coverage = async (page, link) => {
    const box = await link.boundingBox();
    const png = await page.screenshot({ clip: box });
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    let sheet = 0;
    let mint = 0;
    const near = (i, c) => Math.abs(data[i] - c[0]) + Math.abs(data[i + 1] - c[1]) + Math.abs(data[i + 2] - c[2]) < 24;
    for (let i = 0; i < data.length; i += info.channels) {
      if (near(i, SHEET)) sheet++;
      // The isolines: antialiased 1 px mint, so any clearly green pixel.
      else if (data[i + 1] > data[i] + 14 && data[i + 1] > data[i + 2] + 24) mint++;
    }
    const n = info.width * info.height;
    return { sheet: +(sheet / n).toFixed(3), mint: +(mint / n).toFixed(4) };
  };
  const setup = async ({ mode = "full", mobile = false } = {}) => {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      reducedMotion: mode === "still" ? "reduce" : "no-preference",
      ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    });
    await context.addInitScript(
      ({ mode }) => {
        try {
          if (mode === "calm") localStorage.setItem("summit:motion", "calm");
        } catch {}
        window.__draws = 0;
        const o = WebGL2RenderingContext.prototype.drawArrays;
        WebGL2RenderingContext.prototype.drawArrays = function (...a) {
          if (this.canvas?.hasAttribute?.("data-relief-canvas")) window.__draws++;
          return o.apply(this, a);
        };
        window.__shift = 0;
        new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__shift += e.value))).observe({ type: "layout-shift", buffered: true });
      },
      { mode },
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/`, { waitUntil: "load" });
    const link = page.locator("footer [data-relief-root]");
    await link.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector("footer [data-relief-root]")?.hasAttribute("data-relief"), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);
    return { context, page, link, errors };
  };

  // Full, a fine pointer.
  {
    const { context, page, link, errors } = await setup();
    const rest = await page.evaluate(() => {
      const root = document.querySelector("footer [data-relief-root]");
      const svg = root.querySelector("[data-relief-construction]");
      return {
        state: root.getAttribute("data-relief"),
        name: root.getAttribute("aria-label"),
        hidden: root.querySelector("[data-relief-stack]").getAttribute("aria-hidden") === "true" && svg.getAttribute("aria-hidden") === "true",
        canvas: root.querySelector("[data-relief-canvas]")?.getAttribute("aria-hidden"),
        lines: svg.querySelectorAll("line").length,
        glyphs: [...root.querySelector("[data-relief-text]").textContent].filter((c) => c.trim()).length,
        coordinates: svg.querySelector("text")?.textContent,
      };
    });
    const base0 = await coverage(page, link);
    check("rest: WebGL relief, outline only (no fill)", rest.state === "gl" && base0.sheet < 0.005, JSON.stringify({ ...rest, ...base0 }));
    check("rest: the construction layer (3 guides a line, 8 tick strokes, a crosshair per glyph, the coordinates)", rest.lines >= 3 + 8 + 2 * rest.glyphs && /\d+\.\d+ N \d+\.\d+ E/.test(rest.coordinates ?? ""), JSON.stringify(rest));
    check("the link is named; the stack, canvas and construction are hidden from readers", /write to/.test(rest.name ?? "") && rest.hidden && rest.canvas === "true", JSON.stringify(rest));
    const box = await link.boundingBox();
    const x = box.x + box.width * 0.2;
    const y = box.y + box.height * 0.5;
    await page.mouse.move(x - 10, y);
    for (let i = 0; i <= 5; i++) {
      await page.mouse.move(x - 10 + i * 2, y);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(1300);
    const hover = await coverage(page, link);
    check("hover: a resting pointer fills its glyph within about 1.2 s, mint isolines at the edge", hover.sheet > 0.05 && hover.mint > 0.0005, JSON.stringify(hover));
    await page.mouse.move(2, 2);
    await page.waitForTimeout(2400);
    const left = await coverage(page, link);
    const d0 = await page.evaluate(() => window.__draws);
    await page.waitForTimeout(600);
    const d1 = await page.evaluate(() => window.__draws);
    check("leave: the fill decays and the loop stops", left.sheet < 0.005 && d1 === d0, JSON.stringify({ ...left, draws: d1 - d0 }));
    // Keyboard focus: every glyph within 600 ms.
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(900);
    const focus = await coverage(page, link);
    const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    check("focus: every glyph fills within 600 ms, with the focus ring", focus.sheet > 0.18 && ring !== "none", JSON.stringify({ ...focus, ring }));
    check("no layout shift, no page errors", (await page.evaluate(() => window.__shift)) < 0.001 && errors.length === 0, errors.join("; "));
    await context.close();
  }

  // Touch: one survey pass once in view; it stays.
  {
    const { context, page, link } = await setup({ mobile: true });
    await page.waitForTimeout(1500);
    const touch = await coverage(page, link);
    check("touch: one survey pass, then it stays filled", touch.sheet > 0.18, JSON.stringify(touch));
    await context.close();
  }

  // Calm: the fill crossfades in on hover. Off: filled at rest, nothing moves.
  {
    const { context, page, link } = await setup({ mode: "calm" });
    const before = await coverage(page, link);
    await link.hover();
    await page.waitForTimeout(700);
    const after = await coverage(page, link);
    check("Calm: outline at rest, the fill crossfades in on hover", (await link.getAttribute("data-relief")) === "calm" && before.sheet < 0.005 && after.sheet > 0.18, JSON.stringify({ before, after }));
    await context.close();
  }
  {
    const { context, page, link } = await setup({ mode: "still" });
    const off = await coverage(page, link);
    const running = await page.evaluate(() => document.querySelector("footer [data-relief-root]").getAnimations({ subtree: true }).length);
    check("Off: filled at rest, no canvas, nothing runs", (await link.getAttribute("data-relief")) === "still" && off.sheet > 0.18 && running === 0 && !(await page.locator("footer [data-relief-canvas]").count()), JSON.stringify({ ...off, running }));
    await context.close();
  }
}
