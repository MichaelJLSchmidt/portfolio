// Page choreography (phase 5), against a build with the examples (SITE_MODE=basecamp):
//   arrival   where focus goes after a page change (About's H1, the cards for Case studies, a
//             case study's H1), in Full and Off; the timing is the transitions scenario's.
//   reading   the career line drawn once in Full and Calm, drawn in Off; no endless loop on any
//             page but the field's.
import { existsSync } from "node:fs";
import { join } from "node:path";

const hasExamples = (root) => existsSync(join(root, "out/work/seilschaft/index.html"));

async function newPage(browser, { viewport = { width: 1440, height: 900 }, mobile = false, calm = false, reduced = false } = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: reduced ? "reduce" : "no-preference",
    ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
  });
  await context.addInitScript(
    ({ calm }) => {
      try {
        if (calm) localStorage.setItem("summit:motion", "calm");
      } catch {}
    },
    { calm },
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return { context, page, errors };
}

/** Waits for the route, then for every view transition and entrance to finish. */
async function landed(page, basePath, path) {
  await page.waitForURL((url) => url.pathname === `${basePath}${path}`, { timeout: 15000 });
  await page
    .waitForFunction(
      () =>
        !document.getAnimations().some((a) => a.effect?.pseudoElement?.startsWith("::view-transition")) &&
        !document.getAnimations().some((a) => a.playState === "running" && a.timeline === document.timeline && a.effect?.getTiming().iterations !== Infinity && !a.effect?.target?.closest?.("[data-field], header")),
      null,
      { timeout: 15000, polling: 100 },
    )
    .catch(() => {});
}

export async function arrival({ browser, basePath, base, root, check }) {
  console.log("\narrival: where focus goes after a page change");
  if (!hasExamples(root)) return console.log("  skipped: build with SITE_MODE=basecamp");
  for (const mode of ["full", "still"]) {
    const { context, page, errors } = await newPage(browser, { reduced: mode === "still" });
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.waitForTimeout(800);
    // The header's About: focus on About's H1, announced (tabindex -1, no ring).
    await page.locator('header a[href$="/about/"]').click();
    await landed(page, basePath, "/about/");
    const about = await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent.trim().slice(0, 20), ring: getComputedStyle(document.activeElement).outlineStyle }));
    check(`${mode}: About's H1 has focus, no ring`, about.tag === "H1" && /About/.test(about.text) && about.ring === "none", JSON.stringify(about));
    // The header's Case studies: home at its cards, focus on the section it names.
    await page.locator('header a[href$="/#case-studies"]').click();
    await landed(page, basePath, "/");
    const home = await page.evaluate(() => ({ id: document.activeElement?.id, top: Math.round(document.getElementById("case-studies").getBoundingClientRect().top) }));
    check(`${mode}: Case studies lands on the cards, focus there`, home.id === "case-studies" && home.top >= 0 && home.top < 200, JSON.stringify(home));
    // A card: the case study's H1.
    await page.locator("#case-studies article a").first().click();
    await landed(page, basePath, "/work/seilschaft/");
    const cs = await page.evaluate(() => document.activeElement?.closest("h1")?.textContent.replace(/\s+/g, " ").trim() ?? document.activeElement?.tagName);
    check(`${mode}: a card opens its case study with focus on the H1`, /Seilschaft/.test(cs ?? ""), cs);
    check(`${mode}: no page errors`, errors.length === 0, errors.join("; "));
    await context.close();
  }
}

