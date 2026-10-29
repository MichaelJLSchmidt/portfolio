// Information architecture and layout.
//
//   ia     the home page's sections in order (hero, Summit log, Trail rules, Expeditions, Field
//          notes, Workshops, Contact) with #expeditions and #contact; the HUD's items left to right
//          and where Contact leads; Basecamp's sections and its five camps; the 404 page; example
//          content (the "Example quote" tags and the Summit log's small print) only where the build
//          has examples; the display titles of Basecamp and the case studies inside their column at
//          phone to desktop widths
//   phone  every route at 360 and 390 px: no sideways scrolling, the HUD keeps the mark, Basecamp
//          and the Calm map switch inside the screen without overlaps, and the footer carries the rest
//
// Run with: npm run test:e2e -- ia   or   npm run test:e2e -- phone
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const HOME_SECTIONS = ["hero-name", "summit-log-heading", "trail-rules-heading", "deck-heading", "field-notes-heading", "workshops-heading", "contact-heading"];
const BASECAMP_SECTIONS = ["legend-heading", "rope-rules-heading", "first-days-heading", "ascent-heading", "craft-heading", "off-map-heading", "contact-heading"];

/** Every page of the build worth loading directly. */
export function routes(root) {
  const work = existsSync(join(root, "out/work")) ? readdirSync(join(root, "out/work")).filter((d) => existsSync(join(root, "out/work", d, "index.html"))) : [];
  return ["/", "/about/", ...work.map((s) => `/work/${s}/`), "/no-such-page/"];
}

