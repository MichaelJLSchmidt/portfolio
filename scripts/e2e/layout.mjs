// Information architecture and layout.
//
//   ia     the home page's sections in order (the name, Case studies, Earlier projects, then the
//          footer's Get in touch) with #case-studies holding the cards and #contact the footer;
//          the header left to right (brand · Case studies · About · Contact) and where each leads;
//          the footer's Motion control; About's sections in order; the 404 page; the titles of
//          About and the case studies inside their column at phone to desktop widths
//   phone  every route at 320, 360 and 390 px: no sideways scrolling, the header keeps the brand,
//          Case studies, About and Contact inline, inside the screen, without overlaps or a menu
//
// Run with: npm run test:e2e -- ia   or   npm run test:e2e -- phone
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const HOME_SECTIONS = ["hero-name", "case-studies-heading", "earlier-heading", "contact-heading"];
const ABOUT_SECTIONS = [
  "about-heading",
  "who-heading",
  "career-heading",
  "lead-heading",
  "people-heading",
  "start-heading",
  "skills-heading",
  "craft-heading",
  "cards-heading",
  "contact-heading",
];

/** An element's accessible-ish name: its aria-label, its label's text, or its text. */
const NAME = (el) => (el.getAttribute("aria-label") ?? el.querySelector(".visually-hidden")?.textContent ?? el.textContent).trim().replace(/\s+/g, " ");

/** Every page of the build worth loading directly. */
export function routes(root) {
  const work = existsSync(join(root, "out/work")) ? readdirSync(join(root, "out/work")).filter((d) => existsSync(join(root, "out/work", d, "index.html"))) : [];
  return ["/", "/about/", ...work.map((s) => `/work/${s}/`), "/no-such-page/"];
}

