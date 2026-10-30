// Information architecture and layout.
//
//   ia     the home page's sections in order (the name, How I lead, Selected work, Get in touch)
//          with #work holding the cards and #contact; the HUD left to right (brand · Work · About ·
//          Calm map) and where Work leads; About's sections in order and its camps; the 404 page;
//          the display titles of About and the case studies inside their column at phone to
//          desktop widths
//   phone  every route at 360 and 390 px: no sideways scrolling, the HUD keeps the brand, Work,
//          About and the Calm map switch inline, inside the screen, without overlaps
//
// Run with: npm run test:e2e -- ia   or   npm run test:e2e -- phone
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const HOME_SECTIONS = ["hero-name", "lead-heading", "work-heading", "contact-heading"];
const ABOUT_SECTIONS = ["who-heading", "people-heading", "start-heading", "skills-heading", "ascent-heading", "cards-heading", "craft-heading", "contact-heading"];

/** An element's accessible-ish name: its aria-label, its label's text, or its text. */
const NAME = (el) => (el.getAttribute("aria-label") ?? el.querySelector(".visually-hidden")?.textContent ?? el.textContent).trim().replace(/\s+/g, " ");

/** Every page of the build worth loading directly. */
export function routes(root) {
  const work = existsSync(join(root, "out/work")) ? readdirSync(join(root, "out/work")).filter((d) => existsSync(join(root, "out/work", d, "index.html"))) : [];
  return ["/", "/about/", ...work.map((s) => `/work/${s}/`), "/no-such-page/"];
}

