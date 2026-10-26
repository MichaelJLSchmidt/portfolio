// Body text against what is actually behind it, measured on rendered screenshots in Chromium:
// every running-text element (.body-copy, and .knockout blocks such as the footer) on the home
// page, a case study and Basecamp, at a desktop and a phone size, over the moving contour field
// at its worst (the headlamp lit right on the text) and over the static poster (reduced motion,
// no WebGL).
//
// For each element, three screenshots of its box: background (text fill transparent, halos
// kept), text, background again. Glyph pixels are where the text shot is much brighter than
// both backgrounds; measured are the background pixels under and next to them:
//   - contrast: the text colour against the brightest of those pixels;
//   - line strength: how far that pixel rises above the element's clean background, as a share
//     of a glacier-bright line (a fixed yardstick: lit lines used to turn glacier; they now stay
//     neutral and fainter).
// Pass: contrast ≥ 7:1 everywhere, line strength ≤ 15% over the field.
//
//   npm run check:legibility           (a build in out/, Playwright as for npm run test:e2e)
//   npm run check:legibility -- --list (print every element, not only the worst per page)
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { color } from "../src/styles/tokens.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.env.LEGIBILITY_OUT ? resolve(process.env.LEGIBILITY_OUT) : join(root, "out");
const listAll = process.argv.includes("--list");
const MIN_CONTRAST = 7;
const MAX_LINE = 0.15;

let playwright;
try {
  playwright = createRequire(import.meta.url)("playwright");
} catch {
  console.error("Playwright is not installed (npm i -D playwright && npx playwright install chromium).");
  process.exit(2);
}
if (!existsSync(join(out, "index.html"))) {
  console.error(`No static export in ${out}: run npm run build first.`);
  process.exit(2);
}

// --- colour maths ------------------------------------------------------------------------------
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (r, g, b) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const glacierL = lum(...hex(color.glacier));

// --- static server ------------------------------------------------------------------------------
const basePath = readFileSync(join(out, "index.html"), "utf8").match(/(?:src|href)="([^"]*?)\/_next\//)?.[1] ?? "";
const port = await new Promise((done) => {
  const probe = createServer().listen(0, () => {
    const { port } = probe.address();
    probe.close(() => done(port));
  });
});
const server = spawn(process.execPath, [join(root, "scripts/serve-out.mjs"), "--port", String(port), "--dir", out], {
  cwd: root,
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: basePath },
  stdio: "ignore",
});
const base = `http://localhost:${port}${basePath}`;
for (let i = 0; i < 50; i++) {
  if (await fetch(`${base}/`).then((r) => r.ok, () => false)) break;
  await new Promise((r) => setTimeout(r, 100));
}

// Running text and other knocked-out text blocks (the footer). Builds from before the shared
// class names: the same elements by their modules.
const BODY = ".body-copy, .knockout";
const LEGACY = [
  "p[class*='_lede']",
  "p[class*='_intro']",
  "li > p[class*='_summary']",
  "section[class*='_section'] > p",
  "p[class*='_statement']",
  "[class*='_sectionHead'] > p",
  "[class*='_marker'] > p:not([class*='_metric'])",
  "p[class*='_evidence']",
  "p[class*='_note']",
  "[class*='_offTrailBody'] > p:not([class*='_flavor'])",
  "section[class*='_contact'] > p",
  "footer p",
].join(",");

const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

async function decode(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Measures one element: see the header comment. */
function measure(bg1, text, bg2, textL) {
  const { width: w, height: h } = text;
  const n = w * h;
  const bgL = new Float32Array(n);
  const glyph = new Uint8Array(n);
  const px = (img, i) => lum(img.data[i * 3], img.data[i * 3 + 1], img.data[i * 3 + 2]);
  for (let i = 0; i < n; i++) {
    bgL[i] = Math.max(px(bg1, i), px(bg2, i));
    if (px(text, i) - bgL[i] > 0.18) glyph[i] = 1;
  }
  // The element's clean background: a low percentile of its background pixels.
  const sorted = Float32Array.from(bgL).sort();
  const clean = sorted[Math.floor(n * 0.05)];
  let worst = 0;
  let strength = 0;
  let glyphs = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Under a glyph or one pixel next to it.
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) {
        for (let dx = -1; dx <= 1 && !near; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && glyph[yy * w + xx]) near = true;
        }
      }
      if (!near) continue;
      const i = y * w + x;
      glyphs++;
      worst = Math.max(worst, bgL[i]);
      strength = Math.max(strength, (bgL[i] - clean) / Math.max(1e-6, glacierL - clean));
    }
  }
  return glyphs ? { contrast: (textL + 0.05) / (worst + 0.05), strength: Math.max(0, strength) } : null;
}

