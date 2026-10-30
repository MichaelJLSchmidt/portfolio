// Short review videos of the motion system, recorded in Chromium against the static export in ./out
// (a build with the motion lab: SITE_MODE=basecamp or a preview):
//
//   lab.webm                 the motion lab: the three columns settle, then links, buttons and
//                            glints are tried in the full column and the frames scroll to the reveals
//   round-trip-<mode>.webm   in full, calm and still: the deck, a card into its case study, the Next
//                            expedition link (hover, keyboard focus, commit) and back to the deck
//   terrain-card-<mode>.webm, terrain-basecamp-<mode>.webm
//                            the terrain conductor (docs/terrain.md): home → a card → home and
//                            home → Basecamp (Bern) → home, the link hovered first (pre-warm)
//   home.webm                the home page from the hero to the contact band, at reading pace
//   basecamp-nav.webm        the HUD's Basecamp label morphing into the Basecamp H1, a look down the
//                            page, and back (browser back, then the HUD again)
//   case-study-loop.webm     Seilschaft → Gratweg → Test Project → Seilschaft by the Next links
//
//   npm run record:motion                       into ./motion-recordings (git-ignored)
//   npm run record:motion -- --out <folder>
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
const outArg = process.argv.indexOf("--out");
const outDir = resolve(root, outArg > -1 ? process.argv[outArg + 1] : "motion-recordings");
let playwright;
try {
  playwright = createRequire(import.meta.url)("playwright");
} catch {
  console.error("Playwright is not installed (npm i -D playwright && npx playwright install chromium).");
  process.exit(2);
}
if (!existsSync(join(root, "out/lab/index.html"))) {
  console.error("No motion lab in ./out: build with SITE_MODE=basecamp (or NEXT_PUBLIC_PREVIEW=1) first.");
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

const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const size = { width: 1280, height: 800 };

async function record(name, options, run) {
  const context = await browser.newContext({ viewport: size, recordVideo: { dir: outDir, size }, ...options });
  const page = await context.newPage();
  try {
    await run(page, context);
  } finally {
    const video = page.video();
    await context.close();
    if (video) renameSync(await video.path(), join(outDir, `${name}.webm`));
    console.log(`  ${name}.webm`);
  }
}

const pause = (page, ms) => page.waitForTimeout(ms);

try {
  console.log(`Recording into ${outDir}`);
  await record("lab", {}, async (page) => {
    // The lab signals when its three frames have hydrated (networkidle is unreliable there).
    await page.goto(`${base}/lab/`, { waitUntil: "load" });
    await page.waitForSelector("html[data-lab-ready]", { state: "attached", timeout: 30000 });
    await pause(page, 2500);
    const full = page.frameLocator('iframe[data-lab-column="full"]');
    await full.locator('[data-primitive="settle"] button').first().click();
    await pause(page, 1200);
    await full.locator('[data-primitive="glint"] button').first().click();
    await pause(page, 1200);
    await full.locator('[data-primitive="link"]').scrollIntoViewIfNeeded();
    await pause(page, 600);
    for (const link of await full.locator('a[data-lab-state="rest"]').all()) {
      await link.hover();
      await pause(page, 500);
    }
    await page.mouse.move(5, 5);
    await full.locator('[data-primitive="button"] button').first().hover();
    await pause(page, 400);
    await page.mouse.down();
    await pause(page, 300);
    await page.mouse.up();
    await pause(page, 600);
    await full.locator('[data-primitive="reveal"]').scrollIntoViewIfNeeded();
    await pause(page, 2500);
  });

  for (const mode of ["full", "calm", "still"]) {
    const options = { reducedMotion: mode === "still" ? "reduce" : "no-preference" };
    await record(`round-trip-${mode}`, options, async (page, context) => {
      await context.addInitScript((calm) => {
        try {
          
          if (calm) localStorage.setItem("summit:calm-map", "1");
        } catch {}
      }, mode === "calm");
      await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
      await pause(page, 2500);
      await page.mouse.move(640, 300, { steps: 10 });
      await page.locator("#deck-heading").scrollIntoViewIfNeeded();
      await pause(page, 1200);
      await page.locator('article[data-slug="test-project"] a').first().click();
      await pause(page, 3000);
      const next = page.locator('a[data-variant="display"]').first();
      await next.scrollIntoViewIfNeeded();
      await pause(page, 800);
      await next.hover();
      await pause(page, 900);
      await page.mouse.move(5, 5);
      await pause(page, 600);
      await next.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await pause(page, 900);
      await page.keyboard.press("Enter");
      await pause(page, 2500);
      await page.goBack();
      await pause(page, 1500);
      await page.goBack();
      await pause(page, 3000);
    });
  }

  for (const mode of ["full", "calm", "still"]) {
    const options = { reducedMotion: mode === "still" ? "reduce" : "no-preference" };
    const links = {
      card: { selector: 'article[data-slug="seilschaft"] a', path: "/work/seilschaft/", terrain: "eiger" },
      basecamp: { selector: 'header a[href$="/about/"]', path: "/about/", terrain: "bern" },
    };
    // SwiftShader and the encoder slow everything down: wait for each arrival (the route, then the
    // field landing on its terrain) rather than for fixed times, then hold the frame a moment.
    const arrive = async (page, path, terrain) => {
      await page.waitForURL((url) => url.pathname.endsWith(path), { timeout: 30000 }).catch(() => {});
      if (mode !== "still") await page.waitForSelector(`[data-field="on"][data-terrain="${terrain}"]`, { timeout: 30000 }).catch(() => {});
      await pause(page, 1500);
    };
    for (const [name, to] of Object.entries(links)) {
      await record(`terrain-${name}-${mode}`, options, async (page, context) => {
        await context.addInitScript((calm) => {
          try {
            
            if (calm) localStorage.setItem("summit:calm-map", "1");
          } catch {}
        }, mode === "calm");
        await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
        await arrive(page, "/", "region");
        const link = page.locator(to.selector).first();
        await link.scrollIntoViewIfNeeded();
        await link.hover();
        await pause(page, 1200);
        await link.click();
        await arrive(page, to.path, to.terrain);
        await page.goBack();
        await arrive(page, "/", "region");
        // The encoder lags behind under SwiftShader: let it catch up before the video closes.
        await pause(page, 2500);
      });
    }
  }
  // A visit as a reader takes it: open the site, skim the home page, go to Basecamp, follow the work.
  const visit = async (context) =>
    context.addInitScript(() => {
      try {
        
      } catch {}
    });
  const scrollThrough = async (page, steps, dy, wait) => {
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, dy);
      await pause(page, wait);
    }
  };
  await record("home", {}, async (page, context) => {
    await visit(context);
    await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
    await pause(page, 2500);
    await scrollThrough(page, 28, 380, 650);
    await pause(page, 1500);
  });
  await record("basecamp-nav", {}, async (page, context) => {
    await visit(context);
    await page.goto(`${base}/?field=force`, { waitUntil: "networkidle" });
    await pause(page, 2000);
    const hud = page.locator('header a[href$="/about/"]').first();
    await hud.hover();
    await pause(page, 700);
    await hud.click();
    await pause(page, 3000);
    await scrollThrough(page, 8, 420, 600);
    await page.goBack();
    await pause(page, 2500);
    await page.goto(`${base}/work/seilschaft/?field=force`, { waitUntil: "networkidle" });
    await pause(page, 1500);
    await hud.click();
    await pause(page, 3000);
    await page.goBack();
    await pause(page, 2500);
  });
  await record("case-study-loop", {}, async (page, context) => {
    await visit(context);
    await page.goto(`${base}/work/seilschaft/?field=force`, { waitUntil: "networkidle" });
    await pause(page, 2500);
    for (let i = 0; i < 3; i++) {
      await scrollThrough(page, 4, 600, 450);
      const next = page.locator('nav[aria-label="Next expedition"] a[data-variant="display"]');
      await next.scrollIntoViewIfNeeded();
      await pause(page, 700);
      await next.hover();
      await pause(page, 700);
      await next.click();
      await pause(page, 3000);
    }
  });
} finally {
  await browser.close();
  server.kill();
}
