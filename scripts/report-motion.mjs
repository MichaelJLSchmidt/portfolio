// Motion cost of the static export in ./out, measured the way the motion audit did:
//
//   layout   main-thread layout and style time during the first 3.5 s of a page on an emulated
//            phone (390×844 at 3x, touch) with the CPU slowed 4×, median of the runs (Chromium's
//            LayoutDuration and RecalcStyleDuration), plus the page's layout shift in that time;
//   lighthouse  (with --lighthouse, when the `lighthouse` package resolves) Lighthouse mobile
//            (its default simulated throttling), median of the runs: LCP, TBT and CLS.
//
//   npm run report:motion                              / with 3 runs
//   npm run report:motion -- /about/ /work/seilschaft/ other pages
//   npm run report:motion -- --runs 5 --lighthouse     more runs, plus Lighthouse
//   npm run report:motion -- --dir ../other-out        another export (e.g. an earlier build)
//
// Playwright as for npm run test:e2e. Lighthouse is not a dependency either: install it anywhere
// and point NODE_PATH at it (CHROME_PATH selects the browser it drives).
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const [value] = args.splice(i, 2).slice(1);
  return value;
};
const runs = Number(option("--runs", 3));
const dir = resolve(root, option("--dir", "out"));
const withLighthouse = args.includes("--lighthouse");
const paths = args.filter((a) => !a.startsWith("--"));
if (!paths.length) paths.push("/");

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  console.error("Playwright is not installed (npm i -D playwright && npx playwright install chromium).");
  process.exit(2);
}
if (!existsSync(join(dir, "index.html"))) {
  console.error(`No static export in ${dir}: run npm run build first.`);
  process.exit(2);
}

const basePath = readFileSync(join(dir, "index.html"), "utf8").match(/(?:src|href)="([^"]*?)\/_next\//)?.[1] ?? "";
const port = await new Promise((done) => {
  const probe = createServer().listen(0, () => {
    const { port } = probe.address();
    probe.close(() => done(port));
  });
});
const server = spawn(process.execPath, [join(root, "scripts/serve-out.mjs"), "--port", String(port), "--dir", dir], {
  cwd: root,
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: basePath },
  stdio: "ignore",
});
const base = `http://localhost:${port}${basePath}`;
for (let i = 0; i < 50; i++) {
  if (await fetch(`${base}/`).then((r) => r.ok, () => false)) break;
  await new Promise((r) => setTimeout(r, 100));
}

const median = (values) => {
  const v = [...values].sort((a, b) => a - b);
  return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
};
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

async function layoutRun(browser, path) {
  const context = await browser.newContext(phone);
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Performance.enable", { timeDomain: "timeTicks" });
  const metric = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const start = await metric();
  const t0 = Date.now();
  await page.goto(`${base}${path}`, { waitUntil: "commit" });
  await page.waitForTimeout(Math.max(0, 3500 - (Date.now() - t0)));
  const end = await metric();
  const cls = await page.evaluate(() => window.__cls);
  await context.close();
  const ms = (name) => ((end[name] ?? 0) - (start[name] ?? 0)) * 1000;
  return { layout: ms("LayoutDuration"), style: ms("RecalcStyleDuration"), script: ms("ScriptDuration"), cls };
}

async function lighthouseRuns(path) {
  let bin;
  try {
    bin = require.resolve("lighthouse/cli/index.js");
  } catch {
    console.log("  lighthouse: not installed (install it anywhere and set NODE_PATH), skipped");
    return;
  }
  const results = [];
  for (let i = 0; i < runs; i++) {
    const json = await new Promise((done, fail) => {
      let out = "";
      const child = spawn(
        process.execPath,
        [bin, `${base}${path}`, "--only-categories=performance", "--output=json", "--quiet", "--chrome-flags=--headless=new --no-sandbox"],
        { env: { ...process.env, CHROME_PATH: process.env.CHROME_PATH ?? playwright.chromium.executablePath() } },
      );
      child.stdout.on("data", (d) => (out += d));
      child.on("exit", (code) => (code === 0 ? done(out) : fail(new Error(`lighthouse exited with ${code}`))));
    });
    const audits = JSON.parse(json).audits;
    results.push({
      lcp: audits["largest-contentful-paint"].numericValue,
      tbt: audits["total-blocking-time"].numericValue,
      cls: audits["cumulative-layout-shift"].numericValue,
    });
  }
  const m = (k) => median(results.map((r) => r[k]));
  console.log(`  lighthouse mobile (median of ${runs}): LCP ${m("lcp").toFixed(0)} ms · TBT ${m("tbt").toFixed(0)} ms · CLS ${m("cls").toFixed(3)}`);
  console.log(`    runs: ${results.map((r) => `${r.lcp.toFixed(0)}/${r.tbt.toFixed(0)}`).join(", ")} (LCP/TBT ms)`);
}

const browser = await playwright.chromium.launch();
try {
  console.log(`Motion cost of ${dir}\n`);
  for (const path of paths) {
    console.log(path);
    const samples = [];
    for (let i = 0; i < runs; i++) samples.push(await layoutRun(browser, path));
    const m = (k) => median(samples.map((s) => s[k]));
    console.log(
      `  first 3.5 s, phone, CPU ×4 (median of ${runs}): layout ${m("layout").toFixed(0)} ms · style ${m("style").toFixed(0)} ms · script ${m("script").toFixed(0)} ms · CLS ${m("cls").toFixed(4)}`,
    );
    console.log(`    layout runs: ${samples.map((s) => s.layout.toFixed(0)).join(", ")} ms`);
    if (withLighthouse) await lighthouseRuns(path);
  }
} finally {
  await browser.close();
  server.kill();
}
