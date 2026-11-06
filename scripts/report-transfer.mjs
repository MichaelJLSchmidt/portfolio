// What a visit to one page actually transfers, measured in Chromium over the static export (gzip,
// like the host): on a phone (390×844 at 3x) and a desktop (1440×900), first view (loaded, idle,
// not scrolled) and after scrolling to the end (every lazy image in), by kind. The contour field
// (Three.js and the heightmaps, loaded after idle where the device can run it) is listed apart.
//
//   npm run report:transfer                       the case-study example (/work/test-project/)
//   npm run report:transfer -- /work/seilschaft/  any page of the build in out/
//
// Playwright as for npm run test:e2e.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = process.argv[2] ?? "/work/test-project/";
let playwright;
try {
  playwright = createRequire(import.meta.url)("playwright");
} catch {
  console.error("Playwright is not installed (npm i -D playwright && npx playwright install chromium).");
  process.exit(2);
}
if (!existsSync(join(root, "out", path, "index.html"))) {
  console.error(`No ${path} in ./out: build first (the example needs SITE_MODE=basecamp).`);
  process.exit(2);
}

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

const kind = (url, type) => {
  if (/\/terrain\//.test(url)) return "field";
  if (type === "Font") return "fonts";
  if (type === "Script") return "js";
  if (type === "Stylesheet") return "css";
  if (type === "Document") return "html";
  if (type === "Image") return "images";
  return "other";
};
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const devices = [
  { name: "phone 390×844 @3x", viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: "desktop 1440×900 @1x", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: "desktop 1440×900 @2x", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
];
console.log(`Transfer for ${path} (encoded bytes; text gzipped like the host)\n`);
try {
  for (const device of devices) {
    const context = await browser.newContext(device);
    await context.addInitScript(() => {
      try {
        
      } catch {}
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    const requests = new Map();
    const totals = {};
    cdp.on("Network.responseReceived", (e) => requests.set(e.requestId, kind(e.response.url, e.type)));
    // Three.js arrives as a chunk with a hashed name: scripts are told apart by their content.
    const pending = new Set();
    cdp.on("Network.loadingFinished", (e) => {
      const k = requests.get(e.requestId) ?? "other";
      const add = (key) => (totals[key] = (totals[key] ?? 0) + e.encodedDataLength);
      if (k !== "js") return add(k);
      const p = cdp
        .send("Network.getResponseBody", { requestId: e.requestId })
        .then((r) => add(/WebGLRenderer|ShaderMaterial/.test(r.body) ? "field" : "js"), () => add("js"))
        .finally(() => pending.delete(p));
      pending.add(p);
    });
    const snapshot = async () => {
      await Promise.all(pending);
      return { ...totals };
    };
    // ?field=force: the field loads as on a capable device (headless Chromium renders WebGL in software).
    await page.goto(`${base}${path}?field=force`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    const first = await snapshot();
    // Scroll to the end a screen at a time, so every lazy image near the viewport loads.
    for (let i = 0; i < 200; i++) {
      const done = await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * 0.8);
        return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      });
      await page.waitForTimeout(120);
      if (done) break;
    }
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    const all = await snapshot();
    const row = (label, t) => {
      const pageBytes = Object.entries(t).filter(([k]) => k !== "field").reduce((s, [, v]) => s + v, 0);
      const parts = ["html", "js", "css", "fonts", "images", "other"].map((k) => `${k} ${kb(t[k] ?? 0)}`).join(" · ");
      console.log(`  ${label.padEnd(12)} page ${kb(pageBytes).padStart(7)}  (${parts})   + field ${kb(t.field ?? 0)}`);
    };
    console.log(device.name);
    row("first view", first);
    row("full scroll", all);
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
