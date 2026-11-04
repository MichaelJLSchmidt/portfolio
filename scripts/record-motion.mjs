// Review videos and screenshots of the motion, recorded in Chromium against the static export in
// ./out (a build with the examples: SITE_MODE=basecamp or a preview). Five viewports (390×844,
// 320×568, 768×1024, 1440×900, 2560×1440) × three tiers (Full, Calm, Off), one round trip each:
// the home page, the cards (a hover on a fine pointer), a card into its case study, a read down
// the page, the footer wordmark (hovered on a fine pointer), and "Back to case studies".
//
//   <viewport>-<tier>.webm       the round trip
//   <viewport>-<tier>-<n>.png    home, cards, the case study, scrolled, the footer, back home
//
//   npm run record:motion                       into ./motion-recordings (git-ignored)
//   npm run record:motion -- --out <folder>
//   npm run record:motion -- --only 1440x900    one viewport (or tier: --only calm)
//
// Playwright as for npm run test:e2e. The field is forced on (?field=force) and drawn by SwiftShader,
// so its frame rate in the recordings says nothing about real devices.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
};
const outDir = resolve(root, arg("--out") ?? "motion-recordings");
const only = arg("--only");
let playwright;
try {
  playwright = createRequire(import.meta.url)("playwright");
} catch {
  console.error("Playwright is not installed (npm i -D playwright && npx playwright install chromium).");
  process.exit(2);
}
if (!existsSync(join(root, "out/work"))) {
  console.error("No case studies in ./out: build with SITE_MODE=basecamp (or NEXT_PUBLIC_PREVIEW=1) first.");
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const basePath = readFileSync(join(root, "out/index.html"), "utf8").match(/(?:src|href)="([^"]*?)\/_next\//)?.[1] ?? "";
const port = await new Promise((done) => {
  const probe = createServer().listen(0, () => {
    const { port } = probe.address();
    probe.close(() => done(port));
  });
});
const server = spawn(process.execPath, [join(root, "scripts/serve-out.mjs"), "--port", String(port)], {
  cwd: root,
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: basePath },
  stdio: "ignore",
});
const base = `http://localhost:${port}${basePath}`;
for (let i = 0; i < 50; i++) {
  if (await fetch(`${base}/`).then((r) => r.ok, () => false)) break;
  await new Promise((r) => setTimeout(r, 100));
}

const viewports = [
  { name: "390x844", width: 390, height: 844, mobile: true },
  { name: "320x568", width: 320, height: 568, mobile: true },
  { name: "768x1024", width: 768, height: 1024, mobile: true },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "2560x1440", width: 2560, height: 1440 },
];
const tiers = [
  { name: "full", motion: "full" },
  { name: "calm", motion: "calm" },
  { name: "off", motion: "still" },
];

const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let problems = 0;
try {
  for (const vp of viewports) {
    for (const tier of tiers) {
      const tag = `${vp.name}-${tier.name}`;
      if (only && !tag.includes(only)) continue;
      // Videos at most 1280 px wide, in the viewport's proportions.
      const w = Math.min(vp.width, 1280);
      const size = { width: w, height: Math.round((w * vp.height) / vp.width) };
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        ...(vp.mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
        reducedMotion: tier.motion === "still" ? "reduce" : "no-preference",
        recordVideo: { dir: outDir, size },
      });
      await context.addInitScript((motion) => {
        try {
          if (motion === "calm") localStorage.setItem("summit:motion", "calm");
        } catch {}
      }, tier.motion);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const shot = (n) => page.screenshot({ path: join(outDir, `${tag}-${n}.png`) });
      const press = (l) => (vp.mobile ? l.tap() : l.click());
      try {
        await page.goto(`${base}/?field=force`, { waitUntil: "load" });
        await page.waitForTimeout(3000);
        await shot("1-home");
        await page.evaluate(() => document.getElementById("case-studies").scrollIntoView({ behavior: "smooth" }));
        await page.waitForTimeout(1800);
        const card = page.locator("#case-studies article a").nth(1);
        if (!vp.mobile) {
          await card.hover();
          await page.waitForTimeout(1000);
        }
        await shot("2-cards");
        await press(card);
        await page.waitForURL(/\/work\//);
        await page.waitForTimeout(2500);
        await shot("3-case-study");
        for (let i = 0; i < 6; i++) {
          await page.mouse.wheel(0, vp.height * 0.8);
          await page.waitForTimeout(700);
        }
        await shot("4-case-study-scrolled");
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }));
        await page.waitForTimeout(2000);
        const mark = page.locator("footer [data-relief-root]");
        const box = !vp.mobile && (await mark.count()) ? await mark.boundingBox() : null;
        if (box) {
          await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
          await page.waitForTimeout(1500);
        }
        await shot("5-footer");
        const back = page.locator('nav[aria-label="Next case study"] a[data-back]');
        await back.scrollIntoViewIfNeeded();
        await press(back);
        await page.waitForURL((u) => u.pathname === `${basePath}/`);
        await page.waitForTimeout(2000);
        await shot("6-back-home");
      } catch (e) {
        errors.push(`script: ${e.message.split("\n")[0]}`);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth).catch(() => -1);
      const video = page.video();
      await context.close();
      if (video) renameSync(await video.path(), join(outDir, `${tag}.webm`));
      if (errors.length || overflow > 0) problems++;
      console.log(`  ${tag}.webm  overflow ${overflow} px, ${errors.length ? errors.join(" | ") : "no errors"}`);
    }
  }
} finally {
  await browser.close();
  server.kill();
}
process.exit(problems ? 1 : 0);
