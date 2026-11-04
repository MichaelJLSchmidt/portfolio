// Page choreography (phase 5), against a build with the examples (SITE_MODE=basecamp):
//   arrival   deck → case study: focus on the H1, the arrival's parts timed from the commit
//             (the summary from 380 ms), no glint on the H1 (titles arrive on their weight);
//             the trailhead band's mini card morphing into the next case study; browser back as a
//             180 ms traversal; About from the HUD (H1 focused, the facts from 420 ms);
//             still mode: no view transition, focus still on the H1.
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
      // View transitions: how many started, the pairs they drew, the root's timing.
      window.__vt = [];
      const start = Document.prototype.startViewTransition;
      if (start)
        Document.prototype.startViewTransition = function (...args) {
          const t = start.apply(this, args);
          const rec = { groups: [], root: null, vt: null };
          window.__vt.push(rec);
          t.ready
            .then(() => {
              rec.vt = document.documentElement.getAttribute("data-vt");
              for (const a of document.getAnimations()) {
                const pe = a.effect?.pseudoElement ?? "";
                const name = pe.match(/^::view-transition-group\((.+)\)$/)?.[1];
                if (name && name !== "root") rec.groups.push(name);
                if (pe === "::view-transition-old(root)") rec.root = Math.round(a.effect.getTiming().duration);
              }
            })
            .catch(() => {});
          return t;
        };
      // Glints that play, by the text they cross.
      window.__glints = [];
      document.addEventListener("DOMContentLoaded", () => {
        new MutationObserver((records) => {
          for (const r of records)
            if (r.target.getAttribute?.("data-glint") === "play") window.__glints.push(r.target.closest("h1, h2, h3, a, article")?.tagName ?? "?");
        }).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-glint"] });
      });
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

const focusInfo = (page) =>
  page.evaluate(() => {
    const a = document.activeElement;
    return { tag: a?.tagName.toLowerCase(), tabindex: a?.getAttribute("tabindex"), text: (a?.querySelector?.(".visually-hidden") ?? a)?.textContent?.trim().slice(0, 40) };
  });

