// The About morph: the HUD's About label grows into the About H1 and shrinks back. In full
// and calm every navigation to and from /about/ runs a View Transition with the shared group
// (none aborted: a duplicate name would abort the capture), the H1 settles once it has landed, and
// at rest at most one rendered element holds the name. In still no View Transition runs at all.
// Which terrain /about/ shows is not asserted here. Run with: npm run test:e2e -- about
import { existsSync } from "node:fs";
import { join } from "node:path";

const NAME = "about-title";

// Records every transition that reaches the browser: how it ended and which groups it drew.
const recordTransitions = () => {
  window.__bc = [];
  const start = Document.prototype.startViewTransition;
  if (!start) return;
  Document.prototype.startViewTransition = function (arg) {
    const transition = start.call(this, arg);
    const rec = { ready: "pending", groups: [] };
    window.__bc.push(rec);
    transition.ready.then(
      () => {
        rec.ready = "ran";
        rec.groups = [
          ...new Set(
            document
              .getAnimations()
              .map((a) => a.effect?.pseudoElement)
              .filter((p) => p?.startsWith("::view-transition-group("))
              .map((p) => p.slice("::view-transition-group(".length, -1)),
          ),
        ];
      },
      (e) => (rec.ready = `${e?.name ?? "error"}: ${e?.message ?? e}`),
    );
    return transition;
  };
};

export async function about({ base, basePath, root, check, open, settle }) {
  const study = ["test-project", "seilschaft"].find((s) => existsSync(join(root, "out/work", s, "index.html")));
  for (const mode of ["full", "calm", "still"]) {
    console.log(`\nabout morph: ${mode}`);
    const { context, page, errors } = await open({ calm: mode === "calm", reduced: mode === "still", init: recordTransitions });
    const morphs = mode !== "still";
    const trace = () => page.evaluate(() => ({ list: window.__bc.slice(), native: window.__vt.native }));
    const named = () =>
      page.evaluate((name) => [...document.querySelectorAll("body *")].filter((el) => el.getClientRects().length && getComputedStyle(el).viewTransitionName === name).map((el) => el.tagName.toLowerCase()), NAME);
    const hud = () => page.locator(`header a[href="${basePath}/about/"]`).first();

    // One navigation: where it lands, and the transition it ran (or that none ran, in still).
    const step = async (label, go, path) => {
      const before = (await trace()).list.length;
      await go();
      let r = await settle(page, { path });
      // A transition can still be in its update when the page looks settled: wait for it to start
      // or fail, then settle again.
      if (morphs) {
        await page.waitForFunction((n) => window.__bc.length > n && window.__bc[window.__bc.length - 1].ready !== "pending", before, { timeout: 10000 }).catch(() => {});
        r = await settle(page, { path });
      }
      const t = await trace();
      const fresh = t.list.slice(before);
      check(`${label}: lands on ${path}`, r.path === `${basePath}${path}` && r.hidden.length === 0, `${r.path} hidden=${r.hidden.join(",")}`);
      if (morphs) {
        const last = fresh[fresh.length - 1];
        check(`${label}: View Transition ran with the shared ${NAME} group`, !!last && last.ready === "ran" && last.groups.includes(NAME), JSON.stringify(fresh));
        check(`${label}: no transition aborted`, fresh.every((f) => f.ready === "ran"), JSON.stringify(fresh));
      } else {
        check(`${label}: no View Transition`, t.native === 0 && fresh.length === 0, `native=${t.native}`);
      }
      const holders = await named();
      check(`${label}: at most one element holds the name at rest`, holders.length <= 1, holders.join(","));
      return r;
    };

    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    const there = await step("HUD About → About", () => hud().click(), "/about/");
    check("the H1 reads About", there.h1 === "About", there.h1);
    if (morphs) {
      const arrived = await page.evaluate(() => document.querySelector("main h1")?.getAttribute("data-arrive"));
      check("the H1 settled after the morph landed", arrived === "done", `data-arrive=${arrived}`);
    }
    const current = await hud().getAttribute("aria-current");
    check("the HUD link shows the current page", current === "page", current);
    await step("browser back → home", () => page.goBack(), "/");
    await step("HUD About again (page re-shown)", () => hud().click(), "/about/");
    await step("HUD mark → home", () => page.locator(`header a[href="${basePath}/"]`).first().click(), "/");
    if (study) {
      await page.goto(`${base}/work/${study}/`, { waitUntil: "networkidle" });
      await step("case study → About", () => hud().click(), "/about/");
      await step("browser back → case study", () => page.goBack(), `/work/${study}/`);
    }
    const duplicate = errors.filter((e) => /duplicate|view-transition-name|InvalidStateError/i.test(e));
    check("no View Transition errors", duplicate.length === 0, duplicate.join("; "));
    check("no page errors", errors.length === 0, errors.join("; "));
    await context.close();
  }
}