export async function ia({ base, basePath, root, check, open }) {
  console.log("\nia: page structure and navigation");
  const { context, page, errors } = await open();

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const home = await page.evaluate((ids) => {
    const els = ids.map((id) => document.getElementById(id));
    return {
      missing: ids.filter((id, i) => !els[i]),
      ordered: els.every((el, i) => el && (i === 0 || els[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)),
      work: !!document.querySelector("section#work #work-heading"),
      contact: !!document.querySelector("section#contact #contact-heading"),
      quotes: document.querySelectorAll("main blockquote").length,
    };
  }, HOME_SECTIONS);
  check("home: sections in order (name, How I lead, Selected work, Get in touch)", home.missing.length === 0 && home.ordered, JSON.stringify(home.missing));
  check("home: #work holds Selected work, #contact Get in touch", home.work && home.contact);
  check("home: no quotes or testimonials", home.quotes === 0, `${home.quotes} quotes`);

  // The HUD, left to right.
  const hud = await page.evaluate((nameSrc) => {
    const name = new Function(`return ${nameSrc}`)();
    const header = document.querySelector("header[data-chrome]");
    const items = [...header.querySelectorAll("a, input[role=switch]")]
      .filter((el) => el.getClientRects().length)
      .map((el) => ({ text: name(el.closest("label") ?? el), href: el.getAttribute("href"), x: el.getBoundingClientRect().left }))
      .sort((a, b) => a.x - b.x);
    return items.map((i) => `${i.text}${i.href ? ` (${i.href})` : ""}`);
  }, NAME.toString());
  const order = [/, home \(/, /^Work \(/, /^About \(/, /^Calm map$/i];
  check("HUD, left to right: brand (home) · Work · About · Calm map", hud.length === order.length && order.every((re, i) => re.test(hud[i])), hud.join(" · "));
  check("HUD: Work leads to /#work", hud.some((h) => h.startsWith("Work") && h.includes(`${basePath}/#work`)), hud.join(" · "));

  await page.goto(`${base}/about/`, { waitUntil: "networkidle" });
  const about = await page.evaluate((ids) => {
    const els = ids.map((id) => document.getElementById(id));
    return {
      missing: ids.filter((id, i) => !els[i]),
      ordered: els.every((el, i) => el && (i === 0 || els[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)),
      h1: document.querySelector("main h1")?.textContent.trim().replace(/\s+/g, " "),
      quotes: document.querySelectorAll("main blockquote").length,
    };
  }, ABOUT_SECTIONS);
  check("About: sections in order (Who I am, How I work with people, How I start with a new team, Skills beyond design, Career so far, Away from work: cards, Tools and craft, Get in touch)", about.missing.length === 0 && about.ordered, JSON.stringify(about.missing));
  check("About: no quotes or testimonials", about.quotes === 0, `${about.quotes} quotes`);

  await page.goto(`${base}/no-such-page/`, { waitUntil: "networkidle" });
  const notFound = await page.evaluate(() => ({
    title: document.title,
    h1: (document.querySelector("main h1 .visually-hidden") ?? document.querySelector("main h1"))?.textContent.trim(),
    back: [...document.querySelectorAll("main a")].map((a) => a.textContent.trim()).find((t) => /start page/i.test(t)),
  }));
  check("404: “Page not found” with “Back to the start page”", notFound.h1 === "Page not found" && !!notFound.back && /^Page not found/.test(notFound.title), JSON.stringify(notFound));
  check("no page errors", errors.length === 0, errors.join("; "));
  await context.close();

  // A display title is sized by its longest word: one long word never runs out of its column, or
  // past the screen, where it would be clipped and the lede beside it with it. Checked at rest
  // (still).
  const still = await open({ reduced: true });
  for (const width of [390, 900, 1000, 1280, 1440]) {
    await still.page.setViewportSize({ width, height: 900 });
    for (const route of routes(root).filter((r) => r === "/about/" || r.startsWith("/work/"))) {
      await still.page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      const r = await still.page.evaluate(() => {
        const h1 = document.querySelector("main h1");
        const vw = document.documentElement.clientWidth;
        const range = document.createRange();
        range.selectNodeContents(h1);
        const rights = [...range.getClientRects()].filter((r) => r.width > 2 && r.height > 2).map((r) => r.right);
        const texts = [...h1.closest("header").querySelectorAll("p")].map((p) => Math.round(p.getBoundingClientRect().right));
        return { right: Math.round(Math.max(...rights)), box: Math.round(h1.getBoundingClientRect().right), vw, texts };
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
      const page = await context.newPage();
      await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate((nameSrc) => {
        const name = new Function(`return ${nameSrc}`)();
        const vw = document.documentElement.clientWidth;
        const header = document.querySelector("header[data-chrome]");
        const shown = [...header.querySelectorAll("li, label")].filter((el) => el.getClientRects().length && !el.closest(".visually-hidden"));
        const boxes = shown.map((el) => el.getBoundingClientRect());
        const overlaps = boxes.some((a, i) => boxes.some((b, j) => j > i && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1));
        return {
          scroll: document.documentElement.scrollWidth,
          vw,
          inside: boxes.every((b) => b.left >= 0 && b.right <= vw + 0.5),
          overlaps,
          oneRow: new Set(boxes.map((b) => Math.round(b.top + b.height / 2))).size <= 2 && Math.max(...boxes.map((b) => b.bottom)) - Math.min(...boxes.map((b) => b.top)) < 48,
          hud: shown.map((el) => name(el.querySelector("a") ?? el)),
          menu: !!header.querySelector("[aria-expanded], [aria-haspopup]"),
        };
      }, NAME.toString());
      check(`${route}: no sideways scrolling`, r.scroll <= r.vw, `${r.scroll}px for ${r.vw}px`);
      check(
        `${route}: HUD keeps brand, Work, About and Calm map inline, inside the screen, no overlaps, no menu`,
        r.inside && !r.overlaps && r.oneRow && !r.menu && r.hud.some((t) => /, home$/.test(t)) && r.hud.includes("Work") && r.hud.includes("About") && r.hud.some((t) => /^Calm map$/i.test(t)),
        r.hud.join(" · "),
      );
      await context.close();
    }
  }
}
