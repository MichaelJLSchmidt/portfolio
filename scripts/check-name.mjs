// The name-swap test: the display name and the brand live in one place (src/content/site.ts, the
// name source), and nothing else writes, bakes, sizes or splits them. A copy of the project gets
// neutral generated names and brands of three lengths (8, 18 and 32 characters; 2, 4 and 10), is
// built for each, and then:
// - no file of its static export contains the real name or the real brand;
// - its home page carries the new ones (the hero, the title, the header, the footer wordmark);
// - at 320, 390, 768, 1440 and 2560 px nothing scrolls sideways and nothing is clipped: the hero
//   name, the header's brand and the footer wordmark (with its relief) stay inside the screen.
//
//   npm run check:name          (builds a copy in .name-swap/ three times; takes a while)
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
/** Neutral generated strings, not anyone's name. */
const SWAPS = [
  { name: "Name Xyq", brand: "XQ" },
  { name: "Name Xyqvo Wbrtkle", brand: "XQVW" },
  { name: "Name Xyqvo Wbrtkle Zuplanderqo J", brand: "XQVWBRTKLZ" },
];
for (const [i, n] of [8, 18, 32].entries()) if (SWAPS[i].name.length !== n || SWAPS[i].brand.length !== [2, 4, 10][i]) throw new Error(`swap ${i}: wrong length`);
const WIDTHS = [320, 390, 768, 1440, 2560];

let failed = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
};

const work = join(root, ".name-swap");
const SKIP = new Set(["node_modules", ".next", "out", ".git", ".netlify", "test-results", "tsconfig.tsbuildinfo", "package-lock.json", ".name-swap", "motion-recordings"]);
async function swap(SWAP) {
  console.log(`\nName swap: “${SWAP.name}” (${SWAP.name.length}), “${SWAP.brand}” (${SWAP.brand.length}), built in ${work}`);
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
      stdio: "ignore",
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

    // 2. Nothing overflows or is clipped, at every width.
    const server = spawn(process.execPath, [join(root, "scripts/serve-out.mjs"), "--dir", join(work, "out"), "--port", "3917"], { stdio: "ignore" });
    try {
      await new Promise((r) => setTimeout(r, 800));
      // Playwright is not a dependency (like the e2e runner, require finds it where it is installed).
      const { chromium } = createRequire(import.meta.url)("playwright");
      const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
      for (const width of WIDTHS) {
        const page = await browser.newPage({ viewport: { width, height: width < 600 ? 800 : 900 }, ...(width < 768 ? { isMobile: true, hasTouch: true } : {}) });
        await page.goto("http://localhost:3917/", { waitUntil: "networkidle" });
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForFunction(() => document.querySelector("footer [data-relief-root]")?.hasAttribute("data-relief"), null, { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(400);
        const r = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const inside = (el) => {
            if (!el) return false;
            const b = el.getBoundingClientRect();
            return b.left >= -0.5 && b.right <= vw + 0.5;
          };
          // Clipped: the text is wider than its own box (overflow hidden would cut it).
          const clipped = (el) => !!el && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible";
          const hero = document.getElementById("hero-name");
          const brand = document.querySelector("header a[aria-label]");
          const mark = document.querySelector("footer [data-relief-stack]");
          return {
            scroll: document.documentElement.scrollWidth,
            vw,
            hero: inside(hero) && !clipped(hero),
            brand: inside(brand) && !clipped(brand),
            mark: inside(mark) && !clipped(mark),
            relief: document.querySelector("footer [data-relief-root]")?.getAttribute("data-relief"),
            title: document.title,
            text: hero?.textContent ?? "",
          };
        });
        check(`${width} px: no sideways scroll; hero name, header brand and footer wordmark inside, not clipped`, r.scroll <= r.vw && r.hero && r.brand && r.mark, JSON.stringify({ scroll: r.scroll, hero: r.hero, brand: r.brand, mark: r.mark, relief: r.relief }));
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
}

for (const s of SWAPS) await swap(s);
console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
