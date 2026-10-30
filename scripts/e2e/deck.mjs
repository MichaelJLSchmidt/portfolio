// The deck and the expeditions loop: the cards in their order, their link names and index lines,
// and "Next expedition" from each case study to the next, Seilschaft → Gratweg → Test Project →
// Seilschaft, never to another kind of page. Needs a build with the flagged examples
// (SITE_MODE=basecamp or a preview). Run with: npm run test:e2e -- deck
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ORDER = ["seilschaft", "gratweg", "test-project"];

export async function deck({ base, basePath, root, check, open, settle }) {
  console.log("\ndeck: order, link names and the Next expedition loop");
  if (!ORDER.every((slug) => existsSync(join(root, "out/work", slug, "index.html")))) {
    console.log("  skipped: the example case studies are not in this build (build with SITE_MODE=basecamp)");
    return;
  }
  const { context, page, errors } = await open();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const slugs = await page.$$eval("#expeditions article[data-slug]", (els) => els.map((e) => e.dataset.slug));
  check("deck order: Seilschaft, Gratweg, Test Project", JSON.stringify(slugs) === JSON.stringify(ORDER), slugs.join(", "));
  const names = await page.$$eval("#expeditions article[data-slug] a", (as) => as.map((a) => a.getAttribute("aria-label")));
  check(
    "card links named “Open expedition: <name>, <type>, rarity <letter>”",
    names.length === ORDER.length && names.every((n) => /^Open expedition: [^,]+, .+, rarity [CURM]$/.test(n ?? "")),
    names.join(" | "),
  );
  // The Index view: one row per card, its name and its index line.
  await page.locator("#expeditions").getByRole("button", { name: "Index", exact: true }).click();
  await page.waitForSelector("[data-index-slug]");
  const index = await page.$$eval("#expeditions ol[aria-label] li a", (as) =>
    as.map((a) => `${a.querySelector(".visually-hidden")?.textContent}${a.lastElementChild?.textContent ?? ""}`.trim()),
  );
  check("one index line per card, in deck order", index.length === ORDER.length && index[0].startsWith("Seilschaft — People ·"), index.join(" | "));
  await page.locator("#expeditions").getByRole("button", { name: "Cards", exact: true }).click();

  // Every case study's Next link, as built: the loop, and never anything but a case study.
  const studies = readdirSync(join(root, "out/work")).filter((d) => existsSync(join(root, "out/work", d, "index.html")));
  for (const slug of studies) {
    const html = readFileSync(join(root, "out/work", slug, "index.html"), "utf8");
    const next = html.match(/<nav[^>]*aria-label="Next expedition"[^>]*>[\s\S]*?href="([^"]+)"/)?.[1] ?? null;
    const i = ORDER.indexOf(slug);
    if (i > -1) check(`${slug}: Next expedition → ${ORDER[(i + 1) % ORDER.length]}`, next === `${basePath}/work/${ORDER[(i + 1) % ORDER.length]}/`, next);
    check(`${slug}: Next expedition never leads to /about/`, !next?.includes("/about/"), next);
  }

  // Walk the loop once by clicking each Next link.
  await page.goto(`${base}/work/${ORDER[0]}/`, { waitUntil: "networkidle" });
  for (let step = 1; step <= ORDER.length; step++) {
    const want = ORDER[step % ORDER.length];
    const link = page.locator('nav[aria-label="Next expedition"] a[data-variant="display"]');
    await link.scrollIntoViewIfNeeded();
    await link.click();
    const r = await settle(page, { path: `/work/${want}/` });
    check(`loop step ${step}: arrives at ${want}`, r.path === `${basePath}/work/${want}/` && r.hidden.length === 0, `${r.path} hidden=${r.hidden.join(",")}`);
  }
  check("no page errors", errors.length === 0, errors.join("; "));
  await context.close();
}