const inOrder = (ids) => {
  const els = ids.map((id) => document.getElementById(id));
  return {
    missing: ids.filter((id, i) => !els[i]),
    ordered: els.every((el, i) => el && (i === 0 || els[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)),
  };
};

export async function ia({ base, basePath, root, check, open }) {
  console.log("\nia: page structure and navigation");
  const { context, page, errors } = await open();

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const home = await page.evaluate(
    ({ ids, inOrderSrc }) => ({
      ...new Function(`return ${inOrderSrc}`)()(ids),
      cards: document.querySelectorAll("section#case-studies #case-studies-heading ~ ol > li a").length,
      contact: !!document.querySelector("footer#contact #contact-heading"),
      quotes: document.querySelectorAll("main blockquote").length,
    }),
    { ids: HOME_SECTIONS, inOrderSrc: inOrder.toString() },
  );
  check("home: sections in order (name, Case studies, Earlier projects, Get in touch)", home.missing.length === 0 && home.ordered, JSON.stringify(home.missing));
  check("home: #case-studies holds the cards, #contact is the footer's Get in touch", home.cards > 0 && home.contact, `${home.cards} cards`);
  check("home: no quotes or testimonials", home.quotes === 0, `${home.quotes} quotes`);

  // The header, left to right.
  const header = await page.evaluate((nameSrc) => {
    const name = new Function(`return ${nameSrc}`)();
    const header = document.querySelector("body > header, header:has(nav)");
    return [...header.querySelectorAll("a")]
      .filter((el) => el.getClientRects().length)
      .map((el) => ({ text: name(el), href: el.getAttribute("href"), x: el.getBoundingClientRect().left }))
      .sort((a, b) => a.x - b.x)
      .map((i) => `${i.text} (${i.href})`);
  }, NAME.toString());
  const order = [
    new RegExp(`, home \\(${basePath}/\\)$`),
    new RegExp(`^Case studies \\(${basePath}/#case-studies\\)$`),
    new RegExp(`^About \\(${basePath}/about/\\)$`),
    /^Contact \(#contact\)$/,
  ];
  check("header, left to right: brand (home) · Case studies · About · Contact", header.length === order.length && order.every((re, i) => re.test(header[i])), header.join(" · "));

  // The Motion control: one radio group in the footer, Full · Calm · Off.
  const motion = await page.evaluate(() => {
    const group = document.querySelector("footer fieldset");
    return {
      legend: group?.querySelector("legend")?.textContent.trim(),
      options: [...(group?.querySelectorAll("input[type=radio]") ?? [])].map((r) => r.closest("label")?.textContent.trim()),
      checked: group?.querySelector("input:checked")?.closest("label")?.textContent.trim(),
    };
  });
  check("footer: the Motion control (Full · Calm · Off), Full chosen", motion.legend === "Motion" && motion.options.join(" · ") === "Full · Calm · Off" && motion.checked === "Full", JSON.stringify(motion));

  await page.goto(`${base}/about/`, { waitUntil: "networkidle" });
  const about = await page.evaluate(
    ({ ids, inOrderSrc }) => ({
      ...new Function(`return ${inOrderSrc}`)()(ids),
      current: document.querySelector('header a[aria-current="page"]')?.textContent.trim(),
      quotes: document.querySelectorAll("main blockquote").length,
    }),
    { ids: ABOUT_SECTIONS, inOrderSrc: inOrder.toString() },
  );
  check(
    "About: sections in order (About, Who I am, Career, How I lead, people, a new team, skills, craft, cards, Get in touch)",
    about.missing.length === 0 && about.ordered,
    JSON.stringify(about.missing),
  );
  check("About: the header marks About as the current page", about.current === "About", about.current ?? "none");
  check("About: no quotes or testimonials", about.quotes === 0, `${about.quotes} quotes`);

  await page.goto(`${base}/no-such-page/`, { waitUntil: "networkidle" });
  const notFound = await page.evaluate(() => ({
    title: document.title,
    // The title's own words, without the aria-hidden copies that reserve their width.
    h1: (() => {
      const h = document.querySelector("main h1");
      const words = [];
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) if (!n.parentElement.closest("[aria-hidden=true]") && n.textContent.trim()) words.push(n.textContent.trim());
      return words.join(" ");
    })(),
    back: [...document.querySelectorAll("main a")].map((a) => ({ text: a.textContent.trim(), href: a.getAttribute("href") })).find((a) => /case studies/i.test(a.text)),
  }));
  check(
    "404: “Off the map” with “Back to case studies”",
    notFound.h1 === "Off the map" && /Back to case studies/.test(notFound.back?.text ?? "") && notFound.back?.href === `${basePath}/#case-studies` && /^Off the map/.test(notFound.title),
    JSON.stringify(notFound),
  );
  check("no page errors", errors.length === 0, errors.join("; "));
  await context.close();

  // A title wraps between words and never runs out of its column or past the screen. Checked at
  // rest (still).
  const still = await open({ reduced: true });
  for (const width of [320, 390, 900, 1280, 1440]) {
    await still.page.setViewportSize({ width, height: 900 });
    for (const route of routes(root).filter((r) => r !== "/no-such-page/")) {
      await still.page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      const r = await still.page.evaluate(() => {
        const h = document.querySelector("main h1");
        const vw = document.documentElement.clientWidth;
        const rights = [];
        const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (node.parentElement.closest(".visually-hidden, [aria-hidden=true]") || !node.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          rights.push(...[...range.getClientRects()].filter((r) => r.width > 2 && r.height > 2).map((r) => r.right));
        }
        return { right: Math.round(Math.max(...rights)), box: Math.round(h.getBoundingClientRect().right), vw, scroll: document.documentElement.scrollWidth };
      });
      check(`${route} at ${width} px: the title fits its column and the screen`, r.right <= r.box + 1 && r.right <= r.vw && r.scroll <= r.vw, JSON.stringify(r));
    }
  }
  check("no page errors (titles)", still.errors.length === 0, still.errors.join("; "));
  await still.context.close();
}

export async function phone({ browser, base, root, check }) {
  for (const width of [320, 360, 390]) {
    console.log(`\nphone: ${width} px wide`);
    for (const route of routes(root)) {
      const context = await browser.newContext({ viewport: { width, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate((nameSrc) => {
        const name = new Function(`return ${nameSrc}`)();
        const vw = document.documentElement.clientWidth;
        const header = document.querySelector("header:has(nav)");
        const shown = [...header.querySelectorAll("a")].filter((el) => el.getClientRects().length);
        const boxes = shown.map((el) => el.getBoundingClientRect());
        const overlaps = boxes.some((a, i) => boxes.some((b, j) => j > i && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1));
        const meta = [...document.querySelectorAll("footer *")].filter((el) => el.children.length === 0 && el.getClientRects().length);
        return {
          scroll: document.documentElement.scrollWidth,
          vw,
          inside: boxes.every((b) => b.left >= 0 && b.right <= vw + 0.5),
          footerInside: meta.every((el) => el.getBoundingClientRect().right <= vw + 0.5),
          overlaps,
          oneRow: Math.max(...boxes.map((b) => b.bottom)) - Math.min(...boxes.map((b) => b.top)) < 56,
          targets: boxes.every((b) => b.height >= 44),
          header: shown.map((el) => name(el)),
          menu: !!header.querySelector("[aria-expanded], [aria-haspopup]"),
        };
      }, NAME.toString());
      check(`${route}: no sideways scrolling, the footer inside the screen`, r.scroll <= r.vw && r.footerInside, `${r.scroll}px for ${r.vw}px`);
      check(
        `${route}: the header keeps brand, Case studies, About and Contact inline (44 px targets), inside the screen, no overlaps, no menu`,
        r.inside && !r.overlaps && r.oneRow && r.targets && !r.menu && r.header.some((t) => /, home$/.test(t)) && ["Case studies", "About", "Contact"].every((t) => r.header.includes(t)),
        r.header.join(" · "),
      );
      await context.close();
    }
  }
}