export async function arrival({ browser, basePath, base, root, check }) {
  console.log("\narrival: route choreography and focus");
  if (!hasExamples(root)) return console.log("  skipped: build with SITE_MODE=basecamp");

  // Deck → case study.
  {
    const { context, page, errors } = await newPage(browser);
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.locator('article[data-slug="seilschaft"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    // The arrival's own timing, read as the new page commits.
    await page.evaluate(() => {
      window.__arrival = null;
      new MutationObserver(() => {
        const main = [...document.querySelectorAll("main[data-arrival]")].find((m) => m.getClientRects().length);
        if (!main || window.__arrival) return;
        const anims = document.getAnimations().filter((a) => main.contains(a.effect?.target ?? null));
        const delay = (re) => [...new Set(anims.filter((a) => re.test(a.animationName ?? "")).map((a) => Math.round(Number(a.effect.getTiming().delay))))];
        window.__arrival = { settle: delay(/st-settle/), unfold: delay(/reveal-unfold/) };
      }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ["data-arrival"] });
    });
    await page.locator('article[data-slug="seilschaft"] a').click();
    await landed(page, basePath, "/work/seilschaft/");
    await page.waitForTimeout(1500);
    const t = await page.evaluate(() => ({ vt: window.__vt.at(-1), arrival: window.__arrival, glints: window.__glints }));
    check("deck → case study: the artwork and the name travel", t.vt?.groups.includes("art-seilschaft") && t.vt?.groups.includes("title-seilschaft"), JSON.stringify(t.vt?.groups));
    check("the old page leaves over 160 ms", t.vt?.root === 160, String(t.vt?.root));
    // The summary arrives with the page only where it is on screen as the page lands.
    const summaryOnScreen = await page.evaluate(() => {
      const b = document.getElementById("summary-heading")?.closest("section")?.getBoundingClientRect();
      return !!b && b.top < innerHeight && b.bottom > 0;
    });
    check("the summary unfolds from 380 ms (when on screen)", !summaryOnScreen || t.arrival?.unfold.includes(380), JSON.stringify({ summaryOnScreen, arrival: t.arrival }));
    check("the H1 is a weight title and never glints", (await page.locator("h1[data-title]").count()) === 1 && !t.glints.includes("H1"), JSON.stringify(t.glints));
    const f = await focusInfo(page);
    check("focus on the new page's H1", f.tag === "h1" && f.tabindex === "-1", JSON.stringify(f));

    // Case study → next: the trailhead band's mini card morphs into the next header.
    const nextLink = page.locator('a[aria-describedby="next-project-label"]');
    await nextLink.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const next = await nextLink.getAttribute("href");
    const slug = next.split("/").filter(Boolean).at(-1);
    await page.evaluate(() => (window.__glints = []));
    await nextLink.click();
    await landed(page, basePath, `/work/${slug}/`);
    await page.waitForTimeout(1500);
    const n = await page.evaluate(() => ({ vt: window.__vt.at(-1), glints: window.__glints, n: window.__vt.length }));
    check("case study → next: the mini card's artwork and name morph into the header", n.vt?.groups.includes(`art-${slug}`) && n.vt?.groups.includes(`title-${slug}`), JSON.stringify(n.vt));
    check("no glint on the destination H1", !n.glints.includes("H1"), JSON.stringify(n.glints));
    check("focus on the next page's H1", (await focusInfo(page)).tag === "h1");
    const named = await page.evaluate(() => [...document.querySelectorAll("[data-commit-morph]")].filter((el) => el.style.viewTransitionName).length);
    check("the mini card is unnamed again afterwards", named === 0, String(named));

    // Browser back between two case studies: a traversal.
    const before = await page.evaluate(() => window.__vt.length);
    await page.goBack();
    // The traversal starts on the next task after popstate: wait for it to draw.
    await page.waitForFunction((n) => window.__vt.length > n && window.__vt.at(-1).root !== null, before, { timeout: 5000 }).catch(() => {});
    await landed(page, basePath, "/work/seilschaft/");
    const b = await page.evaluate(() => window.__vt.at(-1));
    const count = await page.evaluate(() => window.__vt.length);
    check("browser back: a traversal cross-fade of 180 ms", count > before && b?.vt === "traverse" && b?.root === 180, JSON.stringify(b));
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }

  // About from the HUD: the label morphs into the H1, which takes focus.
  {
    const { context, page, errors } = await newPage(browser);
    await page.goto(`${base}/work/seilschaft/`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      window.__arrival = null;
      new MutationObserver(() => {
        const main = [...document.querySelectorAll("main[data-arrival]")].find((m) => m.getClientRects().length);
        if (!main || window.__arrival) return;
        const anims = document.getAnimations().filter((a) => main.contains(a.effect?.target ?? null));
        window.__arrival = [...new Set(anims.filter((a) => /st-settle|reveal-unfold/.test(a.animationName ?? "")).map((a) => Math.round(Number(a.effect.getTiming().delay))))];
      }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ["data-arrival"] });
    });
    await page.locator(`header a[href="${basePath}/about/"]`).first().click();
    await landed(page, basePath, "/about/");
    const r = await page.evaluate(() => ({ vt: window.__vt.at(-1), arrival: window.__arrival }));
    check("About: the HUD label morphs into the H1", r.vt?.groups.includes("about-title"), JSON.stringify(r.vt?.groups));
    // The facts arrive with the page only where they are on screen as it lands.
    const factsOnScreen = await page.evaluate(() => {
      const sheet = document.querySelector("main .map-sheet");
      const b = sheet?.getBoundingClientRect();
      return !!b && b.top < innerHeight && b.bottom > 0;
    });
    check("About: the facts from 420 ms (when on screen)", !factsOnScreen || r.arrival?.includes(420), JSON.stringify({ factsOnScreen, arrival: r.arrival }));
    const f = await focusInfo(page);
    check("About: focus on the H1 (not lost with the HUD link)", f.tag === "h1", JSON.stringify(f));
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }

  // Still: no view transition at all, and focus still moves.
  {
    const { context, page } = await newPage(browser, { reduced: true });
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.locator('article[data-slug="seilschaft"]').scrollIntoViewIfNeeded();
    await page.locator('article[data-slug="seilschaft"] a').click();
    await landed(page, basePath, "/work/seilschaft/");
    const calls = await page.evaluate(() => window.__vt.length);
    check("still: no view transition", calls === 0, String(calls));
    check("still: focus on the H1", (await focusInfo(page)).tag === "h1");
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
