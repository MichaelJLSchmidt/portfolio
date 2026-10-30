// Selected work and the Next project loop: the cards in their order, their link names, and "Next
// project" from each case study to the next, around the loop, never to another kind of page. Needs a build with the flagged examples
// (SITE_MODE=basecamp or a preview). Run with: npm run test:e2e -- deck
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ORDER = ["seilschaft", "gratweg", "test-project"];

export async function deck({ base, basePath, root, check, open, settle }) {
  console.log("\ndeck: order, link names and the Next project loop");
  if (!ORDER.every((slug) => existsSync(join(root, "out/work", slug, "index.html")))) {
    console.log("  skipped: the example case studies are not in this build (build with SITE_MODE=basecamp)");
    return;
  }
  const { context, page, errors } = await open();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const slugs = await page.$$eval("#work article[data-slug]", (els) => els.map((e) => e.dataset.slug));
  check("deck order: Seilschaft, Gratweg, Test Project", JSON.stringify(slugs) === JSON.stringify(ORDER), slugs.join(", "));
  const names = await page.$$eval("#work article[data-slug] a", (as) => as.map((a) => a.getAttribute("aria-label")));
  check(
    "card links named “Open case study: <name>, <type>, rarity <letter>”",
    names.length === ORDER.length && names.every((n) => /^Open case study: [^,]+, .+, rarity [CURM]$/.test(n ?? "")),
    names.join(" | "),
  );
  // Every case study's Next link, as built: the loop, and never anything but a case study.
  const studies = readdirSync(join(root, "out/work")).filter((d) => existsSync(join(root, "out/work", d, "index.html")));
  for (const slug of studies) {
    const html = readFileSync(join(root, "out/work", slug, "index.html"), "utf8");
    const next = html.match(/<nav[^>]*aria-label="Next project"[^>]*>[\s\S]*?href="([^"]+)"/)?.[1] ?? null;
    const i = ORDER.indexOf(slug);
    if (i > -1) check(`${slug}: Next project → ${ORDER[(i + 1) % ORDER.length]}`, next === `${basePath}/work/${ORDER[(i + 1) % ORDER.length]}/`, next);
    check(`${slug}: Next project never leads to /about/`, !next?.includes("/about/"), next);
  }

  // Walk the loop once by clicking each Next link.
  await page.goto(`${base}/work/${ORDER[0]}/`, { waitUntil: "networkidle" });
  for (let step = 1; step <= ORDER.length; step++) {
    const want = ORDER[step % ORDER.length];
    const link = page.locator('a[aria-describedby="next-project-label"]');
    await link.scrollIntoViewIfNeeded();
    await link.click();
    const r = await settle(page, { path: `/work/${want}/` });
    check(`loop step ${step}: arrives at ${want}`, r.path === `${basePath}/work/${want}/` && r.hidden.length === 0, `${r.path} hidden=${r.hidden.join(",")}`);
  }
  check("no page errors", errors.length === 0, errors.join("; "));
  await context.close();
}
