// Case studies and the Next case study loop: the map-sheet cards in their order, their link names,
// and "Next case study" from each case study to the next, around the loop, never to another kind
// of page. Needs a build with the flagged examples (SITE_MODE=basecamp or a preview).
// Run with: npm run test:e2e -- deck
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ORDER = ["seilschaft", "test-project", "gratweg"];

export async function deck({ base, basePath, root, check, open, settle }) {
  console.log("\ndeck: order, link names and the Next case study loop");
  if (!ORDER.every((slug) => existsSync(join(root, "out/work", slug, "index.html")))) {
    console.log("  skipped: the example case studies are not in this build (build with SITE_MODE=basecamp)");
    return;
  }
  const { context, page, errors } = await open();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const slugs = await page.$$eval("#case-studies article[data-slug]", (els) => els.map((e) => e.dataset.slug));
  check("deck order: Seilschaft (Eiger), Test Project (Mönch), Gratweg (Jungfrau), the panorama from Interlaken", JSON.stringify(slugs) === JSON.stringify(ORDER), slugs.join(", "));
  const cards = await page.$$eval("#case-studies article[data-slug]", (els) =>
    els.map((e) => ({ name: e.querySelector("a")?.getAttribute("aria-label") ?? "", links: e.querySelectorAll("a").length, label: e.querySelector("a > span")?.textContent.trim() })),
  );
  check(
    "each card is one link named “<name> (Fictional example): <sector · role · team size>”",
    cards.length === ORDER.length && cards.every((c) => c.links === 1 && /^[^:]+ \(Fictional example\): .+ · .+/.test(c.name)),
    cards.map((c) => c.name).join(" | "),
  );
  check(
    "label rows count the case studies (CASE STUDY 01 … 03)",
    cards.every((c, i) => c.label?.startsWith(`Case study ${String(i + 1).padStart(2, "0")}`)),
    cards.map((c) => c.label).join(" | "),
  );
  // Every case study's Next link, as built: the loop, and never anything but a case study.
  const studies = readdirSync(join(root, "out/work")).filter((d) => existsSync(join(root, "out/work", d, "index.html")));
  for (const slug of studies) {
    const html = readFileSync(join(root, "out/work", slug, "index.html"), "utf8");
    const next = html.match(/<nav[^>]*aria-label="Next case study"[^>]*>[\s\S]*?href="([^"]+)"/)?.[1] ?? null;
    const i = ORDER.indexOf(slug);
    if (i > -1) check(`${slug}: Next case study → ${ORDER[(i + 1) % ORDER.length]}`, next === `${basePath}/work/${ORDER[(i + 1) % ORDER.length]}/`, next);
    check(`${slug}: Next case study never leads to /about/`, !next?.includes("/about/"), next);
  }

  // Walk the loop once by clicking each Next link.
  await page.goto(`${base}/work/${ORDER[0]}/`, { waitUntil: "networkidle" });
  for (let step = 1; step <= ORDER.length; step++) {
    const want = ORDER[step % ORDER.length];
    const link = page.locator('nav[aria-label="Next case study"] article a');
    await link.scrollIntoViewIfNeeded();
    await link.click();
    const r = await settle(page, { path: `/work/${want}/` });
    check(`loop step ${step}: arrives at ${want}`, r.path === `${basePath}/work/${want}/` && r.hidden.length === 0, `${r.path} hidden=${r.hidden.join(",")}`);
  }
  check("no page errors", errors.length === 0, errors.join("; "));
  await context.close();
}
