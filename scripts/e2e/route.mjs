// The red route (phase 7): `npm run test:e2e -- route`, against a build with the examples.
//
//   geometry  on the home page and a case study, desktop and phone: one path (a single subpath),
//             through every waypoint's anchor (within 2 px), never across a line of text outside
//             the drawings it passes behind; on phones it stays in the 16 px margin; above the
//             last station the case study's route is a blaze.
//   modes     full: the walked line rides a scroll timeline and follows a wheel scroll that Lenis
//             smooths, the marker shown; full without scroll timelines: the same, painted from the
//             scroll; calm: the walked line stops at waypoints, never between; still: the whole
//             route solid, no marker, no dashed base, nothing animated.
import { existsSync } from "node:fs";
import { join } from "node:path";

const STUDY = "/work/seilschaft/";

async function newPage(browser, { viewport = { width: 1440, height: 900 }, mobile = false, calm = false, reduced = false, noTimeline = false } = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: reduced ? "reduce" : "no-preference",
    ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
  });
  await context.addInitScript(
    ({ calm, noTimeline }) => {
      try {
        sessionStorage.setItem("summit:deck-dealt", "1");
        if (calm) localStorage.setItem("summit:calm-map", "1");
      } catch {}
      if (noTimeline) delete window.ScrollTimeline;
    },
    { calm, noTimeline },
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  return { context, page, errors };
}

/** The route as drawn, its anchors as the layer computes them, and the text it must not cross. */
const survey = () => {
  const layer = document.querySelector("[data-route-layer]");
  const walked = layer?.querySelector("svg > g > path:last-of-type");
  if (!layer || !walked) return null;
  const main = layer.parentElement;
  const box = layer.getBoundingClientRect();
  const phone = innerWidth < 640;
  const gx = (parseFloat(getComputedStyle(main).paddingLeft) || 16) / 2;
  const hidden = [];
  const anchors = [...main.querySelectorAll("[data-route]")]
    .filter((el) => el.getClientRects().length)
    .map((el) => {
      const r = el.getBoundingClientRect();
      const [top, bottom, left, right] = [r.top - box.top, r.bottom - box.top, r.left - box.left, r.right - box.left];
      const anchor = phone ? "gutter" : (el.dataset.routeAnchor ?? "gutter");
      if (anchor === "center") hidden.push([left, top, right, bottom]);
      if (anchor === "ridge") hidden.push([left, top, right, bottom + 2]);
      const at = anchor === "center" ? [(left + right) / 2, top] : anchor === "ridge" ? [right, bottom] : [gx, top + Math.min(16, r.height / 2)];
      return { id: el.dataset.route, at, blaze: el.hasAttribute("data-route-blaze") };
    });
  const total = walked.getTotalLength();
  const points = [];
  for (let l = 0; l < total + 3; l += 3) {
    const p = walked.getPointAtLength(Math.min(l, total));
    points.push([p.x, p.y]);
  }
  const text = [...main.querySelectorAll("p, h1, h2, h3, h4, dt, dd, td, th, a, button, figcaption, blockquote")]
    .filter((el) => el.getClientRects().length && !el.closest("[data-route-layer]") && el.textContent.trim())
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { tag: `${el.tagName.toLowerCase()} “${el.textContent.trim().slice(0, 24)}”`, rect: [r.left - box.left + 1, r.top - box.top + 1, r.right - box.left - 1, r.bottom - box.top - 1] };
    });
  const inside = ([x, y], [l, t, r, b]) => x > l && x < r && y > t && y < b;
  const crossings = [];
  for (const p of points) {
    if (hidden.some((h) => inside(p, h))) continue;
    const hit = text.find((t) => inside(p, t.rect));
    if (hit && !crossings.includes(hit.tag)) crossings.push(hit.tag);
  }
  const misses = anchors.filter((a) => !points.some(([x, y]) => Math.hypot(x - a.at[0], y - a.at[1]) <= 2)).map((a) => a.id);
  const xs = points.map((p) => p[0]);
  return {
    subpaths: (walked.getAttribute("d").match(/M/g) || []).length,
    stops: anchors.length,
    misses,
    crossings,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    blaze: !!layer.querySelector("path[class*=blaze]"),
    blazeStops: anchors.filter((a) => a.blaze).length,
  };
};

/** The walked line's state: its computed dash offset, its animations' timelines, the marker. */
const walkedState = () => {
  const layer = document.querySelector("[data-route-layer]");
  const walked = layer.querySelector("svg > g > path:last-of-type");
  const marker = layer.querySelector("span");
  const base = layer.querySelector("path[class*=base]");
  return {
    offset: parseFloat(getComputedStyle(walked).strokeDashoffset),
    length: walked.getTotalLength(),
    animations: walked.getAnimations().map((a) => (a.timeline && a.timeline !== document.timeline ? "scroll" : "time")),
    marker: getComputedStyle(marker).display !== "none",
    base: getComputedStyle(base).display !== "none",
    lenis: document.documentElement.classList.contains("lenis"),
  };
};

