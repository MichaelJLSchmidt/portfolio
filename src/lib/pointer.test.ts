// Nothing follows the cursor: no pointermove (or mousemove) listener anywhere in the site but the
// Summit Card's tilt and foil (TiltDriver) and the lightbox's drag and pinch, which listens only
// while a pointer is held down. `npm test`.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = new URL("..", import.meta.url).pathname;
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|mjs|js)$/.test(p) && !p.endsWith(".test.ts") ? [p] : [];
  });

const ALLOWED = new Set(["components/card/TiltDriver.tsx", "components/case-study/behaviours/lightbox.ts"]);

describe("no pointer following", () => {
  it("pointermove only in the card tilt and the lightbox drag", () => {
    const found = files(root)
      .map((f) => ({ rel: f.slice(root.length), text: readFileSync(f, "utf8") }))
      .filter(({ text }) => /["'](pointermove|mousemove|pointerrawupdate)["']|on(Pointer|Mouse)Move\b/.test(text))
      .map(({ rel }) => rel)
      .filter((rel) => !ALLOWED.has(rel));
    assert.deepEqual(found, []);
  });

  it("the lightbox adds its pointermove listener only on pointerdown", () => {
    const text = readFileSync(join(root, "components/case-study/behaviours/lightbox.ts"), "utf8");
    const adds = [...text.matchAll(/addEventListener\("pointermove"/g)].length;
    assert.equal(adds, 1);
    assert.match(text, /const onDown = [^]*?addEventListener\("pointermove", onMove\)[^]*?\n  \};/);
  });
});
