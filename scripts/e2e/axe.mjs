// Accessibility (phase 8): `npm run test:e2e -- axe`. axe-core's WCAG 2.2 A and AA rules on every
// route, in full, calm and still motion, on desktop and on a phone, and once more with forced
// colours. Each page is checked once it has settled (fonts, the arrival, reveals in the first
// viewport) and again scrolled to its foot, so content revealed on the way is checked too.
// Contrast over the contour field is checked by check:contrast and check:legibility instead (axe
// cannot see a canvas behind text, so it reports those as incomplete, not as violations).
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

async function audit(page, { forced = false } = {}) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async ({ tags, forced }) => {
    // With forced colours axe still measures the authored colours, not the system colours the
    // browser paints (black, blue and white here): its contrast rule says nothing true there.
    const rules = forced ? { "color-contrast": { enabled: false } } : {};
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: tags }, rules, resultTypes: ["violations"] });
    return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}${v.nodes.length > 3 ? ` +${v.nodes.length - 3}` : ""}`);
  }, { tags: TAGS, forced });
}

export async function axe({ browser, base, root, check }) {
  console.log("\naxe: WCAG 2.2 A and AA, every route, every mode");
  const routes = ["/", "/about/", "/no-such-page/"];
  for (const slug of ["seilschaft", "test-project", "gratweg"]) if (existsSync(join(root, "out/work", slug, "index.html"))) routes.push(`/work/${slug}/`);
  const runs = [
    { label: "full", viewport: { width: 1440, height: 900 } },
    { label: "calm", viewport: { width: 1440, height: 900 }, calm: true },
    { label: "still", viewport: { width: 1440, height: 900 }, reduced: true },
    { label: "phone", viewport: { width: 390, height: 844 }, mobile: true },
    { label: "forced colours", viewport: { width: 1440, height: 900 }, forced: true },
  ];
  for (const run of runs) {
    const context = await browser.newContext({
      viewport: run.viewport,
      reducedMotion: run.reduced ? "reduce" : "no-preference",
      forcedColors: run.forced ? "active" : "none",
      ...(run.mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    });
    await context.addInitScript((calm) => {
      try {
        sessionStorage.setItem("summit:deck-dealt", "1");
        if (calm) localStorage.setItem("summit:calm-map", "1");
      } catch {}
    }, !!run.calm);
    const page = await context.newPage();
    for (const route of routes) {
      // "load", not network idle: the field keeps fetching heightmaps in the background.
      await page.goto(`${base}${route}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500);
      const top = await audit(page, run);
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      await page.waitForTimeout(900);
      const foot = await audit(page, run);
      const all = [...new Set([...top, ...foot])];
      check(`${run.label} ${route}: no WCAG A/AA violations`, all.length === 0, all.slice(0, 4).join(" | "));
    }
    await context.close();
  }
}
