// Page choreography (phase 5), against a build with the examples (SITE_MODE=basecamp):
//   arrival   deck → case study: focus on the H1, the arrival's parts timed from the commit
//             (type and meta lines at 260 ms, the summary from 380 ms), the H1's commit glint;
//             the trailhead band's mini card morphing into the next case study; browser back as a
//             180 ms traversal; Basecamp from the HUD (H1 focused, lead and legend from 420 ms);
//             still mode: no view transition, focus still on the H1.
//   reading   the case study while it is read: the HUD's "WAYPOINT n / N" readout, the trail's
//             scroll-linked fill and current waypoint, the altimeter bar on a phone (shown from
//             the first waypoint, its sheet: focus inside, Esc, focus back, a jump focuses the
//             waypoint's heading); the career climb in full, calm and still; no endless loop on
//             the home page but the field's.
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
        sessionStorage.setItem("summit:intro-played", "1");
        sessionStorage.setItem("summit:deck-dealt", "1");
        if (calm) localStorage.setItem("summit:calm-map", "1");
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
    check("type and meta lines settle from 260 ms", t.arrival?.settle.includes(260), JSON.stringify(t.arrival));
    check("the summary unfolds from 380 ms", t.arrival?.unfold.includes(380), JSON.stringify(t.arrival));
    check("the H1 glints once it has arrived", t.glints.includes("H1"), JSON.stringify(t.glints));
    const f = await focusInfo(page);
    check("focus on the new page's H1", f.tag === "h1" && f.tabindex === "-1", JSON.stringify(f));

    // Case study → next: the trailhead band's mini card morphs into the next header.
    await page.locator('nav[aria-label="Next expedition"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const next = await page.locator('nav[aria-label="Next expedition"] > div > a').getAttribute("href");
    const slug = next.split("/").filter(Boolean).at(-1);
    await page.evaluate(() => (window.__glints = []));
    await page.locator('nav[aria-label="Next expedition"] > div > a').click();
    await landed(page, basePath, `/work/${slug}/`);
    await page.waitForTimeout(1500);
    const n = await page.evaluate(() => ({ vt: window.__vt.at(-1), glints: window.__glints, n: window.__vt.length }));
    check("case study → next: the mini card's artwork and name morph into the header", n.vt?.groups.includes(`art-${slug}`) && n.vt?.groups.includes(`title-${slug}`), JSON.stringify(n.vt));
    check("the commit glint plays on the destination H1", n.glints.includes("H1"), JSON.stringify(n.glints));
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

  // Basecamp from the HUD: the label morphs into the H1, which takes focus.
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
    check("Basecamp: the HUD label morphs into the H1", r.vt?.groups.includes("basecamp-title"), JSON.stringify(r.vt?.groups));
    check("Basecamp: lead and legend from 420 ms", r.arrival?.includes(420), JSON.stringify(r.arrival));
    const f = await focusInfo(page);
    check("Basecamp: focus on the H1 (not lost with the HUD link)", f.tag === "h1", JSON.stringify(f));
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
  console.log("\nreading: the case study as it is read, the career climb, loops");
  if (!hasExamples(root)) return console.log("  skipped: build with SITE_MODE=basecamp");

  // Desktop: the HUD readout and the trail.
  {
    const { context, page, errors } = await newPage(browser);
    await page.goto(`${base}/work/gratweg/`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    const at = async (i) => {
      await page.evaluate((i) => document.querySelectorAll("section[data-waypoint]")[i].scrollIntoView({ block: "start" }), i);
      await page.waitForTimeout(700);
      return page.evaluate(() => ({
        readout: document.querySelector("header [data-terrain-readout] .visually-hidden")?.textContent ?? "",
        current: document.querySelector('nav a[aria-current="true"]')?.getAttribute("href"),
        reading: Number(getComputedStyle(document.querySelector("nav ol[style]")).getPropertyValue("--reading")),
      }));
    };
    const one = await at(0);
    const three = await at(2);
    check("HUD readout: WAYPOINT 1 / N and an altitude", /^WAYPOINT 1 \/ \d · ALT [\d’]+ M$/.test(one.readout), one.readout);
    const alt = (s) => Number(s.match(/ALT ([\d’]+)/)?.[1].replace(/’/g, ""));
    check("the altitude climbs with the waypoints", /^WAYPOINT 3 \//.test(three.readout) && alt(three.readout) > alt(one.readout), `${one.readout} → ${three.readout}`);
    check("the trail marks the current waypoint", one.current?.startsWith("#") && three.current !== one.current, `${one.current} → ${three.current}`);
    check("the trail fills with the scroll", three.reading > one.reading && three.reading > 0, `${one.reading} → ${three.reading}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const top = await page.evaluate(() => document.querySelector("header [data-terrain-readout] .visually-hidden")?.textContent ?? "");
    check("above the waypoints the readout is the terrain's again", !/^WAYPOINT/.test(top), top);
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }

  // Phone: the altimeter bar and its jump sheet.
  {
    const { context, page, errors } = await newPage(browser, { viewport: { width: 390, height: 844 }, mobile: true });
    await page.goto(`${base}/work/gratweg/`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    const shown = () => page.evaluate(() => !!document.querySelector("nav[data-shown]")?.getClientRects().length);
    check("altimeter bar: hidden above the first waypoint", !(await shown()));
    await page.evaluate(() => document.querySelectorAll("section[data-waypoint]")[1].scrollIntoView({ block: "start" }));
    await page.waitForTimeout(800);
    const label = await page.evaluate(() => document.querySelector("nav[data-shown] button .visually-hidden")?.textContent);
    check("altimeter bar: shown, with the current waypoint", (await shown()) && !!label, label);
    await page.locator("nav[data-shown] button").tap();
    await page.waitForTimeout(500);
    const open = await page.evaluate(() => ({ open: !!document.querySelector("dialog[open]"), inside: !!document.activeElement?.closest("dialog[open]") }));
    check("the jump sheet opens with focus inside", open.open && open.inside, JSON.stringify(open));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const closed = await page.evaluate(() => ({ open: !!document.querySelector("dialog[open]"), back: !!document.activeElement?.closest("nav[data-shown]") }));
    check("Esc closes it and focus returns to the bar", !closed.open && closed.back, JSON.stringify(closed));
    await page.locator("nav[data-shown] button").tap();
    await page.waitForTimeout(400);
    const target = await page.locator("dialog[open] a").nth(3).getAttribute("href");
    await page.locator("dialog[open] a").nth(3).tap();
    await page.waitForTimeout(900);
    const jumped = await page.evaluate(() => ({ focus: document.activeElement?.id, hash: location.hash }));
    check("a jump lands on the waypoint and focuses its heading", jumped.focus === `${target.slice(1)}-heading`, JSON.stringify(jumped));
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }

  // The career climb: full follows the scroll, calm draws on a timer, still shows it whole.
  for (const mode of ["full", "calm", "still"]) {
    const { context, page } = await newPage(browser, { calm: mode === "calm", reduced: mode === "still" });
    await page.goto(`${base}/about/`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    const state = () =>
      page.evaluate(() => {
        const s = document.querySelector("section[aria-labelledby=ascent-heading]");
        return { live: s.dataset.live ?? null, p: Number(getComputedStyle(s).getPropertyValue("--p")), reached: s.querySelectorAll("li[data-reached]").length };
      });
    const early = await state();
    await page.locator("#ascent-heading").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.6));
    await page.waitForTimeout(mode === "calm" ? 2200 : 700);
    const later = await state();
    if (mode === "full") check("climb (full): follows the scroll", ["timeline", "scroll"].includes(later.live) && early.p < 0.05 && later.p > 0.1 && later.p < 1, JSON.stringify({ early, later }));
    if (mode === "calm") check("climb (calm): waits, then draws once on a timer", early.live === "wait" && early.p === 0 && later.live === "timer" && later.p === 1, JSON.stringify({ early, later }));
    if (mode === "still") check("climb (still): shown complete", later.live === null && later.p === 1 && later.reached >= 4, JSON.stringify(later));
    await context.close();
  }

  // WCAG 2.2.2: nothing loops on the home page but the field (full, desktop).
  {
    const { context, page } = await newPage(browser);
    await page.goto(`${base}/?field=force`, { waitUntil: "load" });
    await page.waitForTimeout(3000);
    const loops = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations === Infinity)
        .map((a) => `${a.animationName ?? "?"} on ${a.effect?.target?.className?.toString?.().slice(0, 40)}`),
    );
    check("home: no endless CSS loop (the scroll cue draws once)", loops.every((l) => /poster|field|backdrop/i.test(l)), JSON.stringify(loops));
    await context.close();
  }
}

// Accessibility of the motion (phase 7): forced colours, screen-reader names, the haptics map.
export async function access({ browser, base, root, check }) {
  console.log("\naccess: forced colours, accessible names, haptics");
  if (!hasExamples(root)) return console.log("  skipped: build with SITE_MODE=basecamp");

  // Forced colours: no field, foil, glare or glint; the focus ring stays.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, forcedColors: "active" });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    const r = await page.evaluate(() => {
      const shown = (sel) => [...document.querySelectorAll(sel)].filter((el) => getComputedStyle(el).display !== "none").length;
      return { backdrop: shown("[data-field]"), glints: shown("[data-glint]"), foil: shown("article [class*=foil], article [class*=glare]") };
    });
    check("forced colours: no field, glint, foil or glare", r.backdrop === 0 && r.glints === 0 && r.foil === 0, JSON.stringify(r));
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
    // The readout is plain text, the toast a status.
    const readout = await page.evaluate(() => document.querySelector("[data-terrain-readout] .visually-hidden")?.textContent ?? "");
    check("the readout reads as plain text", /^[A-Z].* · ALT [\d’]+ M$|^WAYPOINT \d/.test(readout), readout);
    await context.close();
  }

  // The haptics map: what each action asks navigator.vibrate for (Android only in real life).
  {
    // Haptics exist on Android only (motion-mode.ts): an Android phone's user agent.
    const userAgent = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent });
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("summit:intro-played", "1");
        sessionStorage.setItem("summit:deck-dealt", "1");
      } catch {}
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
    const idx = page.getByRole("button", { name: "Index", exact: true });
    await idx.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await buzz();
    await idx.tap();
    await page.waitForTimeout(300);
    check("haptics: a button ticks 6 ms", (await buzz()).includes("6"));
    await page.getByRole("button", { name: "Cards", exact: true }).tap();
    await page.waitForTimeout(600);
    await buzz();
    const card = page.locator("article[data-slug] a").first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await buzz();
    await card.tap();
    await page.waitForTimeout(1500);
    check("haptics: opening a card ticks 8 ms", (await buzz()).includes("8"));
    await page.locator('nav[aria-label="Next expedition"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await buzz();
    await page.locator('nav[aria-label="Next expedition"] > div > a').tap();
    await page.waitForTimeout(1500);
    check("haptics: Next expedition commits with 10 ms", (await buzz()).includes("10"));
    await context.close();
  }
}
