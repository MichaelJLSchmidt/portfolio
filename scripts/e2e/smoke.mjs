// Cross-browser smoke subset: the same few checks in Chromium, WebKit and Firefox (each where
// Playwright has it installed; a missing engine is named and skipped, never failed).
//
//   npm run test:e2e -- smoke
//
// Per engine: every route loads without a page error and with exactly one visible H1, the main
// navigation is there, nothing scrolls sideways at 360 px, the keyboard reaches a link, and a
// click on a navigation link changes the route in the page (client-side navigation).
import { routes } from "./layout.mjs";

const ENGINES = ["chromium", "webkit", "firefox"];

// WebKit reports a route prefetch that the next page load cancels as a page error ("… due to
// access control checks"); that is the test leaving the page, not the page failing.
const cancelledPrefetch = (message) => /_rsc=.*due to access control checks/.test(message);

export async function smoke({ playwright, base, basePath, root, check }) {
  for (const engine of ENGINES) {
    console.log(`\nsmoke: ${engine}`);
    let browser;
    try {
      browser = await playwright[engine].launch(engine === "chromium" ? { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } : {});
    } catch (e) {
      console.log(`  - ${engine} is not installed here, skipped (${e.message.split("\n")[0].slice(0, 80)})`);
      continue;
    }
    try {
      for (const width of [1440, 360]) {
        const context = await browser.newContext({ viewport: { width, height: width > 400 ? 900 : 740 } });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => cancelledPrefetch(e.message) || errors.push(e.message));
        for (const path of routes(root)) {
          await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
          await page.waitForTimeout(300);
          const r = await page.evaluate(() => {
            const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
            const h1s = [...document.querySelectorAll("h1")].filter(visible);
            const nav = document.querySelector("header nav a[href]");
            return {
              h1s: h1s.length,
              h1: h1s[0]?.textContent.trim().replace(/\s+/g, " ").slice(0, 40) ?? "",
              nav: !!nav,
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              mainOpacity: Number(getComputedStyle(document.querySelector("main") ?? document.body).opacity),
            };
          });
          check(`${width} px ${path}: one H1, the navigation, content shown`, r.h1s === 1 && r.nav && r.mainOpacity === 1, JSON.stringify(r));
          check(`${width} px ${path}: nothing scrolls sideways`, r.overflow <= 0, `${r.overflow} px`);
        }
        check(`${width} px: no page errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
        await context.close();
      }

      // Keyboard and an in-page navigation.
      const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => cancelledPrefetch(e.message) || errors.push(e.message));
      await page.goto(`${base}/`, { waitUntil: "networkidle" });
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      check("the keyboard reaches a link or control", ["A", "BUTTON", "INPUT"].includes(focused), focused);
      const marker = await page.evaluate(() => (window.__smoke = 1));
      const about = page.locator(`header nav a[href="${basePath}/about/"]`).first();
      await about.click();
      await page.waitForURL((url) => url.pathname === `${basePath}/about/`, { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(800);
      const after = await page.evaluate(() => ({ path: location.pathname, kept: window.__smoke === 1, h1: document.querySelector("main h1")?.textContent.trim() }));
      check("a navigation link changes the route in the page", after.path === `${basePath}/about/` && after.kept === (marker === 1), JSON.stringify(after));
      check("no page errors on the way", errors.length === 0, errors.slice(0, 2).join(" | "));
      await context.close();
    } finally {
      await browser.close();
    }
  }
}