export async function ia({ base, basePath, root, check, open }) {
  const examples = existsSync(join(root, "out/work/test-project/index.html"));
  console.log("\nia: page structure and navigation");
  const { context, page, errors } = await open();

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const home = await page.evaluate((ids) => {
    const els = ids.map((id) => document.getElementById(id));
    const ordered = els.every((el, i) => el && (i === 0 || els[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
    return {
      missing: ids.filter((id, i) => !els[i]),
      ordered,
      expeditions: document.querySelector("section#expeditions")?.querySelector("#deck-heading") !== null,
      contact: !!document.querySelector("section#contact #contact-heading"),
      tags: [...document.querySelectorAll("main li figure")].filter((f) => /example quote/i.test(f.textContent)).length,
      notes: document.querySelectorAll("main li figure blockquote").length,
      smallPrint: /Example figures\./.test(document.querySelector('section[aria-labelledby="summit-log-heading"]')?.textContent ?? ""),
      statement: getComputedStyle(document.querySelector("main p.knockout") ?? document.body).opacity,
    };
  }, HOME_SECTIONS);
  const want = examples ? HOME_SECTIONS : HOME_SECTIONS.filter((id) => id !== "field-notes-heading");
  check("home: sections in order (hero, Summit log, Trail rules, Expeditions, Field notes, Workshops, Contact)", home.missing.filter((id) => want.includes(id)).length === 0 && (examples ? home.ordered : true), JSON.stringify(home.missing));
  check("home: #expeditions holds the deck, #contact the contact band", home.expeditions && home.contact);
  check("home: the statement is visible from first paint", home.statement === "1", home.statement);
  if (examples) {
    check("field notes: each invented quote tagged “Example quote”", home.notes === 3 && home.tags === 3, `${home.tags} tags on ${home.notes} notes`);
    check("Summit log: its small print shows while its figures are examples", home.smallPrint);
  } else {
    check("live build: no field notes (no invented testimonial)", home.notes === 0, `${home.notes} notes`);
  }

  // The HUD, left to right.
  const hud = await page.evaluate(() => {
    const header = document.querySelector("header[data-chrome]");
    // An item's name: its aria-label, or the visually hidden copy settling labels and links keep.
    const name = (el) => (el.getAttribute("aria-label") ?? el.querySelector(".visually-hidden")?.textContent ?? el.textContent).trim().replace(/\s+/g, " ");
    const items = [...header.querySelectorAll("a, [data-placeholder], time, input[role=switch]")]
      .filter((el) => el.getClientRects().length)
      .map((el) => ({ text: name(el.closest("label") ?? el), href: el.getAttribute("href"), x: el.getBoundingClientRect().left }))
      .sort((a, b) => a.x - b.x);
    return items.map((i) => `${i.text}${i.href ? ` (${i.href})` : ""}`);
  });
  const order = [/^Höhenlinie/, /^Expeditions/, /^Basecamp/, /^Contact/, /^CV/, /^\d\d:\d\d|^--:--/, /^Calm map$/i];
  check("HUD, left to right: mark · Expeditions · Basecamp · Contact · CV · Bern time · Calm map", hud.length === order.length && order.every((re, i) => re.test(hud[i])), hud.join(" · "));
  check("HUD: Contact leads to /#contact on home", hud.some((h) => h.startsWith("Contact") && h.includes(`${basePath}/#contact`)), hud.join(" · "));

  await page.goto(`${base}/about/`, { waitUntil: "networkidle" });
  const about = await page.evaluate((ids) => {
    const els = ids.map((id) => document.getElementById(id));
    return {
      missing: ids.filter((id, i) => !els[i]),
      ordered: els.every((el, i) => el && (i === 0 || els[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)),
      legendOnSheet: !!document.getElementById("legend-heading")?.closest(".map-sheet"),
      camps: [...document.querySelectorAll("#ascent-heading ~ * ol > li, section[aria-labelledby='ascent-heading'] ol > li")].map((li) => li.querySelector("[class*='rarity'] span[aria-hidden]")?.textContent),
      summary: /summit summary/i.test(document.querySelector("main").textContent),
      contact: document.querySelector('header[data-chrome] nav a[href$="#contact"]')?.getAttribute("href"),
      line: document.querySelector("#contact p.body-copy")?.textContent,
    };
  }, BASECAMP_SECTIONS);
  check("Basecamp: sections in order (legend, rope rules, first 90 days, career climb, craft, off the map, contact)", about.missing.length === 0 && about.ordered, JSON.stringify(about.missing));
  check("Basecamp: the map legend sits on a map sheet", about.legendOnSheet);
  check("Basecamp: five camps, rarity C · C · U · R · M", about.camps.join("") === "CCURM", about.camps.join(","));
  check("Basecamp: no Summit summary", !about.summary);
  check("Basecamp: Contact stays on the page (#contact)", about.contact === "#contact", about.contact);
  check("Basecamp: contact band line", about.line === "Coffee in Bern or a call anywhere.", about.line);

  await page.goto(`${base}/no-such-page/`, { waitUntil: "networkidle" });
  const notFound = await page.evaluate(() => ({
    h1: document.querySelector("main h1 .visually-hidden")?.textContent,
    back: [...document.querySelectorAll("main a")].map((a) => a.textContent.trim()).find((t) => /trailhead/i.test(t)),
  }));
  check("404: “Off the map” with “Back to the trailhead”", notFound.h1 === "Off the map" && !!notFound.back, JSON.stringify(notFound));
  check("no page errors", errors.length === 0, errors.join("; "));
  await context.close();

  // A display title is sized by its longest word: one long word never runs out of its column, or
  // past the screen, where it would be clipped and the lede beside it with it. Checked at rest
  // (still), so no settle is caught half way.
  const still = await open({ reduced: true });
  for (const width of [390, 900, 1000, 1280, 1440]) {
    await still.page.setViewportSize({ width, height: 900 });
    for (const route of routes(root).filter((r) => r === "/about/" || r.startsWith("/work/"))) {
      await still.page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      const r = await still.page.evaluate(() => {
        const h1 = document.querySelector("main h1");
        const vw = document.documentElement.clientWidth;
        const right = Math.max(...[...h1.querySelectorAll("[aria-hidden] span")].map((g) => g.getBoundingClientRect().right));
        const texts = [...h1.closest("header").querySelectorAll("p")].map((p) => Math.round(p.getBoundingClientRect().right));
        return { right: Math.round(right), box: Math.round(h1.getBoundingClientRect().right), vw, texts };
      });
      check(
        `${route} at ${width} px: the title fits its column, the text beside it stays on screen`,
        r.right <= r.box + 1 && r.right <= r.vw && r.texts.every((x) => x <= r.vw),
        JSON.stringify(r),
      );
    }
  }
  check("no page errors (titles)", still.errors.length === 0, still.errors.join("; "));
  await still.context.close();
}

export async function phone({ browser, base, root, check }) {
  for (const width of [360, 390]) {
    console.log(`\nphone: ${width} px wide`);
    for (const route of routes(root)) {
      const context = await browser.newContext({ viewport: { width, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await context.addInitScript(() => {
        try {
          sessionStorage.setItem("summit:intro-played", "1");
        } catch {}
      });
      const page = await context.newPage();
      await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const header = document.querySelector("header[data-chrome]");
        // The bar's three slots; the navigation counts item by item.
        const shown = [...header.firstElementChild.children]
          .flatMap((slot) => [...slot.children])
          .flatMap((el) => (el.tagName === "NAV" ? [...el.querySelectorAll("li")] : [el]))
          .filter((el) => el.getClientRects().length && !el.matches(".visually-hidden"));
        // An item's name: its aria-label, or the visually hidden copy settling labels and links keep.
        const label = (el) => {
          const target = el.matches("a, label") ? el : (el.querySelector("a, label") ?? el);
          return (target.getAttribute("aria-label") ?? target.querySelector(".visually-hidden")?.textContent ?? target.textContent).trim().replace(/\s+/g, " ");
        };
        const boxes = shown.map((el) => el.getBoundingClientRect());
        const overlaps = boxes.some((a, i) => boxes.some((b, j) => j > i && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1));
        const footerNav = document.querySelector("footer nav");
        return {
          scroll: document.documentElement.scrollWidth,
          vw,
          inside: boxes.every((b) => b.left >= 0 && b.right <= vw + 0.5),
          hud: shown.map(label),
          overlaps,
          footer: footerNav && footerNav.getClientRects().length ? footerNav.textContent.replace(/\s+/g, " ").trim() : "",
        };
      });
      check(`${route}: no sideways scrolling`, r.scroll <= r.vw, `${r.scroll}px for ${r.vw}px`);
      check(
        `${route}: HUD keeps mark, Basecamp and Calm map, inside the screen, no overlaps`,
        r.inside && !r.overlaps && /Höhenlinie/.test(r.hud.join(" ")) && r.hud.some((t) => t === "Basecamp") && r.hud.some((t) => /^Calm map$/i.test(t)) && !r.hud.some((t) => /^Expeditions$/.test(t)),
        r.hud.join(" · "),
      );
      check(`${route}: the footer carries Expeditions, Contact, CV and the Bern time`, /Expeditions/.test(r.footer) && /Contact/.test(r.footer) && /CV/.test(r.footer) && /Bern/.test(r.footer), r.footer);
      await context.close();
    }
  }
}
