// The name-swap test: the display name and the brand live in one place (src/content/site.ts, the
// name source), and nothing else writes, bakes or derives them. A copy of the project gets a
// different (and longer) name and brand, is built, and then:
// - no file of its static export contains the real name or the real brand;
// - its home page and About carry the new ones (the hero, the title, the HUD, the footer
//   wordmark's accessible name);
// - the longer name still fits the hero: no horizontal scroll at 360, 390 and 1440 px, the name
//   inside the screen.
//
//   npm run check:name          (builds a copy in .name-swap/; takes a few minutes)
//
// The copy sits in .name-swap/ inside the project (git-ignored) without its own lockfile, so it
// resolves this project's node_modules (Turbopack won't follow a link out of its root); the real
// project's files are never touched.
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import "./lib/ts-hooks.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { site } = await import("../src/content/site.ts");
const SWAP = { name: "Aurelia Quintana-Wexford", brand: "AQW" };

let failed = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
};

const work = join(root, ".name-swap");
const SKIP = new Set(["node_modules", ".next", "out", ".git", ".netlify", "test-results", "tsconfig.tsbuildinfo", "package-lock.json", ".name-swap", "motion-recordings"]);
console.log(`Name swap: building a copy in ${work}`);
try {
  rmSync(work, { recursive: true, force: true });
  // Entry by entry: a folder can't be copied into its own subfolder in one call.
  for (const entry of readdirSync(root).filter((e) => !SKIP.has(e))) cpSync(join(root, entry), join(work, entry), { recursive: true });

  const sitePath = join(work, "src/content/site.ts");
  const source = readFileSync(sitePath, "utf8");
  const swapped = source
    .replace(/^const name = ".*";$/m, `const name = ${JSON.stringify(SWAP.name)};`)
    .replace(/^const brand = ".*";$/m, `const brand = ${JSON.stringify(SWAP.brand)};`);
  if (swapped === source) throw new Error("site.ts: no `const name` / `const brand` line to swap");
  writeFileSync(sitePath, swapped);

  const build = spawnSync(process.execPath, [join(work, "scripts/site/build.mjs")], {
    cwd: work,
    stdio: "inherit",
    env: { ...process.env, SITE_MODE: "basecamp", NEXT_PUBLIC_PREVIEW: "1" },
  });
  if (build.status !== 0) throw new Error(`the build failed (${build.status})`);

  // 1. Nothing in the export still says the real name or brand.
  const files = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
  const text = /\.(html|js|css|json|txt|svg|xml|webmanifest|map)$/;
  const hits = [];
  for (const file of files(join(work, "out")).filter((f) => text.test(f))) {
    const body = readFileSync(file, "utf8");
    for (const s of [site.name, site.brand]) if (body.includes(s)) hits.push(`${relative(join(work, "out"), file)}: “${s}”`);
  }
  check("no file of the export contains the real name or brand", hits.length === 0, hits.slice(0, 6).join(" | "));
  const home = readFileSync(join(work, "out/index.html"), "utf8");
  check("the home page carries the new name and brand", home.includes(SWAP.name) && home.includes(SWAP.brand));

  // 2. The longer name fits the hero.
  const server = spawn(process.execPath, [join(root, "scripts/serve-out.mjs"), "--dir", join(work, "out"), "--port", "3917"], { stdio: "ignore" });
  try {
    await new Promise((r) => setTimeout(r, 800));
    // Playwright is not a dependency (like the e2e runner, require finds it where it is installed).
    const { chromium } = createRequire(import.meta.url)("playwright");
    const browser = await chromium.launch();
    for (const width of [360, 390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: width < 600 ? 800 : 900 } });
      await page.goto("http://localhost:3917/", { waitUntil: "networkidle" });
      const r = await page.evaluate(() => {
        const h = document.getElementById("hero-name");
        const box = h?.getBoundingClientRect();
        return { scroll: document.documentElement.scrollWidth, width: innerWidth, title: document.title, text: h?.textContent ?? "", left: box?.left ?? -1, right: box?.right ?? Infinity };
      });
      check(`${width} px: no horizontal scroll, the name inside the screen`, r.scroll <= r.width && r.left >= 0 && r.right <= r.width + 0.5, JSON.stringify({ scroll: r.scroll, left: Math.round(r.left), right: Math.round(r.right) }));
      if (width === 1440) check("the title and the hero say the new name", r.title.includes(SWAP.name) && r.text.replace(/\s+/g, " ").includes(SWAP.name.split(" ")[0]), `${r.title} / ${r.text}`);
      await page.close();
    }
    await browser.close();
  } finally {
    server.kill();
  }
} catch (e) {
  check("name swap ran", false, e.message);
} finally {
  if (existsSync(work)) rmSync(work, { recursive: true, force: true });
}
console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