export async function route({ browser, base, root, check }) {
  console.log("\nroute: geometry, modes, fallback");
  if (!existsSync(join(root, "out/work/seilschaft/index.html"))) return console.log("  skipped: build with SITE_MODE=basecamp");

  for (const [label, viewport, mobile] of [
    ["desktop", { width: 1440, height: 900 }, false],
    ["phone", { width: 390, height: 844 }, true],
  ]) {
    for (const path of ["/", STUDY]) {
      const { context, page, errors } = await newPage(browser, { viewport, mobile });
      await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-route-layer] path", { timeout: 15000 });
      await page.waitForTimeout(600);
      const g = await page.evaluate(survey);
      const name = `${label} ${path}`;
      check(`${name}: one path through ${g?.stops} waypoints`, g && g.subpaths === 1 && g.stops >= 4 && g.misses.length === 0, JSON.stringify(g?.misses));
      check(`${name}: never across a line of text`, g && g.crossings.length === 0, g?.crossings.slice(0, 4).join(" | "));
      if (mobile) check(`${name}: the trail keeps to the 16 px margin`, g && g.minX >= 0 && g.maxX <= 16, `${g?.minX}–${g?.maxX}`);
      if (path === STUDY) check(`${name}: a blaze above the last station`, g && g.blaze && g.blazeStops >= 2, JSON.stringify({ blaze: g?.blaze, stops: g?.blazeStops }));
      check(`${name}: no page errors`, errors.length === 0, errors.join(" | "));
      await context.close();
    }
  }

  // Full: a scroll timeline; a wheel scroll (Lenis smooths it) moves the walked line on.
  {
    const { context, page } = await newPage(browser);
    await page.goto(`${base}${STUDY}`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-route-layer] path");
    await page.waitForTimeout(800);
    const before = await page.evaluate(walkedState);
    await page.mouse.move(700, 500);
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(1200);
    const after = await page.evaluate(walkedState);
    check("full: the walked line rides a scroll timeline, the marker on it", before.animations.includes("scroll") && before.marker && before.base, JSON.stringify(before));
    check("full: a wheel scroll through Lenis walks it on", after.lenis && after.offset < before.offset - 100, JSON.stringify({ before: before.offset, after: after.offset, lenis: after.lenis }));
    await context.close();
  }

  // Full without scroll timelines: the fallback paints the same from the scroll.
  {
    const { context, page } = await newPage(browser, { noTimeline: true });
    await page.goto(`${base}${STUDY}`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-route-layer] path");
    await page.waitForTimeout(800);
    const before = await page.evaluate(walkedState);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: "instant" }));
    await page.waitForTimeout(500);
    const after = await page.evaluate(walkedState);
    check("fallback: no scroll timeline, the walked line follows the scroll", !after.animations.includes("scroll") && after.offset < before.offset - 100, JSON.stringify({ before, after }));
    await context.close();
  }

  // Calm: from waypoint to waypoint.
  {
    const { context, page } = await newPage(browser, { calm: true });
    await page.goto(`${base}${STUDY}`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-route-layer] path");
    const stepped = [];
    for (const f of [0.2, 0.37, 0.55]) {
      await page.evaluate((f) => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * f, behavior: "instant" }), f);
      await page.waitForTimeout(700);
      stepped.push(
        await page.evaluate(() => {
          const s = (() => {
            const layer = document.querySelector("[data-route-layer]");
            const walked = layer.querySelector("svg > g > path:last-of-type");
            return { offset: parseFloat(getComputedStyle(walked).strokeDashoffset), length: walked.getTotalLength(), scroll: walked.getAnimations().some((a) => a.timeline !== document.timeline) };
          })();
          // The walked length is a waypoint's: one of the lengths where the path meets an anchor.
          return s;
        }),
      );
    }
    const lengths = await page.evaluate(() => {
      const layer = document.querySelector("[data-route-layer]");
      const walked = layer.querySelector("svg > g > path:last-of-type");
      const box = layer.getBoundingClientRect();
      const gx = (parseFloat(getComputedStyle(layer.parentElement).paddingLeft) || 16) / 2;
      const total = walked.getTotalLength();
      return [...layer.parentElement.querySelectorAll("[data-route]")].map((el) => {
        const r = el.getBoundingClientRect();
        const y = r.top - box.top + Math.min(16, r.height / 2);
        let best = 0;
        let d = Infinity;
        for (let l = 0; l <= total; l += 1) {
          const p = walked.getPointAtLength(l);
          const e = Math.hypot(p.x - gx, p.y - y);
          if (e < d) [d, best] = [e, l];
        }
        return best;
      });
    });
    const atStop = stepped.every((s) => !s.scroll && lengths.some((l) => Math.abs(s.length - s.offset - l) < 3));
    check("calm: the walked line stops at waypoints, never between", atStop, JSON.stringify({ walked: stepped.map((s) => Math.round(s.length - s.offset)), lengths: lengths.map(Math.round) }));
    await context.close();
  }

  // Still: drawn solid, nothing rides it.
  {
    const { context, page } = await newPage(browser, { reduced: true });
    await page.goto(`${base}${STUDY}`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-route-layer] path");
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: "instant" }));
    await page.waitForTimeout(500);
    const s = await page.evaluate(walkedState);
    check("still: the whole route solid, no marker, no dashed base, nothing animated", s.offset === 0 && !s.marker && !s.base && s.animations.length === 0, JSON.stringify(s));
    await context.close();
  }
}