const pages = [
  { path: "/", name: "home" },
  { path: "/work/kibon/", name: "case study" },
  { path: "/about/", name: "Basecamp" },
];
const viewports = [
  { name: "desktop 1440×900", viewport: { width: 1440, height: 900 }, mobile: false },
  { name: "phone 390×844", viewport: { width: 390, height: 844 }, mobile: true },
];
const modes = [
  { name: "field, headlamp on the text", reduced: false },
  { name: "poster", reduced: true },
];

// Narrow a run while iterating: LEGIBILITY_ONLY="Basecamp,desktop,field" (any of the words).
const only = (process.env.LEGIBILITY_ONLY ?? "").split(",").filter(Boolean);
const wanted = (name) => !only.length || only.some((w) => name.includes(w));
const pick = (list) => (list.some((x) => wanted(x.name)) ? list.filter((x) => wanted(x.name)) : list);

let failures = 0;
const rows = [];
for (const mode of pick(modes)) {
  for (const vp of pick(viewports)) {
    const context = await browser.newContext({
      viewport: vp.viewport,
      deviceScaleFactor: vp.mobile ? 2 : 1,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      reducedMotion: mode.reduced ? "reduce" : "no-preference",
    });
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("summit:intro-played", "1");
        sessionStorage.setItem("summit:deck-dealt", "1");
      } catch {}
    });
    const page = await context.newPage();
    const cdp = vp.mobile ? await context.newCDPSession(page) : null;
    for (const p of pick(pages)) {
      await page.goto(`${base}${p.path}${mode.reduced ? "" : "?field=force"}`, { waitUntil: "networkidle" });
      if (!mode.reduced) await page.waitForSelector('[data-field="on"]', { timeout: 20000 });
      await page.waitForTimeout(1500);
      // Content wider than a phone widens its layout viewport: the page pans sideways, and the
      // screenshots (taken by the visual viewport) no longer line up with the element boxes.
      const layoutWidth = await page.evaluate(() => window.innerWidth);
      if (layoutWidth !== vp.viewport.width) {
        failures++;
        console.log(`FAIL  page is ${layoutWidth} px wide at ${vp.viewport.width} px · ${mode.name} · ${vp.name} · ${p.name}`);
      }
      const count = await page.evaluate(
        ({ BODY, LEGACY }) => {
          const selector = document.querySelector(BODY) ? BODY : LEGACY;
          const els = [...document.querySelectorAll(selector)].filter((el) => el.getClientRects().length && el.textContent.trim());
          els.forEach((el, i) => el.setAttribute("data-legibility", String(i)));
          const style = document.createElement("style");
          style.textContent = `[data-legibility-bg], [data-legibility-bg] * { -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; }`;
          document.head.append(style);
          return els.length;
        },
        { BODY, LEGACY },
      );
      let worst = null;
      for (let i = 0; i < count; i++) {
        const info = await page.evaluate((i) => {
          const el = document.querySelector(`[data-legibility="${i}"]`);
          el.scrollIntoView({ block: "center" });
          // Darkest text colour among the element and its text-bearing descendants.
          const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
          let textL = 1;
          for (const node of [el, ...el.querySelectorAll("*")]) {
            if (![...node.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
            const [r2, g, b] = getComputedStyle(node).color.match(/[\d.]+/g).map(Number);
            textL = Math.min(textL, 0.2126 * lin(r2 / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255));
          }
          return { textL, label: el.textContent.trim().replace(/\s+/g, " ").slice(0, 44) };
        }, i);
        // The box is taken once the element has settled (an entrance or a plaque still rising
        // would shift it under the clip), and checked again after the shots.
        const boxOf = () =>
          page.evaluate((i) => {
            const r = document.querySelector(`[data-legibility="${i}"]`).getBoundingClientRect();
            return { x: r.left, y: r.top, w: r.width, h: r.height };
          }, i);
        const same = (a, b) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.w - b.w) < 1 && Math.abs(a.h - b.h) < 1;
        let shots = null;
        let clip = null;
        for (let attempt = 0; attempt < 4 && !shots; attempt++) {
          await page.waitForTimeout(400);
          const box = await boxOf();
          clip = {
            x: Math.max(0, Math.floor(box.x) - 2),
            y: Math.max(0, Math.floor(box.y) - 2),
            width: Math.min(vp.viewport.width, Math.ceil(box.x + box.w) + 2) - Math.max(0, Math.floor(box.x) - 2),
            height: Math.min(vp.viewport.height, Math.ceil(box.y + box.h) + 2) - Math.max(0, Math.floor(box.y) - 2),
          };
          if (clip.width < 4 || clip.height < 4) break;
          // The headlamp, right on the text: the pointer, or a finger held down on a phone.
          const cx = clip.x + clip.width / 2;
          const cy = clip.y + clip.height / 2;
          if (!mode.reduced) {
            if (cdp) await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy }] });
            else await page.mouse.move(cx, cy);
            await page.waitForTimeout(700);
          }
          const shot = (bg) =>
            page
              .evaluate(({ i, bg }) => document.querySelector(`[data-legibility="${i}"]`).toggleAttribute("data-legibility-bg", bg), { i, bg })
              .then(() => page.waitForTimeout(60))
              .then(() => page.screenshot({ clip }))
              .then(decode);
          const settled = same(box, await boxOf());
          const b1 = await shot(true);
          const t = await shot(false);
          const b2 = await shot(true);
          await shot(false);
          // Cancel, not end: a lifted finger would tap whatever link is under it.
          if (cdp && !mode.reduced) await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
          if (settled && same(box, await boxOf())) shots = { b1, t, b2 };
        }
        if (!shots) {
          if (clip && clip.width >= 4 && clip.height >= 4) console.warn(`  (skipped, never settled: ${info.label})`);
          continue;
        }
        const { b1, t, b2 } = shots;
        if (process.env.LEGIBILITY_DEBUG && info.label.includes(process.env.LEGIBILITY_DEBUG)) {
          for (const [name, img] of [["bg1", b1], ["text", t], ["bg2", b2]]) {
            await sharp(img.data, { raw: { width: img.width, height: img.height, channels: 3 } }).png().toFile(`legibility-${name}.png`);
          }
        }
        const m = measure(b1, t, b2, info.textL);
        if (!m) continue;
        const ok = m.contrast >= MIN_CONTRAST && (mode.reduced || m.strength <= MAX_LINE);
        if (!ok) failures++;
        const row = { mode: mode.name, vp: vp.name, page: p.name, label: info.label, ...m, ok };
        rows.push(row);
        if (listAll) print(row);
        if (!worst || m.contrast < worst.contrast) worst = row;
      }
      if (!listAll && worst) print(worst, " (worst on the page)");
    }
    await context.close();
  }
}

function print(r, suffix = "") {
  console.log(
    `${r.ok ? "pass" : "FAIL"}  ${r.contrast.toFixed(2).padStart(6)}:1  line ${(r.strength * 100).toFixed(0).padStart(3)}%  ${r.mode} · ${r.vp} · ${r.page}: "${r.label}"${suffix}`,
  );
}

const byMode = (name) => rows.filter((r) => r.mode === name);
for (const mode of modes) {
  const rs = byMode(mode.name);
  if (!rs.length) continue;
  const minC = Math.min(...rs.map((r) => r.contrast));
  const maxS = Math.max(...rs.map((r) => r.strength));
  console.log(`\n${mode.name}: ${rs.length} text blocks, lowest contrast ${minC.toFixed(2)}:1, strongest line under glyphs ${(maxS * 100).toFixed(0)}%`);
}
await browser.close();
server.kill();
if (failures) console.error(`\n${failures} text block(s) below ${MIN_CONTRAST}:1${" "}or with lines above ${MAX_LINE * 100}% under the glyphs.`);
process.exit(failures ? 1 : 0);