export async function reading({ browser, base, root, check }) {
  console.log("\nreading: the career line, loops");
  if (!hasExamples(root)) return console.log("  skipped: build with SITE_MODE=basecamp");

  // The career profile: one line, drawn once over --dur-draw as it comes into view (Full and
  // Calm), drawn at once in Off. Never scroll-scrubbed; the roles are text and never move.
  for (const mode of ["full", "calm", "still"]) {
    const { context, page } = await newPage(browser, { calm: mode === "calm", reduced: mode === "still" });
    await page.goto(`${base}/about/`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    const state = () =>
      page.evaluate(() => {
        const figure = document.querySelector("section[aria-labelledby=career-heading] figure");
        const svg = [...figure.querySelectorAll("svg")].find((g) => g.getBoundingClientRect().width > 0);
        const anims = svg.getAnimations();
        return {
          reveal: figure.dataset.revealState ?? null,
          clip: getComputedStyle(svg).clipPath,
          scrollDriven: anims.some((a) => a.timeline && !(a.timeline instanceof DocumentTimeline)),
          running: anims.filter((a) => a.playState === "running").length,
          camps: figure.querySelectorAll("ol > li").length,
        };
      });
    const early = await state();
    await page.locator("#career-heading").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.35));
    await page.waitForTimeout(1800);
    const later = await state();
    if (mode === "still") check("career (Off): drawn, nothing moves", !later.scrollDriven && /none/.test(later.clip) && later.running === 0 && later.camps === 4, JSON.stringify(later));
    else
      check(
        `career (${mode === "full" ? "Full" : "Calm"}): waits, then draws once, not with the scroll`,
        early.reveal === "wait" && later.reveal === "in" && !later.scrollDriven && later.running === 0 && /none|inset\(0(px)?\)/.test(later.clip),
        JSON.stringify({ early, later }),
      );
    await context.close();
  }

  // WCAG 2.2.2: nothing loops on any page but the field (Full, desktop).
  for (const path of ["/", "/about/", "/work/test-project/"]) {
    const { context, page } = await newPage(browser);
    await page.goto(`${base}${path}?field=force`, { waitUntil: "load" });
    await page.waitForTimeout(3000);
    const loops = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations === Infinity)
        .map((a) => `${a.animationName ?? "?"} on ${a.effect?.target?.className?.toString?.().slice(0, 40)}`),
    );
    check(`${path}: no endless CSS loop`, loops.length === 0, JSON.stringify(loops));
    await context.close();
  }
}

// Accessibility of the motion (phase 7): forced colours, screen-reader names, the haptics map.
export async function access({ browser, base, root, check }) {
  console.log("\naccess: forced colours, accessible names, haptics");
  if (!hasExamples(root)) return console.log("  skipped: build with SITE_MODE=basecamp");

  // Forced colours: no field; the focus ring stays.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, forcedColors: "active" });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    const r = await page.evaluate(() => {
      const shown = (sel) => [...document.querySelectorAll(sel)].filter((el) => getComputedStyle(el).display !== "none").length;
      return { backdrop: shown("[data-field]") };
    });
    check("forced colours: no field", r.backdrop === 0, JSON.stringify(r));
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    check("forced colours: the focus ring is drawn", ring.style !== "none" && parseFloat(ring.width) >= 2, JSON.stringify(ring));
    await context.close();
  }

  // Every heading is read once (split letters are aria-hidden, a hidden copy carries the name).
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    for (const path of ["/", "/about/", "/work/gratweg/"]) {
      await page.goto(`${base}${path}`, { waitUntil: "load" });
      await page.waitForTimeout(800);
      const tree = await page.locator("main").ariaSnapshot();
      const headings = [...tree.matchAll(/heading "([^"]+)"/g)].map((m) => m[1]);
      // A name read twice shows up as its text repeated ("SeilschaftSeilschaft", "Map legend Map legend").
      const doubled = headings.filter((h) => {
        const t = h.replace(/\s+/g, " ").trim();
        const half = t.length / 2;
        return t.length > 3 && Number.isInteger(half) && t.slice(0, half).trim() === t.slice(half).trim();
      });
      check(`${path}: every heading's name read once`, headings.length > 0 && doubled.length === 0, doubled.slice(0, 3).join(" | ") || `${headings.length} headings`);
    }
    await context.close();
  }

  // Haptics: 8 ms on primary presses where navigator.vibrate exists (Android here), never in Off,
  // never on scroll or reveals.
  {
    const userAgent = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await context.addInitScript(() => {
      window.__buzz = [];
      Object.defineProperty(navigator, "vibrate", { configurable: true, value: (p) => (window.__buzz.push(Array.isArray(p) ? p.join(",") : String(p)), true) });
    });
    const page = await context.newPage();
    const buzz = () => page.evaluate(() => window.__buzz.splice(0));
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(600);
    check("haptics: nothing on scroll or reveals", (await buzz()).length === 0);
    const copy = page.locator("#contact").getByRole("button", { name: "Copy address" });
    await copy.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await buzz();
    await copy.tap();
    await page.waitForTimeout(600);
    check("haptics: Copy address (a primary press) ticks 8 ms", (await buzz()).includes("8"));
    // Off: the Motion control's last option; then nothing buzzes.
    await page.locator("#contact fieldset label").filter({ hasText: "Off" }).tap();
    await page.waitForTimeout(400);
    await buzz();
    await page.locator("#contact").getByRole("button", { name: /Copy address|Copied/ }).tap();
    await page.waitForTimeout(600);
    check("haptics: none in Off", (await buzz()).length === 0);
    await context.close();
  }
}
